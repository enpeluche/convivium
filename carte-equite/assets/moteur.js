"use strict";

/* ================================================================
   B. OUTILS
   ================================================================ */
// \pris{x} marque un bien reçu dans les tableaux d'exemples. KaTeX le traduit en une couleur
// « olive » (simple repère), que lettresUnicode() remplace ensuite par la classe CSS .pris.
// \moi{i} et \autre{j} colorent les indices d'agents ; maroon et navy ne sont que des repères,
// remplacés dans lettresUnicode() par les classes CSS .moi et .autre (couleurs du thème).
const OPTIONS_KATEX = { output: "html", throwOnError: false, strict: "ignore",
  trust: ctx => ctx.command === "\\htmlClass", macros: {
  "\\pris": "\\htmlClass{pris}{#1}",
  "\\moi": "\\htmlClass{moi}{#1}",
  "\\autre": "\\htmlClass{autre}{#1}",
  "\\just": "\\overset{\\scriptscriptstyle \\mathrm{(#1)}}{#2}",   // \just{1}{\le} : relation numérotée
  "\\diag": "\\htmlClass{diag}{#1}",       // matrice : case de la diagonale
  "\\envie": "\\htmlClass{envie}{#1}",     // matrice : case enviée
} };

// Chrome ignore l'attribut MathML mathvariant (sauf "normal") : \mathcal{A} et \mathbb{R}
// s'afficheraient comme un A et un R ordinaires. On remplace donc ces lettres par leur
// caractère Unicode dédié (𝒜, ℝ…). Quelques lettres existaient déjà en Unicode avant
// le bloc mathématique, d'où les exceptions.
const UNICODE_MATH = {
  script:          { debut: 0x1D49C, exceptions: { B: "ℬ", E: "ℰ", F: "ℱ", H: "ℋ", I: "ℐ", L: "ℒ", M: "ℳ", R: "ℛ" } },
  "double-struck": { debut: 0x1D538, exceptions: { C: "ℂ", H: "ℍ", N: "ℕ", P: "ℙ", Q: "ℚ", R: "ℝ", Z: "ℤ" } },
};
function lettresUnicode(html) {
  return html
    // Σ, Π, ⋃ : en texte courant, le navigateur déplace leurs indices sur le côté (« movablelimits »).
    // On l'interdit, pour que \limits les garde vraiment dessous.
    .replace(/<(munder|munderover)><mo>/g, `<$1><mo movablelimits="false">`)
    // KaTeX emballe un symbole surmonté (\overset{(1)}{\le}, \xrightarrow) dans un <mo>, que Chrome
    // affiche en ligne. On retire l'emballage : <mo><mover><mo><mo>≤</mo></mo>…</mover></mo> → <mover><mo>≤</mo>…</mover>
    .replace(/<mo><mover><mo><mo>([^<]*)<\/mo><\/mo>/g, `<mover><mo>$1</mo>`)
    .replace(/<mo><mover>/g, `<mover>`)
    .replace(/<\/mover><\/mo>/g, `</mover>`)
    .replace(/<mstyle mathcolor="olive">/g, `<mstyle class="pris">`)
    .replace(/<mstyle mathcolor="maroon">/g, `<mstyle class="moi">`)
    .replace(/<mstyle mathcolor="navy">/g, `<mstyle class="autre">`)
    .replace(/<mstyle mathcolor="teal">/g, `<mstyle class="diag">`)
    .replace(/<mstyle mathcolor="crimson">/g, `<mstyle class="envie">`).replace(/<mi mathvariant="(script|double-struck)">([A-Z])<\/mi>/g, (tout, style, L) => {
    const { debut, exceptions } = UNICODE_MATH[style];
    return `<mi>${exceptions[L] ?? String.fromCodePoint(debut + L.charCodeAt(0) - 65)}</mi>`;
  });
}

// Une formule LaTeX → chaîne HTML (MathML)
// Dans le texte courant, LaTeX met les indices des grands opérateurs à côté (Σ_{g∈S}) pour ne pas
// écarter les lignes. On veut les avoir toujours dessous : on ajoute \limits après chaque
// \sum, \prod, \max, \min, \bigcup, \bigcap et \operatorname*{…} (comme arg max).
function limitesDessous(latex) {
  return latex
    .replace(/\\(sum|prod|max|min|bigcup|bigcap)(?![a-zA-Z])(?!\\limits)/g, "\\$1\\limits")
    .replace(/\\operatorname\*\{[^}]*\}(?!\\limits)/g, m => m + "\\limits")
    // une fine espace après max_{…} et min_{…}, sinon ce qui suit leur est collé (sauf espace déjà là)
    .replace(/(\\(?:max|min)\\limits_(?:\{(?:[^{}]|\{[^{}]*\})*\}|\\[a-zA-Z]+(?![a-zA-Z])|[^\\{\s]))(?!\s*\\[,;: ])/g, "$1\\,");
}

// Indices d'agents en couleur : i (« moi », l'agent dont on parle) et j (un autre agent).
// Un indice parcouru par un grand opérateur (Σ_i, Π_i, min_i, max_{j ≠ i}, ⋃_{j ∈ T}) est muet :
// il désigne tous les agents tour à tour, pas « moi » ni « l'autre », donc il reste sans couleur
// partout dans la formule. Seule la variable liée compte : dans max_{j ≠ i}, j est muet, i ne l'est pas.
// Le contenu de \text{…}, \mathrm{…}, \operatorname*{…}, \begin{…}, etc. est recopié tel quel.
const ARGUMENTS_RECOPIES = { text: 1, mathrm: 1, operatorname: 1, mathcal: 1, mathbb: 1,
                             begin: 1, end: 1, color: 1, textcolor: 2, pris: 1 };
function colorierIndices(latex) {
  const muets = new Set();
  const lie = /\\(?:sum|prod|min|max|bigcup|bigcap|operatorname\*?\{[^}]*\})\s*(?:\\limits)?\s*_\s*(?:\{\s*([a-zA-Z])|([a-zA-Z]))/g;
  for (const m of latex.matchAll(lie)) muets.add(m[1] ?? m[2]);

  let out = "", k = 0;
  const groupe = () => {               // recopie un groupe {…} équilibré, espaces compris
    while (latex[k] === " ") out += latex[k++];
    if (latex[k] !== "{") return;
    let prof = 0;
    do { const c = latex[k++]; out += c; if (c === "{") prof++; else if (c === "}") prof--; } while (prof > 0 && k < latex.length);
  };
  while (k < latex.length) {
    const c = latex[k];
    if (c === "\\") {                 // une commande : on la recopie, et ses arguments s'ils sont « verbatim »
      const cmd = /^\\([a-zA-Z]+\*?|.)/.exec(latex.slice(k))[0];
      out += cmd; k += cmd.length;
      for (let a = ARGUMENTS_RECOPIES[cmd.slice(1).replace("*", "")] ?? 0; a > 0; a--) groupe();
    } else if ((c === "i" || c === "j") && !muets.has(c)) {
      out += c === "i" ? "{\\moi{i}}" : "{\\autre{j}}"; k++;
    } else { out += c; k++; }
  }
  return out;
}

// couleurs = false pour les tableaux d'exemples, où i parcourt les lignes (s_i en en-tête)
// \just{EF}{\le} : un sigle au-dessus de la relation (sans parenthèses) ; \just{1}{…} et \just{+}{…}
// passent par la macro KaTeX, qui les écrit (1), (a).
const sigleDessus = latex => latex.replace(/\\just\{([A-Z][A-Za-z0-9]*)\}/g, (m, x) => `\\overset{\\scriptscriptstyle \\text{${x}}}`);

// KaTeX est embarqué (assets/vendor) et rend du HTML : plus besoin des retouches MathML de lettresUnicode().
// En anglais, la virgule décimale {,} devient un point.
function tex(latex, bloc = false, couleurs = true) {
  if (LANG === "en") latex = latex.replace(/\{,\}/g, ".");
  if (!window.katex) return `<code>${latex}</code>`;
  const base = limitesDessous(sigleDessus(latex));
  const source = couleurs ? colorierIndices(base) : base;
  return katex.renderToString(source, { ...OPTIONS_KATEX, displayMode: bloc });
}

// Articles cités. Dans les textes, on écrit [texte affiché](clé) pour faire un lien.
const ARTICLES = {
  survey:       "https://doi.org/10.1016/j.artint.2023.103965", // Amanatidis et al., survey, AIJ 322 (2023) : numéros de définitions de cette version
  abm18:        "https://arxiv.org/abs/1806.03114",   // Amanatidis, Birmpas, Markakis, IJCAI 2018
  mnw19:        "https://www.cs.toronto.edu/~nisarg/papers/mnw.pdf", // Caragiannis et al., TEAC 2019
  efxstories20: "https://arxiv.org/abs/2001.09838",   // Amanatidis et al., IJCAI 2020
  birds20:      "https://arxiv.org/abs/1909.07650",   // Amanatidis, Markakis, Ntokos, AAAI 2020
  kpw18:        "https://procaccia.info/wp-content/uploads/2020/03/mms.pdf", // Kurokawa, Procaccia, Wang, JACM 2018
  gmms18:       "https://arxiv.org/abs/1711.07621",   // Barman, Biswas, Krishnamurthy, Narahari, AAAI 2018
  bkv18:        "https://arxiv.org/abs/1707.04731",   // Barman, Krishnamurthy, Vaish, EC 2018
  aps21:        "https://arxiv.org/abs/2103.04304",   // Babaioff, Ezra, Feige, EC 2021
  propm21:      "https://arxiv.org/abs/2105.11348",   // Baklanov et al., IJCAI 2021
  freeman19:    "https://arxiv.org/abs/1905.10656",   // Freeman, Sikdar, Vaish, Xia, IJCAI 2019
  gourves14:    "https://hal.archives-ouvertes.fr/hal-01292166", // Gourvès, Monnot, Tlilane, ECAI 2014
  eefx23:       "https://arxiv.org/abs/2206.01710",   // Caragiannis et al., IJCAI 2023
  akrami25:     "https://arxiv.org/abs/2405.14463",   // Akrami, Rathi, AAAI 2025
  plaut18:      "https://arxiv.org/abs/1707.04769",   // Plaut, Roughgarden, SODA 2018
  nash50:       "https://www.econometricsociety.org/publications/econometrica/1950/04/01/bargaining-problem",
  aziz20:       "https://arxiv.org/abs/1909.00740",   // Aziz, Moulin, Sandomirskiy, ORL 2020
  // Corvées
  hetao26:      "https://arxiv.org/abs/2606.08872",   // EFX for additive chores: nonexistence…, 2026
  cs24:         "https://arxiv.org/abs/2406.10752",   // Christoforidis, Santorinaios, IJCAI 2024
  mahara25:     "https://arxiv.org/abs/2507.09544",   // Mahara, EF1 + PO pour les corvées, 2025
  liliwu22:     "https://arxiv.org/abs/2103.11849",   // Li, Li, Wu, PROPX pour les corvées
  fsvx20:       "https://arxiv.org/abs/2002.11504",   // Freeman, Sikdar, Vaish, Xia, AAMAS 2020
  aziz17:       "https://ojs.aaai.org/index.php/AAAI/article/view/10582", // Aziz et al., AAAI 2017
  fst21:        "https://arxiv.org/abs/2104.04977",   // Feige, Sapir, Tauber, WINE 2021
  hsh23:        "https://arxiv.org/abs/2302.04581",   // Huang, Segal-Halevi, EC 2023
  lst90:        "https://ir.cwi.nl/pub/18055",        // Lenstra, Shmoys, Tardos, Math. Prog. 1990
  // Droits inégaux
  wef21:        "https://arxiv.org/abs/1909.10502",   // Chakraborty, Igarashi, Suksompong, Zick, TEAC 2021
  csss22:       "https://arxiv.org/abs/2112.04166",   // Chakraborty, Segal-Halevi, Suksompong, AAAI 2022
  hsy23:        "https://arxiv.org/abs/2305.16081",   // Hajiaghayi, Springer, Yami, 2023
  farhadi19:    "https://arxiv.org/abs/1703.01649",   // Farhadi et al., JAIR 2019
  // Algorithmes
  hz25:         "https://arxiv.org/abs/2511.13056",   // Huang, Zhou, 7/9-MMS, 2025
  afs24:        "https://arxiv.org/abs/2406.12413",   // Amanatidis, Filos-Ratsikas, Sgouritsa, 2/3-EFX, EC 2024
  cgm20:        "https://arxiv.org/abs/2002.05119",   // Chaudhury, Garg, Mehlhorn, EFX pour 3 agents, EC 2020
  golz26:       "https://arxiv.org/abs/2609.08954",   // Gölz, PMMS peut ne pas exister (3 agents), 2026
  amks26:       "https://arxiv.org/abs/2606.04731",   // Amanatidis, Korfiati, Markakis, Santorinaios, GMMS, 2026
  lms04:        "https://doi.org/10.1145/988772.988792", // Lipton, Markakis, Mossel, Saberi, EC 2004
  ghodsi21:     "https://arxiv.org/abs/1704.00222",   // Ghodsi et al., Math. Oper. Res. 2021 (remplissage de sacs)
};

// Un texte avec des maths entre $…$ et des liens [texte](clé) → HTML.
// Chaque morceau $…$ passe par KaTeX ; chaque lien s'ouvre dans un nouvel onglet.
function texte(s) {
  return s
    .replace(/\$([^$]+)\$/g, (_, latex) => tex(latex))
    .replace(/\[([^\]]+)\]\(([a-z0-9]+)\)/g, (tout, libelle, cle) => ARTICLES[cle]
      ? `<a class="article" href="${ARTICLES[cle]}" target="_blank" rel="noopener">${libelle}</a>`
      : tout);
}

// Crée un élément SVG avec ses attributs et l'ajoute à `parent`
const SVGNS = "http://www.w3.org/2000/svg";
function svgEl(tag, attrs = {}, parent) {
  const n = document.createElementNS(SVGNS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}

const svg = document.getElementById("map");
const diagram = document.getElementById("diagram");
const card = document.getElementById("card");

// La carte affichée. afficherCarte() remplit ces variables ; tout le reste du moteur les lit.
let NOTIONS, IMPLICATIONS, JUMELLES, COURBES, LIENS;

// Taille des boîtes : hauteur fixe, largeur selon la longueur du sigle
const H = 34;

// Point où le segment a → cible sort de la boîte a (pour que la flèche s'arrête au bord)
function bord(a, cible) {
  const dx = cible.x - a.x, dy = cible.y - a.y;
  const t = Math.min((a.w / 2 + 2) / Math.abs(dx || 1e-9), (H / 2 + 2) / Math.abs(dy || 1e-9));
  return [a.x + dx * t, a.y + dy * t];
}

// Quel genre de clé ? Une notion ("EF1") ou un lien ("EF>EFX", "EQ~EF", "EF1≈MMS", "MMS⊘EF1")
const SEPARATEURS = [">", "~", "≈", "⊘", "≠"];   // ≠ : implication perdue (vraie à droits égaux, fausse sinon)
const sepDe = cle => SEPARATEURS.find(s => cle.includes(s));
const estLien = cle => !!cle && !!sepDe(cle);


/* ================================================================
   B bis. SÉLECTEUR DE VALUATIONS (carte de l'équité)
   ----------------------------------------------------------------
   On choisit une classe de valuations, et deux options : identiques, normalisées.
   Trois règles, toutes de la pure logique, font évoluer la carte :
     1. Une flèche dont la preuve utilise (+) ne couvre plus une classe plus générale qu'additive.
     2. Un contre-exemple additif reste un contre-exemple dans toute classe plus générale ;
        une existence prouvée en général reste vraie avec des valuations identiques (cas particulier).
     3. Propagation le long des flèches valides : A ✓ et A ⇒ B donnent B ✓ ; B ✗ et A ⇒ B donnent A ✗.
   Le reste vient de résultats sourcés (EXCEPTIONS) ; sinon le statut est « non vérifié ».
   ================================================================ */
const CLASSES_FR = [
  { id: "additive", nom: "Additive", adj: "additives" },
  { id: "sousmod", nom: "Sous-modulaire", adj: "sous-modulaires" },
  { id: "xos", nom: "XOS", adj: "XOS" },
  { id: "sousadd", nom: "Sous-additive", adj: "sous-additives" },
  { id: "monotone", nom: "Monotone", adj: "monotones" },
];
let contexte = { classe: "additive", identiques: false, normalisees: true };
const contexteParDefaut = () => contexte.classe === "additive" && !contexte.identiques && contexte.normalisees;
const nomClasse = () => CLASSES.find(c => c.id === contexte.classe).adj;
const actifSurCarte = () => !!carteCourante.selecteur;

// Notions qui comparent les utilités de deux agents : elles supposent des valuations normalisées
const COMPARENT_UTILITES = ["EQ", "EQX", "EQ1", "EGW", "Leximin"];
// Notions définies seulement pour des valuations additives
const SEULEMENT_ADDITIVES = ["fPO"];

// Résultats sourcés propres à un contexte. "non-additive" vaut pour les quatre classes plus générales.
const OPTIMUM = { ex: "yes", t: "un optimum existe toujours, puisqu’il n’y a qu’un nombre fini d’allocations" };
const EXCEPTIONS_FR = {
  "non-additive": {
    EF1: { ex: "yes", t: T`l’élimination des cycles d’envie n’utilise que (m) ([Lipton et al.](lms04), survey Théorème 5)` },
    EEFX: { ex: "yes", t: T`même pour des valuations monotones ([Akrami et Rathi, AAAI 2025](akrami25))` },
    PO: OPTIMUM, MNW: OPTIMUM, USW: OPTIMUM, Leximin: OPTIMUM, EGW: OPTIMUM,
  },
  sousmod: { EFX: { ex: "open", t: "ouvert" } },
  xos: { EFX: { ex: "open", t: "ouvert" } },
  sousadd: { EFX: { ex: "open", t: "ouvert" } },
  monotone: { EFX: { ex: "no", t: "contre-exemple trouvé par ordinateur (SAT, 2026), voir la note d’EFX" } },
  identiques: {
    EFX: { ex: "yes", t: T`une allocation leximin++ convient, même pour des valuations monotones ([Plaut et Roughgarden](plaut18), survey § 4.1.1)` },
    MMS: { ex: "yes", t: T`tous ont la même partition maximin : chacun en reçoit un paquet, qui vaut au moins $\mu_i$` },
    EF: { ex: "no", t: "un seul bien pour deux agents : celui qui ne l’a pas envie l’autre" },
    PROP: { ex: "no", t: "un seul bien pour deux agents : l’un n’a rien" },
    EQ: { ex: "no", t: "un seul bien pour deux agents : l’un a la valeur du bien, l’autre 0" },
    PO: OPTIMUM, MNW: OPTIMUM, USW: OPTIMUM, Leximin: OPTIMUM, EGW: OPTIMUM,
  },
};

// La preuve d'une implication utilise-t-elle l'additivité ?
function utiliseAdditivite(cle) {
  const L = LIENS[cle]; if (!L) return false;
  if ((L.hyp ?? []).some(h => /additiv/.test(h))) return true;
  return JSON.stringify(L.pont ?? []).includes("\\\\just{+}");
}
const eteinte = id => actifSurCarte() && (
  (!contexte.normalisees && !contexte.identiques && COMPARENT_UTILITES.includes(id)) ||
  (contexte.classe !== "additive" && SEULEMENT_ADDITIVES.includes(id)));

// Validité d'un lien dans le contexte : true, ou un texte qui dit pourquoi il ne vaut plus
function validiteLien(cle) {
  if (!actifSurCarte() || contexteParDefaut()) return true;
  const sep = sepDe(cle), [a, b] = cle.split(sep);
  if (eteinte(a) || eteinte(b)) return ui("lienSansSens");
  const general = contexte.classe !== "additive";
  if (sep === ">" && general && utiliseAdditivite(cle)) return ui("lienPreuveAdd", nomClasse());
  if (sep === "≈" && general) return ui("lienApproxAdd", nomClasse());
  if (sep === "⊘" && contexte.identiques) return ui("lienCEIdent");
  return true;
}

// Statut de chaque notion dans le contexte : { ex: "yes"|"open"|"no"|"inconnu", t: raison }
let cacheStatuts = null;
function statuts() {
  if (cacheStatuts) return cacheStatuts;
  const S = {};
  const general = contexte.classe !== "additive", id_ = contexte.identiques;
  for (const id in NOTIONS) {
    const base = NOTIONS[id].ex;
    if (!base) continue;
    let s = { ex: base, t: ui("stCommeAdd") };
    if (general) s = base === "no"
      ? { ex: "no", t: ui("stCEReste", nomClasse().replace(/s$/, "")) }
      : { ex: "inconnu", t: ui("stNonVerifClasse", nomClasse()) };
    if (id_) {
      if (s.ex === "yes") s = { ex: "yes", t: ui("stVraiIdent") };
      else s = { ex: "inconnu", t: ui("stNonVerifIdent") };
    }
    const exc = { ...(general ? EXCEPTIONS["non-additive"] : {}), ...(EXCEPTIONS[contexte.classe] ?? {}), ...(id_ ? EXCEPTIONS.identiques : {}) }[id];
    if (exc) s = { ...exc, source: true };
    S[id] = s;
  }
  // Propagation le long des implications valides (et des équivalences, avec des valuations identiques)
  const aretes = IMPLICATIONS.filter(([a, b]) => validiteLien(`${a}>${b}`) === true);
  if (id_) for (const [a, b] of JUMELLES) aretes.push([a, b], [b, a]);
  for (let change = true; change;) {
    change = false;
    for (const [a, b] of aretes) {
      if (!S[a] || !S[b] || eteinte(a) || eteinte(b)) continue;
      if (S[a].ex === "yes" && S[b].ex !== "yes" && !S[b].source) { S[b] = { ex: "yes", t: ui("stPropOui", a, b) }; change = true; }
      if (S[b].ex === "no" && S[a].ex !== "no" && !S[a].source) { S[a] = { ex: "no", t: ui("stPropNon", a, b) }; change = true; }
    }
  }
  return (cacheStatuts = S);
}
const statut = id => actifSurCarte() && !contexteParDefaut() ? statuts()[id] : (NOTIONS[id].ex ? { ex: NOTIONS[id].ex } : null);

// Bandeau en tête de carte quand le contexte n'est pas celui par défaut
function descriptionContexte() {
  return ui("ctxDesc", nomClasse(), contexte.identiques, !contexte.normalisees && !contexte.identiques);
}
function bandeauNotion(id) {
  if (!actifSurCarte() || contexteParDefaut()) return "";
  if (eteinte(id)) return `<div class="bandeau-contexte eteint"><b>${ui("horsJeu")}</b> · ${SEULEMENT_ADDITIVES.includes(id) && contexte.classe !== "additive"
    ? ui("seulementAdd") : texte(ui("sansNorm"))}.</div>`;
  const s = statut(id); if (!s) return "";
  const jumelle = Object.keys(aliasAff).find(a => aliasAff[a] === id) ?? aliasAff[id];
  const fusionne = jumelle ? ` · ${texte(ui("fusionBoite", id, jumelle))}` : "";
  const raison = s.ex === "inconnu" ? "" : ` · ${texte(s.t)}`;
  return `<div class="bandeau-contexte s-${s.ex}"><b>${descriptionContexte()}</b> · ${STATUT[s.ex]}${raison}${fusionne}</div>`;
}
function bandeauLien(cle) {
  if (!actifSurCarte() || contexteParDefaut()) return "";
  const v = validiteLien(cle), sep = sepDe(cle);
  if (v !== true) return `<div class="bandeau-contexte eteint"><b>${descriptionContexte()}</b> · ${v}.</div>`;
  const pourquoi = sep === "~" && contexte.identiques ? texte(ui("equivIdent"))
    : sep === "⊘" ? ui("ceResteGeneral")
    : sep === "≈" ? ui("casPartApprox")
    : sep === ">" ? (utiliseAdditivite(cle) ? ui("casPartPreuve") : ui("preuveSansAdd"))
    : ui("rienNeChange");
  return `<div class="bandeau-contexte s-yes"><b>${descriptionContexte()}</b> · ${pourquoi}.</div>`;
}

// Le sélecteur lui-même : boutons à curseur glissant, et deux cases à cocher (reconstruit à chaque changement de langue)
function brancherSelecteur() {
  construireSelecteur();
  window.addEventListener("resize", () => placerCurseur(false));
}
function construireSelecteur() {
  const zone = document.getElementById("selecteur");
  zone.innerHTML = `
    <span class="sel-titre">${ui("selTitre")}</span>
    <div class="glissiere" role="radiogroup" aria-label="${ui("selAria")}">
      <span class="curseur" aria-hidden="true"></span>
      ${CLASSES.map(c => `<button role="radio" data-classe="${c.id}">${c.nom}</button>`).join("")}
    </div>
    <label class="interrupteur"><input type="checkbox" id="opt-identiques"><span class="piste"></span>${ui("identiques")}</label>
    <label class="interrupteur"><input type="checkbox" id="opt-normalisees" checked><span class="piste"></span>${ui("normalisees")}</label>`;
  zone.querySelectorAll(".glissiere button").forEach(b => b.addEventListener("click", () => changerContexte({ classe: b.dataset.classe })));
  document.getElementById("opt-identiques").addEventListener("change", e => changerContexte({ identiques: e.target.checked }));
  document.getElementById("opt-normalisees").addEventListener("change", e => changerContexte({ normalisees: e.target.checked }));
}
function placerCurseur(anime = true) {
  const g = document.querySelector("#selecteur .glissiere"); if (!g || !g.offsetParent) return;
  const b = g.querySelector(`[data-classe="${contexte.classe}"]`), c = g.querySelector(".curseur");
  if (!anime) c.style.transition = "none";
  c.style.width = b.offsetWidth + "px";
  c.style.transform = `translateX(${b.offsetLeft}px)`;
  if (!anime) { c.offsetWidth; c.style.transition = ""; }
  g.querySelectorAll("button").forEach(x => x.setAttribute("aria-checked", x === b));
  const id = document.getElementById("opt-identiques"), no = document.getElementById("opt-normalisees");
  id.checked = contexte.identiques;
  no.checked = contexte.normalisees || contexte.identiques;
  no.disabled = contexte.identiques;                       // identiques ⇒ normalisées d'office
  no.closest("label").title = contexte.identiques ? ui("identNorm") : "";
}
// Légende et sous-titre suivent le contexte (seulement sur une carte qui a le sélecteur)
function majLegendeContexte() {
  const actif = actifSurCarte(), autre = actif && !contexteParDefaut();
  document.getElementById("legende-inconnu").hidden = !autre;
  document.getElementById("legende-jumelles").textContent = actif && contexte.identiques ? ui("legJumFus") : ui("legJum");
  if (actif) document.getElementById("sous-titre").textContent =
    ui("sousTitreCtx", nomClasse(), contexte.identiques, !contexte.normalisees && !contexte.identiques);
}
let minuteurContexte = null;
function changerContexte(modif) {
  contexte = { ...contexte, ...modif };
  cacheStatuts = null;
  placerCurseur();
  majLegendeContexte();
  clearTimeout(minuteurContexte);
  const redessiner = () => {
    dessinerGraphe();
    surligner(selection);
    if (selection) ouvrir(selection);
  };
  animerSortie(() => { minuteurContexte = null; redessiner(); });
}


/* ================================================================
   C. DESSIN DU GRAPHE
   ================================================================ */

// Les éléments dessinés de la carte affichée (refaits à chaque changement de carte)
let fleches = [], jumelles = [], courbes = [], boites = {};

// Flèches droites (implications et jumelles)
function segment(s, t, classe, cle, deuxSens) {
  const [x1, y1] = bord(NOTIONS[s], NOTIONS[t]);
  const [x2, y2] = bord(NOTIONS[t], NOTIONS[s]);
  const pointe = deuxSens ? "url(#arrow-twin)" : "url(#arrow)";
  const line = svgEl("line", { x1, y1, x2, y2, class: classe, "marker-end": pointe }, svg);
  if (deuxSens) line.setAttribute("marker-start", pointe);
  return { s, t, cle, line, x1, y1, x2, y2 };
}

// Ce qu'on affiche selon le contexte du sélecteur :
//   cachees : notions sans objet (on ne les dessine pas, ni leurs flèches) ;
//   alias   : jumelles fusionnées (EQ → EF avec des valuations identiques) ;
//   aretes  : implications encore valables, extrémités fusionnées, sans doublon.
let aliasAff = {};
const visible = id => aliasAff[id] ?? id;
function affichage() {
  const cachees = new Set(), alias = {};
  if (actifSurCarte()) {
    for (const id in NOTIONS) if (eteinte(id)) cachees.add(id);
    if (contexte.identiques) for (const [a, b] of JUMELLES) if (!cachees.has(a) && !cachees.has(b)) alias[a] = b;
  }
  const vis = id => alias[id] ?? id, vues = new Set(), aretes = [];
  for (const [s, t] of IMPLICATIONS) {
    if (cachees.has(s) || cachees.has(t) || validiteLien(`${s}>${t}`) !== true) continue;
    const a = vis(s), b = vis(t), k = `${a}>${b}`;
    if (a === b || vues.has(k)) continue;
    vues.add(k); aretes.push([a, b, LIENS[k] ? k : `${s}>${t}`]);
  }
  const jum = JUMELLES.filter(([a, b]) => !alias[a] && !cachees.has(a) && !cachees.has(b));
  const cour = COURBES.filter(([type, s, t]) => !cachees.has(s) && !cachees.has(t) && !alias[s] && !alias[t] && validiteLien(`${s}${type}${t}`) === true);
  const notions = Object.keys(NOTIONS).filter(id => !cachees.has(id) && !alias[id]);
  return { cachees, alias, aretes, jum, cour, notions };
}
// Clés de ce qui est dessiné, pour animer ce qui apparaît ou disparaît
const clesAffichage = A => new Set([...A.notions.map(id => "n:" + id), ...A.aretes.map(([a, b]) => `e:${a}>${b}`), ...A.jum.map(([a, b]) => `j:${a}~${b}`)]);
let dernierAffichage = null;

// Vide le SVG et dessine la carte affichée : pointes, flèches, courbes, boîtes, zones de clic
function dessinerGraphe() {
  const AFF = affichage();
  aliasAff = AFF.alias;
  const avant = dernierAffichage;
  svg.replaceChildren();
  // Largeur des boîtes selon les lettres du sigle (W et M sont plus larges que les autres)
  const largeur = id => [...id].reduce((t, c) => t + ("WM".includes(c) ? 14.5 : 10.5), 0);
  const etiquette = id => [id, ...Object.keys(AFF.alias).filter(a => AFF.alias[a] === id)].map(aff).join(" = ");
  for (const id in NOTIONS) NOTIONS[id].w = Math.max(70, 38 + largeur(etiquette(id)));

  // Pointes de flèche : une par couleur
  const defs = svgEl("defs", {}, svg);
  for (const [nom, couleur, taille] of [
    ["arrow", "var(--edge)", 7], ["arrow-on", "var(--ink)", 7], ["arrow-twin", "var(--edge)", 6],
    ["arrow-approx", "var(--approx)", 7], ["arrow-neg", "var(--neg)", 7], ["arrow-perdue", "var(--perdue)", 7],
    ["arrow-hors", "var(--edge)", 7],
  ]) {
    const m = svgEl("marker", { id: nom, viewBox: "0 0 10 10", refX: 9, refY: 5,
      markerWidth: taille, markerHeight: taille, orient: "auto-start-reverse" }, defs);
    svgEl("path", { d: "M0 0L10 5L0 10z", fill: couleur }, m);
  }

  // Cadrage : la vue est ajustée aux boîtes de la carte (plus de marge perdue), avec de quoi loger les courbes
  const ids = AFF.notions, marge = 46;
  const x0 = Math.min(...ids.map(id => NOTIONS[id].x - NOTIONS[id].w / 2)), x1 = Math.max(...ids.map(id => NOTIONS[id].x + NOTIONS[id].w / 2));
  const y0 = Math.min(...ids.map(id => NOTIONS[id].y - H / 2)), y1 = Math.max(...ids.map(id => NOTIONS[id].y + H / 2));
  svg.setAttribute("viewBox", `${x0 - marge} ${y0 - marge} ${x1 - x0 + 2 * marge} ${y1 - y0 + 2 * marge}`);

  // Repères haut / bas
  const [repereHaut, repereBas] = carteCourante.reperes ?? [ui("plusExigeant"), ui("moinsExigeant")];
  svgEl("text", { x: x0 - marge + 8, y: y0 - marge + 18, class: "rank-label" }, svg).textContent = repereHaut;
  svgEl("text", { x: x0 - marge + 8, y: y1 + marge - 8, class: "rank-label" }, svg).textContent = repereBas;

  fleches  = AFF.aretes.map(([s, t, cle]) => segment(s, t, "edge", cle, false));
  jumelles = AFF.jum.map(([s, t]) => segment(s, t, "twin", `${s}~${t}`, true));
  for (const f of fleches) f.line.dataset.k = `e:${f.s}>${f.t}`;
  for (const j of jumelles) j.line.dataset.k = `j:${j.s}~${j.t}`;

  // Courbes vertes / rouges : courbe de Bézier quadratique
  // Le point de contrôle est décalé du milieu du segment, perpendiculairement, de `courbure`.
  courbes = AFF.cour.map(([type, s, t, courbure, posEtiquette = 0.5]) => {
    const a = NOTIONS[s], b = NOTIONS[t];
    const cle = `${s}${type}${t}`;
    const approx = type === "≈";
    // Style selon le type : ≈ approchée (vert), ⊘ aucune approximation (rouge), ≠ implication perdue (orange)
    const style = { "≈": "approx", "⊘": "neg", "≠": "perdue" }[type];

    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const px = -(b.y - a.y) / len, py = (b.x - a.x) / len;          // vecteur unitaire perpendiculaire
    const ctl = { x: (a.x + b.x) / 2 + px * courbure, y: (a.y + b.y) / 2 + py * courbure };
    const [x1, y1] = bord(a, ctl), [x2, y2] = bord(b, ctl);
    const d = `M${x1} ${y1} Q${ctl.x} ${ctl.y} ${x2} ${y2}`;

    const line = svgEl("path", { d, class: style, "marker-end": `url(#arrow-${style})` }, svg);

    // Point de la courbe au paramètre u : B(u) = (1-u)² P0 + 2u(1-u) C + u² P2
    const u = posEtiquette;
    const qx = (1 - u) ** 2 * x1 + 2 * u * (1 - u) * ctl.x + u ** 2 * x2;
    const qy = (1 - u) ** 2 * y1 + 2 * u * (1 - u) * ctl.y + u ** 2 * y2;
    const cote = courbure >= 0 ? 1 : -1;
    const label = svgEl("text", { x: qx + px * 14 * cote, y: qy + py * 14 * cote + 4,
      "text-anchor": "middle", class: `${style}-label` });
    label.textContent = { approx: `${LIENS[cle].alpha}-${t}`, neg: ui("aucunAlpha"), perdue: ui("plusVrai") }[style];

    const hit = svgEl("path", { d, class: "hit ghost", tabindex: -1, role: "button",
      "aria-label": { approx: ui("ariaApprox", s, approx ? LIENS[cle].alpha : "", t),
                      neg: ui("ariaNeg", s, t), perdue: ui("ariaPerdue", s, t) }[style] }, svg);

    return { s, t, cle, line, label, hit };
  });

  // Boîtes des notions (dessinées après les flèches pour passer par-dessus)
  boites = {};
  for (const id of AFF.notions) {
    const n = NOTIONS[id], fam = FAMILLES[n.fam], ex = statut(id)?.ex;
    const g = svgEl("g", { class: "node", tabindex: 0, role: "button",
      "aria-label": `${etiquette(id)} : ${LANG === "en" ? n.en : n.fr}.${ex ? ` ${STATUT[ex]}.` : ""} ${ui("ouvrirCarte")}` }, svg);
    g.dataset.k = "n:" + id;
    g.style.setProperty("--fc", fam.couleur);
    svgEl("rect", { x: n.x - n.w / 2, y: n.y - H / 2, width: n.w, height: H, rx: 5, stroke: fam.couleur }, g);
    svgEl("text", { x: ex ? n.x - 7 : n.x, y: n.y + 5, "text-anchor": "middle" }, g).textContent = etiquette(id);
    if (ex) svgEl("text", { x: n.x + n.w / 2 - 12, y: n.y + 5, "text-anchor": "middle", class: "glyph" + (ex === "inconnu" ? " inconnu" : "") }, g).textContent = GLYPHE[ex];
    boites[id] = g;
  }

  // Étiquettes des courbes tout au-dessus, lisibles même sur une boîte
  for (const c of courbes) svg.appendChild(c.label);

  // Rendre tout cela cliquable (rendreCliquable est défini en partie F)
  for (const id in boites) rendreCliquable(boites[id], id);
  for (const c of courbes) rendreCliquable(c.hit, c.cle);
  // Zones de clic larges et invisibles sur les flèches droites, glissées sous les boîtes
  for (const f of [...fleches, ...jumelles]) {
    const hit = svgEl("line", { x1: f.x1, y1: f.y1, x2: f.x2, y2: f.y2, class: "hit", tabindex: 0, role: "button",
      "aria-label": ui("ariaFleche", f.s, sepDe(f.cle) === "~", f.t) });
    svg.insertBefore(hit, boites[Object.keys(boites)[0]]);
    rendreCliquable(hit, f.cle, { delaiEntree: DELAI_FLECHE });
  }

  // Ce qui apparaît depuis le dernier dessin se fond à l'entrée ; une jumelle qui se sépare
  // de sa notion fusionnée part de la position de celle-ci.
  if (avant && avant.carte === carteId) for (const el of svg.querySelectorAll("[data-k]")) {
    if (avant.cles.has(el.dataset.k)) continue;
    const id = el.dataset.k.slice(2), cible = avant.alias[id];
    if (cible && el.dataset.k.startsWith("n:")) {
      el.style.setProperty("--dx", `${NOTIONS[cible].x - NOTIONS[id].x}px`);
      el.style.setProperty("--dy", `${NOTIONS[cible].y - NOTIONS[id].y}px`);
      el.classList.add("defusion");
    } else el.classList.add("apparait");
  }
  dernierAffichage = { carte: carteId, cles: clesAffichage(AFF), alias: AFF.alias };
}

// Avant de redessiner : faire disparaître ce qui s'en va, et glisser les jumelles qui fusionnent
function animerSortie(apres) {
  const A = affichage(), cles = clesAffichage(A);
  let rien = true;
  for (const el of svg.querySelectorAll("[data-k]")) {
    if (cles.has(el.dataset.k)) continue;
    rien = false;
    const id = el.dataset.k.slice(2), cible = A.alias[id];
    if (cible && el.dataset.k.startsWith("n:"))
      el.style.transform = `translate(${NOTIONS[cible].x - NOTIONS[id].x}px, ${NOTIONS[cible].y - NOTIONS[id].y}px)`;
    el.classList.add("sort");
  }
  // les flèches qui touchent une notion qui fusionne s'effacent aussi (elles seront redessinées)
  for (const el of svg.querySelectorAll("line.edge, line.twin")) if (!cles.has(el.dataset.k)) el.classList.add("sort");
  const reduit = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (rien || reduit) apres(); else setTimeout(apres, 330);
}


/* ================================================================
   D. SURBRILLANCE
   ----------------------------------------------------------------
   `selection` = ce qui est ouvert (clé de notion ou de lien, ou null).
   surligner(cle) met en avant cle et ses voisins ; on revient toujours
   à surligner(selection) quand la souris sort.
   ================================================================ */
let selection = null;

// D'après les flèches dessinées (le sélecteur de valuations peut en retirer ou en fusionner)
const impliquePar = id => fleches.filter(f => f.t === visible(id)).map(f => f.s);
const implique    = id => fleches.filter(f => f.s === visible(id)).map(f => f.t);

function allumerFleche(f) {
  f.line.classList.add("on");
  f.line.setAttribute("marker-end", f.hors ? "url(#arrow-hors)" : "url(#arrow-on)");
}

function surligner(cle) {
  if (cle && !estLien(cle)) cle = visible(cle);
  // 1. tout remettre à zéro
  for (const id in boites) boites[id].classList.remove("on", "sel");
  for (const f of fleches) { f.line.classList.remove("on", "hot"); f.line.setAttribute("marker-end", f.hors ? "url(#arrow-hors)" : "url(#arrow)"); }
  for (const j of jumelles) j.line.classList.toggle("on", !!cle && (j.s === cle || j.t === cle || j.cle === cle));

  // 2. courbes vertes/rouges : visibles si on survole leur notion de départ/arrivée, ou la courbe elle-même
  for (const c of courbes) {
    const visible = !!cle && (estLien(cle) ? c.cle === cle : (c.s === cle || c.t === cle));
    for (const x of [c.line, c.label, c.hit]) x.classList.toggle("show", visible);
    c.hit.setAttribute("tabindex", visible ? 0 : -1);
    // La courbe survolée (ou ouverte) passe au premier plan et s'épaissit. On ne déplace que le
    // trait et l'étiquette (sans réaction à la souris), pas la zone de clic, pour ne pas perdre le survol.
    const active = c.cle === cle;
    c.line.classList.toggle("hot", active);
    c.label.classList.toggle("hot", active);
    if (active) svg.append(c.line, c.label);
  }
  if (!cle) return;

  // 3a. un lien : allumer ses deux extrémités
  if (estLien(cle)) {
    const lien = [...fleches, ...jumelles, ...courbes].find(x => x.cle === cle);
    if (!lien) return;                                   // lien masqué par le sélecteur
    boites[lien.s].classList.add("on");
    boites[lien.t].classList.add("on");
    if (sepDe(cle) === ">") { allumerFleche(lien); lien.line.classList.add("hot"); }
    return;
  }

  // 3b. une notion : elle (teinte forte), ses flèches, ses voisins, sa jumelle
  if (!boites[cle]) return;                             // notion masquée par le sélecteur
  boites[cle].classList.add("sel");
  for (const f of fleches) if (f.s === cle || f.t === cle) {
    allumerFleche(f);
    boites[f.s].classList.add("on");
    boites[f.t].classList.add("on");
  }
  for (const j of jumelles) if (j.s === cle || j.t === cle) {
    boites[j.s].classList.add("on");
    boites[j.t].classList.add("on");
  }
}

// Légende : survoler une famille allume toutes ses notions et les flèches internes
function surlignerFamille(fam) {
  for (const id in boites) boites[id].classList.remove("fam-hl");
  if (!fam) { surligner(selection); return; }
  surligner(null);
  for (const id in NOTIONS) if (NOTIONS[id].fam === fam) boites[id]?.classList.add("on", "fam-hl");
  for (const f of fleches) if (NOTIONS[f.s].fam === fam && NOTIONS[f.t].fam === fam) allumerFleche(f);
}

// Délais de survol. Un seul minuteur pour tout : chaque entrée ou sortie remplace l'action en attente.
//   DELAI_SORTIE : après avoir quitté un élément, on garde la surbrillance un moment,
//                  le temps d'aller attraper une courbe verte ou rouge avec la souris.
//   DELAI_FLECHE : une flèche grise ne prend la main que si la souris s'y arrête ;
//                  la traverser en chemin vers une courbe ne fait rien.
const DELAI_SORTIE = 1000;
const DELAI_FLECHE = 250;
let minuteur = null;
function plusTard(action, ms) {
  clearTimeout(minuteur);
  if (ms) minuteur = setTimeout(action, ms); else action();
}
const annulerRetour = () => clearTimeout(minuteur);


/* ================================================================
   E. LA CARTE
   ================================================================ */

// Boutons-pastilles vers d'autres notions
function pastilles(ids) {
  if (!ids.length) return `<span class="none">${ui("aucuneGraphe")}</span>`;
  return `<div class="chips">${ids.map(k =>
    `<button class="chip" data-go="${k}" style="--cc:${FAMILLES[NOTIONS[k].fam].couleur}">${aff(k)}</button>`).join("")}</div>`;
}

// Bas de carte sur une ligne : [titre, ids] à gauche, au centre (facultatif), à droite
function basDeCarte(gauche, centre, droite) {
  const col = (cls, [titre, ids]) => `<div class="${cls}"><h3>${titre}</h3>${pastilles(ids)}</div>`;
  return `<div class="bas">${col("g", gauche)}${centre ? col("c", centre) : "<div></div>"}${col("d", droite)}</div>`;
}

const bandeau = titre =>
  `<div class="band"><span>${titre}</span><button class="close" aria-label="${ui("fermer")}">×</button></div>`;

// Bloc formule : quantificateurs en haut à gauche, formule centrée, puis « où » + définitions
function htmlFormule(n) {
  const q = n.q ? `<div class="quant">${texte(n.q)}</div>` : "";
  const ou = n.ou
    ? `<div class="ou"><span class="ou-mot">${ui("ou")}</span>${n.ou.map(l => tex(l, true)).join("")}</div>`
    : "";
  return `<div class="formula">${q}<div class="corps">${tex(n.f, true)}</div>${ou}</div>`;
}

// Carte d'une notion
const nomFr = n => n.fr;
// Nom affiché d'une notion : son sigle, sauf si la langue en donne un autre (Valuations : « Submodular »…)
const aff = id => NOTIONS?.[id]?.sigle ?? id;
function htmlNotion(id) {
  const n = NOTIONS[id], fam = FAMILLES[n.fam];
  const membres = Object.keys(NOTIONS).filter(k => NOTIONS[k].fam === n.fam);
  card.style.setProperty("--fc", fam.couleur);
  return `
    ${bandeau(ui("famille", fam.nom))}
    <div class="body">
      <div class="haut">
        <div class="top"><span class="sigle" id="card-sigle">${aff(id)}</span>${n.src ? `<span class="src-def">${texte(n.src)}</span>` : ""}${statut(id) ? `<span class="status">${STATUT[statut(id).ex]}</span>` : ""}</div>
        <div class="en">${LANG === "en" ? n.en : `${nomFr(n)} · <i>${n.en}</i>`}</div>
        <p>${texte(n.def)}</p>
        ${bandeauNotion(id)}
      </div>
      <div class="milieu">
        ${htmlFormule(n)}
        ${htmlApprox(id)}
        ${n.note ? `<p class="retenir-note"><b>${ui("aRetenir")}</b> ${texte(n.note)}</p>` : ""}
      </div>
      ${basDeCarte(
        [(carteCourante.libelles ?? [ui("impliqueePar")])[0], impliquePar(id)],
        n.jumelle ? [ui("jumelle"), [n.jumelle]] : null,
        [(carteCourante.libelles ?? [, ui("implique")])[1], implique(id)])}
    </div>
    <div class="family"><b>${fam.nom}${LANG === "en" ? ":" : " :"}</b>${membres.map(k => `<span class="${k === id ? "me" : ""}">${aff(k)}</span>`).join("")}</div>`;
}


// Échelle d'approximation : une barre par contexte, verte (existe), orange (ouvert), rouge (impossible)
function htmlApprox(id) {
  const A = carteCourante.approx?.[id];
  if (!A) return "";
  const [lo, hi] = A.echelle ?? [0, 1], bas = A.sens === "bas";
  const pc = x => Math.max(0, Math.min(100, (Math.min(x, hi) - lo) / (hi - lo) * 100));
  const sources = [];
  const lignes = A.lignes.map(L => {
    const e = L.existe, r = L.impossible;
    const xe = pc(e.x), xr = r ? pc(r.x) : (bas ? 0 : 100);
    let segs;
    if (!bas) {
      segs = [["vert", 0, xe], ["ouvert", xe, r ? xr : 100], ["rouge", r ? xr : 100, 100]];
      if (r && r.x >= hi - 1e-9 && e.x < hi) segs[2] = ["rouge", 98.5, 100];   // seul α = 1 est exclu
    } else {
      segs = [["rouge", 0, r ? xr : 0], ["ouvert", r ? xr : 0, xe], ["vert", xe, 100]];
    }
    const html = segs.filter(([, a, b]) => b - a > 0.01).map(([c, a, b], k, t) =>
      `<span class="seg ${c}${t.length === 1 ? " plein" : ""}" style="left:${a}%;width:${b - a}%"></span>`).join("");
    // graduations (une seule si les deux tombent au même endroit)
    const ticks = [];
    if (e.x > lo + 1e-9 && e.x < hi - 1e-9) ticks.push([xe, e.l]);
    if (r && r.x > lo + 1e-9 && r.x < hi - 1e-9 && Math.abs(r.x - e.x) > 1e-9) ticks.push([xr, r.l]);
    ticks.sort((a, b) => a[0] - b[0]);
    // deux graduations proches : la première s'écrit à gauche du trait, la seconde à droite
    const serre = ticks.length === 2 && ticks[1][0] - ticks[0][0] < 14;
    const htmlTicks = ticks.map(([x, l], k) =>
      `<span class="tick" style="left:${x}%"><span class="lab${serre ? (k ? " droite" : " gauche") : ""}">${tex(l, false, false)}</span></span>`).join("");
    const bouts = L !== A.lignes[A.lignes.length - 1] ? "" : `<span class="bout g">${fmtBout(lo)}</span><span class="bout d">${bas ? `${fmtBout(hi)} →` : fmtBout(hi)}</span>`;
    if (e.t) sources.push(["var(--approx)", e.l, e.t, L.ctx, e.src]);
    if (r?.t) sources.push(["var(--neg)", r.l, r.t, L.ctx, r.src]);
    const classeLigne = { "sous-modulaire": "sousmod", submodular: "sousmod", XOS: "xos", "sous-additive": "sousadd", subadditive: "sousadd", monotone: "monotone" }[L.ctx] ?? "additive";
    const mise = !actifSurCarte() || contexte.classe === "additive" ? "" : classeLigne === contexte.classe ? " courante" : " attenuee";
    return `<div class="approx-ligne${mise}"><span class="ctx">${L.ctx}</span><div class="barre">${html}${htmlTicks}${bouts}</div></div>`;
  }).join("");
  const liste = sources.map(([c, l, t, ctx, src]) =>
    `<li style="--pc:${c}"><b>${tex(l, false, false)}</b> · ${texte(t)} · <i>${ctx}</i>${src ? ` · ${texte(src)}` : ""}</li>`).join("");
  return `<div class="echelle-alpha">
    <h3>${ui("versionApprochee")} <span class="def-alpha">${tex(T`\alpha`, false, false)}-${id} : ${tex(A.def, false)}</span></h3>
    ${lignes}
    ${liste ? `<details><summary>${ui("dOuGraduations")}</summary><ul class="approx-sources">${liste}</ul></details>` : ""}
    ${A.note ? `<p class="none">${A.note}.</p>` : ""}
  </div>`;
}
const fmtBout = x => LANG === "en" ? String(x) : String(x).replace(".", ",");

// Carte d'un lien : le titre et les intertitres dépendent du type
const TYPES_LIEN_FR = {
  ">": { couleur: "var(--muted)",  bandeau: "Implication",          h1: "Pourquoi",                         h2: (a, b) => `Contre-exemple : ${b} ⇏ ${a}`,
         titre: (a, b) => T`\text{${a}} \Rightarrow \text{${b}}` },
  "~": { couleur: "var(--muted)",  bandeau: "Notions jumelles",     h1: "Ce qui les distingue",             h2: () => "Exemple",
         titre: (a, b) => T`\text{${a}} \leftrightarrow \text{${b}}` },
  "≈": { couleur: "var(--approx)", bandeau: "Implication approchée", h1: "Pourquoi",                         h2: () => "Limites",
         titre: (a, b, L) => T`\text{${a}} \Rightarrow ${L.alphaTex}\text{-${b}}` },
  "⊘": { couleur: "var(--neg)",    bandeau: "Aucune approximation", h1: "Contre-exemple, pour tout α > 0", h2: () => "Remarque et source",
         titre: (a, b) => T`\text{${a}} \not\Rightarrow \alpha\text{-${b}}` },
  "≠": { couleur: "var(--perdue)", bandeau: "Implication perdue",   h1: "Ce qui change avec des droits inégaux", h2: (a, b, L) => L.valuations ? "Contre-exemple" : "Remarque et source",
         titre: (a, b) => T`\text{${a}} \not\Rightarrow \text{${b}}` },
};
function htmlLien(cle) {
  const sep = sepDe(cle), [a, b] = cle.split(sep), L = LIENS[cle], type = LANG === "en" ? { ...TYPES_LIEN_FR[sep], ...TYPES_LIEN_EN[sep] } : TYPES_LIEN_FR[sep];
  card.style.setProperty("--fc", type.couleur);
  return `
    ${bandeau(type.bandeau)}
    <div class="body">
      <div class="haut">
        <div class="top"><span class="sigle link" id="card-sigle">${tex(type.titre(aff(a), aff(b), L))}</span></div>
        ${bandeauLien(cle)}
        ${htmlPreuve(sep, a, b, L, type)}
      </div>
      <div class="milieu">
        <div><h3>${type.h2(aff(a), aff(b), L)}</h3>${sep === "⊘" ? `<p class="ex">${texte(L.exemple)}</p>` : exercice(L, L.exemple, cle)}</div>
      </div>
      ${basDeCarte([ui("carteDe"), [a]], null, [ui("carteDe"), [b]])}
    </div>`;
}
// Pour une flèche rouge, l'instance illustre le contre-exemple (la « preuve »), donc l'exercice va
// en haut ; sinon il illustre l'exemple « B mais pas A », au milieu.

// Hypothèses récurrentes des ponts, notées par un symbole fixe au-dessus des relations.
// Elles ne sont pas réexpliquées dans chaque carte : l'onglet Valuations les définit.
const HYPOTHESES = {
  "+": () => ui("additivite"),
  m: () => carteId === "corvees" ? ui("monotonieCouts") : ui("monotonieVal"),
};

// Une définition seule (quantificateurs + formule), sans les « où » : pour le départ et l'arrivée
function htmlDefinition(titre, d) {
  const q = d.q ? `<div class="quant">${texte(d.q)}</div>` : "";
  return `<div class="etape"><h3>${titre}</h3><div class="formula">${q}<div class="corps">${tex(d.f, true)}</div></div></div>`;
}

// Le haut d'une carte de lien.
//   Implication (>) ou approchée (≈) avec un pont : départ = définition de A, pont = étapes
//   (formule + justification), arrivée = définition de B (ou de α-B, donnée par `arrivee`),
//   puis les hypothèses utilisées par la preuve.
//   Jumelles (~) : les deux définitions l'une sous l'autre, puis ce qui les distingue.
//   Sinon (⊘, ≠, ou lien sans pont) : le texte de `preuve`, comme avant.
function htmlPreuve(sep, a, b, L, type) {
  if ((sep === ">" || sep === "≈") && L.pont) {
    // Une étape : (formule, texte) ou (formule, [raisons]). Au-dessus de chaque relation, \just{…}{≤} :
    //   un numéro (1), (2)… → raison prise, dans l'ordre, dans la liste de l'étape ;
    //   une lettre (a), (m) → hypothèse récurrente, expliquée une seule fois par carte (HYPOTHESES) ;
    //   un sigle (EF, PROP…) → la notion elle-même, rien à expliquer.
    const vues = new Set();
    const pas = L.pont.map(([f, pourquoi]) => {
      let explication = Array.isArray(pourquoi) ? "" : `<p>${texte(pourquoi)}</p>`;
      if (Array.isArray(pourquoi)) {
        const lignes = []; let k = 0;
        for (const [, e] of (f ?? "").matchAll(/\\just\{([^}]*)\}/g)) {
          if (/^\d+$/.test(e)) lignes.push([e, pourquoi[k++]]);
          else if (HYPOTHESES[e]) vues.add(e);   // (+), (m) : définis dans l'onglet Valuations
        }
        explication = lignes.length
          ? `<ol class="raisons">${lignes.map(([e, r]) => `<li><span class="num">(${e})</span> ${texte(r)}</li>`).join("")}</ol>` : "";
      }
      return `<div class="pas">${f ? tex(f, true) : ""}${explication}</div>`;
    }).join("");
    // Ligne « Hypothèses utilisées » : masquée quand elle ne dit rien de plus que les lettres (a), (m)
    // déjà affichées au-dessus des relations ; gardée sinon (hypothèse cachée dans une raison
    // numérotée, hypothèse de signe, résumé d'article, ou pure logique).
    const LETTRE_DE = { "additivité": "+", "monotonie": "m", "additivity": "+", "monotonicity": "m" };
    const redondante = L.hyp.length > 0 && L.hyp.every(h => vues.has(LETTRE_DE[h]));
    const hyp = L.hyp.length ? L.hyp.map(texte).join(" · ") : ui("pureLogique");
    const nomArrivee = sep === "≈" ? `${L.alpha}-${b}` : aff(b);
    return `
      ${htmlDefinition(`${ui("depart")} · ${aff(a)}`, NOTIONS[a])}
      <div class="etape"><h3>${ui("pont")}${vues.size ? ` <a class="vers-valuations" href="#valuations">${[...vues].map(e => `(${e})`).join(" ")} : ${ui("voirValuations")}</a>` : ""}</h3><div class="pont">${pas}</div></div>
      ${htmlDefinition(`${ui("arrivee")} · ${nomArrivee}`, L.arrivee ? { ...NOTIONS[b], ...L.arrivee } : NOTIONS[b])}
      ${redondante || carteCourante.sansHypotheses ? "" : `<p class="hyp"><b>${ui("hypUtilisees")}</b> ${hyp}</p>`}`;
  }
  if (sep === "~")
    return `${htmlDefinition(aff(a), NOTIONS[a])}${htmlDefinition(aff(b), NOTIONS[b])}
      <div><h3>${type.h1}</h3><p>${texte(L.preuve)}</p></div>`;
  return `<div><h3>${type.h1}</h3>${sep === "⊘" ? exercice(L, L.preuve, `${a}${sep}${b}`) : `<p>${texte(L.preuve)}</p>`}</div>`;
}

// Un exemple sous forme d'exercice : tableau + allocation + question, et la solution repliée
// dans un <details> (le navigateur gère l'ouverture au clic, sans JavaScript).
// Sans tableau, on affiche simplement le texte.
function exercice(L, solution, cle) {
  if (!L.valuations || !L.question) return `${htmlInstance(L)}<p class="ex">${texte(solution)}</p>`;
  return `
    ${htmlInstance(L)}
    <p class="question">${texte(L.question)}</p>
    <details class="solution"><summary>${ui("voirSolution")}</summary>${matriceSolution(L, cle)}<p>${texte(solution)}</p></details>`;
}

/* ----------------------------------------------------------------
   Matrice des paniers, affichée dans la solution d'un exercice.
   Case (i, j) = valeur du panier de j vue par i, vᵢ(Aⱼ) (cᵢ(Aⱼ) pour les corvées,
   vᵢ(Aⱼ)/sⱼ pour la carte pondérée). La diagonale est ce que chacun a.
   • si une notion d'envie est en jeu : les cases enviées sont en rouge
     (plus grandes que la diagonale sur leur ligne ; plus petites pour les corvées) ;
   • si une notion de part est en jeu : une colonne de plus avec le seuil (part proportionnelle,
     part maximin…), et ✓ / ✗ quand la notion exacte (PROP, MMS…) est l'une des deux du lien.
   Tout est calculé à partir de `valuations` et `allocation` ; si une valeur n'est pas un nombre
   (ε, ⋯), la ligne est omise, et sans aucune ligne la matrice n'est pas affichée.
   ---------------------------------------------------------------- */
let carteId = "biens";   // carte affichée (mise à jour par afficherCarte)
const NOTIONS_ENVIE  = new Set(["EF", "EFX", "EF1", "EFL", "EFR", "EEFX", "WEF", "WEFX", "WEF1", "WWEF1"]);
const NOTIONS_EGAL   = new Set(["EQ", "EQX", "EQ1"]);
const NOTIONS_PART   = new Set(["PROP", "PROPX", "PROP1", "PROPm", "WPROP", "WPROP1"]);
const NOTIONS_MAXMIN = new Set(["MMS", "NMMS", "WMMS"]);

// "3", "0{,}6", "\tfrac12", "\tfrac1{12}" → nombre ; sinon NaN
function lireNombre(t) {
  t = t.trim();
  if (/^-?\d+$/.test(t)) return +t;
  let m = /^(\d+)\{,\}(\d+)$/.exec(t);
  if (m) return parseFloat(m[1] + "." + m[2]);
  m = /^\\[td]?frac\s*(\d|\{\d+\})\s*(\d|\{\d+\})$/.exec(t);
  if (m) return +m[1].replace(/[{}]/g, "") / +m[2].replace(/[{}]/g, "");
  return NaN;
}
// nombre → LaTeX : entier, petite fraction, ou décimal à virgule
function ecrireNombre(x) {
  if (Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x));
  for (let q = 2; q <= 12; q++) {
    const p = x * q;
    if (Math.abs(p - Math.round(p)) < 1e-9) return T`\tfrac{${Math.round(p)}}{${q}}`;
  }
  return x.toFixed(2).replace(".", "{,}");
}
// Part maximin par force brute (petits exemples seulement) : on essaie toutes les façons
// de répartir les biens en n paquets. Avec des poids, on compare valeur / poids du paquet (WMMS).
function partMaximin(v, n, corvees, poids = null) {
  if (n ** v.length > 50000) return NaN;
  const paquets = new Array(n).fill(0);
  let meilleur = corvees ? Infinity : -Infinity;
  const essayer = k => {
    if (k === v.length) {
      const vals = paquets.map((x, j) => poids ? x / poids[j] : x);
      const pire = corvees ? Math.max(...vals) : Math.min(...vals);
      meilleur = corvees ? Math.min(meilleur, pire) : Math.max(meilleur, pire);
      return;
    }
    for (let j = 0; j < n; j++) { paquets[j] += v[k]; essayer(k + 1); paquets[j] -= v[k]; }
  };
  essayer(0);
  return meilleur;
}

function matriceSolution(L, cle) {
  if (!L.valuations || !L.allocation || !cle) return "";
  const [a, b] = cle.split(sepDe(cle)), notions = [a, b];
  const enJeu = ens => notions.some(x => ens.has(x));
  const envie = enJeu(NOTIONS_ENVIE), part = enJeu(NOTIONS_PART), maxmin = enJeu(NOTIONS_MAXMIN);
  if (!envie && !part && !maxmin && !enJeu(NOTIONS_EGAL)) return "";

  const corvees = carteId === "corvees", pondere = carteId === "ponderee";
  const decoupe = s => s.trim() ? s.trim().split(/\s+/) : [];
  const biens = decoupe(L.valuations.biens);
  const agents = Object.keys(L.allocation), n = agents.length;
  const droit = ag => pondere ? lireNombre(L.valuations.droits?.[ag] ?? "") : 1 / n;
  if (pondere && !agents.every(ag => droit(ag) > 0)) return "";
  const panier = ag => decoupe(L.allocation[ag] ?? "").map(g => biens.indexOf(g));
  if (agents.some(ag => panier(ag).some(k => k < 0))) return "";
  const lignes = Object.entries(L.valuations.agents)
    .map(([ag, vals]) => [ag, decoupe(vals).map(lireNombre)])
    .filter(([, v]) => v.length === biens.length && v.every(Number.isFinite));
  if (!lignes.length) return "";

  const valeur = (v, ag) => panier(ag).reduce((t, k) => t + v[k], 0);
  const affichee = (v, ag) => valeur(v, ag) / (pondere ? droit(ag) : 1);   // pondéré : vᵢ(Aⱼ)/sⱼ
  const enviable = (x, moi) => corvees ? x < moi - 1e-9 : x > moi + 1e-9;
  const respecte = (moi, seuil) => corvees ? moi <= seuil + 1e-9 : moi >= seuil - 1e-9;
  const total = v => v.reduce((t, x) => t + x, 0);

  // Colonnes de seuils : [entête, calcul du seuil, notion exacte qui donne droit à ✓ / ✗]
  const seuils = [];
  if (part) seuils.push(pondere
    ? [T`s_i \cdot v_i(M)`, (ag, v) => droit(ag) * total(v), "WPROP"]
    : [corvees ? T`\tfrac{c_i(M)}{n}` : T`\tfrac{v_i(M)}{n}`, (ag, v) => total(v) / n, "PROP"]);
  if (notions.includes("MMS")) seuils.push([T`\mu_i`, (ag, v) => partMaximin(v, n, corvees), "MMS"]);
  if (notions.includes("NMMS")) seuils.push([T`n\, s_i\, \mu_i`, (ag, v) => n * droit(ag) * partMaximin(v, n, false), "NMMS"]);
  if (notions.includes("WMMS")) seuils.push([T`F_i\, s_i\, v_i(M)`,
    (ag, v) => droit(ag) * partMaximin(v, n, false, agents.map(droit)), "WMMS"]);

  const coin = pondere ? T`\scriptstyle v_i(A_j)/s_j` : corvees ? T`\scriptstyle c_i(A_j)` : T`\scriptstyle v_i(A_j)`;
  const entete = [coin, ...agents.map(ag => T`A_{\text{${ag}}}`), ...seuils.map(([e]) => e)].join(" & ");
  const corps = lignes.map(([ag, v]) => {
    const moi = affichee(v, ag);
    const cases = agents.map(autre => {
      const x = ecrireNombre(affichee(v, autre));
      if (autre === ag) return T`\diag{${x}}`;
      return envie && enviable(affichee(v, autre), moi) ? T`\envie{${x}}` : x;
    });
    const extra = seuils.map(([, calcul, exacte]) => {
      const s = calcul(ag, v);
      if (!Number.isFinite(s)) return T`\text{—}`;
      const marque = notions.includes(exacte) ? (respecte(valeur(v, ag), s) ? T`\ \text{✓}` : T`\ \text{✗}`) : "";
      return ecrireNombre(s) + marque;
    });
    return [T`\text{${ag}}`, ...cases, ...extra].join(" & ");
  });
  const tableau = T`\begin{array}{l|${"c".repeat(agents.length)}${seuils.length ? "|" + "c".repeat(seuils.length) : ""}} ${entete} \\ \hline ${corps.join(T` \\ `)} \end{array}`;
  return `<div class="instance matrice extra${seuils.length}">${tex(tableau, true, false)}</div>`;
}

// Instance d'un exemple : tableau des valuations (une ligne par agent, une colonne par bien),
// les biens reçus en gras, puis l'allocation A écrite en clair.
//   valuations: { biens: "a b c", agents: { Alice: "2 1 1", Bob: "2 1 1" } }
//   allocation: { Alice: "b", Bob: "a c" }          (facultatif)
// Chaque chaîne est une liste séparée par des espaces ; les éléments peuvent être du LaTeX.
function htmlInstance(L) {
  if (!L.valuations) return "";
  const decoupe = s => s.trim() ? s.trim().split(/\s+/) : [];
  const biens = decoupe(L.valuations.biens);
  const recus = agent => L.allocation ? decoupe(L.allocation[agent] ?? "") : [];

  // Carte pondérée : une dernière colonne donne le droit s_i de chaque agent
  const droits = L.valuations.droits;
  const entete = ["", ...biens, ...(droits ? [T`s_i`] : [])].join(" & ");
  const lignes = Object.entries(L.valuations.agents).map(([agent, vals]) =>
    [T`\text{${agent}}`, ...decoupe(vals).map((v, k) => recus(agent).includes(biens[k]) ? T`\pris{${v}}` : v),
     ...(droits ? [droits[agent]] : [])].join(" & "));
  const tableau = T`\begin{array}{l|${"c".repeat(biens.length)}${droits ? "|c" : ""}} ${entete} \\ \hline ${lignes.join(T` \\ `)} \end{array}`;

  let alloc = "";
  if (L.allocation) {
    const ens = agent => recus(agent).length ? T`\{${recus(agent).join(", ")}\}` : T`\varnothing`;
    alloc = Object.keys(L.allocation).map(ag => T`A_{\text{${ag}}} = ${ens(ag)}`).join(T`,\quad `);
  }
  return `<div class="instance${droits ? " droits" : ""}">${tex(tableau, true, false)}${alloc ? tex(alloc, true, false) : ""}</div>`;
}

// La position de la carte est entièrement gérée par le CSS (panneau à droite ou bandeau en bas).
// Le JS ne fait que choisir son contenu. `grandEcran` suit la même limite que le CSS.
const grandEcran = window.matchMedia("(min-width: 1180px)");

// Rien de sélectionné : sur grand écran, un emplacement vide qui dit quoi faire ; sinon, rien
function afficherVide() {
  card.className = "card vide";
  card.innerHTML = `<div class="body"><p class="none">${ui("vide")}</p></div>`;
  card.hidden = !grandEcran.matches;
}

function ouvrir(cle) {
  selection = cle;
  card.innerHTML = estLien(cle) ? htmlLien(cle) : htmlNotion(cle);
  card.hidden = false;
  card.scrollTop = 0;
  // rejouer l'animation « carte distribuée » à chaque nouvelle carte
  card.className = "card";
  void card.offsetWidth;
  card.classList.add("deal");
  surligner(cle);
}
function fermer() {
  const avant = selection;
  selection = null;
  afficherVide();
  surligner(null);
  if (avant && boites[avant]) boites[avant].focus({ preventScroll: true });
}
const basculer = cle => selection === cle ? fermer() : ouvrir(cle);


/* ================================================================
   G. ONGLET ALGORITHMES
   ----------------------------------------------------------------
   Trois algorithmes du survey, exécutés pas à pas sur une petite instance additive :
     Tourniquet (Algorithme 1, § 3.1), Élimination des cycles d'envie (Algorithme 2, § 3.1),
     Remplissage de sacs (Algorithme 3, § 5.1).
   Chaque algorithme renvoie la liste de ses étapes ; l'affichage ne fait que montrer l'étape k.
   v[i][k] = valeur du bien k pour l'agent i.
   ================================================================ */
const NOMS_AGENTS = ["Alice", "Bob", "Chloé", "David"];
const NOMS_BIENS = "abcdefgh";
const nomA = i => NOMS_AGENTS[i];
const nomB = k => NOMS_BIENS[k];
const ensB = S => S.length ? `{${S.map(nomB).join(", ")}}` : "∅";
const somme = (v, i, S) => S.reduce((t, k) => t + v[i][k], 0);
const copie = A => A.map(P => P.slice());
const fmt = x => Number.isInteger(x) ? String(x) : x.toFixed(2).replace(/0$/, "").replace(".", LANG === "en" ? "." : ",");
const listeNoms = ids => ids.length <= 1 ? ids.map(nomA).join("") : ids.slice(0, -1).map(nomA).join(", ") + ui("et") + nomA(ids[ids.length - 1]);

// Part maximin par force brute (avec une symétrie : deux paquets de même valeur sont interchangeables)
function maximin(vi, n) {
  const m = vi.length; if (m < n) return 0;
  const ordre = vi.map((x, k) => k).sort((a, b) => vi[b] - vi[a]);
  const paquets = new Array(n).fill(0); let best = -Infinity;
  const essayer = t => {
    if (t === m) { best = Math.max(best, Math.min(...paquets)); return; }
    const vus = new Set();
    for (let j = 0; j < n; j++) {
      if (vus.has(paquets[j])) continue; vus.add(paquets[j]);
      paquets[j] += vi[ordre[t]]; essayer(t + 1); paquets[j] -= vi[ordre[t]];
    }
  };
  essayer(0);
  return best;
}

// Graphe d'envie : E[i][j] = i envie j
const grapheEnvie = (v, A) => A.map((_, i) => A.map((P, j) => i !== j && somme(v, i, P) > somme(v, i, A[i]) + 1e-9));
const nonEnvies = E => E.map((_, j) => j).filter(j => E.every(r => !r[j]));
// Appelé quand tout agent est envié : on remonte l'envie (u ← un agent qui envie u) jusqu'à
// revoir un agent ; la boucle parcourue à l'envers est un cycle d'envie i₁ → i₂ → … → i₁.
function cycleEnvie(E) {
  const chemin = [0], vus = new Map([[0, 0]]);
  for (let u = 0; ;) {
    const w = E.findIndex(r => r[u]);
    if (w < 0) return null;
    if (vus.has(w)) return chemin.slice(vus.get(w)).reverse();
    vus.set(w, chemin.length); chemin.push(w); u = w;
  }
}
// Bien préféré de i parmi les restants (à égalité : le premier dans l'ordre alphabétique)
const prefere = (v, i, R) => R.reduce((b, k) => v[i][k] > v[i][b] ? k : b, R[0]);

function executerTourniquet(v) {
  const n = v.length, m = v[0].length;
  const A = v.map(() => []); let R = [...Array(m).keys()];
  const etapes = [{ A: copie(A), R, type: "debut" }];
  for (let t = 0; t < m; t++) {
    const i = t % n, g = prefere(v, i, R);
    A[i].push(g); R = R.filter(k => k !== g);
    etapes.push({ A: copie(A), R, type: "choix", agent: i, bien: g, tour: t });
  }
  return etapes;
}

function executerCycles(v) {
  const m = v[0].length;
  let A = v.map(() => []), R = [...Array(m).keys()];
  const etapes = [{ A: copie(A), R, type: "debut" }];
  for (let t = 0; t < m; t++) {
    let E = grapheEnvie(v, A);
    for (let garde = 0; !nonEnvies(E).length && garde < 50; garde++) {
      const C = cycleEnvie(E);
      etapes.push({ A: copie(A), R, type: "cycle", cycle: C });
      const avant = C.map(i => A[i]);
      A = A.slice(); C.forEach((i, k) => { A[i] = avant[(k + 1) % C.length]; });
      etapes.push({ A: copie(A), R, type: "rotation", cycle: C });
      E = grapheEnvie(v, A);
    }
    const libres = nonEnvies(E), i = libres[0], g = prefere(v, i, R);
    A[i] = A[i].concat(g); R = R.filter(k => k !== g);
    etapes.push({ A: copie(A), R, type: "choix", agent: i, bien: g, libres });
  }
  return etapes;
}

// tau : le seuil de chaque agent. Avec tau = μ/2 (le cas du survey), la preuve garantit que tout se passe bien ;
// avec des seuils devinés, le sac peut ne suffire à personne (« panne ») ou le dernier agent finir sous son seuil.
function executerSacs(v, tau, base = {}) {
  let A = v.map(() => []), R = [...Array(v[0].length).keys()], actifs = [...Array(v.length).keys()], sac = [];
  const etat = o => ({ A: copie(A), R, actifs, sac, tau, ...base, ...o });
  const etapes = [etat({ type: "debut" })];
  // Phase 1 : un bien qui, seul, dépasse le seuil d'un agent lui est donné
  while (actifs.length > 1) {
    let trouve = null;
    for (const i of actifs) { const k = R.find(k => v[i][k] > tau[i] + 1e-9); if (k !== undefined) { trouve = [i, k]; break; } }
    if (!trouve) break;
    const [i, g] = trouve;
    A[i] = [g]; actifs = actifs.filter(x => x !== i); R = R.filter(k => k !== g);
    etapes.push(etat({ type: "gros", agent: i, bien: g }));
  }
  // Phase 2 : on remplit un sac jusqu'à ce qu'un agent restant l'accepte
  while (actifs.length > 1) {
    while (actifs.every(i => somme(v, i, sac) < tau[i] - 1e-9) && R.length) {
      const g = R[0];
      sac = sac.concat(g); R = R.slice(1);
      etapes.push(etat({ type: "ajout", bien: g }));
    }
    const contents = actifs.filter(i => somme(v, i, sac) >= tau[i] - 1e-9);
    if (!contents.length) {                 // plus de biens, et le sac ne suffit à personne (impossible si tau ≤ μ/2)
      etapes.push(etat({ type: "panne", bloques: actifs }));
      return etapes;
    }
    const i = contents[0];
    A[i] = sac; actifs = actifs.filter(x => x !== i); const pris = sac; sac = [];
    etapes.push(etat({ type: "prend", agent: i, pris, contents }));
  }
  if (actifs.length === 1) {
    const i = actifs[0], pris = R;
    A[i] = A[i].concat(R); R = []; actifs = [];
    etapes.push(etat({ type: "dernier", agent: i, pris }));
  }
  return etapes;
}

// Remplissage de sacs sans connaître μ : seuils de départ vᵢ(M)/2n (au moins μᵢ/2), et chaque agent qui
// finit sous son seuil voit ce seuil multiplié par (1 − ε). Un échec de i prouve τᵢ > μᵢ/2 (preuve du
// Théorème 7, qui ne dépend pas des seuils des autres), donc τᵢ ne descend jamais sous (1 − ε) μᵢ/2.
const EPSILON = 0.1;
function executerSansMu(v) {
  const n = v.length;
  let tau = v.map(r => r.reduce((a, b) => a + b, 0) / (2 * n));
  const etapes = [{ A: v.map(() => []), R: [...Array(v[0].length).keys()], actifs: [...Array(n).keys()], sac: [], tau, type: "debut" }];
  for (let essai = 1; essai <= 40; essai++) {
    const run = executerSacs(v, tau, { essai });
    run[0].type = "essai";
    etapes.push(...run);
    const fin = run[run.length - 1];
    const rates = fin.type === "panne" ? fin.bloques
      : [...Array(n).keys()].filter(i => somme(v, i, fin.A[i]) < tau[i] - 1e-9);
    if (!rates.length) { etapes.push({ ...fin, type: "succes" }); break; }
    const nouveau = tau.map((t, i) => rates.includes(i) ? t * (1 - EPSILON) : t);
    etapes.push({ ...fin, type: "echec", rates, nouveau });
    tau = nouveau;
  }
  return etapes;
}

// Propriétés d'une allocation (partielle ou complète)
function proprietesAlloc(v, A, mu) {
  const n = v.length;
  let EF = true, EF1 = true, EFX = true, PROP = true, alpha = Infinity;
  for (let i = 0; i < n; i++) {
    const moi = somme(v, i, A[i]);
    for (let j = 0; j < n; j++) if (j !== i && A[j].length) {
      const x = somme(v, i, A[j]), vs = A[j].map(k => v[i][k]);
      if (x > moi + 1e-9) EF = false;
      if (x - Math.max(...vs) > moi + 1e-9) EF1 = false;
      if (x - Math.min(...vs) > moi + 1e-9) EFX = false;
    }
    if (moi < v[i].reduce((a, b) => a + b, 0) / n - 1e-9) PROP = false;
    if (mu[i] > 0) alpha = Math.min(alpha, moi / mu[i]);
  }
  return { EF, EF1, EFX, PROP, alpha };
}

const ALGOS_FR = {
  tourniquet: {
    nom: "Tourniquet", en: "Round-Robin", fc: "var(--envie)",
    src: T`[Survey, Algorithme 1, § 3.1](survey)`,
    def: "Les agents choisissent à tour de rôle, toujours dans le même ordre ; à son tour, chacun prend son bien préféré parmi ceux qui restent.",
    lignes: [
      [0, T`Pour chaque tour $t = 1, \dots, m$ :`],
      [1, T`l'agent $i$ dont c'est le tour (ordre $1, 2, \dots, n, 1, 2, \dots$) choisit $g^* \in \operatorname*{arg\,max}_{g \in M} v_i(g)$`],
      [1, T`$A_i \gets A_i \cup \{g^*\}$, $\;M \gets M \setminus \{g^*\}$`],
    ],
    surligne: { debut: [], choix: [1, 2] },
    executer: v => executerTourniquet(v),
    garantie: [["EF1", "valuations additives (+)"]],
    sourceGarantie: T`[Caragiannis et al.](mnw19), survey Théorème 1`,
    retenir: T`Si $i$ choisit avant $j$, à chaque tour $i$ prend un bien qui vaut, à ses yeux, au moins celui que $j$ prendra ensuite : $i$ n'envie pas $j$. Et $j$ n'envie plus $i$ une fois retiré le premier bien choisi par $i$. EF1 tient donc à chaque étape.`,
  },
  cycles: {
    nom: "Élimination des cycles d'envie", en: "Envy-Cycle Elimination", fc: "var(--envie)",
    src: T`[Survey, Algorithme 2, § 3.1](survey)`,
    def: "On donne chaque bien à un agent que personne n'envie. Si tout le monde est envié, il y a un cycle d'envie : on fait tourner les paniers le long du cycle.",
    lignes: [
      [0, T`Pour chaque bien, tant qu'il en reste :`],
      [1, T`tant que tout agent est envié :`],
      [2, T`trouver un cycle d'envie $i_1 \to i_2 \to \dots \to i_1$ ; chacun prend le panier de celui qu'il envie`],
      [1, T`$i \gets$ un agent que personne n'envie`],
      [1, T`il choisit $g^* \in \operatorname*{arg\,max}_{g \in M} v_i(g)$ ; $\;A_i \gets A_i \cup \{g^*\}$`],
    ],
    surligne: { debut: [], cycle: [1, 2], rotation: [2], choix: [3, 4] },
    executer: v => executerCycles(v),
    garantie: [["EF1", "valuations monotones (m) suffisent"], ["½-EFX", "additives (+)"], ["½-MMS", "additives (+)"]],
    sourceGarantie: T`[Lipton et al.](lms04), survey Théorèmes 5 et 6`,
    retenir: T`On ne donne un bien qu'à un agent que personne n'envie : l'envie envers son panier disparaît dès qu'on retire ce dernier bien. Une rotation échange des paniers sans en changer le contenu, et chaque agent du cycle y gagne : EF1 tient à chaque étape, et le nombre de flèches d'envie diminue.`,
  },
  sacs: {
    nom: "Remplissage de sacs", en: "Bag-Filling", fc: "var(--part)",
    src: T`[Survey, Algorithme 3, § 5.1](survey)`,
    def: "Chaque agent se contente de la moitié de sa part maximin. On donne d'abord les biens qui suffisent à eux seuls, puis on remplit un sac bien par bien jusqu'à ce qu'un agent l'accepte.",
    lignes: [
      [0, T`Seuil de chaque agent : $\tau_i = \mu_i / 2$`],
      [0, T`Tant qu'il reste au moins deux agents et qu'un bien $g$ vaut $v_i(g) > \tau_i$ pour un agent $i$ :`],
      [1, T`$A_i \gets \{g\}$ ; $\,i$ et $g$ sortent`],
      [0, T`Tant qu'il reste au moins deux agents :`],
      [1, T`ajouter un bien au sac, tant que $v_i(\text{sac}) < \tau_i$ pour tout agent restant $i$`],
      [1, T`un agent $i$ avec $v_i(\text{sac}) \ge \tau_i$ prend le sac et sort`],
      [0, T`Le dernier agent prend tous les biens restants`],
    ],
    surligne: { debut: [0], gros: [1, 2], ajout: [3, 4], prend: [5], dernier: [6] },
    sacs: true,
    executer: (v, mu) => executerSacs(v, mu.map(x => x / 2)),
    garantie: [["½-MMS", "valuations additives (+)"]],
    sourceGarantie: T`[Ghodsi et al.](ghodsi21), survey Théorème 7`,
    retenir: T`Quand un sac part, il vaut moins que $\mu_i$ pour chaque agent $i$ qui reste : moins de $\tau_i$ avant le dernier bien, plus un bien qui vaut au plus $\tau_i$. Il reste donc assez pour $i$. Ici $\mu_i$ est calculé par force brute ; en général, c'est un problème NP-difficile.`,
  },
};

// Instances prêtes à l'emploi (biens a, b, c…). Chacune se lance avec n'importe quel algorithme.
ALGOS_FR.sansmu = {
  nom: "Sacs sans connaître μ", en: "Bag-Filling with guessed thresholds", fc: "var(--part)", sacs: true, cacheMu: true,
  src: T`d'après la preuve du [survey, Théorème 7](survey)`,
  def: "Le remplissage de sacs, sans jamais calculer les parts maximin : on part de seuils trop optimistes, et on baisse celui de chaque agent qui finit sous son seuil.",
  lignes: [
    [0, T`Seuils de départ : $\tau_i = v_i(M) / 2n$, qui vaut au moins $\mu_i / 2$`],
    [0, T`Lancer le remplissage de sacs avec les seuils $\tau_i$ :`],
    [1, T`biens seuls, puis sacs, puis le dernier agent prend le reste`],
    [0, T`Si un agent $i$ finit sous son seuil : $\tau_i \gets (1 - \varepsilon)\, \tau_i$, et recommencer`],
    [0, T`Sinon, chacun a au moins $\tau_i \ge (1 - \varepsilon)\, \mu_i / 2$`],
  ],
  surligne: { debut: [0], essai: [1], gros: [1, 2], ajout: [1, 2], prend: [1, 2], dernier: [1, 2], panne: [1, 2], echec: [3], succes: [4] },
  executer: v => executerSansMu(v),
  garantie: [["(½ − ε)-MMS", "valuations additives (+), sans calculer μ ; ici ε = 1/10"]],
  sourceGarantie: T`idée classique des seuils devinés puis abaissés ; voir [Ghodsi et al.](ghodsi21) et le survey, § 5`,
  retenir: T`Si $\tau_i \le \mu_i / 2$, la preuve du remplissage de sacs assure que $i$ finit avec au moins $\tau_i$, quels que soient les seuils des autres. Un agent qui échoue avait donc $\tau_i > \mu_i / 2$ : on peut baisser son seuil sans risque, et il ne descend jamais sous $(1 - \varepsilon)\, \mu_i / 2$. La colonne $\mu_i$ n'est là que pour comparer : l'algorithme ne la lit jamais.`,
};

const INSTANCES_ALGO_FR = [
  { nom: "Deux agents, un échange", v: [[8, 4, 9, 4, 4], [1, 1, 9, 1, 3]],
    note: "Cycles d'envie : une rotation, et l'allocation finale est EF. Tourniquet : EF1 sans EFX. Sacs : pas même EF1." },
  { nom: "Trois agents, un cycle à trois", v: [[6, 1, 5, 7, 9], [7, 5, 2, 5, 8], [9, 1, 6, 2, 4]],
    note: "Cycles d'envie : Alice, Bob et Chloé font tourner leurs paniers." },
  { nom: "Un bien seul, puis un sac", v: [[2, 2, 1, 3, 3, 3, 1, 3], [2, 2, 2, 3, 2, 2, 2, 2], [1, 3, 3, 2, 2, 3, 3, 2]],
    note: "Sacs : d dépasse à lui seul le seuil de Bob et part d'abord ; puis un sac de deux biens, puis le reste. Chacun a au moins la moitié de sa part maximin, mais l'allocation n'est pas EF1." },
  { nom: "Sacs sans μ : deux essais", v: [[2, 2, 1, 5, 1], [9, 2, 2, 2, 1], [8, 1, 2, 1, 1]],
    note: "Sacs sans μ : au premier essai, Chloé finit sous son seuil ; une fois son seuil baissé, le bien c lui suffit dès la première phase, et Bob prend le reste." },
  { nom: "Tourniquet : EF1 mais pas EFX", v: [[1, 2, 2, 5], [2, 2, 1, 4]],
    note: "Bob envie Alice, même après avoir retiré le bien qu'il préfère le moins dans son panier." },
];

let algo = { id: "tourniquet", instance: 0, v: INSTANCES_ALGO_FR[0].v.map(r => r.slice()), k: 0, etapes: [], mu: [], lecture: null };

function recalculerAlgo() {
  const n = algo.v.length;
  algo.mu = algo.v.map(r => maximin(r, n));
  algo.etapes = ALGOS[algo.id].executer(algo.v, algo.mu);
  algo.k = Math.min(algo.k, algo.etapes.length - 1);
}

/* ---------- Texte de chaque étape ---------- */
function texteEtape(e) {
  if (LANG === "en") return texteEtapeEN(e);
  const v = algo.v, n = v.length;
  const val = (i, S) => somme(v, i, S);
  // la variante sans μ réutilise les textes du remplissage de sacs pendant chaque essai
  const id = algo.id === "sansmu" && ["gros", "ajout", "prend", "dernier"].includes(e.type) ? "sacs" : algo.id;
  const seuils = t => t.map((x, i) => `${nomA(i)} ${fmt(x)}`).join(", ");
  switch (id + ":" + e.type) {
    case "tourniquet:debut": return `Allocation vide. Les agents vont choisir à tour de rôle : ${NOMS_AGENTS.slice(0, n).join(", ")}, puis on recommence.`;
    case "tourniquet:choix": return `Tour ${e.tour + 1}, au tour de ${nomA(e.agent)}. Son bien préféré parmi ceux qui restent est ${nomB(e.bien)} (${v[e.agent][e.bien]} à ses yeux) : ${nomA(e.agent)} le prend.`;
    case "cycles:debut": return "Allocation vide : personne n'envie personne.";
    case "cycles:cycle": return `Tout le monde est envié, donc il y a un cycle d'envie : ${e.cycle.concat(e.cycle[0]).map(nomA).join(" → ")}.`;
    case "cycles:rotation": return `Chacun prend le panier de celui qu'il enviait. Les paniers n'ont pas changé, seulement de propriétaire ; chaque agent du cycle y gagne.`;
    case "cycles:choix": {
      const qui = e.libres.length > 1 ? `Personne n'envie ${listeNoms(e.libres)} ; on prend le premier, ${nomA(e.agent)}, qui` : `Personne n'envie ${nomA(e.agent)}, qui`;
      return `${qui} choisit son bien préféré parmi ceux qui restent : ${nomB(e.bien)} (${v[e.agent][e.bien]} à ses yeux).`;
    }
    case "sacs:debut": return "On calcule la part maximin μ de chaque agent (dernière colonne des valuations) : chacun acceptera tout panier qui vaut au moins τ = μ / 2.";
    case "sacs:gros": return `${nomB(e.bien)} vaut ${v[e.agent][e.bien]} pour ${nomA(e.agent)}, plus que son seuil τ = ${fmt(e.tau[e.agent])} : ${nomA(e.agent)} le reçoit seul et sort.`;
    case "sacs:ajout": {
      const atteint = e.actifs.filter(i => val(i, e.sac) >= e.tau[i] - 1e-9);
      return `On ajoute ${nomB(e.bien)} au sac, qui vaut maintenant ${e.actifs.map(i => `${fmt(val(i, e.sac))} pour ${nomA(i)}`).join(", ")}. ` +
        (atteint.length ? `${listeNoms(atteint)} ${atteint.length > 1 ? "atteignent leur" : "atteint son"} seuil.` : "Personne n'atteint encore son seuil.");
    }
    case "sacs:prend": return `${nomA(e.agent)} estime le sac ${ensB(e.pris)} à ${fmt(val(e.agent, e.pris))}, au moins son seuil ${fmt(e.tau[e.agent])} : ${nomA(e.agent)} le prend et sort.` +
      (e.contents.length > 1 ? ` (${listeNoms(e.contents.slice(1))} l'aurait accepté aussi ; on prend le premier.)` : "");
    case "sansmu:debut": return `L'algorithme ne connaît pas μ (colonne grisée, là seulement pour comparer). Il part de seuils optimistes, τ = v(M)/2n : ${seuils(e.tau)}.`;
    case "sansmu:essai": return `Essai ${e.essai}, avec les seuils ${seuils(e.tau)}.`;
    case "sansmu:panne": return `Plus aucun bien à mettre dans le sac, et il ne suffit à personne : ${listeNoms(e.bloques)} ${e.bloques.length > 1 ? "restent" : "reste"} sans rien.`;
    case "sansmu:echec": return `${e.rates.map(i => `${nomA(i)} finit avec ${fmt(val(i, e.A[i]))}, sous son seuil ${fmt(e.tau[i])}`).join(" ; ")}. C'est la preuve que ${e.rates.length > 1 ? "ces seuils dépassaient" : "ce seuil dépassait"} μ/2 : on ${e.rates.length > 1 ? "les" : "le"} baisse de 10 % (${e.rates.map(i => `${nomA(i)} ${fmt(e.tau[i])} → ${fmt(e.nouveau[i])}`).join(", ")}) et on recommence.`;
    case "sansmu:succes": return `Chacun a au moins son seuil : terminé, en ${e.essai} essai${e.essai > 1 ? "s" : ""}.`;
    case "sacs:dernier": return `Il ne reste que ${nomA(e.agent)}, qui prend tous les biens restants : ${ensB(e.pris)}.`;
  }
  return "";
}

/* ---------- Panneau central ---------- */
const couleurAgent = i => `var(--ag${i})`;
const proprietaire = (A, k) => A.findIndex(P => P.includes(k));

function htmlValuations(e) {
  const v = algo.v, n = v.length, m = v[0].length, sacsOn = !!ALGOS[algo.id].sacs, cache = ALGOS[algo.id].cacheMu;
  const focus = e.bien;
  const tete = [...Array(m).keys()].map(k => {
    const p = proprietaire(e.A, k), dansSac = e.sac?.includes(k);
    const cls = ["bien", p >= 0 ? "pris" : "", dansSac ? "sac" : "", k === focus ? "focus" : ""].join(" ");
    return `<th scope="col"><span class="${cls}" style="${p >= 0 ? `--ac:${couleurAgent(p)}` : ""}">${nomB(k)}</span></th>`;
  }).join("");
  const lignes = v.map((r, i) => {
    const sorti = sacsOn && e.actifs && !e.actifs.includes(i) && e.type !== "debut";
    const cases = r.map((x, k) => {
      const mien = e.A[i].includes(k);
      return `<td class="${mien ? "mien" : ""}"><input type="number" min="0" max="99" step="1" value="${x}" data-i="${i}" data-k="${k}" aria-label="${ui("ariaValeur", nomB(k), nomA(i))}"></td>`;
    }).join("");
    const baisse = e.type === "echec" && e.rates.includes(i);
    const extra = `<td class="seuil${cache ? " cache" : ""}">${fmt(algo.mu[i])}</td>` +
      (sacsOn ? `<td class="seuil${baisse ? " baisse" : ""}">${fmt(e.tau[i])}${baisse ? ` → ${fmt(e.nouveau[i])}` : ""}</td>` : "");
    return `<tr class="${sorti ? "sorti" : ""}" style="--ac:${couleurAgent(i)}"><th scope="row"><span class="pastille-agent"></span>${nomA(i)}</th>${cases}${extra}</tr>`;
  }).join("");
  const coin = tex(T`v_i(g)`, false, false);
  return `<table class="tab-algo valuations-algo">
    <thead><tr><th>${coin}</th>${tete}<th class="seuil" title="${ui("partMaximin")}">${tex(T`\mu_i`, false, false)}</th>${sacsOn ? `<th class="seuil" title="${ui("seuil")}">${tex(T`\tau_i`, false, false)}</th>` : ""}</tr></thead>
    <tbody>${lignes}</tbody></table>`;
}

function htmlPaniers(e) {
  const v = algo.v, n = v.length;
  const E = grapheEnvie(v, e.A);
  const tete = e.A.map((P, j) => `<th scope="col" style="--ac:${couleurAgent(j)}"><span class="nom-panier">${tex(T`A_{\text{${nomA(j)}}}`, false, false)}</span><span class="contenu">${ensB(P)}</span></th>`).join("");
  const lignes = v.map((r, i) => {
    const cases = e.A.map((P, j) => {
      const x = fmt(somme(v, i, P));
      return `<td class="${i === j ? "diag" : E[i][j] ? "envie" : ""}">${x}</td>`;
    }).join("");
    return `<tr style="--ac:${couleurAgent(i)}"><th scope="row"><span class="pastille-agent"></span>${nomA(i)}</th>${cases}<td class="seuil">${fmt(r.reduce((a, b) => a + b, 0) / n)}</td></tr>`;
  }).join("");
  return `<table class="tab-algo paniers-algo">
    <thead><tr><th>${tex(T`v_i(A_j)`, false, false)}</th>${tete}<th class="seuil">${tex(T`v_i(M)/n`, false, false)}</th></tr></thead>
    <tbody>${lignes}</tbody></table>`;
}

// Graphe d'envie : un cercle par agent, une flèche rouge i → j si i envie j
function svgEnvie(e) {
  const n = algo.v.length, E = grapheEnvie(algo.v, e.A);
  const W = 240, Hh = 170, cx = W / 2, cy = Hh / 2 + 4, r = n === 2 ? 70 : 58, R0 = 19;
  const pos = [...Array(n).keys()].map(i => {
    const a = n === 2 ? Math.PI * (i === 0 ? 1 : 0) : -Math.PI / 2 + 2 * Math.PI * i / n;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
  const dansCycle = (i, j) => e.cycle && e.type === "cycle" && e.cycle.some((x, k) => x === i && e.cycle[(k + 1) % e.cycle.length] === j);
  let fleches = "";
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (E[i][j]) {
    const [x1, y1] = pos[i], [x2, y2] = pos[j], dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy);
    const ux = dx / d, uy = dy / d, courbe = E[j][i] ? 16 : 0;          // aller-retour : deux arcs
    const sx = x1 + ux * (R0 + 2), sy = y1 + uy * (R0 + 2), ex = x2 - ux * (R0 + 7), ey = y2 - uy * (R0 + 7);
    const mx = (sx + ex) / 2 - uy * courbe, my = (sy + ey) / 2 + ux * courbe;
    fleches += `<path d="M${sx},${sy} Q${mx},${my} ${ex},${ey}" class="fl-envie${dansCycle(i, j) ? " cycle" : ""}" marker-end="url(#pointe-envie${dansCycle(i, j) ? "-cycle" : ""})"/>`;
  }
  const noeuds = pos.map(([x, y], i) => {
    const libre = !E.some(r => r[i]);
    return `<g class="agent-noeud${libre ? " libre" : ""}" style="--ac:${couleurAgent(i)}"><circle cx="${x}" cy="${y}" r="${R0}"/><text x="${x}" y="${y + 5}" text-anchor="middle">${nomA(i)[0]}</text></g>`;
  }).join("");
  return `<svg viewBox="0 0 ${W} ${Hh}" class="envie-svg" role="img" aria-label="${ui("grapheEnvie")}">
    <defs>
      <marker id="pointe-envie" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="pointe"/></marker>
      <marker id="pointe-envie-cycle" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="pointe cycle"/></marker>
    </defs>${fleches}${noeuds}</svg>`;
}

function htmlReste(e) {
  const chips = S => S.length ? S.map(k => `<span class="bien">${nomB(k)}</span>`).join("") : `<span class="none">${ui("aucun")}</span>`;
  let s = `<div class="ligne-reste"><h3>${ui("biensRestants")}</h3><div class="biens">${chips(e.R)}</div></div>`;
  if (ALGOS[algo.id].sacs) s += `<div class="ligne-reste"><h3>${ui("sac")}</h3><div class="biens">${e.sac.length ? e.sac.map(k => `<span class="bien sac">${nomB(k)}</span>`).join("") : `<span class="none">${ui("videSac")}</span>`}</div></div>`;
  return s;
}

function rendreAlgo() {
  const e = algo.etapes[algo.k], K = algo.etapes.length - 1;
  const zone = document.getElementById("algo");
  // garder le focus d'un champ en cours d'édition
  const actif = document.activeElement?.dataset?.i !== undefined ? [document.activeElement.dataset.i, document.activeElement.dataset.k] : null;
  zone.innerHTML = `
    <div class="algo-grille">
      <section class="bloc-algo"><h3>${ui("valuationsT")} <span class="aide">${ui("modifiables")}</span></h3>${htmlValuations(e)}</section>
      <section class="bloc-algo"><h3>${ui("paniers")} <span class="aide">${ui("rougeEnvie")}</span></h3>${htmlPaniers(e)}</section>
      <section class="bloc-algo">${htmlReste(e)}</section>
      <section class="bloc-algo graphe-envie"><h3>${ui("grapheEnvie")} <span class="aide">${ui("iEnvieJ")}</span></h3>${svgEnvie(e)}</section>
    </div>
    <div class="pas-a-pas" role="group" aria-label="${ui("avancer")}">
      <button data-pas="debut" ${algo.k === 0 ? "disabled" : ""} aria-label="${ui("debut")}">⏮</button>
      <button data-pas="-1" ${algo.k === 0 ? "disabled" : ""} aria-label="${ui("prec")}">◀</button>
      <span class="compteur">${ui("etapeSur", algo.k, K)}</span>
      <button data-pas="+1" ${algo.k === K ? "disabled" : ""} aria-label="${ui("suiv")}">▶</button>
      <button data-pas="fin" ${algo.k === K ? "disabled" : ""} aria-label="${ui("fin")}">⏭</button>
      <button data-pas="lecture" class="lecture" aria-pressed="${!!algo.lecture}">${algo.lecture ? ui("pause") : ui("lecture")}</button>
    </div>`;
  if (actif) { const c = zone.querySelector(`input[data-i="${actif[0]}"][data-k="${actif[1]}"]`); if (c) { c.focus(); const L = c.value.length; try { c.setSelectionRange?.(L, L); } catch {} } }
  rendreCarteAlgo(e, K);
  // barre : boutons d'algorithme, instance, dimensions
  document.querySelectorAll(".choix-algo button").forEach(b => b.setAttribute("aria-pressed", b.dataset.algo === algo.id));
  document.getElementById("algo-instance").value = algo.instance;
  document.getElementById("algo-n").textContent = algo.v.length;
  document.getElementById("algo-m").textContent = algo.v[0].length;
  const note = INSTANCES_ALGO[algo.instance]?.note;
  document.getElementById("algo-note").textContent = note ?? "";
}

/* ---------- Carte de droite ---------- */
function rendreCarteAlgo(e, K) {
  const A = ALGOS[algo.id], fini = algo.k === K;
  const on = new Set(A.surligne[e.type] ?? []);
  const pseudo = A.lignes.map(([niv, s], l) => `<li class="${on.has(l) ? "on" : ""}" style="--niv:${niv}">${texte(s)}</li>`).join("");
  const P = proprietesAlloc(algo.v, e.A, algo.mu);
  const ok = b => b ? `<span class="oui">✓</span>` : `<span class="non">✗</span>`;
  const vers = id => `<button class="chip" data-carte="biens" data-go="${id}" style="--cc:${FAMILLES[CARTE_BIENS.notions[id].fam].couleur}">${id}</button>`;
  const lignesProp = [
    [vers("EF"), ok(P.EF)], [vers("EF1"), ok(P.EF1)], [vers("EFX"), ok(P.EFX)],
    ...(fini ? [[vers("PROP"), ok(P.PROP)],
                [vers("MMS"), `${ok(P.alpha >= 1 - 1e-9)} <span class="alpha">${tex(T`\min_i \tfrac{v_i(A_i)}{\mu_i} = ${Number.isFinite(P.alpha) ? ecrireNombre(P.alpha) : T`\infty`}`, false, false)}</span>`]] : []),
  ].map(([a, b]) => `<div class="prop">${a}${b}</div>`).join("");
  card.style.setProperty("--fc", A.fc);
  card.className = "card carte-algo";
  card.hidden = false;
  card.innerHTML = `
    <div class="band"><span>${ui("algorithme")}</span></div>
    <div class="body">
      <div class="haut">
        <div class="top"><span class="sigle algo-sigle" id="card-sigle">${A.nom}</span></div>
        <div class="en">${LANG === "en" ? "" : `${A.en} · `}${texte(A.src)}</div>
      </div>
      <ol class="pseudo">${pseudo}</ol>
      <div class="etape-algo"><h3>${e.essai ? ui("essai", e.essai) : ""}${algo.k === 0 ? ui("departAlgo") : fini ? ui("etapeFinie", algo.k) : ui("etape", algo.k)}</h3><p class="ex">${texteEtape(e)}</p></div>
      <div class="props"><h3>${fini ? ui("allocFinale") : ui("allocEnCours")}</h3><div class="grille-props">${lignesProp}</div>
        ${fini ? "" : `<p class="none">${ui("propMmsFinale")}</p>`}</div>
      <div class="garantie"><h3>${ui("garantie")}</h3>
        <ul>${A.garantie.map(([n, h]) => `<li><b>${n}</b> · ${h}</li>`).join("")}</ul>
        <p class="source">${texte(A.sourceGarantie)}</p>
      </div>
      <p class="retenir"><b>${ui("lIdee")}</b> ${A.def}</p>
      <p class="retenir"><b>${ui("pourquoiMarche")}</b> ${texte(A.retenir)}</p>
    </div>`;
}

/* ---------- Commandes ---------- */
function allerA(k) {
  algo.k = Math.max(0, Math.min(k, algo.etapes.length - 1));
  if (algo.k === algo.etapes.length - 1) arreterLecture();
  rendreAlgo();
}
function arreterLecture() { if (algo.lecture) { clearInterval(algo.lecture); algo.lecture = null; } }
function basculerLecture() {
  if (algo.lecture) { arreterLecture(); return rendreAlgo(); }
  if (algo.k === algo.etapes.length - 1) algo.k = 0;
  algo.lecture = setInterval(() => allerA(algo.k + 1), 1100);
  rendreAlgo();
}
function changerInstance(v, idx) {
  arreterLecture();
  algo.v = v; algo.instance = idx; algo.k = 0;
  recalculerAlgo(); rendreAlgo();
}
// Au hasard : valeurs de 1 à 9 ; pour les sacs, surtout de petites valeurs (sinon presque chaque
// bien dépasse à lui seul un seuil et l'on ne voit jamais de sac)
const valeurHasard = () => ALGOS[algo.id].sacs
  ? (Math.random() < .12 ? 5 + Math.floor(Math.random() * 5) : 1 + Math.floor(Math.random() * 3))
  : 1 + Math.floor(Math.random() * 9);
const hasard = (n, m) => Array.from({ length: n }, () => Array.from({ length: m }, valeurHasard));
function redimensionner(dn, dm) {
  const n = algo.v.length + dn, m = algo.v[0].length + dm;
  if (n < 2 || n > 4 || m < 2 || m > 8 || n ** m > 70000) return;
  const v = Array.from({ length: n }, (_, i) => Array.from({ length: m }, (_, k) => algo.v[i]?.[k] ?? valeurHasard()));
  changerInstance(v, -1);
}

function remplirInstances() {
  const sel = document.getElementById("algo-instance");
  sel.innerHTML = INSTANCES_ALGO.map((x, i) => `<option value="${i}">${x.nom}</option>`).join("") + `<option value="-1">${ui("personnalisee")}</option>`;
  sel.value = algo.instance;
}
function brancherAlgo() {
  const sel = document.getElementById("algo-instance");
  remplirInstances();
  sel.addEventListener("change", () => { const i = +sel.value; if (i >= 0) changerInstance(INSTANCES_ALGO[i].v.map(r => r.slice()), i); });
  document.querySelectorAll(".choix-algo button").forEach(b => b.addEventListener("click", () => {
    arreterLecture(); algo.id = b.dataset.algo; algo.k = 0; recalculerAlgo(); rendreAlgo();
  }));
  document.getElementById("algo-hasard").addEventListener("click", () => changerInstance(hasard(algo.v.length, algo.v[0].length), -1));
  document.querySelectorAll("[data-dim]").forEach(b => b.addEventListener("click", () => {
    const [quoi, d] = b.dataset.dim.split(":"); redimensionner(quoi === "n" ? +d : 0, quoi === "m" ? +d : 0);
  }));
  const zone = document.getElementById("algo");
  zone.addEventListener("click", ev => {
    const b = ev.target.closest("[data-pas]"); if (!b) return;
    const p = b.dataset.pas;
    if (p === "lecture") return basculerLecture();
    arreterLecture();
    allerA(p === "debut" ? 0 : p === "fin" ? Infinity : algo.k + +p);
  });
  zone.addEventListener("input", ev => {
    const c = ev.target; if (c.dataset?.i === undefined) return;
    const x = Math.max(0, Math.min(99, Math.round(+c.value)));
    if (!Number.isFinite(x) || c.value === "") return;
    algo.v[+c.dataset.i][+c.dataset.k] = x; algo.instance = -1;
    arreterLecture(); recalculerAlgo(); rendreAlgo();
  });
  document.addEventListener("keydown", ev => {
    if (carteId !== "algorithmes" || ev.target.closest?.("input, select")) return;
    if (ev.key === "ArrowRight") { arreterLecture(); allerA(algo.k + 1); }
    if (ev.key === "ArrowLeft") { arreterLecture(); allerA(algo.k - 1); }
  });
}

const DEFINITIONS_ALGO_FR = T`
  <p class="regle-or"><b>Lecture.</b> Avance pas à pas avec ◀ ▶ (ou les flèches du clavier). Les valeurs du tableau se modifient : l'algorithme est relancé aussitôt, sur la même étape.</p>
  <dl class="defs">
    <dt>Paniers</dt>
    <dd>la case $(i, j)$ vaut $v_i(A_j)$ ; diagonale en gras, envie en rouge, comme dans les solutions des cartes</dd>
    <dt>$\mu_i$</dt>
    <dd>part maximin de l'agent $i$ : la meilleure valeur qu'il peut garantir en découpant lui-même $M$ en $n$ paniers et en recevant le pire (calculée ici par force brute)</dd>
    <dt>Envie</dt>
    <dd>flèche $i \to j$ quand $v_i(A_j) > v_i(A_i)$ ; un agent sans flèche entrante n'est envié par personne</dd>
  </dl>
  <p class="source">D'après le [survey](survey), Algorithmes 1 à 3 (§ 3.1 et § 5.1) ; à égalité, on prend le premier agent ou le premier bien dans l'ordre.</p>`;

function afficherAlgorithmes() {
  carteId = "algorithmes";
  carteCourante = {};
  selection = null;
  document.querySelectorAll(".onglets a").forEach(a => a.toggleAttribute("aria-current", a.dataset.carte === "algorithmes"));
  document.getElementById("titre").textContent = ui("algorithmes");
  document.getElementById("sous-titre").textContent = ui("algoSousTitre");
  document.title = `${ui("algorithmes")} · ${ui("siteTitre")}`;
  montrerVue("carte");
  document.querySelector(".legend").hidden = true;
  diagram.hidden = true;
  document.getElementById("algo-barre").hidden = false;
  document.getElementById("algo").hidden = false;
  recalculerAlgo();
  rendreAlgo();
}


/* ================================================================
   F. ÉVÉNEMENTS ET DÉMARRAGE
   ================================================================ */

// Branche souris + clavier sur un élément cliquable du graphe
function rendreCliquable(elt, cle, { delaiEntree = 0 } = {}) {
  elt.addEventListener("mouseenter", () => plusTard(() => surligner(cle), delaiEntree));
  elt.addEventListener("mouseleave", () => plusTard(() => surligner(selection), DELAI_SORTIE));
  elt.addEventListener("focus", () => surligner(cle));
  elt.addEventListener("blur", () => surligner(selection));
  elt.addEventListener("click", ev => { ev.stopPropagation(); annulerRetour(); basculer(cle); });
  elt.addEventListener("keydown", ev => {
    if (ev.key !== "Enter" && ev.key !== " ") return;
    ev.preventDefault();
    basculer(cle);
  });
}

// Légende
document.querySelectorAll(".legend .fam").forEach(s => {
  s.addEventListener("mouseenter", () => surlignerFamille(s.dataset.fam));
  s.addEventListener("mouseleave", () => surlignerFamille(null));
  s.addEventListener("focus",      () => surlignerFamille(s.dataset.fam));
  s.addEventListener("blur",       () => surlignerFamille(null));
});

// Dans la carte : un seul écouteur pour la croix et les pastilles (délégation d'événements)
card.addEventListener("click", ev => {
  ev.stopPropagation();
  if (ev.target.closest(".close")) return fermer();
  const chip = ev.target.closest(".chip");
  if (chip?.dataset.carte) { aOuvrir = chip.dataset.go; location.hash = chip.dataset.carte; return; }   // vers une autre carte
  if (chip) ouvrir(chip.dataset.go);
});

// Clic dans une zone vide du graphe : on désélectionne. (Les boîtes et flèches arrêtent la propagation.)
diagram.addEventListener("click", () => { if (selection) fermer(); });
document.addEventListener("keydown", ev => { if (ev.key === "Escape" && selection) fermer(); });
// Passage grand écran ↔ petit écran : réafficher ou cacher l'emplacement vide
grandEcran.addEventListener("change", () => { if (!selection && carteId !== "algorithmes") afficherVide(); });

// Changer de carte : prendre ses données, mettre à jour titre, légende et définitions,
// redessiner le graphe, puis ouvrir sa carte de départ (sur grand écran)
let carteCourante = {};   // l'objet carte affiché (titres, repères, options d'affichage)
let aOuvrir = null;       // notion à ouvrir à l'arrivée sur une carte (lien depuis l'onglet Algorithmes)
function afficherCarte(id) {
  arreterLecture();
  if (id === "algorithmes") return afficherAlgorithmes();
  if (id === "definitions") return afficherDefinitions();
  montrerVue("carte");
  // quitter l'onglet Algorithmes : remettre la légende et le graphe
  document.querySelector(".legend").hidden = false;
  diagram.hidden = false;
  document.getElementById("algo-barre").hidden = true;
  document.getElementById("algo").hidden = true;
  const carte = CARTES[id] ?? CARTES.biens;
  carteId = CARTES[id] ? id : "biens";
  carteCourante = carte;
  cacheStatuts = null;
  document.getElementById("selecteur").hidden = !carte.selecteur;
  // Cartes « simples » (Valuations) : pas de statuts ✓ ? ✗ ni de convention d'indices dans la légende
  document.getElementById("legende-statuts").hidden = !!carte.simple;
  document.getElementById("legende-indices").hidden = !!carte.simple;
  ({ notions: NOTIONS, implications: IMPLICATIONS, jumelles: JUMELLES, courbes: COURBES, liens: LIENS } = carte);
  document.getElementById("titre").textContent = carte.titre;
  document.getElementById("sous-titre").textContent = carte.sousTitre;
  majLegendeContexte();
  // (les courbes vertes, rouges et orange se passent de légende : leur étiquette dit ce qu'elles sont)
  document.getElementById("legende-jumelles").hidden = carte.jumelles.length === 0;
  document.title = carte.titre === ui("siteTitre") ? carte.titre : `${carte.titre} · ${ui("siteTitre")}`;
  // Noms des familles : ceux par défaut, sauf si la carte en change certains
  for (const k in FAMILLES) {
    FAMILLES[k].nom = carte.familles?.[k] ?? NOMS_FAMILLES[k];
    const entree = document.querySelector(`.legend .fam[data-fam="${k}"]`);
    entree.querySelector("b").textContent = FAMILLES[k].nom;
    entree.hidden = !Object.values(carte.notions).some(n => n.fam === k);   // famille absente de la carte
  }
  document.querySelectorAll(".onglets a").forEach(a =>
    a.toggleAttribute("aria-current", a.dataset.carte === (CARTES[id] ? id : "biens")));
  selection = null;
  dessinerGraphe();
  placerCurseur(false);
  const cible = aOuvrir && carte.notions[aOuvrir] ? aOuvrir : null;
  aOuvrir = null;
  if (cible) ouvrir(cible);
  else if (grandEcran.matches) ouvrir(carte.depart); else afficherVide();
}

// L'adresse décide de la carte : #corvees ou #biens (par défaut)
const carteDeLAdresse = () => location.hash.slice(1) || "biens";
window.addEventListener("hashchange", () => afficherCarte(carteDeLAdresse()));
appliquerLangue(langueInitiale(), false);
brancherAlgo();
brancherSelecteur();
brancherDefinitions();
afficherCarte(carteDeLAdresse());
