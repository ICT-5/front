// src/component/Interview/feedback.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../lib/api"; // ✅ 스프링 axios 인스턴스(Authorization 자동)


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

  // 0) 세션/키워드 기본값 정리
  const base = useMemo(() => {
    return {
      sessionId: state?.sessionId ?? state?.payload?.sessionId ?? null,
      jdKeywords: state?.jdKeywords ?? state?.payload?.jdKeywords ?? [],
      payload: state?.payload ?? null, // { sessionId, jdKeywords, qas? }
    };
  }, [state]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null); // { apiVersion, sessionId, checklist, items }
  const [downloading, setDownloading] = useState(false);

  // 1) Q/A 확보 → /api/feedback/process 호출
  useEffect(() => {
    let alive = true;

    const run = async () => {
      if (!base.sessionId) {
        setLoading(false);
        setErr("sessionId가 없습니다. 이전 단계에서 세션을 생성해 주세요.");
        return;
      }

      try {
        setLoading(true);
        setErr("");

        // (A) 이미 Analyze에서 Q/A를 만들어 넘겨왔다면 그대로 사용
        let qas = Array.isArray(base.payload?.qas) ? base.payload.qas : null;

        // (B) 없으면 DB에서 조회 (★ 방금 만든 API)
        if (!qas) {
          // ⚠️ sessionId는 BIGINT 숫자 문자열이어야 함
        console.log("[FEEDBACK] GET /qas sessionId:", base.sessionId);

const resQas = await api.get("/api/feedback/qas", {
  params: { sessionId: String(base.sessionId) },
  validateStatus: () => true,
});

console.log("[FEEDBACK] /qas status:", resQas.status, "data:", resQas.data);
          if (resQas.status === 401) {
            setErr("로그인이 필요합니다. 다시 로그인해주세요.");
            setLoading(false);
            return;
          }
          if (resQas.status !== 200) {
            setErr(`Q/A 조회 실패 (HTTP ${resQas.status})`);
            setLoading(false);
            return;
          }
          // [{ qid: "123", answer: "..." }, ...]
          qas = Array.isArray(resQas.data) ? resQas.data : [];
        }

        // 2) 피드백 분석 호출 (네가 준 스키마 그대로)
        const res = await api.post(
          "/api/feedback/process",
          {
            sessionId: base.sessionId,
            jdKeywords: base.jdKeywords || [],
            qas: qas.map((q) => ({
              qid: q.qid ?? q.id,        // 안전 매핑
              answer: q.answer ?? "",
            })),
          },
          { validateStatus: () => true }
          
        );

        console.log("[FEEDBACK] POST /process payload:", {
  sessionId: base.sessionId,
  jdKeywords: base.jdKeywords,
  qas,
});
console.log("[FEEDBACK] /process response:", res.status, res.data);


        

        if (res.status === 401) {
          setErr("인증이 필요합니다. 다시 로그인해주세요.");
          setLoading(false);
          return;
        }
        if (res.status !== 200) {
          setErr(`분석 실패 (HTTP ${res.status})`);
          setLoading(false);
          return;
        }

        const data = res.data;
        if (!alive) return;

        const normalized = {
          apiVersion: data.apiVersion ?? "1.0",
          sessionId: data.sessionId ?? String(base.sessionId),
          checklist: Array.isArray(data.checklist) ? data.checklist : [],
          items: Array.isArray(data.items) ? data.items : [],
        };
        setResult(normalized);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "피드백 분석 중 오류가 발생했습니다.");
      } finally {
        if (alive) setLoading(false);
      }
    };

    run();
    return () => { alive = false; };
  }, [base]);

  // 3) PDF 다운로드
  const downloadPdf = async () => {
    if (!result) return;
    try {
      setDownloading(true);
      setErr("");

      const body = {
        sessionId: result.sessionId || base.sessionId,
        checklist: result.checklist ?? [],
        items: (result.items || []).map((it) => ({
          qid: it.qid,
          question: it.question,
          answer: it.answer,
          annotations: it.annotations,
          rewrite: it.rewrite,
          jdInsert: it.jdInsert,
        })),
      };

      const resp = await api.post("/api/feedback/export.pdf", body, {
        responseType: "blob",
        validateStatus: () => true,
      });

      if (resp.status !== 200) {
        setErr(`PDF 생성 실패 (HTTP ${resp.status})`);
        return;
      }

      const blob = resp.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `feedback-${result.sessionId || base.sessionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
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
        세션: <strong>{result?.sessionId ?? base.sessionId ?? "-"}</strong>
        {result?.apiVersion ? <> · API {result.apiVersion}</> : null}
      </p>

      {loading && <div style={{ padding: 24, border: "1px solid #e5e7eb", borderRadius: 12, background: "#fafafa" }}>분석 중입니다…</div>}
      {err && (
        <div style={{ padding: 16, border: "1px solid #fecaca", background: "#fff1f2", borderRadius: 8, color: "#b91c1c", marginBottom: 16, whiteSpace: "pre-wrap" }}>
          {err}
        </div>
      )}

      {!loading && result && (
        <>
          {Array.isArray(result.checklist) && result.checklist.length > 0 && (
            <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <h3 style={{ margin: "0 0 12px 0" }}>체크리스트</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {result.checklist.map((c, i) => (
                  <span key={i} style={{ fontSize: 14, padding: "6px 10px", background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 999 }}>
                    ✅ {c}
                  </span>
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
                          <span key={i} style={{ fontSize: 12, background: "#ecfeff", border: "1px solid #a5f3fc", padding: "2px 8px", borderRadius: 999 }}>
                            {k}
                          </span>
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
                </div>
              ))}
            </section>
          )}

 


          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => navigate(-1)} style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer" }}>
              뒤로
            </button>
            <button onClick={downloadPdf} disabled={downloading}
              style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #1d4ed8", background: "#1d4ed8", color: "#fff", cursor: "pointer" }}>
              {downloading ? "PDF 생성 중..." : "PDF로 내보내기"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
