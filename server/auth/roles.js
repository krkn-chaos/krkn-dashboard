// Assisted-by: Cursor:Codex5.3
/** Platform-wide roles (users.role). */
export const PLATFORM_ROLES = ["admin", "user"];

/** Per-group membership roles (user_groups.role). */
export const GROUP_ROLES = ["admin", "user", "viewer"];

export const GROUP_ROLE_CAPS = {
  viewer: ["view"],
  user: ["view", "run", "cancel"],
  admin: ["view", "run", "cancel", "admin"],
};

/** Default chaos capabilities for platform users when no group context is set. */
export const PLATFORM_USER_CAPS = ["view", "run", "cancel"];

export function isValidPlatformRole(role) {
  return PLATFORM_ROLES.includes(role);
}

export function isValidGroupRole(role) {
  return GROUP_ROLES.includes(role);
}

/** Group roles assignable to a platform `user` (never group admin). */
export function allowedGroupRolesForPlatformRole(platformRole) {
  if (platformRole === "admin") return GROUP_ROLES;
  return ["user", "viewer"];
}

export function isGroupRoleAllowedForPlatformUser(platformRole, groupRole) {
  return allowedGroupRolesForPlatformRole(platformRole).includes(groupRole);
}

export function assertGroupRoleForPlatformUser(platformRole, groupRole) {
  if (!isGroupRoleAllowedForPlatformUser(platformRole, groupRole)) {
    throw new Error(
      "Platform user accounts cannot be assigned the group admin role"
    );
  }
}

export function isPlatformAdmin(user) {
  return user?.role === "admin";
}

export function isPlatformUser(user) {
  return user?.role === "user";
}

export function getGroupRole(user, groupId) {
  const gid = parseInt(groupId, 10);
  if (!gid || !user) return null;
  const memberships = user.groupMemberships;
  if (Array.isArray(memberships)) {
    const m = memberships.find((x) => x.groupId === gid);
    return m?.role ?? null;
  }
  if (user.groupIds?.includes(gid)) {
    return "user";
  }
  return null;
}

export function isMemberOfGroup(user, groupId) {
  const gid = parseInt(groupId, 10);
  if (!gid || !user) return false;
  if (isPlatformAdmin(user)) return true;
  return Boolean(getGroupRole(user, groupId));
}

/** Group-scoped admin (membership role admin). */
export function canManageGroup(user, groupId) {
  return getGroupRole(user, groupId) === "admin";
}

export function getRoleCapsForUser(user, groupId = null) {
  if (isPlatformAdmin(user)) {
    return GROUP_ROLE_CAPS.admin;
  }
  const gid = groupId != null ? parseInt(groupId, 10) : null;
  if (gid) {
    const groupRole = getGroupRole(user, gid);
    if (!groupRole) return [];
    return GROUP_ROLE_CAPS[groupRole] || [];
  }
  if (isPlatformUser(user)) {
    return PLATFORM_USER_CAPS;
  }
  return [];
}
