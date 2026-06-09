import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function Standings() {
  const [s, ss] = useState([]);
  useEffect(() => { api.getStandings().then(ss).catch(() => {}); }, []);
  if (!s.length) return <div className="card empty-state">Sin participantes</div>;
  return (
    <div className="card" style={{ padding: 0, overflow: "auto" }}>
      <table>
        <thead><tr><th>#</th><th>Nombre</th><th>Puntos</th><th>Pronósticos</th></tr></thead>
        <tbody>{s.map((x, i) => (
          <tr key={x.userId}>
            <td style={{ fontWeight: 700, color: i < 3 ? "#2563eb" : undefined }}>{i + 1}</td>
            <td>{x.name}</td>
            <td><span className="badge badge-paid">{x.totalPoints}</span></td>
            <td>{x.count}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
