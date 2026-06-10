import { useEffect, useState } from "react";
import { getInsights } from "../api";

export default function Insights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInsights().then((res) => {
      setData(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ color: "#94a3b8" }}>Loading insights...</div>;

  if (data?.message) return (
    <div style={{ background: "#1e293b", borderRadius: 12, padding: 24, color: "#94a3b8" }}>
      ⚠️ {data.message}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Prediction */}
      <div style={{ background: "#1e293b", borderRadius: 12, padding: 24 }}>
        <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 8 }}>🔮 Next Month Prediction</div>
        <div style={{ color: "#00c9a7", fontSize: 36, fontWeight: "bold" }}>
          ₹{data.prediction?.toLocaleString()}
        </div>
        <div style={{ color: "#64748b", fontSize: 12, marginTop: 6 }}>
          Based on Linear Regression model on your spending history
        </div>
      </div>

      {/* Anomalies */}
      <div style={{ background: "#1e293b", borderRadius: 12, padding: 24 }}>
        <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 16 }}>🚨 Anomaly Detection</div>
        {data.anomalies?.length === 0 ? (
          <div style={{ color: "#10b981", fontSize: 15 }}>✅ No unusual transactions detected</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.anomalies.map((a, i) => (
              <div key={i} style={{
                background: "#ef444411", border: "1px solid #ef444433",
                borderRadius: 8, padding: "12px 16px",
                display: "flex", justifyContent: "space-between", alignItems: "center"
              }}>
                <div>
                  <div style={{ color: "#ef4444", fontWeight: "bold", fontSize: 14 }}>⚠️ {a.description}</div>
                  <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{a.category}</div>
                </div>
                <div style={{ color: "#ef4444", fontWeight: "bold", fontSize: 16 }}>
                  ₹{a.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Card */}
      <div style={{ background: "#1e293b", borderRadius: 12, padding: 24 }}>
        <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 12 }}>📊 How It Works</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { title: "Linear Regression", desc: "Predicts next month's spending based on your daily spending trend" },
            { title: "Z-Score Anomaly Detection", desc: "Flags transactions more than 2 standard deviations from your category average" },
            { title: "TF-IDF Categorization", desc: "Automatically categorizes new expenses based on description similarity" },
          ].map((item) => (
            <div key={item.title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", marginTop: 5, flexShrink: 0 }} />
              <div>
                <span style={{ color: "#fff", fontWeight: "bold", fontSize: 13 }}>{item.title}: </span>
                <span style={{ color: "#64748b", fontSize: 13 }}>{item.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}