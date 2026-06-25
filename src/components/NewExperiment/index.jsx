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
  FormSelect,
  FormSelectOption,
  Grid,
  GridItem,
  HelperText,
  HelperTextItem,
  Spinner,
  TextInput,
  Title,
  Tooltip,
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
import { useScenarioFields } from "@/utils/useScenarioFields";
import { ExclamationTriangleIcon, InfoCircleIcon } from "@patternfly/react-icons";
import { SCENARIO_REGISTRY, globalParamsData } from "./experimentFormData";
import { setActiveGroupId } from "@/actions/authActions";
import { showToast } from "@/actions/toastActions";
import { startKraken, updateScenarioChecked } from "@/actions/newExperiment";

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

  const scenarioChecked = useSelector((state) => state.experiment.scenarioChecked);
  const activeGroupId = useSelector((state) => state.auth.activeGroupId);

  // Dynamic field definitions fetched from the backend (Quay → local fallback).
  const { fields: scenarioFields, loading: fieldsLoading, error: fieldsError } =
    useScenarioFields(scenarioChecked);

  // Per-scenario form values. Populated lazily when fields arrive.
  const [data, setData] = useState({});

  // Seed scenario data from field defaults the first time fields load for it.
  useEffect(() => {
    if (!scenarioFields || !scenarioChecked || data[scenarioChecked]) return;
    const defaults = { scenarioChecked };
    scenarioFields.forEach((f) => {
      defaults[f.key] = f.defaultValue ?? "";
    });
    setData((prev) => ({ ...prev, [scenarioChecked]: defaults }));
  }, [scenarioFields, scenarioChecked]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const [globalSectionExpanded, setGlobalSectionExpanded] = useState(true);

  const [categoryExpanded, setCategoryExpanded] = useState(() =>
    Object.fromEntries(
      globalParamsData.map((c) => [c.category, c.defaultExpanded ?? false])
    )
  );

  const toggleCategory = (category) => {
    setCategoryExpanded((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    setValidationErrors({});
  }, [scenarioChecked]);

  const globalChangeHandler = (_event, value, key) => {
    setGlobalData((prev) => ({ ...prev, [key]: value }));
  };

  // Replay flow ──────────────────────────────────────────────────────────────
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
    if (!scenario || !SCENARIO_REGISTRY[scenario]) {
      replayAppliedRef.current = true;
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }

    replayAppliedRef.current = true;
    const stem = extractReplayBaseStem(stored.name);
    (async () => {
      try {
        const { data: replayResponse } = await API.post(
          "/past-runs/allocate-replay-name",
          { baseStem: stem, groupId: targetGroupId || activeGroupId || undefined }
        );
        const allocatedName = replayResponse?.name;
        if (!allocatedName) throw new Error("No name returned");

        if (stored.globalParams) {
          setGlobalData(stored.globalParams);
        } else {
          setGlobalData(initGlobalData());
        }

        // Merge stored params over whatever defaults are already in state.
        setData((prev) => {
          const base = prev[scenario] ?? { scenarioChecked: scenario };
          const skip = new Set(["replayOfContainerId", "isFileUpload", "name"]);
          const merged = { ...base };
          for (const [k, v] of Object.entries(stored)) {
            if (skip.has(k) || v === undefined || v === null) continue;
            merged[k] = v;
          }
          return {
            ...prev,
            [scenario]: { ...merged, name: allocatedName, scenarioChecked: scenario },
          };
        });

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

  // Button enable/disable ────────────────────────────────────────────────────
  useEffect(() => {
    if (!scenarioFields || !data[scenarioChecked]) {
      setIsBtnDisabled(true);
      return;
    }
    const requiredKeys = scenarioFields
      .filter((f) => f.isRequired)
      .map((f) => f.key);
    const allFilled = requiredKeys.every((key) => {
      const value = data[scenarioChecked][key];
      return value !== null && value !== undefined && String(value).trim() !== "";
    });
    setIsBtnDisabled(!allFilled || !activeGroupId);
  }, [data, scenarioChecked, scenarioFields, activeGroupId]);

  // Field change + validation ───────────────────────────────────────────────
  const changeHandler = (_event, value, key) => {
    setData((prev) => ({
      ...prev,
      [scenarioChecked]: { ...prev[scenarioChecked], [key]: value },
    }));
    const field = scenarioFields?.find((f) => f.key === key);
    if (!field) return;
    if (!value || !value.trim()) {
      setValidationErrors((prev) => ({ ...prev, [key]: false }));
      return;
    }
    if (field.isNumeric) {
      const isValid = !Number.isNaN(Number(value));
      setValidationErrors((prev) => ({ ...prev, [key]: !isValid }));
      return;
    }
    if (field.validator) {
      const isValid = new RegExp(field.validator).test(value);
      setValidationErrors((prev) => ({ ...prev, [key]: !isValid }));
    }
  };

  // Payload / submit ─────────────────────────────────────────────────────────
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
      const { data: clusterData } = await API.post("/check-cluster-runs", { params: payload });
      if ((clusterData?.runningCount ?? 0) > 0) {
        setClusterRunWarning({
          runningCount: clusterData.runningCount,
          clusterKey: clusterData.clusterKey,
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
    if (pendingStartPayload) await runStartKraken(pendingStartPayload);
  };

  const scenarioData = data[scenarioChecked] ?? {};

  return (
    <Card className="start-kraken-modal margin-top">
      <CardBody>
        <Title headingLevel="h3" className="title-text">
          Supported Parameters
        </Title>
        <Form>
          <Grid hasGutter>
            {/* Replay banner */}
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
                            state: { focusContainerId: replaySourceRunId },
                          });
                        }}
                      >
                        {replaySourceDisplayName || "Original"} — {replaySourceRunId}
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

            {/* Concurrent-run warning */}
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
                    experiment{clusterRunWarning.runningCount === 1 ? "" : "s"}{" "}
                    currently running on this cluster
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

            {/* Kubeconfig selectors */}
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
                    <FormGroup isRequired={false} label="KUBECONFIG FILE">
                      <KubeconfigFileUpload />
                    </FormGroup>
                  </GridItem>
                ) : null}
              </Grid>
            </GridItem>

            {/* Scenario fields */}
            {scenarioChecked && fieldsLoading && (
              <GridItem span={12} style={{ textAlign: "center", padding: "2rem" }}>
                <Spinner size="lg" aria-label="Loading scenario parameters" />
              </GridItem>
            )}
            {scenarioChecked && fieldsError && (
              <GridItem span={12}>
                <Alert variant="danger" isInline title="Could not load scenario parameters">
                  {fieldsError?.response?.data?.error || fieldsError?.message}
                </Alert>
              </GridItem>
            )}
            {scenarioChecked && scenarioFields && !fieldsLoading &&
              scenarioFields.map((item, index) => (
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
                    validated={validationErrors[item.key] ? "error" : "default"}
                    labelIcon={
                      <Tooltip
                        content={
                          <div>
                            {item.helperText && <div>{item.helperText}</div>}
                            {item.defaultValue && (
                              <div style={{ marginTop: item.helperText ? "4px" : 0 }}>
                                <strong>Default:</strong> {item.defaultValue}
                              </div>
                            )}
                            {item.isRequired && (
                              <div style={{ marginTop: "4px" }}>
                                <strong>Required</strong>
                              </div>
                            )}
                          </div>
                        }
                      >
                        <InfoCircleIcon
                          style={{
                            color: "var(--pf-v5-global--info-color--100)",
                            cursor: "default",
                            verticalAlign: "middle",
                          }}
                        />
                      </Tooltip>
                    }
                  >
                    {item.inputType === "enum" ? (
                      <FormSelect
                        id={item.fieldId}
                        name={item.key}
                        value={scenarioData[item.key] ?? item.defaultValue ?? ""}
                        aria-label={item.label}
                        onChange={(evt, val) => changeHandler(evt, val, item.key)}
                      >
                        {(item.allowedValues ?? []).map((opt) => (
                          <FormSelectOption key={opt} value={opt} label={opt} />
                        ))}
                      </FormSelect>
                    ) : (
                      <TextInput
                        isRequired={item.isRequired}
                        type={item.inputType === "number" ? "number" : item.inputType || "text"}
                        id={item.fieldId}
                        name={item.key}
                        value={scenarioData[item.key] ?? item.defaultValue ?? ""}
                        aria-describedby={item.ariaDescribedby}
                        validated={validationErrors[item.key] ? "error" : "default"}
                        onChange={(evt, val) => changeHandler(evt, val, item.key)}
                      />
                    )}
                    {validationErrors[item.key] && (item.validationMessage || item.isNumeric) && (
                      <HelperText>
                        <HelperTextItem variant="error" hasIcon>
                          {item.isNumeric ? "Must be a valid number" : item.validationMessage}
                        </HelperTextItem>
                      </HelperText>
                    )}
                  </FormGroup>
                </GridItem>
              ))}

            {/* Global Scenario Variables */}
            <GridItem span={12} className="new-experiment__global-section-wrapper pf-v5-u-mt-md">
              <ExpandableSection
                toggleText="Global Scenario Variables"
                displaySize="large"
                isExpanded={globalSectionExpanded}
                onToggle={() => setGlobalSectionExpanded((prev) => !prev)}
              >
                <Grid hasGutter className="pf-v5-u-mt-md">
                  {globalParamsData.map((category) => (
                    <GridItem
                      span={12}
                      key={category.category}
                      className="new-experiment__global-category-item"
                    >
                      <ExpandableSection
                        toggleText={category.category}
                        isExpanded={categoryExpanded[category.category]}
                        onToggle={() => toggleCategory(category.category)}
                      >
                        <Grid
                          hasGutter
                          className="pf-v5-u-mt-md pf-v5-u-p-md"
                          style={{
                            backgroundColor:
                              "var(--pf-v5-global--BackgroundColor--light-100)",
                            borderRadius: "4px",
                          }}
                        >
                          {category.fields.map((field) => (
                            <GridItem span={6} key={field.key}>
                              <FormGroup
                                label={field.label}
                                fieldId={field.key}
                                helperText={field.helperText}
                                labelIcon={
                                  field.warning ? (
                                    <Tooltip content={field.warning}>
                                      <ExclamationTriangleIcon
                                        style={{
                                          color:
                                            "var(--pf-v5-global--warning-color--100)",
                                          cursor: "default",
                                          verticalAlign: "middle",
                                        }}
                                      />
                                    </Tooltip>
                                  ) : undefined
                                }
                              >
                                <TextInput
                                  type="text"
                                  id={field.key}
                                  name={field.key}
                                  value={globalData[field.key] ?? ""}
                                  onChange={(evt, val) =>
                                    globalChangeHandler(evt, val, field.key)
                                  }
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
              text="Start Kraken"
            />
          </ActionGroup>
        </Form>
      </CardBody>
    </Card>
  );
};

export default NewExperiment;
