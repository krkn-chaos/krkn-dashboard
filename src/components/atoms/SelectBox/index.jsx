import {
  MenuToggle,
  Select,
  SelectList,
  SelectOption,
} from "@patternfly/react-core";

import PropTypes from "prop-types";
import React from "react";
import { setCatFilters } from "@/actions/storageActions.js";
import { setSelected } from "@/actions/logsActions.js";
import { useDispatch } from "react-redux";

const SelectBox = (props) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dispatch = useDispatch();

  const onToggleClick = () => {
    setIsOpen(!isOpen);
  };
  const onSelect = (_event, value) => {
    if (props.type === "test") {
      dispatch(setCatFilters(value));
      setIsOpen(false);
    } else {
      dispatch(setSelected(value));
      setIsOpen(false);
    }
  };
  const toggle = (toggleRef) => (
    <MenuToggle
      ref={toggleRef}
      onClick={onToggleClick}
      isExpanded={isOpen}
      style={{
        width: "400px",
      }}
    >
      {props.selected}
    </MenuToggle>
  );
  return (
    <React.Fragment>
      <Select
        id="single-select"
        isOpen={isOpen}
        selected={props.selected}
        onSelect={onSelect}
        onOpenChange={(isOpen) => setIsOpen(isOpen)}
        toggle={toggle}
        shouldFocusToggleOnSelect={false}
      >
        {props.type === "test" ? (
          <SelectList>
            {props?.options?.map((option) => (
              <SelectOption key={option?.key} value={option.name}>
                {option.name}
              </SelectOption>
            ))}
          </SelectList>
        ) : (
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
        )}
      </Select>
    </React.Fragment>
  );
};
export default SelectBox;
SelectBox.propTypes = {
  options: PropTypes.array,
  selected: PropTypes.string,
  type: PropTypes.string,
  onChange: PropTypes.func,
};
