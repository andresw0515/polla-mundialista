import { run, all, get, save } from "./db.js";

const API_URL = "https://api.fifa.com/api/v3/calendar/matches?idCompetition=17&idSeason=285023&count=300";
const STAGE_BUFFER_HOURS = 3;
let _lastSync = null;

export function getLastSync() { return _lastSync; }

function toUtc5(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return new Date(d.getTime() - 5 * 60 * 60 * 1000).toISOString().slice(0, 16).replace("T", " ");
}

function computeClosesAt(stageName) {
  if (stageName === "First Stage") return "2026-06-11 10:00";
  const first = get("SELECT startTime FROM matches WHERE stageName = ? ORDER BY startTime LIMIT 1", stageName);
  if (!first) return null;
  const d = new Date(first.startTime);
  d.setHours(d.getHours() - STAGE_BUFFER_HOURS);
  return toUtc5(d.toISOString());
}

export function computeStagesClosesAt() {
  const stages = all("SELECT name FROM stages ORDER BY name");
  for (const s of stages) {
    const ct = computeClosesAt(s.name);
    if (ct) run("UPDATE stages SET closesAt = ? WHERE name = ?", ct, s.name);
  }
  save();
}

export function autoUpdateStages() {
  const now = new Date();
  const stages = all("SELECT * FROM stages ORDER BY closesAt ASC");
  let foundActive = false;
  for (const s of stages) {
    if (!s.closesAt) continue;
    const closeTime = new Date(s.closesAt.replace(" ", "T") + ":00-05:00");
    if (closeTime <= now) {
      run("UPDATE stages SET isActive = 0 WHERE name = ?", s.name);
    } else if (!foundActive) {
      run("UPDATE stages SET isActive = 1 WHERE name = ?", s.name);
      foundActive = true;
    } else {
      run("UPDATE stages SET isActive = 0 WHERE name = ?", s.name);
    }
  }
  save();
}

export async function syncMatches() {
  run("DELETE FROM matches WHERE fifaMatchId IS NULL");
  const res = await fetch(API_URL);
  const data = await res.json();
  const list = data.Results || [];

  for (const m of list) {
    const hs = m.HomeTeamScore != null ? m.HomeTeamScore : null;
    const as = m.AwayTeamScore != null ? m.AwayTeamScore : null;
    let status = "SCHEDULED";
    if (hs != null && as != null) status = "FINISHED";
    else if (m.MatchStatus === 0) status = "FINISHED";
    const homeTeam = m.Home?.TeamName?.[0]?.Description || "TBD";
    const awayTeam = m.Away?.TeamName?.[0]?.Description || "TBD";
    const groupName = m.GroupName?.[0]?.Description || "";
    const stageName = m.StageName?.[0]?.Description || "";

    if (stageName) run("INSERT OR IGNORE INTO stages (name) VALUES (?)", stageName);

    try {
      run(`INSERT INTO matches (fifaMatchId, groupName, homeTeam, awayTeam, startTime, homeScore, awayScore, status, stageName)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(fifaMatchId) DO UPDATE SET
             groupName=excluded.groupName, homeTeam=excluded.homeTeam, awayTeam=excluded.awayTeam,
             startTime=excluded.startTime, homeScore=excluded.homeScore, awayScore=excluded.awayScore,
             status=excluded.status, stageName=excluded.stageName`,
        m.IdMatch, groupName, homeTeam, awayTeam, m.Date, hs, as, status, stageName);
    } catch (e) {
      console.error("Error insertando partido", m.IdMatch, e.message);
    }
  }

  computeStagesClosesAt();
  autoUpdateStages();
  save();
  _lastSync = new Date().toISOString();
  return { count: list.length };
}
