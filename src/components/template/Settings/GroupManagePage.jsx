import "./index.less";

import { Button, Title } from "@patternfly/react-core";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import API from "@/utils/axiosInstance";
import { showToast } from "@/actions/toastActions";
import GroupDetailPanel from "./GroupDetailPanel";

const GroupManagePage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [allowed, setAllowed] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await API.get(`/auth/groups/${groupId}`);
      if (!res.data.canManage) {
        setAllowed(false);
        return;
      }
      setAllowed(true);
      if (user?.role === "admin") {
        const u = await API.get("/auth/users");
        setUsers(u.data.users || []);
      }
    } catch (e) {
      dispatch(
        showToast("danger", "Cannot open group", e.response?.data?.error)
      );
      setAllowed(false);
    }
  }, [dispatch, groupId, user?.role]);

  useEffect(() => {
    load();
  }, [load]);

  if (allowed === false) {
    return (
      <div className="settings-page">
        <Title headingLevel="h1" size="2xl">
          Group
        </Title>
        <p>You must be a group admin to manage this group.</p>
        <Button variant="link" onClick={() => navigate("/settings")}>
          Back to account settings
        </Button>
      </div>
    );
  }

  if (allowed === null) {
    return <p className="settings-page__hint">Loading…</p>;
  }

  return (
    <div className="settings-page">
      <GroupDetailPanel
        groupId={parseInt(groupId, 10)}
        allUsers={users}
        canAssignMembers={user?.role === "admin"}
        onBack={() => navigate("/settings")}
        onChanged={load}
      />
    </div>
  );
};

export default GroupManagePage;
