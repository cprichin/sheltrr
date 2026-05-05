import { useState, useEffect } from "react";
import axios from "axios";
import API from "../api";

export default function ManageLocations() {
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({ name: "" });
  const [msg, setMsg] = useState(null);

  const fetchLocations = () => axios.get(`${API}/locations/`).then(r => setLocations(r.data));

  useEffect(() => { fetchLocations(); }, []);

  const handleAdd = () => {
    if (!form.name) {
      setMsg({ type: "error", text: "Location name is required" });
      return;
    }
    axios.post(`${API}/locations/`, form)
      .then(() => {
        setMsg({ type: "success", text: `${form.name} added` });
        setForm({ name: "" });
        fetchLocations();
      })
      .catch(e => setMsg({ type: "error", text: e.response?.data?.detail || "Error adding location" }));
  };

  const handleDelete = (id, name) => {
    if (!window.confirm(`Remove ${name}?`)) return;
    axios.delete(`${API}/locations/${id}`).then(() => fetchLocations());
  };

  return (
    <div>
      <div className="card">
        <h2>➕ Add Location</h2>
        <div className="form-row">
          <input className="input" placeholder="Location name (e.g. Outdoor Run, Off-Site)" value={form.name}
            onChange={e => setForm({ name: e.target.value })}
            onKeyDown={e => e.key === "Enter" && handleAdd()} />
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>Add Location</button>
        {msg && <p className={msg.type}>{msg.text}</p>}
      </div>

      <div className="card">
        <h2>📍 Walk Locations ({locations.length})</h2>
        <p style={{ fontSize: "0.85rem", color: "#888", marginBottom: 12 }}>
          These locations appear as options when volunteers check out a dog.
        </p>
        {locations.length === 0 ? <p className="empty">No locations added yet</p> : (
          <table className="table">
            <thead>
              <tr><th>Location</th><th></th></tr>
            </thead>
            <tbody>
              {locations.map(l => (
                <tr key={l.id}>
                  <td>
                    <span style={{ background: "#e3f2fd", color: "#1565c0", padding: "4px 12px", borderRadius: 20, fontSize: "0.85rem", fontWeight: 600 }}>
                      📍 {l.name}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-danger" onClick={() => handleDelete(l.id, l.name)}>
                      Remove
                    </button>
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
