import {
  Alert,
  Button,
  Form,
  FormGroup,
  TextInput,
  Tooltip,
} from "@patternfly/react-core";
import { HelpIcon } from "@patternfly/react-icons";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { updateAccount } from "@/actions/authActions";
import GroupKubeconfigsSection from "./GroupKubeconfigsSection";
import GroupElasticConfigsSection from "./GroupElasticConfigsSection";
import {
  PASSWORD_REQUIREMENTS,
  getUnmetPasswordRequirements,
  passwordRequirementsMet,
} from "@/utils/passwordRules";

function RulesList({ items }) {
  return (
    <ul className="settings-page__rules-list">
      {items.map((text) => (
        <li key={text}>{text}</li>
      ))}
    </ul>
  );
}

const rulesTooltip = (
  <RulesList items={PASSWORD_REQUIREMENTS.map((r) => r.label)} />
);

const AccountSettings = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [username, setUsername] = useState(user?.username || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setUsername(user?.username || "");
  }, [user?.username]);

  const usernameChanged =
    username.trim().toLowerCase() !== (user?.username || "").toLowerCase();
  const passwordChanged = newPassword.length > 0 || confirmPassword.length > 0;
  const requireCurrent = usernameChanged || passwordChanged;

  const unmetRequirements = useMemo(() => {
    const unmet = [];
    if (!username.trim()) {
      unmet.push("Username is required");
    }
    if (passwordChanged) {
      unmet.push(
        ...getUnmetPasswordRequirements(newPassword, confirmPassword, {
          requireCurrent,
          currentPassword,
        })
      );
    } else if (requireCurrent && !String(currentPassword).trim()) {
      unmet.push("Current password is required");
    }
    return [...new Set(unmet)];
  }, [
    username,
    newPassword,
    confirmPassword,
    requireCurrent,
    currentPassword,
    passwordChanged,
  ]);

  const canSubmit =
    (usernameChanged || passwordChanged) &&
    (passwordChanged
      ? passwordRequirementsMet(newPassword, confirmPassword, {
          requireCurrent,
          currentPassword,
        }) && username.trim().length > 0
      : username.trim().length > 0 &&
        (!requireCurrent || String(currentPassword).trim().length > 0));

  const handleSubmit = async () => {
    if (!usernameChanged && !passwordChanged) {
      setSubmitError("Change your username or password before saving.");
      return;
    }
    if (unmetRequirements.length) {
      setValidationErrors(unmetRequirements);
      setSubmitError("");
      return;
    }

    setValidationErrors([]);
    setSubmitError("");
    setSubmitting(true);
    try {
      const payload = { currentPassword };
      if (usernameChanged) payload.username = username.trim();
      if (passwordChanged) payload.newPassword = newPassword;
      await dispatch(updateAccount(payload));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setSubmitError(e.response?.data?.error || e.message || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="settings-page__account">
      <p className="settings-page__hint">
        Update your sign-in username and password. Your current password is
        required when changing either.
      </p>
      {submitError ? (
        <Alert variant="danger" isInline title={submitError} />
      ) : null}
      {validationErrors.length > 0 ? (
        <Alert
          variant="warning"
          isInline
          title="Please fix the following"
          className="settings-page__account-alert"
        >
          <RulesList items={validationErrors} />
        </Alert>
      ) : null}
      <Form className="settings-form">
        <FormGroup label="Username" fieldId="account-username" isRequired>
          <TextInput
            id="account-username"
            value={username}
            onChange={(_e, v) => {
              setUsername(v);
              setSubmitError("");
            }}
            autoComplete="username"
          />
        </FormGroup>
        <FormGroup label="Current password" fieldId="account-current-password">
          <TextInput
            id="account-current-password"
            type="password"
            value={currentPassword}
            onChange={(_e, v) => {
              setCurrentPassword(v);
              setSubmitError("");
            }}
            autoComplete="current-password"
          />
        </FormGroup>
        <FormGroup
          label={
            <span className="settings-page__label-with-help">
              New password
              <Tooltip content={rulesTooltip} maxWidth="20rem">
                <Button
                  variant="plain"
                  aria-label="Password requirements"
                  className="settings-page__help-btn"
                  type="button"
                >
                  <HelpIcon />
                </Button>
              </Tooltip>
            </span>
          }
          fieldId="account-new-password"
        >
          <TextInput
            id="account-new-password"
            type="password"
            value={newPassword}
            onChange={(_e, v) => {
              setNewPassword(v);
              setSubmitError("");
            }}
            autoComplete="new-password"
            placeholder="Leave blank to keep current password"
          />
        </FormGroup>
        <FormGroup label="Confirm new password" fieldId="account-confirm-password">
          <TextInput
            id="account-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(_e, v) => {
              setConfirmPassword(v);
              setSubmitError("");
            }}
            autoComplete="new-password"
          />
        </FormGroup>
        <Button
          variant="primary"
          onClick={handleSubmit}
          isDisabled={!canSubmit}
          isLoading={submitting}
        >
          Save account
        </Button>
      </Form>
      {user?.role === "user" ? <GroupKubeconfigsSection /> : null}
      {user?.role === "user" ? <GroupElasticConfigsSection /> : null}
    </section>
  );
};

export default AccountSettings;
