import {
  Button,
  Form,
  FormGroup,
  Modal,
  ModalVariant,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
} from "@patternfly/react-core";
import { EyeIcon, EyeSlashIcon } from "@patternfly/react-icons";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Cookies from "universal-cookie";
import { TOGGLE_ROOT_MODAL } from "@/actions/types";
import { TextButton } from "@/components/atoms/Buttons/Buttons";
import { checkForRootPassword } from "@/actions/newExperiment";

const RootPasswordModal = () => {
  const dispatch = useDispatch();

  const cookies = new Cookies(null, { path: "/" });

  const [rootPassword, setRootPassword] = useState("");
  const [passwordType, setPasswordType] = useState("password");

  const { isRootModalOpen } = useSelector((state) => state.experiment);
  const handleChange = (_event, passwd) => {
    setRootPassword(passwd);
  };
  const setRootPasswd = () => {
    const today = new Date(); // get today's date
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    cookies.set("root-password", rootPassword, { expires: tomorrow });
    dispatch({ type: TOGGLE_ROOT_MODAL });
  };
  const togglePassword = () => {
    if (passwordType === "password") {
      setPasswordType("text");
      return;
    }
    setPasswordType("password");
  };
  return (
    <Modal
      className=""
      variant={ModalVariant.small}
      title="User Authentication"
      description="Podman commands can be run only by super user"
      isOpen={isRootModalOpen}
      onClose={() => dispatch(checkForRootPassword(false))}
    >
      <Form isWidthLimited>
        <FormGroup
          label="Super user password"
          isRequired
          fieldId="rootUserPasswd"
        >
          <TextInputGroup>
            <TextInputGroupMain
              value={rootPassword}
              isRequired
              type={passwordType}
              id="rootUserPasswd"
              name="rootUserPasswd"
              onChange={handleChange}
            />
            <TextInputGroupUtilities>
              <Button
                variant="plain"
                onClick={togglePassword}
                aria-label="Show or Hide password"
              >
                {passwordType === "password" ? <EyeSlashIcon /> : <EyeIcon />}
              </Button>
            </TextInputGroupUtilities>
          </TextInputGroup>
        </FormGroup>
        <div className="action-group-wrapper">
          <TextButton
            variant="primary"
            isBtnDisabled={!rootPassword}
            clickHandler={setRootPasswd}
            text={"Submit"}
          />
        </div>
      </Form>
    </Modal>
  );
};

export default RootPasswordModal;
