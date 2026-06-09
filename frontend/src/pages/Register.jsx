import React, { useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { api } from "../api";

export default function Register() {
  const [n, sn] = useState(""); const [ph, sph] = useState(""); const [e, se] = useState(""); const [p, sp] = useState("");
  const [er, ser] = useState(""); const [ok, sok] = useState("");
  const nav = useNavigate();
  const u = JSON.parse(localStorage.getItem("user") || "null");
  if (u) return <Navigate to="/dashboard" replace />;
  const h = async (ev) => {
    ev.preventDefault(); ser(""); sok("");
    try {
      await api.register(n, ph, e, p);
      sok("Registro exitoso"); setTimeout(() => nav("/login"), 1500);
    } catch (err) { ser(err.message); }
  };
  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Polla Mundialista 2026</h1>
        {er && <div className="error">{er}</div>}
        {ok && <div className="success">{ok}</div>}
        <form onSubmit={h}>
          <div className="field"><label>Nombre</label><input value={n} onChange={v => sn(v.target.value)} required /></div>
          <div className="field"><label>Teléfono</label><input value={ph} onChange={v => sph(v.target.value)} /></div>
          <div className="field"><label>Email</label><input type="email" value={e} onChange={v => se(v.target.value)} required /></div>
          <div className="field"><label>Contraseña</label><input type="password" value={p} onChange={v => sp(v.target.value)} required /></div>
          <button className="btn btn-primary">Registrarse</button>
        </form>
        <div className="link">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></div>
      </div>
    </div>
  );
}
