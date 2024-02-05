import "./index.less";

import { Radio, Title } from "@patternfly/react-core";
import { useDispatch, useSelector } from "react-redux";

import React from "react";
import { updateScenarioChecked } from "@/actions/newExperiment.js";

const scenariosOptions = [
  {
    id: 0,
    key: "container-scenarios",
    label: "Container Scenarios",
  },
  {
    id: 1,
    key: "namespace-scenarios",
    label: "Namespace Scenarios",
  },
  {
    id: 2,
    key: "node-scenarios",
    label: "Node Scenarios",
  },
  {
    id: 3,
    key: "pvc-scenarios",
    label: "PVC Scenarios",
  },
  {
    id: 4,
    key: "pod-scenarios",
    label: "Pod Scenarios",
  },
  {
    id: 5,
    key: "time-scenarios",
    label: "Time Scenarios",
  },
  {
    id: 6,
    key: "node-cpu-hog",
    label: "Node CPU hog",
  },
  {
    id: 7,
    key: "node-io-hog",
    label: "Node IO hog",
  },
  {
    id: 8,
    key: "node-memory-hog",
    label: "Node Memory hog",
  },
];

const ScenariosList = () => {
  const dispatch = useDispatch();
  const scenarioChecked = useSelector(
    (state) => state.experiment.scenarioChecked,
  );
  const handleChange = (key) => {
    dispatch(updateScenarioChecked(key));
  };
  return (
    <div className="scenarios-container">
      <Title headingLevel="h3" className="title-text">
        Scenarios
      </Title>
      <div className="parent">
        {scenariosOptions.map((option) => (
          <Radio
            className="scenario"
            key={option.key}
            isChecked={scenarioChecked === option.key}
            name={option.key}
            onChange={() => handleChange(option.key)}
            label={option.label}
            id={option.key}
          ></Radio>
        ))}
      </div>
    </div>
  );
};

export default ScenariosList;
