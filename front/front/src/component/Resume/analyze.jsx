import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../styles/Resume/resume.base.css"
import "../../styles/Resume/analyze.css"

// 목업 결과 생성
function makeMockResult(fileName="resume.pdf", jdUrl="") {
  const now = new Date().toISOString();
  const rand = (a,b)=>Math.floor(Math.random()*(b-a+1))+a;
  return {
    analysisId: "demo-" + Date.now(),
    fileName,
    jd: { url: jdUrl, title: "Frontend Engineer", company: "Acme Corp", storedAt: now },
    preprocess: { sectionRemoved: ["개인정보","취미/특기"], sentenceCount: rand(120,220), paraCount: rand(15,28) },
    skills: {
      tfidfTop: ["React","TypeScript","API","Redux","Testing"],
      bgeEmbeddingsTop: ["React Hooks","SPA","REST API","Client State"]
    },
    matching: {
      cosine: 0.76,
      ruleAdjustments: [
        { rule: "필수키워드 미포함", delta: -0.05, note: "TypeScript 빈도 낮음" },
        { rule: "연차 보정",       delta: +0.04, note: "요구 연차 충족" }
      ],
      finalScore: rand(75,88)
    },
    summary: "프론트엔드 중심 경력. 정량 지표와 성능/접근성 개선 사례 강화 권장.",
    improvements: ["핵심 프로젝트에 KPI(%) 추가","접근성 개선 및 성능 최적화 수치 기재"],
    keywords: ["React","TypeScript","REST API","Redux","Testing"]
  };
}

export default function ResumeAnalyzing() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const fileName = state?.fileName || "resume.pdf";
  const jdUrl = state?.jdUrl || "";

  const steps = useMemo(()=>[
    { key:"extract", label:"PDF 텍스트 추출" },
    { key:"clean",   label:"전처리 (문단/문장 분리, 불필요 섹션 제거)" },
    { key:"skills",  label:"핵심 역량/스킬 추출 (TF‑IDF + BGE 임베딩)" },
    { key:"match",   label:"이력서‑공고 매칭 점수 계산 (코사인 + 룰 보정)" },
  ],[]);
  const [stepIndex, setStepIndex] = useState(0);
  const progress = Math.round((stepIndex/steps.length)*100);

  useEffect(()=>{
    const timer = setInterval(()=>{
      setStepIndex(i=>{
        if (i+1 >= steps.length) {
          clearInterval(timer);
          const mock = makeMockResult(fileName, jdUrl);
          sessionStorage.setItem("resumeAnalysis", JSON.stringify(mock));
          navigate("/resume/result", { replace:true });
          return i;
        }
        return i+1;
      });
    }, 800);
    return ()=>clearInterval(timer);
  }, [fileName, jdUrl, navigate, steps.length]);

  return (
    <div className="resume-wrap">
      <h1 className="resume-title">이력서 분석 중…</h1>
      <section className="card">
        <p className="muted">업로드 파일: {fileName}</p>
        {jdUrl && <p className="muted">채용공고: <a href={jdUrl} target="_blank" rel="noreferrer">{jdUrl}</a></p>}

        <div className="progress"><div className="progress-bar" style={{width:`${progress}%`}}/></div>
        <p className="muted" style={{marginTop:8}}>{progress}% 진행 중</p>

        <ul className="steps">
          {steps.map((s, idx)=>(
            <li key={s.key} className={idx<stepIndex?"done":idx===stepIndex?"active":""}>
              <span className="dot" /><span>{s.label}</span>
              {idx<stepIndex && <span className="tag-done">완료</span>}
              {idx===stepIndex && <span className="tag-running">진행 중</span>}
            </li>
          ))}
        </ul>

        <div className="skeleton-card">
          <div className="skeleton-line w-80" />
          <div className="skeleton-line w-60" />
          <div className="skeleton-line w-90" />
        </div>
      </section>
    </div>
  );
}
