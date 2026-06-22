import "react-date-picker/dist/DatePicker.css";
import "react-calendar/dist/Calendar.css";
import "./index.less";

import {
  Button,
  MenuToggle,
  Select,
  SelectList,
  SelectOption,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  clearAllFilters,
  setAppliedFilters,
  setDateRange,
  setSelectedFilter,
} from "@/actions/storageActions.js";
import { GROUP_BY_MAP, setSummaryDateRange, setGroupBy } from "@/actions/summaryActions";
import { useDispatch, useSelector } from "react-redux";

import DatePicker from "react-date-picker";
import PropTypes from "prop-types";
import React, { useState } from "react";
import { formatDate } from "@/utils/helper";
import { useNavigate } from "react-router-dom";

const StorageTableFilter = ({ start_date, end_date, type }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { filterData, selectedFilters, appliedFilters, tableFilters } =
    useSelector((state) => state.storage);
  const { group_by } = useSelector((state) => state.summary);

  const [openDropdowns, setOpenDropdowns] = useState({});
  const [dirtyDropdowns, setDirtyDropdowns] = useState({});
  const [groupByOpen, setGroupByOpen] = useState(false);

  const groupByOptions = Object.keys(GROUP_BY_MAP);

  const dateChangeHandler = (date, key) => {
    if (type === "summary") {
      dispatch(setSummaryDateRange(date, key));
    } else {
      dispatch(setDateRange(date, key));
    }
  };

  const getOptionsForCategory = (displayName) =>
    filterData?.find((f) => f.name === displayName)?.value || [];

  const getSelectedForCategory = (fieldKey) =>
    selectedFilters?.find((f) => f.name === fieldKey)?.value || [];

  const handleSelect = (fieldKey, optionValue) => {
    setDirtyDropdowns((prev) => ({ ...prev, [fieldKey]: true }));
    dispatch(setSelectedFilter(fieldKey, optionValue));
  };

  const handleOpenChange = (fieldKey, isOpen) => {
    if (!isOpen && dirtyDropdowns[fieldKey]) {
      setDirtyDropdowns((prev) => ({ ...prev, [fieldKey]: false }));
      dispatch(setAppliedFilters(navigate, type));
    }
    setOpenDropdowns((prev) => ({ ...prev, [fieldKey]: isOpen }));
  };

  const hasAppliedFilters = Object.values(appliedFilters || {}).some(
    (v) => Array.isArray(v) && v.length > 0
  );

  return (
    <>
      <Toolbar id="filter-toolbar" ouiaId="data_table_filter">
        <ToolbarContent className="field-filter">
          <ToolbarItem>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
              {tableFilters.map((filter) => {
                const options = getOptionsForCategory(filter.name);
                const selected = getSelectedForCategory(filter.value);
                const isOpen = openDropdowns[filter.value] || false;

                return (
                  <Select
                    key={filter.value}
                    isOpen={isOpen}
                    selected={selected}
                    onOpenChange={(o) => handleOpenChange(filter.value, o)}
                    toggle={(ref) => (
                      <MenuToggle
                        ref={ref}
                        onClick={() =>
                          setOpenDropdowns((prev) => ({
                            ...prev,
                            [filter.value]: !prev[filter.value],
                          }))
                        }
                        isExpanded={isOpen}
                        style={{ width: "160px" }}
                      >
                        {selected.length > 0
                          ? `${filter.name} (${selected.length})`
                          : filter.name}
                      </MenuToggle>
                    )}
                  >
                    <SelectList>
                      {options.length > 0 ? (
                        options.map((opt) => (
                          <SelectOption
                            key={opt}
                            value={opt}
                            isSelected={selected.includes(opt)}
                            hasCheckbox
                            onClick={() => handleSelect(filter.value, opt)}
                          >
                            {opt}
                          </SelectOption>
                        ))
                      ) : (
                        <SelectOption isDisabled>No options available</SelectOption>
                      )}
                    </SelectList>
                  </Select>
                );
              })}
              {hasAppliedFilters && (
                <Button
                  variant="link"
                  onClick={() => dispatch(clearAllFilters(navigate, type))}
                >
                  Clear filters
                </Button>
              )}
            </div>
          </ToolbarItem>
        </ToolbarContent>
        {type === "summary" && (
          <ToolbarContent>
            <ToolbarItem>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>Group By</span>
                <Select
                  isOpen={groupByOpen}
                  onOpenChange={(o) => setGroupByOpen(o)}
                  toggle={(ref) => (
                    <MenuToggle
                      ref={ref}
                      onClick={() => setGroupByOpen((o) => !o)}
                      isExpanded={groupByOpen}
                      style={{ width: "200px" }}
                    >
                      {group_by || "Select Group By"}
                    </MenuToggle>
                  )}
                >
                  <SelectList>
                    {groupByOptions.map((opt) => (
                      <SelectOption
                        key={opt}
                        value={opt}
                        isSelected={group_by === opt}
                        onClick={() => {
                          dispatch(setGroupBy(opt));
                          setGroupByOpen(false);
                        }}
                      >
                        {opt}
                      </SelectOption>
                    ))}
                  </SelectList>
                </Select>
              </div>
            </ToolbarItem>
          </ToolbarContent>
        )}

        <ToolbarContent className="date-filter" ouiaId="date_filter">
          <ToolbarItem>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <DatePicker
                onChange={(date) => dateChangeHandler(formatDate(date), end_date)}
                clearIcon={null}
                value={start_date}
              />
              <span className="to-text">to</span>
              <DatePicker
                onChange={(date) =>
                  dateChangeHandler(start_date, formatDate(date))
                }
                minDate={new Date(start_date)}
                clearIcon={null}
                value={end_date}
              />
            </div>
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
    </>
  );
};

StorageTableFilter.propTypes = {
  start_date: PropTypes.string,
  end_date: PropTypes.string,
  type: PropTypes.string,
};

export default StorageTableFilter;
