import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function AdminParticipants() {
  const [list, setList] = useState([]);
  const [n, sn] = useState(""); const [ph, sph] = useState(""); const [e, se] = useState(""); const [p, sp] = useState("");
  const [err, ser] = useState(""); const [ok, sok] = useState("");
  const [modal, setModal] = useState(null);
  const [preds, setPreds] = useState([]);
  const load = () => api.getParticipants().then(setList).catch(() => {});
  useEffect(() => { load(); }, []);
  const create = async (ev) => {
    ev.preventDefault(); ser(""); sok("");
    try { await api.createParticipant(n, ph, e, p); sok("Creado"); sn(""); sph(""); se(""); sp(""); load(); } catch (er) { ser(er.message); }
  };
  const viewPreds = async (u) => {
    try { const d = await api.getParticipantPredictions(u.id); setModal(d.user); setPreds(d.predictions); } catch (er) { ser(er.message); }
  };
  return (
    <div>
      <h2 className="mb-3">Participantes</h2>
      {err && <div className="error">{err}</div>}
      {ok && <div className="success">{ok}</div>}
      <div className="card mb-3">
        <h3 className="mb-2">Crear Participante</h3>
        <form onSubmit={create} className="flex" style={{ flexWrap: "wrap" }}>
          <input placeholder="Nombre" value={n} onChange={v => sn(v.target.value)} required />
          <input placeholder="Teléfono" value={ph} onChange={v => sph(v.target.value)} />
          <input type="email" placeholder="Email" value={e} onChange={v => se(v.target.value)} required />
          <input type="password" placeholder="Contraseña" value={p} onChange={v => sp(v.target.value)} required />
          <button className="btn btn-primary">Crear</button>
        </form>
      </div>
      <div className="card" style={{ padding: 0, overflow: "auto" }}>
        <table>
          <thead><tr><th>Nombre</th><th>Email</th><th>Pagó</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>{list.map(x => (
            <tr key={x.id}>
              <td>{x.name}</td><td>{x.email}</td>
              <td><span className={`badge ${x.hasPaid ? "badge-paid" : "badge-unpaid"}`}>{x.hasPaid ? "Pagó" : "No pagó"}</span></td>
              <td><span className={`badge ${x.isActive ? "badge-active" : "badge-inactive"}`}>{x.isActive ? "Activo" : "Bloqueado"}</span></td>
              <td><div className="flex">
                <button className="btn btn-sm btn-primary" onClick={async () => { await api.togglePay(x.id); load(); }}>{x.hasPaid ? "No pagó" : "Pagó"}</button>
                <button className="btn btn-sm btn-primary" onClick={async () => { await api.toggleActive(x.id); load(); }}>{x.isActive ? "Bloquear" : "Activar"}</button>
                <button className="btn btn-sm btn-primary" onClick={() => viewPreds(x)}>Ver pronósticos</button>
                <button className="btn btn-sm btn-danger" onClick={async () => { if (confirm("¿Eliminar?")) { await api.deleteParticipant(x.id); load(); } }}>Eliminar</button>
              </div></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {modal && <div className="modal-overlay" onClick={() => setModal(null)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="flex-between mb-2"><h3>Pronósticos de {modal.name}</h3><button className="btn btn-sm btn-danger" onClick={() => setModal(null)}>Cerrar</button></div>
          <div style={{ overflow: "auto", maxHeight: "60vh" }}>
            <table>
              <thead><tr><th>Partido</th><th>Grupo</th><th>Pronóstico</th><th>Resultado</th><th>Pts</th></tr></thead>
              <tbody>{preds.length ? preds.map(x => (
                <tr key={x.id}>
                  <td style={{ fontWeight: 600 }}>{x.homeTeam} vs {x.awayTeam}</td>
                  <td><span className="badge badge-scheduled">{x.groupName}</span></td>
                  <td>{x.homeScore}-{x.awayScore}</td>
                  <td>{x.matchStatus === "FINISHED" ? `${x.actualHome}-${x.actualAway}` : <span className="text-muted">-</span>}</td>
                  <td><span className={`badge ${x.points > 0 ? "badge-paid" : "badge-unpaid"}`}>{x.points}</span></td>
                </tr>
              )) : <tr><td colSpan={5} style={{ textAlign: "center", color: "#888" }}>Sin pronósticos</td></tr>}</tbody>
            </table>
          </div>
        </div>
      </div>}
    </div>
  );
}
