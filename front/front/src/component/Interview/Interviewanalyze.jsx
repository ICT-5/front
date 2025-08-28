// src/component/Interview/InterviewAnalyze.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../styles/Interview/Interviewanalyze.css";

const API_BASE = "http://localhost:8080";

export default function InterviewAnalyze() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { sessionId, interviewType, difficulty } = state || {};

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // 세션 시작 후 첫 질문 가져오기
  useEffect(() => {
    if (!sessionId) {
      setError("세션 ID가 없습니다. 처음 화면에서 다시 시도하세요.");
      setLoading(false);
      return;
    }

    async function fetchFirstQuestion() {
      try {
        const resp = await fetch(`${API_BASE}/api/simulation/${sessionId}/question/next`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const q = await resp.json();

        setMessages([
          { role: "interviewer", text: q.content, sim_question_id: q.sim_question_id },
        ]);
      } catch (err) {
        setError("초기 질문 불러오기 실패: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchFirstQuestion();
  }, [sessionId]);

  // 답변 제출 + 다음 질문 요청
  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || !messages.length) return;

    const lastQ = messages[messages.length - 1];
    setMessages((prev) => [...prev, { role: "candidate", text: input }]);
    setSending(true);
    setInput("");

    try {
      await fetch(`${API_BASE}/api/simulation/${sessionId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sim_question_id: lastQ.sim_question_id,
          content: input,
        }),
      });

      // 다음 질문 가져오기
      const resp = await fetch(`${API_BASE}/api/simulation/${sessionId}/question/next`);
      if (resp.ok) {
        const q = await resp.json();
        setMessages((prev) => [...prev, { role: "interviewer", text: q.content, sim_question_id: q.sim_question_id }]);
      } else if (resp.status === 404) {
        // 질문 끝난 경우 → 세션 종료
        await fetch(`${API_BASE}/api/simulation/${sessionId}/end`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ end_reason: "limit_reached" }),
        });
        navigate("/interview/feedback", { state: { interviewType, difficulty } });
      }
    } catch (err) {
      setError("전송 실패: " + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="ifb-wrap">
      <h1 className="ifb-title">면접 시뮬레이션</h1>
      <p className="ifb-meta">
        유형: <strong>{interviewType}</strong> · 난이도: <strong>{difficulty}</strong>
      </p>

      <div className="ifb-chat">
        {loading ? (
          <div className="ifb-skel">불러오는 중…</div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`row ${m.role}`}>
              <div className="avatar">{m.role === "interviewer" ? "👔" : "🙋"}</div>
              <div className={`bubble ${m.role}`}>{m.text}</div>
            </div>
          ))
        )}
      </div>

      {error && <div className="ifb-error">{error}</div>}

      <form className="ifb-inputbar" onSubmit={send}>
        <input
          type="text"
          placeholder="대답을 입력해주세요"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending || loading}
        />
        <button type="submit" aria-label="send" disabled={sending || loading}>
          🛩️
        </button>
      </form>
    </div>
  );
}
