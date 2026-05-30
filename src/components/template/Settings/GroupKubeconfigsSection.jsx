import {
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
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import API from "@/utils/axiosInstance";
import { showToast } from "@/actions/toastActions";

const GroupKubeconfigsSection = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [kubeconfigs, setKubeconfigs] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);

  const load = useCallback(async () => {
    const [gRes, kRes] = await Promise.all([
      API.get("/auth/groups/mine"),
      API.get("/auth/kubeconfigs"),
    ]);
    setGroups(gRes.data.groups || []);
    setKubeconfigs(kRes.data.kubeconfigs || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const upload = async () => {
    if (!file || !selectedGroupId || !name.trim()) {
      dispatch(
        showToast("warning", "Select a group, enter a name, and choose a file")
      );
      return;
    }
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("name", name.trim());
      form.append("groupId", String(selectedGroupId));
      await API.post("/auth/kubeconfigs", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      dispatch(showToast("success", "Kubeconfig uploaded"));
      setName("");
      setFile(null);
      load();
    } catch (e) {
      dispatch(
        showToast("danger", "Upload failed", e.response?.data?.error)
      );
    }
  };

  const filtered = selectedGroupId
    ? kubeconfigs.filter((k) => k.group_id === parseInt(selectedGroupId, 10))
    : kubeconfigs;

  if (groups.length === 0) {
    return (
      <p className="settings-page__hint">
        You are not a member of any groups. A platform admin can add you to a
        group.
      </p>
    );
  }

  return (
    <section className="settings-page__account">
      <Title headingLevel="h2" size="lg">
        Group kubeconfigs
      </Title>
      <p className="settings-page__hint">
        Upload kubeconfig files for groups you belong to. All members of a group
        share the same files. Group admins can manage members and policies via
        Manage group.
      </p>
      <ul className="settings-page__group-list">
        {groups.map((g) => (
          <li key={g.id}>
            <strong>{g.name}</strong> — {g.groupRole}
            {g.canManage ? (
              <>
                {" "}
                <Button
                  variant="link"
                  isInline
                  onClick={() => navigate(`/group/${g.id}`)}
                >
                  Manage group
                </Button>
              </>
            ) : null}
          </li>
        ))}
      </ul>
      <Form className="settings-form">
        <FormGroup label="Group" fieldId="account-kc-group">
          <FormSelect
            id="account-kc-group"
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
        <FormGroup label="Display name" fieldId="account-kc-name">
          <TextInput
            id="account-kc-name"
            value={name}
            onChange={(_e, v) => setName(v)}
          />
        </FormGroup>
        <FormGroup label="Kubeconfig file" fieldId="account-kc-file">
          <input
            id="account-kc-file"
            type="file"
            accept="*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </FormGroup>
        <Button onClick={upload}>Upload</Button>
      </Form>
      <Table aria-label="My group kubeconfigs" variant="compact">
        <Thead>
          <Tr>
            <Th>Group</Th>
            <Th>Name</Th>
            <Th>Cluster</Th>
          </Tr>
        </Thead>
        <Tbody>
          {filtered.map((k) => (
            <Tr key={k.id}>
              <Td>{k.group_name}</Td>
              <Td>{k.name}</Td>
              <Td>{k.cluster_key}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </section>
  );
};

export default GroupKubeconfigsSection;
