// Assisted-by: Cursor:Codex5.3
import "./index.less";

import {
  Button,
  Checkbox,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Modal,
  ModalVariant,
  Tab,
  Tabs,
  TabTitleText,
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
import { useDispatch, useSelector } from "react-redux";
import API from "@/utils/axiosInstance";
import { fetchAdminGroups, fetchKubeconfigs } from "@/actions/authActions";
import { showToast } from "@/actions/toastActions";
import GroupDetailPanel from "./GroupDetailPanel";
import {
  formatGroupMemberships,
  groupRoleOptionsForPlatformRole,
} from "./groupRoleOptions";

const Administration = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [kubeconfigs, setKubeconfigs] = useState([]);
  const [audit, setAudit] = useState([]);

  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "user",
    groupMemberships: {},
  });
  const [newGroup, setNewGroup] = useState({ name: "", description: "" });
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [kubeconfigUploadGroupId, setKubeconfigUploadGroupId] = useState("");
  const [kubeconfigFilterGroupId, setKubeconfigFilterGroupId] = useState("");
  const [elasticConfigs, setElasticConfigs] = useState([]);
  const [elasticFilterGroupId, setElasticFilterGroupId] = useState("");
  const emptyElasticForm = () => ({ name: "", host: "", port: "9200", username: "", password: "", telemetryIndex: "krkn-telemetry", metricsIndex: "krkn-metrics", alertsIndex: "krkn-alerts", grafanaUrl: "" });
  const [elasticForm, setElasticForm] = useState(emptyElasticForm);
  const [editingElasticConfig, setEditingElasticConfig] = useState(null);
  const [editElasticForm, setEditElasticForm] = useState(emptyElasticForm);
  const [showElasticPasswordEdit, setShowElasticPasswordEdit] = useState(false);
  const [kubeconfigName, setKubeconfigName] = useState("");
  const [kubeconfigFile, setKubeconfigFile] = useState(null);
  const [editingKubeconfig, setEditingKubeconfig] = useState(null);
  const [editingKubeconfigName, setEditingKubeconfigName] = useState("");
  const [editGroupsUser, setEditGroupsUser] = useState(null);
  const [editGroupMemberships, setEditGroupMemberships] = useState({});

  const loadAll = useCallback(async () => {
    const [u, k, es, a] = await Promise.all([
      API.get("/auth/users"),
      API.get("/auth/kubeconfigs"),
      API.get("/auth/elasticsearch-configs"),
      API.get("/auth/audit"),
    ]);
    setUsers(u.data.users || []);
    setKubeconfigs(k.data.kubeconfigs || []);
    setAudit(a.data.events || []);
    setElasticConfigs(es.data.configs || []);
    const g = await dispatch(fetchAdminGroups());
    setGroups(g || []);
    await dispatch(fetchKubeconfigs());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedGroupId) {
      loadAll();
    }
  }, [selectedGroupId, loadAll]);

  const handleTabSelect = (_event, tabIndex) => {
    setActiveTab(tabIndex);
    loadAll();
  };

  const handleBackFromGroup = () => {
    setSelectedGroupId(null);
  };

  const openGroupDetail = async (groupId) => {
    await loadAll();
    setSelectedGroupId(groupId);
  };

  const toggleNewUserGroup = (groupId, checked) => {
    setNewUser((prev) => {
      const next = { ...prev.groupMemberships };
      if (checked) next[groupId] = next[groupId] || "user";
      else delete next[groupId];
      return { ...prev, groupMemberships: next };
    });
  };

  const setNewUserGroupRole = (groupId, role) => {
    setNewUser((prev) => ({
      ...prev,
      groupMemberships: { ...prev.groupMemberships, [groupId]: role },
    }));
  };

  const buildMembershipsPayload = (membershipsMap) =>
    Object.entries(membershipsMap || {}).map(([groupId, role]) => ({
      groupId: parseInt(groupId, 10),
      role,
    }));

  const createUser = async () => {
    await API.post("/auth/users", {
      username: newUser.username,
      password: newUser.password,
      role: newUser.role,
      groupMemberships: buildMembershipsPayload(newUser.groupMemberships),
    });
    dispatch(showToast("success", "User created"));
    setNewUser({
      username: "",
      password: "",
      role: "user",
      groupMemberships: {},
    });
    await loadAll();
  };

  const createGroup = async () => {
    await API.post("/auth/groups", newGroup);
    dispatch(showToast("success", "Group created"));
    setNewGroup({ name: "", description: "" });
    await loadAll();
  };

  const openEditGroups = (u) => {
    setEditGroupsUser(u);
    const map = {};
    (u.groupMemberships || []).forEach((m) => {
      map[m.groupId] = m.role;
    });
    setEditGroupMemberships(map);
  };

  const toggleEditGroup = (groupId, checked) => {
    setEditGroupMemberships((prev) => {
      const next = { ...prev };
      if (checked) next[groupId] = next[groupId] || "user";
      else delete next[groupId];
      return next;
    });
  };

  const setEditGroupRole = (groupId, role) => {
    setEditGroupMemberships((prev) => ({ ...prev, [groupId]: role }));
  };

  const closeEditGroupsModal = () => setEditGroupsUser(null);

  const saveUserGroups = async () => {
    if (!editGroupsUser) return;
    try {
      await API.patch(`/auth/users/${editGroupsUser.id}`, {
        groupMemberships: buildMembershipsPayload(editGroupMemberships),
      });
      dispatch(showToast("success", "Groups updated"));
      setEditGroupsUser(null);
      await loadAll();
    } catch (e) {
      dispatch(
        showToast("danger", "Failed to update groups", e.response?.data?.error)
      );
    }
  };

  const handleAdminChanged = async () => {
    await loadAll();
  };

  const uploadKubeconfig = async () => {
    if (!kubeconfigFile || !kubeconfigUploadGroupId || !kubeconfigName.trim()) {
      dispatch(
        showToast("warning", "Select a group, enter a name, and choose a file")
      );
      return;
    }
    try {
      const form = new FormData();
      form.append("file", kubeconfigFile);
      form.append("name", kubeconfigName.trim());
      form.append("groupId", String(kubeconfigUploadGroupId));
      await API.post("/auth/kubeconfigs", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      dispatch(showToast("success", "Kubeconfig uploaded"));
      setKubeconfigFile(null);
      setKubeconfigName("");
      await loadAll();
    } catch (e) {
      dispatch(
        showToast("danger", "Upload failed", e.response?.data?.error)
      );
    }
  };

  const saveKubeconfigRename = async () => {
    if (!editingKubeconfig || !editingKubeconfigName.trim()) return;
    try {
      await API.patch(`/auth/kubeconfigs/${editingKubeconfig.id}`, {
        name: editingKubeconfigName.trim(),
      });
      dispatch(showToast("success", "Kubeconfig renamed"));
      setEditingKubeconfig(null);
      await loadAll();
    } catch (e) {
      dispatch(
        showToast("danger", "Rename failed", e.response?.data?.error)
      );
    }
  };

  const deleteKubeconfig = async (id) => {
    try {
      await API.delete(`/auth/kubeconfigs/${id}`);
      dispatch(showToast("success", "Kubeconfig deleted"));
      await loadAll();
    } catch (e) {
      dispatch(
        showToast("danger", "Delete failed", e.response?.data?.error)
      );
    }
  };

  const memberGroupIds = new Set(
    (user?.groupMemberships || []).map((m) => m.groupId)
  );
  const uploadableGroups = groups.filter((g) => memberGroupIds.has(g.id));
  const filteredKubeconfigs = kubeconfigFilterGroupId
    ? kubeconfigs.filter(
      (k) => k.group_id === parseInt(kubeconfigFilterGroupId, 10)
    )
    : kubeconfigs;

  const setElasticField = (key, value) =>
    setElasticForm((prev) => ({ ...prev, [key]: value }));

  const saveElasticConfig = async () => {
    if (!elasticForm.name.trim() || !elasticForm.host.trim() || !elasticForm.groupId) {
      dispatch(showToast("warning", "Name, host, and group are required"));
      return;
    }
    try {
      await API.post("/auth/elasticsearch-configs", {
        ...elasticForm,
        groupId: elasticForm.groupId,
      });
      dispatch(showToast("success", "Elasticsearch config saved"));
      setElasticForm(emptyElasticForm());
      await loadAll();
    } catch (e) {
      dispatch(showToast("danger", "Save failed", e.response?.data?.error));
    }
  };

  const deleteElasticConfig = async (id) => {
    try {
      await API.delete(`/auth/elasticsearch-configs/${id}`);
      dispatch(showToast("success", "Config deleted"));
      await loadAll();
    } catch (e) {
      dispatch(showToast("danger", "Delete failed", e.response?.data?.error));
    }
  };

  const openEditElastic = (c) => {
    setEditingElasticConfig(c);
    setShowElasticPasswordEdit(false);
    setEditElasticForm({
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

  const closeEditElastic = () => { setEditingElasticConfig(null); setShowElasticPasswordEdit(false); };

  const saveEditElastic = async () => {
    if (!editElasticForm.name.trim() || !editElasticForm.host.trim()) {
      dispatch(showToast("warning", "Name and host are required"));
      return;
    }
    try {
      await API.patch(`/auth/elasticsearch-configs/${editingElasticConfig.id}`, editElasticForm);
      dispatch(showToast("success", "Config updated"));
      closeEditElastic();
      await loadAll();
    } catch (e) {
      dispatch(showToast("danger", "Update failed", e.response?.data?.error));
    }
  };

  const filteredElasticConfigs = elasticFilterGroupId
    ? elasticConfigs.filter(
      (c) => c.group_id === parseInt(elasticFilterGroupId, 10)
    )
    : elasticConfigs;

  return (
    <div className="settings-page">
      <Title headingLevel="h1" size="2xl" className="settings-page__title">
        Administration
      </Title>
      <Tabs
        className="settings-page__tabs"
        activeKey={activeTab}
        onSelect={handleTabSelect}
      >
        <Tab eventKey={0} title={<TabTitleText>Users</TabTitleText>}>
          <Form className="settings-form">
            <FormGroup label="Username" isRequired>
              <TextInput
                value={newUser.username}
                onChange={(_e, v) => setNewUser({ ...newUser, username: v })}
              />
            </FormGroup>
            <FormGroup label="Password" isRequired>
              <TextInput
                type="password"
                value={newUser.password}
                onChange={(_e, v) => setNewUser({ ...newUser, password: v })}
              />
            </FormGroup>
            <FormGroup label="Platform role" fieldId="new-user-role" isRequired>
              <FormSelect
                id="new-user-role"
                value={newUser.role}
                onChange={(_e, v) => {
                  setNewUser((prev) => {
                    const memberships = { ...prev.groupMemberships };
                    if (v === "user") {
                      for (const gid of Object.keys(memberships)) {
                        if (memberships[gid] === "admin") memberships[gid] = "user";
                      }
                    }
                    return { ...prev, role: v, groupMemberships: memberships };
                  });
                }}
              >
                <FormSelectOption value="user" label="User" />
                <FormSelectOption value="admin" label="Admin" />
              </FormSelect>
            </FormGroup>
            <FormGroup label="Group membership" fieldId="new-user-groups">
              {groups.length === 0 ? (
                <p className="settings-page__hint">
                  No groups yet. Create a group on the Groups tab first.
                </p>
              ) : (
                <div className="settings-page__group-memberships">
                  {groups.map((g) => {
                    const checked = Boolean(newUser.groupMemberships[g.id]);
                    return (
                      <div key={g.id} className="settings-page__group-membership-row">
                        <Checkbox
                          id={`new-user-group-${g.id}`}
                          label={g.name}
                          isChecked={checked}
                          onChange={(_e, c) => toggleNewUserGroup(g.id, c)}
                        />
                        {checked ? (
                          <FormSelect
                            aria-label={`Role in ${g.name}`}
                            value={newUser.groupMemberships[g.id] || "user"}
                            onChange={(_e, v) => setNewUserGroupRole(g.id, v)}
                          >
                            {groupRoleOptionsForPlatformRole(newUser.role).map(
                              (o) => (
                                <FormSelectOption
                                  key={o.value}
                                  value={o.value}
                                  label={o.label}
                                />
                              )
                            )}
                          </FormSelect>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </FormGroup>
            <Button onClick={createUser}>Create user</Button>
          </Form>
          <Table aria-label="Users">
            <Thead>
              <Tr>
                <Th>Username</Th>
                <Th>Role</Th>
                <Th>Groups (role)</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.map((u) => (
                <Tr key={u.id}>
                  <Td>{u.username}</Td>
                  <Td>{u.role}</Td>
                  <Td>
                    {formatGroupMemberships(u.groupMemberships, groups)}
                  </Td>
                  <Td>
                    <Button variant="link" onClick={() => openEditGroups(u)}>
                      Edit groups
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Tab>
        <Tab eventKey={1} title={<TabTitleText>Groups</TabTitleText>}>
          {selectedGroupId ? (
            <GroupDetailPanel
              groupId={selectedGroupId}
              allUsers={users}
              onBack={handleBackFromGroup}
              onChanged={handleAdminChanged}
            />
          ) : (
            <>
              <Form className="settings-form">
                <FormGroup label="Name" isRequired>
                  <TextInput
                    value={newGroup.name}
                    onChange={(_e, v) => setNewGroup({ ...newGroup, name: v })}
                  />
                </FormGroup>
                <FormGroup label="Description">
                  <TextInput
                    value={newGroup.description}
                    onChange={(_e, v) =>
                      setNewGroup({ ...newGroup, description: v })
                    }
                  />
                </FormGroup>
                <Button onClick={createGroup}>Create group</Button>
              </Form>
              <Table aria-label="Groups" variant="compact">
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Description</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {groups.map((g) => (
                    <Tr
                      key={g.id}
                      className="settings-page__clickable-row"
                      onClick={() => openGroupDetail(g.id)}
                    >
                      <Td>
                        <Button variant="link" isInline>
                          {g.name}
                        </Button>
                      </Td>
                      <Td>{g.description || "—"}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </>
          )}
        </Tab>
        <Tab eventKey={2} title={<TabTitleText>Kubeconfigs</TabTitleText>}>
          <p className="settings-page__hint">
            Kubeconfigs are shared per group. Only members of a group can view,
            upload, rename, or delete that group&apos;s kubeconfigs.
          </p>
          <Form className="settings-form">
            <FormGroup label="Group" fieldId="kubeconfig-upload-group" isRequired>
              <FormSelect
                id="kubeconfig-upload-group"
                value={kubeconfigUploadGroupId}
                onChange={(_e, v) => setKubeconfigUploadGroupId(v)}
              >
                <FormSelectOption value="" label="Select group…" />
                {uploadableGroups.map((g) => (
                  <FormSelectOption
                    key={g.id}
                    value={String(g.id)}
                    label={g.name}
                  />
                ))}
              </FormSelect>
            </FormGroup>
            {uploadableGroups.length === 0 ? (
              <p className="settings-page__hint">
                Join a group (or add yourself on the Users tab) to upload
                kubeconfigs.
              </p>
            ) : null}
            <FormGroup label="Display name" fieldId="kubeconfig-upload-name" isRequired>
              <TextInput
                id="kubeconfig-upload-name"
                value={kubeconfigName}
                onChange={(_e, v) => setKubeconfigName(v)}
                placeholder="e.g. Production cluster"
              />
            </FormGroup>
            <FormGroup label="Kubeconfig file" fieldId="kubeconfig-upload-file" isRequired>
              <input
                id="kubeconfig-upload-file"
                type="file"
                accept="*"
                onChange={(e) => setKubeconfigFile(e.target.files?.[0] || null)}
              />
            </FormGroup>
            <Button onClick={uploadKubeconfig}>Upload kubeconfig</Button>
          </Form>
          <FormGroup label="Filter by group" fieldId="kubeconfig-filter-group">
            <FormSelect
              id="kubeconfig-filter-group"
              value={kubeconfigFilterGroupId}
              onChange={(_e, v) => setKubeconfigFilterGroupId(v)}
            >
              <FormSelectOption value="" label="All my groups" />
              {uploadableGroups.map((g) => (
                <FormSelectOption
                  key={`filter-${g.id}`}
                  value={String(g.id)}
                  label={g.name}
                />
              ))}
            </FormSelect>
          </FormGroup>
          <Table aria-label="Kubeconfigs" variant="compact">
            <Thead>
              <Tr>
                <Th>Group</Th>
                <Th>Name</Th>
                <Th>Cluster</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredKubeconfigs.map((k) => (
                <Tr key={k.id}>
                  <Td>{k.group_name}</Td>
                  <Td>{k.name}</Td>
                  <Td>{k.cluster_key}</Td>
                  <Td>
                    <Button
                      variant="link"
                      onClick={() => {
                        setEditingKubeconfig(k);
                        setEditingKubeconfigName(k.name);
                      }}
                    >
                      Rename
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => deleteKubeconfig(k.id)}
                    >
                      Delete
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Tab>
        <Tab eventKey={3} title={<TabTitleText>Elasticsearch</TabTitleText>}>
          <p className="settings-page__hint">
            Manage Elasticsearch connection configs across all groups. Saved configs can be loaded in the Analysis view.
          </p>
          <Form className="settings-form">
            <FormGroup label="Group" fieldId="es-admin-group" isRequired>
              <FormSelect
                id="es-admin-group"
                value={elasticForm.groupId || ""}
                onChange={(_e, v) => setElasticField("groupId", v)}
              >
                <FormSelectOption value="" label="Select group…" />
                {groups.map((g) => (
                  <FormSelectOption key={g.id} value={String(g.id)} label={g.name} />
                ))}
              </FormSelect>
            </FormGroup>
            <FormGroup label="Display name" fieldId="es-admin-name" isRequired>
              <TextInput
                id="es-admin-name"
                value={elasticForm.name}
                onChange={(_e, v) => setElasticField("name", v)}
              />
            </FormGroup>
            <FormGroup label="Host" fieldId="es-admin-host" isRequired>
              <TextInput
                id="es-admin-host"
                value={elasticForm.host}
                placeholder="https://my-es-host:9200"
                onChange={(_e, v) => setElasticField("host", v)}
              />
            </FormGroup>
            <FormGroup label="Port" fieldId="es-admin-port">
              <TextInput
                id="es-admin-port"
                type="number"
                value={elasticForm.port}
                onChange={(_e, v) => setElasticField("port", v)}
              />
            </FormGroup>
            <FormGroup label="Username" fieldId="es-admin-username">
              <TextInput
                id="es-admin-username"
                value={elasticForm.username}
                onChange={(_e, v) => setElasticField("username", v)}
              />
            </FormGroup>
            <FormGroup label="Password" fieldId="es-admin-password">
              <TextInput
                id="es-admin-password"
                type="password"
                value={elasticForm.password}
                onChange={(_e, v) => setElasticField("password", v)}
              />
            </FormGroup>
            <FormGroup label="Telemetry Index" fieldId="es-admin-telemetry-index">
              <TextInput
                id="es-admin-telemetry-index"
                value={elasticForm.telemetryIndex}
                onChange={(_e, v) => setElasticField("telemetryIndex", v)}
              />
            </FormGroup>
            <FormGroup label="Metrics Index" fieldId="es-admin-metrics-index">
              <TextInput
                id="es-admin-metrics-index"
                value={elasticForm.metricsIndex}
                onChange={(_e, v) => setElasticField("metricsIndex", v)}
              />
            </FormGroup>
            <FormGroup label="Alerts Index" fieldId="es-admin-alerts-index">
              <TextInput
                id="es-admin-alerts-index"
                value={elasticForm.alertsIndex}
                onChange={(_e, v) => setElasticField("alertsIndex", v)}
              />
            </FormGroup>
            <FormGroup label="Grafana URL" fieldId="es-admin-grafana-url">
              <TextInput
                id="es-admin-grafana-url"
                value={elasticForm.grafanaUrl}
                placeholder="Optional — e.g. https://grafana.example.com/d/abc"
                onChange={(_e, v) => setElasticField("grafanaUrl", v)}
              />
            </FormGroup>
            <Button onClick={saveElasticConfig}>Save config</Button>
          </Form>
          <FormGroup label="Filter by group" fieldId="es-admin-filter" style={{ marginTop: "1.5rem" }}>
            <FormSelect
              id="es-admin-filter"
              value={elasticFilterGroupId}
              onChange={(_e, v) => setElasticFilterGroupId(v)}
            >
              <FormSelectOption value="" label="All groups" />
              {groups.map((g) => (
                <FormSelectOption key={`esf-${g.id}`} value={String(g.id)} label={g.name} />
              ))}
            </FormSelect>
          </FormGroup>
          <Table aria-label="Elasticsearch configs" variant="compact" style={{ marginTop: "1rem" }}>
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
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredElasticConfigs.map((c) => (
                <Tr key={c.id}>
                  <Td>{c.group_name}</Td>
                  <Td>{c.name}</Td>
                  <Td>{c.host}</Td>
                  <Td>{c.username || "—"}</Td>
                  <Td>{c.password ? "••••••••" : "—"}</Td>
                  <Td>{c.telemetry_index || "—"}</Td>
                  <Td>{c.metrics_index || "—"}</Td>
                  <Td>{c.alerts_index || "—"}</Td>
                  <Td>{c.grafana_url ? <a href={c.grafana_url} target="_blank" rel="noreferrer">{c.grafana_url}</a> : "—"}</Td>
                  <Td>
                    <Button variant="link" onClick={() => openEditElastic(c)}>
                      Edit
                    </Button>
                    <Button variant="danger" onClick={() => deleteElasticConfig(c.id)}>
                      Delete
                    </Button>
                  </Td>
                </Tr>
              ))}
              {filteredElasticConfigs.length === 0 && (
                <Tr>
                  <Td colSpan={10} style={{ textAlign: "center", color: "var(--pf-v5-global--Color--200)" }}>
                    No configs yet.
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </Tab>
        <Tab eventKey={4} title={<TabTitleText>Audit</TabTitleText>}>
          <Table aria-label="Audit">
            <Thead>
              <Tr>
                <Th>Time</Th>
                <Th>User</Th>
                <Th>Action</Th>
                <Th>Resource</Th>
              </Tr>
            </Thead>
            <Tbody>
              {audit.map((ev) => (
                <Tr key={ev.id}>
                  <Td>{ev.created_at}</Td>
                  <Td>{ev.username || ev.user_id}</Td>
                  <Td>{ev.action}</Td>
                  <Td>
                    {ev.resource_type}:{ev.resource_id}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Tab>
      </Tabs>

      <Modal
        variant={ModalVariant.small}
        title={`Rename kubeconfig — ${editingKubeconfig?.name || ""}`}
        isOpen={Boolean(editingKubeconfig)}
        onClose={() => setEditingKubeconfig(null)}
      >
        <FormGroup label="Display name" fieldId="edit-kubeconfig-name">
          <TextInput
            id="edit-kubeconfig-name"
            value={editingKubeconfigName}
            onChange={(_e, v) => setEditingKubeconfigName(v)}
          />
        </FormGroup>
        <div className="settings-page__modal-actions">
          <Button
            type="button"
            variant="link"
            onClick={() => setEditingKubeconfig(null)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={saveKubeconfigRename}>
            Save
          </Button>
        </div>
      </Modal>

      <Modal
        variant={ModalVariant.small}
        title={`Edit groups — ${editGroupsUser?.username || ""}`}
        isOpen={Boolean(editGroupsUser)}
        onClose={closeEditGroupsModal}
      >
        {editGroupsUser ? (
          <>
            {groups.length === 0 ? (
              <p className="settings-page__hint">No groups available.</p>
            ) : (
              <div className="settings-page__group-memberships">
                {groups.map((g) => {
                  const checked = Boolean(editGroupMemberships[g.id]);
                  return (
                    <div
                      key={g.id}
                      className="settings-page__group-membership-row"
                    >
                      <Checkbox
                        id={`edit-user-group-${g.id}`}
                        label={g.name}
                        isChecked={checked}
                        onChange={(_e, c) => toggleEditGroup(g.id, c)}
                      />
                      {checked ? (
                        <FormSelect
                          aria-label={`Role in ${g.name}`}
                          value={editGroupMemberships[g.id] || "user"}
                          onChange={(_e, v) => setEditGroupRole(g.id, v)}
                        >
                          {groupRoleOptionsForPlatformRole(
                            editGroupsUser.role
                          ).map((o) => (
                            <FormSelectOption
                              key={o.value}
                              value={o.value}
                              label={o.label}
                            />
                          ))}
                        </FormSelect>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="settings-page__modal-actions">
              <Button
                type="button"
                variant="link"
                onClick={closeEditGroupsModal}
              >
                Cancel
              </Button>
              <Button type="button" onClick={saveUserGroups}>
                Save
              </Button>
            </div>
          </>
        ) : null}
      </Modal>

      <Modal
        variant={ModalVariant.medium}
        title={`Edit — ${editingElasticConfig?.name ?? ""}`}
        isOpen={Boolean(editingElasticConfig)}
        onClose={closeEditElastic}
      >
        <Form className="settings-form">
          <FormGroup label="Display name" fieldId="edit-es-name" isRequired>
            <TextInput
              id="edit-es-name"
              value={editElasticForm.name}
              onChange={(_e, v) => setEditElasticForm((p) => ({ ...p, name: v }))}
            />
          </FormGroup>
          <FormGroup label="Host" fieldId="edit-es-host" isRequired>
            <TextInput
              id="edit-es-host"
              value={editElasticForm.host}
              onChange={(_e, v) => setEditElasticForm((p) => ({ ...p, host: v }))}
            />
          </FormGroup>
          <FormGroup label="Port" fieldId="edit-es-port">
            <TextInput
              id="edit-es-port"
              type="number"
              value={editElasticForm.port}
              onChange={(_e, v) => setEditElasticForm((p) => ({ ...p, port: v }))}
            />
          </FormGroup>
          <FormGroup label="Username" fieldId="edit-es-username">
            <TextInput
              id="edit-es-username"
              value={editElasticForm.username}
              onChange={(_e, v) => setEditElasticForm((p) => ({ ...p, username: v }))}
            />
          </FormGroup>
          <FormGroup label="Password" fieldId="edit-es-password">
            {editingElasticConfig?.password && !showElasticPasswordEdit ? (
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
                <Button
                  variant="link"
                  isInline
                  onClick={() => {
                    setShowElasticPasswordEdit(true);
                    setEditElasticForm((p) => ({ ...p, password: "" }));
                  }}
                >
                  Change password
                </Button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <TextInput
                  id="edit-es-password"
                  type="password"
                  value={editElasticForm.password}
                  placeholder="Enter new password"
                  onChange={(_e, v) => setEditElasticForm((p) => ({ ...p, password: v }))}
                  style={{ flex: 1 }}
                />
                {editingElasticConfig?.password && (
                  <Button
                    variant="link"
                    isInline
                    onClick={() => {
                      setShowElasticPasswordEdit(false);
                      setEditElasticForm((p) => ({ ...p, password: "" }));
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            )}
          </FormGroup>
          <FormGroup label="Telemetry Index" fieldId="edit-es-telemetry-index">
            <TextInput
              id="edit-es-telemetry-index"
              value={editElasticForm.telemetryIndex}
              onChange={(_e, v) => setEditElasticForm((p) => ({ ...p, telemetryIndex: v }))}
            />
          </FormGroup>
          <FormGroup label="Metrics Index" fieldId="edit-es-metrics-index">
            <TextInput
              id="edit-es-metrics-index"
              value={editElasticForm.metricsIndex}
              onChange={(_e, v) => setEditElasticForm((p) => ({ ...p, metricsIndex: v }))}
            />
          </FormGroup>
          <FormGroup label="Alerts Index" fieldId="edit-es-alerts-index">
            <TextInput
              id="edit-es-alerts-index"
              value={editElasticForm.alertsIndex}
              onChange={(_e, v) => setEditElasticForm((p) => ({ ...p, alertsIndex: v }))}
            />
          </FormGroup>
          <FormGroup label="Grafana URL" fieldId="edit-es-grafana-url">
            <TextInput
              id="edit-es-grafana-url"
              value={editElasticForm.grafanaUrl}
              placeholder="Optional"
              onChange={(_e, v) => setEditElasticForm((p) => ({ ...p, grafanaUrl: v }))}
            />
          </FormGroup>
          <div className="settings-page__modal-actions">
            <Button type="button" variant="link" onClick={closeEditElastic}>Cancel</Button>
            <Button type="button" onClick={saveEditElastic}>Save changes</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Administration;
