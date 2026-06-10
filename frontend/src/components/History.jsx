import { useEffect, useState } from "react";
import { getExpenses, deleteExpense } from "../api";

const PERIODS = ["All", "Today", "Week", "Month"];
const CATEGORIES = ["All", "Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Other"];

export default function History() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("All");
  const [category, setCategory] = useState("All");

  const getDateRange = (p) => {
    const today = new Date();
    const fmt = (d) => d.toISOString().split("T")[0];
    if (p === "Today") return { start: fmt(today), end: fmt(today) };
    if (p === "Week") return { start: fmt(new Date(today - 7 * 86400000)), end: null };
    if (p === "Month") return { start: fmt(new Date(today - 30 * 86400000)), end: null };
    return { start: null, end: null };
  };

  const fetchExpenses = async () => {
    setLoading(true);
    const { start, end } = getDateRange(period);
    const res = await getExpenses(start, end, category === "All" ? null : category);
    setExpenses(res.data.expenses);
    setLoading(false);
  };

  useEffect(() => { fetchExpenses(); }, [period, category]);

  const handleDelete = async (id) => {
    await deleteExpense(id);
    fetchExpenses();
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryColors = {
    Food: "#f59e0b", Transport: "#3b82f6", Shopping: "#8b5cf6",
    Bills: "#ef4444", Entertainment: "#10b981", Health: "#00c9a7", Other: "#64748b"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Filters */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {PERIODS.map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{
                background: period === p ? "#3b82f6" : "#1e293b",
                color: "#fff", border: "none", borderRadius: 8,
                padding: "8px 16px", fontSize: 13, cursor: "pointer"
              }}>
              {p}
            </button>
          ))}
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          style={{ background: "#1e293b", color: "#fff", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Total */}
      {expenses.length > 0 && (
        <div style={{ background: "#1e293b", borderRadius: 10, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#94a3b8", fontSize: 14 }}>{expenses.length} transactions</span>
          <span style={{ color: "#fff", fontWeight: "bold", fontSize: 18 }}>Total: ₹{total.toLocaleString()}</span>
        </div>
      )}

      {/* Expense List */}
      {loading ? (
        <div style={{ color: "#94a3b8" }}>Loading...</div>
      ) : expenses.length === 0 ? (
        <div style={{ color: "#94a3b8" }}>No expenses found.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {expenses.map((e) => (
            <div key={e.id} style={{
              background: "#1e293b", borderRadius: 10, padding: "14px 20px",
              display: "flex", alignItems: "center", gap: 16,
              borderLeft: `4px solid ${categoryColors[e.category] || "#64748b"}`
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#fff", fontWeight: "bold", fontSize: 15 }}>{e.description}</div>
                <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{e.date}</div>
              </div>
              <div style={{
                background: categoryColors[e.category] + "22",
                color: categoryColors[e.category] || "#64748b",
                borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: "bold"
              }}>
                {e.category}
              </div>
              <div style={{ color: "#fff", fontWeight: "bold", fontSize: 16, minWidth: 80, textAlign: "right" }}>
                ₹{e.amount.toLocaleString()}
              </div>
              <button onClick={() => handleDelete(e.id)}
                style={{ background: "#ef444422", color: "#ef4444", border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 14 }}>
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}