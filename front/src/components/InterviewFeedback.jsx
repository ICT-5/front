import React from 'react';

const InterviewFeedback = () => {
  // 예시 데이터 (백엔드에서 실제로 받아오는 값)
  const feedbackData = {
    scores: {
      logicality: 8,
      jobFit: 7,
      speakingHabit: 6,
      total: 21
    },
    improvement: "발표 시 핵심 포인트를 더 명확하게 하고, 사례를 구체적으로 들어 설명하면 좋습니다.",
    modelAnswer: "모범 답변 예시: 문제 상황에서 어떤 접근을 취했고, 어떤 결과를 얻었는지 단계별로 설명함."
  };

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>인터뷰 피드백</h2>

      {/* 점수 섹션 */}
      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '30px' }}>
        <div>
          <strong>논리성</strong>
          <div style={{ fontSize: '1.5rem', color: '#007BFF' }}>{feedbackData.scores.logicality}</div>
        </div>
        <div>
          <strong>직무 적합성</strong>
          <div style={{ fontSize: '1.5rem', color: '#28A745' }}>{feedbackData.scores.jobFit}</div>
        </div>
        <div>
          <strong>말하기 습관</strong>
          <div style={{ fontSize: '1.5rem', color: '#FFC107' }}>{feedbackData.scores.speakingHabit}</div>
        </div>
        <div>
          <strong>총점</strong>
          <div style={{ fontSize: '1.5rem', color: '#DC3545' }}>{feedbackData.scores.total}</div>
        </div>
      </div>

      {/* 향상 방향 */}
      <div style={{ marginBottom: '30px' }}>
        <h3>향상 방향</h3>
        <p style={{ backgroundColor: '#f1f1f1', padding: '15px', borderRadius: '8px' }}>
          {feedbackData.improvement}
        </p>
      </div>

      {/* 모범 답변 보기 */}
      <div>
        <h3>모범 답변 보기</h3>
        <p style={{ backgroundColor: '#e9ecef', padding: '15px', borderRadius: '8px' }}>
          {feedbackData.modelAnswer}
        </p>
      </div>
    </div>
  );
};

export default InterviewFeedback;
