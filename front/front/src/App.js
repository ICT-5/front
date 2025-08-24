// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Header / Footer (App.js가 src/에 있다면 경로는 ./component/.. 가 맞음)
import Header from "./component/Header";
import Footer from "./component/Footer";

// 페이지 컴포넌트들 (파일은 소문자여도, import 변수명은 대문자(컴포넌트)로!)
import Signup from "./component/Auth/signup";
import Login from "./component/Auth/login";
import ResumeResult from "./component/Resume/result";
import ResumeUpload from "./component/Resume/upload";
import ResumeAnalyze from "./component/Resume/analyze.jsx";
import AuthCallback from "./component/Auth/logincallback.jsx";

function App() {
  // (선택) 인증 화면에서 헤더/푸터 숨기기


  return (
    <Router>
      <Header />

      <div style={{ minHeight: "500px", padding: "20px" }}>
        <Routes>
          {/* 초기 진입은 로그인으로 */}
          <Route path="/" element={<Navigate to="/auth/login" replace />} />

          {/* Auth */}
          <Route path="/auth/signup" element={<Signup />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Resume */}
          <Route path="/resume/upload" element={<ResumeUpload />} />
          <Route path="/resume/result" element={<ResumeResult />} />
          <Route path="/resume/analyze" element={<ResumeAnalyze />} />

          {/* 404 → 로그인으로 */}
          <Route path="*" element={<Navigate to="/auth/login" replace />} />
        </Routes>
      </div>

      <Footer />
    </Router>
  );
}

export default App;
