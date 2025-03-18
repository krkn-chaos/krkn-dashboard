// server/index.js
import * as path from "path";

import AnsiToHtml from "ansi-to-html";
import { Server } from "socket.io";
import child_process from "child_process";
import chmodr from "chmodr";
import cors from "cors";
import express from "express";
import { fileURLToPath } from "url";
import fs from "fs";
import multer from "multer";
import process from "process";
import sqlite3 from "sqlite3";

sqlite3.verbose();
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory
const ansiToHtml = new AnsiToHtml();

const databaseDirectory = __dirname + "/../database/krkn.db";
const db = new sqlite3.Database(
  databaseDirectory,
  sqlite3.OPEN_READWRITE,
  (err) => {
    if (err) return console.error(err);
  }
);

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
      command = `${PODMAN} run --env NAMESPACE=${req.body.params.namespace} --env NAME_PATTERN=${req.body.params.name_pattern} --env POD_LABEL=${req.body.params.pod_label} --env DISRUPTION_COUNT=${req.body.params.disruption_count}  --env KILL_TIMEOUT=${req.body.params.kill_timeout} --env WAIT_TIMEOUT=${req.body.params.wait_timeout} --env EXPECTED_POD_COUNT=${req.body.params.expected_pod_count} --name=${req.body.params.name} --net=host  -v ${kubeConfigPath}:/root/.kube/config:z -d quay.io/redhat-chaos/krkn-hub:pod-scenarios`;
      break;
    case "container-scenarios":
      command = `${PODMAN} run  --env NAMESPACE=${req.body.params.namespace} --env LABEL_SELECTOR=${req.body.params.label_selector} --env DISRUPTION_COUNT=${req.body.params.disruption_count} --env CONTAINER_NAME=${req.body.params.container_name} --env ACTION=${req.body.params.action} --env EXPECTED_RECOVERY_TIME=${req.body.params.expected_recovery_time} --name=${req.body.params.name} --net=host  -v ${kubeConfigPath}:/root/.kube/config:z -d quay.io/redhat-chaos/krkn-hub:container-scenarios`;
      break;
    case "node-cpu-hog":
      command = `${PODMAN} run  --env TOTAL_CHAOS_DURATION=${req.body.params.total_chaos_duration} --env NODE_CPU_CORE=${req.body.params.node_cpu_core} --env NODE_CPU_PERCENTAGE=${req.body.params.node_cpu_percentage} --env NAMESPACE=${req.body.params.namespace} --env NODE_SELECTORS=${req.body.params.node_selectors}  --name=${req.body.params.name} --net=host  -v ${kubeConfigPath}:/root/.kube/config:z -d quay.io/redhat-chaos/krkn-hub:node-cpu-hog`;
      break;
    case "node-io-hog":
      command = `${PODMAN} run  --env TOTAL_CHAOS_DURATION=${req.body.params.total_chaos_duration} --env IO_BLOCK_SIZE=${req.body.params.io_block_size} --env IO_WORKERS=${req.body.params.io_workers} --env IO_WRITE_BYTES=${req.body.params.io_write_bytes} --env NAMESPACE=${req.body.params.namespace} --env NODE_SELECTORS=${req.body.params.node_selectors} --name=${req.body.params.name} --net=host  -v ${kubeConfigPath}:/root/.kube/config:z -d quay.io/redhat-chaos/krkn-hub:node-io-hog`;
      break;
    case "node-memory-hog":
      command = `${PODMAN} run  --env TOTAL_CHAOS_DURATION=${req.body.params.total_chaos_duration} --env MEMORY_CONSUMPTION_PERCENTAGE=${req.body.params.memory_consumption_percentage} --env NUMBER_OF_WORKERS=${req.body.params.number_of_workers} --env NAMESPACE=${req.body.params.namespace} --env NODE_SELECTORS=${req.body.params.node_selectors} --name=${req.body.params.name} --net=host  -v ${kubeConfigPath}:/root/.kube/config:z -d quay.io/redhat-chaos/krkn-hub:node-memory-hog`;
      break;
    case "pvc-scenarios":
      command = `echo ${passwd} | sudo -S podman run --env PVC_NAME=${req.body.params.pvc_name} --env POD_NAME=${req.body.params.pod_name} --env NAMESPACE=${req.body.params.namespace} --env FILL_PERCENTAGE=${req.body.params.fill_percentage} --env DURATION=${req.body.params.duration} --name=${req.body.params.name} --net=host --env-host -v ${req.body.params.kubeconfigPath}:/root/.kube/config:Z -d quay.io/krkn-chaos/krkn-hub:pvc-scenario`;
      break;
    case "time-scenarios":
      command = `echo ${passwd} | sudo -S podman run --env OBJECT_TYPE=${req.body.params.object_type} --env LABEL_SELECTOR=${req.body.params.label_selector} --env NAMESPACE=${req.body.params.namespace} --env ACTION=${req.body.params.action} --env OBJECT_NAME=${req.body.params.object_name} --env CONTAINER_NAME=${req.body.params.container_name} --name=${req.body.params.name} --net=host --env-host -v ${req.body.params.kubeconfigPath}:/root/.kube/config:Z -d quay.io/krkn-chaos/krkn-hub:time-scenarios`;
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
      myInterval = setInterval(() => myFunc(req.body.params.name), 1000 * 9);
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
let sql = "";

db.exec(`CREATE TABLE IF NOT EXISTS test (
    id INTEGER PRIMARY KEY,
    movie varchar(50),
    quote varchar(50),
    char varchar(50)
  );`);

// db.exec(`DROP TABLE config`);
db.exec(`CREATE TABLE IF NOT EXISTS config (
    id INTEGER PRIMARY KEY,
    name varchar(50),
    params json
  );`);
//db.exec(`DROP TABLE details`);
db.exec(`CREATE TABLE IF NOT EXISTS details (
    container_id varchar(250) PRIMARY KEY,
    image varchar(150),
    mounts varchar(100),
    state varchar(20),
    status varchar(10),
    name varchar(50),
    content TEXT
  );`);

app.post("/saveConfig", (req, res) => {
  try {
    const { name, params } = req.body.params;

    sql = `INSERT INTO config(name, params) VALUES (?,?)`;
    db.run(sql, [name, JSON.stringify(params)], (err) => {
      if (err) {
        console.log(err);
        return res.json({ status: 300, message: "error", error: err });
      }
      console.log("successful insertion");
      return res.json({
        status: 200,
        message: "Config saved successfully",
      });
    });
  } catch (error) {
    return res.json({
      status: 400,
      message: false,
    });
  }
});

app.get("/getConfig", (req, res) => {
  try {
    sql = `SELECT * FROM config`;
    db.all(sql, [], (err, rows) => {
      if (err) {
        return res.json({ status: 300, message: "error", error: err });
      }

      return res.json({
        status: 200,
        message: rows,
      });
    });
  } catch (error) {
    return res.json({
      status: 400,
      message: false,
    });
  }
});
app.get("/getResults", (req, res) => {
  try {
    sql = `SELECT * FROM details`;
    db.all(sql, [], (err, rows) => {
      if (err) {
        return res.json({ status: 300, message: "error", error: err });
      }

      return res.json({
        status: 200,
        message: rows,
      });
    });
  } catch (error) {
    return res.json({
      status: 400,
      message: false,
    });
  }
});
app.post("/deleteConfig", (req, res) => {
  try {
    sql = `DELETE FROM config WHERE id=(?)`;
    db.run(sql, [req.body.params], (err) => {
      if (err) {
        console.log(err);
        return res.json({ status: 300, message: "error", error: err });
      }
      return res.json({
        status: 200,
        message: "Deleted!",
      });
    });
  } catch (error) {
    return res.json({
      status: 400,
      message: false,
    });
  }
});
const frame = async (status, podName) => {
  if (status === "exited") {
    clearInterval(myInterval);
    await saveLogs(podName);
  }
};
const myFunc = (podName) => {
  const command = `${PODMAN} inspect ${podName} --format "{{.State.Status}}"`;

  child_process.exec(command, (err, stdout, stderr) => {
    if (stdout) {
      frame(stdout.trim(), podName);
    } else if (stderr || err) {
      return console.log("error");
    }
  });
};
const savePodDetails = (podName, fileContent) => {
  const command = `${PODMAN} inspect ${podName} `;
  child_process.exec(command, (err, stdout, stderr) => {
    if (stdout) {
      sql = `INSERT INTO details(container_id, image, mounts, state, status, name, content) VALUES (?,?,?,?,?,?,?)`;
      const d = JSON.parse(stdout);

      db.run(
        sql,
        [
          d[0].Id,
          d[0].ImageName,
          d[0].Mounts[0].Destination,
          d[0].State.Status,
          d[0].State.ExitCode,
          d[0].Name,
          fileContent,
        ],
        (err) => {
          if (err) {
            console.log(err);
            return;
          }
          console.log("successful insertion");
        }
      );
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

        savePodDetails(podName, data);
      });
    } else if (stderr) {
      return console.log("cannot save logs error");
    }
  });
};

app.post("/downloadLogs", (req, res) => {
  const fileId = req.body.params.container;
  // Query the database to retrieve file data based on fileId
  db.get(
    "SELECT content FROM details WHERE container_id = ?",
    [fileId],
    (err, row) => {
      if (err) {
        console.error("Error querying database:", err);
        res.status(500).send("Internal server error");
        return;
      }
      if (!row) {
        res.status(404).send("File not found");
        return;
      }

      // Set the appropriate headers
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=" + "sample.log"
      );
      res.setHeader("Content-Type", "application/octet-stream");

      // Send the file data as a response
      res.status(200).send(row.content);
    }
  );
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
    const ls = child_process.spawn(PODMAN, ["logs", "-f", activePod]);

    ls.stdout.on("data", (data) => {
      console.log(data.toString());

      socket.emit("logs", ansiToHtml.toHtml(data.toString())); // Send logs as they arrive
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
        const filteredPods = podData.filter((pod) =>
          pod.Image.includes("krkn-hub")
        );

        socket.emit("podStatus", filteredPods);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        socket.emit("podStatus", { error: "Invalid JSON output" });
      }
    });
  });
});
