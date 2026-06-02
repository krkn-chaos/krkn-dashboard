// Assisted-by: Cursor:Codex5.3
/** Count running krkn-hub containers targeting the same cluster_key. */
export function countRunningOnCluster(clusterKey, runningPods, pendingRunMetadata) {
  if (!clusterKey) return 0;
  const normalizedKey = String(clusterKey).trim();
  let count = 0;
  const seenMeta = new Set();

  for (const pod of runningPods || []) {
    const state = String(pod.State || pod.Status || "").toLowerCase();
    if (state !== "running") continue;

    const lookupKeys = [
      pod.Names,
      pod.Name,
      pod.ID,
      pod.Id,
      pod.Id?.slice?.(0, 12),
    ].filter(Boolean);

    let meta = null;
    for (const raw of lookupKeys) {
      const s = String(raw).trim().replace(/^\//, "");
      if (!s) continue;
      const variants = [s, s.length >= 12 ? s.slice(0, 12) : null].filter(
        Boolean
      );
      for (const k of variants) {
        const m = pendingRunMetadata.get(k);
        if (m) {
          meta = m;
          break;
        }
      }
      if (meta) break;
    }

    if (!meta || meta.cluster_key !== normalizedKey) continue;
    if (seenMeta.has(meta)) continue;
    seenMeta.add(meta);
    count += 1;
  }

  return count;
}
