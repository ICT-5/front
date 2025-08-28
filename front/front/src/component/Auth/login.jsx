// src/component/Auth/login.jsx
import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";   // ← 여기!
import "../../styles/Auth/login.css";

export default function Login() {
  const [params] = useSearchParams();
  const next = params.get("next") || "/resume/upload";

  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      await login(form);
      navigate(next, { replace: true });
    } catch (e2) {
      let message = "로그인에 실패했습니다. 이메일/비밀번호를 확인해주세요.";
      if (e2.response?.status === 401) message = "이메일 또는 비밀번호가 올바르지 않습니다.";
      else if (e2.response?.data?.message) message = e2.response.data.message;
      setErr(message);
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-wrap">
      <h1 className="auth-title">로그인</h1>
      <form className="auth-form" onSubmit={onSubmit}>
        <label>이메일</label>
        <input name="email" type="email" value={form.email} onChange={onChange} required />
        <label>비밀번호</label>
        <input name="password" type="password" value={form.password} onChange={onChange} required />
        {err && <p className="help-error">{err}</p>}
        <button type="submit" className="btn-primary btn--block" disabled={loading}>
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>
    </div>
  );
}
