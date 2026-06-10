import { useState } from "react";
import Chat from "./components/Chat";
import Dashboard from "./components/Dashboard";
import History from "./components/History";
import Insights from "./components/Insights";

const tabs = [
  { id: "chat", label: "💬 Chat" },
  { id: "dashboard", label: "📊 Dashboard" },
  { id: "history", label: "📜 History" },
  { id: "insights", label: "📈 Insights" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("chat");

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#fff", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#1e293b", borderBottom: "1px solid #334155", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>💰</span>
          <div>
            <div style={{ fontWeight: "bold", fontSize: 18 }}>AI Expense Tracker</div>
            <div style={{ color: "#64748b", fontSize: 12 }}>Smart Personal Finance Assistant</div>
          </div>
        </div>
        <div style={{ color: "#00c9a7", fontSize: 13, background: "#00c9a711", padding: "6px 14px", borderRadius: 20, border: "1px solid #00c9a733" }}>
          ● Live
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: "#1e293b", borderBottom: "1px solid #334155", padding: "0 32px", display: "flex", gap: 4 }}>
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              background: "none", border: "none", color: activeTab === tab.id ? "#3b82f6" : "#64748b",
              borderBottom: activeTab === tab.id ? "2px solid #3b82f6" : "2px solid transparent",
              padding: "16px 20px", fontSize: 14, cursor: "pointer", fontWeight: activeTab === tab.id ? "bold" : "normal",
              transition: "all 0.2s"
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        {activeTab === "chat" && <Chat />}
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "history" && <History />}
        {activeTab === "insights" && <Insights />}
      </div>
    </div>
  );
}