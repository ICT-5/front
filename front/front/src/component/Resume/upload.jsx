import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Resume/upload.css";
import "../../styles/Resume/resume.base.css";

const API_BASE = "http://localhost:8080";

/** ─── 인증 유틸 ───────────────────────────────────────── */
const getToken = () =>
  localStorage.getItem("accessToken") ||
  localStorage.getItem("token") ||
  localStorage.getItem("jwt") ||
  "";

const getAuthHeaders = () => {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};

// JWT에서 userId 비슷한 클레임을 최대한 추론
function tryDecodeUserIdFromJWT() {
  try {
    const t = getToken();
    if (!t || !t.includes(".")) return null;
    const [, payload] = t.split(".");
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    const cand =
      json?.userId ?? json?.id ?? json?.uid ?? json?.sub ?? json?.user_id ?? null;
    // 문자열 숫자면 숫자로
    const n = Number(cand);
    return Number.isFinite(n) && n > 0 ? n : cand;
  } catch {
    return null;
  }
}

export default function ResumeUpload() {
  const navigate = useNavigate();

  // 토큰에서 userId를 우선 가져오고, 없으면 입력받기
  const [userId, setUserId] = useState("");
  const [file, setFile] = useState(null);
  const [jdUrl, setJdUrl] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    const fromToken = tryDecodeUserIdFromJWT();
    if (fromToken) setUserId(String(fromToken));
  }, []);

  const accept = useMemo(
    () =>
      [
        ".pdf",
        ".doc",
        ".docx",
        ".txt",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ].join(","),
    []
  );

  const isValidUrl = (url) => {
    if (!url) return false;
    try {
      const u = new URL(url);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };

  const onAnalyze = () => {
    setErr("");

    // userId: 토큰에서 못 얻었으면 입력 필요
    const n = Number(userId);
    if (!Number.isInteger(n) || n <= 0) {
      return setErr("userId는 양의 정수여야 합니다. (로그인 후 자동 세팅되면 입력 칸이 숨겨집니다)");
    }
    if (!file) return setErr("이력서 파일을 선택해주세요 (PDF 권장).");
    if (!isValidUrl(jdUrl)) return setErr("채용공고 URL 형식이 올바르지 않습니다.");

    // ✅ 분석 화면으로 이동 (File 포함)
    navigate("/resume/analyze", { state: { userId: n, file, jdUrl } });
  };

  const hasTokenUser = !!tryDecodeUserIdFromJWT();

  return (
    <div className="resume-wrap">
      <h1 className="resume-title">이력서 & 채용공고 입력</h1>

      {/* userId: 토큰에서 파악되면 숨김 */}
      {!hasTokenUser && (
        <section className="card">
          <h3 className="card-title">userId (필수)</h3>
          <input
            type="number"
            min={1}
            step={1}
            className="input"
            placeholder="양의 정수"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <p className="hint">* 로그인되어 있다면 자동으로 채워져 입력칸이 숨겨집니다.</p>
        </section>
      )}

      <section className="card">
        <h3 className="card-title">이력서 업로드 (필수)</h3>
        <input
          type="file"
          accept={accept}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {file && <p className="file-name">선택된 파일: {file.name}</p>}
        <p className="hint">* PDF 권장, 10MB 이하</p>
      </section>

      <section className="card">
        <h3 className="card-title">채용공고 URL (필수)</h3>
        <input
          type="url"
          className="input"
          placeholder="https://company.com/jobs/123"
          value={jdUrl}
          onChange={(e) => setJdUrl(e.target.value)}
        />
        <p className="hint">* 공고 링크를 넣으면 매칭 품질이 더 좋아집니다.</p>
      </section>

      {err && <p className="help-error">{err}</p>}
      <button className="btn-primary" onClick={onAnalyze}>
        분석하기
      </button>
    </div>
  );
}
