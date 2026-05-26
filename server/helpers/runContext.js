// Assisted-by: Cursor:Codex5.3
import fs from "fs";

import { authorize } from "../auth/policy.js";
import { isMemberOfGroup, isPlatformAdmin } from "../auth/roles.js";
import { getDefaultGroupId } from "../db/bootstrap.js";
import { getKubeconfigById } from "../db/kubeconfigs.js";

export async function resolveRunContext(req, params, resolveKubeconfigPathForRequest) {
  const user = req.user;
  let groupId = params.groupId ? parseInt(params.groupId, 10) : null;
  const headerGroup = req.headers["x-group-id"];
  if (!groupId && headerGroup) {
    groupId = parseInt(String(headerGroup), 10);
  }
  if (!groupId && user.groupIds?.length) {
    groupId = user.groupIds[0];
  }
  if (!groupId) {
    groupId = await getDefaultGroupId();
  }
  if (!isPlatformAdmin(user)) {
    if (!groupId || !isMemberOfGroup(user, groupId)) {
      const err = new Error("Invalid or unauthorized group");
      err.status = 403;
      throw err;
    }
  }

  const kubeconfigId = params.kubeconfigId
    ? parseInt(params.kubeconfigId, 10)
    : null;
  let kubeConfigFileLocation;
  let clusterKey = "*";
  let resolvedKubeconfigId = null;

  if (kubeconfigId) {
    const row = await getKubeconfigById(kubeconfigId);
    if (!row?.storage_path || !fs.existsSync(row.storage_path)) {
      const err = new Error("Kubeconfig not found");
      err.status = 404;
      throw err;
    }
    if (!row.group_id) {
      const err = new Error("Kubeconfig is not assigned to a group");
      err.status = 403;
      throw err;
    }
    if (!isMemberOfGroup(user, row.group_id)) {
      const err = new Error("You are not a member of this kubeconfig's group");
      err.status = 403;
      throw err;
    }
    if (groupId && row.group_id !== groupId) {
      const err = new Error("Kubeconfig does not belong to the selected group");
      err.status = 403;
      throw err;
    }
    if (!groupId) {
      groupId = row.group_id;
    }
    clusterKey = row.cluster_key;
    await authorize(user, "run", clusterKey, groupId);
    kubeConfigFileLocation = row.storage_path;
    resolvedKubeconfigId = row.id;
  } else {
    const isFileUpload = Boolean(params?.isFileUpload);
    kubeConfigFileLocation = resolveKubeconfigPathForRequest(isFileUpload);
    await authorize(user, "run", "*", groupId);
  }

  if (!fs.existsSync(kubeConfigFileLocation)) {
    const err = new Error(
      `kubeconfig not found at: ${kubeConfigFileLocation}`
    );
    err.status = 400;
    throw err;
  }

  return {
    groupId,
    kubeconfigId: resolvedKubeconfigId,
    clusterKey,
    kubeConfigFileLocation,
    startedByUserId: user.id,
  };
}
