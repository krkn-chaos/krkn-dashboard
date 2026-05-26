/** Shared password rules (keep in sync with server/auth/routes change-password). */

export const PASSWORD_REQUIREMENTS = [
  {
    id: "minLength",
    label: "At least 8 characters",
    test: (password) => String(password).length >= 8,
  },
  {
    id: "match",
    label: "Matches confirmation field",
    test: (password, confirmPassword) =>
      String(password).length > 0 &&
      String(password) === String(confirmPassword),
  },
];

export function getUnmetPasswordRequirements(
  password,
  confirmPassword,
  { requireCurrent = false, currentPassword = "" } = {}
) {
  const unmet = PASSWORD_REQUIREMENTS.filter(
    (rule) => !rule.test(password, confirmPassword)
  ).map((rule) => rule.label);

  if (requireCurrent && !String(currentPassword).trim()) {
    unmet.unshift("Current password is required");
  }

  if (String(password).length > 0 && !String(confirmPassword).length) {
    unmet.push("Confirmation password is required");
  }

  return [...new Set(unmet)];
}

export function passwordRequirementsMet(
  password,
  confirmPassword,
  options = {}
) {
  return getUnmetPasswordRequirements(password, confirmPassword, options)
    .length === 0;
}
