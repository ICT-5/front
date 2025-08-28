// src/context/AuthContext.jsx
import React, { createContext, useContext, useMemo, useState } from "react";
import { api, setAccessToken } from "../lib/api";

const AuthCtx = createContext(null);
export function useAuth() { return useContext(AuthCtx); }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  async function login({ email, password }) {
    const { data } = await api.post("/api/users/login", { email, password });
    const token = data?.accessToken || data?.token || data?.access_token;
    if (token) setAccessToken(token);
    // 필요시 프로필:
    // const me = await api.get("/api/users/me"); setUser(me.data);
    return true;
  }

  function logout() {
    setAccessToken(null);
    setUser(null);
    // 세션쿠키면 서버 로그아웃도:
    // return api.post("/api/users/logout");
  }

  const value = useMemo(() => ({
    user, login, logout,
    isAuthed: !!localStorage.getItem("accessToken") || !!user,
  }), [user]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
