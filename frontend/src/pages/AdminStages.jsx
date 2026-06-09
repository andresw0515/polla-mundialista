import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function AdminStages() {
  const [list, setList] = useState([]);
  const [err, ser] = useState(""); const [ok, sok] = useState("");
  const load = () => api.getAdminStages().then(setList).catch(() => {});
  useEffect(() => { load(); }, []);
  const toggle = async (name) => {
    ser(""); sok("");
    try { await api.toggleStage(name); sok("Actualizada"); load(); } catch (e) { ser(e.message); }
  };
  return (
    <div>
      <h2 className="mb-3">Fases</h2>
      {err && <div className="error">{err}</div>}
      {ok && <div className="success">{ok}</div>}
      <div className="card" style={{ padding: 0, overflow: "auto" }}>
        <table>
          <thead><tr><th>Fase</th><th>Cierra</th><th>Estado</th><th>Acción</th></tr></thead>
          <tbody>{list.map(s => (
            <tr key={s.name}>
              <td style={{ fontWeight: 600 }}>{s.name}</td>
              <td className="text-muted">{s.closesAt || "-"}</td>
              <td><span className={`badge ${s.isActive ? "badge-paid" : "badge-unpaid"}`}>{s.isActive ? "Activa" : "Inactiva"}</span></td>
              <td><button className={`btn btn-sm ${s.isActive ? "btn-danger" : "btn-primary"}`} onClick={() => toggle(s.name)}>{s.isActive ? "Desactivar" : "Activar"}</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
