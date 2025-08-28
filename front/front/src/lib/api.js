// src/lib/api.js
import axios from "axios";

export const API_BASE =
  import.meta.env?.VITE_API_BASE_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  "http://localhost:8080";

export const api = axios.create({
  baseURL: API_BASE,
  // withCredentials: true, // 세션 쿠키 쓸 때만 켜세요(지금은 JWT 헤더 사용)
});

export function setAccessToken(token) {
  if (token) {
    localStorage.setItem("accessToken", token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem("accessToken");
    delete api.defaults.headers.common.Authorization;
  }
}

// 새로고침 후 기본 주입
const boot = localStorage.getItem("accessToken");
if (boot) setAccessToken(boot);

// 요청 직전 동기화
api.interceptors.request.use((config) => {
  const t = localStorage.getItem("accessToken");
  if (t) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

// 401 → 로그인으로
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      setAccessToken(null);
      const { pathname, search } = window.location;
      const next = encodeURIComponent(pathname + search);
      if (pathname !== "/auth/login") {
        window.location.assign(`/auth/login?next=${next}`);
      }
    }
    return Promise.reject(err);
  }
);
