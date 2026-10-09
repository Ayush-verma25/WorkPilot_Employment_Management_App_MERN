import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios.js";
import { clearAuth, getAuthUser, saveAuth } from "../lib/api.js";

const AuthContext = createContext(null);
const TOKEN_KEY = "workpilotToken";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getAuthUser);
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/auth/session");
      setUser(data.user);
    } catch (error) {
      if (error.response?.status === 401) {
        clearAuth();
        setUser(null);
        setToken(null);
      } else {
        console.error("Failed to restore authentication session:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const login = async (email, password, role_type) => {
    const { data } = await api.post("/auth/login", {
      email,
      password,
      role_type,
    });
    if (!data?.token || !data?.user) {
      throw new Error("The server returned an invalid login response.");
    }
    saveAuth(data);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    clearAuth();
    setToken(null);
    setUser(null);
  };

  const value = { user, token, login, logout, loading, refreshSession };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within a AuthProvider");
  return ctx;
}
