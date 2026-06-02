export const GROUP_ROLE_OPTIONS = [
  { value: "viewer", label: "Group viewer" },
  { value: "user", label: "Group user" },
  { value: "admin", label: "Group admin" },
];

/** Platform `user` accounts may only be group user or viewer. */
export function groupRoleOptionsForPlatformRole(platformRole) {
  if (platformRole === "admin") return GROUP_ROLE_OPTIONS;
  return GROUP_ROLE_OPTIONS.filter((o) => o.value !== "admin");
}

export function formatGroupMemberships(memberships, groups) {
  if (!memberships?.length) return "—";
  return memberships
    .map((m) => {
      const name = groups.find((g) => g.id === m.groupId)?.name || m.groupId;
      const roleLabel =
        GROUP_ROLE_OPTIONS.find((o) => o.value === m.role)?.label || m.role;
      return `${name} (${roleLabel})`;
    })
    .join(", ");
}
