import { Router } from "express";
import { get, all, run, save } from "../db.js";
import { authenticate } from "../auth.js";

const router = Router();

function calcPoints(homeScore, awayScore, predHome, predAway) {
  if (homeScore == null || awayScore == null || predHome == null || predAway == null) return 0;
  if (homeScore === predHome && awayScore === predAway) return 3;
  const actual = Math.sign(homeScore - awayScore);
  const pred = Math.sign(predHome - predAway);
  return actual === pred ? 1 : 0;
}

export function recalcMatch(matchId) {
  const match = get("SELECT * FROM matches WHERE id = ?", matchId);
  if (!match || match.status !== "FINISHED") return;
  const preds = all("SELECT * FROM predictions WHERE matchId = ?", matchId);
  for (const p of preds) {
    const pts = calcPoints(match.homeScore, match.awayScore, p.homeScore, p.awayScore);
    run("UPDATE predictions SET points = ?, updatedAt = datetime('now') WHERE id = ?", pts, p.id);
  }
  save();
}

router.post("/", authenticate, (req, res) => {
  const { matchId, homeScore, awayScore } = req.body;
  if (!matchId || homeScore === undefined || awayScore === undefined)
    return res.status(400).json({ error: "Datos incompletos" });
  const match = get("SELECT * FROM matches WHERE id = ?", matchId);
  if (!match) return res.status(404).json({ error: "Partido no existe" });
  if (new Date(match.startTime) <= new Date())
    return res.status(403).json({ error: "El partido ya comenzó" });
  if (match.stageName) {
    const stage = get("SELECT * FROM stages WHERE name = ?", match.stageName);
    if (stage) {
      if (!stage.isActive) return res.status(403).json({ error: "Fase no activa" });
      if (stage.closesAt) {
        const closeTime = new Date(stage.closesAt.replace(" ", "T") + ":00-05:00");
        if (closeTime <= new Date()) return res.status(403).json({ error: "Plazo de fase vencido" });
      }
    }
  }
  if (get("SELECT id FROM predictions WHERE userId = ? AND matchId = ?", req.user.id, matchId))
    return res.status(400).json({ error: "Ya tienes un pronóstico para este partido" });
  run("INSERT INTO predictions (userId, matchId, homeScore, awayScore) VALUES (?, ?, ?, ?)",
    req.user.id, matchId, homeScore, awayScore);
  save();
  res.json({ message: "Pronóstico guardado" });
});

router.get("/mine", authenticate, (req, res) => {
  res.json(all(`SELECT p.*, m.homeTeam, m.awayTeam, m.homeScore AS actualHome, m.awayScore AS actualAway,
    m.status AS matchStatus, m.startTime, m.stageName, m.groupName
    FROM predictions p JOIN matches m ON p.matchId = m.id WHERE p.userId = ?`, req.user.id));
});

router.get("/my-rank", authenticate, (req, res) => {
  const users = all("SELECT id, name, hasPaid FROM users WHERE role = 'PARTICIPANT'");
  const preds = all("SELECT p.userId, p.points FROM predictions p JOIN matches m ON p.matchId = m.id");
  const standings = users.filter(u => u.hasPaid).map(u => ({
    userId: u.id,
    totalPoints: preds.filter(p => p.userId === u.id).reduce((s, p) => s + (p.points || 0), 0),
  })).sort((a, b) => b.totalPoints - a.totalPoints);
  const myIdx = standings.findIndex(s => s.userId === req.user.id);
  res.json({ rank: myIdx + 1, total: standings.length });
});

router.get("/standings", (req, res) => {
  const users = all("SELECT id, name, hasPaid, isActive FROM users WHERE role = 'PARTICIPANT'");
  const preds = all("SELECT p.userId, p.points, p.homeScore FROM predictions p JOIN matches m ON p.matchId = m.id");
  const standings = users.filter(u => u.hasPaid).map(u => {
    const up = preds.filter(p => p.userId === u.id);
    return {
      userId: u.id, name: u.name,
      totalPoints: up.reduce((s, p) => s + (p.points || 0), 0),
      count: up.filter(p => p.homeScore != null).length,
    };
  }).sort((a, b) => b.totalPoints - a.totalPoints);
  res.json(standings);
});

export default router;
