import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../styles/Resume/resume.base.css";
import "../../styles/Resume/analyze.css";

const API_BASE = "http://localhost:8080";

/** 인증 유틸 */
const getAuthHeaders = () => {
  const t =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("jwt");
  return t ? { Authorization: `Bearer ${t}` } : {};
};

// 세션쿠키(Spring) 방식이면 주석 해제
const FETCH_OPTS = {
  // credentials: "include",
};

export default function ResumeAnalyzing() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [phase, setPhase] = useState("init"); // init | uploading | success | error | canceled
  const [msg, setMsg] = useState("요청 준비 중…");
  const [error, setError] = useState("");
  const abortRef = useRef(null);

  useEffect(() => {
    if (!state?.userId || !state?.file || !state?.jdUrl) {
      setPhase("error");
      setError("입력 값이 부족합니다. 처음 화면에서 다시 시도해 주세요.");
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    async function run() {
      try {
        setPhase("uploading");
        setMsg("서버로 업로드 및 분석 요청 중…");

        const fd = new FormData();
        fd.append("userId", String(state.userId));
        fd.append("resumeFile", state.file);
        fd.append("jobUrl", state.jdUrl);

        console.log("[ResumeAnalyze] FormData", {
          userId: String(state.userId),
          jobUrl: state.jdUrl,
          file: {
            name: state.file?.name,
            size: state.file?.size,
            type: state.file?.type,
          },
        });

        const resp = await fetch(`${API_BASE}/api/flow/analyze`, {
          method: "POST",
          body: fd,
          headers: {
            Accept: "application/json",
            ...getAuthHeaders(),
          },
          signal: controller.signal,
          ...FETCH_OPTS,
        });

        console.log(
          "[ResumeAnalyze] status:",
          resp.status,
          resp.statusText,
          resp.headers.get("content-type")
        );

        if (resp.status === 401) {
          // 인증 필요: 로그인으로 보냄
          const next = encodeURIComponent("/resume/upload");
          navigate(`/auth/login?next=${next}`, { replace: true });
          return;
        }

        if (!resp.ok) {
          const text = await resp.text().catch(() => "");
          console.error("[ResumeAnalyze] error body:", text);
          throw new Error(
            `HTTP ${resp.status} ${resp.statusText}\n${text || "서버 오류"}`
          );
        }

        const data = await (async () => {
          const ct = resp.headers.get("content-type") || "";
          if (ct.includes("application/json")) return resp.json();
          const t = await resp.text();
          try {
            return JSON.parse(t);
          } catch {
            throw new Error("서버 응답이 JSON이 아닙니다.\n" + t);
          }
        })();

        console.log("[ResumeAnalyze] payload:", data);
        setPhase("success");
        setMsg("분석 완료");

        // ✅ 결과 페이지로 응답 전체 전달
        navigate("/resume/result", { state: { result: data }, replace: true });
      } catch (err) {
        if (controller.signal.aborted) {
          setPhase("canceled");
          setMsg("요청이 취소되었습니다.");
          return;
        }
        console.error("[ResumeAnalyze] failed:", err);
        setPhase("error");
        setError(err?.message || "분석 중 오류가 발생했습니다.");
      }
    }

    run();
    return () => controller.abort();
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

            <div className="progress">
              <div className="progress-bar" style={{ width: "70%" }} />
            </div>
            <p className="muted" style={{ marginTop: 8 }}>
              {msg}
            </p>

            <ul className="steps">
              <li className="active">
                <span className="dot" />
                <span>업로드 & 분석 요청</span>
                <span className="tag-running">진행 중</span>
              </li>
              <li>
                <span className="dot" />
                <span>결과 수신</span>
              </li>
            </ul>

            <div className="skeleton-card">
              <div className="skeleton-line w-80" />
              <div className="skeleton-line w-60" />
              <div className="skeleton-line w-90" />
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
              <button className="btn-secondary" onClick={handleCancel}>
                취소
              </button>
            </div>
          </>
        )}

        {phase === "error" && (
          <>
            <p className="help-error" style={{ whiteSpace: "pre-wrap" }}>
              {error}
            </p>
            <div style={{ marginTop: 12 }}>
              <button className="btn-primary" onClick={handleRetry}>
                이전으로
              </button>
            </div>
          </>
        )}

        {phase === "canceled" && (
          <>
            <p className="muted">{msg}</p>
            <div style={{ marginTop: 12 }}>
              <button className="btn-primary" onClick={handleRetry}>
                이전으로
              </button>
            </div>
          </>
        )}

        {phase === "init" && <p className="muted">{msg}</p>}
      </section>
    </div>
  );
}
