import GrafanaIcon from "@/assets/logo/grafana-icon.png";
import LinkIcon from "@/components/atoms/LinkIcon";
import PropTypes from "prop-types";
import { useMemo } from "react";

const GrafanaLink = (props) => {
  const { config = {}, uuid, grafanaBaseUrl, dashboardPath } = props;
  const grafanaLink = useMemo(() => {
    if (!config || !grafanaBaseUrl?.trim() || !dashboardPath?.trim()) {
      return "";
    }

    const platform = config.cloud_infrastructure ?? "";
    const cloudType = config.cloud_type ?? "";
    const networkType = config.network_plugins?.[0] ?? "";
    const nodeCount = config.total_node_count ?? "";
    const clusterVersion = config.cluster_version ?? "";
    const majorVersion = clusterVersion
      ? clusterVersion.match(/^(\d+\.\d+)/)?.[1] || ""
      : "";
    const runUuid = uuid ?? "";
    const params = new URLSearchParams();

    const grafanaVariables = {
      "var-platform": platform,
      "var-cloud_type": cloudType,
      "var-networkType": networkType,
      "var-node_count":
        nodeCount !== "" && nodeCount != null ? String(nodeCount) : "",
      "var-major_version": majorVersion,
      "var-run_uuid": runUuid,
    };

    Object.entries(grafanaVariables).forEach(([key, value]) => {
      if (value !== "") {
        params.append(key, value);
      }
    });

    const root = grafanaBaseUrl.trim().replace(/\/+$/, "");
    const path = dashboardPath.trim().replace(/^\/+/, "");
    const qs = params.toString();
    return qs ? `${root}/d/${path}?${qs}` : `${root}/d/${path}`;
  }, [
    config?.cloud_infrastructure,
    config?.cloud_type,
    config?.network_plugins,
    config?.total_node_count,
    config?.cluster_version,
    uuid,
    grafanaBaseUrl,
    dashboardPath,
  ]);

  if (!grafanaLink) {
    return null;
  }

  return (
    <LinkIcon
      link={grafanaLink}
      target={"_blank"}
      src={GrafanaIcon}
      altText={"Open Grafana dashboard"}
      height={30}
      width={30}
    />
  );
};

GrafanaLink.propTypes = {
  config: PropTypes.object,
  uuid: PropTypes.string,
  grafanaBaseUrl: PropTypes.string,
  dashboardPath: PropTypes.string,
};

export default GrafanaLink;
