// src/hooks/useInterviewTranscript.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * 면접 세션의 질문/답변(QA)을 sessionStorage에 유지/복원하는 훅.
 * - DB 없이 시뮬 → 피드백 흐름 테스트 가능
 * - 저장 키: interview_qas:<sessionId>
 */
export default function useInterviewTranscript(sessionId = "sess_local_dev") {
  const STORAGE_KEY = `interview_qas:${sessionId}`;

  // 초기 복원
  const boot = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, [STORAGE_KEY]);

  const [qas, setQas] = useState(boot);
  const lastQuestionRef = useRef(null); // 마지막 질문 기억

  // 변경 저장
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(qas));
  }, [STORAGE_KEY, qas]);

  /** 전체 리셋 */
  const reset = useCallback(() => {
    setQas([]);
    sessionStorage.removeItem(STORAGE_KEY);
    lastQuestionRef.current = null;
  }, [STORAGE_KEY]);

  /** 질문 수신 시 호출 */
  const appendQuestion = useCallback((qid, content) => {
    const id = qid || `q_${Date.now()}`;
    lastQuestionRef.current = { qid: id, content };
  }, []);

  /** 답변 추가 (qid 생략 시 마지막 질문에 매칭) */
  const appendAnswer = useCallback((qid, answer) => {
    const id = qid || lastQuestionRef.current?.qid || `q_${Date.now()}`;
    setQas(prev => [...prev, { qid: id, answer }]);
  }, []);

  /** 피드백 API 요청 페이로드 변환 */
  const toFeedbackPayload = useCallback(
    (extra = {}) => ({
      sessionId,
      jdKeywords: extra.jdKeywords || [],
      qas: qas.map(({ qid, answer }) => ({ qid, answer })),
    }),
    [qas, sessionId]
  );

  const getLastQuestion = useCallback(() => lastQuestionRef.current, []);

  return { qas, appendQuestion, appendAnswer, reset, toFeedbackPayload, getLastQuestion };
}
