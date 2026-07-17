import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8001";

export const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  withCredentials: true,
  headers: { "X-Requested-With": "XLSBuddy" },
});

api.interceptors.request.use((config) => {
  const lang = localStorage.getItem("xlsbuddy_lang");
  if (lang && lang !== "en") config.headers["X-Language"] = lang;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      if (
        !window.location.pathname.startsWith("/login") &&
        !window.location.pathname.startsWith("/signup") &&
        window.location.pathname !== "/"
      ) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(err);
  }
);

export { api };
export default api;