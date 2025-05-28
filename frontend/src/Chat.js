import React, { useState, useEffect, useRef } from "react";
import "./Chat.css";
import owlImage from "./png/owl.png";
import api from "./api";  // 追加

function Chat() {
  const [messages, setMessages] = useState([
    { sender: "owl", text: "こんにちは。お話を聞かせてくださいね。" },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
  
    const userMessage = input;
    setMessages([...messages, { sender: "user", text: userMessage }]);
    setInput("");
  
    const token = localStorage.getItem("token");
  
    try {
      const response = await api.post(
        "/dialogue/ai-response/", 
        { user_input: userMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      const aiMessage = response.data.response;
      setMessages((prev) => [...prev, { sender: "owl", text: aiMessage }]);
  
    } catch (error) {
      console.error("AI応答の取得に失敗しました:", error);
      setMessages((prev) => [...prev, { sender: "owl", text: "すみません、エラーが発生しました。" }]);
    }
  };
  
  
  

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="app-container">
      <div className="character-area">
        <img src={owlImage} alt="フクロウ" />
      </div>
      <div className="chat-area">
        <div className="messages">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${msg.sender === "user" ? "user" : "owl"}`}
            >
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="input-area">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="入力してください..."
          />
          <button onClick={handleSend}>送信</button>
        </div>
      </div>
    </div>
  );
}

export default Chat;
