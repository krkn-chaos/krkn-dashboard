// Assisted-by: Cursor:Codex5.3
import { Router } from "express";
import crypto from "crypto";
import fs from "fs";
import multer from "multer";
import path from "path";

import { recordAudit } from "../db/audit.js";
import * as groupsDb from "../db/groups.js";
import {
  createKubeconfigRecord,
  deleteKubeconfig,
  ensureKubeconfigsDir,
  getKubeconfigById,
  kubeconfigFilePath,
  listKubeconfigsForGroupIds,
  updateKubeconfigName,
} from "../db/kubeconfigs.js";
import * as policiesDb from "../db/policies.js";
import * as usersDb from "../db/users.js";
import { countUsers } from "../db/users.js";
import { authorize } from "./policy.js";
import { hashPassword, verifyPassword } from "./password.js";
import { requireRole } from "./middleware.js";
import { attachUserToSession } from "./session.js";
import { deriveClusterKey, deriveContextName } from "./kubeconfigUtil.js";
import { kubeconfigsDir } from "../db/connection.js";
import { consumeInitialLoginHint } from "./initialLoginHint.js";
import {
  canManageGroup,
  parseGroupId,
} from "./groupAccess.js";
import { applySelfAccountUpdate } from "./accountUpdate.js";
import {
  assertGroupRoleForPlatformUser,
  isValidGroupRole,
  isValidPlatformRole,
  isMemberOfGroup,
  isPlatformAdmin,
} from "./roles.js";
import {
  canAccessKubeconfig,
  canManageKubeconfig,
  canUploadKubeconfig,
} from "./kubeconfigAccess.js";

const router = Router();

function parseGroupMemberships(body) {
  if (Array.isArray(body?.groupMemberships)) {
    return body.groupMemberships
      .map((m) => ({
        groupId: parseInt(m.groupId, 10),
        role: String(m.role || "user").toLowerCase(),
      }))
      .filter((m) => m.groupId && isValidGroupRole(m.role));
  }
  if (Array.isArray(body?.groupIds)) {
    const defaultRole = String(body.defaultGroupRole || "user").toLowerCase();
    if (!isValidGroupRole(defaultRole)) return [];
    return body.groupIds
      .map((id) => ({
        groupId: parseInt(id, 10),
        role: defaultRole,
      }))
      .filter((m) => m.groupId);
  }
  return null;
}

router.use(async (req, res, next) => {
  if (
    req.path === "/login" ||
    req.path === "/bootstrap-status" ||
    req.path === "/initial-login-hint"
  ) {
    return next();
  }
  const { loadSessionUser } = await import("./session.js");
  const user = req.session?.user || (await loadSessionUser(req));
  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  req.user = user;
  if (!req.session.user) req.session.user = user;
  next();
});

const loginAttempts = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 20;

function checkLoginRate(ip) {
  const now = Date.now();
  let entry = loginAttempts.get(ip);
  if (!entry || now - entry.start > LOGIN_WINDOW_MS) {
    entry = { start: now, count: 0 };
    loginAttempts.set(ip, entry);
  }
  entry.count += 1;
  if (entry.count > LOGIN_MAX_ATTEMPTS) {
    const err = new Error("Too many login attempts");
    err.status = 429;
    throw err;
  }
}

router.get("/bootstrap-status", async (_req, res) => {
  const count = await countUsers();
  res.json({ needsSetup: count === 0 });
});

/** One-time prefill for login after first bootstrap (consumes INITIAL_ADMIN.txt). */
router.get("/initial-login-hint", async (_req, res) => {
  try {
    const hint = await consumeInitialLoginHint();
    res.json(hint);
  } catch (e) {
    console.error("[auth] initial-login-hint:", e);
    res.status(500).json({ available: false });
  }
});

router.post("/login", async (req, res) => {
  try {
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    checkLoginRate(ip);
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }
    const row = await usersDb.findByUsername(username);
    if (!row) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const ok = await verifyPassword(password, row.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const user = await attachUserToSession(req, row);
    res.json({ user });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("krkn.sid");
    res.json({ ok: true });
  });
});

router.get("/me", async (req, res) => {
  res.json({ user: req.user });
});

router.post("/change-password", async (req, res) => {
  try {
    const user = await applySelfAccountUpdate(req, req.body || {});
    res.json({ user });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

router.patch("/me", async (req, res) => {
  try {
    const user = await applySelfAccountUpdate(req, req.body || {});
    res.json({ user });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// --- Admin: users ---
router.get("/users", requireRole("admin"), async (_req, res) => {
  const users = await usersDb.listUsers();
  const withGroups = await Promise.all(
    users.map(async (u) => {
      const groupMemberships = await usersDb.getUserGroupMemberships(u.id);
      return {
        ...u,
        mustChangePassword: Boolean(u.must_change_password),
        groupMemberships,
        groupIds: groupMemberships.map((m) => m.groupId),
      };
    })
  );
  res.json({ users: withGroups });
});

router.post("/users", requireRole("admin"), async (req, res) => {
  const { username, password, role } = req.body || {};
  const memberships = parseGroupMemberships(req.body) || [];
  if (!username || !password || !role) {
    return res.status(400).json({ error: "username, password, and role required" });
  }
  if (!isValidPlatformRole(role)) {
    return res.status(400).json({ error: "Invalid platform role (admin or user)" });
  }
  const existing = await usersDb.findByUsername(username);
  if (existing) {
    return res.status(409).json({ error: "Username already exists" });
  }
  const passwordHash = await hashPassword(password);
  const userId = await usersDb.createUser({
    username,
    passwordHash,
    role,
    mustChangePassword: false,
  });
  if (memberships.length) {
    try {
      await usersDb.setUserGroupMemberships(userId, memberships);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }
  const firstGroupId = memberships[0]?.groupId ?? null;
  await recordAudit({
    groupId: firstGroupId,
    userId: req.user.id,
    action: "user.created",
    resourceType: "user",
    resourceId: String(userId),
    metadata: { username, role },
  });
  res.status(201).json({ id: userId });
});

router.patch("/users/:id", requireRole("admin"), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { role, disabled, password } = req.body || {};
  const memberships = parseGroupMemberships(req.body);
  if (role && !isValidPlatformRole(role)) {
    return res.status(400).json({ error: "Invalid platform role (admin or user)" });
  }
  const updates = {};
  if (role != null) updates.role = role;
  if (disabled != null) updates.disabled = disabled;
  if (password) {
    updates.passwordHash = await hashPassword(password);
  }
  const existing = await usersDb.findById(id);
  if (!existing) return res.status(404).json({ error: "User not found" });

  await usersDb.updateUser(id, updates);
  if (memberships != null) {
    try {
      await usersDb.setUserGroupMemberships(id, memberships);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
  }
  await recordAudit({
    userId: req.user.id,
    action: "user.updated",
    resourceType: "user",
    resourceId: String(id),
    metadata: {
      username: existing.username,
      role: role ?? existing.role,
      disabled: disabled ?? undefined,
      passwordReset: Boolean(password),
      groupsUpdated: memberships != null,
    },
  });
  res.json({ ok: true });
});

// --- Groups ---
router.get("/groups/mine", async (req, res) => {
  const memberships = req.user.groupMemberships || [];
  const groups = [];
  for (const m of memberships) {
    const g = await groupsDb.findGroupById(m.groupId);
    if (g) {
      groups.push({
        id: g.id,
        name: g.name,
        description: g.description,
        groupRole: m.role,
        canManage: m.role === "admin",
      });
    }
  }
  res.json({ groups });
});

router.get("/groups", requireRole("admin"), async (_req, res) => {
  const groups = await groupsDb.listGroups();
  res.json({ groups });
});

router.post("/groups", requireRole("admin"), async (req, res) => {
  const { name, description } = req.body || {};
  if (!name) return res.status(400).json({ error: "name required" });
  const existing = await groupsDb.findGroupByName(name);
  if (existing) return res.status(409).json({ error: "Group exists" });
  const id = await groupsDb.createGroup({ name, description });
  await recordAudit({
    groupId: id,
    userId: req.user.id,
    action: "group.created",
    resourceType: "group",
    resourceId: String(id),
    metadata: { name, description: description || null },
  });
  res.status(201).json({ id });
});

router.get("/groups/:id", async (req, res) => {
  const groupId = parseGroupId(req.params.id);
  if (!groupId) return res.status(400).json({ error: "Invalid group id" });

  if (!isMemberOfGroup(req.user, groupId) && !isPlatformAdmin(req.user)) {
    return res.status(403).json({ error: "Not a member of this group" });
  }

  const group = await groupsDb.findGroupById(groupId);
  if (!group) return res.status(404).json({ error: "Group not found" });

  const members = await groupsDb.listGroupMembers(groupId);
  const policyRows = await policiesDb.listPoliciesForGroup(groupId);
  const policies = policyRows.map((p) => ({
    id: p.id,
    groupId,
    clusterKey: p.cluster_key,
    permission: p.permission,
    createdAt: p.created_at,
  }));

  res.json({
    group: {
      id: group.id,
      name: group.name,
      description: group.description,
      createdAt: group.created_at,
    },
    members,
    policies,
    canManage: canManageGroup(req.user, groupId),
  });
});

router.post("/groups/:id/members", async (req, res) => {
  const groupId = parseGroupId(req.params.id);
  if (!groupId) return res.status(400).json({ error: "Invalid group id" });
  if (!canManageGroup(req.user, groupId)) {
    return res.status(403).json({ error: "You must be an admin member of this group" });
  }

  const userId = parseInt(req.body?.userId, 10);
  const memberRole = String(req.body?.role || "user").toLowerCase();
  if (!userId) return res.status(400).json({ error: "userId required" });
  if (!isValidGroupRole(memberRole)) {
    return res.status(400).json({ error: "Invalid group role" });
  }

  const target = await usersDb.findById(userId);
  if (!target) return res.status(404).json({ error: "User not found" });
  try {
    assertGroupRoleForPlatformUser(target.role, memberRole);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }

  await groupsDb.addUserToGroup(userId, groupId, memberRole);
  await recordAudit({
    groupId,
    userId: req.user.id,
    action: "group.member_added",
    resourceType: "user",
    resourceId: String(userId),
    metadata: { username: target.username, role: memberRole },
  });
  res.status(201).json({ ok: true });
});

router.patch("/groups/:id/members/:userId", async (req, res) => {
    const groupId = parseGroupId(req.params.id);
    const userId = parseInt(req.params.userId, 10);
    const memberRole = String(req.body?.role || "").toLowerCase();
    if (!groupId || !userId) {
      return res.status(400).json({ error: "Invalid id" });
    }
    if (!isValidGroupRole(memberRole)) {
      return res.status(400).json({ error: "Invalid group role" });
    }
    if (!canManageGroup(req.user, groupId)) {
      return res.status(403).json({
        error: "You must be an admin member of this group",
      });
    }

    const target = await usersDb.findById(userId);
    if (!target) return res.status(404).json({ error: "User not found" });
    try {
      assertGroupRoleForPlatformUser(target.role, memberRole);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }

    const updated = await groupsDb.setUserGroupRole(userId, groupId, memberRole);
    if (!updated) {
      return res.status(404).json({ error: "Member not found in group" });
    }
    await recordAudit({
      groupId,
      userId: req.user.id,
      action: "group.member_role_updated",
      resourceType: "user",
      resourceId: String(userId),
      metadata: { role: memberRole },
    });
    res.json({ ok: true });
  }
);

router.delete("/groups/:id/members/:userId", async (req, res) => {
    const groupId = parseGroupId(req.params.id);
    const userId = parseInt(req.params.userId, 10);
    if (!groupId || !userId) {
      return res.status(400).json({ error: "Invalid id" });
    }
    if (!canManageGroup(req.user, groupId)) {
      return res.status(403).json({ error: "You must be an admin member of this group" });
    }

    await groupsDb.removeUserFromGroup(userId, groupId);
    await recordAudit({
      groupId,
      userId: req.user.id,
      action: "group.member_removed",
      resourceType: "user",
      resourceId: String(userId),
    });
    res.json({ ok: true });
  }
);

router.post("/groups/:id/policies", async (req, res) => {
  const groupId = parseGroupId(req.params.id);
  if (!groupId) return res.status(400).json({ error: "Invalid group id" });
  if (!canManageGroup(req.user, groupId)) {
    return res.status(403).json({ error: "You must be an admin member of this group" });
  }

  const { clusterKey, permission } = req.body || {};
  if (!clusterKey || !permission) {
    return res.status(400).json({ error: "clusterKey and permission required" });
  }
  if (!policiesDb.isValidPermission(permission)) {
    return res.status(400).json({ error: "Invalid permission" });
  }

  const group = await groupsDb.findGroupById(groupId);
  if (!group) return res.status(404).json({ error: "Group not found" });

  try {
    const id = await policiesDb.createPolicy({
      subjectId: groupId,
      clusterKey: String(clusterKey).trim(),
      permission,
    });
    await recordAudit({
      groupId,
      userId: req.user.id,
      action: "policy.created",
      resourceType: "policy",
      resourceId: String(id),
      metadata: { clusterKey, permission },
    });
    res.status(201).json({ id });
  } catch (e) {
    if (/UNIQUE constraint/i.test(String(e?.message || ""))) {
      return res.status(409).json({ error: "Policy already exists for this group and cluster" });
    }
    throw e;
  }
});

router.delete("/groups/:id/policies/:policyId", async (req, res) => {
    const groupId = parseGroupId(req.params.id);
    const policyId = parseInt(req.params.policyId, 10);
    if (!groupId || !policyId) {
      return res.status(400).json({ error: "Invalid id" });
    }
    if (!canManageGroup(req.user, groupId)) {
      return res.status(403).json({ error: "You must be an admin member of this group" });
    }

    const row = await policiesDb.getGroupPolicyById(policyId, groupId);
    if (!row) return res.status(404).json({ error: "Policy not found" });

    await policiesDb.deletePolicy(policyId);
    await recordAudit({
      groupId,
      userId: req.user.id,
      action: "policy.deleted",
      resourceType: "policy",
      resourceId: String(policyId),
    });
    res.json({ ok: true });
  }
);

router.delete("/groups/:id", requireRole("admin"), async (req, res) => {
  const groupId = parseGroupId(req.params.id);
  if (!groupId) return res.status(400).json({ error: "Invalid group id" });
  const group = await groupsDb.findGroupById(groupId);
  await groupsDb.deleteGroup(groupId);
  await recordAudit({
    groupId,
    userId: req.user.id,
    action: "group.deleted",
    resourceType: "group",
    resourceId: String(groupId),
    metadata: { name: group?.name ?? null },
  });
  res.json({ ok: true });
});

// --- Policies (group-only; create via group detail) ---
router.get("/policies", requireRole("admin"), async (_req, res) => {
  const policies = await policiesDb.listPoliciesWithGroupNames();
  res.json({ policies });
});

router.post("/policies", requireRole("admin"), async (req, res) => {
  const groupId = parseInt(req.body?.groupId ?? req.body?.subjectId, 10);
  const { clusterKey, permission } = req.body || {};
  if (!groupId || !clusterKey || !permission) {
    return res.status(400).json({ error: "groupId, clusterKey, and permission required" });
  }
  if (!canManageGroup(req.user, groupId)) {
    return res.status(403).json({ error: "You must be an admin member of this group" });
  }
  if (!policiesDb.isValidPermission(permission)) {
    return res.status(400).json({ error: "Invalid permission" });
  }

  const group = await groupsDb.findGroupById(groupId);
  if (!group) return res.status(404).json({ error: "Group not found" });

  try {
    const id = await policiesDb.createPolicy({
      subjectId: groupId,
      clusterKey: String(clusterKey).trim(),
      permission,
    });
    res.status(201).json({ id });
  } catch (e) {
    if (/UNIQUE constraint/i.test(String(e?.message || ""))) {
      return res.status(409).json({ error: "Policy already exists" });
    }
    throw e;
  }
});

router.delete("/policies/:id", requireRole("admin"), async (req, res) => {
  const policyId = parseInt(req.params.id, 10);
  const row = await policiesDb.getPolicyById(policyId);
  if (!row) return res.status(404).json({ error: "Policy not found" });

  if (!canManageGroup(req.user, row.subject_id)) {
    return res.status(403).json({ error: "You must be an admin member of this group" });
  }
  await policiesDb.deletePolicy(policyId);
  res.json({ ok: true });
});

// --- Kubeconfigs ---
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      ensureKubeconfigsDir().then(() => cb(null, kubeconfigsDir));
    },
    filename: (_req, _file, cb) => {
      cb(null, `upload-${crypto.randomBytes(8).toString("hex")}`);
    },
  }),
});

router.get("/kubeconfigs", async (req, res) => {
  const groupIds = req.user.groupIds || [];
  const filterGroupId = req.query.groupId
    ? parseInt(req.query.groupId, 10)
    : null;
  const list = await listKubeconfigsForGroupIds(groupIds, {
    groupIdFilter: filterGroupId,
  });
  res.json({ kubeconfigs: list });
});

router.post(
  "/kubeconfigs",
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file?.path) {
        return res.status(400).json({ error: "Kubeconfig file required" });
      }
      const name = String(req.body?.name || "").trim();
      const groupId = parseInt(req.body?.groupId, 10);
      if (!name) {
        return res.status(400).json({ error: "Display name is required" });
      }
      if (!groupId) {
        return res.status(400).json({ error: "groupId is required" });
      }
      if (!canUploadKubeconfig(req.user, groupId)) {
        return res.status(403).json({
          error: "You must be a member of this group to upload kubeconfigs",
        });
      }

      const group = await groupsDb.findGroupById(groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      const clusterKey = await deriveClusterKey(req.file.path);
      const contextName = await deriveContextName(req.file.path);
      const id = await createKubeconfigRecord({
        name,
        ownerUserId: req.user.id,
        groupId,
        clusterKey,
        contextName,
        storagePath: "pending",
      });
      const finalPath = kubeconfigFilePath(id);
      fs.renameSync(req.file.path, finalPath);
      const { run } = await import("../db/connection.js");
      await run(`UPDATE kubeconfigs SET storage_path = ? WHERE id = ?`, [
        finalPath,
        id,
      ]);
      await recordAudit({
        groupId,
        userId: req.user.id,
        action: "kubeconfig.created",
        resourceType: "kubeconfig",
        resourceId: String(id),
        metadata: { name, clusterKey },
      });
      res.status(201).json({ id, name, groupId, clusterKey, contextName });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

router.patch("/kubeconfigs/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const name = String(req.body?.name || "").trim();
  if (!name) {
    return res.status(400).json({ error: "Display name is required" });
  }
  const row = await getKubeconfigById(id);
  if (!row) return res.status(404).json({ error: "Not found" });
  if (!canManageKubeconfig(req.user, row)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  await updateKubeconfigName(id, name);
  await recordAudit({
    groupId: row.group_id,
    userId: req.user.id,
    action: "kubeconfig.renamed",
    resourceType: "kubeconfig",
    resourceId: String(id),
    metadata: { name },
  });
  res.json({ ok: true });
});

router.delete("/kubeconfigs/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const row = await getKubeconfigById(id);
  if (!row) return res.status(404).json({ error: "Not found" });
  if (!canManageKubeconfig(req.user, row)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  await deleteKubeconfig(id);
  await recordAudit({
    groupId: row.group_id,
    userId: req.user.id,
    action: "kubeconfig.deleted",
    resourceType: "kubeconfig",
    resourceId: String(id),
  });
  res.json({ ok: true });
});

// ── Elasticsearch saved configs ──────────────────────────────────────────────

router.get("/elasticsearch-configs", async (req, res) => {
  const { listElasticConfigsForGroupIds, listAllElasticConfigs } = await import("../db/elasticConfigs.js");
  const list = req.user.role === "admin"
    ? await listAllElasticConfigs()
    : await listElasticConfigsForGroupIds(req.user.groupIds || []);
  res.json({ configs: list });
});

router.post("/elasticsearch-configs", async (req, res) => {
  const { createElasticConfig } = await import("../db/elasticConfigs.js");
  const { name, host, port, telemetryIndex, metricsIndex, alertsIndex, username, password, grafanaUrl, groupId } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Name is required" });
  if (!host?.trim()) return res.status(400).json({ error: "Host is required" });
  const gid = parseInt(groupId, 10);
  if (!gid) return res.status(400).json({ error: "groupId is required" });
  if (req.user.role !== "admin" && !(req.user.groupIds || []).includes(gid)) {
    return res.status(403).json({ error: "You are not a member of this group" });
  }
  try {
    const id = await createElasticConfig({
      name: name.trim(),
      host: host.trim(),
      port: port ? parseInt(port, 10) : 9200,
      telemetryIndex: telemetryIndex?.trim() ?? "",
      metricsIndex: metricsIndex?.trim() ?? "",
      alertsIndex: alertsIndex?.trim() ?? "",
      username: username?.trim() ?? "",
      password: password ?? "",
      grafanaUrl: grafanaUrl?.trim() ?? "",
      groupId: gid,
    });
    await recordAudit({
      groupId: gid,
      userId: req.user.id,
      action: "elasticsearch_config.created",
      resourceType: "elasticsearch_config",
      resourceId: String(id),
      metadata: { name: name.trim(), host: host.trim() },
    });
    res.status(201).json({ id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch("/elasticsearch-configs/:id", async (req, res) => {
  const { getElasticConfigById, updateElasticConfig } = await import("../db/elasticConfigs.js");
  const id = parseInt(req.params.id, 10);
  const row = await getElasticConfigById(id);
  if (!row) return res.status(404).json({ error: "Not found" });
  if (req.user.role !== "admin" && !(req.user.groupIds || []).includes(row.group_id)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const { name, host, port, telemetryIndex, metricsIndex, alertsIndex, username, password, grafanaUrl } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Name is required" });
  if (!host?.trim()) return res.status(400).json({ error: "Host is required" });
  try {
    await updateElasticConfig(id, {
      name: name.trim(),
      host: host.trim(),
      port: port ? parseInt(port, 10) : 9200,
      telemetryIndex: telemetryIndex?.trim() ?? "",
      metricsIndex: metricsIndex?.trim() ?? "",
      alertsIndex: alertsIndex?.trim() ?? "",
      username: username?.trim() ?? "",
      grafanaUrl: grafanaUrl?.trim() ?? "",
      password: password?.trim() ? password : undefined,
    });
    await recordAudit({
      groupId: row.group_id,
      userId: req.user.id,
      action: "elasticsearch_config.updated",
      resourceType: "elasticsearch_config",
      resourceId: String(id),
      metadata: { name: name.trim(), host: host.trim() },
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/elasticsearch-configs/:id", async (req, res) => {
  const { getElasticConfigById, deleteElasticConfig } = await import("../db/elasticConfigs.js");
  const id = parseInt(req.params.id, 10);
  const row = await getElasticConfigById(id);
  if (!row) return res.status(404).json({ error: "Not found" });
  if (req.user.role !== "admin" && !(req.user.groupIds || []).includes(row.group_id)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  await deleteElasticConfig(id);
  await recordAudit({
    groupId: row.group_id,
    userId: req.user.id,
    action: "elasticsearch_config.deleted",
    resourceType: "elasticsearch_config",
    resourceId: String(id),
    metadata: { name: row.name, host: row.host },
  });
  res.json({ ok: true });
});

router.get("/audit", async (req, res) => {
  const { listAuditForGroups, listAllAuditEvents } = await import(
    "../db/audit.js"
  );
  const limit = parseInt(req.query.limit, 10) || 200;
  const events =
    req.user.role === "admin"
      ? await listAllAuditEvents({ limit })
      : await listAuditForGroups(req.user.groupIds || [], { limit });
  res.json({ events });
});

export default router;
