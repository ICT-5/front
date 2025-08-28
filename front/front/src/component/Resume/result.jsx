// src/component/Resume/Result.jsx
import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

export default function Result() {
  const navigate = useNavigate();
  const { state } = useLocation();       // upload.jsx에서 넘겨준 state (res.data)
  const { jobId } = useParams();         // /resume/result/:jobId 라우팅을 쓴다면

  // ⛳ 리다이렉트는 렌더 중이 아니라 useEffect에서만!
  useEffect(() => {
    // 1) state도 없고, jobId 파라미터도 없으면 업로드 페이지로 돌려보냄
    if (!state && !jobId) {
      navigate("/resume/upload", { replace: true });
    }
  }, [state, jobId, navigate]);

  // 2) 아직 리다이렉트 여부 판단 중이면 빈 UI 유지(깜빡임 방지)
  if (!state && !jobId) {
    return null;
  }

  // ───────── 업로드에서 state로 넘어온 경우 표시 ─────────
  // FlowController 응답 형태: { ok, userId, collection, topK, resumePreview, postingPreview, analysis, retrieved: [...] }
  if (state) {
    const {
      ok,
      userId,
      collection,
      topK,
      resumePreview,
      postingPreview,
      analysis,
      retrieved = [],
    } = state;

    return (
      <div className="resume-wrap">
        <h1 className="resume-title">분석 결과</h1>

        <section className="card">
          <h3 className="card-title">요약</h3>
          <ul>
            <li>ok: {String(ok)}</li>
            <li>userId: {userId}</li>
            <li>collection: {collection}</li>
            <li>topK: {topK}</li>
          </ul>
        </section>

        <section className="card">
          <h3 className="card-title">이력서 미리보기</h3>
          <pre className="code">{resumePreview}</pre>
        </section>

        <section className="card">
          <h3 className="card-title">채용공고 미리보기</h3>
          <pre className="code">{postingPreview}</pre>
        </section>

        <section className="card">
          <h3 className="card-title">분석(LLM)</h3>
          <pre className="code">{analysis}</pre>
        </section>

        <section className="card">
          <h3 className="card-title">검색된 문서</h3>
          <ul>
            {retrieved.map((h, i) => (
              <li key={i}>
                <div>id: {h.id}</div>
                <div>distance: {h.distance}</div>
                <pre className="code">{h.textPreview}</pre>
              </li>
            ))}
          </ul>
        </section>
      </div>
    );
  }

  // ───────── URL이 /resume/result/:jobId 인 케이스 ─────────
  // 여기서 jobId로 서버에서 결과 조회 API를 호출해도 되고,
  // 아직 API가 없으면 안내만 표시.
  return (
    <div className="resume-wrap">
      <h1 className="resume-title">분석 결과</h1>
      <p>jobId: {jobId}</p>
      <p>이 jobId로 결과 조회 API를 호출해 렌더링하세요.</p>
    </div>
  );
}
