import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import { initDb, get, run, save } from "./db.js";
import { syncMatches, getLastSync } from "./syncer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const SYNC_INTERVAL = 2 * 60 * 60 * 1000;

async function start() {
  await initDb();

  const existing = get("SELECT id FROM users WHERE email = ?", "admin@polla.com");
  if (!existing) {
    const hash = bcrypt.hashSync("admin123", 10);
    run("INSERT INTO users (name, email, passwordHash, role) VALUES (?, ?, ?, 'ADMIN')",
      "Admin", "admin@polla.com", hash);
    save();
    console.log("Admin seed created");
  }

  const { default: createApp } = await import("./app.js");
  const { default: authRoutes } = await import("./routes/auth.js");
  const { default: matchRoutes } = await import("./routes/matches.js");
  const { default: predictionRoutes } = await import("./routes/predictions.js");
  const { default: adminRoutes } = await import("./routes/admin.js");
  const { default: stageRoutes } = await import("./routes/stages.js");

  const app = createApp();
  app.use("/api/auth", authRoutes);
  app.use("/api/matches", matchRoutes);
  app.use("/api/predictions", predictionRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/stages", stageRoutes);
  app.get("/api/health", (req, res) => res.json({ ok: true }));
  app.get("/api/sync-status", (req, res) => res.json({ lastSync: getLastSync() }));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log("Backend en http://0.0.0.0:" + PORT);
  });

  syncMatches().then(r => console.log("Sincronizados " + r.count + " partidos")).catch(e => console.error("Error inicial", e.message));
  setInterval(() => syncMatches().then(r => console.log("Sincronizados " + r.count + " partidos")).catch(e => console.error("Error sync", e.message)), SYNC_INTERVAL);
}

start();
