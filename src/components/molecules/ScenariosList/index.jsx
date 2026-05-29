import "./index.less";

import {
  Button,
  MenuToggle,
  Select,
  SelectList,
  SelectOption,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
  Title,
} from "@patternfly/react-core";
import {
  ContainerNodeIcon,
  CubeIcon,
  DatabaseIcon,
  MemoryIcon,
  MicrochipIcon,
  OutlinedClockIcon,
  TimesIcon,
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
];

const renderIcon = (option) =>
  option.isImg ? (
    <img className="scenario-option-icon" src={option.icon} alt="" />
  ) : (
    <option.icon className="scenario-option-icon" />
  );

const ScenariosList = () => {
  const dispatch = useDispatch();
  const scenarioChecked = useSelector(
    (state) => state.experiment.scenarioChecked
  );

  const selectedOption = scenariosOptions.find(
    (option) => option.key === scenarioChecked
  );

  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [filterValue, setFilterValue] = React.useState("");
  const [focusedItemIndex, setFocusedItemIndex] = React.useState(null);
  const textInputRef = React.useRef();

  // Keep the typeahead text in sync with the active selection.
  React.useEffect(() => {
    setInputValue(selectedOption ? selectedOption.label : "");
  }, [selectedOption]);

  const filteredOptions = React.useMemo(() => {
    if (!filterValue) return scenariosOptions;
    const lower = filterValue.toLowerCase();
    return scenariosOptions.filter((option) =>
      option.label.toLowerCase().includes(lower)
    );
  }, [filterValue]);

  const onToggleClick = () => {
    setIsOpen((prev) => !prev);
    textInputRef.current?.focus();
  };

  const onSelect = (_event, value) => {
    if (!value) return;
    dispatch(updateScenarioChecked(value));
    setFilterValue("");
    setFocusedItemIndex(null);
    setIsOpen(false);
  };

  const onTextInputChange = (_event, value) => {
    setInputValue(value);
    setFilterValue(value);
    setFocusedItemIndex(null);
    if (!isOpen) setIsOpen(true);
  };

  const onClearInput = () => {
    setInputValue("");
    setFilterValue("");
    setFocusedItemIndex(null);
    setIsOpen(true);
    textInputRef.current?.focus();
  };

  const onInputKeyDown = (event) => {
    const count = filteredOptions.length;
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          return;
        }
        if (count === 0) return;
        const current = focusedItemIndex ?? -1;
        const next =
          event.key === "ArrowDown"
            ? (current + 1) % count
            : (current - 1 + count) % count;
        setFocusedItemIndex(next);
        break;
      }
      case "Enter": {
        event.preventDefault();
        if (isOpen && focusedItemIndex != null && filteredOptions[focusedItemIndex]) {
          onSelect(null, filteredOptions[focusedItemIndex].key);
        } else {
          setIsOpen((prev) => !prev);
        }
        break;
      }
      case "Escape":
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const toggle = (toggleRef) => (
    <MenuToggle
      ref={toggleRef}
      variant="typeahead"
      aria-label="Select a scenario"
      onClick={onToggleClick}
      isExpanded={isOpen}
      isFullWidth
      icon={
        selectedOption ? (
          <span className="scenario-toggle-icon">
            {renderIcon(selectedOption)}
          </span>
        ) : undefined
      }
    >
      <TextInputGroup isPlain>
        <TextInputGroupMain
          value={inputValue}
          onClick={onToggleClick}
          onChange={onTextInputChange}
          onKeyDown={onInputKeyDown}
          autoComplete="off"
          innerRef={textInputRef}
          placeholder="Search and select a scenario"
          role="combobox"
          isExpanded={isOpen}
          aria-controls="scenario-select-listbox"
        />
        <TextInputGroupUtilities
          {...(inputValue ? {} : { style: { display: "none" } })}
        >
          <Button
            variant="plain"
            onClick={onClearInput}
            aria-label="Clear scenario selection"
          >
            <TimesIcon />
          </Button>
        </TextInputGroupUtilities>
      </TextInputGroup>
    </MenuToggle>
  );

  return (
    <div className="scenarios-container">
      <Title headingLevel="h3" className="title-text">
        Scenarios
      </Title>
      <Select
        id="scenario-typeahead-select"
        isOpen={isOpen}
        selected={scenarioChecked}
        onSelect={onSelect}
        onOpenChange={(open) => {
          if (!open) setIsOpen(false);
        }}
        toggle={toggle}
        shouldFocusFirstItemOnOpen={false}
      >
        <SelectList id="scenario-select-listbox" className="scenario-select-list">
          {filteredOptions.length === 0 ? (
            <SelectOption isDisabled key="no-results">
              {`No scenarios match "${filterValue}"`}
            </SelectOption>
          ) : (
            filteredOptions.map((option, index) => (
              <SelectOption
                key={option.key}
                value={option.key}
                isFocused={focusedItemIndex === index}
                className="scenario-select-option"
              >
                <span className="scenario-option-row">
                  <span className="scenario-option-icon-wrapper">
                    {renderIcon(option)}
                  </span>
                  <span>{option.label}</span>
                </span>
              </SelectOption>
            ))
          )}
        </SelectList>
      </Select>
    </div>
  );
};

export default ScenariosList;
