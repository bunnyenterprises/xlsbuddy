import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8001";

export const API = `${BACKEND_URL}/api`;

const TOKEN_KEY = "xlsbuddy_token";
export const saveToken = (t) => t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);
export const getToken = () => localStorage.getItem(TOKEN_KEY);

const api = axios.create({
  baseURL: API,
  withCredentials: true,
  headers: { "X-Requested-With": "XLSBuddy" },
});

// Attach Bearer token on every request so Safari (which blocks cross-site cookies) stays logged in
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      saveToken(null);
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