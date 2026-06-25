// Scenario registry — maps dashboard scenario keys to their Quay image tag and
// local kraken-hub directory. Used by the backend /scenario-fields/:scenario
// route and by the scenario selector UI.
export const SCENARIO_REGISTRY = {
  "pod-scenarios":       { label: "Pod Scenarios",        quayTag: "pod-scenarios",       hubDir: "pod-scenarios" },
  "container-scenarios": { label: "Container Scenarios",  quayTag: "container-scenarios", hubDir: "container-scenarios" },
  "namespace-scenarios": { label: "Namespace Scenarios",  quayTag: "namespace-scenarios", hubDir: "namespace-scenarios" },
  "node-scenarios":      { label: "Node Scenarios",       quayTag: "node-scenarios",      hubDir: "node-scenarios" },
  "pvc-scenarios":       { label: "PVC Scenarios",        quayTag: "pvc-scenarios",       hubDir: "pvc-scenario" },
  "time-scenarios":      { label: "Time Scenarios",       quayTag: "time-scenarios",      hubDir: "time-scenarios" },
  "power-outages":       { label: "Power Outages",        quayTag: "power-outages",       hubDir: "power-outages" },
  "node-cpu-hog":        { label: "Node CPU Hog",         quayTag: "node-cpu-hog",        hubDir: "node-cpu-hog" },
  "node-io-hog":         { label: "Node IO Hog",          quayTag: "node-io-hog",         hubDir: "node-io-hog" },
  "node-memory-hog":     { label: "Node Memory Hog",      quayTag: "node-memory-hog",     hubDir: "node-memory-hog" },
  "kubevirt-outage":     { label: "KubeVirt Outage",      quayTag: "kubevirt-outage",     hubDir: "kubevirt-outage" },
};

// Global krkn parameters — these are not scenario-specific and have no
// krkn-hub JSON equivalent, so they are maintained here manually.
export const globalParamsData = [
  {
    category: "Tunings",
    defaultExpanded: true,
    fields: [
      { key: "WAIT_DURATION", label: "Wait Duration", helperText: "Duration in seconds to wait between each chaos scenario", defaultValue: "10" },
      { key: "ITERATIONS", label: "Iterations", helperText: "Number of times to execute the scenarios", defaultValue: "1" },
      { key: "DAEMON_MODE", label: "Daemon Mode", helperText: "Iterations are set to infinity which means that the kraken will cause chaos forever", defaultValue: "False", warning: "When enabled, chaos will run indefinitely without stopping. The container must be manually deleted to halt execution." }
    ]
  },
  {
    category: "Kraken & Cerberus",
    fields: [
      { key: "PUBLISH_KRAKEN_STATUS", label: "Publish Kraken Status", helperText: "Publish kraken status to the signal address", defaultValue: "True" },
      { key: "SIGNAL_ADDRESS", label: "Signal Address", helperText: "Address to publish kraken status to", defaultValue: "0.0.0.0" },
      { key: "PORT", label: "Port", helperText: "Port to publish kraken status to", defaultValue: "8081" },
      { key: "SIGNAL_STATE", label: "Signal State", helperText: "Waits for the RUN signal when set to PAUSE before running the scenarios", defaultValue: "RUN" },
      { key: "CERBERUS_ENABLED", label: "Cerberus Enabled", helperText: "Set this to true if cerberus is running and monitoring the cluster", defaultValue: "False" },
      { key: "CERBERUS_URL", label: "Cerberus URL", helperText: "URL to poll for the go/no-go signal", defaultValue: "http://0.0.0.0:8080" }
    ]
  },
  {
    category: "Resiliency",
    fields: [
      { key: "RESILIENCY_RUN_MODE", label: "Resiliency Run Mode", helperText: "Resiliency scoring mode: standalone, detailed, or disabled", defaultValue: "standalone" },
      { key: "RESILIENCY_FILE", label: "Resiliency File", helperText: "Path to a YAML file containing SLO definitions", defaultValue: "config/alerts.yaml" }
    ]
  },
  {
    category: "Performance & Metrics",
    fields: [
      { key: "PROMETHEUS_URI", label: "Prometheus URI", helperText: "URI to Prometheus instance; auto-detected on OpenShift, required for Kubernetes", defaultValue: "" },
      { key: "PROMETHEUS_TOKEN", label: "Prometheus Token", helperText: "Bearer token for Prometheus authentication; auto-detected on OpenShift, required for Kubernetes", defaultValue: "" },
      { key: "UUID", label: "UUID", helperText: "UUID for the run; auto generated if not set", defaultValue: "" },
      { key: "CAPTURE_METRICS", label: "Capture Metrics", helperText: "Captures metrics as specified in the profile from in-cluster prometheus", defaultValue: "False" },
      { key: "METRICS_PATH", label: "Metrics Path", helperText: "Path to the metrics profile to use when CAPTURE_METRICS is set", defaultValue: "config/metrics-aggregated.yaml" },
      { key: "ENABLE_ALERTS", label: "Enable Alerts", helperText: "Evaluates expressions from in-cluster prometheus and exits 0 or 1", defaultValue: "False" },
      { key: "ALERTS_PATH", label: "Alerts Path", helperText: "Path to the alerts file to use when ENABLE_ALERTS is set", defaultValue: "config/alerts" },
      { key: "CHECK_CRITICAL_ALERTS", label: "Check Critical Alerts", helperText: "When enabled will check prometheus for critical alerts firing post chaos", defaultValue: "False" }
    ]
  },
  {
    category: "Elastic",
    fields: [
      { key: "ENABLE_ES", label: "Enable ES", helperText: "Enable Elasticsearch integration", defaultValue: "False" },
      { key: "ES_VERIFY_CERTS", label: "ES Verify Certs", helperText: "Verify SSL certificates when connecting to Elasticsearch", defaultValue: "True" },
      { key: "ES_SERVER", label: "ES Server", helperText: "URL of the Elasticsearch instance", defaultValue: "" },
      { key: "ES_PORT", label: "ES Port", helperText: "Port of the Elasticsearch instance", defaultValue: "" },
      { key: "ES_USERNAME", label: "ES Username", helperText: "Username for Elasticsearch authentication", defaultValue: "" },
      { key: "ES_PASSWORD", label: "ES Password", helperText: "Password for Elasticsearch authentication", defaultValue: "" },
      { key: "ES_METRICS_INDEX", label: "ES Metrics Index", helperText: "Elasticsearch index for metrics data", defaultValue: "" },
      { key: "ES_ALERTS_INDEX", label: "ES Alerts Index", helperText: "Elasticsearch index for alerts data", defaultValue: "" },
      { key: "ES_TELEMETRY_INDEX", label: "ES Telemetry Index", helperText: "Elasticsearch index for telemetry data", defaultValue: "" },
      { key: "ES_RUN_TAG", label: "ES Run Tag", helperText: "Tag to identify the run in Elasticsearch", defaultValue: "" }
    ]
  },
  {
    category: "Health Checks",
    fields: [
      { key: "HEALTH_CHECK_URL", label: "Health Check URL", helperText: "URL to continually check and detect downtimes", defaultValue: "" },
      { key: "HEALTH_CHECK_INTERVAL", label: "Health Check Interval", helperText: "Interval in seconds at which to run health checks", defaultValue: "2" },
      { key: "HEALTH_CHECK_BEARER_TOKEN", label: "Health Check Bearer Token", helperText: "Bearer token used for authenticating into health check URL", defaultValue: "" },
      { key: "HEALTH_CHECK_AUTH", label: "Health Check Auth", helperText: "Tuple of (username, password) used for authenticating into health check URL", defaultValue: "" },
      { key: "HEALTH_CHECK_EXIT_ON_FAILURE", label: "Health Check Exit On Failure", helperText: "If True, exits when health check fails for application", defaultValue: "" },
      { key: "HEALTH_CHECK_VERIFY", label: "Health Check Verify", helperText: "Health check URL SSL validation", defaultValue: "False" }
    ]
  },
  {
    category: "Virt Checks",
    fields: [
      { key: "KUBE_VIRT_CHECK_INTERVAL", label: "Kube Virt Check Interval", helperText: "Interval in seconds at which to test kubevirt connections", defaultValue: "2" },
      { key: "KUBE_VIRT_NAMESPACE", label: "Kube Virt Namespace", helperText: "Namespace to find VMIs in and watch", defaultValue: "" },
      { key: "KUBE_VIRT_NAME", label: "Kube Virt Name", helperText: "Regex style name to match VMIs to watch", defaultValue: "" },
      { key: "KUBE_VIRT_FAILURES", label: "Kube Virt Failures", helperText: "If True, will only report when ssh connections fail to VMI", defaultValue: "" },
      { key: "KUBE_VIRT_DISCONNECTED", label: "Kube Virt Disconnected", helperText: "Use disconnected check by passing cluster API", defaultValue: "False" },
      { key: "KUBE_VIRT_NODE_NAME", label: "Kube Virt Node Name", helperText: "If set, will filter VMs to only track ones running on the specified node", defaultValue: "" },
      { key: "KUBE_VIRT_EXIT_ON_FAILURE", label: "Kube Virt Exit On Failure", helperText: "Fails run if VMs still have false status at end of run", defaultValue: "False" },
      { key: "KUBE_VIRT_SSH_NODE", label: "Kube Virt SSH Node", helperText: "If set, will be a backup way to SSH to a node", defaultValue: "" }
    ]
  },
  {
    category: "Telemetry",
    fields: [
      { key: "TELEMETRY_ENABLED", label: "Telemetry Enabled", helperText: "Enable/disables the telemetry collection feature", defaultValue: "False" },
      { key: "TELEMETRY_API_URL", label: "Telemetry API URL", helperText: "Telemetry service endpoint", defaultValue: "https://ulnmf9xv7j.execute-api.us-west-2.amazonaws.com/production" },
      { key: "TELEMETRY_USERNAME", label: "Telemetry Username", helperText: "Telemetry service username", defaultValue: "redhat-chaos" },
      { key: "TELEMETRY_PASSWORD", label: "Telemetry Password", helperText: "Telemetry service password", defaultValue: "" },
      { key: "TELEMETRY_PROMETHEUS_BACKUP", label: "Telemetry Prometheus Backup", helperText: "Enables/disables prometheus data collection", defaultValue: "True" },
      { key: "TELEMETRY_FULL_PROMETHEUS_BACKUP", label: "Telemetry Full Prometheus Backup", helperText: "If set to False only the /prometheus/wal folder will be downloaded", defaultValue: "False" },
      { key: "TELEMETRY_BACKUP_THREADS", label: "Telemetry Backup Threads", helperText: "Number of telemetry download/upload threads", defaultValue: "5" },
      { key: "TELEMETRY_ARCHIVE_PATH", label: "Telemetry Archive Path", helperText: "Local path where the archive files will be temporarily stored", defaultValue: "/tmp" },
      { key: "TELEMETRY_MAX_RETRIES", label: "Telemetry Max Retries", helperText: "Maximum number of upload retries (if 0 will retry forever)", defaultValue: "0" },
      { key: "TELEMETRY_RUN_TAG", label: "Telemetry Run Tag", helperText: "If set, this will be appended to the run folder in the S3 bucket", defaultValue: "chaos" },
      { key: "TELEMETRY_GROUP", label: "Telemetry Group", helperText: "If set will archive the telemetry in the S3 bucket on a folder named after the value", defaultValue: "default" },
      { key: "TELEMETRY_ARCHIVE_SIZE", label: "Telemetry Archive Size", helperText: "The size of the prometheus data archive in KB", defaultValue: "1000" },
      { key: "TELEMETRY_LOGS_BACKUP", label: "Telemetry Logs Backup", helperText: "Logs backup to S3", defaultValue: "False" },
      { key: "TELEMETRY_EVENTS_BACKUP", label: "Telemetry Events Backup", helperText: "Enables/disables events backup to S3", defaultValue: "False" },
      { key: "TELEMETRY_FILTER_PATTERN", label: "Telemetry Filter Pattern", helperText: "Filter logs based on certain timestamp patterns", defaultValue: "" },
      { key: "TELEMETRY_CLI_PATH", label: "Telemetry CLI Path", helperText: "OC CLI path, if not specified will be searched in $PATH", defaultValue: "" }
    ]
  }
];
