// Chat.js
import React, { useState, useEffect, useRef } from "react";
import "./Chat.css";
import api from "./api";

import owlNeutral from "./png/owl.png";
import owlJoy from "./png/owl_joy.png";
import owlAngry from "./png/owl_angry.png";
import owlSad from "./png/owl_sad.png";
import owlHappy from "./png/owl_happy.png";
import owlThinking from "./png/owl_thinking.png";

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
  const [owlEmotion, setOwlEmotion] = useState("neutral");
  const [showHistory, setShowHistory] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInput("");
    setIsThinking(true); // 思考中に切り替え
    setOwlEmotion(null); // 感情画像非表示にして考えている画像に切り替え

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
    } finally {
      setIsThinking(false); // 応答取得後に思考中解除
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  const lastOwlMessage = [...messages].reverse().find((msg) => msg.sender === "owl");

  const getBubbleSizeClass = (text) => {
    const length = text.length;
    if (length < 30) return "bubble-height-small";
    if (length < 100) return "bubble-height-medium";
    return "bubble-height-large";
  };

  return (
    <div className="chat-background">
      <div className="chat-container">
        <button className="history-toggle" onClick={() => setShowHistory(!showHistory)}>
          対話履歴
        </button>

        {showHistory && (
          <div className="history-panel">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`history-message ${msg.sender === "user" ? "user" : "owl"}`}
              >
                <div className="sender-label">{msg.sender === "user" ? "User" : "Owl"}</div>
                <div className="history-text">{msg.text}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        <div className="character-main">
          <img
            src={isThinking ? owlThinking : emotionToImage[owlEmotion] || owlNeutral}
            alt="フクロウ"
          />
        </div>

        <div className="response-area">
          {lastOwlMessage && (
            <div className={`response-bubble ${getBubbleSizeClass(lastOwlMessage.text)}`}>
              <p>{lastOwlMessage.text}</p>
            </div>
          )}
        </div>
      </div>

      <div className="input-area-bottom">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="入力してください..."
          disabled={isThinking}
        />
        <button onClick={handleSend} disabled={isThinking}>送信</button>
      </div>
    </div>
  );
}

export default Chat;
