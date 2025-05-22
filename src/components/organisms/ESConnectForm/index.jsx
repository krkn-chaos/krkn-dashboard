import {
  ActionGroup,
  Form,
  FormGroup,
  TextInput,
} from "@patternfly/react-core";
import React, { useEffect, useState } from "react";

import { TextButton } from "@/components/atoms/Buttons/Buttons";
import { esConnect } from "@/actions/storageActions.js";
import { useDispatch } from "react-redux";

const formFields = [
  {
    id: 0,
    label: "ES instance",
    key: "host",
    describedby: "host URL",
    isPassword: false,
  },
  {
    id: 1,
    label: "Index",
    key: "index",
    describedby: "Index",
    isPassword: false,
  },
  {
    id: 2,
    label: "Username",
    key: "username",
    describedby: "Username",
    isPassword: false,
  },
  {
    id: 3,
    label: "Pasword",
    key: "password",
    describedby: "Password",
    isPassword: true,
  },
];
const ESConnectForm = () => {
  const dispatch = useDispatch();
  const [esForm, setEsForm] = useState({
    host: "",
    index: "",
    port: 9200,
    username: "",
    password: "",
    use_ssl: false,
  });
  const [isBtnDisabled, setIsBtnDisabled] = useState(true);

  useEffect(() => {
    const isHostValid = esForm.host.trim() !== "";
    setIsBtnDisabled(!isHostValid);
  }, [esForm]);

  const changeHandler = (_event, value, key) => {
    setEsForm((prevSatate) => ({
      ...prevSatate,
      [key]: value,
    }));
  };
  const connectToInstance = () => {
    dispatch(esConnect(esForm));
  };
  return (
    <Form>
      {formFields.map((field) => (
        <FormGroup key={field.id} label={field.label}>
          <TextInput
            isRequired
            type={field.isPassword ? "password" : "text"}
            id={`${field.key}-${field.index}`}
            name={field.key}
            aria-describedby="simple-form-name-02-helper"
            value={esForm[field.key]}
            onChange={(evt, val) => changeHandler(evt, val, field.key)}
          />
        </FormGroup>
      ))}
      <ActionGroup className="action-group-wrapper">
        <TextButton
          variant="primary"
          isBtnDisabled={isBtnDisabled}
          clickHandler={connectToInstance}
          text={"Connect to the instance"}
        />
      </ActionGroup>
    </Form>
  );
};

export default ESConnectForm;
