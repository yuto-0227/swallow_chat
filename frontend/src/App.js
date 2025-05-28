import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./Login";
import Chat from "./Chat";
import SelectType from "./SelectType";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true); // ログイン状態を更新
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={isLoggedIn ? <SelectType /> : <Login onLogin={handleLogin} />} />
        <Route path="/select-type" element={isLoggedIn ? <SelectType /> : <Login onLogin={handleLogin} />} />
        <Route path="/chat" element={isLoggedIn ? <Chat /> : <Login onLogin={handleLogin} />} />
      </Routes>
    </Router>
  );
}

export default App;
