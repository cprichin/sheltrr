import { useState, useEffect } from "react";
import axios from "axios";
import API from "../api";

export default function ManageDogs() {
  const [dogs, setDogs] = useState([]);
  const [form, setForm] = useState({ name: "", breed: "" });
  const [msg, setMsg] = useState(null);

  const fetchDogs = () => axios.get(`${API}/dogs/`).then(r => setDogs(r.data));

  useEffect(() => { fetchDogs(); }, []);

  const handleAdd = () => {
    if (!form.name) {
      setMsg({ type: "error", text: "Name is required" });
      return;
    }
    axios.post(`${API}/dogs/`, form)
      .then(() => {
        setMsg({ type: "success", text: `${form.name} added successfully` });
        setForm({ name: "", breed: "" });
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
          <input className="input" placeholder="Breed (optional)" value={form.breed}
            onChange={e => setForm({ ...form, breed: e.target.value })} />
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>Add Dog</button>
        {msg && <p className={msg.type}>{msg.text}</p>}
      </div>

      <div className="card">
        <h2>🐕 All Dogs ({dogs.length})</h2>
        {dogs.length === 0 ? <p className="empty">No dogs registered yet</p> : (
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Breed</th><th></th></tr>
            </thead>
            <tbody>
              {dogs.map(d => (
                <tr key={d.id}>
                  <td><strong>{d.name}</strong></td>
                  <td>{d.breed || "—"}</td>
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