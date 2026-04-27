import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:8000/api";

export default function ManageVolunteers() {
  const [volunteers, setVolunteers] = useState([]);
  const [form, setForm] = useState({ name: "", nfc_fob_uid: "" });
  const [msg, setMsg] = useState(null);

  const fetchVolunteers = () => axios.get(`${API}/volunteers/`).then(r => setVolunteers(r.data));

  useEffect(() => { fetchVolunteers(); }, []);

  const handleAdd = () => {
    if (!form.name || !form.nfc_fob_uid) {
      setMsg({ type: "error", text: "Name and Fob UID are required" });
      return;
    }
    axios.post(`${API}/volunteers/`, form)
      .then(() => {
        setMsg({ type: "success", text: `${form.name} added successfully` });
        setForm({ name: "", nfc_fob_uid: "" });
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
          <input className="input" placeholder="Fob UID *" value={form.nfc_fob_uid}
            onChange={e => setForm({ ...form, nfc_fob_uid: e.target.value.toUpperCase() })} />
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>Add Volunteer</button>
        {msg && <p className={msg.type}>{msg.text}</p>}
      </div>

      <div className="card">
        <h2>👥 All Volunteers ({volunteers.length})</h2>
        {volunteers.length === 0 ? <p className="empty">No volunteers registered yet</p> : (
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Fob UID</th><th></th></tr>
            </thead>
            <tbody>
              {volunteers.map(v => (
                <tr key={v.id}>
                  <td><strong>{v.name}</strong></td>
                  <td style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>{v.nfc_fob_uid}</td>
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