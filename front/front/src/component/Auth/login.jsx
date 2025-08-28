// src/components/Auth/Login.jsx
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, setAccessToken } from "../../lib/api";

export default function Login() {
  const navigate = useNavigate();
  const [qs] = useSearchParams();
  const next = qs.get("next") || "/resume/upload";

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const res = await api.post("/api/users/login", { email, password: pw }, { validateStatus: () => true });
      if (res.status === 200) {
        const token = res.data?.accessToken || res.data?.token || res.data; // 서버 형태에 맞게 유연 처리
        if (!token) {
          setErr("로그인 성공 응답에 토큰이 없습니다.");
          return;
        }
        setAccessToken(token);
        navigate(next, { replace: true });
      } else if (res.status === 401) {
        setErr("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else {
        setErr(res.data?.message || `로그인 실패 (HTTP ${res.status})`);
      }
    } catch (e) {
      setErr(e.message || "로그인 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="auth-wrap">
      <h1 className="auth-title">로그인</h1>
      <form className="auth-form" onSubmit={onSubmit}>
        <label>이메일</label>
        <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        <label>비밀번호</label>
        <input type="password" value={pw} onChange={(e)=>setPw(e.target.value)} required />
        {err && <p className="help-error">{err}</p>}
        <button className="btn-primary btn--block">로그인</button>
      </form>
    </div>
  );
}
