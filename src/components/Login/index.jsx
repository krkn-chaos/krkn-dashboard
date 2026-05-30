import "./index.less";

import {
  Alert,
  Button,
  Form,
  FormGroup,
  TextInput,
  Title,
} from "@patternfly/react-core";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import API from "@/utils/axiosInstance";
import { login } from "@/actions/authActions";

/** Dedupe hint fetch across React Strict Mode remounts. */
let initialLoginHintPromise = null;

function fetchInitialLoginHintOnce() {
  if (!initialLoginHintPromise) {
    initialLoginHintPromise = API.get("/auth/initial-login-hint")
      .then((res) => res.data)
      .catch(() => ({ available: false }));
  }
  return initialLoginHintPromise;
}

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [prefillNotice, setPrefillNotice] = useState(false);
  /** Block browser autofill until server hint is resolved */
  const [fieldsReady, setFieldsReady] = useState(false);
  useEffect(() => {
    let cancelled = false;

    fetchInitialLoginHintOnce().then((data) => {
      if (cancelled) return;
      if (data?.available && data.username && data.password) {
        setUsername(data.username);
        setPassword(data.password);
        setPrefillNotice(true);
      }
      setFieldsReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await dispatch(login(username, password));
      if (user) navigate("/");
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        "Invalid username or password";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__card">
        <Title headingLevel="h1" size="2xl" className="login-page__title">
          Krkn Dashboard
        </Title>
        <p className="login-page__subtitle">Sign in to continue</p>
        {prefillNotice ? (
          <Alert
            variant="info"
            isInline
            title="First-time setup"
            className="login-page__alert"
          >
            Initial admin credentials are filled in below. You can change your
            password later in Account Settings.
          </Alert>
        ) : null}
        {error ? (
          <Alert
            variant="danger"
            isInline
            title="Sign in failed"
            className="login-page__alert"
          >
            {error}
          </Alert>
        ) : null}
        <Form
          onSubmit={onSubmit}
          className="login-page__form"
          autoComplete="off"
        >
          <FormGroup label="Username" isRequired fieldId="username">
            <TextInput
              id="username"
              name="krkn-dashboard-username"
              value={username}
              isReadOnly={!fieldsReady}
              onChange={(_e, v) => {
                setUsername(v);
                if (error) setError("");
              }}
              autoComplete="off"
            />
          </FormGroup>
          <FormGroup label="Password" isRequired fieldId="password">
            <TextInput
              id="password"
              name="krkn-dashboard-password"
              type="password"
              value={password}
              isReadOnly={!fieldsReady}
              onChange={(_e, v) => {
                setPassword(v);
                if (error) setError("");
              }}
              autoComplete="new-password"
            />
          </FormGroup>
          <Button
            type="submit"
            variant="primary"
            className="login-page__submit"
            isDisabled={
              !fieldsReady || !username || !password || submitting
            }
            isLoading={submitting}
          >
            Sign in
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default Login;
