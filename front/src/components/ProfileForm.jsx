import React, { useState } from 'react';

const ProfileForm = () => {
  const [techInput, setTechInput] = useState('');
  const [techList, setTechList] = useState([]);
  const [experience, setExperience] = useState('');
  const [education, setEducation] = useState('');
  const [role, setRole] = useState('');

  // 기술스택 제출
  const handleAddTech = (e) => {
    e.preventDefault();
    if (techInput.trim() !== '') {
      setTechList([...techList, techInput.trim()]);
      setTechInput('');
    }
  };

  // 기술스택 삭제
  const handleRemoveTech = (index) => {
    const newList = [...techList];
    newList.splice(index, 1);
    setTechList(newList);
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'Arial, sans-serif' }}>
      <h2>프로필 입력</h2>

      {/* 기술스택 입력 */}
      <form onSubmit={handleAddTech} style={{ marginBottom: '20px' }}>
        <label>기술스택: </label>
        <input
          type="text"
          value={techInput}
          onChange={(e) => setTechInput(e.target.value)}
          placeholder="사용 기술 입력"
          style={{ marginLeft: '10px', padding: '5px', width: '200px' }}
        />
        <button type="submit" style={{ marginLeft: '10px', padding: '5px 10px' }}>추가</button>
      </form>

      {/* 기술스택 리스트 */}
      <div style={{ marginBottom: '20px' }}>
        {techList.map((tech, index) => (
          <span
            key={index}
            style={{
              display: 'inline-block',
              padding: '5px 10px',
              margin: '5px',
              backgroundColor: '#e0e0e0',
              borderRadius: '5px',
            }}
          >
            {tech}
            <button
              onClick={() => handleRemoveTech(index)}
              style={{
                marginLeft: '5px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'red',
                fontWeight: 'bold',
              }}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* 경력 입력 */}
      <div style={{ marginBottom: '20px' }}>
        <label>경력: </label>
        <input
          type="text"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          placeholder="경력 입력"
          style={{ marginLeft: '10px', padding: '5px', width: '200px' }}
        />
      </div>

      {/* 학력 입력 */}
      <div style={{ marginBottom: '20px' }}>
        <label>학력: </label>
        <input
          type="text"
          value={education}
          onChange={(e) => setEducation(e.target.value)}
          placeholder="학력 입력"
          style={{ marginLeft: '10px', padding: '5px', width: '200px' }}
        />
      </div>

      {/* 직군 선택 */}
      <div style={{ marginBottom: '20px' }}>
        <label>직군: </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={{ marginLeft: '10px', padding: '5px', width: '220px' }}
        >
          <option value="">선택</option>
          <option value="frontend">프론트엔드</option>
          <option value="backend">백엔드</option>
          <option value="ai">인공지능</option>
          <option value="data">데이터</option>
          <option value="designer">디자이너</option>
        </select>
      </div>

      {/* 제출 버튼 (폼 전체) */}
      <button style={{ padding: '10px 20px', cursor: 'pointer' }}>제출</button>
    </div>
  );
};

export default ProfileForm;
