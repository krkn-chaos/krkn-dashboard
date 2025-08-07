import "./index.less";

import {
  ActionGroup,
  Card,
  CardBody,
  Form,
  FormGroup,
  Grid,
  GridItem,
  TextInput,
  Title,
} from "@patternfly/react-core";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import KubeconfigFileUpload from "@/components/molecules/FileUpload";
import { TextButton } from "@/components/atoms/Buttons/Buttons";
import { paramsList } from "./experimentFormData";
import { startKraken } from "@/actions/newExperiment";

const NewExperiment = () => {
  const dispatch = useDispatch();
  const [isBtnDisabled, setIsBtnDisabled] = useState(true);
  const scenarioChecked = useSelector(
    (state) => state.experiment.scenarioChecked
  );

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
      namespace: "",
      pod_label: "",
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
  });

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

    setIsBtnDisabled(!allRequiredFilled);
  }, [data, scenarioChecked]);

  const changeHandler = (_event, value, key) => {
    setData((prevSatate) => ({
      ...data,
      [scenarioChecked]: {
        ...prevSatate[scenarioChecked],
        [key]: value,
      },
    }));
  };

  const sendData = async () => {
    await dispatch(startKraken(data[scenarioChecked]));
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
            <GridItem span={6}>
              <FormGroup isRequired={false} label={"KUBECONFIG FILE"}>
                <KubeconfigFileUpload />
              </FormGroup>
            </GridItem>
            {scenarioChecked &&
              paramsList[scenarioChecked].map((item) => {
                return (
                  <GridItem span={6} key={item.key}>
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
