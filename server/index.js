// server/index.js
import * as path from "path";

import {
  deleteConfig,
  getConfig,
  getResults,
  saveConfig,
  savePodDetails,
} from "./db.js";

import { ElasticsearchService } from "./elasticsearchService.js";
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
let myInterval;

chmodr(uploadFilePath, 0o777, (err) => {
  if (err) {
    console.log("Failed to execute chmod", err);
  } else {
    console.log("Success");
  }
});
let PODMAN = "";
if (process.env.CONTAINER_BUILD) {
  PODMAN = "podman-remote";
} else {
  PODMAN = "podman";
}
app.post("/start-kraken/", (req, res) => {
  const scenario = req.body.params.scenarioChecked;
  let kubeConfigPath = "";

  if (process.env.CONTAINER_BUILD) {
    kubeConfigPath = `${process.env.CHAOS_ASSETS}/kubeconfig`;
  } else {
    kubeConfigPath = req.body.params.isFileUpload
      ? `${uploadFilePath}/kubeconfig`
      : req.body.params.kubeconfigPath;
  }

  let command = "";
  switch (scenario) {
    case "pod-scenarios":
      command = `${PODMAN} run --env NAMESPACE=${req.body.params.namespace} --env NAME_PATTERN=${req.body.params.name_pattern} --env POD_LABEL=${req.body.params.pod_label} --env DISRUPTION_COUNT=${req.body.params.disruption_count}  --env KILL_TIMEOUT=${req.body.params.kill_timeout} --env WAIT_TIMEOUT=${req.body.params.wait_timeout} --env EXPECTED_POD_COUNT=${req.body.params.expected_pod_count} --name=${req.body.params.name} --net=host  -v ${kubeConfigPath}:/root/.kube/config:z -d quay.io/krkn-chaos/krkn-hub:pod-scenarios`;
      break;
    case "container-scenarios":
      command = `${PODMAN} run  --env NAMESPACE=${req.body.params.namespace} --env LABEL_SELECTOR=${req.body.params.label_selector} --env DISRUPTION_COUNT=${req.body.params.disruption_count} --env CONTAINER_NAME=${req.body.params.container_name} --env ACTION=${req.body.params.action} --env EXPECTED_RECOVERY_TIME=${req.body.params.expected_recovery_time} --name=${req.body.params.name} --net=host  -v ${kubeConfigPath}:/root/.kube/config:z -d quay.io/krkn-chaos/krkn-hub:container-scenarios`;
      break;
    case "node-cpu-hog":
      command = `${PODMAN} run  --env TOTAL_CHAOS_DURATION=${req.body.params.total_chaos_duration} --env NODE_CPU_CORE=${req.body.params.node_cpu_core} --env NODE_CPU_PERCENTAGE=${req.body.params.node_cpu_percentage} --env NAMESPACE=${req.body.params.namespace} --env NODE_SELECTORS=${req.body.params.node_selectors}  --name=${req.body.params.name} --net=host  -v ${kubeConfigPath}:/root/.kube/config:z -d quay.io/krkn-chaos/krkn-hub:node-cpu-hog`;
      break;
    case "node-io-hog":
      command = `${PODMAN} run  --env TOTAL_CHAOS_DURATION=${req.body.params.total_chaos_duration} --env IO_BLOCK_SIZE=${req.body.params.io_block_size} --env IO_WORKERS=${req.body.params.io_workers} --env IO_WRITE_BYTES=${req.body.params.io_write_bytes} --env NAMESPACE=${req.body.params.namespace} --env NODE_SELECTORS=${req.body.params.node_selectors} --name=${req.body.params.name} --net=host  -v ${kubeConfigPath}:/root/.kube/config:z -d quay.io/krkn-chaos/krkn-hub:node-io-hog`;
      break;
    case "node-memory-hog":
      command = `${PODMAN} run  --env TOTAL_CHAOS_DURATION=${req.body.params.total_chaos_duration} --env MEMORY_CONSUMPTION_PERCENTAGE=${req.body.params.memory_consumption_percentage} --env NUMBER_OF_WORKERS=${req.body.params.number_of_workers} --env NAMESPACE=${req.body.params.namespace} --env NODE_SELECTORS=${req.body.params.node_selectors} --name=${req.body.params.name} --net=host  -v ${kubeConfigPath}:/root/.kube/config:z -d quay.io/krkn-chaos/krkn-hub:node-memory-hog`;
      break;
    case "pvc-scenarios":
      command = `${PODMAN} run --env PVC_NAME=${req.body.params.pvc_name} --env POD_NAME=${req.body.params.pod_name} --env NAMESPACE=${req.body.params.namespace} --env FILL_PERCENTAGE=${req.body.params.fill_percentage} --env DURATION=${req.body.params.duration} --name=${req.body.params.name} --net=host --env-host -v ${req.body.params.kubeconfigPath}:/root/.kube/config:Z -d quay.io/krkn-chaos/krkn-hub:pvc-scenarios`;
      break;
    case "node-scenarios":
      command = `${PODMAN} run --name=${req.body.params.name} --net=host --env-host=true -v ${req.body.params.kubeconfigPath}:/home/krkn/.kube/config:Z -d quay.io/krkn-chaos/krkn-hub:node-scenarios`;
      break;
    case "time-scenarios":
      command = `${PODMAN} run --env OBJECT_TYPE=${req.body.params.object_type} --env LABEL_SELECTOR=${req.body.params.label_selector} --env NAMESPACE=${req.body.params.namespace} --env ACTION=${req.body.params.action} --env OBJECT_NAME=${req.body.params.object_name} --env CONTAINER_NAME=${req.body.params.container_name} --name=${req.body.params.name} --net=host --env-host -v ${req.body.params.kubeconfigPath}:/root/.kube/config:Z -d quay.io/krkn-chaos/krkn-hub:time-scenarios`;
      break;
    default:
      command = `echo 'No scenario selected'`;
  }
  console.log(command);
  child_process.exec(command, (err, stdout, stderr) => {
    const isSuccess = !err && !stderr;

    if (isSuccess) {
      res.status(200).json({
        message: "Successfully created the container!",
        name: req.body.params.name,
        status: "200",
      });
      myInterval = setInterval(() => myFunc(req.body.params.name), 1000 * 9);
    } else {
      res.status(500).json({
        message: stderr || err?.message || "Unknown error",
        status: "failed",
      });
    }
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
  const command = `${PODMAN} ps -a --format json`;

  child_process.exec(command, (err, stdout, stderr) => {
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
app.post("/deleteConfig", async (req, res) => {
  try {
    const result = await deleteConfig(req.body.params);
    return res.json(result);
  } catch (error) {
    return res.json(error);
  }
});
const frame = async (status, podName) => {
  if (status === "exited") {
    clearInterval(myInterval);
    saveLogs(podName);
  }
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
        await savePodDetails(
          d[0].Id,
          d[0].ImageName,
          d[0].Mounts[0].Destination,
          d[0].State.Status,
          d[0].State.ExitCode,
          d[0].Name,
          fileContent
        );
      } catch (error) {
        console.log("Error saving pod details:", error);
      }
    } else if (stderr || err) {
      console.log(err);
    }
  });
};

const saveLogs = (podName) => {
  const command = `${PODMAN} logs -f ${podName}  |& tee -a ${podName}_logs.log`;
  child_process.exec(command, (err, stdout, stderr) => {
    if (stdout) {
      fs.readFile(`${podName}_logs.log`, "utf8", (err, data) => {
        if (err) {
          console.error("Error reading file:", err);
          return;
        }

        // Call function to store in SQLite database

        savePodDetailsToFile(podName, data);
      });
    } else if (stderr) {
      return console.log("cannot save logs error");
    }
  });
};

app.post("/downloadLogs", (req, res) => {
  const podName = req.body.params.container;
  const logFilePath = path.join(__dirname, "podman-logs.txt");

  const podmanProcess = child_process.spawn("podman", ["logs", "-f", podName]);

  const logStream = fs.createWriteStream(logFilePath, { flags: "w" });

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
  const esClient = new ElasticsearchService({ clientOptions });

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
    const ls = child_process.spawn("podman", ["logs", "-f", activePod]);

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
    const command = `${PODMAN} ps -a --format json`;

    child_process.exec(command, (error, stdout, stderr) => {
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
