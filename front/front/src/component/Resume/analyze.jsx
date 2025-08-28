// src/components/Resume/Analyze.jsx
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../styles/Resume/resume.base.css";
import "../../styles/Resume/analyze.css";

const API_BASE =
  import.meta.env?.VITE_API_BASE_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  "http://localhost:8080";

// 토큰 헤더
const getAuthHeaders = () => {
  const t = localStorage.getItem("accessToken");
  return t ? { Authorization: `Bearer ${t}` } : {};
};

// ✅ JWT에서 숫자 userId 추출 (Base64URL → Base64 + padding)
function extractNumericUserIdFromToken() {
  try {
    const t = localStorage.getItem("accessToken") || "";
    if (!t || t.split(".").length < 2) return null;
    const [, payload] = t.split(".");
    let b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4;
    if (pad) b64 += "=".repeat(4 - pad);
    const json = JSON.parse(atob(b64));
    const raw = json.userId ?? json.id ?? json.uid ?? json.user_id ?? json.sub ?? null;
    const n = Number(raw);
    return Number.isInteger(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export default function ResumeAnalyzing() {
  const { state } = useLocation(); // { file, jdUrl }
  const navigate = useNavigate();

  const [phase, setPhase] = useState("init");
  const [msg, setMsg] = useState("요청 준비 중…");
  const [error, setError] = useState("");
  const abortRef = useRef(null);

  useEffect(() => {
    if (!state?.file || !state?.jdUrl) {
      setPhase("error");
      setError("입력 값이 부족합니다. 처음 화면에서 다시 시도해 주세요.");
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        setPhase("uploading");
        setMsg("서버로 업로드 및 분석 요청 중…");

        // 🔑 백엔드가 여전히 @RequestParam userId를 요구하므로 토큰에서 추출해서 같이 보냄
        const uid = extractNumericUserIdFromToken();
        if (!uid) {
          setPhase("error");
          setError("로그인 토큰에서 userId를 찾을 수 없어요. 다시 로그인해 주세요.");
          return;
        }

        const fd = new FormData();
        fd.append("userId", String(uid));     // ⬅️ 중요: 서버가 요구함
        fd.append("resumeFile", state.file);
        fd.append("jobUrl", state.jdUrl);
        // fd.append("collection", "accepted-essays");
        // fd.append("topK", "5");

        const resp = await fetch(`${API_BASE}/api/flow/analyze`, {
          method: "POST",
          body: fd,                           // Content-Type은 자동(boundary 포함)
          headers: {
            Accept: "application/json",
            ...getAuthHeaders(),              // ⬅️ Bearer 토큰도 같이
          },
          signal: controller.signal,
        });

        if (resp.status === 401) {
          const next = encodeURIComponent("/resume/upload");
          navigate(`/auth/login?next=${next}`, { replace: true });
          return;
        }
        if (!resp.ok) {
          const text = await resp.text().catch(() => "");
          throw new Error(`HTTP ${resp.status} ${resp.statusText}\n${text || "서버 오류"}`);
        }

        const ct = resp.headers.get("content-type") || "";
        const data = ct.includes("application/json") ? await resp.json() : JSON.parse(await resp.text());

        setPhase("success");
        setMsg("분석 완료");
        navigate("/resume/result", { state: data, replace: true });
      } catch (err) {
        if (controller.signal.aborted) {
          setPhase("canceled");
          return;
        }
        setPhase("error");
        setError(err?.message || "분석 중 오류가 발생했습니다.");
      }
    })();

    return () => abortRef.current?.abort();
  }, [navigate, state]);

  const handleRetry = () => navigate(-1);
  const handleCancel = () => abortRef.current?.abort();

  return (
    <div className="resume-wrap">
      <h1 className="resume-title">이력서 분석 중…</h1>
      <section className="card">
        {phase === "uploading" && (
          <>
            <p className="muted">업로드 파일: {state?.file?.name}</p>
            <p className="muted">채용공고: {state?.jdUrl}</p>
            <div className="progress"><div className="progress-bar" style={{ width: "70%" }} /></div>
            <p className="muted" style={{ marginTop: 8 }}>{msg}</p>
            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
              <button className="btn-secondary" onClick={handleCancel}>취소</button>
            </div>
          </>
        )}
        {phase === "error" && (
          <>
            <p className="help-error" style={{ whiteSpace: "pre-wrap" }}>{error}</p>
            <div style={{ marginTop: 12 }}>
              <button className="btn-primary" onClick={handleRetry}>이전으로</button>
            </div>
          </>
        )}
        {phase === "canceled" && (
          <>
            <p className="muted">{msg}</p>
            <div style={{ marginTop: 12 }}>
              <button className="btn-primary" onClick={handleRetry}>이전으로</button>
            </div>
          </>
        )}
        {phase === "init" && <p className="muted">{msg}</p>}
      </section>
    </div>
  );
}
