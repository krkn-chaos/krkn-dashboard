import axios from "axios";

export const getUrl = () => {
  const { hostname, protocol } = window.location;
  return hostname === "localhost"
    ? "http://localhost:8000"
    : `${protocol}//${hostname}:8000`;
};

const baseURL = getUrl();

const axiosInstance = axios.create({
  responseType: "json",
  baseURL,
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const path = window.location.pathname || "";
      if (!path.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
