import {
  MenuToggle,
  Select,
  SelectList,
  SelectOption,
} from "@patternfly/react-core";
import { useDispatch, useSelector } from "react-redux";

import PropTypes from "prop-types";
import React from "react";
import { setSelected } from "@/actions/logsActions.js";

export const SelectBasic = (props) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dispatch = useDispatch();
  const { selectedPod } = useSelector((state) => state.log);

  const onToggleClick = () => {
    setIsOpen(!isOpen);
  };
  const onSelect = (_event, value) => {
    dispatch(setSelected(value));
    setIsOpen(false);
  };
  const toggle = (toggleRef) => (
    <MenuToggle
      ref={toggleRef}
      onClick={onToggleClick}
      isExpanded={isOpen}
      style={{
        width: "400px",
        marginTop: "2vh",
      }}
    >
      {selectedPod}
    </MenuToggle>
  );
  return (
    <React.Fragment>
      <Select
        id="single-select"
        isOpen={isOpen}
        selected={selectedPod}
        onSelect={onSelect}
        onOpenChange={(isOpen) => setIsOpen(isOpen)}
        toggle={toggle}
        shouldFocusToggleOnSelect={false}
      >
        <SelectList>
          {props?.options?.map((option) => (
            <SelectOption
              key={option?.Id?.toString()?.substr(0, 8)}
              value={option.Names}
            >
              {option.Names}
            </SelectOption>
          ))}
        </SelectList>
      </Select>
    </React.Fragment>
  );
};

SelectBasic.propTypes = {
  options: PropTypes.array,
};
