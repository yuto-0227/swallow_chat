import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post("http://localhost:8000/api/accounts/login/", {
        username,
        password,
      });
  
      if (response.status === 200) {
        localStorage.setItem("token", response.data.access);
        onLogin(); // ログイン状態を更新
  
        // 🔽 ログイン後にfirst_login_doneを取得して遷移先を決定
        const profileRes = await axios.get("http://localhost:8000/api/accounts/profile/", {
          headers: {
            Authorization: `Bearer ${response.data.access}`,
          },
        });
  
        const firstLoginDone = profileRes.data.first_login_done;
        if (!firstLoginDone) {
          navigate("/select-type");
        } else {
          navigate("/chat");
        }
      }
    } catch (err) {
      setError("ログインに失敗しました。ユーザー名またはパスワードが違います。");
    }
  };
  
  

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>ログイン</h2>
      <input
        type="text"
        placeholder="ユーザー名"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ padding: "0.5rem", fontSize: "1rem", width: "200px", marginBottom: "0.5rem" }}
      />
      <br />
      <input
        type="password"
        placeholder="パスワード"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ padding: "0.5rem", fontSize: "1rem", width: "200px" }}
      />
      <br />
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button
        onClick={handleLogin}
        style={{ marginTop: "1rem", padding: "0.5rem 1rem", fontSize: "1rem" }}
      >
        ログイン
      </button>
    </div>
  );
}

export default Login;
