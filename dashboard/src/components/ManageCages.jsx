import { useState, useEffect } from "react";
import axios from "axios";
import API from "../api";

export default function ManageCages() {
  const [cages, setCages] = useState([]);
  const [dogs, setDogs] = useState([]);
  const [form, setForm] = useState({ cage_number: "", nfc_tag_uid: "", location: "indoor" });
  const [msg, setMsg] = useState(null);

  const fetchCages = () => axios.get(`${API}/cages/`).then(r => setCages(r.data));
  const fetchDogs = () => axios.get(`${API}/dogs/`).then(r => setDogs(r.data));

  useEffect(() => { fetchCages(); fetchDogs(); }, []);

  const handleAdd = () => {
    if (!form.cage_number || !form.nfc_tag_uid) {
      setMsg({ type: "error", text: "Cage number and NFC tag UID are required" });
      return;
    }
    axios.post(`${API}/cages/`, form)
      .then(() => {
        setMsg({ type: "success", text: `Cage ${form.cage_number} added` });
        setForm({ cage_number: "", nfc_tag_uid: "", location: "indoor" });
        fetchCages();
      })
      .catch(e => setMsg({ type: "error", text: e.response?.data?.detail || "Error adding cage" }));
  };

  const handleAssign = (cageId, dogId) => {
    axios.put(`${API}/cages/${cageId}/assign`, { dog_id: dogId ? parseInt(dogId) : null })
      .then(() => fetchCages())
      .catch(e => alert(e.response?.data?.detail || "Error assigning dog"));
  };

  const handleDelete = (id, number) => {
    if (!window.confirm(`Remove cage ${number}?`)) return;
    axios.delete(`${API}/cages/${id}`).then(() => fetchCages());
  };

  return (
    <div>
      <div className="card">
        <h2>➕ Add Cage</h2>
        <div className="form-row">
          <input className="input" placeholder="Cage number *" value={form.cage_number}
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
        <button className="btn btn-primary" onClick={handleAdd}>Add Cage</button>
        {msg && <p className={msg.type}>{msg.text}</p>}
      </div>

      <div className="card">
        <h2>🏠 All Cages ({cages.length})</h2>
        {cages.length === 0 ? <p className="empty">No cages registered yet</p> : (
          <table className="table">
            <thead>
              <tr>
                <th>Cage</th>
                <th>Location</th>
                <th>NFC UID</th>
                <th>Current Dog</th>
                <th>Assign Dog</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cages.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.cage_number}</strong></td>
                  <td style={{ textTransform: "capitalize" }}>{c.location}</td>
                  <td style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>{c.nfc_tag_uid}</td>
                  <td>
                    {c.current_dog_name
                      ? <span style={{ background: "#e8f5e9", color: "#2e7d32", padding: "3px 10px", borderRadius: 20, fontSize: "0.82rem", fontWeight: 600 }}>{c.current_dog_name}</span>
                      : <span style={{ color: "#aaa", fontSize: "0.82rem" }}>Empty</span>
                    }
                  </td>
                  <td>
                    <select
                      style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: "0.85rem" }}
                      value={c.current_dog_id || ""}
                      onChange={e => handleAssign(c.id, e.target.value || null)}
                    >
                      <option value="">— Unassigned —</option>
                      {dogs.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button className="btn btn-danger" onClick={() => handleDelete(c.id, c.cage_number)}>
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