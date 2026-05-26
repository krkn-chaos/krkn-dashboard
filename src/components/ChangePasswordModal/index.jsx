import "./index.less";

import {
  Alert,
  Button,
  Form,
  FormGroup,
  Modal,
  ModalVariant,
  TextInput,
  Tooltip,
} from "@patternfly/react-core";
import { HelpIcon } from "@patternfly/react-icons";
import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { changePassword } from "@/actions/authActions";
import {
  PASSWORD_REQUIREMENTS,
  getUnmetPasswordRequirements,
  passwordRequirementsMet,
} from "@/utils/passwordRules";

function RulesList({ items }) {
  return (
    <ul className="change-password-modal__rules-list">
      {items.map((text) => (
        <li key={text}>{text}</li>
      ))}
    </ul>
  );
}

const rulesTooltip = (
  <RulesList items={PASSWORD_REQUIREMENTS.map((r) => r.label)} />
);

const ChangePasswordModal = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const mustChange = Boolean(user?.mustChangePassword);
  const requireCurrent = !mustChange;

  const unmetRequirements = useMemo(
    () =>
      getUnmetPasswordRequirements(newPassword, confirmPassword, {
        requireCurrent,
        currentPassword,
      }),
    [newPassword, confirmPassword, requireCurrent, currentPassword]
  );

  const canSubmit = passwordRequirementsMet(newPassword, confirmPassword, {
    requireCurrent,
    currentPassword,
  });

  const submitTooltip =
    !canSubmit && unmetRequirements.length > 0 ? (
      <div>
        <strong>Still needed:</strong>
        <RulesList items={unmetRequirements} />
      </div>
    ) : null;

  const clearValidation = () => {
    if (validationErrors.length) setValidationErrors([]);
  };

  const handleSubmit = async () => {
    if (unmetRequirements.length) {
      setValidationErrors(unmetRequirements);
      return;
    }

    setValidationErrors([]);
    setSubmitting(true);
    try {
      await dispatch(changePassword(currentPassword, newPassword));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setSubmitting(false);
    }
  };

  if (!mustChange) {
    return null;
  }

  return (
    <Modal
      className="change-password-modal"
      variant={ModalVariant.small}
      title={
        <span className="change-password-modal__title-row">
          Change password
          <Tooltip content={rulesTooltip} maxWidth="20rem">
            <Button
              variant="plain"
              aria-label="Password requirements"
              className="change-password-modal__help-btn"
              type="button"
            >
              <HelpIcon />
            </Button>
          </Tooltip>
        </span>
      }
      isOpen
      showClose={false}
    >
      <p>You must set a new password before continuing.</p>
      {validationErrors.length > 0 ? (
        <Alert
          variant="warning"
          isInline
          title="Password requirements not met"
          className="change-password-modal__validation-alert"
        >
          <RulesList items={validationErrors} />
        </Alert>
      ) : null}
      <Form>
        {!mustChange ? (
          <FormGroup label="Current password" fieldId="current-password">
            <TextInput
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(_e, v) => {
                setCurrentPassword(v);
                clearValidation();
              }}
              autoComplete="current-password"
            />
          </FormGroup>
        ) : null}
        <FormGroup label="New password" fieldId="new-password">
          <TextInput
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(_e, v) => {
              setNewPassword(v);
              clearValidation();
            }}
            autoComplete="new-password"
          />
        </FormGroup>
        <FormGroup label="Confirm password" fieldId="confirm-password">
          <TextInput
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(_e, v) => {
              setConfirmPassword(v);
              clearValidation();
            }}
            autoComplete="new-password"
          />
        </FormGroup>
        {!canSubmit && !submitting ? (
          <Tooltip
            content={submitTooltip}
            maxWidth="20rem"
            isContentLeftAligned
            enableFlip
          >
            <span
              className="change-password-modal__submit-wrap"
              tabIndex={0}
            >
              <Button
                variant="primary"
                className="change-password-modal__submit"
                isDisabled
              >
                Update password
              </Button>
            </span>
          </Tooltip>
        ) : (
          <Button
            variant="primary"
            className="change-password-modal__submit"
            isDisabled={!canSubmit}
            isLoading={submitting}
            onClick={handleSubmit}
          >
            Update password
          </Button>
        )}
      </Form>
    </Modal>
  );
};

export default ChangePasswordModal;
