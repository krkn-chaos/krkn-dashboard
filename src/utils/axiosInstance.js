import Cookies from "universal-cookie";
import axios from "axios";
// import store from "store/store";

// const { getState } = store;

const baseURL = "http://localhost:8000";

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
