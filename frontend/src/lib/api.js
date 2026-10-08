const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7000";
const TOKEN_KEY = "workpilotToken";
const USER_KEY = "workpilotUser";

export const apiRequest = async (path, options = {}) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const text = await response.text();
  let result = null;
  if (text) {
    try {
      result = JSON.parse(text);
    } catch {
      result = null;
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearAuth();
      window.location.assign("/login");
    }
    throw new Error(
      result?.message || result?.error || `Request failed (${response.status})`,
    );
  }
  return result;
};

export const saveAuth = ({ token, user }) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getAuthUser = () => {
  const user = localStorage.getItem(USER_KEY);
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
