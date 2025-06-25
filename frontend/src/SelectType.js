import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

function SelectType() {
  const [step, setStep] = useState("select");
  const [scores, setScores] = useState(Array(16).fill(0));  // 16問に拡張
  const navigate = useNavigate();

  const handleSelect = async (mode) => {
    if (mode === "quick") {
      await api.post("/dialogue/select-entry-mode/", {
        entry_mode: "quick",
        personality: "neutral",
      });
      navigate("/chat");
    } else {
      setStep("survey");
    }
  };

  const handleScoreChange = (index, value) => {
    const newScores = [...scores];
    newScores[index] = parseInt(value, 10);
    setScores(newScores);
  };

  const handleSubmitSurvey = async () => {
    const reversedIndices = [0, 4, 7, 10, 12, 14];

    if (scores.some((v) => v === 0)) {
      alert("すべての質問に回答してください。");
      return;
    }

    const totalScore = scores.reduce((acc, val, i) => {
      const adjusted = reversedIndices.includes(i) ? 8 - val : val;
      return acc + adjusted;
    }, 0);

    let personality = totalScore >= 47 ? "talkative" : "calm";

    try {
      await api.post("/dialogue/select-entry-mode/", {
        entry_mode: "survey",
        personality: personality,
      });
      navigate("/chat");
    } catch (error) {
      console.error("送信エラー:", error);
      alert("送信に失敗しました。");
    }
  };

  const questions = [
    "私は新しい友人がすぐできる",
    "私は人がいる所では気おくれしてしまう",
    "私は引っ込み思案である",
    "私は人の集まるところではいつも、後ろの方に引っ込んでいる",
    "私は人と広くつきあうのが好きである",
    "私は他人の前では、気が散って考えがまとまらない",
    "私は内気である",
    "私は誰とでもよく話す",
    "私は自分から進んで友達を作ることが少ない",
    "私ははにかみやである",
    "私は初めての場面でも、すぐにうちとけられる",
    "私は人前に出ると気が動転してしまう",
    "私は自分から話し始める方である",
    "私は人目に立つようなことは好まない",
    "私は知らない人とでも平気で話ができる",
    "私は人前で話すのは気がひける",
  ];

  const options = [
    "非常に当てはまる",
    "かなり当てはまる",
    "やや当てはまる",
    "どちらとも言えない",
    "やや当てはまらない",
    "ほとんど当てはまらない",
    "全く当てはまらない",
  ];

  if (step === "select") {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>開始方法を選んでください</h2>
        <button onClick={() => handleSelect("survey")}>
          診断あり
        </button>
        <button onClick={() => handleSelect("quick")}>
          診断なし
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h2>アンケートにご回答ください</h2>
      {questions.map((question, i) => (
        <div key={i} style={{ marginBottom: "1.5rem" }}>
          <p>{`Q${i + 1}. ${question}`}</p>
          {options.map((label, val) => (
            <label key={val} style={{ display: "block", marginLeft: "1rem" }}>
              <input
                type="radio"
                name={`q${i}`}
                value={val + 1}
                checked={scores[i] === val + 1}
                onChange={(e) => handleScoreChange(i, e.target.value)}
              />
              {label}
            </label>
          ))}
        </div>
      ))}
      <button onClick={handleSubmitSurvey} style={{ marginTop: "2rem" }}>
        回答を送信する
      </button>
    </div>
  );
}

export default SelectType;