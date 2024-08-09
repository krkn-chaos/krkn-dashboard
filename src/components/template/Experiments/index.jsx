import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardTitle,
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
    <>
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
              {Object.keys(parseParams(data.params)).map((item) => (
                <div key={uid()}>
                  <span style={{ fontWeight: "bold", paddingRight: "10px" }}>
                    {item}:
                  </span>
                  <span>{parseParams(data.params)[item]}</span>
                </div>
              ))}
              {/* {parseParams(data.params)} */}
            </CardBody>
            <CardFooter>
              {" "}
              <Button variant="link" isInline>
                Get details
              </Button>
            </CardFooter>
          </Card>
        ))}
    </>
  );
};

export default Experiments;
