import bcrypt from "bcryptjs";
import { initDb, get, run, save } from "./db.js";

async function seed() {
  await initDb();
  const existing = get("SELECT id FROM users WHERE email = ?", "admin@polla.com");
  if (existing) { console.log("Admin ya existe"); return; }
  const hash = bcrypt.hashSync("admin123", 10);
  run("INSERT INTO users (name, email, passwordHash, role) VALUES (?, ?, ?, 'ADMIN')",
    "Admin", "admin@polla.com", hash);
  save();
  console.log("Admin creado: admin@polla.com / admin123");
}

seed();
