import { useState, useEffect } from "react";
import axios from "axios";
import API from "../api";

export default function ManageVolunteers() {
  const [volunteers, setVolunteers] = useState([]);
  const [form, setForm] = useState({ name: "", pin: "" });
  const [msg, setMsg] = useState(null);

  const fetchVolunteers = () => axios.get(`${API}/volunteers/`).then(r => setVolunteers(r.data));

  useEffect(() => { fetchVolunteers(); }, []);

  const handleAdd = () => {
    if (!form.name || !form.pin) {
      setMsg({ type: "error", text: "Name and PIN are required" });
      return;
    }
    if (form.pin.length !== 4 || !/^\d{4}$/.test(form.pin)) {
      setMsg({ type: "error", text: "PIN must be exactly 4 digits" });
      return;
    }
    axios.post(`${API}/volunteers/`, form)
      .then(() => {
        setMsg({ type: "success", text: `${form.name} added successfully` });
        setForm({ name: "", pin: "" });
        fetchVolunteers();
      })
      .catch(e => setMsg({ type: "error", text: e.response?.data?.detail || "Error adding volunteer" }));
  };

  const handleDelete = (id, name) => {
    if (!window.confirm(`Remove ${name}?`)) return;
    axios.delete(`${API}/volunteers/${id}`).then(() => fetchVolunteers());
  };

  return (
    <div>
      <div className="card">
        <h2>➕ Add Volunteer</h2>
        <div className="form-row">
          <input className="input" placeholder="Full Name *" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="4-digit PIN *" type="password"
            maxLength={4} inputMode="numeric" value={form.pin}
            onChange={e => setForm({ ...form, pin: e.target.value.replace(/\D/g, "") })} />
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>Add Volunteer</button>
        {msg && <p className={msg.type}>{msg.text}</p>}
      </div>

      <div className="card">
        <h2>👥 All Volunteers ({volunteers.length})</h2>
        {volunteers.length === 0 ? <p className="empty">No volunteers registered yet</p> : (
          <table className="table">
            <thead>
              <tr><th>Name</th><th>PIN</th><th></th></tr>
            </thead>
            <tbody>
              {volunteers.map(v => (
                <tr key={v.id}>
                  <td><strong>{v.name}</strong></td>
                  <td>
                    <span style={{ background: v.has_pin ? "#e8f5e9" : "#ffebee", color: v.has_pin ? "#2e7d32" : "#c62828", padding: "3px 10px", borderRadius: 20, fontSize: "0.8rem", fontWeight: 600 }}>
                      {v.has_pin ? "PIN set" : "No PIN"}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-danger" onClick={() => handleDelete(v.id, v.name)}>
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
