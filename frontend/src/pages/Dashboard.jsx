import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function Dashboard() {
  const [m, sm] = useState([]); const [p, sp] = useState([]); const [rank, sr] = useState(null);
  const u = JSON.parse(localStorage.getItem("user") || "{}");
  useEffect(() => {
    api.getMatches().then(sm).catch(() => {});
    api.getMyPredictions().then(sp).catch(() => {});
    api.getMyRank().then(sr).catch(() => {});
  }, []);
  const up = m.filter(x => x.status === "SCHEDULED").length;
  const pts = p.reduce((s, x) => s + (x.points || 0), 0);
  return (
    <div>
      <div className="card mb-3">
        <div className="flex-between" style={{ alignItems: "center" }}>
          <div><h2>Bienvenido, {u.name}</h2><p className="text-muted">{u.email}</p><span className={`badge ${u.hasPaid ? "badge-paid" : "badge-unpaid"}`} style={{ marginTop: 4 }}>{u.hasPaid ? "Pagado ✔" : "No ha pagado"}</span></div>
          {rank && <div style={{ textAlign: "center" }}><div style={{ fontSize: 28, fontWeight: 700, color: "#2563eb" }}>#{rank.rank}</div><div className="text-muted">de {rank.total}</div></div>}
        </div>
      </div>
      <div className="grid grid-2 mb-3">
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#2563eb" }}>{p.length}</div>
          <div className="text-muted">Pronósticos</div>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#16a34a" }}>{pts}</div>
          <div className="text-muted">Puntos</div>
        </div>
      </div>
      <div className="card mb-3"><div className="flex-between"><h3>Partidos</h3><Link to="/predictions" className="btn btn-primary btn-sm">Pronosticar</Link></div><p className="text-muted mt-2">Próximos: {up} | Total: {m.length}</p></div>
      <div className="card" style={{ padding: 0, overflow: "auto" }}>
        <h3 style={{ padding: "12px 16px", margin: 0 }}>Mis Pronósticos</h3>
        <table>
          <thead><tr><th>Partido</th><th>Grupo</th><th>Mi pronóstico</th><th>Resultado</th><th>Pts</th></tr></thead>
          <tbody>{p.map(x => (
            <tr key={x.id}>
              <td style={{ fontWeight: 600 }}>{x.homeTeam} vs {x.awayTeam}</td>
              <td><span className="badge badge-scheduled">{x.groupName}</span></td>
              <td>{x.homeScore}-{x.awayScore}</td>
              <td>{x.matchStatus === "FINISHED" ? `${x.actualHome}-${x.actualAway}` : <span className="text-muted">-</span>}</td>
              <td><span className={`badge ${x.points > 0 ? "badge-paid" : "badge-unpaid"}`}>{x.points}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
