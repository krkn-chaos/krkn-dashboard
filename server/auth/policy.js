// Assisted-by: Cursor:Codex5.3
import { listPoliciesForUser } from "../db/policies.js";
import {
  getGroupRole,
  isMemberOfGroup,
  isPlatformAdmin,
  getRoleCapsForUser,
} from "./roles.js";

const PERM_RANK = { view: 1, run: 2, cancel: 3, admin: 4 };

function matchesCluster(policyClusterKey, requestedKey) {
  if (policyClusterKey === "*") return true;
  return policyClusterKey === requestedKey;
}

function grantsInclude(policies, action, clusterKey) {
  const need = PERM_RANK[action] ?? 0;
  for (const p of policies) {
    if (!matchesCluster(p.cluster_key, clusterKey)) continue;
    const have = PERM_RANK[p.permission] ?? 0;
    if (have >= need) return true;
    if (p.permission === "admin") return true;
  }
  return false;
}

export async function authorize(user, action, clusterKey = "*", groupId = null) {
  if (!user) {
    const err = new Error("Authentication required");
    err.status = 401;
    throw err;
  }
  if (isPlatformAdmin(user)) return true;

  const gid = groupId != null ? parseInt(groupId, 10) : null;

  if (gid && !isMemberOfGroup(user, gid)) {
    const err = new Error("Not a member of this group");
    err.status = 403;
    throw err;
  }

  const caps = getRoleCapsForUser(user, gid);
  if (!caps.includes(action)) {
    const err = new Error("Role does not allow this action");
    err.status = 403;
    throw err;
  }

  const policyGroupIds = gid ? [gid] : user.groupIds || [];
  const policies = await listPoliciesForUser(user.id, policyGroupIds);
  const normalized = policies.map((p) => ({
    cluster_key: p.cluster_key,
    permission: p.permission,
  }));

  if (grantsInclude(normalized, action, clusterKey)) return true;

  const err = new Error("Insufficient cluster permissions");
  err.status = 403;
  throw err;
}

export function requirePolicy(action, getClusterKey = () => "*") {
  return async (req, res, next) => {
    try {
      const clusterKey = await getClusterKey(req);
      const groupId = req.body?.params?.groupId ?? req.headers["x-group-id"];
      await authorize(req.user, action, clusterKey, groupId);
      next();
    } catch (e) {
      res.status(e.status || 403).json({ error: e.message });
    }
  };
}

export function filterGroupIdsForUser(user) {
  if (!user) return [];
  if (isPlatformAdmin(user)) return null;
  return user.groupIds || [];
}

/** Group ids allowed for past-runs queries; optional single-group filter. */
export function resolvePastRunsGroupIds(user, requestedGroupId) {
  const allowed = filterGroupIdsForUser(user);
  const gid =
    requestedGroupId != null && String(requestedGroupId).trim() !== ""
      ? parseInt(String(requestedGroupId), 10)
      : null;

  if (allowed === null) {
    return gid ? [gid] : null;
  }
  if (gid) {
    return allowed.includes(gid) ? [gid] : [];
  }
  return allowed;
}
