// src/App.js
import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext.jsx";
import PrivateRoute from "../src/router/PrivateRouter.jsx"

import Header from "./component/layout/Header.jsx";
import Footer from "./component/layout/Footer.jsx";

const HomePage = lazy(() => import("./component/Main/HomePage.jsx"));

// Auth
const Signup = lazy(() => import("./component/Auth/signup.jsx"));
const Login = lazy(() => import("./component/Auth/login.jsx"));
const AuthCallback = lazy(() => import("./component/Auth/logincallback.jsx"));

// Interview
const InterviewFeedback = lazy(() => import("./component/Interview/InterviewFeedback.jsx"));
const InterviewSetting  = lazy(() => import("./component/Interview/InterviewSetting.jsx"));
const InterviewAnalyze  = lazy(() => import("./component/Interview/Interviewanalyze.jsx"));
const InterviewTest     = lazy(() => import("./component/Interview/InterviewFeedbackTest.jsx"));

// Resume
const ResumeUpload  = lazy(() => import("./component/Resume/upload.jsx"));
const ResumeAnalyze = lazy(() => import("./component/Resume/analyze.jsx"));
const ResumeResult  = lazy(() => import("./component/Resume/result.jsx"));

function App() {
  return (
    <Router>
      <AuthProvider>
        <Header />
        <div style={{ minHeight: "500px", padding: "20px" }}>
          <Suspense fallback={<div style={{ padding: 24 }}>Loading...</div>}>
            <Routes>
              {/* 공개 */}
              <Route path="/" element={<HomePage />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/auth/signup" element={<Signup />} />
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* 보호 라우트 */}
              <Route element={<PrivateRoute />}>
                <Route path="/interview/feedback" element={<InterviewFeedback />} />
                <Route path="/interview/analyze"  element={<InterviewAnalyze />} />
                <Route path="/interview/setting"  element={<InterviewSetting />} />
                <Route path="/interview/feedbacktest" element={<InterviewTest />} />

                <Route path="/resume/upload"  element={<ResumeUpload />} />
                <Route path="/resume/analyze" element={<ResumeAnalyze />} />
                <Route path="/resume/result"  element={<ResumeResult />} />
              </Route>

              <Route path="*" element={<Navigate to="/auth/login" replace />} />
            </Routes>
          </Suspense>
        </div>
        <Footer />
      </AuthProvider>
    </Router>
  );
}
export default App;
