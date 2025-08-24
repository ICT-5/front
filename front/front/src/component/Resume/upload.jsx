import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Resume/upload.css"
import "../../styles/Resume/resume.base.css"

export default function ResumeUpload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [jdUrl, setJdUrl] = useState("");
  const [err, setErr] = useState("");

  const isValidUrl = (url) => {
    if (!url) return true;
    try { const u = new URL(url); return ["http:", "https:"].includes(u.protocol); }
    catch { return false; }
  };

  const onAnalyze = () => {
    setErr("");
    if (!file) return setErr("이력서 파일을 선택해주세요 (PDF 권장).");
    if (!isValidUrl(jdUrl)) return setErr("채용공고 URL 형식이 올바르지 않습니다.");
    // 업로드 성공했다고 가정하고 분석중 화면으로 이동 (목업)
    navigate("/resume/analyze", { state: { fileName: file?.name, jdUrl } });
  };

  return (
    <div className="resume-wrap">
      <h1 className="resume-title">이력서 & 채용공고 입력</h1>

      <section className="card">
        <h3 className="card-title">이력서 업로드 (필수)</h3>
        <input type="file" accept=".pdf,.doc,.docx" onChange={(e)=>setFile(e.target.files?.[0] ?? null)} />
        {file && <p className="file-name">선택된 파일: {file.name}</p>}
        <p className="hint">* PDF 권장, 10MB 이하</p>
      </section>

      <section className="card">
        <h3 className="card-title">채용공고 URL (선택)</h3>
        <input type="url" className="input" placeholder="https://company.com/jobs/123"
               value={jdUrl} onChange={(e)=>setJdUrl(e.target.value)} />
        <p className="hint">* 공고 링크를 넣으면 키워드 매칭이 더 정확해져요.</p>
      </section>

      {err && <p className="help-error">{err}</p>}
      <button className="btn-primary" onClick={onAnalyze}>분석하기</button>
    </div>
  );
}
