// Assisted-by: Cursor:Codex5.3
import "./index.less";

import { Title } from "@patternfly/react-core";
import React from "react";

import AccountSettings from "./AccountSettings";

const Settings = () => (
  <div className="settings-page">
    <Title headingLevel="h1" size="2xl" className="settings-page__title">
      Account Settings
    </Title>
    <AccountSettings />
  </div>
);

export default Settings;
