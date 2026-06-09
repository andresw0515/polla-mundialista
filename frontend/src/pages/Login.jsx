import React, { useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { api } from "../api";

export default function Login() {
  const [e, se] = useState(""); const [p, sp] = useState(""); const [er, ser] = useState("");
  const n = useNavigate();
  const u = JSON.parse(localStorage.getItem("user") || "null");
  if (u) return <Navigate to={u.role === "ADMIN" ? "/admin" : "/dashboard"} replace />;
  const h = async (ev) => {
    ev.preventDefault(); ser("");
    try {
      const d = await api.login(e, p);
      localStorage.setItem("token", d.token);
      localStorage.setItem("user", JSON.stringify(d.user));
      n(d.user.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch (err) { ser(err.message); }
  };
  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Polla Mundialista 2026</h1>
        {er && <div className="error">{er}</div>}
        <form onSubmit={h}>
          <div className="field"><label>Email</label><input type="email" value={e} onChange={v => se(v.target.value)} required /></div>
          <div className="field"><label>Contraseña</label><input type="password" value={p} onChange={v => sp(v.target.value)} required /></div>
          <button className="btn btn-primary">Ingresar</button>
        </form>
        <div className="link">¿No tienes cuenta? <Link to="/register">Regístrate</Link></div>
      </div>
    </div>
  );
}
