import { useState, useEffect } from "react";
import axios from "axios";
import API from "../api";

export default function ActiveWalks() {
  const [walks, setWalks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWalks = () => {
    axios.get(`${API}/walks/active`)
      .then(r => { setWalks(r.data); setLoading(false); })
      .catch(() => { setWalks([]); setLoading(false); });
  };

  useEffect(() => {
    fetchWalks();
    const interval = setInterval(fetchWalks, 15000);
    return () => clearInterval(interval);
  }, []);

  const duration = (start) => {
    const mins = Math.floor((new Date() - new Date(start)) / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <div className="card">
      <h2>🦮 Active Walks ({walks.length})</h2>
      {loading ? (
        <p className="empty">Loading...</p>
      ) : walks.length === 0 ? (
        <p className="empty">No dogs currently out</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Dog</th>
              <th>Volunteer</th>
              <th>Location</th>
              <th>Out Since</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {walks.map(w => (
              <tr key={w.id}>
                <td><strong>{w.dog_name}</strong></td>
                <td>{w.volunteer_name}</td>
                <td>
                  <span style={{ background: "#e3f2fd", color: "#1565c0", padding: "3px 10px", borderRadius: 20, fontSize: "0.8rem", fontWeight: 600 }}>
                    {w.location || "—"}
                  </span>
                </td>
                <td>{new Date(w.start_time).toLocaleTimeString()}</td>
                <td>{duration(w.start_time)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p style={{ fontSize: "0.8rem", color: "#aaa", marginTop: "12px" }}>
        Auto-refreshes every 15 seconds
      </p>
    </div>
  );
}
