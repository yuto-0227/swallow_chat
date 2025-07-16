import React, { useState, useEffect, useRef } from "react";
import "./Chat.css";
import api from "./api";

import owlNeutral from "./png/owl.png";
import owlJoy from "./png/owl_joy.png";
import owlAngry from "./png/owl_angry.png";
import owlSad from "./png/owl_sad.png";
import owlHappy from "./png/owl_happy.png";
import owlThinking from "./png/owl_thinking.png";
import owlFlap from "./gif/owl_flap.gif";
import namePlate from "./png/name.png";

const emotionToImage = {
  neutral: owlNeutral,
  joy: owlJoy,
  angry: owlAngry,
  sad: owlSad,
  happy: owlHappy,
  think: owlThinking,
};

function Chat() {
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Rounded+Mplus+1c&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  const [messages, setMessages] = useState([
    { sender: "owl", text: "こんにちは。お話を聞かせてくださいね。" },
  ]);
  const [input, setInput] = useState("");
  const [owlEmotion, setOwlEmotion] = useState("neutral");
  const [isThinking, setIsThinking] = useState(false);
  const [owlName, setOwlName] = useState("おうるくん");
  const [showHistory, setShowHistory] = useState(false);
  const [nicknameChangeMode, setNicknameChangeMode] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isIdle, setIsIdle] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        console.error("ニックネーム取得失敗:", error);
      }
    };
    fetchNickname();
  }, []);

  // 入力監視（15秒無入力でGIF、10秒後に解除）
  useEffect(() => {
    if (input.trim() === "") {
      const idleTimer = setTimeout(() => {
        setIsIdle(true);
        const resetTimer = setTimeout(() => {
          setIsIdle(false);
        }, 10000); // 10秒で戻る
        return () => clearTimeout(resetTimer);
      }, 15000); // 15秒後動く
      return () => clearTimeout(idleTimer);
    } else {
      setIsIdle(false); // 入力中ならidle解除
    }
  }, [input]);

  const commandGroups = [
    {
      keywords: ["呼び方を変えたい", "名前変えたい", "ニックネーム", "よびかたをかえたい"],
      action: () => {
        setMessages((prev) => [
          ...prev,
          { sender: "owl", text: "呼び方を考えてくれるんですね！どんな呼び方にしてくれますか？" },
        ]);
        setNicknameChangeMode(true);
        setIsThinking(false);
        setOwlEmotion("happy");
      },
    },
    {
      keywords: ["履歴を見たい", "履歴表示", "これまでの会話を見たい"],
      action: () => {
        setShowHistory(true);
        setMessages((prev) => [
          ...prev,
          { sender: "owl", text: "これまでのお話を表示しますね。" },
        ]);
        setIsThinking(false);
        setOwlEmotion("joy");
      },
    },
    {
      keywords: ["履歴を隠したい", "履歴非表示"],
      action: () => {
        setShowHistory(false);
        setMessages((prev) => [
          ...prev,
          { sender: "owl", text: "履歴を隠しました。また見たくなったら教えてくださいね。" },
        ]);
        setIsThinking(false);
        setOwlEmotion("neutral");
      },
    },
  ];

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = input.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInput("");
    setIsThinking(true);
    setOwlEmotion(null);

    const token = localStorage.getItem("token");

    if (nicknameChangeMode) {
      if (userMessage.length < 1 || userMessage.length > 8) {
        setMessages((prev) => [
          ...prev,
          { sender: "owl", text: "呼び方を1〜8文字で決めて欲しいです。" },
        ]);
        setIsThinking(false);
        setOwlEmotion("think");
        return;
      }

      try {
        await api.post(
          "/accounts/update-nickname/",
          { nickname: userMessage },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setOwlName(userMessage);
        setMessages((prev) => [
          ...prev,
          { sender: "owl", text: `わかりました！これからは「${userMessage}」と呼んでくださいね！` },
        ]);
        setOwlEmotion("happy");
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          { sender: "owl", text: "ニックネームの更新に失敗しました…" },
        ]);
        setOwlEmotion("sad");
      } finally {
        setNicknameChangeMode(false);
        setIsThinking(false);
      }
      return;
    }

    const matched = commandGroups.find((group) =>
      group.keywords.includes(userMessage)
    );
    if (matched) {
      matched.action();
      return;
    }

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
      console.error("AI応答失敗:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "owl", text: "すみません、エラーが発生しました。" },
      ]);
      setOwlEmotion("sad");
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSend();
  };

  const lastOwlMessage = [...messages].reverse().find((msg) => msg.sender === "owl");

  const getBubbleSizeClass = (text) => {
    const len = text.length;
    if (len < 30) return "bubble-height-small";
    if (len < 100) return "bubble-height-medium";
    return "bubble-height-large";
  };

  return (
    <div className="chat-background" style={{ fontFamily: "'Rounded Mplus 1c', sans-serif" }}>
      {/* ヒントボタン */}
      <div className="hint-button" onClick={() => setShowHint(!showHint)}>
        {showHint ? "✕" : "?"}
      </div>

      {/* ヒントウィンドウ */}
      {showHint && (
        <div className="hint-overlay">
          <div className="hint-content">
            <h2>特別なワードガイド</h2>
            <p>・「呼び方を変えたい」で {owlName} の名前を変えられます。</p>
            <p>・「履歴を見たい」で会話履歴が表示されます。</p>
            <p>・「履歴を隠したい」で履歴を閉じます。</p>
          </div>
        </div>
      )}

      <div className="chat-container">
        <div className="character-main">
          <img
            src={
              isIdle
                ? owlFlap
                : isThinking
                ? owlThinking
                : emotionToImage[owlEmotion] || owlNeutral
            }
            alt="フクロウ"
          />
          <div className="nameplate">
            <img src={namePlate} alt="ネームプレート" />
            <div className="owl-name">{owlName}</div>
          </div>
        </div>

        {showHistory && (
          <div className="history-panel">
            {messages.map((msg, idx) => (
              <div key={idx} className={`history-message ${msg.sender}`}>
                <div className="sender-label">
                  {msg.sender === "user" ? "User" : owlName}
                </div>
                <div className="history-text">{msg.text}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

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
          placeholder={
            nicknameChangeMode ? "名付けてあげてください..." : "話しかけてあげてください..."
          }
          disabled={isThinking}
        />
        <button onClick={handleSend} disabled={isThinking}>
          送信
        </button>
      </div>
    </div>
  );
}

export default Chat;
