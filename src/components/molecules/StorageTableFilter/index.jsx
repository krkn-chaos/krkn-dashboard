import "react-date-picker/dist/DatePicker.css";
import "react-calendar/dist/Calendar.css";
import "./index.less";

import { Toolbar, ToolbarContent, ToolbarItem } from "@patternfly/react-core";
import {
  setAppliedFilters,
  setDateRange,
  setSelectedFilter,
} from "@/actions/storageActions.js";
import { useDispatch, useSelector } from "react-redux";

import DatePicker from "react-date-picker";
import { FilterIcon } from "@patternfly/react-icons";
import MultiSelectBox from "@/components/atoms/MultiSelectBox";
import PropTypes from "prop-types";
import React from "react";
import SelectBasic from "@/components/atoms/SelectBox/index";
import { formatDate } from "@/utils/helper";
import { useNavigate } from "react-router-dom";

const StorageTableFilter = (props) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { start_date, end_date } = props;
  const {
    filterData,
    categoryFilterValue,
    filterOptions,
    selectedFilters,
    appliedFilters,
  } = useSelector((state) => state.storage);
  const dateChangeHandler = (date, key) => {
    dispatch(setDateRange(date, key));
  };

  const getFilterCategory = (name) => {
    return filterData.filter((item) => item.name === name)?.[0]?.key;
  };
  const onOptionsChange = async () => {
    const selectedFilterObj = selectedFilters.reduce((acc, item) => {
      if (item.value.length > 0) {
        acc[item.key] = item.value;
      }
      return acc;
    }, {});
    const _ = await import("lodash");
    if (!_.isEqual(selectedFilterObj, appliedFilters)) {
      dispatch(setAppliedFilters(navigate));
    }
  };
  const updateSelectedFilter = (value) => {
    dispatch(setSelectedFilter(category, value));
  };
  const category =
    categoryFilterValue && getFilterCategory(categoryFilterValue);
  return (
    <>
      <Toolbar id="filter-toolbar" ouiaId="data_table_filter">
        <ToolbarContent className="field-filter">
          <ToolbarItem style={{ marginInlineEnd: 0 }}>
            <SelectBasic
              options={filterData}
              selected={categoryFilterValue || "Select the Category"}
              icon={<FilterIcon />}
              width={"200px"}
              type="test"
            />
          </ToolbarItem>
          <ToolbarItem>
            <MultiSelectBox
              options={filterOptions}
              onChange={updateSelectedFilter}
              applyMethod={onOptionsChange}
              currCategory={category}
              selected={selectedFilters?.find((i) => i.name === category)}
              width={"300px"}
            />
          </ToolbarItem>
        </ToolbarContent>

        <ToolbarContent className="date-filter" ouiaId="date_filter">
          <ToolbarItem>
            <DatePicker
              onChange={(date) => dateChangeHandler(formatDate(date), end_date)}
              clearIcon={null}
              value={start_date}
            />
          </ToolbarItem>
          <ToolbarItem variant="label" className="to-text">
            to
          </ToolbarItem>
          <ToolbarItem>
            <DatePicker
              onChange={(date) =>
                dateChangeHandler(start_date, formatDate(date))
              }
              minDate={new Date(start_date)}
              clearIcon={null}
              value={end_date}
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
    </>
  );
};

StorageTableFilter.propTypes = {
  start_date: PropTypes.string,
  end_date: PropTypes.string,
};
export default StorageTableFilter;
