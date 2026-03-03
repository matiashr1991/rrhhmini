// public/app.js - con Dashboard + auto-refresh

const API_BASE = ""; // mismo host/puerto. Si es otro: "http://IP:3000"

const LS_TOKEN = "hik_token";
const LS_USER = "hik_user";

let presentesCache = [];
let dashTimer = null;

function qs(id) { return document.getElementById(id); }

function setMsg(el, text, kind = "danger") {
  if (!el) return;
  el.classList.remove("d-none", "alert-danger", "alert-success", "alert-warning", "alert-info");

  let icon = "";
  switch(kind) {
    case "success":
      el.classList.add("alert-success");
      icon = '<i class="bi bi-check-circle-fill me-2"></i>';
      break;
    case "warning":
      el.classList.add("alert-warning");
      icon = '<i class="bi bi-exclamation-triangle-fill me-2"></i>';
      break;
    case "info":
      el.classList.add("alert-info");
      icon = '<i class="bi bi-info-circle-fill me-2"></i>';
      break;
    default:
      el.classList.add("alert-danger");
      icon = '<i class="bi bi-exclamation-triangle-fill me-2"></i>';
  }

  el.innerHTML = `${icon}${text}`;
  el.classList.remove("d-none");
}

function clearMsg(el) {
  if (!el) return;
  el.classList.add("d-none");
  el.textContent = "";
}

function token() {
  return localStorage.getItem(LS_TOKEN) || "";
}

function setToken(t) {
  localStorage.setItem(LS_TOKEN, t);
}

function clearToken() {
  localStorage.removeItem(LS_TOKEN);
  localStorage.removeItem(LS_USER);
}

async function api(path, { method="GET", body=null, auth=true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth && token()) {
    headers["Authorization"] = `Bearer ${token()}`;
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    const contentType = res.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    if (!res.ok) {
      let errorMsg = `Error ${res.status}: ${res.statusText}`;
      if (typeof data === 'object' && data.error) {
        errorMsg = data.error;
      } else if (typeof data === 'string' && data) {
        errorMsg = data;
      }
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('No se pudo conectar con el servidor. Verifique su conexión de red.');
    }
    throw error;
  }
}

// ---------- formatters ----------
function fmtHHMMFromISO(iso) {
  if (!iso || typeof iso !== "string") return "";
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "";
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2,"0");
  const mm = String(d.getMinutes()).padStart(2,"0");
  return `${hh}:${mm}`;
}

function fmtMinutesHHMM(mins) {
  const m = Number(mins || 0);
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}`;
}

function makeAlertChips({ missingOut, anomaly, isInRoster }) {
  const chips = [];
  if (missingOut) chips.push(`<span class="chip chip-warning"><i class="bi bi-clock me-1"></i>Sin egreso</span>`);
  if (anomaly) chips.push(`<span class="chip chip-danger"><i class="bi bi-exclamation-triangle me-1"></i>Anomalía</span>`);
  if (isInRoster === false) chips.push(`<span class="chip chip-info"><i class="bi bi-person-x me-1"></i>No en padrón</span>`);
  return chips.join(" ");
}

function badgeInRoster(isInRoster) {
  return isInRoster ?
    '<span class="badge badge-success"><i class="bi bi-check-circle me-1"></i>SI</span>' :
    '<span class="badge badge-danger"><i class="bi bi-x-circle me-1"></i>NO</span>';
}

function setActiveTab(tabId) {
  for (const btn of document.querySelectorAll("#tabs .nav-link")) {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  }
  for (const id of ["tabHoy","tabDashboard","tabDaily","tabWeekly","tabMonthly","tabRaw"]) {
    const el = qs(id);
    if (el) el.classList.toggle("d-none", id !== tabId);
  }

  if (tabId === "tabDashboard") {
    loadDashboard(); // cargar al entrar
  }
}

// ---------- helpers filtro ----------
function normStr(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function rowHasAlerts(r) {
  return !!(r?.missingOut || r?.anomaly || r?.isInRoster === false);
}

function applyPresentesFilter() {
  const q = normStr(qs("presentesSearch")?.value || "");
  const onlyAlerts = !!qs("presentesOnlyAlerts")?.checked;

  let items = presentesCache.slice();

  if (q) {
    items = items.filter((r) => {
      const name = normStr(r.name);
      const dni  = normStr(r.employeeKey);
      return name.includes(q) || dni.includes(q);
    });
  }
  if (onlyAlerts) {
    items = items.filter(rowHasAlerts);
  }

  renderPresentesHoy(items);
  updatePresentesCounters(items.length, presentesCache.length);
}

function updatePresentesCounters(showing, total) {
  const el = qs("presentesCountLine");
  if (!el) return;
  el.textContent = `${showing} de ${total}`;
}

function renderPresentesHoy(items) {
  const tbody = qs("presentesTbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  for (const r of (items || [])) {
    const inHHMM = fmtHHMMFromISO(r.inTime);
    const outHHMM = r.missingOut ? "—" : fmtHHMMFromISO(r.lastSeen);
    const hours = fmtMinutesHHMM(r.minutesWorked);

    const alerts = makeAlertChips({
      missingOut: !!r.missingOut,
      anomaly: !!r.anomaly,
      isInRoster: r.isInRoster,
    });

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.name || ""}</td>
      <td class="mono">${r.employeeKey || ""}</td>
      <td class="mono">${inHHMM}</td>
      <td class="mono">${outHHMM}</td>
      <td class="mono">${hours}</td>
      <td>${alerts || ""}</td>
    `;
    tbody.appendChild(tr);
  }
}

// ----------------- auth flow -----------------
async function doLogin() {
  clearMsg(qs("loginMsg"));
  const username = qs("loginUser").value.trim();
  const password = qs("loginPass").value;

  if (!username || !password) {
    setMsg(qs("loginMsg"), "Ingresá usuario y contraseña.");
    return;
  }

  try {
    const out = await api("/login", {
      method: "POST",
      body: { username, password },
      auth: false
    });

    if (!out.token) {
      throw new Error("No se recibió token de autenticación");
    }

    setToken(out.token);
    localStorage.setItem(LS_USER, username);
    showApp();
  } catch (e) {
    setMsg(qs("loginMsg"), `Login falló: ${e.message}`);
  }
}

function doLogout() {
  clearToken();
  stopDashboardAutoRefresh();
  showLogin();
}

function showLogin() {
  qs("loginView").classList.remove("d-none");
  qs("appView").classList.add("d-none");
  qs("btnLogout").classList.add("d-none");
  qs("whoami").textContent = "";
}

function showApp() {
  qs("loginView").classList.add("d-none");
  qs("appView").classList.remove("d-none");
  qs("btnLogout").classList.remove("d-none");

  const username = localStorage.getItem(LS_USER) || "-";
  qs("usernameDisplay").textContent = username;

  loadHealth();
  loadPresentesToday();
  startDashboardAutoRefresh();

  // defaults fechas
  const today = qs("healthToday").textContent && qs("healthToday").textContent !== "-" ? qs("healthToday").textContent : null;
  if (today && /^\d{4}-\d{2}-\d{2}$/.test(today)) {
    qs("dailyDay").value = today;
    qs("rawDay").value = today;
    if (qs("dashDay")) qs("dashDay").value = today;
  } else {
    const d = new Date().toISOString().slice(0,10);
    qs("dailyDay").value = d;
    qs("rawDay").value = d;
    if (qs("dashDay")) qs("dashDay").value = d;
  }

  // weekly default
  const firstDay = new Date();
  firstDay.setDate(firstDay.getDate() - 7);
  qs("weeklyFrom").value = firstDay.toISOString().slice(0,10);
  qs("weeklyTo").value = new Date().toISOString().slice(0,10);

  // month default
  qs("monthlyMonth").value = new Date().toISOString().slice(0,7);
}

// ----------------- health -----------------
async function loadHealth() {
  try {
    const h = await api("/health", { auth:false });
    qs("healthTz").textContent = h.tz || "-";
    qs("healthToday").textContent = h.today || "-";
    qs("healthAllowSubs").textContent = h.allowSubs ? JSON.stringify(h.allowSubs) : "null";
    qs("healthTs").textContent = `TS: ${h.ts}`;
    qs("apiHint").textContent = `${location.origin}${API_BASE || ""}`;

    if (!qs("dailyDay").value && h.today) qs("dailyDay").value = h.today;
    if (!qs("rawDay").value && h.today) qs("rawDay").value = h.today;
    if (qs("dashDay") && !qs("dashDay").value && h.today) qs("dashDay").value = h.today;
  } catch (e) {
    console.error("Health error:", e);
  }
}

// ----------------- presentes hoy -----------------
async function loadPresentesToday() {
  clearMsg(qs("globalMsg"));
  try {
    const out = await api("/presentes");
    const meta = out.meta || {};
    qs("presentesMetaLine").textContent =
      `Día ${out.day} | presentes=${meta.presentCount} | padrón=${meta.rosterActiveCount} | laborable=${meta.workday} | feriado=${meta.holiday}`;

    presentesCache = (out.items || []).slice();

    // reset filtros
    if (qs("presentesSearch")) qs("presentesSearch").value = "";
    if (qs("presentesOnlyAlerts")) qs("presentesOnlyAlerts").checked = false;

    renderPresentesHoy(presentesCache);
    updatePresentesCounters(presentesCache.length, presentesCache.length);
  } catch (e) {
    setMsg(qs("globalMsg"), `Error /presentes: ${e.message}`);
  }
}

// ----------------- daily -----------------
async function loadDaily(day) {
  clearMsg(qs("globalMsg"));
  const d = day || qs("dailyDay").value;
  if (!d) return;

  try {
    const out = await api(`/daily?day=${encodeURIComponent(d)}`);
    const meta = out.meta || {};
    qs("dailyMetaLine").textContent =
      `Día ${out.day} | presentes=${meta.presentCount} | padrón=${meta.rosterActiveCount} | laborable=${meta.workday} | feriado=${meta.holiday}`;

    const tbody = qs("dailyTbody");
    tbody.innerHTML = "";

    for (const r of (out.records || [])) {
      const inHHMM = fmtHHMMFromISO(r.inTime);
      const outHHMM = r.missingOut ? "—" : fmtHHMMFromISO(r.outTime);
      const hours = fmtMinutesHHMM(r.minutesWorked);

      const alerts = makeAlertChips({
        missingOut: !!r.missingOut,
        anomaly: !!r.anomaly,
        isInRoster: r.isInRoster,
      });

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.name || ""}</td>
        <td class="mono">${r.employeeKey || ""}</td>
        <td class="mono">${inHHMM}</td>
        <td class="mono">${outHHMM}</td>
        <td class="mono">${hours}</td>
        <td>${r.absent ? "SI" : ""}</td>
        <td>${alerts || ""}</td>
        <td>${badgeInRoster(!!r.isInRoster)}</td>
      `;
      tbody.appendChild(tr);
    }
  } catch (e) {
    setMsg(qs("globalMsg"), `Error /daily: ${e.message}`);
  }
}

// ----------------- weekly -----------------
async function loadWeekly() {
  clearMsg(qs("globalMsg"));
  const from = qs("weeklyFrom").value;
  const to = qs("weeklyTo").value;
  if (!from || !to) {
    setMsg(qs("globalMsg"), "Completá from/to para weekly.", "warning");
    return;
  }

  try {
    const out = await api(`/weekly?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
    qs("weeklyMetaLine").textContent = `Rango ${out.range?.from} → ${out.range?.to} | items=${(out.items || []).length}`;

    const tbody = qs("weeklyTbody");
    tbody.innerHTML = "";

    for (const it of (out.items || [])) {
      const totalHHMM = fmtMinutesHHMM(it.totalMinutes);

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${it.name || ""}</td>
        <td class="mono">${it.employeeKey || ""}</td>
        <td class="mono">${totalHHMM}</td>
        <td>${it.daysPresent}</td>
        <td>${it.daysAbsent}</td>
        <td>${it.missingOutDays}</td>
        <td>${it.anomalyDays}</td>
        <td>${badgeInRoster(!!it.isInRoster)}</td>
      `;
      tbody.appendChild(tr);
    }
  } catch (e) {
    setMsg(qs("globalMsg"), `Error /weekly: ${e.message}`);
  }
}

// ----------------- monthly -----------------
async function loadMonthly() {
  clearMsg(qs("globalMsg"));
  const month = qs("monthlyMonth").value;
  if (!month) {
    setMsg(qs("globalMsg"), "Seleccioná un mes (YYYY-MM).", "warning");
    return;
  }

  try {
    const out = await api(`/monthly?month=${encodeURIComponent(month)}`);
    qs("monthlyMetaLine").textContent =
      `Mes ${out.month} | Rango ${out.range?.from} → ${out.range?.to} | items=${(out.items || []).length}`;

    const tbody = qs("monthlyTbody");
    tbody.innerHTML = "";

    for (const it of (out.items || [])) {
      const totalHHMM = fmtMinutesHHMM(it.totalMinutes);

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${it.name || ""}</td>
        <td class="mono">${it.employeeKey || ""}</td>
        <td class="mono">${totalHHMM}</td>
        <td>${it.daysPresent}</td>
        <td>${it.daysAbsent}</td>
        <td>${it.missingOutDays}</td>
        <td>${it.anomalyDays}</td>
        <td>${badgeInRoster(!!it.isInRoster)}</td>
      `;
      tbody.appendChild(tr);
    }
  } catch (e) {
    setMsg(qs("globalMsg"), `Error /monthly: ${e.message}`);
  }
}

// ----------------- RAW -----------------
async function loadRaw() {
  clearMsg(qs("globalMsg"));
  const day = qs("rawDay").value;
  const employee = qs("rawEmployee").value.trim();

  if (!day) {
    setMsg(qs("globalMsg"), "Elegí fecha para RAW.", "warning");
    return;
  }

  try {
    const q = new URLSearchParams({ day });
    if (employee) q.set("employee", employee);

    const out = await api(`/events?${q.toString()}`);

    qs("rawCount").textContent = String(out.count || 0);
    qs("rawPre").textContent = JSON.stringify(out.items || [], null, 2);
  } catch (e) {
    setMsg(qs("globalMsg"), `Error /events: ${e.message}`);
  }
}

// ----------------- maintenance compact -----------------
async function compactToday() {
  clearMsg(qs("quickMsg"));
  try {
    const day = qs("healthToday").textContent || "";
    const out = await api(`/maintenance/compact?day=${encodeURIComponent(day)}`, { method:"POST", body:{} });
    setMsg(qs("quickMsg"), `RAW compactado: kept=${out.totalKept}, read=${out.totalRead}.`, "success");

    await loadDaily(day);
    await loadPresentesToday();
    await loadDashboard();
  } catch (e) {
    setMsg(qs("quickMsg"), `Compact falló: ${e.message}`);
  }
}

// ----------------- exports -----------------
async function downloadExport(url) {
  const headers = {};
  if (token()) headers["Authorization"] = `Bearer ${token()}`;

  try {
    const res = await fetch(`${API_BASE}${url}`, { headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }

    const blob = await res.blob();
    const cd = res.headers.get("content-disposition") || "";
    const m = cd.match(/filename="([^"]+)"/i);
    const filename = m ? m[1] : "reporte.xlsx";

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  } catch (e) {
    setMsg(qs("globalMsg"), `Error al exportar: ${e.message}`);
  }
}

async function exportDaily(day) {
  const d = day || qs("healthToday").textContent || qs("dailyDay").value;
  await downloadExport(`/export?type=daily&day=${encodeURIComponent(d)}`);
}

async function exportWeekly() {
  const from = qs("weeklyFrom").value;
  const to = qs("weeklyTo").value;
  await downloadExport(`/export?type=weekly&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
}

async function exportMonthly() {
  const month = qs("monthlyMonth").value;
  await downloadExport(`/export?type=monthly&month=${encodeURIComponent(month)}`);
}

// ===================== DASHBOARD (POR DÍA, SIN GRÁFICOS) =====================
function parseHHMMToMinutes(hhmm) {
  const m = String(hhmm || "").match(/^(\d{2}):(\d{2})$/);
  if (!m) return null;
  const hh = Number(m[1]), mm = Number(m[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  return hh * 60 + mm;
}

function pct1(present, roster) {
  const p = Number(present || 0);
  const r = Number(roster || 0);
  if (!r) return null;
  return Math.round((p / r) * 1000) / 10; // 1 decimal
}

function renderDashboardKPIsDay(k) {
  qs("kpiPresentAvg").textContent = (k.presentCount ?? "-");
  qs("kpiAssistPct").textContent = (k.assistPct != null) ? `${k.assistPct}%` : "-";
  qs("kpiHoursAvgPerPresent").textContent = fmtMinutesHHMM(k.avgMinutesPerPresent || 0);
  qs("kpiEarlyOut").textContent = (k.earlyOutCount ?? "-");
  qs("kpiMissingOut").textContent = (k.missingOutCount ?? "-");
  qs("kpiAnomaly").textContent = (k.anomalyCount ?? "-");
}

async function loadDashboard() {
  clearMsg(qs("dashMsg"));

  const day = qs("dashDay")?.value || qs("healthToday")?.textContent || new Date().toISOString().slice(0,10);
  if (!day || day === "-") {
    setMsg(qs("dashMsg"), "Elegí un día para el dashboard.", "warning");
    return;
  }

  try {
    const out = await api(`/daily?day=${encodeURIComponent(day)}`);
    const meta = out.meta || {};
    const records = out.records || [];

    // presentes del día: !absent
    const presentRecords = records.filter(r => !r.absent);
    const presentCount = presentRecords.length;

    const roster = Number(meta.rosterActiveCount || 0);
    const assistPct = pct1(presentCount, roster);

    // promedio minutos por presente
    const mins = presentRecords
      .map(r => Number(r.minutesWorked))
      .filter(v => Number.isFinite(v) && v >= 0);

    const totalMins = mins.reduce((a,b)=>a+b,0);
    const avgMinutesPerPresent = mins.length ? Math.round(totalMins / mins.length) : 0;

    // alertas
    const missingOutCount = records.filter(r => !!r.missingOut).length;
    const anomalyCount = records.filter(r => !!r.anomaly).length;

    // early-out: outTime < 12:30 (o threshold del backend si lo devuelve)
    const threshold = out.earlyOutHHMM || "12:30";
    const thMin = parseHHMMToMinutes(threshold) ?? (12*60 + 30);

    const earlyOutCount = records.filter(r => {
      if (!r.outTime || r.missingOut) return false;
      const hhmm = fmtHHMMFromISO(r.outTime);
      const mm = parseHHMMToMinutes(hhmm);
      return mm != null && mm < thMin;
    }).length;

    qs("dashMetaLine").textContent =
      `Día ${out.day} • presentes=${meta.presentCount ?? presentCount} • padrón=${meta.rosterActiveCount ?? "-"} • laborable=${meta.workday} • feriado=${meta.holiday} • TZ=${out.tz ?? "-"}`;

    renderDashboardKPIsDay({
      presentCount,
      assistPct,
      avgMinutesPerPresent,
      earlyOutCount,
      missingOutCount,
      anomalyCount
    });

    qs("dashLastUpdated").textContent = new Date().toLocaleString();
  } catch (e) {
    setMsg(qs("dashMsg"), `Error dashboard día: ${e.message}`);
  }
}

function startDashboardAutoRefresh() {
  stopDashboardAutoRefresh();
  dashTimer = setInterval(() => {
    if (!token()) return;
    loadDashboard();
  }, 10 * 60 * 1000);
}

function stopDashboardAutoRefresh() {
  if (dashTimer) clearInterval(dashTimer);
  dashTimer = null;
}

// ----------------- init -----------------
function wireUI() {
  // Login
  qs("btnLogin").addEventListener("click", doLogin);

  qs("loginPass").addEventListener("keypress", function(e) {
    if (e.key === "Enter") doLogin();
  });

  qs("btnLogout").addEventListener("click", doLogout);

  // Health
  qs("btnHealth").addEventListener("click", loadHealth);

  // Presentes
  qs("btnRefreshPresentes").addEventListener("click", () => {
    setActiveTab("tabHoy");
    loadPresentesToday();
  });

  // Compact
  qs("btnCompactToday").addEventListener("click", compactToday);

  // tabs
  for (const btn of document.querySelectorAll("#tabs .nav-link")) {
    btn.addEventListener("click", () => setActiveTab(btn.dataset.tab));
  }

  // HOY filtros
  qs("presentesSearch")?.addEventListener("input", applyPresentesFilter);
  qs("presentesOnlyAlerts")?.addEventListener("change", applyPresentesFilter);
  qs("btnPresentesClear")?.addEventListener("click", () => {
    qs("presentesSearch").value = "";
    qs("presentesOnlyAlerts").checked = false;
    applyPresentesFilter();
    qs("presentesSearch").focus();
  });

  // daily
  qs("btnLoadDaily").addEventListener("click", () => {
    setActiveTab("tabDaily");
    loadDaily();
  });
  qs("btnExportDaily").addEventListener("click", () =>
    exportDaily(qs("healthToday").textContent)
  );
  qs("btnExportDailyPick").addEventListener("click", () =>
    exportDaily(qs("dailyDay").value)
  );

  // weekly
  qs("btnLoadWeekly").addEventListener("click", () => {
    setActiveTab("tabWeekly");
    loadWeekly();
  });
  qs("btnExportWeekly").addEventListener("click", exportWeekly);

  // monthly
  qs("btnLoadMonthly").addEventListener("click", () => {
    setActiveTab("tabMonthly");
    loadMonthly();
  });
  qs("btnExportMonthly").addEventListener("click", exportMonthly);

  // raw
  qs("btnLoadRaw").addEventListener("click", () => {
    setActiveTab("tabRaw");
    loadRaw();
  });

  // dashboard (por día)
  qs("btnDashRefresh")?.addEventListener("click", loadDashboard);
  qs("dashDay")?.addEventListener("change", loadDashboard);

  // Mostrar endpoint API
  qs("apiHint").textContent = `${location.origin}${API_BASE || ""}`;
}

async function initApp() {
  wireUI();

  try {
    await loadHealth();
  } catch (error) {
    console.error("Error inicial:", error);
  }

  if (token()) {
    showApp();
  } else {
    showLogin();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Añade esto al final de tu app.js existente (después de initApp())
function addModernEffects() {
  // Efecto de aparición suave para todas las tarjetas
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // Observar todas las cards
  document.querySelectorAll('.card, .status-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(card);
  });
}

// Y modifica initApp para llamar a esta función:
async function initApp() {
  wireUI();

  try {
    await loadHealth();
  } catch (error) {
    console.error("Error inicial:", error);
  }

  if (token()) {
    showApp();
    setTimeout(addModernEffects, 100); // Pequeño delay para que cargue primero
  } else {
    showLogin();
  }
}
