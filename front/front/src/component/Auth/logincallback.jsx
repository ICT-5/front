// src/component/Auth/AuthCallback.jsx (변경 없음)
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
const API = import.meta.env?.VITE_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || "";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [msg, setMsg] = useState("로그인 확인 중…");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/auth/me`, { credentials: "include" });
        if (!res.ok) throw new Error("세션 확인 실패");
        await res.json();
        setMsg("로그인 성공! 이동합니다…");
        navigate("/resume/upload", { replace: true });
      } catch (e) {
        setMsg("로그인 실패. 다시 시도해주세요.");
        setTimeout(() => navigate("/auth/login", { replace: true }), 1200);
      }
    })();
  }, [navigate, search]);

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", textAlign: "center" }}>
      <h2>카카오 로그인</h2>
      <p>{msg}</p>
    </div>
  );
}
