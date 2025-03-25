import "./index.less";

import {
  Button,
  Card,
  CardBody,
  CardTitle,
  Grid,
  GridItem,
} from "@patternfly/react-core";
import React, { useEffect } from "react";
import { deleteConfig, getConfig } from "@/actions/newExperiment";
import { useDispatch, useSelector } from "react-redux";

import { TrashIcon } from "@patternfly/react-icons";
import { uid } from "@/actions/toastActions.js";

const Experiments = () => {
  const dispatch = useDispatch();
  const configDataArr = useSelector((state) => state.experiment.configDataArr);
  const parseParams = (data) => {
    return JSON.parse(data);
  };
  useEffect(() => {
    dispatch(getConfig());
  }, [dispatch]);
  return (
    <div className="config-container">
      {configDataArr?.length > 0 &&
        configDataArr.map((data) => (
          <Card key={uid()} ouiaId="BasicCard">
            <CardTitle>
              {data.name}
              <Button
                variant="link"
                icon={<TrashIcon />}
                onClick={() => dispatch(deleteConfig(data.id))}
                style={{ float: "right" }}
              />
            </CardTitle>
            <CardBody>
              <Grid hasGutter>
                {Object.keys(parseParams(data.params)).map((item) => {
                  if (item !== "kubeconfig" && item !== "isFileUpload") {
                    return (
                      <GridItem span={3} key={uid()}>
                        <span
                          style={{ fontWeight: "bold", paddingRight: "10px" }}
                        >
                          {item === "scenarioChecked" ? "scenario" : item}:
                        </span>
                        <span>{parseParams(data.params)[item]}</span>
                      </GridItem>
                    );
                  }
                  return null;
                })}
              </Grid>
            </CardBody>
          </Card>
        ))}
    </div>
  );
};

export default Experiments;
