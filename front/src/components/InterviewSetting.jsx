// src/component/InterviewSetting.jsx
import React, { useState } from "react";

const InterviewSetting = () => {
  const [interviewType, setInterviewType] = useState("");
  const [difficulty, setDifficulty] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`면접 유형: ${interviewType}, 난이도: ${difficulty}`);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <h2>면접 시뮬레이션 설정</h2>

      {/* ✅ 면접 유형 */}
      <div style={{ margin: "20px 0" }}>
        <h3>면접 유형</h3>
        {["기술", "인성", "직무"].map((type) => (
          <button
            key={type}
            onClick={() => setInterviewType(type)}
            style={{
              margin: "10px",
              padding: "15px 25px",
              border:
                interviewType === type ? "2px solid blue" : "1px solid #ccc",
              borderRadius: "10px",
              backgroundColor: interviewType === type ? "#f0f8ff" : "white",
              cursor: "pointer",
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* ✅ 난이도 */}
      <div style={{ margin: "20px 0" }}>
        <h3>난이도</h3>
        {["친절", "공포", "압박"].map((level) => (
          <button
            key={level}
            onClick={() => setDifficulty(level)}
            style={{
              margin: "10px",
              padding: "15px 25px",
              border:
                difficulty === level ? "2px solid blue" : "1px solid #ccc",
              borderRadius: "10px",
              backgroundColor: difficulty === level ? "#f0f8ff" : "white",
              cursor: "pointer",
            }}
          >
            {level}
          </button>
        ))}
      </div>

      {/* ✅ 설정 버튼 */}
      <button
        onClick={handleSubmit}
        style={{
          marginTop: "30px",
          padding: "12px 50px",
          backgroundColor: "navy",
          color: "white",
          fontSize: "16px",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        설정
      </button>
    </div>
  );
};

export default InterviewSetting;
