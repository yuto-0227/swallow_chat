import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";  // 共通Axiosインスタンスを使う

function SelectType() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("ログインが必要です。");
      navigate("/login");
    }
  }, [navigate]);

  const handleSelect = async (type) => {
    try {
      await api.post("/dialogue/select-type/", { type });  // api.jsを通じてリクエスト
      navigate("/chat");
    } catch (error) {
      console.error("選択に失敗しました", error.response || error);
      alert("エラーが発生しました。再試行してください。");
    }
  };

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>対話特徴を選んでください</h2>
      <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginTop: "1rem" }}>
        <button
          onClick={() => handleSelect("A")}
          style={{ padding: "1rem 2rem", fontSize: "1.5rem" }}
        >
          A
        </button>
        <button
          onClick={() => handleSelect("B")}
          style={{ padding: "1rem 2rem", fontSize: "1.5rem" }}
        >
          B
        </button>
      </div>
    </div>
  );
}

export default SelectType;
