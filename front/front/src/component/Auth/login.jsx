import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import axios from "axios";
import { API_BASE, setAccessToken } from "../../lib/api";


export default function Login() {
  const navigate = useNavigate();
  const loc = useLocation();
  const next = new URLSearchParams(loc.search).get("next") || "/dashboard";

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post(
        `${API_BASE}/api/users/login`,
        { email: form.email, password: form.password },
        {
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          validateStatus: () => true,
        }
      );

      const token = res.data?.accessToken;
      if ((res.status === 200 || res.status === 201) && token) {
        setAccessToken(token);
        navigate(next, { replace: true });
        return;
      }
      throw new Error(res.data?.message || `로그인 실패 (HTTP ${res.status})`);
    } catch (e) {
      setError(e.message || "로그인에 실패했어요.");
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
          value={form.email}
          onChange={onChange}
          placeholder="you@example.com"
          required
        />
        <label>비밀번호</label>
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={onChange}
          placeholder="••••••"
          required
        />
        {error && <p className="help-error">{error}</p>}
        <button type="submit" className="btn-primary btn--block">로그인</button>
      </form>

      <div className="auth-meta">
        <span>아직 계정이 없나요?</span>
        <Link to="/auth/signup" className="link">회원가입</Link>
      </div>
    </div>
  );
}
