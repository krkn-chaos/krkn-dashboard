import {
  Alert,
  Button,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
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
import { showToast } from "@/actions/toastActions";
import { groupRoleOptionsForPlatformRole } from "./groupRoleOptions";

const PERMISSION_OPTIONS = [
  { value: "view", label: "View" },
  { value: "run", label: "Run" },
  { value: "cancel", label: "Cancel" },
  { value: "admin", label: "Admin (view, run, and cancel)" },
];

const GroupDetailPanel = ({
  groupId,
  allUsers,
  canAssignMembers = false,
  onBack,
  onChanged,
}) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [kubeconfigs, setKubeconfigs] = useState([]);
  const [canManage, setCanManage] = useState(false);
  const [kcName, setKcName] = useState("");
  const [kcFile, setKcFile] = useState(null);
  const [addUserId, setAddUserId] = useState("");
  const [addMemberRole, setAddMemberRole] = useState("user");
  const [newPolicy, setNewPolicy] = useState({
    clusterKey: "*",
    permission: "view",
  });

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const [res, kcRes] = await Promise.all([
        API.get(`/auth/groups/${groupId}`),
        API.get("/auth/kubeconfigs", { params: { groupId } }),
      ]);
      setGroup(res.data.group);
      setMembers(res.data.members || []);
      setPolicies(res.data.policies || []);
      setKubeconfigs(kcRes.data.kubeconfigs || []);
      setCanManage(Boolean(res.data.canManage));
    } catch (e) {
      dispatch(
        showToast(
          "danger",
          "Failed to load group",
          e.response?.data?.error || e.message
        )
      );
    } finally {
      setLoading(false);
    }
  }, [dispatch, groupId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const memberIds = new Set(members.map((m) => m.id));
  const usersNotInGroup = allUsers.filter((u) => !memberIds.has(u.id));
  const addTargetUser = allUsers.find((u) => u.id === parseInt(addUserId, 10));
  const addRoleOptions = groupRoleOptionsForPlatformRole(
    addTargetUser?.role || "user"
  );
  const isMember = (user?.groupIds || []).includes(groupId);

  const uploadGroupKubeconfig = async () => {
    if (!kcFile || !kcName.trim()) {
      dispatch(showToast("warning", "Enter a name and choose a file"));
      return;
    }
    try {
      const form = new FormData();
      form.append("file", kcFile);
      form.append("name", kcName.trim());
      form.append("groupId", String(groupId));
      await API.post("/auth/kubeconfigs", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setKcName("");
      setKcFile(null);
      dispatch(showToast("success", "Kubeconfig uploaded"));
      await loadDetail();
      await onChanged?.();
    } catch (e) {
      dispatch(
        showToast("danger", "Upload failed", e.response?.data?.error)
      );
    }
  };

  const deleteGroupKubeconfig = async (id) => {
    try {
      await API.delete(`/auth/kubeconfigs/${id}`);
      dispatch(showToast("success", "Kubeconfig deleted"));
      await loadDetail();
      await onChanged?.();
    } catch (e) {
      dispatch(
        showToast("danger", "Delete failed", e.response?.data?.error)
      );
    }
  };

  const addMember = async () => {
    if (!addUserId) return;
    try {
      await API.post(`/auth/groups/${groupId}/members`, {
        userId: parseInt(addUserId, 10),
        role: addMemberRole,
      });
      setAddUserId("");
      setAddMemberRole("user");
      dispatch(showToast("success", "Member added"));
      await loadDetail();
      await onChanged?.();
    } catch (e) {
      dispatch(
        showToast("danger", "Failed to add member", e.response?.data?.error)
      );
    }
  };

  const updateMemberRole = async (userId, role) => {
    try {
      await API.patch(`/auth/groups/${groupId}/members/${userId}`, { role });
      dispatch(showToast("success", "Member role updated"));
      await loadDetail();
      await onChanged?.();
    } catch (e) {
      dispatch(
        showToast("danger", "Failed to update role", e.response?.data?.error)
      );
    }
  };

  const removeMember = async (userId) => {
    try {
      await API.delete(`/auth/groups/${groupId}/members/${userId}`);
      dispatch(showToast("success", "Member removed"));
      await loadDetail();
      await onChanged?.();
    } catch (e) {
      dispatch(
        showToast("danger", "Failed to remove member", e.response?.data?.error)
      );
    }
  };

  const addPolicy = async () => {
    try {
      await API.post(`/auth/groups/${groupId}/policies`, newPolicy);
      setNewPolicy({ clusterKey: "*", permission: "view" });
      dispatch(showToast("success", "Policy added"));
      await loadDetail();
      await onChanged?.();
    } catch (e) {
      dispatch(
        showToast("danger", "Failed to add policy", e.response?.data?.error)
      );
    }
  };

  const removePolicy = async (policyId) => {
    try {
      await API.delete(`/auth/groups/${groupId}/policies/${policyId}`);
      dispatch(showToast("success", "Policy removed"));
      await loadDetail();
      await onChanged?.();
    } catch (e) {
      dispatch(
        showToast("danger", "Failed to remove policy", e.response?.data?.error)
      );
    }
  };

  if (loading) {
    return <p className="settings-page__hint">Loading group…</p>;
  }

  if (!group) {
    return (
      <>
        <Button variant="link" onClick={onBack} className="settings-page__back">
          Back to groups
        </Button>
        <p>Group not found.</p>
      </>
    );
  }

  return (
    <div className="settings-page__group-detail">
      <Button variant="link" onClick={onBack} className="settings-page__back">
        Back to groups
      </Button>
      <Title headingLevel="h2" size="lg">
        {group.name}
      </Title>
      {group.description ? (
        <p className="settings-page__hint">{group.description}</p>
      ) : null}

      {!canManage ? (
        <Alert
          variant="info"
          isInline
          title="Read-only"
          className="settings-page__group-alert"
        >
          You must be a group admin to manage members and policies. Any group
          member can upload kubeconfigs from Account Settings.
        </Alert>
      ) : null}

      <Title headingLevel="h3" size="md" className="settings-page__section-title">
        Members
      </Title>
      {canManage && canAssignMembers ? (
        <Form className="settings-form settings-form--inline">
          <FormGroup label="Add user" fieldId="add-group-member">
            <FormSelect
              id="add-group-member"
              value={addUserId}
              onChange={(_e, v) => {
                setAddUserId(v);
                const target = allUsers.find((u) => u.id === parseInt(v, 10));
                const opts = groupRoleOptionsForPlatformRole(
                  target?.role || "user"
                );
                if (!opts.some((o) => o.value === addMemberRole)) {
                  setAddMemberRole("user");
                }
              }}
            >
              <FormSelectOption value="" label="Select user…" />
              {usersNotInGroup.map((u) => (
                <FormSelectOption
                  key={u.id}
                  value={String(u.id)}
                  label={`${u.username} (${u.role} platform)`}
                />
              ))}
            </FormSelect>
          </FormGroup>
          <FormGroup label="Group role" fieldId="add-group-member-role">
            <FormSelect
              id="add-group-member-role"
              value={addMemberRole}
              onChange={(_e, v) => setAddMemberRole(v)}
            >
              {addRoleOptions.map((o) => (
                <FormSelectOption key={o.value} value={o.value} label={o.label} />
              ))}
            </FormSelect>
          </FormGroup>
          <Button onClick={addMember} isDisabled={!addUserId}>
            Add member
          </Button>
        </Form>
      ) : null}
      <Table aria-label="Group members" variant="compact">
        <Thead>
          <Tr>
            <Th>Username</Th>
            <Th>Group role</Th>
            {canManage && canAssignMembers ? <Th>Actions</Th> : null}
          </Tr>
        </Thead>
        <Tbody>
          {members.map((m) => (
            <Tr key={m.id}>
              <Td>{m.username}</Td>
              <Td>
                {canManage && canAssignMembers ? (
                  <FormSelect
                    aria-label={`Role for ${m.username}`}
                    value={m.groupRole || "user"}
                    onChange={(_e, v) => updateMemberRole(m.id, v)}
                  >
                    {groupRoleOptionsForPlatformRole(
                      allUsers.find((u) => u.id === m.id)?.role || "user"
                    ).map((o) => (
                      <FormSelectOption
                        key={o.value}
                        value={o.value}
                        label={o.label}
                      />
                    ))}
                  </FormSelect>
                ) : (
                  m.groupRole || "user"
                )}
              </Td>
              {canManage && canAssignMembers ? (
                <Td>
                  <Button variant="danger" onClick={() => removeMember(m.id)}>
                    Remove
                  </Button>
                </Td>
              ) : null}
            </Tr>
          ))}
        </Tbody>
      </Table>

      <Title headingLevel="h3" size="md" className="settings-page__section-title">
        Policies
      </Title>
      <p className="settings-page__hint">
        Policies apply to this group and grant cluster permissions to all members.
      </p>
      {canManage ? (
        <Form className="settings-form">
          <FormGroup label="Cluster key" fieldId="group-policy-cluster">
            <TextInput
              id="group-policy-cluster"
              value={newPolicy.clusterKey}
              onChange={(_e, v) =>
                setNewPolicy({ ...newPolicy, clusterKey: v })
              }
            />
          </FormGroup>
          <FormGroup label="Permission" fieldId="group-policy-permission">
            <FormSelect
              id="group-policy-permission"
              value={newPolicy.permission}
              onChange={(_e, v) =>
                setNewPolicy({ ...newPolicy, permission: v })
              }
            >
              {PERMISSION_OPTIONS.map((o) => (
                <FormSelectOption key={o.value} value={o.value} label={o.label} />
              ))}
            </FormSelect>
          </FormGroup>
          <Button onClick={addPolicy}>Add policy</Button>
        </Form>
      ) : null}
      <Table aria-label="Group policies" variant="compact">
        <Thead>
          <Tr>
            <Th>Cluster</Th>
            <Th>Permission</Th>
            {canManage ? <Th>Actions</Th> : null}
          </Tr>
        </Thead>
        <Tbody>
          {policies.map((p) => (
            <Tr key={p.id}>
              <Td>{p.clusterKey}</Td>
              <Td>{p.permission}</Td>
              {canManage ? (
                <Td>
                  <Button variant="danger" onClick={() => removePolicy(p.id)}>
                    Remove
                  </Button>
                </Td>
              ) : null}
            </Tr>
          ))}
        </Tbody>
      </Table>

      {isMember ? (
        <>
          <Title
            headingLevel="h3"
            size="md"
            className="settings-page__section-title"
          >
            Kubeconfigs
          </Title>
          <p className="settings-page__hint">
            Shared by all members of this group.
          </p>
          <Form className="settings-form">
            <FormGroup label="Display name" fieldId="group-kc-name">
              <TextInput
                id="group-kc-name"
                value={kcName}
                onChange={(_e, v) => setKcName(v)}
              />
            </FormGroup>
            <FormGroup label="File" fieldId="group-kc-file">
              <input
                id="group-kc-file"
                type="file"
                accept="*"
                onChange={(e) => setKcFile(e.target.files?.[0] || null)}
              />
            </FormGroup>
            <Button onClick={uploadGroupKubeconfig}>Upload</Button>
          </Form>
          <Table aria-label="Group kubeconfigs" variant="compact">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Cluster</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {kubeconfigs.map((k) => (
                <Tr key={k.id}>
                  <Td>{k.name}</Td>
                  <Td>{k.cluster_key}</Td>
                  <Td>
                    <Button
                      variant="danger"
                      onClick={() => deleteGroupKubeconfig(k.id)}
                    >
                      Delete
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </>
      ) : null}
    </div>
  );
};

export default GroupDetailPanel;
