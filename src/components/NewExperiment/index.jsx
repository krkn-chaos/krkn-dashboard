import "./index.less";

import {
  ActionGroup,
  Card,
  CardBody,
  Form,
  FormGroup,
  Switch,
  TextInput,
  Title,
} from "@patternfly/react-core";
import React, { useState } from "react";
import { removePod, startKraken } from "@/actions/newExperiment";
import { useDispatch, useSelector } from "react-redux";

import { TextButton } from "@/components/atoms/Buttons/Buttons";
import { paramsList } from "./experimentFormData";

const NewExperiment = () => {
  const dispatch = useDispatch();
  const [isBtnDisabled, setIsBtnDisabled] = useState(true);
  const scenarioChecked = useSelector(
    (state) => state.experiment.scenarioChecked,
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
    },
    "node-cpu-hog": {
      kubeconfigPath: "",
      total_chaos_duration: 60,
      node_cpu_core: 2,
      node_cpu_percentage: 50,
      namespace: "default",
      node_selectors: "",
      scenarioChecked: "node-cpu-hog",
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
    },
    "node-memory-hog": {
      kubeconfigPath: "",
      total_chaos_duration: 60,
      memory_consumption_percentage: "90%",
      number_of_workers: 1,
      namespace: "default",
      node_selectors: "",
      scenarioChecked: "node-memory-hog",
    },
  });

  const changeHandler = (value, key) => {
    setData((prevSatate) => ({
      ...data,
      [scenarioChecked]: {
        ...prevSatate[scenarioChecked],
        [key]: value,
      },
    }));
    checkBtnDisabled();
  };
  const checkBtnDisabled = () => {
    const isFull = Object.values(data[scenarioChecked]).every(
      (x) => x !== null || x !== "",
    );
    setIsBtnDisabled(!isFull);
  };
  const sendData = async () => {
    await dispatch(removePod());
    await dispatch(startKraken(data[scenarioChecked]));
  };
  return (
    <Card className="start-kraken-modal margin-top">
      <CardBody>
        <Title headingLevel="h3" className="title-text">
          Supported Parameters
        </Title>
        <Form>
          <div>
            <Switch
              id="cerberus-switch"
              label="Cerberus Enabled"
              labelOff="Cerberus Disabled"
            />
          </div>
          {scenarioChecked &&
            paramsList[scenarioChecked].map((item) => {
              return (
                <FormGroup
                  key={item.key}
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
                    onChange={(val) => changeHandler(val, item.key)}
                  />
                </FormGroup>
              );
            })}

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
