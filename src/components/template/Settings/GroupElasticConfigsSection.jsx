import {
  Button,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Modal,
  ModalVariant,
  TextInput,
  Title,
} from "@patternfly/react-core";
import {
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import API from "@/utils/axiosInstance";
import { showToast } from "@/actions/toastActions";

const emptyForm = () => ({
  name: "",
  host: "",
  port: "9200",
  username: "",
  password: "",
  telemetryIndex: "krkn-telemetry",
  metricsIndex: "krkn-metrics",
  alertsIndex: "krkn-alerts",
  grafanaUrl: "",
});

const ConfigForm = ({ form, setField, idPrefix, omitPassword }) => (
  <>
    <FormGroup label="Display name" fieldId={`${idPrefix}-name`} isRequired>
      <TextInput
        id={`${idPrefix}-name`}
        value={form.name}
        onChange={(_e, v) => setField("name", v)}
      />
    </FormGroup>
    <FormGroup label="Host" fieldId={`${idPrefix}-host`} isRequired>
      <TextInput
        id={`${idPrefix}-host`}
        value={form.host}
        placeholder="https://my-es-host"
        onChange={(_e, v) => setField("host", v)}
      />
    </FormGroup>
    <FormGroup label="Port" fieldId={`${idPrefix}-port`}>
      <TextInput
        id={`${idPrefix}-port`}
        type="number"
        value={form.port}
        onChange={(_e, v) => setField("port", v)}
      />
    </FormGroup>
    <FormGroup label="Username" fieldId={`${idPrefix}-username`}>
      <TextInput
        id={`${idPrefix}-username`}
        value={form.username}
        onChange={(_e, v) => setField("username", v)}
      />
    </FormGroup>
    {!omitPassword && (
      <FormGroup label="Password" fieldId={`${idPrefix}-password`}>
        <TextInput
          id={`${idPrefix}-password`}
          type="password"
          value={form.password}
          onChange={(_e, v) => setField("password", v)}
        />
      </FormGroup>
    )}
    <FormGroup label="Telemetry Index" fieldId={`${idPrefix}-telemetry-index`}>
      <TextInput
        id={`${idPrefix}-telemetry-index`}
        value={form.telemetryIndex}
        onChange={(_e, v) => setField("telemetryIndex", v)}
      />
    </FormGroup>
    <FormGroup label="Metrics Index" fieldId={`${idPrefix}-metrics-index`}>
      <TextInput
        id={`${idPrefix}-metrics-index`}
        value={form.metricsIndex}
        onChange={(_e, v) => setField("metricsIndex", v)}
      />
    </FormGroup>
    <FormGroup label="Alerts Index" fieldId={`${idPrefix}-alerts-index`}>
      <TextInput
        id={`${idPrefix}-alerts-index`}
        value={form.alertsIndex}
        onChange={(_e, v) => setField("alertsIndex", v)}
      />
    </FormGroup>
    <FormGroup label="Grafana URL" fieldId={`${idPrefix}-grafana-url`}>
      <TextInput
        id={`${idPrefix}-grafana-url`}
        value={form.grafanaUrl}
        placeholder="Optional — e.g. https://grafana.example.com/d/abc"
        onChange={(_e, v) => setField("grafanaUrl", v)}
      />
    </FormGroup>
  </>
);

const GroupElasticConfigsSection = () => {
  const dispatch = useDispatch();
  const [groups, setGroups] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [form, setForm] = useState(emptyForm());
  const [editingConfig, setEditingConfig] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm());
  const [showPasswordEdit, setShowPasswordEdit] = useState(false);

  const load = useCallback(async () => {
    const [gRes, cRes] = await Promise.all([
      API.get("/auth/groups/mine"),
      API.get("/auth/elasticsearch-configs"),
    ]);
    setGroups(gRes.data.groups || []);
    setConfigs(cRes.data.configs || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const setEditField = (key, value) => setEditForm((prev) => ({ ...prev, [key]: value }));

  const openEdit = (c) => {
    setEditingConfig(c);
    setShowPasswordEdit(false);
    setEditForm({
      name: c.name ?? "",
      host: c.host ?? "",
      port: String(c.port ?? 9200),
      username: c.username ?? "",
      password: "",
      telemetryIndex: c.telemetry_index ?? "",
      metricsIndex: c.metrics_index ?? "",
      alertsIndex: c.alerts_index ?? "",
      grafanaUrl: c.grafana_url ?? "",
    });
  };

  const closeEdit = () => { setEditingConfig(null); setShowPasswordEdit(false); };

  const save = async () => {
    if (!form.name.trim() || !form.host.trim() || !selectedGroupId) {
      dispatch(showToast("warning", "Name, host, and group are required"));
      return;
    }
    try {
      await API.post("/auth/elasticsearch-configs", { ...form, groupId: selectedGroupId });
      dispatch(showToast("success", "Elasticsearch config saved"));
      setForm(emptyForm());
      load();
    } catch (e) {
      dispatch(showToast("danger", "Save failed", e.response?.data?.error));
    }
  };

  const saveEdit = async () => {
    if (!editForm.name.trim() || !editForm.host.trim()) {
      dispatch(showToast("warning", "Name and host are required"));
      return;
    }
    try {
      await API.patch(`/auth/elasticsearch-configs/${editingConfig.id}`, editForm);
      dispatch(showToast("success", "Config updated"));
      closeEdit();
      load();
    } catch (e) {
      dispatch(showToast("danger", "Update failed", e.response?.data?.error));
    }
  };

  const remove = async (id) => {
    try {
      await API.delete(`/auth/elasticsearch-configs/${id}`);
      dispatch(showToast("success", "Config deleted"));
      load();
    } catch (e) {
      dispatch(showToast("danger", "Delete failed", e.response?.data?.error));
    }
  };

  const filtered = selectedGroupId
    ? configs.filter((c) => c.group_id === parseInt(selectedGroupId, 10))
    : configs;

  if (groups.length === 0) return null;

  return (
    <section className="settings-page__account" style={{ marginTop: "2rem" }}>
      <Title headingLevel="h2" size="lg">
        Group Elasticsearch configs
      </Title>
      <p className="settings-page__hint">
        Save Elasticsearch connection details for groups you belong to. Saved
        configs can be selected from the Analysis view without re-entering
        credentials each time.
      </p>

      <Form className="settings-form">
        <FormGroup label="Group" fieldId="es-group">
          <FormSelect
            id="es-group"
            value={selectedGroupId}
            onChange={(_e, v) => setSelectedGroupId(v)}
          >
            <FormSelectOption value="" label="Select group…" />
            {groups.map((g) => (
              <FormSelectOption
                key={g.id}
                value={String(g.id)}
                label={`${g.name} (${g.groupRole})`}
              />
            ))}
          </FormSelect>
        </FormGroup>
        <ConfigForm form={form} setField={setField} idPrefix="es-new" />
        <Button onClick={save}>Save config</Button>
      </Form>

      {configs.length > 0 && (
        <Table
          aria-label="Saved Elasticsearch configs"
          variant="compact"
          style={{ marginTop: "1rem" }}
        >
          <Thead>
            <Tr>
              <Th>Group</Th>
              <Th>Name</Th>
              <Th>Host</Th>
              <Th>Username</Th>
              <Th>Password</Th>
              <Th>Telemetry Index</Th>
              <Th>Metrics Index</Th>
              <Th>Alerts Index</Th>
              <Th>Grafana URL</Th>
              <Th />
            </Tr>
          </Thead>
          <Tbody>
            {filtered.map((c) => (
              <Tr key={c.id}>
                <Td>{c.group_name}</Td>
                <Td>{c.name}</Td>
                <Td>{c.host}</Td>
                <Td>{c.username || "—"}</Td>
                <Td>{c.password ? "••••••••" : "—"}</Td>
                <Td>{c.telemetry_index || "—"}</Td>
                <Td>{c.metrics_index || "—"}</Td>
                <Td>{c.alerts_index || "—"}</Td>
                <Td>
                  {c.grafana_url
                    ? <a href={c.grafana_url} target="_blank" rel="noreferrer">{c.grafana_url}</a>
                    : "—"}
                </Td>
                <Td>
                  <Button variant="link" onClick={() => openEdit(c)}>Edit</Button>
                  <Button variant="plain" onClick={() => remove(c.id)}>Delete</Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      <Modal
        variant={ModalVariant.medium}
        title={`Edit — ${editingConfig?.name ?? ""}`}
        isOpen={Boolean(editingConfig)}
        onClose={closeEdit}
      >
        <Form>
          <ConfigForm form={editForm} setField={setEditField} idPrefix="es-edit" omitPassword />
          <FormGroup label="Password" fieldId="es-edit-password">
            {editingConfig?.password && !showPasswordEdit ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span
                  style={{
                    fontFamily: "monospace",
                    letterSpacing: "0.15em",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    pointerEvents: "none",
                    color: "var(--pf-v5-global--Color--100)",
                  }}
                  aria-label="Password is set"
                >
                  ••••••••
                </span>
                <Button variant="link" isInline onClick={() => { setShowPasswordEdit(true); setEditField("password", ""); }}>
                  Change password
                </Button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <TextInput
                  id="es-edit-password"
                  type="password"
                  value={editForm.password}
                  placeholder="Enter new password"
                  onChange={(_e, v) => setEditField("password", v)}
                  style={{ flex: 1 }}
                />
                {editingConfig?.password && (
                  <Button variant="link" isInline onClick={() => { setShowPasswordEdit(false); setEditField("password", ""); }}>
                    Cancel
                  </Button>
                )}
              </div>
            )}
          </FormGroup>
          <div className="settings-page__modal-actions">
            <Button variant="link" onClick={closeEdit}>Cancel</Button>
            <Button onClick={saveEdit}>Save changes</Button>
          </div>
        </Form>
      </Modal>
    </section>
  );
};

export default GroupElasticConfigsSection;
