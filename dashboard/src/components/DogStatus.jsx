import { useState, useEffect } from "react";
import axios from "axios";
import API from "../api";

const STATUS_CONFIG = {
  out:        { label: "Out Now",       bg: "#fff3e0", color: "#e65100", dot: "#e65100" },
  walked:     { label: "Walked Today",  bg: "#e8f5e9", color: "#2e7d32", dot: "#4caf50" },
  not_walked: { label: "Not Yet",       bg: "#ffebee", color: "#c62828", dot: "#ef5350" },
  empty:      { label: "Empty",         bg: "#f5f5f5", color: "#aaa",    dot: "#ccc"    },
};

export default function DogStatus() {
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [overdueMinutes, setOverdueMinutes] = useState(90);

  const fetchStatus = () => {
    axios.get(`${API}/walks/status`)
      .then(r => { setDogs(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const filtered = dogs.filter(d => filter === "all" || d.status === filter);

  const counts = {
    all: dogs.length,
    out: dogs.filter(d => d.status === "out").length,
    walked: dogs.filter(d => d.status === "walked").length,
    not_walked: dogs.filter(d => d.status === "not_walked").length,
  };

  const overdue = dogs.filter(d =>
    d.status === "out" && d.duration_minutes >= overdueMinutes
  );

  return (
    <div>
      {overdue.length > 0 && (
        <div style={{
          background: "#c62828", color: "white", borderRadius: 12,
          padding: "14px 20px", marginBottom: 16, fontWeight: 600, fontSize: "0.95rem"
        }}>
          ⚠️ {overdue.length} dog{overdue.length > 1 ? "s have" : " has"} been out
          over {overdueMinutes} minutes: {overdue.map(d => d.name).join(", ")}
        </div>
      )}

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <h2 style={{ margin: 0 }}>🐕 Dog Status Board</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "#555" }}>
            <label>Overdue after</label>
            <input
              type="number"
              value={overdueMinutes}
              onChange={e => setOverdueMinutes(Number(e.target.value))}
              style={{ width: 56, padding: "4px 8px", borderRadius: 6, border: "2px solid #e2e8f0", fontSize: "0.9rem" }}
            />
            <label>min</label>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {[
            { key: "all",        label: `All (${counts.all})` },
            { key: "out",        label: `Out Now (${counts.out})` },
            { key: "walked",     label: `Walked (${counts.walked})` },
            { key: "not_walked", label: `Not Yet (${counts.not_walked})` },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)} style={{
              padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
              fontSize: "0.85rem", fontWeight: 600,
              background: filter === key ? "#1F4E79" : "#f0f4f8",
              color: filter === key ? "white" : "#555",
              transition: "all 0.2s"
            }}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="empty">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="empty">No dogs in this category</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {filtered.map((dog, idx) => {
              const cfg = STATUS_CONFIG[dog.status] || STATUS_CONFIG.not_walked;
              const isOverdue = dog.status === "out" && dog.duration_minutes >= overdueMinutes;
              return (
                <div key={dog.id || idx} style={{
                  background: isOverdue ? "#ffebee" : cfg.bg,
                  border: `2px solid ${isOverdue ? "#c62828" : cfg.dot}`,
                  borderRadius: 12,
                  padding: "14px 16px",
                  transition: "all 0.2s"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "1rem", color: "#1a1a1a" }}>{dog.name}</div>
                      {dog.breed && <div style={{ fontSize: "0.78rem", color: "#888" }}>{dog.breed}</div>}
                    </div>
                    <span style={{
                      background: isOverdue ? "#c62828" : cfg.dot,
                      color: "white", borderRadius: 20, padding: "3px 9px",
                      fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap"
                    }}>
                      {isOverdue ? "OVERDUE" : cfg.label}
                    </span>
                  </div>

                  {dog.cage_number && (
                    <div style={{ fontSize: "0.8rem", color: "#555", marginBottom: 4 }}>
                      Cage {dog.cage_number} · {dog.location === "indoor" ? "Indoor" : "Outdoor"}
                    </div>
                  )}

                  {dog.status === "out" && (
                    <div style={{ fontSize: "0.82rem", color: cfg.color, fontWeight: 600 }}>
                      {dog.volunteer_name} · {dog.duration_minutes}m
                      {dog.walk_location && (
                        <span style={{ marginLeft: 6, background: "#e3f2fd", color: "#1565c0", padding: "2px 8px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600 }}>
                          {dog.walk_location}
                        </span>
                      )}
                    </div>
                  )}

                  {dog.status === "walked" && (
                    <div style={{ fontSize: "0.82rem", color: cfg.color }}>
                      {dog.volunteer_name} · {dog.duration_minutes}m
                    </div>
                  )}

                  {dog.status === "not_walked" && (
                    <div style={{ fontSize: "0.82rem", color: cfg.color, fontWeight: 600 }}>
                      Needs a walk
                    </div>
                  )}

                  {dog.status === "empty" && (
                    <div style={{ fontSize: "0.82rem", color: cfg.color }}>
                      No dog assigned
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p style={{ fontSize: "0.8rem", color: "#aaa", marginTop: 16 }}>
          Auto-refreshes every 15 seconds
        </p>
      </div>
    </div>
  );
}
