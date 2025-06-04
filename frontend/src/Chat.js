import React, { useState, useEffect, useRef } from "react";
import "./Chat.css";
import api from "./api";

import owlNeutral from "./png/owl.png";
import owlJoy from "./png/owl_joy.png";
import owlAngry from "./png/owl_angry.png";
import owlSad from "./png/owl_sad.png";
import owlHappy from "./png/owl_happy.png";

const emotionToImage = {
  neutral: owlNeutral,
  joy: owlJoy,
  angry: owlAngry,
  sad: owlSad,
  happy: owlHappy,
};

function Chat() {
  const [messages, setMessages] = useState([
    { sender: "owl", text: "こんにちは。お話を聞かせてくださいね。" },
  ]);
  const [input, setInput] = useState("");
  const [owlEmotion, setOwlEmotion] = useState("neutral"); // ← 表情を管理
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
      const aiEmotion = response.data.emotion || "neutral";

      setMessages((prev) => [...prev, { sender: "owl", text: aiMessage }]);
      setOwlEmotion(aiEmotion);

    } catch (error) {
      console.error("AI応答の取得に失敗しました:", error);
      setMessages((prev) => [...prev, { sender: "owl", text: "すみません、エラーが発生しました。" }]);
      setOwlEmotion("neutral");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="app-container">
      <div className="character-area">
        <img src={emotionToImage[owlEmotion]} alt="フクロウ" />
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
