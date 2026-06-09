import { Router } from "express";
import bcrypt from "bcryptjs";
import { get, run } from "../db.js";
import { signToken } from "../auth.js";

const router = Router();

router.post("/register", (req, res) => {
  const { name, phone, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "Campos requeridos" });
  if (get("SELECT id FROM users WHERE email = ?", email))
    return res.status(400).json({ error: "Email ya registrado" });
  const hash = bcrypt.hashSync(password, 10);
  run("INSERT INTO users (name, phone, email, passwordHash) VALUES (?, ?, ?, ?)",
    name, phone || "", email, hash);
  res.json({ message: "Registro exitoso" });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Campos requeridos" });
  const user = get("SELECT * FROM users WHERE email = ?", email);
  if (!user || !bcrypt.compareSync(password, user.passwordHash))
    return res.status(401).json({ error: "Credenciales inválidas" });
  if (!user.isActive) return res.status(403).json({ error: "Cuenta bloqueada" });
  const token = signToken(user);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, hasPaid: user.hasPaid } });
});

export default router;
