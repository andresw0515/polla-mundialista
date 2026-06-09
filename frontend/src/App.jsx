import React from "react";
import { Routes, Route, Navigate, Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Predictions from "./pages/Predictions";
import Standings from "./pages/Standings";
import AdminDashboard from "./pages/AdminDashboard";
import AdminParticipants from "./pages/AdminParticipants";
import AdminMatches from "./pages/AdminMatches";
import AdminStages from "./pages/AdminStages";

function Protected({ children, admin }) {
  const u = JSON.parse(localStorage.getItem("user") || "null");
  if (!u) return <Navigate to="/login" replace />;
  if (admin && u.role !== "ADMIN") return <Navigate to="/dashboard" replace />;
  return children;
}

function Layout() {
  const nav = useNavigate();
  const loc = useLocation();
  const u = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = u.role === "ADMIN";
  const logout = () => { localStorage.clear(); nav("/login"); };
  const link = (to, label) => <Link to={to} className={loc.pathname === to ? "active" : ""}>{label}</Link>;

  return (
    <div>
      <header className="header">
        <div className="container">
          <Link to={isAdmin ? "/admin" : "/dashboard"} className="logo">⚽ Polla 2026</Link>
          <nav>
            {isAdmin ? <>
              {link("/admin", "Dashboard")}
              {link("/admin/participants", "Participantes")}
              {link("/admin/matches", "Partidos")}
              {link("/admin/stages", "Fases")}
              {link("/standings", "Tabla")}
            </> : <>
              {link("/dashboard", "Mis Datos")}
              {link("/predictions", "Pronosticar")}
              {link("/standings", "Tabla")}
            </>}
            <span className="user-name">{u.name}</span>
            <button onClick={logout} className="btn-link">Salir</button>
          </nav>
        </div>
      </header>
      <main className="container"><Outlet /></main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/predictions" element={<Protected><Predictions /></Protected>} />
        <Route path="/standings" element={<Standings />} />
        <Route path="/admin" element={<Protected admin><AdminDashboard /></Protected>} />
        <Route path="/admin/participants" element={<Protected admin><AdminParticipants /></Protected>} />
        <Route path="/admin/matches" element={<Protected admin><AdminMatches /></Protected>} />
        <Route path="/admin/stages" element={<Protected admin><AdminStages /></Protected>} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
