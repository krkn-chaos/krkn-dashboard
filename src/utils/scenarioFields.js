/**
 * Converts a single krkn-hub krknctl-input.json field definition into the
 * shape the NewExperiment form expects. This is the single source of truth
 * for the mapping — no manual field list needed in experimentFormData.js.
 */
export function hubFieldToDashboard(hubField) {
  const key = hubField.variable.toLowerCase();
  const isEnum = hubField.type === "enum";
  const isNumeric = hubField.type === "number" || hubField.type === "int" || hubField.type === "integer" || hubField.type === "float";
  const allowedValues =
    isEnum && hubField.allowed_values
      ? hubField.allowed_values.split(",").map((v) => v.trim()).filter(Boolean)
      : null;
  return {
    key,
    label: hubField.short_description || hubField.name || key,
    fieldId: `${key}-id`,
    ariaDescribedby: key.replace(/_/g, " "),
    helperText: hubField.description || "",
    isRequired: hubField.required === "true" || hubField.required === true,
    defaultValue: hubField.default ?? "",
    allowedValues,
    isNumeric,
    validator: hubField.validator || null,
    validationMessage: hubField.validation_message || null,
    inputType: isEnum ? "enum" : isNumeric ? "number" : hubField.secret ? "password" : "text",
  };
}

/**
 * The "name" / Container Run Name field is dashboard-only — krkn-hub has no
 * equivalent. Prepend it to every scenario's field list.
 */
export const CONTAINER_RUN_NAME_FIELD = {
  key: "name",
  label: "Container Run Name",
  fieldId: "name-id",
  ariaDescribedby: "name",
  helperText: "",
  isRequired: true,
  defaultValue: "",
  validator: null,
  validationMessage: null,
  inputType: "text",
};

/**
 * Extra dashboard-only fields appended after krkn-hub fields, keyed by scenario.
 * Add entries here when a scenario needs a field that has no krkn-hub equivalent.
 */
export const DASHBOARD_EXTRA_FIELDS = {
  "pvc-scenarios": [
    {
      key: "block_size",
      label: "Block Size",
      fieldId: "block_size-id",
      ariaDescribedby: "block size",
      helperText: "Used by dd if fallocate is not present in the container",
      isRequired: false,
      defaultValue: "",
      validator: null,
      validationMessage: null,
      inputType: "text",
    },
  ],
};
