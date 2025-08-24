import React, { useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Resume/result.css"
import "../../styles/Resume/resume.base.css"
export default function ResumeResult() {
  const navigate = useNavigate();
  const data = useMemo(()=>{
    const raw = sessionStorage.getItem("resumeAnalysis");
    return raw ? JSON.parse(raw) : null;
  },[]);

  useEffect(()=>{
    if (!data) navigate("/resume/upload", { replace:true });
  }, [data, navigate]);
  if (!data) return null;

  const { fileName, jd, summary, keywords=[], improvements=[], skills={}, matching={}, preprocess={} } = data;

  return (
    <div className="resume-wrap">
      <h1 className="resume-title">이력서 분석 결과</h1>

      {/* JD & 요약 */}
      <section className="card">
        <h3 className="card-title">입력 정보</h3>
        <p>업로드 파일: {fileName || "resume.pdf"}</p>
        {jd?.url ? (
          <p>채용공고: <a href={jd.url} target="_blank" rel="noreferrer">
            {jd.company || "회사"} / {jd.title || "직무"}
          </a></p>
        ) : <p>채용공고 URL: (미입력)</p>}
        {jd?.storedAt && <p className="hint">저장 시각: {new Date(jd.storedAt).toLocaleString()}</p>}
        <h4 style={{marginTop:10}}>요약</h4>
        <p className="summary">{summary || "요약 정보가 없습니다."}</p>
      </section>

      {/* 매칭 점수 */}
      <section className="card">
        <h3 className="card-title">매칭 점수</h3>
        <div className="score-wrap">
          <div className="score-number">{matching?.finalScore ?? 0}</div>
          <div className="progress"><div className="progress-bar" style={{width:`${matching?.finalScore ?? 0}%`}}/></div>
          <p className="hint">코사인 유사도: {Math.round((matching?.cosine ?? 0)*100)}%</p>
        </div>
        {Array.isArray(matching?.ruleAdjustments) && matching.ruleAdjustments.length>0 && (
          <table className="mini-table">
            <thead><tr><th>룰</th><th>가중치</th><th>메모</th></tr></thead>
            <tbody>
              {matching.ruleAdjustments.map((r,i)=>(
                <tr key={i}><td>{r.rule}</td><td>{r.delta>0?`+${r.delta}`:r.delta}</td><td>{r.note}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* 스킬 추출 */}
      <section className="card">
        <h3 className="card-title">핵심 역량/스킬</h3>
        <div className="two-col">
          <div>
            <h4>TF‑IDF Top</h4>
            <div className="tags">{(skills.tfidfTop||[]).map(k=><span className="tag" key={k}>{k}</span>)}</div>
          </div>
          <div>
            <h4>BGE 임베딩 Top</h4>
            <div className="tags">{(skills.bgeEmbeddingsTop||[]).map(k=><span className="tag" key={k}>{k}</span>)}</div>
          </div>
        </div>
      </section>

      {/* 보완 포인트 */}
      <section className="card">
        <h3 className="card-title">보완 포인트</h3>
        {improvements.length ? (
          <ul className="list">{improvements.map((t,i)=><li key={i}>{t}</li>)}</ul>
        ) : <p className="hint">보완 포인트가 없습니다.</p>}
      </section>

      {/* 전처리 정보(작게) */}
      <section className="card">
        <h3 className="card-title">전처리 정보</h3>
        <div className="stat-chips">
          <span className="chip">문장 {preprocess?.sentenceCount ?? 0}</span>
          <span className="chip">문단 {preprocess?.paraCount ?? 0}</span>
          <span className="chip">제거 섹션 {preprocess?.sectionRemoved?.length ?? 0}</span>
        </div>
      </section>
    </div>
  );
}
