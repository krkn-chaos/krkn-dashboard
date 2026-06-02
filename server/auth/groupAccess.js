// Assisted-by: Cursor:Codex5.3
export {
  canManageGroup,
  isMemberOfGroup,
} from "./roles.js";

export function parseGroupId(param) {
  const id = parseInt(param, 10);
  if (!id || Number.isNaN(id)) return null;
  return id;
}
