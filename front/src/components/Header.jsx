import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

function Header() {
  return (
    <header>
      <nav>
        <Link to="/">홈</Link>
        <Link to="/resume">이력서</Link>
        <Link to="/interview">면접</Link>
        <Link to="/signup">회원가입</Link>
        <Link to="/login">로그인</Link>
        <Link to="/profileForm">프로필 입력</Link>
        <Link to="/interview-setting">면접 설정</Link>
        <Link to="/feedback">인터뷰 피드백</Link>

      </nav>
    </header>
  );
}

export default Header;
