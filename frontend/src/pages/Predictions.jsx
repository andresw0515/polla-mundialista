import React, { useEffect, useState, useRef } from "react";
import { api } from "../api";

export default function Predictions() {
  const [matches, setMatches] = useState([]);
  const [preds, setPreds] = useState([]);
  const [stages, setStages] = useState([]);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const vals = useRef({});

  const load = () => {
    api.getMatches().then(setMatches).catch(() => {});
    api.getMyPredictions().then(p => { setPreds(p); for (const x of p) vals.current[x.matchId] = { h: x.homeScore, a: x.awayScore }; }).catch(() => {});
    api.getStages().then(setStages).catch(() => {});
  };
  useEffect(load, []);

  const save = async (id) => {
    const v = vals.current[id];
    if (v.h === undefined || v.a === undefined) return;
    setErr(""); setOk("");
    try { await api.savePrediction(id, v.h, v.a); setOk("Guardado"); load(); } catch (e) { setErr(e.message); }
  };

  const activeStage = stages.find(s => s.isActive);
  const activeClose = activeStage?.closesAt ? new Date(activeStage.closesAt.replace(" ", "T") + ":00-05:00") : null;

  return (
    <div>
      <h2 className="mb-3">Pronósticos</h2>
      {activeClose && <div className="alert alert-warning" style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: "#fef3c7", border: "1px solid #f59e0b", color: "#92400e" }}>
        ⏰ Fase <strong>{activeStage.name}</strong> cierra el <strong>{activeClose.toLocaleString("es", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</strong> — haz tus pronósticos antes del plazo
      </div>}
      {err && <div className="error">{err}</div>}
      {ok && <div className="success">{ok}</div>}
      <div className="grid grid-2">
        {matches.map(m => {
          const p = preds.find(x => x.matchId === m.id);
          const stage = stages.find(s => s.name === m.stageName);
          const started = new Date(m.startTime) <= new Date();
          const stageInactive = stage && !stage.isActive;
          const locked = started || (p && p.homeScore != null) || stageInactive;
          return (
            <div key={m.id} className="card">
              <div className="flex-between mb-2">
                <span className="badge badge-scheduled">{m.startTimeUtc5 ? new Date(m.startTimeUtc5).toLocaleString("es", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : new Date(m.startTime).toLocaleDateString()}</span>
                <span className={`badge ${m.status === "FINISHED" ? "badge-finished" : "badge-scheduled"}`}>{m.groupName}</span>
              </div>
              <div className="flex-between" style={{ gap: 6 }}>
                <span style={{ flex: 1, textAlign: "right", fontWeight: 600 }}>{m.homeTeam}</span>
                <div className="flex">
                  <input className="score-input" type="number" min="0" max="99"
                    defaultValue={vals.current[m.id]?.h ?? ""} disabled={locked}
                    onChange={e => { vals.current[m.id] = { ...vals.current[m.id], h: e.target.valueAsNumber }; }} />
                  <span style={{ fontWeight: 700 }}>-</span>
                  <input className="score-input" type="number" min="0" max="99"
                    defaultValue={vals.current[m.id]?.a ?? ""} disabled={locked}
                    onChange={e => { vals.current[m.id] = { ...vals.current[m.id], a: e.target.valueAsNumber }; }} />
                </div>
                <span style={{ flex: 1, fontWeight: 600 }}>{m.awayTeam}</span>
              </div>
              {m.status === "FINISHED" && <p className="text-muted mt-2" style={{ textAlign: "center" }}>Final: {m.homeScore}-{m.awayScore}{p?.points != null && <span className="badge badge-paid" style={{ marginLeft: 8 }}>{p.points} pts</span>}</p>}
              {!locked && <button className="btn btn-success btn-sm mt-2" style={{ width: "100%" }} onClick={() => save(m.id)}>Guardar</button>}
              {locked && started && !p?.homeScore && <p className="text-muted mt-2" style={{ textAlign: "center" }}>Partido comenzado</p>}
              {locked && p?.homeScore != null && <p className="text-muted mt-2" style={{ textAlign: "center" }}>🔒 {p.homeScore}-{p.awayScore}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
