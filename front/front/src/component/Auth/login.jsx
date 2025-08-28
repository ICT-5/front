// src/component/Auth/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/Auth/login.css";

const API =
  import.meta.env?.VITE_API_BASE_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  "http://localhost:8080";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      // 🔒 세션-쿠키 기반이면 withCredentials를 켜고,
      // 백엔드 CORS에 allowCredentials=true + 정확한 Origin 허용이 필요합니다.
      const res = await axios.post(
        `${API}/api/users/login`,
        { email: form.email, password: form.password },
        {
          // withCredentials: true, // ← 세션 쿠키 방식이면 주석 해제
        }
      );

      // 🔑 JWT 기반이면 토큰 키 이름에 맞게 저장
      const token =
        res.data?.accessToken || res.data?.token || res.data?.access_token;

      if (token) {
        localStorage.setItem("accessToken", token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }

      // 로그인 성공 → 원하는 첫 화면으로 이동
      navigate("/resume/upload", { replace: true });
    } catch (e2) {
      let message = "로그인에 실패했습니다. 이메일/비밀번호를 확인해주세요.";
      if (e2.response) {
        const { status, data } = e2.response;
        if (status === 401) message = "이메일 또는 비밀번호가 올바르지 않습니다.";
        else if (status === 400) message = "요청 형식이 올바르지 않습니다.";
        else if (data?.message) message = data.message;
      }
      setErr(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <h1 className="auth-title">로그인</h1>

      <form className="auth-form" onSubmit={onSubmit}>
        <label>이메일</label>
        <input
          name="email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={onChange}
          required
        />

        <label>비밀번호</label>
        <input
          name="password"
          type="password"
          placeholder="비밀번호"
          value={form.password}
          onChange={onChange}
          required
        />

        {err && <p className="help-error">{err}</p>}

        <button
          type="submit"
          className="btn-primary btn--block"
          style={{ width: "100%" }}
          disabled={loading}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>
    </div>
  );
}
