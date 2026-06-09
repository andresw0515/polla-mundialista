import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function AdminMatches() {
  const [list, setList] = useState([]);
  const [err, ser] = useState(""); const [ok, sok] = useState("");
  const [scores, setScores] = useState({});
  const load = () => api.getAdminMatches().then(d => { setList(d); const s = {}; for (const x of d) s[x.id] = { h: x.homeScore ?? "", a: x.awayScore ?? "" }; setScores(s); }).catch(() => {});
  useEffect(() => { load(); }, []);

  const setResult = async (id) => {
    const s = scores[id]; ser(""); sok("");
    try { await api.setResult(id, parseInt(s.h), parseInt(s.a)); sok("Actualizado"); load(); } catch (e) { ser(e.message); }
  };
  const clear = async (id) => {
    if (!confirm("¿Limpiar resultado?")) return; ser(""); sok("");
    try { await api.clearResult(id); sok("Limpiado"); load(); } catch (e) { ser(e.message); }
  };

  return (
    <div>
      <h2 className="mb-3">Partidos</h2>
      {err && <div className="error">{err}</div>}
      {ok && <div className="success">{ok}</div>}
      <div className="card" style={{ padding: 0, overflow: "auto" }}>
        <table>
          <thead><tr><th>Fecha</th><th>Grupo</th><th>Local</th><th>Marcador</th><th>Visita</th><th>Estado</th><th>Acción</th></tr></thead>
          <tbody>{list.map(m => (
            <tr key={m.id}>
              <td style={{ fontSize: 12 }}>{m.startTimeUtc5 ? new Date(m.startTimeUtc5).toLocaleString("es", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : new Date(m.startTime).toLocaleDateString()}</td>
              <td style={{ fontSize: 12 }}>{m.groupName}</td>
              <td style={{ textAlign: "right", fontWeight: 600 }}>{m.homeTeam}</td>
              <td>
                <div className="flex" style={{ justifyContent: "center" }}>
                  <input className="score-input" type="number" min="0" max="99"
                    value={scores[m.id]?.h ?? ""}
                    onChange={e => setScores({ ...scores, [m.id]: { ...scores[m.id], h: e.target.value } })} />
                  <span style={{ fontWeight: 700 }}>-</span>
                  <input className="score-input" type="number" min="0" max="99"
                    value={scores[m.id]?.a ?? ""}
                    onChange={e => setScores({ ...scores, [m.id]: { ...scores[m.id], a: e.target.value } })} />
                </div>
              </td>
              <td style={{ fontWeight: 600 }}>{m.awayTeam}</td>
              <td><span className={`badge ${m.status === "FINISHED" ? "badge-finished" : "badge-scheduled"}`}>{m.status === "FINISHED" ? "Final" : "Prog."}</span></td>
              <td>
                <div className="flex">
                  <button className="btn btn-sm btn-primary" onClick={() => setResult(m.id)}>{m.status === "FINISHED" ? "Editar" : "Fijar"}</button>
                  {m.status === "FINISHED" && <button className="btn btn-sm btn-danger" onClick={() => clear(m.id)}>Limpiar</button>}
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
