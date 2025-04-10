import axios from "axios";

export const getUrl = () => {
  const { hostname, protocol } = window.location;
  return hostname === "localhost"
    ? "http://localhost:8000"
    : `${protocol}//${hostname}:8000`;
};

const baseURL = getUrl();

const axiosInstance = axios.create({ responseType: "json", baseURL });

export default axiosInstance;
