import React from 'react';
import Header from './component/Header';
import Footer from "./component/Footer";

function App() {
  return (
    <div>
      <Header />
        <div style={{ minHeight: "500px", padding: "20px" }}>
        </div>
      <Footer />
    </div>
  );
}

export default App;
