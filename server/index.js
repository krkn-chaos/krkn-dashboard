// server/index.js
import * as path from "path";

import { Server } from "socket.io";
import child_process from "child_process";
import chmodr from "chmodr";
import cors from "cors";
import express from "express";
import { fileURLToPath } from "url";
import multer from "multer";
import process from "process";

const PORT = 8000;
const app = express();

app.use(cors());
app.use(express.json());

/* Set path to upload config file */
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const uploadFilePath = path.resolve(__dirname, "../", "src/assets");

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
  const passwd = req.headers?.authorization?.split(" ")[1];
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
      command = `${PODMAN} run --env NAMESPACE=${req.body.params.namespace} --env NAME_PATTERN=${req.body.params.name_pattern} --env POD_LABEL=${req.body.params.pod_label} --env DISRUPTION_COUNT=${req.body.params.disruption_count}  --env KILL_TIMEOUT=${req.body.params.kill_timeout} --env WAIT_TIMEOUT=${req.body.params.wait_timeout} --env EXPECTED_POD_COUNT=${req.body.params.expected_pod_count} --name=krkn --net=host  -v ${kubeConfigPath}:/root/.kube/config:z -d quay.io/redhat-chaos/krkn-hub:pod-scenarios`;
      break;
    case "container-scenarios":
      command = `${PODMAN} run  --env NAMESPACE=${req.body.params.namespace} --env LABEL_SELECTOR=${req.body.params.label_selector} --env DISRUPTION_COUNT=${req.body.params.disruption_count} --env CONTAINER_NAME=${req.body.params.container_name} --env ACTION=${req.body.params.action} --env EXPECTED_RECOVERY_TIME=${req.body.params.expected_recovery_time} --name=krkn --net=host  -v ${kubeConfigPath}:/root/.kube/config:z -d quay.io/redhat-chaos/krkn-hub:container-scenarios`;
      break;
    case "node-cpu-hog":
      command = `${PODMAN} run  --env TOTAL_CHAOS_DURATION=${req.body.params.total_chaos_duration} --env NODE_CPU_CORE=${req.body.params.node_cpu_core} --env NODE_CPU_PERCENTAGE=${req.body.params.node_cpu_percentage} --env NAMESPACE=${req.body.params.namespace} --env NODE_SELECTORS=${req.body.params.node_selectors}  --name=krkn --net=host  -v ${kubeConfigPath}:/root/.kube/config:z -d quay.io/redhat-chaos/krkn-hub:node-cpu-hog`;
      break;
    case "node-io-hog":
      command = `${PODMAN} run  --env TOTAL_CHAOS_DURATION=${req.body.params.total_chaos_duration} --env IO_BLOCK_SIZE=${req.body.params.io_block_size} --env IO_WORKERS=${req.body.params.io_workers} --env IO_WRITE_BYTES=${req.body.params.io_write_bytes} --env NAMESPACE=${req.body.params.namespace} --env NODE_SELECTORS=${req.body.params.node_selectors} --name=krkn --net=host  -v ${kubeConfigPath}:/root/.kube/config:z -d quay.io/redhat-chaos/krkn-hub:node-io-hog`;
      break;
    case "node-memory-hog":
      command = `${PODMAN} run  --env TOTAL_CHAOS_DURATION=${req.body.params.total_chaos_duration} --env MEMORY_CONSUMPTION_PERCENTAGE=${req.body.params.memory_consumption_percentage} --env NUMBER_OF_WORKERS=${req.body.params.number_of_workers} --env NAMESPACE=${req.body.params.namespace} --env NODE_SELECTORS=${req.body.params.node_selectors} --name=krkn --net=host  -v ${kubeConfigPath}:/root/.kube/config:z -d quay.io/redhat-chaos/krkn-hub:node-memory-hog`;
      break;
    default:
      command = `echo '${passwd}'`;
  }
  console.log(command);
  child_process.exec(command, (err, stdout, stderr) => {
    if (stdout) {
      res.json({
        message: "Successfully created the container!",
        id: stdout,
        status: "200",
      });
    } else if (stderr || err) {
      res.json({ message: stderr, status: "failed" });
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
  const command = `${PODMAN} ps -a --format=json`;
  child_process.exec(command, (err, stdout, stderr) => {
    if (stdout) {
      res.write(stdout, "", () => {
        console.log("Writing Pod Details...");
      });
      res.end("");
    } else if (stderr) {
      res.json({ message: stderr, status: "failed" });
    } else if (err) {
      res.json({ message: err, status: "failed" });
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
  const command = `${PODMAN} rm -f krkn`;
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
  const command = `podman-remote -v`;
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

const storage = multer.diskStorage({
  destination: uploadFilePath,
  filename: (req, file, cb) => {
    cb(null, "kubeconfig");
  },
});
const upload = multer({ storage: storage });
const uploadFiles = (req, res) => {
  console.log(req.body);
  console.log(req.file);
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

const server = app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("Connection established");
  socket.on("disconnect", () => {
    console.log("Disconnected");
  });

  socket.on("logs", () => {
    const command = `${PODMAN} logs -f krkn`;
    const ls = child_process.exec(command);
    ls.stdout.on("data", (data) => {
      socket.emit("logs", data);
    });
    ls.stderr.on("data", (data) => {
      socket.emit("logs", data);
    });
  });
  socket.on("podStatus", () => {
    const command = `${PODMAN} ps -a --format=json`;
    const ls = child_process.exec(command);
    ls.stdout.on("data", (data) => {
      socket.emit("podStatus", JSON.parse(data));
    });
    ls.stderr.on("data", (data) => {
      socket.emit("podStatus", data);
    });
  });
});
