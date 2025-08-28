import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import "../../styles/Resume/upload.css";
import "../../styles/Resume/resume.base.css";

// 토큰에서 '숫자' userId만 안전하게 추출 (없으면 null)
function tryDecodeNumericUserId() {
  try {
    const t = localStorage.getItem("accessToken") || "";
    if (!t || t.split(".").length < 2) return null;
    const [, payload] = t.split(".");
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    const raw = json?.userId ?? json?.id ?? json?.uid ?? json?.user_id ?? null;
    const n = Number(raw);
    return Number.isInteger(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export default function ResumeUpload() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [file, setFile] = useState(null);
  const [jobUrl, setJobUrl] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // 토큰에 숫자 userId가 있으면 자동 세팅
  useEffect(() => {
    const u = tryDecodeNumericUserId();
    if (u) setUserId(String(u));
  }, []);

  const hasNumericUserId = (() => {
    const n = Number(userId);
    return Number.isInteger(n) && n > 0;
  })();

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
    try {
      const u = new URL(url);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };

  const onAnalyze = async () => {
    setErr("");

    const uid = Number(userId);
    if (!Number.isInteger(uid) || uid <= 0) {
      return setErr("userId는 양의 정수여야 합니다.");
    }
    if (!file) return setErr("이력서 파일을 선택해주세요 (PDF 권장).");
    if (!isValidUrl(jobUrl)) return setErr("채용공고 URL 형식이 올바르지 않습니다.");

    try {
      setLoading(true);
      const form = new FormData();
      // ★★★ 필드명 정확히 백엔드와 일치해야 함 ★★★
      form.append("userId", String(uid));          // @RequestParam Integer userId
      form.append("resumeFile", file);             // @RequestParam("resumeFile")
      form.append("jobUrl", jobUrl);               // @RequestParam String jobUrl
      // 필요 시 기본값 바꾸고 싶으면 아래 두 줄 사용
      // form.append("collection", "accepted-essays");
      // form.append("topK", "5");

      const res = await api.post("/api/flow/analyze", form, {
        headers: { "Content-Type": "multipart/form-data" },
        validateStatus: () => true,
      });

      if (res.status === 200) {
        // 서버 응답: { ok, userId, collection, topK, resumePreview, postingPreview, analysis, retrieved[...] }
        navigate("/resume/result", { replace: true, state: res.data });
      } else if (res.status === 401) {
        setErr("로그인이 필요합니다. 다시 로그인해주세요.");
        navigate("/auth/login");
      } else {
        setErr(res.data?.message || `분석 실패 (HTTP ${res.status})`);
      }
    } catch (e) {
      setErr(e.message || "분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resume-wrap">
      <h1 className="resume-title">이력서 & 채용공고 분석</h1>

      {/* 토큰에 userId가 없으면 입력칸 노출 */}
      {!hasNumericUserId && (
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
          <p className="hint">* 로그인 토큰에 userId가 있으면 자동으로 채워집니다.</p>
        </section>
      )}

      <section className="card">
        <h3 className="card-title">이력서 파일 (필수)</h3>
        <input
          type="file"
          accept={accept}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {file && <p className="file-name">선택된 파일: {file.name}</p>}
      </section>

      <section className="card">
        <h3 className="card-title">채용공고 URL (필수)</h3>
        <input
          type="url"
          className="input"
          placeholder="https://company.com/jobs/123"
          value={jobUrl}
          onChange={(e) => setJobUrl(e.target.value)}
        />
      </section>

      {err && <p className="help-error">{err}</p>}
      <button className="btn-primary" onClick={onAnalyze} disabled={loading}>
        {loading ? "분석 중..." : "분석하기"}
      </button>
    </div>
  );
}
