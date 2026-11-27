/* =============================================================================
   Interface du simulateur : état, éditeurs, lecture, survol synchronisé, tableaux, exports.
   ============================================================================= */
"use strict";

/* ---------- Qui suis-je : à modifier ici ---------- */
const ABOUT = {
  name: "Lucas Noirot",
  role: { fr: "Doctorant", en: "PhD student" },          // ex. « Doctorant, équipe X, Inria »
  links: [
    { icon: "globe", key: "about_site", url: "https://enpeluche.github.io" },
    { icon: "github", label: "GitHub", url: "https://github.com/enpeluche" },
    { icon: "linkedin", label: "LinkedIn", url: "https://linkedin.com/in/enpeluche" },
    { icon: "email", label: "Email", url: "mailto:lucas.noirot-petit@proton.me" },
  ],
};

const ICONS = {
  github: "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z",
  linkedin: "M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z",
  email: "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z",
  globe: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.93 6h-2.95a15.6 15.6 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.93 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14a8.2 8.2 0 0 1 0-4h3.38a16.5 16.5 0 0 0 0 4H4.26zm.81 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.99 7.99 0 0 1 5.07 16zm2.95-8H5.07a7.99 7.99 0 0 1 4.33-3.56A15.6 15.6 0 0 0 8.02 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66a14.7 14.7 0 0 1 0-4h4.68a14.7 14.7 0 0 1 0 4zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56zM16.36 14a16.5 16.5 0 0 0 0-4h3.38a8.2 8.2 0 0 1 0 4h-3.38z",
  download: "M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z",
  play: "M8 5v14l11-7z",
  pause: "M6 19h4V5H6v14zm8-14v14h4V5h-4z",
};

/* ---------- Scénarios : [u(0), λ, σ] par agent ---------- */
const PRESETS = {
  eq5:   { agents: [[0, 1, 10], [0, 3, 20], [0, 1, 5], [0, 1, 4], [0, 3, 10]] },
  fam5:  { agents: [[0, 1, 10], [0, 3, 20], [0, 1, 4], [0, 3, 10], [0, 2, 5]] },
  abo5:  { agents: [[0, 1, 20], [0, 1, 10], [0, 3, 20], [0, 1, 5], [0, 1, 4]] },
  trois: { agents: [[0, 1, 3], [1, 1, 3], [2, 1, 3]] },
  ties:  { agents: [[0, 1, 4], [0, 1, 4], [0, 1, 4], [0, 1, 4]] },
  deux:  { agents: [[0, 1, 3], [0, 2, 4]] },
  deuxf: { agents: [[0, 2, 3], [0, 3, 5]] },
  // deux agents déphasés (2,0) ↔ (1,1) ; un apport ponctuel à A en t = 6 casse ce régime
  phase: { agents: [[2, 1, 2], [0, 1, 2]], chi: "prio", prio: [1, 0], boosts: [{ agent: 0, t: 6, q: 1 }] },
};
const SPEEDS = [0.25, 0.5, 1, 2, 4, 8, 16, 32, 64, 128];
const MAX_T = 200000;
const STORE = "convivium-simulateur-v1";

const $ = id => document.getElementById(id);
const NAMES = Model.NAMES;
const acol = i => Charts.css("--a" + (i % 8));      // pour le canvas
const avar = i => `var(--a${i % 8})`;                // pour le HTML

/* ---------- État ---------- */
const state = {
  lang: "fr", tab: "sim", preset: "eq5",
  cfg: { agents: [], chi: "prio", prio: [], seed: 1, boosts: [] },
  norm: false, mean: false, speedIdx: 3, win: 60, whole: false,
  histsrc: "all", glob: "range", per: "y",
};
const hidden = new Set();          // agents masqués dans les tracés
let sim, info, asym = null;
let tc = 0, playing = false, lastTs = 0, dirty = true, lastT = -1, hover = null;
let tablesStale = true, lastTables = 0;

/* ---------- Langue et nombres ---------- */
function tr(key, vars) {
  let s = I18N[state.lang][key] ?? I18N.fr[key] ?? key;
  if (vars && typeof s === "string") s = s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
  return s;
}
let nf3, nf1;
function setFormats() {
  nf3 = new Intl.NumberFormat(state.lang === "fr" ? "fr-FR" : "en-US", { maximumFractionDigits: 3 });
  nf1 = new Intl.NumberFormat(state.lang === "fr" ? "fr-FR" : "en-US", { maximumFractionDigits: 2 });
}
const fmt = v => (v === null || v === undefined || !isFinite(v) ? "—" : nf3.format(Math.abs(v) < 5e-10 ? 0 : v));
const fracStr = (p, q) => { const f = Model.frac(p, q); return f.q === 1 ? String(f.p) : `${f.p}/${f.q}`; };

/* ---------- Formules (KaTeX, embarqué dans assets/vendor) ---------- */
const TEX_MACROS = { "\\A": "\\mathcal{A}", "\\T": "\\mathcal{T}", "\\indic": "\\mathbf{1}", "\\argmax": "\\operatorname*{arg\\,max}", "\\argmin": "\\operatorname*{arg\\,min}" };
function renderMath() {
  if (!window.katex) return;                       // sans KaTeX, le LaTeX brut reste lisible
  const opts = { throwOnError: false, macros: { ...TEX_MACROS } };
  document.querySelectorAll("[data-tex]").forEach(el => katex.render(el.dataset.tex, el, opts));
  if (window.renderMathInElement) renderMathInElement($("modeltext"), { ...opts,
    delimiters: [{ left: "\\[", right: "\\]", display: true }, { left: "\\(", right: "\\)", display: false }] });
  renderRegMark();
}
/* Repère « scénario courant » sur la barre des régimes de l'onglet Modèle (X de 0 à 2). */
function renderRegMark() {
  const m = $("regmark"); if (!m || !info) return;
  const Xs = info.Xf.q === 1 ? String(info.Xf.p) : `${info.Xf.p}/${info.Xf.q}`;
  m.style.left = (Math.max(0, Math.min(2, info.X)) / 2 * 100) + "%";
  m.className = "here " + info.regime;
  $("regmarklab").textContent = `${state.lang === "fr" ? "scénario courant" : "current scenario"} : X = ${Xs}`.replace(" :", state.lang === "fr" ? " :" : ":");
}

/* =============================================================================
   Simulation
   ============================================================================= */
function rebuild() {
  sim = new Model.Sim(state.cfg);
  info = Model.load(state.cfg.agents);
  asym = null;
  for (const i of [...hidden]) if (i >= sim.n) hidden.delete(i);
  sim.ensure(Math.ceil(tc) + 2);
  for (const c of Object.values(charts)) c.resetScale && c.resetScale();
  lastT = -1; dirty = true;
  renderRegMark();
  save();
}
function getAsym() {
  if (!asym) asym = Model.asymptotic(state.cfg, info.X);
  return asym;
}
function windowRange() {
  if (state.whole) return [0, Math.max(state.win, tc)];
  const x1 = Math.max(state.win, tc); return [x1 - state.win, x1];
}

/* =============================================================================
   Tracés
   ============================================================================= */
const charts = {};
function onHover(id) { if (id !== hover) { hover = id; syncHover(); } }
function syncHover() {
  for (const c of Object.values(charts)) c.setHover(hover);
  document.querySelectorAll("[data-agent]").forEach(el => el.classList.toggle("hl", hover === "a" + el.dataset.agent));
  document.querySelectorAll(".legend button[data-id]").forEach(el => el.classList.toggle("on", el.dataset.id === hover));
  dirty = true;
}

function ribbon() {
  return { served: t => sim.served(t), color: acol, name: k => NAMES[k],
    servedLabel: tr("tip_served"), ties: t => sim.ties(t), tieLabel: k => tr("tip_tie", { k }),
    boost: t => { const B = sim.boostAt(t); if (!B) return null; const L = []; B.forEach((q, i) => { if (q > 0) L.push({ i, q }); }); return L; },
    boostLabel: tr("tip_boost"), boostTimes: [...sim.boost.keys()].sort((a, b) => a - b) };
}
function meanAt(t, norm) {
  if (!sim.has(t)) return null;
  let s = 0; for (let i = 0; i < sim.n; i++) s += norm ? sim.U(t, i) / sim.lam[i] : sim.U(t, i);
  return s / sim.n;
}
function mainSeries() {
  const S = [], norm = state.norm;
  for (let i = 0; i < sim.n; i++) S.push({ id: "a" + i, color: acol(i), label: NAMES[i], hidden: hidden.has(i), width: 2,
    value: t => (sim.has(t) ? (norm ? sim.U(t, i) / sim.lam[i] : sim.U(t, i)) : null) });
  if (state.mean) S.push({ id: "mean", color: Charts.css("--muted"), label: tr("mean_label"), dash: [4, 4], width: 1.4, endLabel: false, value: t => meanAt(t, norm) });
  return S;
}
function globSeries() {
  const ext = (t, f) => { if (!sim.has(t)) return null; let m = f === "max" ? -Infinity : Infinity; for (let i = 0; i < sim.n; i++) { const v = sim.U(t, i); m = f === "max" ? Math.max(m, v) : Math.min(m, v); } return m; };
  const sum = t => { if (!sim.has(t)) return null; let s = 0; for (let i = 0; i < sim.n; i++) s += sim.U(t, i); return s; };
  switch (state.glob) {
    case "range": return [
      { id: "g-max", color: Charts.css("--minus"), label: tr("ser_max"), value: t => ext(t, "max") },
      { id: "g-mean", color: Charts.css("--accent"), label: tr("ser_mean"), value: t => meanAt(t, false) },
      { id: "g-min", color: Charts.css("--plus"), label: tr("ser_min"), value: t => ext(t, "min") }];
    case "e": return [{ id: "g-e", color: Charts.css("--accent"), label: tr("ser_e"), value: t => (sim.has(t) ? ext(t, "max") - ext(t, "min") : null) }];
    case "sum": return [{ id: "g-sum", color: Charts.css("--accent"), label: tr("ser_sum"), value: sum }];
    default: return [{ id: "g-gamma", color: Charts.css("--warn"), label: tr("ser_gamma"), value: t => (sim.has(t) ? sim.gamma(t) : null) }];
  }
}
function perSeries() {
  const S = [], refs = [], k = state.per;
  for (let i = 0; i < sim.n; i++) {
    const x = info.x[i], lam = sim.lam[i];
    const f = {
      u: t => (sim.has(t) ? sim.U(t, i) : null),
      un: t => (sim.has(t) ? sim.U(t, i) / lam : null),
      y: t => sim.y(t, i),
      r: t => { const y = sim.y(t, i); return y === null ? null : x - y; },
      d: t => (sim.has(t) ? sim.U(t, i) - meanAt(t, false) : null),
      m: t => sim.meanU(t, i),
      g: t => (sim.has(t) ? sim.GAc(t, i) : null),
    }[k];
    S.push({ id: "a" + i, color: acol(i), label: NAMES[i], hidden: hidden.has(i), value: f });
    if (k === "y" && !hidden.has(i)) refs.push({ id: "a" + i, y: x, color: acol(i), dash: [2, 4] });
  }
  return { S, refs, integer: k === "u" || k === "d" };
}

function drawMain(exporting) {
  const [x0, x1] = windowRange();
  return charts.main.draw({ series: mainSeries(), x0, x1, tEnd: tc, ribbon: ribbon(), endLabels: true,
    integerY: !state.norm, yLabel: state.norm ? "u / λ" : "u", exporting });
}
function drawGlob() {
  const [x0, x1] = windowRange(), S = globSeries();
  return charts.glob.draw({ series: S, x0, x1, tEnd: tc, integerY: state.glob !== "gamma", endLabels: false });
}
function drawPer() {
  const [x0, x1] = windowRange(), { S, refs, integer } = perSeries();
  return charts.per.draw({ series: S, refs, x0, x1, tEnd: tc, integerY: integer, endLabels: true });
}
function histData() {
  const T = Math.floor(tc), n = sim.n, [x0] = windowRange();
  let y = null, msg = "";
  if (state.histsrc === "per") {
    const A = getAsym();
    if (A.status === "ok") y = A.agents.map(a => a.y);
    else msg = tr("hist_no_period");
  }
  if (!y && state.histsrc === "win") {
    const tA = Math.max(0, Math.floor(x0));
    if (T - tA >= 1) y = Array.from({ length: n }, (_, i) => (sim.Nc(T, i) - sim.Nc(tA, i)) / (T - tA));
  }
  if (!y && T >= 1) y = Array.from({ length: n }, (_, i) => sim.Nc(T, i) / T);
  if (!y) msg = tr("hist_none");
  const R = Model.reference(info.x, info.X);
  const showRef = info.regime !== "equilibre";
  return { x: info.x, y, names: [...NAMES.slice(0, n)], colors: Array.from({ length: n }, (_, i) => acol(i)),
    ref: showRef ? R.y : null, theta: info.regime === "abondance" ? R.theta : null, msg };
}
function drawHist() {
  const D = histData();
  charts.hist.draw(D);
  $("histmsg").textContent = D.msg;
  $("histmsg").hidden = !D.msg;
}

/* =============================================================================
   Lecture
   ============================================================================= */
function frame(ts) {
  if (playing) {
    const dt = lastTs ? Math.min(0.1, (ts - lastTs) / 1000) : 0;
    tc = Math.min(MAX_T, tc + dt * SPEEDS[state.speedIdx]);
    if (tc >= MAX_T) setPlaying(false);
  }
  lastTs = ts;
  if (playing || dirty) render();
  requestAnimationFrame(frame);
}
function render() {
  dirty = false;
  sim.ensure(Math.ceil(tc) + 2);
  let anim = false;
  if (state.tab === "sim") anim = drawMain() || anim;
  if (state.tab === "ana") { anim = drawGlob() || anim; anim = drawPer() || anim; drawHist(); }
  if (anim) dirty = true;
  const T = Math.floor(tc);
  if (T !== lastT) { lastT = T; renderReadout(); tablesStale = true; }
  // tableaux : au plus 4 fois par seconde pendant la lecture, tout de suite à l'arrêt
  const now = performance.now();
  if (tablesStale && state.tab === "ana" && (!playing || now - lastTables > 250)) { renderTables(); tablesStale = false; lastTables = now; }
  else if (tablesStale && state.tab === "ana") dirty = true;
}
function setPlaying(p) {
  playing = p;
  $("playtxt").textContent = tr(p ? "pause" : "play");
  $("playico").setAttribute("d", ICONS[p ? "pause" : "play"]);
  lastTs = 0; dirty = true;
}
function jump(t) { setPlaying(false); tc = Math.max(0, Math.min(MAX_T, t)); dirty = true; lastT = -1; }

/* =============================================================================
   Affichages textuels
   ============================================================================= */
function renderReadout() {
  const T = Math.floor(tc), L = $("load");
  $("tnow").textContent = T;
  // largeurs fixes (lettre, mention des ex æquo toujours réservée) : rien ne bouge pendant la lecture
  const k = sim.served(T), nt = sim.ties(T);
  $("servsw").style.background = avar(k); $("servname").textContent = NAMES[k];
  $("servtie").textContent = nt > 1 ? `(${tr("tip_tie", { k: nt })})` : "";
  const Xs = info.Xf.q === 1 ? String(info.Xf.p) : `${info.Xf.p}/${info.Xf.q}`;
  L.textContent = `X = ${Xs} · ${tr("regime_" + info.regime)}`;
  L.className = "pill regime " + info.regime;
  L.title = tr("regime_tip_" + info.regime);
  $("xtotal").textContent = Xs; $("xtotal").title = fmt(info.X);
}

function renderTables() {
  const T = Math.floor(tc), n = sim.n, [x0] = windowRange(), tA = Math.max(0, Math.floor(x0));
  // à l'instant t
  $("nowtitle").textContent = tr("now_title", { t: T });
  const C = tr("now_cols");
  let h = `<thead><tr>${C.map(c => `<th>${c}</th>`).join("")}</tr></thead><tbody>`;
  let su = 0, sm = 0, sg = 0;
  for (let i = 0; i < n; i++) {
    let lo = Infinity, hi = -Infinity;
    for (let t = tA; t <= T; t++) { const v = sim.U(t, i); if (v < lo) lo = v; if (v > hi) hi = v; }
    const y = sim.y(T, i), r = y === null ? null : info.x[i] - y, m = sim.meanU(T, i), g = sim.GAc(T, i);
    su += sim.U(T, i); sm += m; sg += g;
    h += `<tr data-agent="${i}"><td><span class="chip" style="background:${avar(i)}">${NAMES[i]}</span></td><td>${sim.lam[i]}</td><td>${sim.sig[i]}</td>` +
      `<td title="${fmt(info.x[i])}">${fracStr(sim.lam[i], sim.sig[i])}</td><td>${sim.U(T, i)}</td><td>${sim.Nc(T, i)}</td><td>${fmt(y)}</td>` +
      `<td class="${r > 1e-9 ? "pos" : r < -1e-9 ? "neg" : ""}">${fmt(r)}</td><td>${fmt(m)}</td><td>${lo} / ${hi}</td><td>${fmt(g)}</td></tr>`;
  }
  const Xs = info.Xf.q === 1 ? String(info.Xf.p) : `${info.Xf.p}/${info.Xf.q}`;
  h += `</tbody><tfoot><tr><td>${tr("now_total")}</td><td></td><td></td><td>${Xs}</td><td>${su}</td><td>${T}</td><td>${T ? 1 : "—"}</td>` +
    `<td>${T ? fmt(info.X - 1) : "—"}</td><td>${fmt(sm)}</td><td></td><td>${fmt(sg)}</td></tr></tfoot>`;
  $("nowtab").innerHTML = h;
  renderAsym();
  bindRowHover();
}
function renderAsym() {
  const A = getAsym(), W = $("asymword"), tab = $("asymtab");
  if (A.status !== "ok") {
    $("asymmsg").innerHTML = A.status === "famine" ? tr("asym_famine") : A.status === "random" ? tr("asym_random") : tr("asym_limit", { n: A.limit });
    W.hidden = true; tab.innerHTML = ""; return;
  }
  $("asymmsg").innerHTML = tr("asym_ok", { tau: A.tau, tau0: A.tau0 });
  const max = 96, w = A.word;
  W.innerHTML = `<span class="wl">${tr("asym_word")}</span>` +
    [...w.slice(0, max)].map(c => `<b style="background:${avar(NAMES.indexOf(c))}">${c}</b>`).join("") +
    (w.length > max ? ` <span class="muted">… (${w.length})</span>` : "");
  W.hidden = false;
  const C = tr("asym_cols");
  let h = `<thead><tr>${C.map(c => `<th>${c}</th>`).join("")}</tr></thead><tbody>`;
  A.agents.forEach((a, i) => {
    const r = info.x[i] - a.y;
    h += `<tr data-agent="${i}"><td><span class="chip" style="background:${avar(i)}">${NAMES[i]}</span></td><td>${a.hi}</td><td>${a.lo}</td><td>${fmt(a.mean)}</td>` +
      `<td>${fmt(a.y)}</td><td class="${r > 1e-9 ? "pos" : r < -1e-9 ? "neg" : ""}">${fmt(r)}</td><td>${fmt(a.gamma)}</td></tr>`;
  });
  tab.innerHTML = h + "</tbody>";
}
function bindRowHover() {
  document.querySelectorAll("table.res tr[data-agent]").forEach(tr_ => {
    tr_.onmouseenter = () => onHover("a" + tr_.dataset.agent);
    tr_.onmouseleave = () => onHover(null);
  });
  syncHover();
}

/* légendes cliquables */
function legend(el, items, toggle) {
  el.innerHTML = items.map(it => `<button type="button" data-id="${it.id}" class="${it.off ? "off" : ""}" ${toggle && it.agent !== undefined ? `aria-pressed="${!it.off}"` : ""}>` +
    (it.dash ? `<i class="dash"></i>` : `<i style="background:${it.color}"></i>`) + `${it.label}</button>`).join("");
  el.querySelectorAll("button").forEach(b => {
    b.onmouseenter = () => onHover(b.dataset.id);
    b.onmouseleave = () => onHover(null);
    b.onfocus = () => onHover(b.dataset.id);
    b.onblur = () => onHover(null);
    if (toggle) b.onclick = () => {
      if (!b.dataset.id.startsWith("a")) { state.mean = !state.mean; $("mean").checked = state.mean; renderLegends(); save(); dirty = true; return; }
      const i = +b.dataset.id.slice(1); hidden.has(i) ? hidden.delete(i) : hidden.add(i);
      renderLegends(); dirty = true;
    };
  });
}
function renderLegends() {
  const ag = Array.from({ length: sim.n }, (_, i) => ({ id: "a" + i, agent: i, color: avar(i), label: `${NAMES[i]} <span class="muted">λ=${sim.lam[i]} σ=${sim.sig[i]}</span>`, off: hidden.has(i) }));
  legend($("legend"), state.mean ? [...ag, { id: "mean", color: "var(--muted)", label: tr("mean_label"), dash: true }] : ag, true);
  legend($("perlegend"), ag.map(a => ({ ...a, label: NAMES[a.agent] })), true);
  legend($("globlegend"), globSeries().map(s => ({ id: s.id, color: s.color, label: s.label })), false);
  $("maintitle").innerHTML = tr(state.norm ? "main_title_norm" : "main_title");
  const ref = info.regime === "abondance" ? tr("hist_ref_theta") : info.regime === "famine" ? tr("hist_ref_famine") : "";
  $("histref").hidden = !ref; $("histreflab").innerHTML = ref;
  syncHover();
}

/* =============================================================================
   Éditeur des agents
   ============================================================================= */
function flash(html, id = "agentmsg") {
  const m = $(id); m.innerHTML = html; m.hidden = false;
  clearTimeout(m._t); m._t = setTimeout(() => { m.hidden = true; }, 6000);
}
function renderAgents() {
  const tb = $("agents"), A = state.cfg.agents;
  tb.innerHTML = A.map((a, i) => `<tr data-agent="${i}">` +
    `<td><span class="chip" style="background:${avar(i)}">${NAMES[i]}</span></td>` +
    `<td><input type="number" id="ag-${i}-u0" min="0" step="1" value="${a.u0}" aria-label="u(0) ${NAMES[i]}"></td>` +
    `<td><input type="number" id="ag-${i}-lam" min="1" step="1" value="${a.lam}" aria-label="λ ${NAMES[i]}"></td>` +
    `<td><input type="number" id="ag-${i}-sig" min="${a.lam + 1}" step="1" value="${a.sig}" aria-label="σ ${NAMES[i]}"></td>` +
    `<td class="x" title="${fmt(a.lam / a.sig)}">${fracStr(a.lam, a.sig)}</td>` +
    `<td>${A.length > 1 ? `<button class="del" type="button" data-del="${i}" title="${tr("remove_agent", { a: NAMES[i] })}" aria-label="${tr("remove_agent", { a: NAMES[i] })}">×</button>` : ""}</td></tr>`).join("");
  tb.querySelectorAll("input").forEach(inp => {
    inp.addEventListener("change", () => commitAgent(inp));
    inp.addEventListener("keydown", e => { if (e.key === "Enter") inp.blur(); });
  });
  tb.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => {
    const d = +b.dataset.del; state.cfg.agents.splice(d, 1); state.cfg.prio = state.cfg.prio.filter(i => i !== d).map(i => (i > d ? i - 1 : i));
    state.cfg.boosts = state.cfg.boosts.filter(x => x.agent !== d).map(x => ({ ...x, agent: x.agent > d ? x.agent - 1 : x.agent }));
    hidden.clear(); renderChi(); custom(); renderAgents(); renderBoosts(); rebuild(); renderLegends();
  }));
  tb.querySelectorAll("tr").forEach(r => { r.onmouseenter = () => onHover("a" + r.dataset.agent); r.onmouseleave = () => onHover(null); });
  $("addagent").disabled = A.length >= Model.MAX_AGENTS;
  $("addagent").title = A.length >= Model.MAX_AGENTS ? tr("agent_full") : "";
}
function commitAgent(inp) {
  const [, si, key] = inp.id.split("-"), i = +si, a = state.cfg.agents[i];
  const v = Number(inp.value);
  if (key === "u0") {
    if (!Number.isInteger(v) || v < 0) { flash(tr("err_u0")); inp.value = a.u0; return; }
    a.u0 = v;
  } else if (key === "lam") {
    if (!Number.isInteger(v) || v < 1) { flash(tr("err_lam")); inp.value = a.lam; return; }
    a.lam = v;
    if (a.sig <= a.lam) { a.sig = a.lam + 1; flash(tr("err_sigma", { a: NAMES[i], v: a.sig })); }
  } else {
    if (!Number.isInteger(v) || v <= a.lam) { a.sig = Math.max(a.lam + 1, Number.isInteger(v) ? v : a.sig); flash(tr("err_sigma", { a: NAMES[i], v: a.sig })); }
    else a.sig = v;
  }
  // mise à jour de la ligne sur place : le focus reste où l'utilisateur l'a mis (Tab vers la case suivante)
  $(`ag-${i}-u0`).value = a.u0; $(`ag-${i}-lam`).value = a.lam;
  const s = $(`ag-${i}-sig`); s.value = a.sig; s.min = a.lam + 1;
  const xc = inp.closest("tr").querySelector("td.x"); xc.textContent = fracStr(a.lam, a.sig); xc.title = fmt(a.lam / a.sig);
  custom(); rebuild(); renderLegends();
}
function custom() {
  state.preset = "custom"; $("preset").value = "custom"; $("presethint").textContent = "";
}

/* ---------- Apports ponctuels de ressource : σ_i := σ_i + q, une seule fois, à l'instant t ---------- */
function renderBoosts() {
  const tb = $("boosts"), Bs = state.cfg.boosts, n = state.cfg.agents.length;
  $("boosttab").hidden = !Bs.length;
  tb.innerHTML = Bs.map((b, j) => `<tr data-agent="${b.agent}">` +
    `<td><select id="bo-${j}-agent" aria-label="${tr("col_boost_agent")}">${Array.from({ length: n }, (_, i) => `<option value="${i}"${i === b.agent ? " selected" : ""}>${NAMES[i]}</option>`).join("")}</select></td>` +
    `<td><input type="number" id="bo-${j}-t" min="0" step="1" value="${b.t}" aria-label="t"></td>` +
    `<td><input type="number" id="bo-${j}-q" min="1" step="1" value="${b.q}" aria-label="${tr("col_boost_q")}"></td>` +
    `<td><button class="del" type="button" data-bdel="${j}" title="${tr("remove_boost")}" aria-label="${tr("remove_boost")}">×</button></td></tr>`).join("");
  tb.querySelectorAll("select").forEach(sel => { sel.style.boxShadow = `inset 4px 0 0 ${avar(+sel.value)}`; });
  tb.querySelectorAll("input, select").forEach(inp => {
    inp.addEventListener("change", () => commitBoost(inp));
    inp.addEventListener("keydown", e => { if (e.key === "Enter") inp.blur(); });
  });
  tb.querySelectorAll("[data-bdel]").forEach(b => b.addEventListener("click", () => {
    state.cfg.boosts.splice(+b.dataset.bdel, 1); custom(); renderBoosts(); rebuild();
  }));
  tb.querySelectorAll("tr").forEach(r => { r.onmouseenter = () => onHover("a" + r.dataset.agent); r.onmouseleave = () => onHover(null); });
}
function commitBoost(inp) {
  const [, sj, key] = inp.id.split("-"), b = state.cfg.boosts[+sj], v = Number(inp.value);
  if (key === "agent") b.agent = v;
  else if (key === "t") { if (!Number.isInteger(v) || v < 0 || v > MAX_T) { flash(tr("err_boost_t"), "boostmsg"); inp.value = b.t; return; } b.t = v; }
  else { if (!Number.isInteger(v) || v < 1) { flash(tr("err_boost_q"), "boostmsg"); inp.value = b.q; return; } b.q = v; }
  if (key === "agent") { inp.style.boxShadow = `inset 4px 0 0 ${avar(v)}`; inp.closest("tr").dataset.agent = v; }
  custom(); rebuild();
}

/* =============================================================================
   Scénarios, politique, options
   ============================================================================= */
function loadPreset(key) {
  const P = PRESETS[key]; if (!P) return;
  state.preset = key;
  state.cfg = { agents: P.agents.map(([u0, lam, sig]) => ({ u0, lam, sig })), chi: P.chi || state.cfg.chi || "prio",
    prio: P.prio ? P.prio.slice() : Array.from({ length: P.agents.length }, (_, i) => i), seed: 1, boosts: (P.boosts || []).map(b => ({ ...b })) };
  hidden.clear();
  tc = 0; renderAll(); rebuild(); renderLegends();
}
function renderPresets() {
  const P = tr("presets");
  $("preset").innerHTML = Object.keys(PRESETS).map(k => `<option value="${k}">${P[k][0]}</option>`).join("") +
    `<option value="custom">${tr("scenario_custom")}</option>`;
  $("preset").value = state.preset;
  $("presethint").textContent = state.preset !== "custom" ? P[state.preset][1] : "";
}
function renderChi() {
  $("chi").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === state.cfg.chi));
  $("priobox").hidden = state.cfg.chi !== "prio";
  renderPrio();
  $("chihint").textContent = tr("chi_hint_" + state.cfg.chi);
  $("reroll").hidden = state.cfg.chi !== "random";
}
/* Ordre de priorité : glisser-déposer, ou ← → sur un agent sélectionné */
function renderPrio(focusAgent) {
  const L = $("priolist"), P = state.cfg.prio;
  L.innerHTML = P.map((i, r) => `<li draggable="true" data-agent="${i}"><button type="button" class="chip" style="background:${avar(i)}" ` +
    `title="${tr("prio_move", { a: NAMES[i], r: r + 1 })}" aria-label="${tr("prio_move", { a: NAMES[i], r: r + 1 })}">${NAMES[i]}</button></li>`).join("");
  L.querySelectorAll("li").forEach(li => { li.onmouseenter = () => onHover("a" + li.dataset.agent); li.onmouseleave = () => onHover(null); });
  if (focusAgent !== undefined) { const b = L.querySelector(`li[data-agent="${focusAgent}"] button`); if (b) b.focus(); }
}
function setPrio(p, focusAgent) { state.cfg.prio = p; renderPrio(focusAgent); rebuild(); }
function wirePrio() {
  const L = $("priolist"); let drag = null;
  L.addEventListener("dragstart", e => { const li = e.target.closest("li"); if (!li) return; drag = +li.dataset.agent; li.classList.add("dragging"); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(drag)); });
  L.addEventListener("dragend", () => { drag = null; L.querySelectorAll("li").forEach(li => li.classList.remove("dragging", "over")); });
  L.addEventListener("dragover", e => {
    const li = e.target.closest("li"); if (drag === null || !li) return;
    e.preventDefault(); L.querySelectorAll("li").forEach(x => x.classList.toggle("over", x === li && +li.dataset.agent !== drag));
  });
  L.addEventListener("drop", e => {
    const li = e.target.closest("li"); if (drag === null || !li) return; e.preventDefault();
    const to = +li.dataset.agent; if (to === drag) return;
    const p = state.cfg.prio.filter(i => i !== drag); p.splice(p.indexOf(to), 0, drag);   // se place avant l'agent visé
    setPrio(p);
  });
  L.addEventListener("keydown", e => {
    const li = e.target.closest("li"); if (!li || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
    e.preventDefault(); e.stopPropagation();
    const a = +li.dataset.agent, p = state.cfg.prio.slice(), r = p.indexOf(a), q = r + (e.key === "ArrowLeft" ? -1 : 1);
    if (q < 0 || q >= p.length) return;
    [p[r], p[q]] = [p[q], p[r]]; setPrio(p, a);
  });
  $("prioreset").addEventListener("click", () => setPrio(state.cfg.agents.map((_, i) => i)));
  $("priorev").addEventListener("click", () => setPrio(state.cfg.prio.slice().reverse()));
}
function renderKnobs() {
  $("speed").value = state.speedIdx; $("speedval").textContent = nf1.format(SPEEDS[state.speedIdx]);
  $("win").value = state.win; $("winval").textContent = state.win;
  $("whole").checked = state.whole; $("norm").checked = state.norm; $("mean").checked = state.mean;
  $("histsrc").value = state.histsrc;
}
function renderSelects() {
  const G = tr("glob_opts"), P = tr("per_opts");
  $("globsel").innerHTML = Object.entries(G).map(([k, v]) => `<option value="${k}">${v}</option>`).join(""); $("globsel").value = state.glob;
  $("persel").innerHTML = Object.entries(P).map(([k, v]) => `<option value="${k}">${v}</option>`).join(""); $("persel").value = state.per;
}
function renderAbout() {
  $("aboutname").textContent = ABOUT.name;
  $("aboutrole").textContent = ABOUT.role[state.lang] || ABOUT.role.fr;
  $("contacts").innerHTML = ABOUT.links.map(l =>
    `<a class="contact" href="${l.url}" ${l.url.startsWith("mailto:") ? "" : 'target="_blank" rel="noopener"'}><svg viewBox="0 0 24 24"><path d="${ICONS[l.icon]}"/></svg><span>${l.key ? tr(l.key) : l.label}</span></a>`).join("");
}
function applyLang() {
  setFormats();
  document.documentElement.lang = state.lang;
  document.title = tr("doc_title");
  document.querySelectorAll("[data-i18n]").forEach(el => { el.innerHTML = tr(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-title]").forEach(el => { el.title = tr(el.dataset.i18nTitle); });
  document.querySelectorAll(".langtoggle button").forEach(b => b.setAttribute("aria-pressed", b.dataset.lang === state.lang));
  document.querySelector(".langtoggle").classList.toggle("en", state.lang === "en");
  $("modeltext").innerHTML = MODEL_TEXT[state.lang];
  renderMath();
  $("playtxt").textContent = tr(playing ? "pause" : "play");
}
function renderAll() {
  applyLang(); renderPresets(); renderChi(); renderKnobs(); renderSelects(); renderAgents(); renderBoosts(); renderAbout();
}
function setTab(t) {
  state.tab = t;
  for (const k of ["sim", "ana", "model", "about"]) { $("v-" + k).hidden = k !== t; $("tab-" + k).setAttribute("aria-selected", k === t); }
  $("toolbar").hidden = t === "model" || t === "about";
  lastT = -1; dirty = true; save();
}

/* =============================================================================
   Sauvegarde locale et lien partageable
   ============================================================================= */
function snapshot() {
  const { lang, tab, preset, cfg, norm, mean, win, whole, histsrc, glob, per } = state;
  return { lang, tab, preset, cfg, norm, mean, speed: SPEEDS[state.speedIdx], win, whole, histsrc, glob, per };
}
function save() { try { localStorage.setItem(STORE, JSON.stringify(snapshot())); } catch (e) { /* stockage indisponible */ } }
function validCfg(c) {
  if (!c || !Array.isArray(c.agents) || c.agents.length < 1 || c.agents.length > Model.MAX_AGENTS) return null;
  const agents = c.agents.map(a => ({ u0: Number(a.u0), lam: Number(a.lam), sig: Number(a.sig) }));
  if (!agents.every(a => Number.isInteger(a.u0) && a.u0 >= 0 && Number.isInteger(a.lam) && a.lam >= 1 && Number.isInteger(a.sig) && a.sig > a.lam)) return null;
  const n = agents.length, id = Array.from({ length: n }, (_, i) => i);
  // anciennes valeurs : "min" = ordre A, B, C… ; "max" = ordre inverse
  const chi = Model.CHIS.includes(c.chi) ? c.chi : "prio";
  const prio = c.chi === "max" ? id.slice().reverse() : Model.normPrio(c.prio, n);
  const boosts = (Array.isArray(c.boosts) ? c.boosts : []).map(b => ({ agent: Number(b.agent), t: Number(b.t), q: Number(b.q) }))
    .filter(b => Number.isInteger(b.agent) && b.agent >= 0 && b.agent < n && Number.isInteger(b.t) && b.t >= 0 && b.t <= MAX_T && Number.isInteger(b.q) && b.q >= 1);
  return { agents, chi, prio, seed: Number.isInteger(c.seed) ? c.seed : 1, boosts };
}
function restore(obj) {
  if (!obj || typeof obj !== "object") return false;
  const cfg = validCfg(obj.cfg); if (!cfg) return false;
  state.cfg = cfg;
  state.preset = obj.preset in PRESETS ? obj.preset : "custom";
  if (["fr", "en"].includes(obj.lang)) state.lang = obj.lang;
  if (["sim", "ana", "model", "about"].includes(obj.tab)) state.tab = obj.tab;
  for (const k of ["norm", "mean", "whole"]) if (typeof obj[k] === "boolean") state[k] = obj[k];
  if (SPEEDS.includes(obj.speed)) state.speedIdx = SPEEDS.indexOf(obj.speed);
  else if (Number.isInteger(obj.speedIdx) && SPEEDS[obj.speedIdx + 1]) state.speedIdx = obj.speedIdx + 1;   // ancien format (sans 1/4)
  if (Number.isInteger(obj.win) && obj.win >= 10 && obj.win <= 300) state.win = obj.win;
  if (["all", "win", "per"].includes(obj.histsrc)) state.histsrc = obj.histsrc;
  if (obj.glob in I18N.fr.glob_opts) state.glob = obj.glob;
  if (obj.per in I18N.fr.per_opts) state.per = obj.per;
  if (Number.isFinite(obj.t) && obj.t >= 0) tc = Math.min(MAX_T, Math.floor(obj.t));
  return true;
}
const b64e = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64d = s => decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));
function shareLink() {
  const o = { ...snapshot(), t: Math.floor(tc) };
  return location.href.split("#")[0] + "#s=" + b64e(JSON.stringify(o));
}

/* =============================================================================
   Exports
   ============================================================================= */
function toast(msg) {
  const el = $("toast"); el.textContent = msg; el.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => { el.hidden = true; }, 2600);
}
function download(name, blob) {
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast(tr("toast_saved", { f: name }));
}
const csvNum = v => (v === null || v === undefined || !isFinite(v) ? "" : String(Math.round(v * 1e9) / 1e9));
const csv = rows => rows.map(r => r.join(",")).join("\n") + "\n";
function stamp() { return `${sim.n}ag_${state.cfg.agents.map(a => `${a.lam}-${a.sig}`).join("_")}`; }

function exportTraj() {
  const T = Math.floor(tc), n = sim.n, L = [...NAMES.slice(0, n)];
  const rows = [["t", "served", "ties", ...L.map(a => "u_" + a), ...L.map(a => "N_" + a), ...L.map(a => "y_" + a), "waste_g", "Gamma"]];
  for (let t = 0; t <= T; t++) {
    rows.push([t, t < T ? NAMES[sim.served(t)] : "", t < T ? sim.ties(t) : "", ...sim.row(t), ...sim.Nrow(t),
      ...L.map((_, i) => (t ? csvNum(sim.Nc(t, i) / t) : "")), t < T ? sim.waste(t) : "", csvNum(sim.gamma(t))]);
  }
  const meta = `# lambda=${sim.lam.join(" ")} ; sigma=${sim.sig.join(" ")} ; u0=${state.cfg.agents.map(a => a.u0).join(" ")} ; chi=${state.cfg.chi} ; priority=${state.cfg.prio.map(i => NAMES[i]).join("")} ; seed=${state.cfg.seed} ; boosts=${state.cfg.boosts.map(b => `${NAMES[b.agent]}@${b.t}+${b.q}`).join(" ") || "none"}\n`;
  download(`trajectoire_${stamp()}_t${T}.csv`, new Blob([meta + csv(rows)], { type: "text/csv" }));
}
function exportAgents() {
  const T = Math.floor(tc), A = getAsym(), ok = A.status === "ok";
  const head = ["agent", "u0", "lambda", "sigma", "x", "u_t", "N_t", "y_t", "r_t", "mean_u_since_0", "Gamma_i"];
  if (ok) head.push("peak", "trough", "mean_period", "y_period", "gamma_per_step", "tau", "tau0");
  const rows = [head];
  for (let i = 0; i < sim.n; i++) {
    const y = sim.y(T, i);
    const r = [NAMES[i], state.cfg.agents[i].u0, sim.lam[i], sim.sig[i], csvNum(info.x[i]), sim.U(T, i), sim.Nc(T, i), csvNum(y),
      csvNum(y === null ? null : info.x[i] - y), csvNum(sim.meanU(T, i)), csvNum(sim.GAc(T, i))];
    if (ok) { const a = A.agents[i]; r.push(a.hi, a.lo, csvNum(a.mean), csvNum(a.y), csvNum(a.gamma), A.tau, A.tau0); }
    rows.push(r);
  }
  download(`agents_${stamp()}_t${T}.csv`, new Blob([`# t=${T} ; X=${info.Xf.p}/${info.Xf.q} ; chi=${state.cfg.chi} ; priority=${state.cfg.prio.map(i => NAMES[i]).join("")}\n` + csv(rows)], { type: "text/csv" }));
}
/** Image d'un tracé : titre et légende au-dessus, fond opaque, sans le survol. */
function exportPng(which) {
  const map = { main: ["c-main", () => drawMain(), $("maintitle").textContent, "legend"],
    hist: ["c-hist", () => drawHist(), tr("hist_title"), null],
    glob: ["c-glob", () => drawGlob(), $("globsel").selectedOptions[0].textContent, "globlegend"],
    per: ["c-per", () => drawPer(), $("persel").selectedOptions[0].textContent, "perlegend"] };
  const [cid, redraw, title, legId] = map[which], cv = $(cid);
  const keep = hover; hover = null; for (const c of Object.values(charts)) { c.setHover(null); c.emph && c.emph.clear(); if (c.tip) c.tip.hidden = true; }
  redraw();
  const dpr = window.devicePixelRatio || 1, head = 52 * dpr, out = document.createElement("canvas");
  out.width = cv.width; out.height = cv.height + head;
  const g = out.getContext("2d");
  g.fillStyle = Charts.css("--panel"); g.fillRect(0, 0, out.width, out.height);
  g.scale(dpr, dpr);
  g.fillStyle = Charts.css("--fg"); g.font = `600 14px ${Charts.css("--font")}`; g.textBaseline = "top";
  const Xs = info.Xf.q === 1 ? String(info.Xf.p) : `${info.Xf.p}/${info.Xf.q}`;
  g.fillText(`${title}   ·   X = ${Xs} (${tr("regime_" + info.regime)})   ·   t = ${Math.floor(tc)}`, 46, 10);
  // légende
  let x = 46; g.font = `12px ${Charts.css("--font")}`; g.textBaseline = "middle";
  const items = legId ? [...$(legId).querySelectorAll("button")].filter(b => !b.classList.contains("off")).map(b => { const c = getComputedStyle(b.querySelector("i")).backgroundColor; return { c: /^rgba\(.*,\s*0\)$|transparent/.test(c) ? Charts.css("--muted") : c, l: b.textContent }; })
    : [{ c: Charts.css("--fg"), l: tr("hist_common") }, { c: Charts.css("--plus"), l: tr("hist_plus") }, { c: Charts.css("--minus"), l: tr("hist_minus") }];
  for (const it of items) { g.fillStyle = it.c; g.fillRect(x, 35, 14, 3); g.fillStyle = Charts.css("--fg"); g.fillText(it.l, x + 19, 37); x += 19 + g.measureText(it.l).width + 16; }
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(cv, 0, head);
  hover = keep; syncHover();
  out.toBlob(b => download(`${which}_${stamp()}_t${Math.floor(tc)}.png`, b), "image/png");
}
function exportJson() {
  const o = { app: "convivium-simulateur", version: 1, cfg: state.cfg, t: Math.floor(tc) };
  download(`scenario_${stamp()}.json`, new Blob([JSON.stringify(o, null, 2)], { type: "application/json" }));
}
function importJson(file) {
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const o = JSON.parse(rd.result), cfg = validCfg(o.cfg || o);
      if (!cfg) throw new Error("bad");
      state.cfg = cfg; state.preset = "custom"; hidden.clear();
      tc = Number.isFinite(o.t) ? Math.max(0, Math.min(MAX_T, Math.floor(o.t))) : 0;
      renderAll(); rebuild(); renderLegends(); toast(tr("toast_imported"));
    } catch (e) { toast(tr("toast_import_err")); }
  };
  rd.readAsText(file);
}
async function copyLink() {
  const url = shareLink();
  try { await navigator.clipboard.writeText(url); toast(tr("toast_copied")); }
  catch (e) { window.prompt("URL", url); }
}

/* =============================================================================
   Branchements
   ============================================================================= */
function wire() {
  document.querySelectorAll("[data-tab]").forEach(b => b.addEventListener("click", e => { e.preventDefault(); setTab(b.dataset.tab); }));
  document.querySelectorAll(".langtoggle button").forEach(b => b.addEventListener("click", () => {
    state.lang = b.dataset.lang; renderAll(); renderLegends(); lastT = -1; dirty = true; save();
  }));
  $("lk-github").href = ABOUT.links.find(l => l.icon === "github").url;
  $("lk-linkedin").href = ABOUT.links.find(l => l.icon === "linkedin").url;
  document.querySelectorAll("path[data-icon]").forEach(p => p.setAttribute("d", ICONS[p.dataset.icon]));

  $("play").addEventListener("click", () => setPlaying(!playing));
  $("fwd").addEventListener("click", () => jump(Math.floor(tc) + 1));
  $("back").addEventListener("click", () => jump(Math.ceil(tc) - 1));
  $("zero").addEventListener("click", () => jump(0));
  $("speed").addEventListener("input", e => { state.speedIdx = +e.target.value; renderKnobs(); save(); });
  $("win").addEventListener("input", e => { state.win = +e.target.value; renderKnobs(); dirty = true; lastT = -1; save(); });
  $("whole").addEventListener("change", e => { state.whole = e.target.checked; dirty = true; lastT = -1; save(); });

  $("preset").addEventListener("change", e => { if (e.target.value !== "custom") loadPreset(e.target.value); });
  $("chi").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; state.cfg.chi = b.dataset.v; renderChi(); rebuild(); });
  wirePrio();
  $("reroll").addEventListener("click", () => { state.cfg.seed++; rebuild(); });
  $("addagent").addEventListener("click", () => {
    if (state.cfg.agents.length >= Model.MAX_AGENTS) return;
    state.cfg.agents.push({ u0: 0, lam: 1, sig: 4 }); state.cfg.prio.push(state.cfg.agents.length - 1); renderChi(); custom(); renderAgents(); rebuild(); renderLegends();
    $(`ag-${state.cfg.agents.length - 1}-lam`).focus();
  });
  $("addboost").addEventListener("click", () => {
    state.cfg.boosts.push({ agent: 0, t: Math.floor(tc), q: 1 }); custom(); renderBoosts(); rebuild();
    $(`bo-${state.cfg.boosts.length - 1}-agent`).focus();
  });
  $("zerou0").addEventListener("click", () => { state.cfg.agents.forEach(a => { a.u0 = 0; }); custom(); renderAgents(); rebuild(); });
  $("norm").addEventListener("change", e => { state.norm = e.target.checked; charts.main.resetScale(); renderLegends(); dirty = true; save(); });
  $("mean").addEventListener("change", e => { state.mean = e.target.checked; renderLegends(); dirty = true; save(); });

  $("histsrc").addEventListener("change", e => { state.histsrc = e.target.value; dirty = true; save(); });
  $("globsel").addEventListener("change", e => { state.glob = e.target.value; charts.glob.resetScale(); renderLegends(); dirty = true; save(); });
  $("persel").addEventListener("change", e => { state.per = e.target.value; charts.per.resetScale(); dirty = true; save(); });
  document.querySelectorAll("[data-png]").forEach(b => b.addEventListener("click", () => exportPng(b.dataset.png)));

  // menu d'export
  const menu = $("expmenu"), list = menu.querySelector(".menu-list"), btn = $("expbtn");
  const close = () => { list.hidden = true; btn.setAttribute("aria-expanded", "false"); };
  btn.addEventListener("click", () => { list.hidden = !list.hidden; btn.setAttribute("aria-expanded", String(!list.hidden)); if (!list.hidden) list.querySelector("button").focus(); });
  document.addEventListener("click", e => { if (!menu.contains(e.target)) close(); });
  list.addEventListener("click", e => {
    const b = e.target.closest("[data-exp]"); if (!b) return; close();
    const k = b.dataset.exp;
    if (k === "traj") exportTraj();
    else if (k === "agents") exportAgents();
    else if (k === "png") { if (state.tab !== "sim") { setTab("sim"); render(); } exportPng("main"); }
    else if (k === "json") exportJson();
    else if (k === "import") $("importfile").click();
    else if (k === "link") copyLink();
  });
  $("importfile").addEventListener("change", e => { if (e.target.files[0]) importJson(e.target.files[0]); e.target.value = ""; });

  // clavier
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") { close(); return; }
    const tag = (e.target.tagName || "").toLowerCase();
    if (["input", "select", "textarea"].includes(tag) && e.target.type !== "range" && e.target.type !== "checkbox") return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest && e.target.closest(".priolist")) return;
    if (state.tab !== "sim" && state.tab !== "ana") return;
    if (e.key === " " && tag !== "button") { e.preventDefault(); setPlaying(!playing); }
    else if (e.key === "ArrowRight" && e.target.type !== "range") { e.preventDefault(); jump(Math.floor(tc) + 1); }
    else if (e.key === "ArrowLeft" && e.target.type !== "range") { e.preventDefault(); jump(Math.ceil(tc) - 1); }
    else if (e.key === "Home") { e.preventDefault(); jump(0); }
  });

  // redimensionnement et thème
  const ro = new ResizeObserver(() => { dirty = true; });
  document.querySelectorAll(".chartbox").forEach(b => ro.observe(b));
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { Charts.clearCss(); renderAgents(); renderBoosts(); renderLegends(); lastT = -1; dirty = true; });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { dirty = true; });
}

/* =============================================================================
   Démarrage : lien partagé > dernière session > scénario par défaut
   ============================================================================= */
(function start() {
  charts.main = new Charts.LineChart($("c-main"), { fmt: v => fmt(v), onHover });
  charts.glob = new Charts.LineChart($("c-glob"), { fmt: v => fmt(v), onHover });
  charts.per = new Charts.LineChart($("c-per"), { fmt: v => fmt(v), onHover });
  charts.hist = new Charts.HistChart($("c-hist"), { fmt: v => fmt(v), onHover,
    text: { get need() { return tr("hist_need"); }, get share() { return tr("hist_share"); }, get plus() { return tr("hist_plus"); }, get minus() { return tr("hist_minus"); }, get ref() { return tr("hist_ref_short"); } } });

  state.lang = (navigator.language || "fr").toLowerCase().startsWith("fr") ? "fr" : "en";
  let ok = false;
  const m = location.hash.match(/^#s=([\w-]+)/);
  if (m) { try { ok = restore(JSON.parse(b64d(m[1]))); } catch (e) { ok = false; } history.replaceState(null, "", location.pathname + location.search); }
  if (!ok) { try { ok = restore(JSON.parse(localStorage.getItem(STORE))); } catch (e) { ok = false; } tc = 0; }
  const qlang = new URLSearchParams(location.search).get("lang");   // ?lang=fr|en l'emporte (lien depuis l'accueil)
  if (qlang === "fr" || qlang === "en") state.lang = qlang;
  if (!ok) { const P = PRESETS.eq5; state.cfg = { agents: P.agents.map(([u0, lam, sig]) => ({ u0, lam, sig })), chi: "prio", prio: P.agents.map((_, i) => i), seed: 1, boosts: [] }; }

  wire();
  renderAll();
  rebuild();
  renderLegends();
  setTab(state.tab);
  setPlaying(!m && !matchMedia("(prefers-reduced-motion: reduce)").matches);
  requestAnimationFrame(frame);
})();
