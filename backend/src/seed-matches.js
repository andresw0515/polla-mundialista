import { initDb, get, run, save } from "./db.js";

const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const TEAMS = [
  ["Alemania", "Escocia", "Hungría", "Suiza"],
  ["España", "Croacia", "Italia", "Albania"],
  ["Eslovenia", "Dinamarca", "Serbia", "Inglaterra"],
  ["Polonia", "Países Bajos", "Austria", "Francia"],
  ["Bélgica", "Eslovaquia", "Rumanía", "Ucrania"],
  ["Turquía", "Georgia", "Portugal", "República Checa"],
  ["Brasil", "Colombia", "Paraguay", "Argentina"],
  ["Canadá", "Chile", "Ecuador", "Perú"],
];

async function seed() {
  await initDb();
  const existing = get("SELECT id FROM matches LIMIT 1");
  if (existing) { console.log("Datos ya existen"); return; }

  const start = new Date("2026-06-11T13:00:00Z");
  let matchday = 1;

  for (let g = 0; g < GROUPS.length; g++) {
    const teams = TEAMS[g];
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const date = new Date(start.getTime() + (matchday - 1) * 86400000);
        run("INSERT INTO matches (groupName, homeTeam, awayTeam, startTime, status) VALUES (?, ?, ?, ?, 'SCHEDULED')",
          "Grupo " + GROUPS[g], teams[i], teams[j], date.toISOString());
        matchday++;
      }
    }
  }

  save();
  console.log("Partidos de ejemplo creados");
}

seed();
