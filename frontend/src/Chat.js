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
import namePlate from "./png/name.png";

const emotionToImage = {
  neutral: owlNeutral,
  joy: owlJoy,
  angry: owlAngry,
  sad: owlSad,
  happy: owlHappy,
};

function Chat() {
  // Google Fontsの動的読み込み
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Rounded+Mplus+1c&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const [messages, setMessages] = useState([
    { sender: "owl", text: "こんにちは。お話を聞かせてくださいね。" },
  ]);
  const [input, setInput] = useState("");
  const [owlEmotion, setOwlEmotion] = useState("neutral");
  const [isThinking, setIsThinking] = useState(false);
  const [owlName, setOwlName] = useState("おうるくん");
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempName, setTempName] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const messagesEndRef = useRef(null);

  // スクロール処理
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 初回ロード時にニックネーム取得
  useEffect(() => {
    const fetchNickname = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await api.get("/accounts/profile/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.nickname) {
          setOwlName(response.data.nickname);
        }
      } catch (error) {
        console.error("ニックネームの取得に失敗:", error);
      }
    };

    fetchNickname();
  }, []);

  // メッセージ送信処理
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInput("");
    setIsThinking(true);
    setOwlEmotion(null);

    const token = localStorage.getItem("token");

    try {
      const response = await api.post(
        "/dialogue/ai-response/",
        { user_input: userMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { response: aiMessage, emotion: aiEmotion = "neutral" } = response.data;
      setMessages((prev) => [...prev, { sender: "owl", text: aiMessage }]);
      setOwlEmotion(aiEmotion);
    } catch (error) {
      console.error("AI応答の取得に失敗:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "owl", text: "すみません、エラーが発生しました。" },
      ]);
      setOwlEmotion("neutral");
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  // ニックネーム保存
  const handleNameSave = async () => {
    const name = tempName.trim();
    if (name.length < 1 || name.length > 8) {
      alert("ニックネームは1〜8文字で入力してください。");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await api.post(
        "/accounts/update-nickname/",
        { nickname: name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOwlName(name);
      setShowNameModal(false);
      setTempName("");
    } catch (error) {
      console.error("ニックネームの更新に失敗:", error);
      alert("ニックネームの更新に失敗しました。");
    }
  };

  const lastOwlMessage = [...messages].reverse().find((msg) => msg.sender === "owl");

  const getBubbleSizeClass = (text) => {
    const length = text.length;
    if (length < 30) return "bubble-height-small";
    if (length < 100) return "bubble-height-medium";
    return "bubble-height-large";
  };

  return (
    <div className="chat-background" style={{ fontFamily: "'Rounded Mplus 1c', sans-serif" }}>
      <div className="chat-container">
        <button className="history-toggle" onClick={() => setShowHistory(!showHistory)}>
          対話履歴
        </button>
        <button className="name-button" onClick={() => setShowNameModal(true)}>
          名前変更
        </button>

        {showHistory && (
          <div className="history-panel">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`history-message ${msg.sender === "user" ? "user" : "owl"}`}
              >
                <div className="sender-label">
                  {msg.sender === "user" ? "User" : owlName}
                </div>
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
          <div className="nameplate">
            <img src={namePlate} alt="ネームプレート" />
            <div className="owl-name">{owlName}</div>
          </div>
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
        <button onClick={handleSend} disabled={isThinking}>
          送信
        </button>
      </div>

      {showNameModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>
              ニックネームの変更
              <br />
              (デフォルト：おうるくん)
            </h2>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              maxLength={8}
              placeholder="1〜8文字で入力"
            />
            <div className="modal-buttons">
              <button onClick={handleNameSave}>保存</button>
              <button onClick={() => setShowNameModal(false)}>キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;
