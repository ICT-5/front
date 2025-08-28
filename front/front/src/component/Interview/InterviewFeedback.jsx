// src/component/Interview/InterviewFeedback.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/** === 환경 설정 === */
const API_BASE ="http://localhost:8080"

// 프로젝트 표준 토큰 저장 키에 맞춰 수정
const getAuthHeaders = () => {
  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("jwt");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/** === 유틸: 주어진 answer에 annotation span을 하이라이트 ===
 * annotations: [{ span:{start,end,text}, category, comment, suggest }]
 * 카테고리별 색상은 임의 지정. 포지션 꼬임 방지를 위해 앞에서부터 누적 분할.
 */
function highlightAnswer(answer = "", annotations = []) {
  if (!answer || !Array.isArray(annotations) || annotations.length === 0) {
    return <span>{answer}</span>;
  }
  const palette = {
    vague: "#fde68a",       // 노랑
    no_metric: "#bfdbfe",   // 파랑
    keyword: "#c7f9cc",     // 연두
    default: "#fcd5ce",     // 살구
  };

  // start 인덱스 순으로 정렬
  const anns = [...annotations]
    .filter(a => a?.span && Number.isFinite(a.span.start) && Number.isFinite(a.span.end))
    .sort((a, b) => a.span.start - b.span.start);

  const nodes = [];
  let cursor = 0;

  anns.forEach((a, idx) => {
    const { start, end } = a.span;
    // 범위 클램프
    const s = Math.max(0, Math.min(answer.length, start));
    const e = Math.max(s, Math.min(answer.length, end));

    if (s > cursor) nodes.push(<span key={`plain-${idx}-${cursor}`}>{answer.slice(cursor, s)}</span>);

    const bg = palette[a.category] || palette.default;
    nodes.push(
      <mark
        key={`hl-${idx}-${s}-${e}`}
        style={{
          backgroundColor: bg,
          padding: "0 2px",
          borderRadius: "4px",
        }}
        title={`${a.category ?? "note"}: ${a.comment ?? ""}${
          a.suggest ? ` / ${a.suggest}` : ""
        }`}
      >
        {answer.slice(s, e)}
      </mark>
    );
    cursor = e;
  });

  if (cursor < answer.length) nodes.push(<span key={`tail-${cursor}`}>{answer.slice(cursor)}</span>);
  return <>{nodes}</>;
}

export default function InterviewFeedback() {
  const { state } = useLocation();
  const navigate = useNavigate();

  /** 입력 페이로드 구성
   * - 기본적으로 이전 화면에서 넘겨받는 것을 기대
   *   state.payload = { sessionId?, jdKeywords?, qas: [{qid?, answer}] }
   * - 없으면 데모용 기본값 하나 구성
   */
  const inputPayload = useMemo(() => {
    if (state?.payload?.qas?.length) return state.payload;
    // 데모 fallback
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
  const [result, setResult] = useState(null); // 서버 JSON 응답 저장

  // === 1) JSON 분석 호출 ===
  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setLoading(true);
        setErr("");

        const resp = await fetch(`${API_BASE}/api/feedback/analyze`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            sessionId: inputPayload.sessionId,
            jdKeywords: inputPayload.jdKeywords,
            qas: inputPayload.qas?.map((q) => ({
              qid: q.qid ?? q.id ?? undefined,
              answer: q.answer ?? "",
            })),
          }),
        });

        if (resp.status === 401) {
          // 토큰 만료 등
          setErr("인증이 필요합니다. 다시 로그인 후 시도해 주세요.");
          setLoading(false);
          return;
        }

        if (!resp.ok) {
          const text = await resp.text().catch(() => "");
          throw new Error(`HTTP ${resp.status} ${resp.statusText}\n${text}`);
        }

        const data = await resp.json();
        if (!alive) return;
        setResult(data);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "피드백 분석 중 오류가 발생했습니다.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    // qas가 있어야 호출
    if (Array.isArray(inputPayload.qas) && inputPayload.qas.length > 0) {
      run();
    } else {
      setLoading(false);
      setErr("질문/답변(qas) 데이터가 없습니다.");
    }

    return () => {
      alive = false;
    };
  }, [inputPayload]);

  // === 2) PDF 다운로드 ===
  const [downloading, setDownloading] = useState(false);
  const downloadPdf = async () => {
    try {
      setDownloading(true);
      setErr("");

      // PDF 요청 스키마: checklist/items은 JSON 응답 기준으로 재구성
      const checklist = result?.checklist ?? [];
      const items =
        result?.items?.map((it) => ({
          qid: it.qid,
          question: it.question,
          answer: it.answer,
          annotations: it.annotations,
          rewrite: it.rewrite,
          jdInsert: it.jdInsert,
        })) ?? [];

      const resp = await fetch(`${API_BASE}/api/feedback/pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/pdf",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          sessionId: result?.sessionId ?? inputPayload.sessionId,
          checklist,
          items,
        }),
      });

      if (!resp.ok) {
        const t = await resp.text().catch(() => "");
        throw new Error(`PDF 생성 실패: HTTP ${resp.status}\n${t}`);
      }

      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const sid = result?.sessionId ?? inputPayload.sessionId ?? "session";
      a.href = url;
      a.download = `feedback-${sid}.pdf`;
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

  // === 렌더 ===
  return (
    <div style={{ maxWidth: 960, margin: "40px auto", fontFamily: "Inter, system-ui, Arial, sans-serif" }}>
      <h2 style={{ textAlign: "center", marginBottom: 8 }}>인터뷰 피드백</h2>
      <p style={{ textAlign: "center", color: "#6b7280", marginTop: 0 }}>
        세션: <strong>{result?.sessionId ?? inputPayload.sessionId ?? "-"}</strong>
      </p>

      {loading && (
        <div style={{ padding: 24, border: "1px solid #e5e7eb", borderRadius: 12, background: "#fafafa" }}>
          분석 중입니다…
        </div>
      )}

      {err && (
        <div style={{ padding: 16, border: "1px solid #fecaca", background: "#fff1f2", borderRadius: 8, color: "#b91c1c", marginBottom: 16, whiteSpace: "pre-wrap" }}>
          {err}
        </div>
      )}

      {!loading && result && (
        <>
          {/* 체크리스트 */}
          {Array.isArray(result.checklist) && result.checklist.length > 0 && (
            <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <h3 style={{ margin: "0 0 12px 0" }}>체크리스트</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {result.checklist.map((c, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 14,
                      padding: "6px 10px",
                      background: "#eef2ff",
                      border: "1px solid #c7d2fe",
                      borderRadius: 999,
                    }}
                  >
                    ✅ {c}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* 아이템 목록 */}
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

                  {/* 원문 + 하이라이트 */}
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>원문 답변</div>
                    <div
                      style={{
                        background: "#f9fafb",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        padding: 12,
                        lineHeight: 1.6,
                      }}
                    >
                      {highlightAnswer(it.answer, it.annotations)}
                    </div>
                  </div>

                  {/* 규칙 탐지 목록 */}
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

                  {/* 첨삭문 */}
                  {it.rewrite && (
                    <div>
                      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>첨삭 제안</div>
                      <div
                        style={{
                          background: "#eef2ff",
                          border: "1px solid #c7d2fe",
                          borderRadius: 8,
                          padding: 12,
                        }}
                      >
                        {it.rewrite}
                      </div>
                    </div>
                  )}

                  {/* 팁 */}
                  {Array.isArray(it.tips) && it.tips.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>추가 팁</div>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {it.tips.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* 액션 바 */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              뒤로
            </button>
            <button
              onClick={downloadPdf}
              disabled={downloading}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid #1d4ed8",
                background: "#1d4ed8",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              {downloading ? "PDF 생성 중..." : "PDF로 내보내기"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
