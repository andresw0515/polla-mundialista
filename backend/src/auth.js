import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "polla-secret-2026";

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Token requerido" });
  try {
    req.user = jwt.verify(header.split(" ")[1], SECRET);
    next();
  } catch { return res.status(401).json({ error: "Token inválido" }); }
}

export function requireAdmin(req, res, next) {
  if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Acceso denegado" });
  next();
}

export function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: "7d" });
}
