/* =============================================================================
   Tracés sur <canvas> : courbes (avec survol, halo, infobulle, bande des agents servis)
   et histogramme besoins / parts. Aucune bibliothèque.
   ============================================================================= */
"use strict";

const Charts = (() => {
  const cssCache = new Map();
  const css = name => {
    let v = cssCache.get(name);
    if (v === undefined) { v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); cssCache.set(name, v); }
    return v;
  };
  const clearCss = () => cssCache.clear();

  /** Graduations « rondes » (1, 2, 5 × 10^k) */
  function niceStep(range, count) {
    const raw = range / Math.max(1, count), p = Math.pow(10, Math.floor(Math.log10(raw)));
    for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= raw - 1e-12) return m * p;
    return 10 * p;
  }
  function setup(cv) {
    const box = cv.parentElement, dpr = window.devicePixelRatio || 1, W = box.clientWidth, H = box.clientHeight;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    return [g, W, H];
  }
  function hatch(color, dir) {
    const c = document.createElement("canvas"); c.width = c.height = 8;
    const g = c.getContext("2d"); g.strokeStyle = color; g.lineWidth = 1.2;
    g.beginPath();
    if (dir > 0) { g.moveTo(0, 8); g.lineTo(8, 0); g.moveTo(-2, 2); g.lineTo(2, -2); g.moveTo(6, 10); g.lineTo(10, 6); }
    else { g.moveTo(0, 0); g.lineTo(8, 8); g.moveTo(-2, 6); g.lineTo(2, 10); g.moveTo(6, -2); g.lineTo(10, 2); }
    g.stroke();
    return c;
  }

  /* ---------------------------------------------------------------------------
     Courbes.
     spec = {
       series: [{ id, color, label, width, dash, value: t => nombre | null, hidden }],
       x0, x1, tEnd,               // fenêtre en abscisse, instant courant (réel)
       ribbon: { served: t => k, color: k => couleur, name: k => lettre } | null,
       refs: [{ y, color, label, dash }],
       endLabels: bool, integerY: bool, yLabel: texte
     }
     L'objet renvoyé garde la géométrie du dernier tracé pour le survol.
     --------------------------------------------------------------------------- */
  class LineChart {
    constructor(canvas, opts = {}) {
      this.cv = canvas; this.opts = opts; this.view = null; this.emph = new Map();
      this.hoverId = null; this.mouse = null; this.geom = null; this.spec = null;
      this.onHover = opts.onHover || (() => {});
      this.tip = document.createElement("div"); this.tip.className = "tip"; this.tip.hidden = true;
      canvas.parentElement.appendChild(this.tip);
      canvas.addEventListener("pointermove", e => this.move(e));
      canvas.addEventListener("pointerleave", () => { this.mouse = null; this.tip.hidden = true; this.setHover(null); this.onHover(null, true); });
    }
    resetScale() { this.view = null; }
    setHover(id) { this.hoverId = id; }

    move(e) {
      const r = this.cv.getBoundingClientRect();
      this.mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
      this.hitTest();
    }
    /** Courbe la plus proche du pointeur (distance au segment, en pixels). */
    hitTest() {
      const G = this.geom, S = this.spec, m = this.mouse;
      if (!G || !S || !m) return;
      if (m.x < G.L || m.x > G.L + G.pw || m.y < G.T - 4 || m.y > G.T + G.ph + G.rib + 4) {
        this.tip.hidden = true; this.setHover(null); this.onHover(null, false); return;
      }
      const t = G.tx(m.x), ta = Math.floor(t), tb = ta + 1;
      let best = null, bd = 14;
      for (const s of S.series) {
        if (s.hidden) continue;
        const va = s.value(ta), vb = s.value(Math.min(tb, Math.floor(S.tEnd)));
        if (va === null || !isFinite(va)) continue;
        const xa = G.X(ta), ya = G.Y(va), xb = G.X(tb), yb = vb === null ? ya : G.Y(vb);
        const dx = xb - xa, dy = yb - ya, L2 = dx * dx + dy * dy || 1;
        const k = Math.max(0, Math.min(1, ((m.x - xa) * dx + (m.y - ya) * dy) / L2));
        const d = Math.hypot(m.x - (xa + k * dx), m.y - (ya + k * dy));
        if (d < bd) { bd = d; best = s.id; }
      }
      this.setHover(best); this.onHover(best, false);
      this.renderTip(Math.round(t));
    }
    renderTip(t) {
      const S = this.spec, G = this.geom, fmt = this.opts.fmt || (v => String(v));
      t = Math.max(0, Math.min(t, Math.floor(S.tEnd)));
      const rows = S.series.filter(s => !s.hidden).map(s => ({ s, v: s.value(t) })).filter(r => r.v !== null && isFinite(r.v));
      if (!rows.length) { this.tip.hidden = true; return; }
      rows.sort((a, b) => b.v - a.v);
      let head = `<b>t = ${t}</b>`;
      if (S.ribbon && t < S.tEnd) {
        const k = S.ribbon.served(t);
        if (k !== null && k >= 0) head += ` · ${S.ribbon.servedLabel} <span class="sw" style="margin-left:4px;background:${S.ribbon.color(k)}"></span> ${S.ribbon.name(k)}` +
          (S.ribbon.ties && S.ribbon.ties(t) > 1 ? ` <span class="muted">(${S.ribbon.tieLabel(S.ribbon.ties(t))})</span>` : "");
      }
      this.tip.innerHTML = head + rows.map(({ s, v }) =>
        `<div class="${s.id === this.hoverId ? "on" : ""}"><span class="sw" style="background:${s.color}"></span>${s.label}<span class="v">${fmt(v)}</span></div>`).join("");
      this.tip.hidden = false;
      const bw = this.cv.parentElement.clientWidth, tw = this.tip.offsetWidth, x = G.X(t);
      this.tip.style.left = (x + 14 + tw > bw ? x - 14 - tw : x + 14) + "px";
      this.tip.style.top = Math.max(0, Math.min(this.mouse.y - 20, G.T + G.ph - this.tip.offsetHeight)) + "px";
      this.tipT = t;
    }

    /** Renvoie true tant qu'une animation de mise en avant est en cours. */
    draw(spec) {
      this.spec = spec;
      const [g, W, H] = setup(this.cv);
      const rib = spec.ribbon ? 20 : 0;
      const L = 46, R = spec.endLabels ? 30 : 14, T = 12, B = 26 + rib, pw = W - L - R, ph = H - T - B;
      if (pw < 30 || ph < 30) return false;
      const { x0, x1, tEnd } = spec;
      const tA = Math.max(0, Math.floor(x0)), tB = Math.min(Math.ceil(tEnd), Math.ceil(x1));

      const tLast = Math.floor(tEnd), fr = tEnd - tLast;
      // Plus d'instants que de pixels : enveloppe (premier, min, max, dernier) par colonne de pixels,
      // calculée une fois et servant à l'échelle comme au dessin. Au plus ~48 points lus par colonne :
      // le coût d'une image ne dépend plus de la durée affichée.
      const dense = (tLast - tA) / pw > 2, env = new Map();
      if (dense) {
        const per = (x1 - x0) / pw;
        for (const s of spec.series) if (!s.hidden) {
          const cols = [];
          for (let c = 0, ta = tA; ta <= tLast; c++) {
            const tb = Math.min(tLast, Math.max(ta, Math.floor(x0 + (c + 1) * per)));
            const step = Math.max(1, Math.floor((tb - ta + 1) / 48));
            let mn = Infinity, mx = -Infinity, first = null, last = null;
            for (let t = ta; t <= tb; t = t + step > tb && t < tb ? tb : t + step) {
              const y = s.value(t); if (y === null || !isFinite(y)) continue;
              if (first === null) first = y; last = y; if (y < mn) mn = y; if (y > mx) mx = y;
            }
            cols.push(first === null ? null : [(ta + tb) / 2, first, mn, mx, last]);
            ta = tb + 1;
          }
          env.set(s.id, cols);
        }
      }

      // échelle verticale : englobe les valeurs visibles et 0, lissée d'un tracé à l'autre
      let lo = 0, hi = -Infinity;
      for (const s of spec.series) if (!s.hidden) {
        if (dense) { for (const c of env.get(s.id)) if (c) { if (c[2] < lo) lo = c[2]; if (c[3] > hi) hi = c[3]; } }
        else for (let t = tA; t <= tB; t++) { const v = s.value(t); if (v !== null && isFinite(v)) { if (v < lo) lo = v; if (v > hi) hi = v; } }
      }
      for (const r of spec.refs || []) { if (r.y < lo) lo = r.y; if (r.y > hi) hi = r.y; }
      if (!isFinite(hi)) hi = 1;
      const span = hi - lo || 1;
      if (spec.integerY) { lo = Math.floor(lo); hi = Math.ceil(hi + 0.06 * span); if (hi - lo < 2) hi = lo + 2; }
      else { hi += 0.08 * span; if (lo < 0) lo -= 0.08 * span; }
      let v = this.view;
      if (!v) v = { lo, hi };
      else { const k = 0.2; v.lo += (lo - v.lo) * k; v.hi += (hi - v.hi) * k; if (Math.abs(v.lo - lo) < 1e-3 * span) v.lo = lo; if (Math.abs(v.hi - hi) < 1e-3 * span) v.hi = hi; }
      this.view = v;
      let moving = v.lo !== lo || v.hi !== hi;
      const X = t => L + (t - x0) / (x1 - x0) * pw, Y = y => T + (1 - (y - v.lo) / (v.hi - v.lo)) * ph;
      this.geom = { L, T, pw, ph, rib, X, Y, tx: px => x0 + (px - L) / pw * (x1 - x0) };

      // grille
      g.font = `11px ${css("--font")}`; g.lineWidth = 1;
      let ys = niceStep(v.hi - v.lo, Math.max(3, Math.floor(ph / 48)));
      if (spec.integerY) ys = Math.max(1, Math.round(ys));
      const fmt = this.opts.fmt || (x => String(x));
      g.textAlign = "right"; g.textBaseline = "middle";
      for (let y = Math.ceil(v.lo / ys - 1e-9) * ys; y <= v.hi + 1e-9; y += ys) {
        const yy = Y(y); if (yy < T - 1) continue;
        g.strokeStyle = Math.abs(y) < 1e-9 ? css("--line-strong") : css("--grid");
        g.beginPath(); g.moveTo(L, yy); g.lineTo(L + pw, yy); g.stroke();
        g.fillStyle = css("--muted"); g.fillText(fmt(Math.round(y / ys) * ys), L - 7, yy);
      }
      const xs = Math.max(1, Math.round(niceStep(x1 - x0, Math.max(3, Math.floor(pw / 80)))));
      g.textAlign = "center"; g.textBaseline = "top";
      for (let t = Math.ceil(x0 / xs) * xs; t <= x1 + 1e-9; t += xs) { g.fillStyle = css("--muted"); g.fillText(String(t), X(t), T + ph + rib + 8); }
      if (spec.yLabel) { g.save(); g.translate(11, T + ph / 2); g.rotate(-Math.PI / 2); g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = css("--muted"); g.fillText(spec.yLabel, 0, 0); g.restore(); }

      g.save(); g.beginPath(); g.rect(L, T - 2, pw, ph + 4); g.clip();
      // lignes de référence
      for (const r of spec.refs || []) {
        g.strokeStyle = r.color; g.globalAlpha = this.hoverId && r.id && r.id !== this.hoverId ? 0.25 : 0.8;
        g.setLineDash(r.dash || [5, 4]); g.lineWidth = 1.2;
        g.beginPath(); g.moveTo(L, Y(r.y)); g.lineTo(L + pw, Y(r.y)); g.stroke();
      }
      g.globalAlpha = 1; g.setLineDash([]);

      // mise en avant animée : e ∈ [−1, 1] (−1 estompé, 1 en avant)
      const any = this.hoverId && spec.series.some(s => s.id === this.hoverId);
      for (const s of spec.series) {
        const target = !any ? 0 : s.id === this.hoverId ? 1 : -1, cur = this.emph.get(s.id) ?? 0;
        const nx = Math.abs(target - cur) < 0.02 ? target : cur + (target - cur) * 0.28;
        if (nx !== target) moving = true;
        this.emph.set(s.id, nx);
      }
      const order = spec.series.filter(s => !s.hidden).sort((a, b) => (this.emph.get(a.id) || 0) - (this.emph.get(b.id) || 0));
      for (const s of order) {
        const e = this.emph.get(s.id) || 0, up = Math.max(0, e), down = Math.max(0, -e);
        g.globalAlpha = 1 - 0.68 * down;
        g.strokeStyle = s.color; g.lineWidth = (s.width || 1.8) + 1.8 * up; g.setLineDash(s.dash || []);
        g.lineJoin = "round"; g.lineCap = "round";
        if (up > 0) { g.shadowColor = s.color; g.shadowBlur = 12 * up; }
        g.beginPath();
        let pen = false;
        if (dense) {
          for (const c of env.get(s.id)) {
            if (!c) { pen = false; continue; }
            const xx = X(c[0]);
            pen ? g.lineTo(xx, Y(c[1])) : g.moveTo(xx, Y(c[1])); pen = true;
            g.lineTo(xx, Y(c[2])); g.lineTo(xx, Y(c[3])); g.lineTo(xx, Y(c[4]));
          }
        } else for (let t = tA; t <= tLast; t++) {
          const y = s.value(t);
          if (y === null || !isFinite(y)) { pen = false; continue; }
          pen ? g.lineTo(X(t), Y(y)) : g.moveTo(X(t), Y(y)); pen = true;
        }
        const y0 = s.value(tLast), y1 = s.value(tLast + 1);
        if (fr > 0 && pen && y0 !== null && y1 !== null) g.lineTo(X(tEnd), Y(y0 + (y1 - y0) * fr));
        g.stroke();
        g.shadowBlur = 0;
        if (up > 0.5 && s.points !== false) {                 // points sur la courbe mise en avant
          g.fillStyle = s.color;
          const step = Math.max(1, Math.ceil((tLast - tA) / (pw / 6)));
          for (let t = tA; t <= tLast; t += step) { const y = s.value(t); if (y !== null && isFinite(y)) { g.beginPath(); g.arc(X(t), Y(y), 2.2, 0, 7); g.fill(); } }
        }
      }
      g.globalAlpha = 1; g.setLineDash([]);

      // repère vertical à l'instant survolé
      if (this.mouse && !this.tip.hidden && this.tipT !== undefined) {
        g.strokeStyle = css("--muted"); g.globalAlpha = 0.5; g.lineWidth = 1;
        g.beginPath(); g.moveTo(X(this.tipT), T); g.lineTo(X(this.tipT), T + ph); g.stroke(); g.globalAlpha = 1;
      }
      g.restore();

      // étiquettes en bout de courbe
      if (spec.endLabels) {
        g.font = `600 11px ${css("--font")}`; g.textAlign = "left"; g.textBaseline = "middle";
        const tags = [];
        for (const s of spec.series) if (s.label && !s.hidden && s.endLabel !== false) {
          const y0 = s.value(tLast), y1 = s.value(tLast + 1); if (y0 === null || !isFinite(y0)) continue;
          tags.push({ s, y: Y(y1 === null || fr === 0 ? y0 : y0 + (y1 - y0) * fr) });
        }
        tags.sort((p, q) => p.y - q.y);
        for (let j = 1; j < tags.length; j++) tags[j].y = Math.max(tags[j].y, tags[j - 1].y + 12);
        for (let j = tags.length - 1, lim = T + ph; j >= 0; j--) { tags[j].y = Math.min(tags[j].y, lim); lim = tags[j].y - 12; }
        for (const { s, y } of tags) { g.globalAlpha = 1 - 0.6 * Math.max(0, -(this.emph.get(s.id) || 0)); g.fillStyle = s.color; g.fillText(s.label, Math.min(X(tEnd), L + pw) + 6, y); }
        g.globalAlpha = 1;
      }

      // bande des agents servis
      if (spec.ribbon) {
        const Rb = spec.ribbon, top = T + ph + 4, h = rib - 6;
        g.save(); g.beginPath(); g.rect(L, top, Math.max(0, Math.min(X(tEnd), L + pw) - L), h); g.clip();
        g.textAlign = "center"; g.textBaseline = "middle"; g.font = `600 10px ${css("--font")}`;
        const hk = this.hoverId && this.hoverId.startsWith("a") ? +this.hoverId.slice(1) : null;
        const stride = Math.max(1, Math.floor((x1 - x0) / pw));    // au plus une case par pixel
        for (let d = tA - (tA % stride); d < Math.min(tEnd, x1); d += stride) {
          const k = Rb.served(Math.max(d, tA)); if (k === null || k < 0) continue;
          const xa = X(d), xb = X(d + stride);
          g.globalAlpha = hk === null || hk === k ? 1 : 0.25;
          g.fillStyle = Rb.color(k); g.fillRect(xa + 0.5, top, Math.max(0.5, xb - xa - 1), h);
          if (xb - xa >= 12) { g.fillStyle = "#fff"; g.fillText(Rb.name(k), (xa + xb) / 2, top + h / 2 + 0.5); }
        }
        g.restore();
      }
      g.strokeStyle = css("--line"); g.lineWidth = 1; g.strokeRect(L + 0.5, T + 0.5, pw - 1, ph - 1);

      if (this.mouse && !this.tip.hidden) this.renderTip(this.tipT);
      return moving;
    }
  }

  /* ---------------------------------------------------------------------------
     Histogramme : pour chaque agent, besoin x_i (rectangle) et part y_i.
     Commun = min(x, y) ; vert hachuré = y − x > 0 ; rouge hachuré = x − y > 0.
     --------------------------------------------------------------------------- */
  class HistChart {
    constructor(canvas, opts = {}) {
      this.cv = canvas; this.opts = opts; this.hover = null; this.geom = null; this.data = null;
      this.onHover = opts.onHover || (() => {});
      this.tip = document.createElement("div"); this.tip.className = "tip"; this.tip.hidden = true;
      canvas.parentElement.appendChild(this.tip);
      canvas.addEventListener("pointermove", e => {
        const G = this.geom; if (!G) return;
        const r = canvas.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
        const k = Math.floor((mx - G.L) / G.slot);
        const inside = k >= 0 && k < this.data.x.length && my > G.T && my < G.T + G.ph + 22;
        this.hover = inside ? k : null; this.onHover(inside ? "a" + k : null, false);
        this.renderTip(mx, my);
      });
      canvas.addEventListener("pointerleave", () => { this.hover = null; this.tip.hidden = true; this.onHover(null, true); });
    }
    setHover(id) { this.hover = id && id.startsWith("a") ? +id.slice(1) : null; }
    renderTip(mx, my) {
      const D = this.data, k = this.hover, fmt = this.opts.fmt;
      if (k === null || !D || !D.y) { this.tip.hidden = true; return; }
      const d = D.y[k] - D.x[k], tr = this.opts.text;
      this.tip.innerHTML = `<b><span class="sw" style="background:${D.colors[k]}"></span>${D.names[k]}</b>` +
        `<div>${tr.need}<span class="v">${fmt(D.x[k])}</span></div>` +
        `<div>${tr.share}<span class="v">${fmt(D.y[k])}</span></div>` +
        `<div class="${d >= 0 ? "plus" : "minus"}">${d >= 0 ? tr.plus : tr.minus}<span class="v">${fmt(Math.abs(d))}</span></div>` +
        (D.ref ? `<div class="muted">${tr.ref}<span class="v">${fmt(D.ref[k])}</span></div>` : "");
      this.tip.hidden = false;
      const bw = this.cv.parentElement.clientWidth, tw = this.tip.offsetWidth;
      this.tip.style.left = (mx + 14 + tw > bw ? mx - 14 - tw : mx + 14) + "px";
      this.tip.style.top = Math.max(0, my - 30) + "px";
    }
    /** data = { x[], y[] | null, names[], colors[], ref[] | null, theta | null } */
    draw(data) {
      this.data = data;
      const [g, W, H] = setup(this.cv);
      const L = 46, R = 14, T = 14, B = 30, pw = W - L - R, ph = H - T - B, n = data.x.length;
      if (pw < 40 || ph < 40 || !n) return;
      const hi = 1;                                   // échelle fixe : besoins et parts sont dans [0, 1]
      const Y = v => T + (1 - v / hi) * ph, slot = pw / n, bw = Math.min(64, slot * 0.58);
      this.geom = { L, T, ph, slot };
      const fmt = this.opts.fmt;
      g.font = `11px ${css("--font")}`; g.textAlign = "right"; g.textBaseline = "middle";
      const ys = ph > 260 ? 0.1 : 0.2;
      for (let v = 0; v <= hi + 1e-9; v += ys) {
        g.strokeStyle = v === 0 ? css("--line-strong") : css("--grid"); g.lineWidth = 1;
        g.beginPath(); g.moveTo(L, Y(v)); g.lineTo(L + pw, Y(v)); g.stroke();
        g.fillStyle = css("--muted"); g.fillText(fmt(Math.round(v / ys) * ys), L - 7, Y(v));
      }
      const pPlus = g.createPattern(hatch(css("--plus"), 1), "repeat"), pMinus = g.createPattern(hatch(css("--minus"), -1), "repeat");
      for (let k = 0; k < n; k++) {
        const cx = L + slot * (k + 0.5), xa = cx - bw / 2, x = data.x[k], y = data.y ? data.y[k] : null;
        g.globalAlpha = this.hover === null || this.hover === k ? 1 : 0.35;
        if (this.hover === k) { g.shadowColor = data.colors[k]; g.shadowBlur = 14; }
        if (y !== null) {
          const c = Math.min(x, y);
          g.fillStyle = css("--panel"); g.fillRect(xa, Y(c), bw, Y(0) - Y(c));
          if (y > x) { g.fillStyle = pPlus; g.fillRect(xa, Y(y), bw, Y(x) - Y(y)); g.strokeStyle = css("--plus"); g.lineWidth = 1; g.strokeRect(xa + 0.5, Y(y) + 0.5, bw - 1, Y(x) - Y(y)); }
          if (x > y) { g.fillStyle = pMinus; g.fillRect(xa, Y(x), bw, Y(y) - Y(x)); g.strokeStyle = css("--minus"); g.lineWidth = 1; g.strokeRect(xa + 0.5, Y(x) + 0.5, bw - 1, Y(y) - Y(x)); }
        }
        const c0 = y === null ? x : Math.min(x, y);      // rectangle « commun » (tout le besoin s'il n'y a pas encore de part)
        g.strokeStyle = css("--fg"); g.lineWidth = 1.2; g.strokeRect(xa + 0.5, Y(c0) + 0.5, bw - 1, Y(0) - Y(c0) - 1);
        g.shadowBlur = 0;
        // part de référence : petit trait
        if (data.ref && !data.theta) {
          g.strokeStyle = css("--muted"); g.setLineDash([3, 3]); g.lineWidth = 1.4;
          g.beginPath(); g.moveTo(xa - 5, Y(data.ref[k])); g.lineTo(xa + bw + 5, Y(data.ref[k])); g.stroke(); g.setLineDash([]);
        }
        // nom de l'agent
        g.globalAlpha = 1;
        g.fillStyle = data.colors[k]; const r = 9;
        g.beginPath(); g.roundRect ? g.roundRect(cx - r, T + ph + 6, 2 * r, 18, 4) : g.rect(cx - r, T + ph + 6, 2 * r, 18); g.fill();
        g.fillStyle = "#fff"; g.font = `600 11px ${css("--font")}`; g.textAlign = "center"; g.textBaseline = "middle";
        g.fillText(data.names[k], cx, T + ph + 15.5);
        g.font = `11px ${css("--font")}`; g.textAlign = "right";
      }
      if (data.theta) {
        g.strokeStyle = css("--muted"); g.setLineDash([5, 4]); g.lineWidth = 1.2;
        g.beginPath(); g.moveTo(L, Y(data.theta)); g.lineTo(L + pw, Y(data.theta)); g.stroke(); g.setLineDash([]);
        g.fillStyle = css("--muted"); g.textAlign = "right"; g.textBaseline = "bottom"; g.fillText("θ*", L + pw - 4, Y(data.theta) - 2);
      }
      g.strokeStyle = css("--line"); g.lineWidth = 1; g.strokeRect(L + 0.5, T + 0.5, pw - 1, ph - 1);
    }
  }

  return { css, clearCss, LineChart, HistChart };
})();
