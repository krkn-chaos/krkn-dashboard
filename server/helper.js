import process from "process";

export function isCurrentUserRoot() {
  return process.getuid() == 0; // UID 0 is always root
}
