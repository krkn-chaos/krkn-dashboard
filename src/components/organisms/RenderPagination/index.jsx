import { Pagination, PaginationVariant } from "@patternfly/react-core";
import { setPage, setPageOptions } from "@/actions/storageActions";

import PropTypes from "prop-types";
import React from "react";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

const RenderPagination = (props) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const perPageOptions = [
    { title: "10", value: 10 },
    { title: "25", value: 25 },
    { title: "50", value: 50 },
    { title: "100", value: 100 },
  ];

  const onSetPage = useCallback(
    (_evt, newPage) => {
      dispatch(setPage(newPage));
    },
    [dispatch, navigate]
  );
  const onPerPageSelect = useCallback(
    (_evt, newPerPage, newPage) => {
      dispatch(setPageOptions(newPage, newPerPage));
    },
    [dispatch, navigate]
  );

  const onNextClick = useCallback(
    (_evt, newPage) => {
      console.log(newPage);
    },
    [dispatch, navigate]
  );
  return (
    <Pagination
      itemCount={props?.items}
      widgetId="pagination"
      perPage={props.perPage}
      page={props.page}
      variant={PaginationVariant.bottom}
      perPageOptions={perPageOptions}
      onSetPage={onSetPage}
      onPerPageSelect={onPerPageSelect}
      onPreviousClick={onNextClick}
      onNextClick={onNextClick}
      onPageInput={onNextClick}
      onFirstClick={onNextClick}
      onLastClick={onNextClick}
      ouiaId="data_table_pagination"
    />
  );
};

RenderPagination.propTypes = {
  page: PropTypes.number,
  perPage: PropTypes.number,
  items: PropTypes.number,
};
export default RenderPagination;
