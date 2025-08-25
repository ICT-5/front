import React from 'react';

const HomePage = () => {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'Arial, sans-serif' }}>
      {/* 서비스 이름 */}
      <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '20px' }}>
        Talkcruit
      </h1>

      {/* 간단 소개 문구 */}
      <p style={{ fontSize: '1.2rem', marginBottom: '40px', color: '#555' }}>
        당신의 면접 준비, 이제 Talkcruit와 함께하세요!
      </p>

      {/* 주요 기능 섹션 */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '15px' }}>주요 기능</h2>
        <ul style={{ listStyleType: 'disc', display: 'inline-block', textAlign: 'left', paddingLeft: '20px' }}>
          <li>이력서 작성 및 관리</li>
          <li>모의 면접 연습</li>
          <li>면접 피드백 확인</li>
        </ul>
      </section>

      {/* 공지사항 / 업데이트 */}
      <section>
        <h2 style={{ fontSize: '2rem', marginBottom: '15px' }}>공지사항</h2>
        <p style={{ color: '#555' }}>새로운 기능 업데이트 예정! 곧 만나보세요.</p>
      </section>
    </div>
  );
};

export default HomePage;
