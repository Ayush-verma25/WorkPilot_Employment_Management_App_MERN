import axios from "axios";
import { clearAuth } from "../lib/api.js";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BASE_URL ||
  "http://localhost:7000"
).replace(/\/+$/, "");

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// Attach AUTH token to all network requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("workpilotToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.endsWith("/auth/login");
    if (error.response?.status === 401 && !isLoginRequest) {
      clearAuth();
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  },
);

export default api;
