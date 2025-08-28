// src/component/Interview/InterviewSetting.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:8080"; // 백엔드 주소 맞게 설정

const personaMap = {
  "친절": 1,
  "압박": 2,
  "공포": 3,
};

const typeMap = {
  "기술": "tech",
  "인성": "personality",
  "직무": "job",
};

export default function InterviewSetting() {
  const [interviewType, setInterviewType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!interviewType || !difficulty) {
      alert("면접 유형과 난이도를 선택해주세요!");
      return;
    }

    try {
      setLoading(true);
      const body = {
        user_id: 1, // TODO: 실제 로그인한 유저 ID로 교체
        persona_id: personaMap[difficulty],
        total_questions: 5,
      };

      const resp = await fetch(`${API_BASE}/api/simulation/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      navigate("/interview/analyze", {
        state: {
          sessionId: data.session_id,
          interviewType,
          difficulty,
        },
      });
    } catch (err) {
      alert("세션 생성 실패: " + err.message);
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
