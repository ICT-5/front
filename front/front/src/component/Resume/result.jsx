import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../styles/Resume/result.css";
import "../../styles/Resume/resume.base.css";

const Box = ({ title, children }) => (
  <section className="card">
    {title && <h3 className="card-title">{title}</h3>}
    {children}
  </section>
);

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{label}</div>
    <div className="field">{children}</div>
  </div>
);

export default function ResumeResult() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const data = state?.result;

  if (!data) {
    navigate("/resume/upload", { replace: true });
    return null;
  }

  const {
    ok,
    userId,
    collection,
    topK,
    resumePreview,
    postingPreview,
    analysis,
    retrieved,
  } = data;

  return (
    <div className="resume-wrap">
      <h1 className="resume-title">이력서 분석 결과</h1>

      <div className="two-col">
        <Box title="이력서 미리보기">
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
            {resumePreview}
          </div>
        </Box>
        <Box title="채용공고 미리보기">
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
            {postingPreview}
          </div>
        </Box>
      </div>

      <Box title="분석 (마크다운 가능)">
        <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{analysis}</div>
      </Box>

      <div className="two-col">
        <Field label="ok">
          <code>{String(ok)}</code>
        </Field>
        <Field label="userId">
          <code>{userId}</code>
        </Field>
        <Field label="collection">
          <code>{collection}</code>
        </Field>
        <Field label="topK">
          <code>{topK}</code>
        </Field>
      </div>

      <Box title="retrieved (RAG 검색 결과)">
        {Array.isArray(retrieved) && retrieved.length > 0 ? (
          <details
            open
            style={{
              background: "#f8fafc",
              padding: 12,
              borderRadius: 10,
              border: "1px solid #eef2f7",
            }}
          >
            <summary style={{ cursor: "pointer", marginBottom: 8 }}>
              총 {retrieved.length}개 – JSON 보기
            </summary>
            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                overflowX: "auto",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {JSON.stringify(retrieved, null, 2)}
            </pre>
          </details>
        ) : (
          <p className="hint">RAG 결과가 없습니다. (retrieved: [])</p>
        )}
      </Box>

      <div style={{ marginTop: 24, display: "flex", gap: 8 }}>
        <button className="btn-primary" onClick={() => navigate("/resume/upload")}>
          다시 업로드
        </button>
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          이전
        </button>
      </div>
    </div>
  );
}
