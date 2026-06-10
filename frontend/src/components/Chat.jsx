import { useState } from "react";
import { sendMessage } from "../api";

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! I'm your expense assistant. Add expenses like 'spent 500 on lunch' or ask me anything about your spending!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState("smart_bot");

  const quickQuestions = [
    "How much this week?",
    "Show food expenses",
    "Biggest expense?",
    "How much this month?",
  ];

  const send = async (text) => {
    const message = text || input;
    if (!message.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text: message }]);
    setInput("");
    setLoading(true);

    try {
      const res = await sendMessage(message, apiKey, provider);
      setMessages((prev) => [...prev, { role: "bot", text: res.data.response }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "bot", text: "Something went wrong. Is the backend running?" }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* AI Settings */}
      <div style={{ background: "#1e293b", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
        <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 8 }}>⚙️ AI Settings</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            style={{ background: "#0f172a", color: "#fff", border: "1px solid #334155", borderRadius: 6, padding: "6px 10px", fontSize: 13 }}
          >
            <option value="smart_bot">Smart Bot (No API)</option>
            <option value="groq">Groq (Free)</option>
            <option value="openai">GPT (OpenAI)</option>
          </select>
          {provider !== "smart_bot" && (
            <input
              type="password"
              placeholder="Enter API key..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{ background: "#0f172a", color: "#fff", border: "1px solid #334155", borderRadius: 6, padding: "6px 10px", fontSize: 13, flex: 1, minWidth: 200 }}
            />
          )}
          <span style={{ color: provider === "smart_bot" ? "#00c9a7" : "#3b82f6", fontSize: 12 }}>
            {provider === "smart_bot" ? "✅ Smart Bot Active" : "🤖 LLM Active"}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, marginBottom: 16, maxHeight: "50vh" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              background: msg.role === "user" ? "#3b82f6" : "#1e293b",
              color: "#fff",
              borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              padding: "10px 16px",
              maxWidth: "70%",
              fontSize: 14,
              lineHeight: 1.5,
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ background: "#1e293b", color: "#94a3b8", borderRadius: "18px 18px 18px 4px", padding: "10px 16px", fontSize: 14 }}>
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Quick Questions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {quickQuestions.map((q) => (
          <button key={q} onClick={() => send(q)}
            style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 20, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask anything or add expense (e.g. spent 500 on lunch)..."
          style={{ flex: 1, background: "#1e293b", color: "#fff", border: "1px solid #334155", borderRadius: 10, padding: "12px 16px", fontSize: 14, outline: "none" }}
        />
        <button onClick={() => send()}
          style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 14, cursor: "pointer", fontWeight: "bold" }}>
          Send
        </button>
      </div>
    </div>
  );
}