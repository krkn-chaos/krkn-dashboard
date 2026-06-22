import {
  Alert,
  Button,
  Spinner,
} from "@patternfly/react-core";
import {
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";
import React, { useEffect, useState } from "react";

import API from "@/utils/axiosInstance";
import { esConnect } from "@/actions/storageActions.js";
import { useDispatch } from "react-redux";

const ESConnectForm = () => {
  const dispatch = useDispatch();
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(null);

  useEffect(() => {
    API.get("/auth/elasticsearch-configs")
      .then((res) => setConfigs(res.data.configs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const connect = async (cfg) => {
    setConnecting(cfg.id);
    await dispatch(esConnect({
      host: cfg.host ?? "",
      telemetryIndex: cfg.telemetry_index ?? "",
      metricsIndex: cfg.metrics_index ?? "",
      alertsIndex: cfg.alerts_index ?? "",
      port: cfg.port ?? 9200,
      username: cfg.username ?? "",
      password: cfg.password ?? "",
      use_ssl: false,
    }));
    setConnecting(null);
  };

  if (loading) {
    return <Spinner size="lg" aria-label="Loading connections" />;
  }

  if (configs.length === 0) {
    return (
      <Alert variant="info" isInline title="No saved Elasticsearch connections">
        Add connections from Administration → Elasticsearch or Account Settings → Group Elasticsearch configs.
      </Alert>
    );
  }

  return (
    <Table aria-label="Elasticsearch connections" variant="compact">
      <Thead>
        <Tr>
          <Th>Name</Th>
          <Th>Group</Th>
          <Th>Host</Th>
          <Th>Telemetry Index</Th>
          <Th>Metrics Index</Th>
          <Th>Alerts Index</Th>
          <Th>Grafana</Th>
          <Th />
        </Tr>
      </Thead>
      <Tbody>
        {configs.map((c) => (
          <Tr key={c.id}>
            <Td>{c.name}</Td>
            <Td>{c.group_name || "—"}</Td>
            <Td>{c.host}</Td>
            <Td>{c.telemetry_index || "—"}</Td>
            <Td>{c.metrics_index || "—"}</Td>
            <Td>{c.alerts_index || "—"}</Td>
            <Td>
              {c.grafana_url ? (
                <a href={c.grafana_url} target="_blank" rel="noreferrer">
                  Open
                </a>
              ) : "—"}
            </Td>
            <Td>
              <Button
                variant="primary"
                isSmall
                isLoading={connecting === c.id}
                isDisabled={connecting !== null}
                onClick={() => connect(c)}
              >
                Connect
              </Button>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

export default ESConnectForm;
