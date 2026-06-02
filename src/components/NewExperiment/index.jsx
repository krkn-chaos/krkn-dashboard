import "./index.less";

import {
  ActionGroup,
  Alert,
  AlertActionCloseButton,
  Button,
  Card,
  CardBody,
  ExpandableSection,
  Form,
  FormGroup,
  Grid,
  GridItem,
  TextInput,
  Title,
} from "@patternfly/react-core";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

import KubeconfigFileUpload from "@/components/molecules/FileUpload";
import GroupSelect from "@/components/molecules/GroupSelect";
import KubeconfigSelect from "@/components/molecules/KubeconfigSelect";
import { TextButton } from "@/components/atoms/Buttons/Buttons";
import API from "@/utils/axiosInstance";
import { extractReplayBaseStem } from "@/utils/replayNaming";
import { paramsList, globalParamsData } from "./experimentFormData";
import { setActiveGroupId } from "@/actions/authActions";
import { showToast } from "@/actions/toastActions";
import { startKraken, updateScenarioChecked } from "@/actions/newExperiment";

const mergeReplayScenarioFields = (stored, baseBlock) => {
  const next = { ...baseBlock };
  const skip = new Set(["replayOfContainerId", "isFileUpload", "name"]);
  for (const [k, v] of Object.entries(stored)) {
    if (skip.has(k)) continue;
    if (
      Object.prototype.hasOwnProperty.call(next, k) &&
      v !== undefined &&
      v !== null
    ) {
      next[k] = v;
    }
  }
  next.scenarioChecked = stored.scenarioChecked;
  return next;
};

const NewExperiment = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const replayAppliedRef = useRef(false);
  const [replaySourceRunId, setReplaySourceRunId] = useState(null);
  const [replaySourceDisplayName, setReplaySourceDisplayName] = useState("");
  const [isBtnDisabled, setIsBtnDisabled] = useState(true);
  const [kubeconfigSelection, setKubeconfigSelection] = useState("");
  const [clusterRunWarning, setClusterRunWarning] = useState(null);
  const [pendingStartPayload, setPendingStartPayload] = useState(null);
  const scenarioChecked = useSelector(
    (state) => state.experiment.scenarioChecked
  );
  const activeGroupId = useSelector((state) => state.auth.activeGroupId);

  const [data, setData] = useState({
    "pod-scenarios": {
      kubeconfigPath: "",
      namespace: "openshift-*",
      pod_label: "",
      name_pattern: ".*",
      disruption_count: 1,
      kill_timeout: 180,
      wait_timeout: 360,
      expected_pod_count: "",
      scenarioChecked: "pod-scenarios",
      name: "",
    },
    "container-scenarios": {
      kubeconfigPath: "",
      namespace: "openshift-etcd",
      label_selector: "k8s-app=etcd",
      container_name: "etcd",
      disruption_count: 1,
      action: "kill 1",
      expected_recovery_time: 60,
      scenarioChecked: "container-scenarios",
      name: "",
    },
    "node-cpu-hog": {
      kubeconfigPath: "",
      total_chaos_duration: 60,
      node_cpu_core: 2,
      node_cpu_percentage: 50,
      namespace: "default",
      node_selectors: "",
      scenarioChecked: "node-cpu-hog",
      name: "",
    },
    "node-io-hog": {
      kubeconfigPath: "",
      total_chaos_duration: 180,
      io_block_size: "1m",
      io_workers: 5,
      io_write_bytes: "10m",
      namespace: "default",
      node_selectors: "",
      scenarioChecked: "node-io-hog",
      name: "",
    },
    "node-memory-hog": {
      kubeconfigPath: "",
      total_chaos_duration: 60,
      memory_consumption_percentage: "90%",
      number_of_workers: 1,
      namespace: "default",
      node_selectors: "",
      scenarioChecked: "node-memory-hog",
      name: "",
    },
    "node-scenarios": {
      kubeconfigPath: "",
      action: "node_stop_start_scenario",
      cloud_type: "aws",
      label_selector: "node-role.kubernetes.io/worker",
      node_name: "",
      instance_count: 1,
      runs: 1,
      timeout: 180,
      duration: 120,
      name: "",
      scenarioChecked: "node-scenarios",
    },
    "pvc-scenarios": {
      kubeconfigPath: "",
      pvc_name: "",
      pod_name: "",
      namespace: "openshift-*",
      fill_percentage: 50,
      duration: 60,
      block_size: 102400,
      name: "",
      scenarioChecked: "pvc-scenarios",
    },
    "time-scenarios": {
      kubeconfigPath: "",
      object_type: "pod",
      label_selector: "k8s-app=etcd",
      action: "skew_date",
      object_name: "",
      container_name: "",
      namespace: "",
      name: "",
      scenarioChecked: "time-scenarios",
    },
    "kubevirt-outage": {
      kubeconfigPath: "",
      namespace: "default",
      vm_name: "",
      timeout: 60,
      kill_count: 1,
      name: "",
      scenarioChecked: "kubevirt-outage",
    },
  });

  const initGlobalData = () => {
    const defaults = {};
    globalParamsData.forEach((cat) => {
      cat.fields.forEach((field) => {
        defaults[field.key] = field.defaultValue;
      });
    });
    return defaults;
  };

  const [globalData, setGlobalData] = useState(initGlobalData());

  const globalChangeHandler = (_event, value, key) => {
    setGlobalData((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  useEffect(() => {
    if (replayAppliedRef.current) return;
    const replay = location.state?.replay;
    if (!replay?.params || !replay?.sourceContainerId) return;

    const targetGroupId =
      replay.groupId != null ? parseInt(replay.groupId, 10) : null;
    if (targetGroupId && activeGroupId !== targetGroupId) {
      dispatch(setActiveGroupId(targetGroupId));
      setKubeconfigSelection("");
      return;
    }
    if (!activeGroupId) return;

    const stored = replay.params;
    const scenario = stored.scenarioChecked;
    if (!scenario || !paramsList[scenario]) {
      replayAppliedRef.current = true;
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }

    replayAppliedRef.current = true;
    const stem = extractReplayBaseStem(stored.name);
    (async () => {
      try {
        const { data: replayResponse } = await API.post("/past-runs/allocate-replay-name", {
          baseStem: stem,
          groupId: targetGroupId || activeGroupId || undefined,
        });
        const allocatedName = replayResponse?.name;
        if (!allocatedName) throw new Error("No name returned");

        if (stored.globalParams) {
          setGlobalData(stored.globalParams);
        } else {
          setGlobalData(initGlobalData());
        }

        setData((prev) => ({
          ...prev,
          [scenario]: {
            ...mergeReplayScenarioFields(stored, prev[scenario]),
            name: allocatedName,
            scenarioChecked: scenario,
          },
        }));
        dispatch(updateScenarioChecked(scenario));
        setReplaySourceRunId(replay.sourceContainerId);
        setReplaySourceDisplayName(
          replay.sourceDisplayName != null && replay.sourceDisplayName !== ""
            ? replay.sourceDisplayName
            : stem
        );
      } catch (err) {
        replayAppliedRef.current = false;
        dispatch(
          showToast(
            "danger",
            "Could not prepare replay",
            err?.response?.data?.error ||
              err?.message ||
              "Unable to allocate a unique replay name."
          )
        );
      } finally {
        navigate(location.pathname, { replace: true, state: {} });
      }
    })();
  }, [location.state, location.pathname, navigate, dispatch, activeGroupId]);

  useEffect(() => {
    const scenarioData = data[scenarioChecked];
    const scenarioParams = paramsList[scenarioChecked];

    if (!scenarioParams) {
      setIsBtnDisabled(true);
      return;
    }
    const requiredFieldKeys = scenarioParams
      .filter((param) => param.isRequired)
      .map((param) => param.key);

    const allRequiredFilled = requiredFieldKeys.every((key) => {
      const value = scenarioData[key];
      return (
        value !== null && value !== undefined && value.toString().trim() !== ""
      );
    });

    setIsBtnDisabled(!allRequiredFilled || !activeGroupId);
  }, [data, scenarioChecked, activeGroupId]);

  const changeHandler = (_event, value, key) => {
    setData((prevState) => ({
      ...prevState,
      [scenarioChecked]: {
        ...prevState[scenarioChecked],
        [key]: value,
      },
    }));
  };

  const buildStartPayload = () => {
    const base = { ...data[scenarioChecked] };
    let payload = replaySourceRunId
      ? { ...base, replayOfContainerId: replaySourceRunId }
      : base;
    if (kubeconfigSelection && kubeconfigSelection !== "legacy") {
      payload = { ...payload, kubeconfigId: parseInt(kubeconfigSelection, 10) };
    }
    payload.globalParams = globalData;
    return payload;
  };

  const runStartKraken = async (payload) => {
    const ok = await dispatch(startKraken(payload));
    if (ok) {
      setReplaySourceRunId(null);
      setReplaySourceDisplayName("");
      setClusterRunWarning(null);
      setPendingStartPayload(null);
    }
  };

  const sendData = async () => {
    const payload = buildStartPayload();
    try {
      const { data } = await API.post("/check-cluster-runs", { params: payload });
      if ((data?.runningCount ?? 0) > 0) {
        setClusterRunWarning({
          runningCount: data.runningCount,
          clusterKey: data.clusterKey,
        });
        setPendingStartPayload(payload);
        return;
      }
    } catch (e) {
      dispatch(
        showToast(
          "danger",
          "Could not verify cluster status",
          e?.response?.data?.error || e?.message
        )
      );
      return;
    }
    await runStartKraken(payload);
  };

  const confirmClusterRun = async () => {
    if (pendingStartPayload) {
      await runStartKraken(pendingStartPayload);
    }
  };

  return (
    <Card className="start-kraken-modal margin-top">
      <CardBody>
        <Title headingLevel="h3" className="title-text">
          Supported Parameters
        </Title>
        <Form>
          {/* <div>
            <Switch
              id="cerberus-switch"
              label="Cerberus Enabled"
              labelOff="Cerberus Disabled"
            />
          </div>*/}

          <Grid hasGutter>
            {replaySourceRunId ? (
              <GridItem span={12}>
                <Alert
                  isInline
                  variant="info"
                  title="Replayed from"
                  actionClose={
                    <AlertActionCloseButton
                      onClose={() => {
                        setReplaySourceRunId(null);
                        setReplaySourceDisplayName("");
                      }}
                    />
                  }
                >
                  <div className="new-experiment__replay-alert-desc">
                    <div className="new-experiment__replay-alert-run-line">
                      <Button
                        variant="link"
                        isInline
                        className="new-experiment__replay-alert-run-link pf-v5-u-pl-0"
                        component="a"
                        href="/past-runs"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate("/past-runs", {
                            state: {
                              focusContainerId: replaySourceRunId,
                            },
                          });
                        }}
                      >
                        {replaySourceDisplayName || "Original"} —{" "}
                        {replaySourceRunId}
                      </Button>
                    </div>
                    <span className="new-experiment__replay-alert-hint">
                      Adjust parameters below or upload another kubeconfig file to
                      target a different cluster.
                    </span>
                  </div>
                </Alert>
              </GridItem>
            ) : null}
            {clusterRunWarning ? (
              <GridItem span={12}>
                <Alert
                  variant="warning"
                  isInline
                  title="Other experiments are running on this cluster"
                  actionClose={
                    <AlertActionCloseButton
                      onClose={() => {
                        setClusterRunWarning(null);
                        setPendingStartPayload(null);
                      }}
                    />
                  }
                >
                  <p>
                    There {clusterRunWarning.runningCount === 1 ? "is" : "are"}{" "}
                    <strong>{clusterRunWarning.runningCount}</strong> other
                    experiment
                    {clusterRunWarning.runningCount === 1 ? "" : "s"} currently
                    running on this cluster
                    {clusterRunWarning.clusterKey
                      ? ` (${clusterRunWarning.clusterKey})`
                      : ""}
                    . Are you sure you want to continue?
                  </p>
                  <Button
                    className="pf-v5-u-mt-sm"
                    variant="primary"
                    onClick={confirmClusterRun}
                  >
                    Yes, start Kraken anyway
                  </Button>
                </Alert>
              </GridItem>
            ) : null}
            <GridItem span={12}>
              <Grid hasGutter>
                <GridItem span={6}>
                  <GroupSelect
                    onGroupChange={() => {
                      setKubeconfigSelection("");
                      setClusterRunWarning(null);
                      setPendingStartPayload(null);
                    }}
                  />
                </GridItem>
                <GridItem span={6}>
                  <KubeconfigSelect
                    value={kubeconfigSelection}
                    onChange={setKubeconfigSelection}
                    allowLegacyUpload
                  />
                </GridItem>
                {kubeconfigSelection === "legacy" ? (
                  <GridItem span={12}>
                    <FormGroup isRequired={false} label={"KUBECONFIG FILE"}>
                      <KubeconfigFileUpload />
                    </FormGroup>
                  </GridItem>
                ) : null}
              </Grid>
            </GridItem>
            {scenarioChecked &&
              paramsList[scenarioChecked].map((item, index) => {
                return (
                  <GridItem
                    span={6}
                    key={`${scenarioChecked}-${item.key}`}
                    className="new-experiment__field-enter"
                    style={{ animationDelay: `${index * 45}ms` }}
                  >
                    <FormGroup
                      isRequired={item.isRequired}
                      label={item.label}
                      fieldId={item.fieldId}
                      helperText={item.helperText}
                    >
                      <TextInput
                        isRequired={item.isRequired}
                        type="text"
                        id={item.fieldId}
                        name={item.key}
                        value={data[scenarioChecked][item.key]}
                        aria-describedby={item.ariaDescribedby}
                        onChange={(evt, val) =>
                          changeHandler(evt, val, item.key)
                        }
                      />
                    </FormGroup>
                  </GridItem>
                );
              })}

            {/* Global Scenario Variables Collapsible Section */}
            <GridItem span={12} className="new-experiment__global-section-wrapper pf-v5-u-mt-md">
              <ExpandableSection toggleText="Global Scenario Variables" displaySize="large">
                <Grid hasGutter className="pf-v5-u-mt-md">
                  {globalParamsData.map((category) => (
                    <GridItem span={12} key={category.category} className="new-experiment__global-category-item">
                      <ExpandableSection toggleText={category.category}>
                        <Grid hasGutter className="pf-v5-u-mt-md pf-v5-u-p-md" style={{ backgroundColor: "var(--pf-v5-global--BackgroundColor--light-100)", borderRadius: "4px" }}>
                          {category.fields.map((field) => (
                            <GridItem span={6} key={field.key}>
                              <FormGroup
                                label={field.label}
                                fieldId={field.key}
                                helperText={field.helperText}
                              >
                                <TextInput
                                  type="text"
                                  id={field.key}
                                  name={field.key}
                                  value={globalData[field.key] ?? ""}
                                  onChange={(evt, val) => globalChangeHandler(evt, val, field.key)}
                                />
                              </FormGroup>
                            </GridItem>
                          ))}
                        </Grid>
                      </ExpandableSection>
                    </GridItem>
                  ))}
                </Grid>
              </ExpandableSection>
            </GridItem>
          </Grid>
          <ActionGroup className="action-group-wrapper">
            <TextButton
              variant="primary"
              isBtnDisabled={isBtnDisabled}
              clickHandler={sendData}
              text={"Start Kraken"}
            />
          </ActionGroup>
        </Form>
      </CardBody>
    </Card>
  );
};

export default NewExperiment;
