import "./index.less";

import { Card, CardBody, Title } from "@patternfly/react-core";
import {
  ContainerNodeIcon,
  CubeIcon,
  DatabaseIcon,
  MemoryIcon,
  MicrochipIcon,
  NetworkIcon,
  OutlinedClockIcon,
} from "@patternfly/react-icons";
import { useDispatch, useSelector } from "react-redux";

import React from "react";
import node_io from "@/assets/scenario-icons/node_io.jpg";
import { updateScenarioChecked } from "@/actions/newExperiment.js";

const scenariosOptions = [
  {
    id: 0,
    key: "container-scenarios",
    label: "Container Scenarios",
    isImg: false,
    icon: ContainerNodeIcon,
  },
  {
    id: 6,
    key: "node-cpu-hog",
    label: "Node CPU hog",
    isImg: false,
    icon: MicrochipIcon,
  },
  {
    id: 7,
    key: "node-io-hog",
    label: "Node IO hog",
    isImg: true,
    icon: node_io,
  },
  {
    id: 8,
    key: "node-memory-hog",
    label: "Node Memory hog",
    isImg: false,
    icon: MemoryIcon,
  },
  {
    id: 4,
    key: "pod-scenarios",
    label: "Pod Scenarios",
    isImg: false,
    icon: CubeIcon,
  },
  {
    id: 3,
    key: "pvc-scenarios",
    label: "PVC Scenarios",
    isImg: false,
    icon: DatabaseIcon,
  },
  {
    id: 5,
    key: "time-scenarios",
    label: "Time Scenarios",
    icon: OutlinedClockIcon,
    isImg: false,
  },
  {
    id: 14,
    key: "network-chaos",
    label: "Network Chaos",
    isImg: false,
    icon: NetworkIcon,
  },
];

const ScenariosList = () => {
  const dispatch = useDispatch();
  const scenarioChecked = useSelector(
    (state) => state.experiment.scenarioChecked
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
          <Card
            className={`card ${scenarioChecked === option.key ? "active" : ""}`}
            isRounded
            key={option.key}
            onClick={() => handleChange(option.key)}
          >
            <CardBody className="card-wrapper">
              <div className="img-wrapper">
                {option.isImg ? (
                  <img
                    className="scenario-icon"
                    src={option.icon}
                    alt="container"
                  />
                ) : (
                  <option.icon />
                )}
              </div>
              <div className="scenario-name">{option.label}</div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ScenariosList;
