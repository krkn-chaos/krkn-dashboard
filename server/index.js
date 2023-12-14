// server/index.js

import "dotenv/config";

import { Server } from "socket.io";
import child_process from "child_process";
import cors from "cors";
import express from "express";

const PORT = 8000;
const app = express();
app.use(cors());
app.use(express.json());

app.post("/start-kraken/", (req, res) => {
  const passwd = req.headers?.authorization?.split(" ")[1];
  const scenario = req.body.params.scenarioChecked;
  let command = "";
  switch (scenario) {
    case "pod-scenarios":
      command = `echo '${passwd}' | sudo -S podman run --env NAMESPACE=${req.body.params.namespace} --env NAME_PATTERN=${req.body.params.name_pattern} --env POD_LABEL=${req.body.params.pod_label} --env DISRUPTION_COUNT=${req.body.params.disruption_count}  --env KILL_TIMEOUT=${req.body.params.kill_timeout} --env WAIT_TIMEOUT=${req.body.params.wait_timeout} --env EXPECTED_POD_COUNT=${req.body.params.expected_pod_count} --name=ui --net=host --env-host -v ${req.body.params.kubeconfigPath}:/root/.kube/config:Z -d quay.io/redhat-chaos/krkn-hub:pod-scenarios`;
      break;
    case "container-scenarios":
      command = `echo '${passwd}' | sudo -S podman run --env NAMESPACE=${req.body.params.namespace} --env LABEL_SELECTOR=${req.body.params.label_selector} --env DISRUPTION_COUNT=${req.body.params.disruption_count} --env CONTAINER_NAME=${req.body.params.container_name} --env ACTION=${req.body.params.action} --env EXPECTED_RECOVERY_TIME=${req.body.params.expected_recovery_time} --name=ui --net=host --env-host -v ${req.body.params.kubeconfigPath}:/root/.kube/config:Z -d quay.io/redhat-chaos/krkn-hub:container-scenarios`;
      break;
    case "node-cpu-hog":
      command = `echo ${passwd} | sudo -S podman run --env TOTAL_CHAOS_DURATION=${req.body.params.total_chaos_duration} --env NODE_CPU_CORE=${req.body.params.node_cpu_core} --env NODE_CPU_PERCENTAGE=${req.body.params.node_cpu_percentage} --env NAMESPACE=${req.body.params.namespace} --env NODE_SELECTORS=${req.body.params.node_selectors}  --name=ui --net=host --env-host -v ${req.body.params.kubeconfigPath}:/root/.kube/config:Z -d quay.io/redhat-chaos/krkn-hub:node-cpu-hog`;
      break;
    case "node-io-hog":
      command = `echo ${passwd} | sudo -S podman run --env TOTAL_CHAOS_DURATION=${req.body.params.total_chaos_duration} --env IO_BLOCK_SIZE=${req.body.params.io_block_size} --env IO_WORKERS=${req.body.params.io_workers} --env IO_WRITE_BYTES=${req.body.params.io_write_bytes} --env NAMESPACE=${req.body.params.namespace} --env NODE_SELECTORS=${req.body.params.node_selectors} --name=ui --net=host --env-host -v ${req.body.params.kubeconfigPath}:/root/.kube/config:Z -d quay.io/redhat-chaos/krkn-hub:node-io-hog`;
      break;
    case "node-memory-hog":
      command = `echo ${passwd} | sudo -S podman run --env TOTAL_CHAOS_DURATION=${req.body.params.total_chaos_duration} --env MEMORY_CONSUMPTION_PERCENTAGE=${req.body.params.memory_consumption_percentage} --env NUMBER_OF_WORKERS=${req.body.params.number_of_workers} --env NAMESPACE=${req.body.params.namespace} --env NODE_SELECTORS=${req.body.params.node_selectors} --name=ui --net=host --env-host -v ${req.body.params.kubeconfigPath}:/root/.kube/config:Z -d quay.io/redhat-chaos/krkn-hub:node-memory-hog`;
      break;
    default:
      command = `echo '${passwd}'`;
  }
  child_process.exec(command, (err, stdout, stderr) => {
    if (stdout) {
      res.json({
        message: "Successfully created the container!",
        id: stdout,
        status: "200",
      });
    }
    if (stderr || err) {
      res.json({ message: stderr, status: "failed" });
    }
  });
});

app.get("/getPodStatus", (req, res) => {
  const passwd = req.headers?.authorization?.split(" ")[1];
  const command = `echo '${passwd}' | sudo -S podman inspect ui --format "{{.State.ExitCode}}"`;
  child_process.exec(command, (err, stdout, stderr) => {
    if (stdout) {
      res.json({
        podStatus: stdout,
        status: "200",
      });
    }
    if (stderr || err) {
      res.json({ message: stderr, status: "failed" });
    }
  });
});

app.get("/getPodDetails", (req, res) => {
  const passwd = req.headers?.authorization?.split(" ")[1];
  const command = `echo '${passwd}' | sudo -S podman ps -a --format=json`;
  child_process.exec(command, (err, stdout, stderr) => {
    if (stdout) {
      res.json({ message: stdout });
    }
    if (stderr || err) {
      res.json({ message: stderr, status: "failed" });
    }
  });
});

app.get("/getNamespaces", (req, res) => {
  const passwd = req.headers?.authorization?.split(" ")[1];
  const command = `echo '${passwd}' | sudo -S kubectl get ns -o json`;
  child_process.exec(command, (err, stdout, stderr) => {
    if (stdout) {
      res.json({ message: JSON.parse(stdout) });
    }
    if (stderr || err) {
      res.json({ message: stderr, status: "failed" });
    }
  });
});

app.get("/removePod", (req, res) => {
  const passwd = req.headers?.authorization?.split(" ")[1];

  const command = `echo '${passwd}' | sudo -S podman rm -f ui`;
  child_process.exec(command, (err, stdout, stderr) => {
    if (stdout) {
      res.json({ message: stdout });
    }
    if (stderr || err) {
      res.json({ message: stderr, status: "failed" });
    }
  });
});

app.get("/getPodmanStatus", (req, res) => {
  const command = `podman -v`;
  child_process.exec(command, (err, stdout, stderr) => {
    if (stdout) {
      const version = stdout.split(" ")[2];
      const hasVersion = !!Number(version?.split(".").join(""));
      res.json({ message: hasVersion, status: "success" });
    }
    if (stderr || err) {
      res.json({ message: stderr, status: "failed" });
    }
  });
});

const server = app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("Connection established");
  const passwd = socket.handshake.headers.passwd;

  socket.on("disconnect", () => {
    console.log("Disconnected");
  });

  socket.on("logs", (passwd) => {
    const command = `echo '${passwd}' | sudo -S podman logs -f ui`;
    const ls = child_process.exec(command);
    ls.stdout.on("data", (data) => {
      socket.emit("logs", data);
    });
    ls.stderr.on("data", (data) => {
      socket.emit("logs", data);
    });
  });
  socket.on("podStatus", () => {
    const command = `echo '${passwd}' | sudo -S podman ps -a --format=json`;
    const ls = child_process.exec(command);
    ls.stdout.on("data", (data) => {
      socket.emit("podStatus", JSON.parse(data));
    });
    ls.stderr.on("data", (data) => {
      socket.emit("podStatus", JSON.parse(data));
    });
  });
});
