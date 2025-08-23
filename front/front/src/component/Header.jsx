import React from 'react';
import './Header.css';

function Header() {
  return (
    <header>
        <nav>
            <a href="/resume">이력서</a>
            <a href="/interview">면접</a>
            <a href="/signup">회원가입</a>
            <a href="/login">로그인</a>
        </nav>

    </header>
  );
}

export default Header;