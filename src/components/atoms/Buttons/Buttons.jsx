import { Button } from "@patternfly/react-core";
import React from "react";

export const IconButton = (props) => {
  return (
    <Button
      variant={props.variant}
      icon={props.icon}
      iconPosition={props.position}
      onClick={props.clickHandler}
    >
      {props.text}
    </Button>
  );
};

export const TextButton = (props) => {
  return (
    <Button
      variant={props.variant}
      isDisabled={props.isBtnDisabled}
      onClick={props.clickHandler}
      className={props?.className}
    >
      {props.text}
    </Button>
  );
};
