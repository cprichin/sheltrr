import { useState, useEffect } from "react";
import axios from "axios";
import API from "../api";

export default function DailySummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const fetchSummary = (date) => {
    setLoading(true);
    axios.get(`${API}/walks/summary?date=${date}`)
      .then(r => { setSummary(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchSummary(selectedDate); }, [selectedDate]);

  const exportCSV = () => {
    if (!summary) return;

    const headers = ["Dog", "Breed", "Cage", "Location", "Walks", "Total Minutes", "Volunteers"];
    const rows = summary.dogs.map(d => [
      d.dog_name,
      d.breed || "",
      d.cage_number || "",
      d.location,
      d.walk_count,
      d.total_minutes,
      d.volunteers.join("; ")
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sheltrr-summary-${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Date picker + export */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <h2 style={{ margin: 0 }}>📋 Daily Walk Summary</h2>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 8, border: "2px solid #e2e8f0", fontSize: "0.95rem" }}
            />
            <button className="btn btn-primary" onClick={exportCSV} disabled={!summary}>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      {!loading && summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
          {[
            { label: "Total Dogs",    value: summary.total_dogs,      bg: "#D6E4F0", color: "#1F4E79" },
            { label: "Walked Today",  value: summary.walked_today,    bg: "#E8F5E9", color: "#2E7D32" },
            { label: "Not Yet Walked", value: summary.not_walked_today, bg: "#FFEBEE", color: "#C62828" },
          ].map(({ label, value, bg, color }) => (
            <div key={label} style={{ background: bg, borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ fontSize: "2rem", fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: "0.85rem", color, fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Dog breakdown */}
      <div className="card">
        {loading ? (
          <p className="empty">Loading...</p>
        ) : !summary || summary.dogs.length === 0 ? (
          <p className="empty">No dogs registered</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Dog</th>
                <th>Cage</th>
                <th>Location</th>
                <th>Walks</th>
                <th>Total Time</th>
                <th>Walked By</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {summary.dogs.map(d => (
                <tr key={d.dog_id}>
                  <td>
                    <strong>{d.dog_name}</strong>
                    {d.breed && <div style={{ fontSize: "0.78rem", color: "#888" }}>{d.breed}</div>}
                  </td>
                  <td>{d.cage_number || "—"}</td>
                  <td style={{ textTransform: "capitalize" }}>{d.location}</td>
                  <td>{d.walk_count}</td>
                  <td>{d.total_minutes > 0 ? `${d.total_minutes}m` : "—"}</td>
                  <td style={{ fontSize: "0.85rem" }}>
                    {d.volunteers.length > 0 ? d.volunteers.join(", ") : "—"}
                  </td>
                  <td>
                    <span style={{
                      background: d.walked ? "#E8F5E9" : "#FFEBEE",
                      color: d.walked ? "#2E7D32" : "#C62828",
                      padding: "3px 10px", borderRadius: 20,
                      fontSize: "0.78rem", fontWeight: 700
                    }}>
                      {d.walked ? "Walked" : "Not Walked"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}