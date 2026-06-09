import { Router } from "express";
import { get, all } from "../db.js";

function toUtc5(d) {
  if (!d) return null;
  const dt = new Date(d);
  const ms = dt.getTime() - 5 * 3600000;
  const u = new Date(ms);
  const pad = n => String(n).padStart(2, "0");
  return u.getUTCFullYear() + "-" + pad(u.getUTCMonth() + 1) + "-" + pad(u.getUTCDate()) + "T" + pad(u.getUTCHours()) + ":" + pad(u.getUTCMinutes()) + ":00-05:00";
}

const router = Router();

router.get("/", (req, res) => {
  const list = all("SELECT * FROM matches ORDER BY startTime ASC");
  res.json(list.map(m => ({ ...m, startTimeUtc5: toUtc5(m.startTime) })));
});

router.get("/:id", (req, res) => {
  const match = get("SELECT * FROM matches WHERE id = ?", req.params.id);
  if (!match) return res.status(404).json({ error: "No encontrado" });
  res.json({ ...match, startTimeUtc5: toUtc5(match.startTime) });
});

export default router;
