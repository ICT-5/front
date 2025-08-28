import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:8080";

// 토큰 넣을 수 있게 (JWT 방식일 때)
const getAuthHeaders = () => {
  const token =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("jwt");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const personaMap = { 친절: 1, 압박: 2, 공포: 3 };

export default function InterviewSetting() {
  const [interviewType, setInterviewType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!interviewType || !difficulty) {
      alert("면접 유형과 난이도를 선택해주세요!");
      return;
    }

    // 기본 내비게이션 페이로드
    const navBase = {
      interviewType,
      difficulty,
      jdKeywords: [], // 필요하면 여기에서 세팅
    };

    try {
      setLoading(true);

      // 백엔드가 토큰에서 userId를 추출한다면 user_id 생략
      const body = {
        persona_id: personaMap[difficulty],
        total_questions: Number(questionCount) || 5,
      };

      const resp = await fetch(`${API_BASE}/api/simulation/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(body),
      });

      if (resp.status === 401) {
        alert("로그인이 필요합니다. 로그인 후 다시 시도해주세요.");
        navigate("/auth/login?next=/interview/setting");
        return;
      }

      // 백엔드가 아직 준비 안 되었거나, 인증 실패 외의 오류면 로컬 모드 폴백
      if (!resp.ok) {
        console.warn("[InterviewSetting] session create failed:", resp.status);
        const localSessionId = `sess_local_${Date.now()}`;
        navigate("/interview/analyze", {
          state: { ...navBase, sessionId: localSessionId, localOnly: true },
        });
        return;
      }

      const data = await resp.json();
      const sessionId = data?.session_id || `sess_${Date.now()}`;
      navigate("/interview/analyze", {
        state: { ...navBase, sessionId, localOnly: false },
      });
    } catch (err) {
      console.error(err);
      // 완전 폴백: 로컬 모드로 시뮬 진행
      const localSessionId = `sess_local_${Date.now()}`;
      navigate("/interview/analyze", {
        state: { ...navBase, sessionId: localSessionId, localOnly: true },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <h2>면접 시뮬레이션 설정</h2>

      <div style={{ margin: "20px 0" }}>
        <h3>면접 유형</h3>
        {["기술", "인성", "직무"].map((type) => (
          <button
            key={type}
            onClick={() => setInterviewType(type)}
            style={{
              margin: "10px",
              padding: "15px 25px",
              border: interviewType === type ? "2px solid blue" : "1px solid #ccc",
              borderRadius: "10px",
              backgroundColor: interviewType === type ? "#f0f8ff" : "white",
              cursor: "pointer",
            }}
          >
            {type}
          </button>
        ))}
      </div>

      <div style={{ margin: "20px 0" }}>
        <h3>난이도</h3>
        {["친절", "압박", "공포"].map((level) => (
          <button
            key={level}
            onClick={() => setDifficulty(level)}
            style={{
              margin: "10px",
              padding: "15px 25px",
              border: difficulty === level ? "2px solid blue" : "1px solid #ccc",
              borderRadius: "10px",
              backgroundColor: difficulty === level ? "#f0f8ff" : "white",
              cursor: "pointer",
            }}
          >
            {level}
          </button>
        ))}
      </div>

      <div style={{ margin: "20px 0" }}>
        <h3>질문 개수</h3>
        <input
          type="number"
          min={1}
          max={10}
          value={questionCount}
          onChange={(e) => setQuestionCount(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc" }}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          marginTop: "30px",
          padding: "12px 50px",
          backgroundColor: "#1d4ed8",
          color: "white",
          fontSize: "16px",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        {loading ? "세션 생성 중..." : "설정"}
      </button>
    </div>
  );
}
