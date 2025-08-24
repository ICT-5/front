import React, { useState } from "react";
import { useNavigate } from "react-router-dom";


const API = import.meta.env?.VITE_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || "";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      // TODO: 일반 로그인 API 확정되면 주석 해제
      // const res = await fetch(`${API}/auth/login`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   credentials: "include",
      //   body: JSON.stringify(form),
      // });
      // if (!res.ok) throw new Error("이메일/비밀번호를 확인하세요.");
      navigate("/resume/upload");
    } catch (e) {
      setErr(e.message || "로그인에 실패했습니다.");
    }
  };

  const handleKakaoLogin = () => {
    const returnTo = `${window.location.origin}/auth/callback`;
    window.location.href = `${API}/auth/kakao/login?redirect=${encodeURIComponent(returnTo)}`;
  };

  return (
    <div className="auth-wrap">
      <h1 className="auth-title">로그인</h1>

      {/* 일반 로그인 */}
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
        <button type="submit" className="btn-primary" style={{ width: "100%" }}>
          로그인
        </button>
      </form>

      {/* 소셜 로그인 */}
      <div className="social-divider">
        <span className="bar" /><span className="text"></span><span className="bar" />
      </div>
      <button type="button" className="btn-kakao full" onClick={handleKakaoLogin}>
      <img 
        src="/kakao_login_medium_narrow.png" 
        alt="카카오 로그인" 
        style={{ height: "45px" }}
      />
      </button>
    </div>
  );
}
