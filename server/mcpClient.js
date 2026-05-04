import axios from "axios";

const MCP_BASE = (process.env.MCP_SUMMARY_URL || "http://localhost:5000").replace(
  /\/+$/,
  ""
);

export const fetchMcpAnalysis = async (params) => {
  const {
    es_url,
    username,
    password,
    es_index,
    start_date,
    end_date,
    filters,
  } = params;
  try {
    const { data } = await axios.post(`${MCP_BASE}/analyze`, {
      es_url,
      es_index,
      username,
      password,
      start_date,
      end_date,
      size: 100,
      offset: 0,
      filters,
    });
    return data;
  } catch (error) {
    console.error("MCP API error:", error.response?.data || error.message);
    throw new Error("Failed to fetch MCP analysis data.");
  }
};

export const fetchMcpComparison = async (params) => {
  const {
    es_url,
    username,
    password,
    es_index,
    start_date,
    end_date,
    filters,
    group_by,
  } = params;
  try {
    const { data } = await axios.post(`${MCP_BASE}/comparison`, {
      es_url,
      es_index,
      username,
      password,
      start_date,
      end_date,
      size: 100,
      offset: 0,
      filters,
      group_by,
    });
    return data;
  } catch (error) {
    console.error("MCP API error:", error.response?.data || error.message);
    throw new Error("Failed to fetch MCP comparison data.");
  }
};

export const fetchMcpAlerts = async (params) => {
  const { es_url, username, password, es_index, start_date, end_date, size, offset } =
    params;
  try {
    const { data } = await axios.post(`${MCP_BASE}/alerts`, {
      es_url,
      es_index,
      username,
      password,
      start_date,
      end_date,
      size: size ?? 100,
      offset: offset ?? 0,
    });
    return data;
  } catch (error) {
    console.error("MCP API error:", error.response?.data || error.message);
    throw new Error("Failed to fetch MCP alerts data.");
  }
};
