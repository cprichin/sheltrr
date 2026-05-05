import { useState, useEffect } from "react";
import axios from "axios";
import API from "../api";

export default function WalkHistory() {
  const [walks, setWalks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/walks/history`)
      .then(r => { setWalks(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="card">
      <h2>📋 Walk History</h2>
      {loading ? (
        <p className="empty">Loading...</p>
      ) : walks.length === 0 ? (
        <p className="empty">No completed walks yet</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Dog</th>
              <th>Volunteer</th>
              <th>Location</th>
              <th>Date</th>
              <th>Start</th>
              <th>End</th>
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
                <td>{new Date(w.start_time).toLocaleDateString()}</td>
                <td>{new Date(w.start_time).toLocaleTimeString()}</td>
                <td>{w.end_time ? new Date(w.end_time).toLocaleTimeString() : "—"}</td>
                <td>{w.duration_minutes != null ? `${w.duration_minutes}m` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
