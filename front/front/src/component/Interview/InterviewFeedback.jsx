import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:8080";

const getAuthHeaders = () => {
  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("jwt");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// answer에 annotation 하이라이트 (선택)
function highlightAnswer(answer = "", annotations = []) {
  if (!answer || !Array.isArray(annotations) || annotations.length === 0) {
    return <span>{answer}</span>;
  }
  const colors = { vague: "#fde68a", no_metric: "#bfdbfe", keyword: "#c7f9cc", default: "#fcd5ce" };
  const anns = [...annotations]
    .filter((a) => a?.span && Number.isFinite(a.span.start) && Number.isFinite(a.span.end))
    .sort((a, b) => a.span.start - b.span.start);

  const out = [];
  let cur = 0;
  anns.forEach((a, idx) => {
    const s = Math.max(0, Math.min(answer.length, a.span.start));
    const e = Math.max(s, Math.min(answer.length, a.span.end));
    if (s > cur) out.push(<span key={`p-${idx}-${cur}`}>{answer.slice(cur, s)}</span>);
    out.push(
      <mark
        key={`m-${idx}-${s}-${e}`}
        style={{ background: colors[a.category] || colors.default, padding: "0 2px", borderRadius: 4 }}
        title={`${a.category ?? "note"}: ${a.comment ?? ""}${a.suggest ? ` / ${a.suggest}` : ""}`}
      >
        {answer.slice(s, e)}
      </mark>
    );
    cur = e;
  });
  if (cur < answer.length) out.push(<span key={`tail-${cur}`}>{answer.slice(cur)}</span>);
  return <>{out}</>;
}

export default function InterviewFeedback() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // 1) 입력 페이로드 확보: analyze에서 넘겨준 payload 우선
  const inputPayload = useMemo(() => {
    if (state?.payload?.qas?.length) return state.payload;

    // 폴백: 가장 최근 세션의 sessionStorage Q/A 로드 (없으면 데모)
    const keys = Object.keys(sessionStorage).filter((k) => k.startsWith("interview_qas:"));
    const lastKey = keys.sort().at(-1);
    let qas = [];
    if (lastKey) {
      try { qas = JSON.parse(sessionStorage.getItem(lastKey) || "[]"); } catch {}
    }
    if (qas.length) {
      const sessionId = lastKey?.split(":")[1] || `sess_demo_${Date.now()}`;
      return { sessionId, jdKeywords: ["REST API"], qas };
    }

    // 최종 데모
    return {
      sessionId: "sess_demo_001",
      jdKeywords: ["Spring Boot", "Kafka", "REST API", "Docker"],
      qas: [
        { qid: "q1", answer: "Spring Boot에서 이미지 최적화로 LCP를 4.3s→2.6s로 개선했습니다." },
        { qid: "q2", answer: "성능을 많이 개선했고 사용자 경험이 좋아졌습니다." },
      ],
    };
  }, [state]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);

  // 2) JSON 피드백 API 호출 (백엔드 준비 전이면 목업 생성)
  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setLoading(true); setErr("");

        // 실제 백엔드 열리면 사용
        const resp = await fetch(`${API_BASE}/api/feedback/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json", ...getAuthHeaders() },
          body: JSON.stringify({
            sessionId: inputPayload.sessionId,
            jdKeywords: inputPayload.jdKeywords || [],
            qas: (inputPayload.qas || []).map((q) => ({ qid: q.qid ?? q.id, answer: q.answer ?? "" })),
          }),
        });

        if (resp.status === 401) {
          setErr("인증이 필요합니다. 로그인 후 다시 시도해주세요.");
          setLoading(false);
          return;
        }

        if (!resp.ok) {
          // 백엔드 준비 안 됐을 때는 목업으로 대체
          console.warn("[Feedback] analyze failed:", resp.status);
          throw new Error("BACKEND_OFF");
        }

        const data = await resp.json();
        if (!alive) return;
        setResult(data);
      } catch (e) {
        if (!alive) return;
        // 목업 결과
        if (e.message === "BACKEND_OFF") {
          const mock = {
            sessionId: inputPayload.sessionId,
            checklist: ["전후 수치 1개 포함", "STAR 3문장 유지", "JD 키워드 1개 명시"],
            items: (inputPayload.qas || []).map((q, i) => ({
              qid: q.qid || `q${i + 1}`,
              question: i === 0 ? "자기소개를 간단히 해주세요." : undefined,
              answer: q.answer,
              annotations: i === 0 ? [{
                span: { start: 0, end: Math.min(8, q.answer.length), text: q.answer.slice(0, 8) },
                category: "no_metric",
                comment: "전후 수치를 1개 이상 포함하세요.",
                suggest: "예) 응답속도 120ms→78ms",
              }] : [],
              rewrite: i === 0
                ? "핵심 행동과 결과를 STAR로 2~3문장으로 요약하고, 전후 수치를 포함해 주세요."
                : q.answer,
              jdInsert: ["REST API"],
              tips: ["전후 수치 1개 이상 명시", "모호 표현을 구체 행동/방법으로 교체"],
            })),
          };
          setResult(mock);
        } else {
          setErr(e?.message || "피드백 분석 중 오류가 발생했습니다.");
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    if (inputPayload?.qas?.length) run();
    else { setLoading(false); setErr("분석할 Q/A 데이터가 없습니다."); }

    return () => { alive = false; };
  }, [inputPayload]);

  // 3) PDF 다운로드 (실서버에서만 동작, 준비 전이면 안내)
  const [downloading, setDownloading] = useState(false);
  const downloadPdf = async () => {
    if (!result) return;
    try {
      setDownloading(true); setErr("");

      const checklist = result?.checklist ?? [];
      const items = (result?.items || []).map((it) => ({
        qid: it.qid, question: it.question, answer: it.answer,
        annotations: it.annotations, rewrite: it.rewrite, jdInsert: it.jdInsert,
      }));

      const resp = await fetch(`${API_BASE}/api/feedback/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/pdf", ...getAuthHeaders() },
        body: JSON.stringify({ sessionId: result?.sessionId || inputPayload.sessionId, checklist, items }),
      });

      if (!resp.ok) {
        const t = await resp.text().catch(() => "");
        throw new Error(`PDF 생성 실패: HTTP ${resp.status}\n${t}`);
      }

      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `feedback-${result?.sessionId || inputPayload.sessionId}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setErr(e?.message || "PDF 다운로드 중 오류가 발생했습니다.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: "40px auto", fontFamily: "Inter, system-ui, Arial, sans-serif" }}>
      <h2 style={{ textAlign: "center", marginBottom: 8 }}>인터뷰 피드백</h2>
      <p style={{ textAlign: "center", color: "#6b7280", marginTop: 0 }}>
        세션: <strong>{result?.sessionId ?? inputPayload.sessionId ?? "-"}</strong>
      </p>

      {loading && <div style={{ padding: 24, border: "1px solid #e5e7eb", borderRadius: 12, background: "#fafafa" }}>분석 중입니다…</div>}
      {err && <div style={{ padding: 16, border: "1px solid #fecaca", background: "#fff1f2", borderRadius: 8, color: "#b91c1c", marginBottom: 16, whiteSpace: "pre-wrap" }}>{err}</div>}

      {!loading && result && (
        <>
          {Array.isArray(result.checklist) && result.checklist.length > 0 && (
            <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <h3 style={{ margin: "0 0 12px 0" }}>체크리스트</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {result.checklist.map((c, i) => (
                  <span key={i} style={{ fontSize: 14, padding: "6px 10px", background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 999 }}>✅ {c}</span>
                ))}
              </div>
            </section>
          )}

          {Array.isArray(result.items) && result.items.length > 0 && (
            <section style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
              {result.items.map((it, idx) => (
                <div key={it.qid ?? idx} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                    <h4 style={{ margin: 0 }}>Q{idx + 1}. {it.question ?? "질문"}</h4>
                    {Array.isArray(it.jdInsert) && it.jdInsert.length > 0 && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {it.jdInsert.map((k, i) => (
                          <span key={i} style={{ fontSize: 12, background: "#ecfeff", border: "1px solid #a5f3fc", padding: "2px 8px", borderRadius: 999 }}>{k}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>원문 답변</div>
                    <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, lineHeight: 1.6 }}>
                      {highlightAnswer(it.answer, it.annotations)}
                    </div>
                  </div>

                  {Array.isArray(it.annotations) && it.annotations.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>표기/규칙 탐지</div>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {it.annotations.map((a, i) => (
                          <li key={i} style={{ marginBottom: 4 }}>
                            <strong style={{ textTransform: "uppercase" }}>{a.category || "note"}</strong>
                            {a.span?.text ? ` · "${a.span.text}"` : ""} — {a.comment || "확인 필요"}
                            {a.suggest ? <span style={{ color: "#2563eb" }}> · 제안: {a.suggest}</span> : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {it.rewrite && (
                    <div>
                      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>첨삭 제안</div>
                      <div style={{ background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 8, padding: 12 }}>
                        {it.rewrite}
                      </div>
                    </div>
                  )}

                  {Array.isArray(it.tips) && it.tips.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>추가 팁</div>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {it.tips.map((t, i) => (<li key={i}>{t}</li>))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              onClick={() => navigate(-1)}
              style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer" }}
            >
              뒤로
            </button>
            <button
              onClick={downloadPdf}
              disabled={downloading}
              style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #1d4ed8", background: "#1d4ed8", color: "#fff", cursor: "pointer" }}
            >
              {downloading ? "PDF 생성 중..." : "PDF로 내보내기"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
