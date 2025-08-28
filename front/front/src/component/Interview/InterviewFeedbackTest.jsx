// src/component/Interview/InterviewFeedbackTest.jsx
import React, { useEffect, useState } from "react";

// ★ API 서버 주소 (절대 URL로 고정해 네트워크 찍히는지 먼저 본다)
const API_BASE = "http://localhost:8080";

// ★ 엔드포인트(명세상 analyze, 만약 서버가 process면 아래 줄만 바꿔줘)
const FEEDBACK_JSON_ENDPOINT = "/api/feedback/process"; // "/api/feedback/process"

const MOCK_QAS = [
  { qid: "q1", answer: "현재 생성형 AI를 이용한 AI 에이전트가 미래에 큰 효과를 가져올 것이라고 생각합니다." },
  { qid: "q2", answer: "데이터의 품질입니다. AI 모델은 학습한 데이터에 따라 성능의 차이가 좌우됩니다." },
  { qid: "q3", answer: "저의 강점은 융합입니다. 개인의 의견을 하나의 목표로 통일해 모두가 원하는 업적을 달성할 수 있습니다." },
  { qid: "q4", answer: "가장 효과적인 방법은 다른 데이터셋을 사용하는 것이었습니다. 기존 데이터셋은 다양성이 부족했으나, 새로운 데이터셋을 사용하면서 성능이 개선되었습니다." },
  { qid: "q5", answer: "봉사활동 과정에서 팀원 결석으로 어려움이 있었지만, 역할 분담을 통해 해결했습니다." },
];

export default function InterviewFeedbackTest() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);

  async function callApi() {
    try {
      setLoading(true);
      setErr("");

      const url = `${API_BASE}${FEEDBACK_JSON_ENDPOINT}`;
      const payload = {
        sessionId: "sess_demo_001",
        jdKeywords: ["Spring Boot", "REST API", "Docker"],
        qas: MOCK_QAS,
      };

      // ▲ 요청 직전 콘솔에 풀로그 (URL/헤더/바디)
      console.log("[FeedbackTest] fetch →", url, payload);

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          // 쿠키 세션이면 credentials: 'include' 쓰고, 서버 CORS allowCredentials=true 필요
          // Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        // credentials: "include",
        body: JSON.stringify(payload),
      });

      console.log("[FeedbackTest] status:", resp.status, resp.statusText, "CT:", resp.headers.get("content-type"));

      const ct = resp.headers.get("content-type") || "";
      const body = ct.includes("application/json") ? await resp.json() : await resp.text();

      if (!resp.ok) {
        console.error("[FeedbackTest] error body:", body);
        throw new Error(`HTTP ${resp.status} ${resp.statusText}\n${typeof body === "string" ? body : JSON.stringify(body)}`);
      }

      console.log("[FeedbackTest] success payload:", body);
      setResult(body);
    } catch (e) {
      console.error("[FeedbackTest] failed:", e);
      setErr(e?.message || "요청 실패");
    } finally {
      setLoading(false);
    }
  }

  // 마운트 시 자동 호출 (원하면 주석 처리하고 버튼으로만 테스트)
  useEffect(() => {
    callApi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 강제 테스트 버튼 (자동 호출 전에라도 바로 눌러서 요청이 찍히는지 확인)
  const onForceTest = () => callApi();

  return (
    <div style={{ maxWidth: 800, margin: "20px auto", fontFamily: "Arial, sans-serif" }}>
      <h2>피드백 API 테스트</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button type="button" onClick={onForceTest} style={{ padding: "8px 12px", borderRadius: 8, cursor: "pointer" }}>
          강제 테스트 요청
        </button>
        <small style={{ color: "#6b7280" }}>
          현재: <code>{API_BASE}{FEEDBACK_JSON_ENDPOINT}</code>
        </small>
      </div>

      {loading && <p>분석 요청 중… (Network 탭과 콘솔 로그 확인)</p>}
      {err && (
        <pre style={{ color: "red", whiteSpace: "pre-wrap", background: "#fff1f2", border: "1px solid #fecaca", padding: 12, borderRadius: 8 }}>
          {err}
        </pre>
      )}

      {result && (
        <>
          <h3>체크리스트</h3>
          <ul>
            {result.checklist?.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>

          {result.items?.map((it, i) => (
            <div key={i} style={{ border: "1px solid #ddd", padding: 10, marginBottom: 10, borderRadius: 8 }}>
              <strong>Q{i + 1}</strong>
              <p><b>원문:</b> {it.answer}</p>

              {Array.isArray(it.annotations) && it.annotations.length > 0 && (
                <ul style={{ marginTop: 8 }}>
                  {it.annotations.map((a, j) => (
                    <li key={j}>
                      [{a.category}] {a.comment}
                      {a.suggest ? <> → <em>제안:</em> {a.suggest}</> : null}
                    </li>
                  ))}
                </ul>
              )}

              {it.rewrite && <p><b>첨삭:</b> {it.rewrite}</p>}
            </div>
          ))}

          {/* 원본 JSON도 같이 보여주면 디버깅 편함 */}
          <details style={{ marginTop: 12 }}>
            <summary>원본 JSON 보기</summary>
            <pre style={{ whiteSpace: "pre-wrap", background: "#f9fafb", padding: 12, borderRadius: 8 }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </>
      )}
    </div>
  );
}
