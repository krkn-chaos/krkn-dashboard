import { FormGroup, FormSelect, FormSelectOption } from "@patternfly/react-core";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchKubeconfigs } from "@/actions/authActions";

const KubeconfigSelect = ({ value, onChange, allowLegacyUpload }) => {
  const dispatch = useDispatch();
  const { kubeconfigs, user } = useSelector((state) => state.auth);

  const activeGroupId = useSelector((state) => state.auth.activeGroupId);

  useEffect(() => {
    if (user) dispatch(fetchKubeconfigs(activeGroupId || undefined));
  }, [dispatch, user, activeGroupId]);

  const visible = activeGroupId
    ? kubeconfigs.filter((k) => k.group_id === activeGroupId)
    : kubeconfigs;

  const options = [
    { value: "", label: "Select kubeconfig…", disabled: false },
    ...visible.map((k) => ({
      value: String(k.id),
      label: `${k.name} (${k.cluster_key})`,
    })),
  ];

  if (allowLegacyUpload) {
    options.push({ value: "legacy", label: "Use uploaded file (legacy)" });
  }

  return (
    <FormGroup label="Kubeconfig" fieldId="kubeconfig-select">
      <FormSelect
        id="kubeconfig-select"
        value={value ?? ""}
        onChange={(_e, v) => onChange(v)}
      >
        {options.map((opt) => (
          <FormSelectOption key={opt.value} value={opt.value} label={opt.label} />
        ))}
      </FormSelect>
    </FormGroup>
  );
};

export default KubeconfigSelect;
