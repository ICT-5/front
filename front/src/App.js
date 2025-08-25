// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import ProfileForm from './components/ProfileForm';
import InterviewSetting from "./components/InterviewSetting";
import InterviewFeedback from './components/InterviewFeedback';

function App() {
  return (
    <Router>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} /> 
          <Route path="/profileForm" element={<ProfileForm />} />
          <Route path="/interview-setting" element={<InterviewSetting />} />
          <Route path="/feedback" element={<InterviewFeedback />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}

export default App;
