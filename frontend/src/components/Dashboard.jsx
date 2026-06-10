import { useEffect, useState } from "react";
import { getDashboard } from "../api";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#3b82f6", "#00c9a7", "#f59e0b", "#ef4444", "#8b5cf6", "#10b981"];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard().then((res) => {
      setData(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ color: "#94a3b8" }}>Loading dashboard...</div>;
  if (!data || data.count === 0) return <div style={{ color: "#94a3b8" }}>No expenses yet. Add some from the Chat tab!</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {[
          { label: "Total Spent", value: `₹${data.total.toLocaleString()}` },
          { label: "Average", value: `₹${data.avg}` },
          { label: "Transactions", value: data.count },
          { label: "Top Category", value: data.top_category },
        ].map((m) => (
          <div key={m.label} style={{ background: "#1e293b", borderRadius: 12, padding: "20px 24px" }}>
            <div style={{ color: "#64748b", fontSize: 13, marginBottom: 6 }}>{m.label}</div>
            <div style={{ color: "#fff", fontSize: 22, fontWeight: "bold" }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Pie Chart */}
        <div style={{ background: "#1e293b", borderRadius: 12, padding: 24 }}>
          <div style={{ color: "#fff", fontWeight: "bold", marginBottom: 16 }}>By Category</div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data.category_breakdown} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={90} label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}>
                {data.category_breakdown.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val) => `₹${val}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart */}
        <div style={{ background: "#1e293b", borderRadius: 12, padding: 24 }}>
          <div style={{ color: "#fff", fontWeight: "bold", marginBottom: 16 }}>Daily Trend</div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.daily_trend}>
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip formatter={(val) => `₹${val}`} />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}