import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function AdminDashboard() {
  const [p, sp] = useState([]); const [m, sm] = useState([]); const [st, sst] = useState([]);
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  useEffect(() => {
    api.getParticipants().then(sp).catch(() => {});
    api.getMatches().then(sm).catch(() => {});
    api.getStandings().then(sst).catch(() => {});
    api.getSyncStatus().then(d => setSyncStatus(d.lastSync)).catch(() => {});
  }, []);
  const doSync = async () => {
    setSyncing(true);
    try { const d = await api.syncMatches(); setSyncStatus(d.lastSync); } catch (e) { alert(e.message); }
    setSyncing(false);
  };
  return (
    <div>
      <div className="flex-between mb-3">
        <h2>Panel Admin</h2>
        <button className="btn btn-primary" onClick={doSync} disabled={syncing}>{syncing ? "Sincronizando..." : "Sincronizar Partidos"}</button>
      </div>
      {syncStatus && <p className="text-muted mb-2">Última sincronización: {new Date(syncStatus).toLocaleString("es")}</p>}
      <div className="grid grid-2 mb-3">
        <div className="card" style={{ textAlign: "center" }}><div style={{ fontSize: 32, fontWeight: 700, color: "#2563eb" }}>{p.length}</div><div className="text-muted">Participantes</div></div>
        <div className="card" style={{ textAlign: "center" }}><div style={{ fontSize: 32, fontWeight: 700, color: "#16a34a" }}>{m.length}</div><div className="text-muted">Partidos ({m.filter(x => x.status === "FINISHED").length} finalizados)</div></div>
      </div>
      <div className="card">
        <h3 className="mb-2">Tabla de Posiciones</h3>
        <table>
          <thead><tr><th>#</th><th>Nombre</th><th>Puntos</th></tr></thead>
          <tbody>{st.map((x, i) => <tr key={x.userId}><td>{i + 1}</td><td>{x.name}</td><td><span className="badge badge-paid">{x.totalPoints}</span></td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
