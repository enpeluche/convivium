/* =============================================================================
   Modèle (voir l'onglet « Modèle ») — aucune dépendance au DOM.

   n agents partagent une ressource ; à chaque instant t, exactement un agent est servi.
     u_i(t+1) = max(0, u_i(t) + λ_i − σ_i)   si s(t) = i
     u_i(t+1) = u_i(t) + λ_i                 sinon
   avec u_i(0) ∈ ℕ, λ_i ∈ ℕ*, σ_i ∈ ℕ, σ_i > λ_i.

   Politique : s(t) = χ( argmax_i u_i(t) / λ_i ), où χ départage les ex æquo :
     "prio"   ordre de priorité fixé (une permutation des agents) : on sert l'ex æquo le mieux classé ;
     "rot"    tourniquet : on sert le premier ex æquo (dans l'ordre A, B, C… circulaire) qui suit
              l'agent choisi lors de la dernière égalité ;
     "random" tirage au sort (graine fixée, donc reproductible).
   La comparaison u_i/λ_i > u_j/λ_j se fait en entiers (u_i·λ_j > u_j·λ_i) : aucune erreur d'arrondi.

   Augmentation de ressource : un apport ponctuel { agent i, instant t, quantité q } donne, une seule fois,
   σ_i := σ_i + q à l'instant t. Si i est servi en t : u_i(t+1) = max(0, u_i(t) + λ_i − σ_i − q) ;
   sinon l'apport lui revient quand même : u_i(t+1) = max(0, u_i(t) + λ_i − q). Ce qui passe sous 0 est gaspillé.
   ============================================================================= */
"use strict";

const Model = (() => {
  const NAMES = "ABCDEFGH";
  const MAX_AGENTS = 8;
  const CHIS = ["prio", "rot", "random"];

  /* ---------- Petits outils numériques ---------- */
  function mulberry(seed) {
    return () => {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  /** Fraction exacte réduite { p, q } */
  const frac = (p, q) => { const g = gcd(p, q); return { p: p / g, q: q / g }; };
  const fracAdd = (A, B) => frac(A.p * B.q + B.p * A.q, A.q * B.q);

  /* ---------- Grandeurs statiques ---------- */
  /** Besoins x_i = λ_i/σ_i, charge X (exacte) et régime. */
  function load(agents) {
    let Xf = { p: 0, q: 1 };
    const x = agents.map(a => a.lam / a.sig);
    for (const a of agents) Xf = fracAdd(Xf, frac(a.lam, a.sig));
    const X = Xf.p / Xf.q;
    const regime = Xf.p < Xf.q ? "abondance" : Xf.p === Xf.q ? "equilibre" : "famine";
    return { x, X, Xf, regime };
  }

  /** Parts de référence : x_i/X en famine, x_i à l'équilibre, max(x_i, θ*) en abondance (Σ = 1). */
  function reference(x, X) {
    if (X >= 1 - 1e-12) return { theta: null, y: x.map(v => v / X) };
    const s = x.slice().sort((a, b) => a - b), n = s.length;
    let tail = s.reduce((p, q) => p + q, 0), theta = 1 / n;
    for (let k = 1; k <= n; k++) {               // les k plus petits besoins sont relevés à θ
      tail -= s[k - 1];
      const th = (1 - tail) / k;
      if (th >= s[k - 1] - 1e-12 && (k === n || th <= s[k] + 1e-12)) { theta = th; break; }
    }
    return { theta, y: x.map(v => Math.max(v, theta)) };
  }

  /** Ordre de priorité valide : une permutation de 0 … n−1 (sinon l'ordre A, B, C…). */
  function normPrio(prio, n) {
    const ok = Array.isArray(prio) && prio.length === n && new Set(prio).size === n && prio.every(i => Number.isInteger(i) && i >= 0 && i < n);
    return ok ? prio.slice() : Array.from({ length: n }, (_, i) => i);
  }

  /* ---------- Simulation ----------
     Stockage compact : un grand tableau typé par grandeur, ligne t = instant t (n colonnes),
     agrandi par doublement. Environ 32·n octets par instant.
       U(t, i)   état u_i(t)                         (t = 0 … len)
       Nc(t, i)  services reçus avant t, N_i(t)
       SUm(t, i) Σ_{k<t} u_i(k)                      (pour les moyennes)
       GAc(t, i) Σ_{k<t} γ_i(k)                      (gaspillage normalisé cumulé)
       served(t), waste(t) = g_{s(t)}(t), ties(t) = nombre d'ex æquo départagés par χ  (t < len)
  */
  class Sim {
    constructor(cfg) {
      const n = this.n = cfg.agents.length;
      this.lam = cfg.agents.map(a => a.lam);
      this.sig = cfg.agents.map(a => a.sig);
      this.chi = CHIS.includes(cfg.chi) ? cfg.chi : "prio";
      const prio = normPrio(cfg.prio, n);
      this.rank = new Int32Array(n); prio.forEach((i, r) => { this.rank[i] = r; });
      this.rot = 0;                                   // tourniquet : premier candidat à la prochaine égalité
      this.rng = mulberry(9001 + 7919 * (cfg.seed || 1));
      // apports ponctuels : instant t → Float64Array(n) des quantités (cumulées si plusieurs)
      this.boost = new Map(); this.lastBoost = -1;
      for (const b of cfg.boosts || []) {
        if (!(b.agent >= 0 && b.agent < n && b.t >= 0 && b.q > 0)) continue;
        if (!this.boost.has(b.t)) this.boost.set(b.t, new Float64Array(n));
        this.boost.get(b.t)[b.agent] += b.q;
        if (b.t > this.lastBoost) this.lastBoost = b.t;
      }
      this.len = 0; this.cap = 0;
      this.alloc(1024);
      cfg.agents.forEach((a, i) => { this._u[i] = a.u0; });
    }
    alloc(cap) {
      const n = this.n, rows = (cap + 1) * n;
      const grow = (Old, T, size) => { const a = new T(size); if (Old) a.set(Old.subarray(0, Math.min(Old.length, size))); return a; };
      this._u = grow(this._u, Float64Array, rows); this._N = grow(this._N, Int32Array, rows);
      this._SU = grow(this._SU, Float64Array, rows); this._GA = grow(this._GA, Float64Array, rows);
      this._s = grow(this._s, Uint8Array, cap); this._g = grow(this._g, Float64Array, cap); this._t = grow(this._t, Uint8Array, cap);
      this.cap = cap;
    }

    U(t, i) { return this._u[t * this.n + i]; }
    Nc(t, i) { return this._N[t * this.n + i]; }
    SUm(t, i) { return this._SU[t * this.n + i]; }
    GAc(t, i) { return this._GA[t * this.n + i]; }
    row(t) { return this._u.subarray(t * this.n, (t + 1) * this.n); }
    Nrow(t) { return this._N.subarray(t * this.n, (t + 1) * this.n); }
    has(t) { return t >= 0 && t <= this.len; }
    served(t) { return t < this.len ? this._s[t] : null; }
    ties(t) { return t < this.len ? this._t[t] : 0; }
    waste(t) { return t < this.len ? this._g[t] : null; }
    boostAt(t) { return this.boost.get(t) || null; }                                         // apports en t, ou null

    /* Grandeurs dérivées */
    y(t, i) { return t >= 1 && t <= this.len ? this.Nc(t, i) / t : null; }                   // part reçue
    gamma(t) { let s = 0; for (let i = 0; i < this.n; i++) s += this.GAc(t, i); return s; }  // Γ(t)
    meanU(t, i) { return t + 1 <= this.len ? this.SUm(t + 1, i) / (t + 1) : null; }          // moyenne de u(0 … t)

    choose(o) {
      const n = this.n, lam = this.lam, u = this._u;
      const best = [0];
      for (let i = 1; i < n; i++) {
        const b = best[0], c = u[o + i] * lam[b] - u[o + b] * lam[i];   // signe de u_i/λ_i − u_b/λ_b
        if (c > 0) { best.length = 0; best.push(i); } else if (c === 0) best.push(i);
      }
      if (best.length === 1) return [best[0], 1];
      let k = best[0];
      if (this.chi === "prio") { for (const i of best) if (this.rank[i] < this.rank[k]) k = i; }
      else if (this.chi === "rot") {
        const p = this.rot, d = i => (i - p + n) % n;
        for (const i of best) if (d(i) < d(k)) k = i;
        this.rot = (k + 1) % n;
      } else k = best[Math.floor(this.rng() * best.length)];
      return [k, best.length];
    }

    step() {
      const t = this.len, n = this.n;
      if (t + 1 >= this.cap) this.alloc(this.cap * 2);
      const o = t * n, p = o + n, u = this._u;
      const [k, nt] = this.choose(o);
      const B = this.boost.get(t);
      let waste = 0;
      for (let i = 0; i < n; i++) {
        const q = B ? B[i] : 0;
        let v = u[o + i] + this.lam[i] - (i === k ? this.sig[i] : 0) - q, w = 0;
        if (v < 0 && (i === k || q > 0)) { w = -v; v = 0; }
        u[p + i] = v; waste += w;
        this._N[p + i] = this._N[o + i] + (i === k ? 1 : 0);
        this._SU[p + i] = this._SU[o + i] + u[o + i];
        this._GA[p + i] = this._GA[o + i] + w / this.sig[i];
      }
      this._s[t] = k; this._g[t] = waste; this._t[t] = nt;
      this.len = t + 1;
    }
    ensure(T) { while (this.len < T) this.step(); }
  }

  /**
   * Régime asymptotique : avec χ déterministe, l'état suivant ne dépend que de l'état courant
   * (et, pour le tourniquet, de sa position) ; la trajectoire est donc ultimement périodique
   * dès qu'un état se répète (on ne cherche la répétition qu'après le dernier apport ponctuel). Renvoie { status, tau0, tau, word, agents: [{ mean, lo, hi, y, gamma }] }.
   */
  function asymptotic(cfg, X, limit = 60000) {
    if (cfg.chi === "random") return { status: "random" };
    if (X > 1 + 1e-12) return { status: "famine" };
    const S = new Sim(cfg), seen = new Map(), rot = S.chi === "rot";
    for (let t = 0; t <= limit + S.lastBoost + 1; t++) {
      if (t > S.len) S.step();
      if (t <= S.lastBoost) continue;
      const key = Array.prototype.join.call(S.row(t), ",") + (rot ? "|" + S.rot : "");
      const t0 = seen.get(key);
      if (t0 !== undefined) {
        const tau = t - t0, n = S.n, ag = [];
        for (let i = 0; i < n; i++) {
          let sum = 0, lo = Infinity, hi = -Infinity;
          for (let k = t0; k < t; k++) { const v = S.U(k, i); sum += v; if (v < lo) lo = v; if (v > hi) hi = v; }
          ag.push({ mean: sum / tau, lo, hi, y: (S.Nc(t, i) - S.Nc(t0, i)) / tau, gamma: (S.GAc(t, i) - S.GAc(t0, i)) / tau });
        }
        let word = ""; for (let k = t0; k < t; k++) word += NAMES[S.served(k)];
        return { status: "ok", tau0: t0, tau, word, agents: ag };
      }
      seen.set(key, t);
    }
    return { status: "limit", limit };
  }

  return { NAMES, MAX_AGENTS, CHIS, Sim, load, reference, asymptotic, normPrio, frac, mulberry };
})();
