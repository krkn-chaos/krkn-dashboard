import Cookies from "universal-cookie";
import axios from "axios";

export const getUrl = () => {
  const { hostname, protocol } = window.location;
  return hostname === "localhost"
    ? "http://localhost:8000"
    : `${protocol}//${hostname}:8000`;
};

const baseURL = getUrl();

const axiosInstance = axios.create({ responseType: "json", baseURL });

axiosInstance.interceptors.request.use((req) => {
  const cookies = new Cookies(null, { path: "/" });
  const passwd = cookies.get("root-password");

  if (passwd) {
    req.headers.Authorization = `Bearer ${passwd}`;
  }
  return req;
});

export default axiosInstance;
