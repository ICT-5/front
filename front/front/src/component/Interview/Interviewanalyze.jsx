import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000"; // FastAPI (시뮬레이션)

const getAuthHeaders = () => {
  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("jwt");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function InterviewAnalyze() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const meta = useMemo(
    () => ({
      sessionId: state?.sessionId,                 // 숫자(BigInt) 세션 ID
      interviewType: state?.interviewType || "인성",
      personality: state?.personality || "ISTJ",
      jdKeywords: state?.jdKeywords || [],
      firstQuestion: state?.firstQuestion,         // { question_id, content } (있으면 바로 사용)
    }),
    [state]
  );

  const [messages, setMessages] = useState([]);    // { role: 'interviewer'|'candidate', text, qid? }
  const [currentQid, setCurrentQid] = useState(null);
  const [askedCount, setAskedCount] = useState(0);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  // 공통: 세션 종료 + 피드백으로 이동 (옵션 A)
  const endAndGo = async (reason = "limit_reached") => {
    try {
      await fetch(`${API_BASE}/api/simulation/${meta.sessionId}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ end_reason: reason }), // ✅ 서버에 맞춘 키
      }).catch(() => {});
    } finally {
      // BIGINT 호환: 숫자 문자열로
      const sid = String(Number(meta.sessionId));
      navigate("/interview/feedback", {
        state: { sessionId: sid, jdKeywords: meta.jdKeywords || [] },
        replace: true,
      });
    }
  };

  // 1) 첫 질문 세팅 (세션 생성 응답에서 받았다는 가정)
  useEffect(() => {
    if (meta.firstQuestion) {
      setMessages([
        {
          role: "interviewer",
          text: meta.firstQuestion.content,
          qid: meta.firstQuestion.question_id,
        },
      ]);
      setCurrentQid(meta.firstQuestion.question_id);
      setAskedCount(1);
    } else {
      // firstQuestion이 없으면 여기서 FastAPI로 첫 질문을 불러오도록 확장 가능
      // (필요 시 GET /api/simulation/{sessionId}/question/next 같은 엔드포인트 호출)
    }
  }, [meta.firstQuestion]);

  // 2) 답변 전송 → 서버 follow_up 수신 → 다음 질문 또는 종료
  const send = async (e) => {
    e.preventDefault();
    const answer = input.trim();
    if (!answer || !currentQid || sending) return;

    setSending(true);
    setMessages((prev) => [...prev, { role: "candidate", text: answer }]);
    setInput("");

    try {
      // 답변 제출
      const resp = await fetch(`${API_BASE}/api/simulation/${meta.sessionId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          question_id: Number(currentQid),
          answer,
          interview_type: meta.interviewType,
          personality: meta.personality,
          keywords: meta.jdKeywords, // 필요 없으면 []
        }),
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(`답변 전송 실패 (${resp.status}) ${text}`);
      }

      // { follow_up, question_id }
      const data = await resp.json();
      const nextText = data?.follow_up ?? "";
      const nextQid = data?.question_id ?? null;

      // 질문이 더 없으면 종료 → 피드백
      if (!nextText) {
        await endAndGo("limit_reached");
        return;
      }

      // 다음 질문 표시
      setMessages((prev) => [...prev, { role: "interviewer", text: nextText, qid: nextQid }]);
      setCurrentQid(nextQid);

      // askedCount 증가 후 바로 체크(비동기 문제 방지)
      setAskedCount((prev) => {
        const next = prev + 1;
        if (next >= 5) {
          // 최대 질문 수 도달 → 종료
          // setState 이후지만 바로 종료 트리거
          endAndGo("limit_reached");
        }
        return next;
      });
    } catch (err) {
      console.error(err);
      alert(err.message || "전송 실패");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ maxWidth: 820, margin: "24px auto" }}>
      <h1>면접 시뮬레이션</h1>
      <p style={{ color: "#555" }}>
        유형: <b>{meta.interviewType}</b> · 성격: <b>{meta.personality}</b> · 세션: <b>{meta.sessionId}</b>
      </p>

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 16, minHeight: 360 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", marginBottom: 10 }}>
            <div style={{ width: 28 }}>{m.role === "interviewer" ? "👔" : "🙋"}</div>
            <div
              style={{
                background: m.role === "interviewer" ? "#f3f4f6" : "#dbeafe",
                padding: "8px 12px",
                borderRadius: 10,
                flex: 1,
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={send} style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="대답을 입력하세요"
          disabled={sending || !currentQid}
          style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
        />
        <button type="submit" disabled={sending || !currentQid} style={{ padding: "10px 18px", borderRadius: 8 }}>
          {sending ? "전송중..." : "보내기"}
        </button>
      </form>

      <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
        질문 수: {askedCount} / 5
      </div>
    </div>
  );
}
