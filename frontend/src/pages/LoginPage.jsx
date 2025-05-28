import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";

export default function LoginPage({ navigate }) {
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      login(data.token);
      navigate("/"); // Appで判定される
    } else {
      alert("ログイン失敗");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
		value={username}
		onChange={e => setUsername(e.target.value)}
		placeholder="Username"
		/>
		<input
		value={password}
		onChange={e => setPassword(e.target.value)}
		type="password"
		placeholder="Password"
		/>
      <button type="submit">ログイン</button>
    </form>
  );
}
