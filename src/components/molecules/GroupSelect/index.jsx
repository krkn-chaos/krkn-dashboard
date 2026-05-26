import { FormGroup, FormSelect, FormSelectOption } from "@patternfly/react-core";
import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { setActiveGroupId } from "@/actions/authActions";

const GroupSelect = ({ onGroupChange }) => {
  const dispatch = useDispatch();
  const { groups, activeGroupId } = useSelector((state) => state.auth);

  if (!groups.length) {
    return (
      <FormGroup label="Group" fieldId="run-group-select">
        <p className="pf-v5-u-color-200 pf-v5-u-font-size-sm">
          You are not a member of any group. Ask a platform admin to add you to
          a group before running experiments.
        </p>
      </FormGroup>
    );
  }

  return (
    <FormGroup label="Group" fieldId="run-group-select" isRequired>
      <FormSelect
        id="run-group-select"
        value={activeGroupId != null ? String(activeGroupId) : ""}
        onChange={(_e, v) => {
          const id = v ? parseInt(v, 10) : null;
          dispatch(setActiveGroupId(id));
          onGroupChange?.(id);
        }}
      >
        {groups.map((g) => (
          <FormSelectOption key={g.id} value={String(g.id)} label={g.name} />
        ))}
      </FormSelect>
    </FormGroup>
  );
};

export default GroupSelect;
