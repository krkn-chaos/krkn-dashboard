// Assisted-by: Cursor:Codex5.3
import child_process from "child_process";
import fs from "fs";
import { promisify } from "util";

const execFile = promisify(child_process.execFile);

/** Derive stable cluster_key from kubeconfig file */
export async function deriveClusterKey(filePath) {
  try {
    const { stdout } = await execFile(
      "kubectl",
      ["config", "view", "--kubeconfig", filePath, "--minify", "-o", "jsonpath={.clusters[0].cluster.server}"],
      { timeout: 10000 }
    );
    const server = String(stdout || "").trim();
    if (server) return server;
  } catch {
    // fallback below
  }

  try {
    const content = fs.readFileSync(filePath, "utf8");
    const serverMatch = content.match(/^\s*server:\s*(\S+)/m);
    if (serverMatch?.[1]) return serverMatch[1].trim();
  } catch {
    /* ignore */
  }

  return `unknown-${Date.now()}`;
}

export async function deriveContextName(filePath) {
  try {
    const { stdout } = await execFile(
      "kubectl",
      ["config", "current-context", "--kubeconfig", filePath],
      { timeout: 5000 }
    );
    const ctx = String(stdout || "").trim();
    if (ctx) return ctx;
  } catch {
    /* ignore */
  }
  return null;
}
