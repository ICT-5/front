import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useInterviewTranscript from "../../hooks/useInterviewTranscript";
import "../../styles/Interview/Interviewanalyze.css";

const API_BASE = "http://localhost:8080";

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
      interviewType: state?.interviewType || "기술",
      difficulty: state?.difficulty || "친절",
      sessionId: state?.sessionId || `sess_local_${Date.now()}`,
      localOnly: !!state?.localOnly, // 백엔 실패 시 로컬 폴백
      jdKeywords: state?.jdKeywords || [],
    }),
    [state]
  );

  // Q/A 누적 (DB 없이도 피드백 단계로 넘기기 위한 저장)
  const { appendQuestion, appendAnswer, toFeedbackPayload } =
    useInterviewTranscript(meta.sessionId);

  const [messages, setMessages] = useState([]); // { role, text, sim_question_id? }
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // 1) 첫 질문 로드
  useEffect(() => {
    let alive = true;

    async function loadFirst() {
      try {
        setLoading(true);
        setError("");

        if (meta.localOnly) {
          // 로컬 모드: 목업 첫 질문
          if (!alive) return;
          const firstQ = { role: "interviewer", text: "자기소개를 간단히 해주세요.", sim_question_id: "simq_local_1", qid: "q1" };
          setMessages([firstQ]);
          appendQuestion("q1", firstQ.text);
          return;
        }

        // 백엔드 모드: 다음 질문 요청
        const resp = await fetch(
          `${API_BASE}/api/simulation/${meta.sessionId}/question/next`,
          { headers: { ...getAuthHeaders() } }
        );

        if (resp.status === 401) {
          setError("로그인이 필요합니다. 다시 로그인해 주세요.");
          return;
        }

        if (!resp.ok) {
          // GET이 자동 트리거되어 아직 생성 전인 경우 등 → 목업 폴백
          console.warn("[Analyze] question/next failed:", resp.status);
          const firstQ = { role: "interviewer", text: "자기소개를 간단히 해주세요.", sim_question_id: "simq_local_1", qid: "q1" };
          setMessages([firstQ]);
          appendQuestion("q1", firstQ.text);
          return;
        }

        const q = await resp.json();
        if (!alive) return;

        setMessages([{ role: "interviewer", text: q.content, sim_question_id: q.sim_question_id }]);
        // qid가 응답에 없다면 sim_question_id를 qid로 사용
        appendQuestion(String(q.sim_question_id || "q1"), q.content);
      } catch (err) {
        console.error(err);
        // 폴백
        const firstQ = { role: "interviewer", text: "자기소개를 간단히 해주세요.", sim_question_id: "simq_local_1", qid: "q1" };
        setMessages([firstQ]);
        appendQuestion("q1", firstQ.text);
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadFirst();
    return () => {
      alive = false;
    };
  }, [appendQuestion, meta.localOnly, meta.sessionId]);

  // 2) 답변 제출 → 다음 질문 (백엔 or 로컬)
  const send = async (e) => {
    e.preventDefault();
    const value = input.trim();
    if (!value || !messages.length) return;

    const lastMsg = messages[messages.length - 1];
    setMessages((prev) => [...prev, { role: "candidate", text: value }]);
    setSending(true);
    setInput("");

    try {
      // 답변 저장(프론트 Q/A 스토리지)
      appendAnswer(String(lastMsg.sim_question_id || "q_latest"), value);

      if (meta.localOnly) {
        // 로컬 모드: 목업 다음 질문 1~2개 후 종료
        const askedCount = messages.filter((m) => m.role === "interviewer").length;
        if (askedCount >= 2) {
          // 세션 종료 → 피드백 단계
          const payload = toFeedbackPayload({ jdKeywords: meta.jdKeywords });
          navigate("/interview/feedback", { state: { payload } });
          return;
        }
        const nextQ = {
          role: "interviewer",
          text: askedCount === 1 ? "최근 프로젝트 성과를 수치로 말해 주세요." : "팀에서 맡았던 가장 어려운 과제는?",
          sim_question_id: `simq_local_${askedCount + 1}`,
          qid: `q${askedCount + 1}`,
        };
        setMessages((prev) => [...prev, nextQ]);
        appendQuestion(nextQ.qid, nextQ.text);
        return;
      }

      // 백엔드 모드: 답변 제출
      await fetch(`${API_BASE}/api/simulation/${meta.sessionId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          sim_question_id: lastMsg.sim_question_id,
          content: value,
        }),
      });

      // 다음 질문 요청 (트리거가 자동이어도, 화면 갱신을 위해 시도)
      const resp = await fetch(
        `${API_BASE}/api/simulation/${meta.sessionId}/question/next`,
        { headers: { ...getAuthHeaders() } }
      );

      if (resp.status === 404 || resp.status === 204) {
        // 질문 소진: 세션 종료 후 피드백
        await fetch(`${API_BASE}/api/simulation/${meta.sessionId}/end`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({ end_reason: "limit_reached" }),
        }).catch(() => {});
        const payload = toFeedbackPayload({ jdKeywords: meta.jdKeywords });
        navigate("/interview/feedback", { state: { payload } });
        return;
      }

      if (!resp.ok) {
        // 실패 → 그냥 종료 처리(폴백)
        const payload = toFeedbackPayload({ jdKeywords: meta.jdKeywords });
        navigate("/interview/feedback", { state: { payload } });
        return;
      }

      const q = await resp.json();
      setMessages((prev) => [
        ...prev,
        { role: "interviewer", text: q.content, sim_question_id: q.sim_question_id },
      ]);
      appendQuestion(String(q.sim_question_id || `q_${Date.now()}`), q.content);
    } catch (err) {
      console.error(err);
      setError("전송 실패: " + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="ifb-wrap">
      <h1 className="ifb-title">면접 시뮬레이션</h1>
      <p className="ifb-meta">
        유형: <strong>{meta.interviewType}</strong> · 난이도: <strong>{meta.difficulty}</strong>
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
