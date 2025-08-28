// src/lib/api.js
import axios from "axios";

const API_BASE =
  import.meta.env?.VITE_API_BASE_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  "http://localhost:8080";

export const api = axios.create({
  baseURL: API_BASE,
  // withCredentials: true, // 세션 쿠키 방식이면 주석 해제
});

export function setAccessToken(token) {
  if (token) {
    localStorage.setItem("accessToken", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    localStorage.removeItem("accessToken");
    delete api.defaults.headers.common["Authorization"];
  }
}

const boot = localStorage.getItem("accessToken");
if (boot) setAccessToken(boot);

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      setAccessToken(null);
      const back = encodeURIComponent(window.location.pathname + window.location.search);
      if (window.location.pathname !== "/auth/login") {
        window.location.href = `/auth/login?next=${back}`;
      }
    }
    return Promise.reject(err);
  }
);
