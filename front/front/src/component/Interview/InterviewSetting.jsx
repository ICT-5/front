import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000"; // ← FastAPI

const getAuthHeaders = () => {
  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("jwt");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function InterviewSetting() {
  const [interviewType, setInterviewType] = useState("인성");
  const [personality, setPersonality] = useState("ISTJ"); // 백엔드 스펙: personality 문자열
  const [userId, setUserId] = useState(3); // DB에 존재하는 id 사용(예: 3)
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!interviewType || !personality || !userId) {
      alert("면접유형, 성격, user_id를 확인하세요.");
      return;
    }

    try {
      setLoading(true);
      const resp = await fetch(`${API_BASE}/api/simulation/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          user_id: Number(userId),
          interview_type: interviewType,
          personality,
        }),
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(`세션 생성 실패(${resp.status}) ${text}`);
      }

      const data = await resp.json();
      // 첫 질문: 응답의 questions[0] 사용
      const firstQ = data?.questions?.[0];
      if (!firstQ) {
        throw new Error("초기 질문을 받지 못했습니다.");
      }

      navigate("/interview/analyze", {
        state: {
          sessionId: data.session_id,
          interviewType,
          personality,
          // 진행 화면에서 바로 사용
          firstQuestion: {
            question_id: firstQ.question_id,
            content: firstQ.content,
          },
          jdKeywords: [], // 필요시 키워드 전달
        },
      });
    } catch (err) {
      console.error(err);
      alert(err.message || "세션 생성 중 오류");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "40px auto" }}>
      <h2>면접 시뮬레이션 설정</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ margin: "16px 0" }}>
          <label>user_id&nbsp;</label>
          <input
            type="number"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={{ padding: 8, borderRadius: 6, border: "1px solid #ccc" }}
          />
          <div style={{ fontSize: 12, color: "#666" }}>
            (DB의 User(id) 존재 값: 예) 1,2,3)
          </div>
        </div>

        <div style={{ margin: "16px 0" }}>
          <label>면접 유형&nbsp;</label>
          {["인성", "직무", "가치관"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setInterviewType(t)}
              style={{
                marginRight: 8,
                padding: "8px 14px",
                borderRadius: 8,
                border: interviewType === t ? "2px solid #2563eb" : "1px solid #ccc",
                background: interviewType === t ? "#eff6ff" : "#fff",
                cursor: "pointer",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div style={{ margin: "16px 0" }}>
          <label>면접관 성격(personality)&nbsp;</label>
          <input
            type="text"
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
            placeholder="예: ISTJ / 친절 / 압박"
            style={{ padding: 8, borderRadius: 6, border: "1px solid #ccc", width: 240 }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 24px",
            borderRadius: 8,
            background: "#1d4ed8",
            color: "#fff",
            border: 0,
            cursor: "pointer",
          }}
        >
          {loading ? "세션 생성 중..." : "시작"}
        </button>
      </form>
    </div>
  );
}
