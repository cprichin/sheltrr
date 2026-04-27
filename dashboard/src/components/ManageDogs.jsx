import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:8000/api";

export default function ManageDogs() {
  const [dogs, setDogs] = useState([]);
  const [form, setForm] = useState({ name: "", breed: "", cage_number: "", nfc_tag_uid: "", location: "indoor" });
  const [msg, setMsg] = useState(null);

  const fetchDogs = () => axios.get(`${API}/dogs/`).then(r => setDogs(r.data));

  useEffect(() => { fetchDogs(); }, []);

  const handleAdd = () => {
    if (!form.name || !form.nfc_tag_uid) {
      setMsg({ type: "error", text: "Name and NFC Tag UID are required" });
      return;
    }
    axios.post(`${API}/dogs/`, form)
      .then(() => {
        setMsg({ type: "success", text: `${form.name} added successfully` });
        setForm({ name: "", breed: "", cage_number: "", nfc_tag_uid: "", location: "indoor" });
        fetchDogs();
      })
      .catch(e => setMsg({ type: "error", text: e.response?.data?.detail || "Error adding dog" }));
  };

  const handleDelete = (id, name) => {
    if (!window.confirm(`Remove ${name}?`)) return;
    axios.delete(`${API}/dogs/${id}`).then(() => fetchDogs());
  };

  return (
    <div>
      <div className="card">
        <h2>➕ Add Dog</h2>
        <div className="form-row">
          <input className="input" placeholder="Name *" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="Breed" value={form.breed}
            onChange={e => setForm({ ...form, breed: e.target.value })} />
        </div>
        <div className="form-row">
          <input className="input" placeholder="Cage Number" value={form.cage_number}
            onChange={e => setForm({ ...form, cage_number: e.target.value })} />
          <input className="input" placeholder="NFC Tag UID *" value={form.nfc_tag_uid}
            onChange={e => setForm({ ...form, nfc_tag_uid: e.target.value.toUpperCase() })} />
        </div>
        <div className="form-row">
          <select className="input" value={form.location}
            onChange={e => setForm({ ...form, location: e.target.value })}>
            <option value="indoor">Indoor</option>
            <option value="outdoor">Outdoor Run</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>Add Dog</button>
        {msg && <p className={msg.type}>{msg.text}</p>}
      </div>

      <div className="card">
        <h2>🐕 All Dogs ({dogs.length})</h2>
        {dogs.length === 0 ? <p className="empty">No dogs registered yet</p> : (
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Breed</th><th>Cage</th><th>Location</th><th>NFC UID</th><th></th></tr>
            </thead>
            <tbody>
              {dogs.map(d => (
                <tr key={d.id}>
                  <td><strong>{d.name}</strong></td>
                  <td>{d.breed || "—"}</td>
                  <td>{d.cage_number || "—"}</td>
                  <td>{d.location}</td>
                  <td style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>{d.nfc_tag_uid}</td>
                  <td>
                    <button className="btn btn-danger" onClick={() => handleDelete(d.id, d.name)}>
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