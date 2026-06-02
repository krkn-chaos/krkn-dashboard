// Assisted-by: Cursor:Codex5.3
import dotenv from "dotenv";

dotenv.config();

/** Initial admin credentials from environment (empty DB bootstrap only). */
export function readDashboardAdminCredentialsFromEnv() {
  const username = process.env.DASHBOARD_ADMIN_USERNAME?.trim() || "";
  const password = process.env.DASHBOARD_ADMIN_PASSWORD?.trim() || "";
  return { username, password, fromEnv: Boolean(username || password) };
}
