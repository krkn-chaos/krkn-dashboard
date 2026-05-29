// server/index.js
import * as path from "path";

import {
  allocateUniqueReplayDisplayName,
  deleteConfig,
  getConfig,
  getDetailsByContainerId,
  getDetailsForAnalytics,
  getResults,
  resolveReplayRootContainerId,
  saveConfig,
  savePodDetails,
} from "./db.js";
import {
  ElasticRunListService,
  fetchAlertsFromOpenSearch,
  fetchComparisonFromOpenSearch,
  fetchSummaryFromOpenSearch,
} from "./opensearch/index.js";
import {
  buildRunGroupsFromRows,
  computeStats,
  enrichRunRow,
  filterByNameRegex,
  filterRowsByOutcome,
  filterRowsByRunKind,
  findGroupIndexForContainerId,
  rowOutcome,
  sortRunGroups,
} from "./pastRuns.js";

import { fetchGrafanaDashboardList } from "./grafanaDashboardIndex.js";
import { Server } from "socket.io";
import child_process from "child_process";
import chmodr from "chmodr";
import cors from "cors";
import express from "express";
import { fileURLToPath } from "url";
import fs from "fs";
import multer from "multer";
import process from "process";
import stripAnsi from "strip-ansi";

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const PORT = 8000;
const app = express();

app.use(cors());
app.use(express.json());

/* Set path to upload config file */
const uploadFilePath = path.resolve(__dirname, "../", "src/assets");

function getChaosAssetsRoot() {
  return (process.env.CHAOS_ASSETS || "").trim().replace(/\/+$/, "");
}

function getUploadKubeconfigPath() {
  return path.join(uploadFilePath, "kubeconfig");
}

function getOrchestratorKubeconfigPath() {
  return path.join(getChaosAssetsRoot(), "kubeconfig");
}

/**
 * Local: always the uploaded/mounted file under `src/assets/kubeconfig`.
 * External container: uploaded file (overwrites mount) when `isFileUpload`; otherwise `CHAOS_ASSETS/kubeconfig`.
 */
function resolveKubeconfigPathForRequest(isFileUpload) {
  if ((process.env.EXTERNAL_CONTAINER_BUILD || "").trim() === "true") {
    if (isFileUpload) {
      return getUploadKubeconfigPath();
    }
    return getOrchestratorKubeconfigPath();
  }
  return getUploadKubeconfigPath();
}

chmodr(uploadFilePath, 0o777, (err) => {
  if (err) {
    console.log("Failed to execute chmod", err);
  } else {
    console.log("Success");
  }
});
let PODMAN = "";
if (process.env.EXTERNAL_CONTAINER_BUILD) {
  PODMAN = "podman-remote";
} else {
  PODMAN = "podman";
}

/** Only krkn-hub containers — avoids huge `podman ps -a` JSON and ERR_CHILD_PROCESS_STDIO_MAXBUFFER. */
const PODMAN_PS_KRKN_HUB_JSON = `${PODMAN} ps -a --filter ancestor=quay.io/krkn-chaos/krkn-hub --format json`;
const EXEC_LARGE_MAX_BUFFER = { maxBuffer: 1024 * 1024 * 50 };

function getPodmanRunPlatformPrefix() {
  const fromEnv = process.env.PODMAN_PLATFORM?.trim();
  if (fromEnv) return `--platform ${fromEnv} `;
  return "--platform linux/amd64 ";
}
const PODMAN_RUN_PLATFORM_PREFIX = getPodmanRunPlatformPrefix();

/** Podman container name -> metadata persisted when the run completes */
const pendingRunMetadata = new Map();

/** normalized pod display name -> interval handle (each run polls independently) */
const runPollIntervalsByPodName = new Map();
/** normalized names we already persisted after exit (avoid duplicate INSERT OR REPLACE wiping meta) */
const persistedExitByPodName = new Set();

function normalizePodLookupKey(podName) {
  return String(podName || "").trim().replace(/^\//, "");
}

/** Podman `run -d` prints full container id on stdout (first line). */
function extractPodmanRunContainerId(stdout) {
  const line = String(stdout || "")
    .trim()
    .split(/\r?\n/)
    .find((l) => l.trim());
  if (!line) return null;
  const s = line.trim().replace(/^sha256:/i, "");
  if (/^[a-f0-9]{64}$/i.test(s)) return s.toLowerCase();
  if (/^[a-f0-9]{12,63}$/i.test(s)) return s.toLowerCase();
  return null;
}

/**
 * Try keys in order; remove every map entry pointing at the same meta object (name + container id aliases).
 */
function takePendingRunMetadata(...lookupKeys) {
  let meta = null;
  for (const raw of lookupKeys) {
    if (raw == null || raw === undefined) continue;
    const s = String(raw).trim();
    if (!s) continue;
    const variants = [
      s,
      s.replace(/^\//, ""),
      s.length >= 12 ? s.slice(0, 12) : null,
    ].filter(Boolean);
    for (const k of variants) {
      const m = pendingRunMetadata.get(k);
      if (m) {
        meta = m;
        break;
      }
    }
    if (meta) break;
  }
  if (meta) {
    for (const [k, v] of [...pendingRunMetadata.entries()]) {
      if (v === meta) pendingRunMetadata.delete(k);
    }
  }
  return meta;
}

// Validates the podman socket before starting a container instance
if (
  process.env.EXTERNAL_CONTAINER_BUILD &&
  !fs.existsSync("/run/podman/podman.sock") &&
  !process.env.CONTAINER_HOST
) {
  console.warn(
    "[chaos-dashboard] podman-remote: missing /run/podman/podman.sock. Mount the Podman socket, e.g. " +
    "-v /run/podman/podman.sock:/run/podman/podman.sock:z (use this path from podman run; it resolves on Podman Machine), " +
    "or set CONTAINER_HOST for a TCP API. See containers/podman-run.sh."
  );
} else if (
  process.env.EXTERNAL_CONTAINER_BUILD &&
  fs.existsSync("/run/podman/podman.sock") &&
  !process.env.CONTAINER_HOST
) {
  try {
    fs.accessSync("/run/podman/podman.sock", fs.constants.R_OK | fs.constants.W_OK);
  } catch (err) {
    if (err?.code === "EACCES") {
      console.warn(
        "[chaos-dashboard] Podman socket is present but not accessible (EACCES). Add " +
        "--security-opt label=disable and --group-add \"$(podman machine ssh 'stat -c %g /run/podman/podman.sock')\" " +
        "for Podman Machine, or --group-add \"$(stat -c %g /run/podman/podman.sock)\" on Linux. See containers/podman-run.sh."
      );
    }
  }
}

app.post("/start-kraken/", async (req, res) => {
  const scenario = req.body.params.scenarioChecked;
  const isFileUpload = Boolean(req.body.params?.isFileUpload);

  let replayResolvedId = null;
  const rawReplay = req.body.params?.replayOfContainerId;
  if (rawReplay && String(rawReplay).trim()) {
    try {
      replayResolvedId = await resolveReplayRootContainerId(
        String(rawReplay).trim()
      );
    } catch (e) {
      console.warn("[start-kraken] resolveReplayRoot:", e?.message);
      replayResolvedId = String(rawReplay).trim();
    }
  }

  const paramsForMeta = {
    ...req.body.params,
    ...(replayResolvedId ? { replayOfContainerId: replayResolvedId } : {}),
  };

  const kubeConfigFileLocation = resolveKubeconfigPathForRequest(isFileUpload);
  if (!fs.existsSync(kubeConfigFileLocation)) {
    return res.status(400).json({
      message: `kubeconfig not found at: ${kubeConfigFileLocation}. If the file exists elsewhere in the image, CHAOS_ASSETS is wrong for this image.`,
      status: "failed",
    });
  }

  // kubeconfig path: KUBECONFIG_PATH when set (e.g. host path for podman-remote) and fallback to the file location above when on npm run dev
  const kubeConfigPath = (process.env.KUBECONFIG_PATH || "").trim() || kubeConfigFileLocation;

  let command = "";
  switch (scenario) {
    case "pod-scenarios":
      command = `${PODMAN} run ${PODMAN_RUN_PLATFORM_PREFIX} --env NAMESPACE=${req.body.params.namespace} --env NAME_PATTERN=${req.body.params.name_pattern} --env POD_LABEL=${req.body.params.pod_label} --env DISRUPTION_COUNT=${req.body.params.disruption_count}  --env KILL_TIMEOUT=${req.body.params.kill_timeout} --env WAIT_DURATION=${req.body.params.wait_timeout} --env EXPECTED_POD_COUNT=${req.body.params.expected_pod_count} --name=${req.body.params.name} --net=host -v ${kubeConfigPath}:/home/krkn/.kube/config:z -d quay.io/krkn-chaos/krkn-hub:pod-scenarios`;
      break;
    case "container-scenarios":
      command = `${PODMAN} run ${PODMAN_RUN_PLATFORM_PREFIX} --env NAMESPACE=${req.body.params.namespace} --env LABEL_SELECTOR=${req.body.params.label_selector} --env DISRUPTION_COUNT=${req.body.params.disruption_count} --env CONTAINER_NAME=${req.body.params.container_name} --env ACTION=${req.body.params.action} --env EXPECTED_RECOVERY_TIME=${req.body.params.expected_recovery_time} --name=${req.body.params.name} --net=host  -v ${kubeConfigPath}:/home/krkn/.kube/config:z -d quay.io/krkn-chaos/krkn-hub:container-scenarios`;
      break;
    case "node-cpu-hog":
      command = `${PODMAN} run ${PODMAN_RUN_PLATFORM_PREFIX} --env TOTAL_CHAOS_DURATION=${req.body.params.total_chaos_duration} --env NODE_CPU_CORE=${req.body.params.node_cpu_core} --env NODE_CPU_PERCENTAGE=${req.body.params.node_cpu_percentage} --env NAMESPACE=${req.body.params.namespace} --env NODE_SELECTORS=${req.body.params.node_selectors}  --name=${req.body.params.name} --net=host  -v ${kubeConfigPath}:/home/krkn/.kube/config:z -d quay.io/krkn-chaos/krkn-hub:node-cpu-hog`;
      break;
    case "node-io-hog":
      command = `${PODMAN} run ${PODMAN_RUN_PLATFORM_PREFIX} --env TOTAL_CHAOS_DURATION=${req.body.params.total_chaos_duration} --env IO_BLOCK_SIZE=${req.body.params.io_block_size} --env IO_WORKERS=${req.body.params.io_workers} --env IO_WRITE_BYTES=${req.body.params.io_write_bytes} --env NAMESPACE=${req.body.params.namespace} --env NODE_SELECTORS=${req.body.params.node_selectors} --name=${req.body.params.name} --net=host  -v ${kubeConfigPath}:/home/krkn/.kube/config:z -d quay.io/krkn-chaos/krkn-hub:node-io-hog`;
      break;
    case "node-memory-hog":
      command = `${PODMAN} run ${PODMAN_RUN_PLATFORM_PREFIX} --env TOTAL_CHAOS_DURATION=${req.body.params.total_chaos_duration} --env MEMORY_CONSUMPTION_PERCENTAGE=${req.body.params.memory_consumption_percentage} --env NUMBER_OF_WORKERS=${req.body.params.number_of_workers} --env NAMESPACE=${req.body.params.namespace} --env NODE_SELECTORS=${req.body.params.node_selectors} --name=${req.body.params.name} --net=host  -v ${kubeConfigPath}:/home/krkn/.kube/config:z -d quay.io/krkn-chaos/krkn-hub:node-memory-hog`;
      break;
    case "pvc-scenarios":
      command = `${PODMAN} run ${PODMAN_RUN_PLATFORM_PREFIX} --env PVC_NAME=${req.body.params.pvc_name} --env POD_NAME=${req.body.params.pod_name} --env NAMESPACE=${req.body.params.namespace} --env FILL_PERCENTAGE=${req.body.params.fill_percentage} --env DURATION=${req.body.params.duration} --env BLOCK_SIZE=${req.body.params.block_size} --name=${req.body.params.name} --net=host --env-host -v ${kubeConfigPath}:/home/krkn/.kube/config:Z -d quay.io/krkn-chaos/krkn-hub:pvc-scenarios`;
      break;
    case "node-scenarios":
      command = `${PODMAN} run ${PODMAN_RUN_PLATFORM_PREFIX} --env ACTION=${req.body.params.action} --env CLOUD_TYPE=${req.body.params.cloud_type} --env LABEL_SELECTOR=${req.body.params.label_selector} --env NODE_NAME=${req.body.params.node_name} --env INSTANCE_COUNT=${req.body.params.instance_count} --env RUNS=${req.body.params.runs} --env TIMEOUT=${req.body.params.timeout} --env DURATION=${req.body.params.duration} --name=${req.body.params.name} --net=host -v ${kubeConfigPath}:/home/krkn/.kube/config:Z -d quay.io/krkn-chaos/krkn-hub:node-scenarios`;
      break;
    case "time-scenarios":
      command = `${PODMAN} run ${PODMAN_RUN_PLATFORM_PREFIX} --env OBJECT_TYPE=${req.body.params.object_type} --env LABEL_SELECTOR=${req.body.params.label_selector} --env NAMESPACE=${req.body.params.namespace} --env ACTION=${req.body.params.action} --env OBJECT_NAME=${req.body.params.object_name} --env CONTAINER_NAME=${req.body.params.container_name} --name=${req.body.params.name} --net=host -v ${kubeConfigPath}:/home/krkn/.kube/config:Z -d quay.io/krkn-chaos/krkn-hub:time-scenarios`;
      break;
    case "kubevirt-outage":
      command = `${PODMAN} run ${PODMAN_RUN_PLATFORM_PREFIX} --env NAMESPACE=${req.body.params.namespace} --env VM_NAME=${req.body.params.vm_name} --env TIMEOUT=${req.body.params.timeout} --env KILL_COUNT=${req.body.params.kill_count} --name=${req.body.params.name} --net=host -v ${kubeConfigPath}:/home/krkn/.kube/config:Z -d quay.io/krkn-chaos/krkn-hub:kubevirt-outage`;
      break;
    default:
      command = `echo 'No scenario selected'`;
  }
  console.log(command);
  // Podman prints pull/progress to stderr; a non-empty stderr is normal. Only treat
  // non-zero exit (err) as failure. Use a large buffer so first-time image pulls don't
  // hit ERR_CHILD_PROCESS_STDIO_MAXBUFFER.
  child_process.exec(command, EXEC_LARGE_MAX_BUFFER, (err, stdout, stderr) => {
    if (!err) {
      const params = paramsForMeta || {};
      const replayOf = params.replayOfContainerId;
      const runKind =
        replayOf && String(replayOf).trim() ? "replay" : "original";
      const nameKey = normalizePodLookupKey(params.name);
      try {
        const metaObj = {
          scenario_params: JSON.stringify(params),
          replay_of_container_id:
            replayOf && String(replayOf).trim() ? String(replayOf).trim() : null,
          run_kind: runKind,
        };
        pendingRunMetadata.set(nameKey, metaObj);
        const runCid = extractPodmanRunContainerId(stdout);
        if (runCid) {
          pendingRunMetadata.set(runCid, metaObj);
          if (runCid.length >= 12) {
            pendingRunMetadata.set(runCid.slice(0, 12), metaObj);
          }
        }
        persistedExitByPodName.delete(nameKey);
      } catch (e) {
        console.warn("[start-kraken] pendingRunMetadata:", e?.message);
      }
      res.status(200).json({
        message: "Successfully created the container!",
        name: req.body.params.name,
        status: "200",
      });
      {
        const prevT = runPollIntervalsByPodName.get(nameKey);
        if (prevT) {
          clearInterval(prevT);
          runPollIntervalsByPodName.delete(nameKey);
        }
        const pollT = setInterval(
          () => myFunc(req.body.params.name),
          1000 * 9
        );
        runPollIntervalsByPodName.set(nameKey, pollT);
      }
      if (stderr) {
        console.log("[start-kraken] podman stderr (informational):", stripAnsi(stderr).slice(0, 2000));
      }
      return;
    }
    const detail = [stderr, stdout].filter(Boolean).join("\n") || err.message;
    console.error("[start-kraken] failed:", err.message, detail);
    res.status(500).json({
      message: detail || "Unknown error",
      status: "failed",
    });
  });
});

app.get("/getPodStatus", (req, res) => {
  const command = `${PODMAN} inspect krkn --format "{{.State.ExitCode}}"`;
  child_process.exec(command, (err, stdout, stderr) => {
    if (stdout) {
      res.json({
        podStatus: stdout,
        status: "200",
      });
    } else if (stderr || err) {
      res.json({ message: stderr, status: "failed" });
    }
  });
});

app.get("/getPodDetails", (req, res) => {
  child_process.exec(PODMAN_PS_KRKN_HUB_JSON, EXEC_LARGE_MAX_BUFFER, (err, stdout, stderr) => {
    if (err) {
      console.error("Exec error:", err);
      return res.status(500).json({ message: err.message, status: "failed" });
    }

    if (stderr) {
      console.error("Command stderr:", stderr);
      return res.status(500).json({ message: stderr, status: "failed" });
    }

    try {
      const podData = JSON.parse(stdout);
      const filteredPods = podData.filter((pod) =>
        pod.Image.includes("krkn-hub")
      );

      res.json({ status: "success", data: filteredPods });
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      res
        .status(500)
        .json({ message: "Invalid JSON output", status: "failed" });
    }
  });
});

app.get("/getNamespaces", (req, res) => {
  const command = `kubectl get ns -o json`;
  child_process.exec(command, (err, stdout, stderr) => {
    if (stdout) {
      res.json({ message: JSON.parse(stdout) });
    } else if (stderr || err) {
      res.json({ message: stderr, status: "failed" });
    }
  });
});

app.get("/removePod", (req, res) => {
  const command = `${PODMAN} rm -af`;
  child_process.exec(command, (err, stdout, stderr) => {
    if (stdout) {
      res.json({ message: stdout });
    } else if (stderr || err) {
      res.json({ message: stderr, status: "failed" });
    } else {
      res.write("200", "", () => {
        console.log("Writing string Data...");
      });
    }
    res.end();
  });
});

app.get("/getKubeconfigContext", (req, res) => {
  const external = (process.env.EXTERNAL_CONTAINER_BUILD || "").trim() === "true";
  res.json({
    // Upload is always available (including external container: optional override of orchestrator kubeconfig).
    externallyBound: false,
    pathDisplay: external
      ? (process.env.KUBECONFIG_PATH || "").trim() || getOrchestratorKubeconfigPath()
      : "",
  });
});

app.get("/getPodmanStatus", (req, res) => {
  const command = `${PODMAN} -v`;
  child_process.exec(command, (err, stdout, stderr) => {
    if (stdout) {
      const version = stdout.split(" ")[2];
      const hasVersion = !!Number(version?.split(".").join(""));
      res.json({ message: hasVersion, status: "success" });
    } else if (stderr || err) {
      res.json({ message: stderr, status: "failed" });
    }
    res.end();
  });
});
app.post("/saveConfig", async (req, res) => {
  try {
    const { name, params } = req.body.params;
    const result = await saveConfig(name, params);
    return res.json(result);
  } catch (error) {
    return res.json(error);
  }
});

app.get("/getConfig", async (req, res) => {
  try {
    const result = await getConfig();
    return res.json(result);
  } catch (error) {
    return res.json(error);
  }
});
app.get("/getResults", async (req, res) => {
  try {
    const result = await getResults();
    return res.json(result);
  } catch (error) {
    return res.json(error);
  }
});

app.post("/past-runs/allocate-replay-name", async (req, res) => {
  try {
    const stem = req.body?.baseStem ?? req.body?.stem;
    if (stem == null || String(stem).trim() === "") {
      return res.status(400).json({ error: "baseStem is required" });
    }
    const name = await allocateUniqueReplayDisplayName(String(stem));
    return res.json({ name });
  } catch (err) {
    console.error("allocate-replay-name:", err);
    return res
      .status(500)
      .json({ error: err?.message || "Failed to allocate name" });
  }
});

app.get("/past-runs/:containerId", async (req, res) => {
  try {
    const id = req.params.containerId;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Invalid container id" });
    }
    const row = await getDetailsByContainerId(id);
    if (!row) {
      return res.status(404).json({ error: "Run not found" });
    }
    return res.json({ run: enrichRunRow(row) });
  } catch (err) {
    console.error("past-runs get:", err);
    return res
      .status(500)
      .json({ error: err?.message || "Failed to load run" });
  }
});

/** Local DB past runs: filters + grouped originals/replays + sort + pagination by group */
app.post("/past-runs", async (req, res) => {
  try {
    const {
      nameRegex = "",
      imageContains = "",
      startDate = "",
      endDate = "",
      outcome = "all",
      runKind = "all",
      sortBy = "finishedAt",
      sortDir = "desc",
      focusContainerId = "",
      page = 1,
      perPage = 25,
    } = req.body || {};
    let rows = await getDetailsForAnalytics({
      startDate,
      endDate,
      imageContains,
    });
    const nameFilter = filterByNameRegex(rows, nameRegex);
    if (nameFilter.error) {
      return res
        .status(400)
        .json({ error: `Invalid name regex: ${nameFilter.error}` });
    }
    rows = nameFilter.rows;
    rows = filterRowsByRunKind(rows, runKind);
    const stats = computeStats(rows);
    const tableRows = filterRowsByOutcome(rows, outcome).map((r) => ({
      ...enrichRunRow(r),
      outcome: rowOutcome(r),
    }));
    const safeSortBy =
      sortBy === "name" || sortBy === "finishedAt" ? sortBy : "finishedAt";
    const safeSortDir =
      sortDir === "asc" || sortDir === "desc" ? sortDir : "desc";

    let sortedGroups = sortRunGroups(
      buildRunGroupsFromRows(tableRows, runKind),
      safeSortBy,
      safeSortDir
    );

    const safePerPage = Math.min(
      25,
      Math.max(1, parseInt(String(perPage), 10) || 25)
    );
    let normalizedPage = Math.max(1, parseInt(String(page), 10) || 1);

    const focusId =
      typeof focusContainerId === "string" ? focusContainerId.trim() : "";
    if (focusId) {
      const fi = findGroupIndexForContainerId(sortedGroups, focusId);
      if (fi >= 0) {
        normalizedPage = Math.floor(fi / safePerPage) + 1;
      }
    }

    const itemCount = sortedGroups.length;
    const totalPages = Math.max(1, Math.ceil(itemCount / safePerPage));
    normalizedPage = Math.min(normalizedPage, totalPages);
    const start = (normalizedPage - 1) * safePerPage;
    const pagedGroups = sortedGroups.slice(start, start + safePerPage);

    return res.json({
      stats,
      groups: pagedGroups,
      pagination: {
        page: normalizedPage,
        perPage: safePerPage,
        itemCount,
        totalPages,
      },
      filters: {
        nameRegex,
        imageContains,
        startDate,
        endDate,
        outcome,
        runKind,
        sortBy: safeSortBy,
        sortDir: safeSortDir,
      },
    });
  } catch (err) {
    console.error("past-runs:", err);
    return res
      .status(500)
      .json({ error: err?.message || "Failed to load runs" });
  }
});

app.post("/deleteConfig", async (req, res) => {
  try {
    const result = await deleteConfig(req.body.params);
    return res.json(result);
  } catch (error) {
    return res.json(error);
  }
});
/** Persist finished container logs + inspect metadata to SQLite (reliable vs tee pipeline). */
const persistCompletedRun = (podName) => {
  const cmd = `${PODMAN} logs ${podName} 2>&1`;
  child_process.exec(cmd, EXEC_LARGE_MAX_BUFFER, (err, stdout, stderr) => {
    const logText =
      (typeof stdout === "string" ? stdout : stdout?.toString?.() || "") ||
      (typeof stderr === "string" ? stderr : stderr?.toString?.() || "") ||
      "";
    savePodDetailsToFile(podName, logText);
  });
};

const frame = async (status, podName) => {
  if (status !== "exited") return;
  const pk = normalizePodLookupKey(podName);
  const tid = runPollIntervalsByPodName.get(pk);
  if (tid) {
    clearInterval(tid);
    runPollIntervalsByPodName.delete(pk);
  }
  if (persistedExitByPodName.has(pk)) return;
  persistedExitByPodName.add(pk);
  persistCompletedRun(podName);
};
const myFunc = (podName) => {
  const command = `${PODMAN} inspect ${podName} --format "{{.State.Status}}"`;

  child_process.exec(command, (err, stdout, stderr) => {
    if (stdout) {
      frame(stdout.trim(), podName);
    } else if (stderr || err) {
      if (err) {
        console.log(err);
      }
      if (stderr) {
        console.log(stderr);
      }
      return console.log("error in myFunc");
    }
  });
};
const savePodDetailsToFile = async (podName, fileContent) => {
  const command = `${PODMAN} inspect ${podName} `;
  child_process.exec(command, async (err, stdout, stderr) => {
    if (stdout) {
      try {
        const d = JSON.parse(stdout);
        const row = Array.isArray(d) ? d[0] : d;
        const mountDest =
          row?.Mounts?.[0]?.Destination ??
          row?.Mounts?.[0]?.Source ??
          "";
        const displayName =
          typeof row?.Name === "string"
            ? row.Name
            : Array.isArray(row?.Names)
              ? row.Names[0]
              : podName;
        const cidFromInspect = String(row.Id || "")
          .replace(/^sha256:/i, "")
          .trim()
          .toLowerCase();
        const meta = takePendingRunMetadata(
          cidFromInspect,
          cidFromInspect.length >= 12 ? cidFromInspect.slice(0, 12) : null,
          podName,
          displayName
        );
        await savePodDetails(
          row.Id,
          row.ImageName || row.Image || "",
          mountDest,
          row.State?.Status ?? "",
          String(row.State?.ExitCode ?? ""),
          displayName,
          fileContent,
          meta || {}
        );
      } catch (error) {
        console.log("Error saving pod details:", error);
      }
    } else if (stderr || err) {
      console.log(err);
    }
  });
};

app.post("/downloadLogs", (req, res) => {
  const podName = req.body?.params?.container;
  if (!podName || typeof podName !== "string") {
    return res.status(400).json({ error: "Missing or invalid container name" });
  }

  const logFilePath = path.join(__dirname, "podman-logs.txt");
  const podmanProcess = child_process.spawn(PODMAN, ["logs", "-f", podName]);

  const logStream = fs.createWriteStream(logFilePath, { flags: "w" });

  podmanProcess.on("error", (err) => {
    console.error("downloadLogs spawn error:", err.message);
    try {
      logStream.end();
    } catch (_) {
      /* ignore */
    }
    if (!res.headersSent) {
      res.status(500).json({
        error: "Podman is not available or the container was not found.",
      });
    }
  });

  podmanProcess.stdout.on("data", (data) => logStream.write(data));
  podmanProcess.stderr.on("data", (data) => logStream.write(data));

  podmanProcess.on("close", () => {
    logStream.end();
    res.download(logFilePath, "podman-logs.txt", (err) => {
      if (err) {
        res.status(500).json({ error: "Failed to send file" });
      }
    });
  });

  setTimeout(() => podmanProcess.kill(), 6000);
});

const storage = multer.diskStorage({
  destination: uploadFilePath,
  filename: (req, file, cb) => {
    cb(null, "kubeconfig");
  },
});
const upload = multer({ storage: storage });
const uploadFiles = (req, res) => {
  res.json({ status: "200", message: "Successfully uploaded the file" });
};

const handleFileUploadError = (error, req, res) => {
  res.json({ status: "400", message: "Error while uploading the file" });
};
app.post(
  "/uploadFile",
  upload.single("files"),
  uploadFiles,
  handleFileUploadError
);

app.get("/grafana-dashboard-index", async (req, res) => {
  const baseUrl = req.query.baseUrl;
  if (!baseUrl || typeof baseUrl !== "string") {
    return res.status(400).json({ message: "baseUrl query parameter is required" });
  }
  try {
    const result = await fetchGrafanaDashboardList(baseUrl);
    res.json({ status: 200, ...result });
  } catch (err) {
    console.error("Grafana dashboard index error:", err);
    res.status(500).json({
      message: err.message || "Failed to fetch Grafana dashboards",
      dashboards: [],
      source: "error",
    });
  }
});

app.post("/connect-es", async (req, res) => {
  const {
    host,
    username,
    password,
    use_ssl,
    index,
    start_date,
    end_date,
    size,
    offset,
    filters,
  } = req.body.params;
  console.log("Received config:", req.body.params);
  const node = `${use_ssl ? "https" : "https"}://${host}/`;

  const clientOptions = {
    node,
    disableProductCheck: true,
  };

  if (username && password) {
    clientOptions.auth = { username, password };
  }

  if (!use_ssl) {
    clientOptions.ssl = {
      rejectUnauthorized: false,
    };
  }
  const esClient = new ElasticRunListService({ clientOptions });

  try {
    const data = await esClient.fetchRunDetails(
      index,
      size,
      start_date,
      end_date,
      offset,
      filters
    );

    res.json({
      message: "Connected to Elasticsearch",
      results: data,
      status: 200,
    });
  } catch (err) {
    console.error("Elasticsearch error:", err);
    res.status(500).json({ message: "Connection failed", error: err.message });
  }
});

app.post("/summary", async (req, res) => {
  try {
    const {
      host,
      username,
      password,
      use_ssl,
      index,
      start_date,
      end_date,
      size,
      offset,
      filters,
    } = req.body.params;

    const summary = await fetchSummaryFromOpenSearch({
      host,
      use_ssl,
      index,
      username,
      password,
      start_date,
      end_date,
      size,
      offset,
      filters,
    });
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: "Connection failed", error: err.message });
  }
});

app.post("/comparison", async (req, res) => {
  try {
    const {
      host,
      username,
      password,
      use_ssl,
      index,
      start_date,
      end_date,
      size,
      offset,
      filters,
      group_by,
    } = req.body.params;

    const summary = await fetchComparisonFromOpenSearch({
      host,
      use_ssl,
      index,
      username,
      password,
      start_date,
      end_date,
      size,
      offset,
      filters,
      group_by,
    });
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: "Connection failed", error: err.message });
  }
});

app.post("/alertsAnalysis", async (req, res) => {
  try {
    const {
      host,
      username,
      password,
      use_ssl,
      index,
      start_date,
      end_date,
      size,
      offset,
    } = req.body.params;

    const summary = await fetchAlertsFromOpenSearch({
      host,
      use_ssl,
      index,
      username,
      password,
      start_date,
      end_date,
      size,
      offset,
    });
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: "Connection failed", error: err.message });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

const io = new Server(server, {
  cors: { origin: "*" },
  methods: ["GET", "POST"],
});

io.on("connection", (socket) => {
  console.log("Connection established");
  socket.on("disconnect", () => {
    console.log("Disconnected");
  });

  socket.on("logs", (activePod) => {
    const podName = Array.isArray(activePod) ? activePod[0] : activePod;
    if (!podName || typeof podName !== "string") {
      socket.emit("logs", { error: "Invalid pod name" });
      return;
    }

    const ls = child_process.spawn(PODMAN, ["logs", "-f", podName]);

    ls.on("error", (error) => {
      console.error("Error spawning logs command:", error);
      socket.emit("logs", { error: error.message });
    });

    ls.stdout.on("data", (data) => {
      const lines = data.toString().split("\n");
      lines.forEach((line) => {
        if (line.trim()) socket.emit("logs", stripAnsi(line));
      });
    });

    ls.stderr.on("data", (data) => {
      console.error("Error:", data.toString());
      socket.emit("logs", { error: data.toString() });
    });

    ls.on("close", (code) => {
      console.log(`Process exited with code ${code}`);
    });
  });
  socket.on("podStatus", () => {
    child_process.exec(PODMAN_PS_KRKN_HUB_JSON, EXEC_LARGE_MAX_BUFFER, (error, stdout, stderr) => {
      if (error) {
        console.error("Exec error:", error);
        socket.emit("podStatus", { error: "Failed to fetch pod details" });
        return;
      }

      if (stderr) {
        console.error("Command stderr:", stderr);
        socket.emit("podStatus", { error: stderr });
        return;
      }

      try {
        // Parse JSON output from podman
        const podData = JSON.parse(stdout);

        // Filter only pods whose image contains "krkn-hub"
        const filteredPods = podData
          .filter((pod) => pod.Image.includes("krkn-hub"))
          .sort((a, b) => new Date(b.Created) - new Date(a.Created));

        socket.emit("podStatus", filteredPods);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        socket.emit("podStatus", { error: "Invalid JSON output" });
      }
    });
  });
});

function shutdown(signal) {
  console.log(`\nReceived ${signal}, closing server…`);
  // io.close() shuts down Socket.IO and the attached HTTP server (same as `server`).
  io.close((err) => {
    if (err) console.error("Server close error:", err);
    process.exit(err ? 1 : 0);
  });
  setTimeout(() => {
    console.error("Shutdown timed out; exiting.");
    process.exit(1);
  }, 10_000).unref();
}

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => shutdown(sig));
}
