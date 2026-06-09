const BASE = "/api";
function headers() {
  const t = localStorage.getItem("token");
  return { "Content-Type": "application/json", ...(t ? { Authorization: "Bearer " + t } : {}) };
}
async function r(path, opts = {}) {
  const res = await fetch(BASE + path, { ...opts, headers: { ...headers(), ...opts.headers } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error");
  return data;
}
export const api = {
  login: (e, p) => r("/auth/login", { method: "POST", body: JSON.stringify({ email: e, password: p }) }),
  register: (n, ph, e, p) => r("/auth/register", { method: "POST", body: JSON.stringify({ name: n, phone: ph, email: e, password: p }) }),
  getMatches: () => r("/matches"),
  getMyPredictions: () => r("/predictions/mine"),
  savePrediction: (m, h, a) => r("/predictions", { method: "POST", body: JSON.stringify({ matchId: m, homeScore: h, awayScore: a }) }),
  getStandings: () => r("/predictions/standings"),
  getMyRank: () => r("/predictions/my-rank"),
  getParticipants: () => r("/admin/participants"),
  createParticipant: (n, ph, e, p) => r("/admin/participants", { method: "POST", body: JSON.stringify({ name: n, phone: ph, email: e, password: p }) }),
  togglePay: (id) => r("/admin/participants/" + id + "/toggle-pay", { method: "PATCH" }),
  toggleActive: (id) => r("/admin/participants/" + id + "/toggle-active", { method: "PATCH" }),
  deleteParticipant: (id) => r("/admin/participants/" + id, { method: "DELETE" }),
  getAdminMatches: () => r("/admin/matches"),
  setResult: (id, h, a) => r("/admin/matches/" + id + "/result", { method: "PATCH", body: JSON.stringify({ homeScore: h, awayScore: a }) }),
  clearResult: (id) => r("/admin/matches/" + id + "/clear", { method: "PATCH" }),
  syncMatches: () => r("/admin/sync", { method: "POST" }),
  getSyncStatus: () => r("/sync-status"),
  getStages: () => r("/stages"),
  getAdminStages: () => r("/admin/stages"),
  toggleStage: (name) => r("/admin/stages/" + encodeURIComponent(name) + "/toggle", { method: "PATCH" }),
  getParticipantPredictions: (id) => r("/admin/participants/" + id + "/predictions"),
};
