import "react-date-picker/dist/DatePicker.css";
import "react-calendar/dist/Calendar.css";
import "./index.less";

import { Toolbar, ToolbarContent, ToolbarItem } from "@patternfly/react-core";

import DatePicker from "react-date-picker";
import PropTypes from "prop-types";
import React from "react";
import { formatDate } from "@/utils/helper";
import { setDateRange } from "@/actions/storageActions.js";
import { useDispatch } from "react-redux";

const StorageTableFilter = (props) => {
  const dispatch = useDispatch();
  const { start_date, end_date } = props;

  const dateChangeHandler = (date, key) => {
    dispatch(setDateRange(date, key));
  };

  return (
    <>
      <Toolbar id="filter-toolbar" ouiaId="data_table_filter">
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
