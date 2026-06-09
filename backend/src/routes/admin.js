import { Router } from "express";
import bcrypt from "bcryptjs";
import { get, all, run, save } from "../db.js";
import { authenticate, requireAdmin } from "../auth.js";
import { recalcMatch } from "./predictions.js";
import { syncMatches, getLastSync, autoUpdateStages } from "../syncer.js";

const router = Router();
router.use(authenticate, requireAdmin);

router.post("/sync", (req, res) => {
  syncMatches().then(r => res.json({ message: "Sincronizados " + r.count + " partidos", count: r.count, lastSync: getLastSync() })).catch(e => res.status(500).json({ error: e.message }));
});

router.get("/participants", (req, res) => {
  const ps = all("SELECT u.*, (SELECT COUNT(*) FROM predictions p WHERE p.userId = u.id) as predCount FROM users u WHERE u.role = 'PARTICIPANT' ORDER BY u.name");
  res.json(ps);
});

router.post("/participants", (req, res) => {
  const { name, phone, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "Campos requeridos" });
  if (get("SELECT id FROM users WHERE email = ?", email)) return res.status(400).json({ error: "Email ya existe" });
  const hash = bcrypt.hashSync(password, 10);
  run("INSERT INTO users (name, phone, email, passwordHash) VALUES (?, ?, ?, ?)", name, phone || "", email, hash);
  save();
  res.json({ message: "Creado" });
});

router.patch("/participants/:id/toggle-pay", (req, res) => {
  const u = get("SELECT hasPaid FROM users WHERE id = ?", req.params.id);
  if (!u) return res.status(404).json({ error: "No encontrado" });
  run("UPDATE users SET hasPaid = ? WHERE id = ?", u.hasPaid ? 0 : 1, req.params.id);
  save();
  res.json({ message: "Actualizado" });
});

router.patch("/participants/:id/toggle-active", (req, res) => {
  const u = get("SELECT isActive FROM users WHERE id = ?", req.params.id);
  if (!u) return res.status(404).json({ error: "No encontrado" });
  run("UPDATE users SET isActive = ? WHERE id = ?", u.isActive ? 0 : 1, req.params.id);
  save();
  res.json({ message: "Actualizado" });
});

router.get("/participants/:id/predictions", (req, res) => {
  const u = get("SELECT id, name FROM users WHERE id = ? AND role = 'PARTICIPANT'", req.params.id);
  if (!u) return res.status(404).json({ error: "No encontrado" });
  const preds = all(`SELECT p.*, m.homeTeam, m.awayTeam, m.homeScore AS actualHome, m.awayScore AS actualAway,
    m.status AS matchStatus, m.startTime, m.stageName, m.groupName
    FROM predictions p JOIN matches m ON p.matchId = m.id WHERE p.userId = ? ORDER BY m.startTime`, req.params.id);
  res.json({ user: u, predictions: preds });
});

router.delete("/participants/:id", (req, res) => {
  const u = get("SELECT id FROM users WHERE id = ? AND role = 'PARTICIPANT'", req.params.id);
  if (!u) return res.status(404).json({ error: "No encontrado" });
  run("DELETE FROM predictions WHERE userId = ?", req.params.id);
  run("DELETE FROM users WHERE id = ?", req.params.id);
  save();
  res.json({ message: "Eliminado" });
});

function toUtc5(d) {
  if (!d) return null;
  const dt = new Date(d);
  const ms = dt.getTime() - 5 * 3600000;
  const u = new Date(ms);
  const pad = n => String(n).padStart(2, "0");
  return u.getUTCFullYear() + "-" + pad(u.getUTCMonth() + 1) + "-" + pad(u.getUTCDate()) + "T" + pad(u.getUTCHours()) + ":" + pad(u.getUTCMinutes()) + ":00-05:00";
}

router.get("/stages", (req, res) => {
  res.json(all("SELECT * FROM stages ORDER BY name"));
});

router.patch("/stages/:name/toggle", (req, res) => {
  const s = get("SELECT * FROM stages WHERE name = ?", req.params.name);
  if (!s) return res.status(404).json({ error: "No encontrada" });
  run("UPDATE stages SET isActive = ? WHERE name = ?", s.isActive ? 0 : 1, req.params.name);
  save();
  autoUpdateStages();
  res.json({ message: "Actualizada" });
});

router.get("/matches", (req, res) => {
  const list = all("SELECT * FROM matches ORDER BY startTime ASC");
  res.json(list.map(m => ({ ...m, startTimeUtc5: toUtc5(m.startTime) })));
});

router.patch("/matches/:id/result", (req, res) => {
  const { homeScore, awayScore } = req.body;
  const m = get("SELECT * FROM matches WHERE id = ?", req.params.id);
  if (!m) return res.status(404).json({ error: "No encontrado" });
  run("UPDATE matches SET homeScore = ?, awayScore = ?, status = 'FINISHED' WHERE id = ?",
    homeScore, awayScore, req.params.id);
  save();
  recalcMatch(parseInt(req.params.id));
  res.json({ message: "Resultado actualizado" });
});

router.patch("/matches/:id/clear", (req, res) => {
  const m = get("SELECT * FROM matches WHERE id = ?", req.params.id);
  if (!m) return res.status(404).json({ error: "No encontrado" });
  run("UPDATE matches SET homeScore = NULL, awayScore = NULL, status = 'SCHEDULED' WHERE id = ?", req.params.id);
  run("UPDATE predictions SET points = 0 WHERE matchId = ?", req.params.id);
  save();
  res.json({ message: "Resultado limpiado" });
});

export default router;
