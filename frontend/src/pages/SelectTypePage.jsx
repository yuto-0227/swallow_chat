import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { api } from "../api";

export default function SelectTypePage({ navigate }) {
  const { token } = useContext(AuthContext);

  const handleSelect = async (type) => {
    const res = await fetch("/api/select-type/", {
      method: "POST",
      headers: api(token).headers,
      body: JSON.stringify({ dialogue_type: type })
    });
    if (res.ok) {
      navigate("/chat");
    } else {
      alert("選択に失敗しました");
    }
  };

  return (
    <div>
      <h2>対話特徴を選んでください</h2>
      <button onClick={() => handleSelect("A")}>タイプ A</button>
      <button onClick={() => handleSelect("B")}>タイプ B</button>
    </div>
  );
}
