import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Resume/upload.css";
import "../../styles/Resume/resume.base.css";

export default function ResumeUpload() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("2");
  const [file, setFile] = useState(null);
  const [jdUrl, setJdUrl] = useState("");
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

    const n = Number(userId);
    if (!Number.isInteger(n) || n <= 0) {
      return setErr("userId는 양의 정수여야 합니다.");
    }
    if (!file) return setErr("이력서 파일을 선택해주세요 (PDF 권장).");
    if (!isValidUrl(jdUrl)) return setErr("채용공고 URL 형식이 올바르지 않습니다.");

    // ✅ 분석 화면으로 이동 (File 객체 포함해서 넘김)
    navigate("/resume/analyze", { state: { userId: n, file, jdUrl } });
  };

  return (
    <div className="resume-wrap">
      <h1 className="resume-title">이력서 & 채용공고 입력</h1>

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
      </section>

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
        <p className="hint">* 공고 링크를 넣으면 키워드 매칭이 더 정확해져요.</p>
      </section>

      {err && <p className="help-error">{err}</p>}
      <button className="btn-primary" onClick={onAnalyze}>분석하기</button>
    </div>
  );
}
