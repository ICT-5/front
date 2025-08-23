import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

function Header() {
  return (
    <header>
        <nav>
           <Link to="/resume/upload">이력서</Link>
            <a href="/interview">면접</a>
            <Link to="/auth/signup">회원가입</Link>
           <Link to="/auth/login">로그인</Link>
        </nav>

    </header>
  );
}

export default Header;