// src/components/Resume/Upload.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Resume/upload.css";
import "../../styles/Resume/resume.base.css";

export default function ResumeUpload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [jobUrl, setJobUrl] = useState("");
  const [err, setErr] = useState("");

  const accept = useMemo(
    () =>
      [
        ".pdf", ".doc", ".docx", ".txt",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ].join(","),
    []
  );

  const isValidUrl = (url) => {
    try { const u = new URL(url); return ["http:", "https:"].includes(u.protocol); }
    catch { return false; }
  };

  const onAnalyze = () => {
    setErr("");
    if (!file) return setErr("이력서 파일을 선택해주세요 (PDF 권장).");
    if (!isValidUrl(jobUrl)) return setErr("채용공고 URL 형식이 올바르지 않습니다.");
    // ✅ userId는 절대 전송하지 않음(백엔드가 토큰에서 추출)
    navigate("/resume/analyze", { state: { file, jdUrl: jobUrl } });
  };

  return (
    <div className="resume-wrap">
      <h1 className="resume-title">이력서 & 채용공고 분석</h1>

      <section className="card">
        <h3 className="card-title">이력서 파일 (필수)</h3>
        <input type="file" accept={accept} onChange={(e)=>setFile(e.target.files?.[0] ?? null)} />
        {file && <p className="file-name">선택된 파일: {file.name}</p>}
        <p className="hint">* PDF 권장, 10MB 이하</p>
      </section>

      <section className="card">
        <h3 className="card-title">채용공고 URL (필수)</h3>
        <input type="url" className="input" placeholder="https://company.com/jobs/123"
               value={jobUrl} onChange={(e)=>setJobUrl(e.target.value)} />
      </section>

      {err && <p className="help-error">{err}</p>}
      <button className="btn-primary" onClick={onAnalyze}>분석하기</button>
    </div>
  );
}
