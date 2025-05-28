import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { api } from "../api";

export default function ChatPage() {
  const { token } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    fetch("/api/dialogue/logs/", { headers: api(token).headers })
      .then(res => res.json())
      .then(setLogs);
  }, [token]);

  const handleSend = async () => {
    const fakeReply = `AI: ${input}`;  // 仮の出力。後ほどAIと連携
    await fetch("/api/dialogue/logs/", {
      method: "POST",
      headers: api(token).headers,
      body: JSON.stringify({ input_text: input, output_text: fakeReply })
    });
    setLogs([{ input_text: input, output_text: fakeReply }, ...logs]);
    setInput("");
  };

  return (
    <div>
      <div>
        {logs.map((log, idx) => (
          <div key={idx}>
            <p><b>You:</b> {log.input_text}</p>
            <p><b>AI:</b> {log.output_text}</p>
          </div>
        ))}
      </div>
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={handleSend}>送信</button>
    </div>
  );
}
