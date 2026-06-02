// Assisted-by: Cursor:Codex5.3
import { canManageGroup, isMemberOfGroup, isPlatformAdmin } from "./roles.js";

export function canAccessKubeconfig(user, row) {
  if (!user || !row?.group_id) return false;
  return isMemberOfGroup(user, row.group_id);
}

/** Any group member may upload kubeconfigs for their group. */
export function canUploadKubeconfig(user, groupId) {
  return isMemberOfGroup(user, groupId);
}

/** Rename/delete: group admin or platform admin. */
export function canManageKubeconfig(user, row) {
  if (!row?.group_id) return false;
  if (isPlatformAdmin(user)) return isMemberOfGroup(user, row.group_id);
  return canManageGroup(user, row.group_id);
}
