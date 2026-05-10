/** Match server `extractReplayBaseStem` for kube/Podman display names */
export function extractReplayBaseStem(name) {
  let s = String(name ?? "krkn-run").replace(/^\//, "");
  s = s.replace(/-replay-\d{8}\.\d{8}(?:-\d+)?$/i, "");
  return s.trim() || "krkn-run";
}
