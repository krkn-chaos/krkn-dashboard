export function hubFieldToDashboard(hubField) {
  const key = hubField.variable.toLowerCase();
  const isEnum = hubField.type === "enum";
  const isNumeric =
    hubField.type === "number" ||
    hubField.type === "int" ||
    hubField.type === "integer" ||
    hubField.type === "float";
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

export const CONTAINER_RUN_NAME_FIELD = {
  key: "name",
  label: "Container Run Name",
  fieldId: "name-id",
  ariaDescribedby: "name",
  helperText: "",
  isRequired: true,
  defaultValue: "",
  allowedValues: null,
  isNumeric: false,
  validator: null,
  validationMessage: null,
  inputType: "text",
};

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
      allowedValues: null,
      isNumeric: false,
      validator: null,
      validationMessage: null,
      inputType: "text",
    },
  ],
};
