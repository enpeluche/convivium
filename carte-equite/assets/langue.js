"use strict";
/* ================================================================
   LANGUE — interface FR / EN
   ----------------------------------------------------------------
   ui(clé, …args) renvoie le texte de l'interface dans la langue
   courante (une valeur peut être une fonction des arguments).
   appliquerLangue(lang) fusionne la couche anglaise (donnees-en.js)
   dans les données, met à jour les textes fixes de la page
   (attributs data-i18n) et redessine la vue courante.
   ================================================================ */

let LANG = "fr";
// Données dans la langue courante (remplies par appliquerLangue)
let CARTES, STATUT, ALGOS, INSTANCES_ALGO, EXCEPTIONS, CLASSES;

const UI = {
  fr: {
    btnTourniquet: "Tourniquet", btnCycles: "Cycles d’envie", btnSacs: "Sacs", btnSansMu: "Sacs sans μ", langue: "Langue",
    siteLien: "Site personnel",
    siteTitre: "Carte de l'équité", siteSous: "Partage de biens indivisibles : notions et implications",
    ongletBiens: "Équité", ongletCorvees: "Corvées", ongletPonderee: "Pondérée", ongletValuations: "Valuations",
    ongletAlgos: "Algorithmes", ongletDefs: "Définitions",
    famEnvie: "Envie", famPart: "Part garantie", famEgal: "Égalité des utilités", famEff: "Efficacité et bien-être",
    legStatuts: ["✓ existe toujours", "? ouvert", "✗ pas toujours"], legInconnu: "– non vérifié",
    legIndices: `<span class="idx moi">i</span> moi · <span class="idx autre">j</span> un autre agent · indice muet (Σ, Π, min, max) sans couleur`,
    legJum: "⇠ ⇢ pointillés gris : notions jumelles, sans implication",
    legJumFus: "EF = EQ : jumelles fusionnées, équivalentes avec des valuations identiques",
    plusExigeant: "↑ plus exigeant", moinsExigeant: "↓ moins exigeant",
    aucunAlpha: "✕ aucun α", plusVrai: "✕ plus vrai",
    ariaApprox: (s, a, t) => `${s} implique ${a}-${t} : preuve`, ariaNeg: (s, t) => `${s} n’implique aucune approximation de ${t}`,
    ariaPerdue: (s, t) => `${s} n’implique plus ${t} quand les droits diffèrent`,
    ariaFleche: (s, jum, t) => `${s} ${jum ? "et" : "implique"} ${t} : preuve et contre-exemple`,
    ouvrirCarte: "Ouvrir la carte.", fermer: "Fermer la carte",
    aucuneGraphe: "aucune dans ce graphe", ou: "où", famille: f => `Famille ${f}`, aRetenir: "À retenir.",
    impliqueePar: "Impliquée par", jumelle: "Jumelle", implique: "Implique", carteDe: "Carte de",
    versionApprochee: "Version approchée", dOuGraduations: "D’où viennent ces graduations ?",
    additivite: "additivité", monotonieCouts: "monotonie des coûts", monotonieVal: "monotonie des valuations",
    pureLogique: "aucune, c’est de la pure logique", depart: "Départ", pont: "Pont", voirValuations: "voir Valuations",
    arrivee: "Arrivée", hypUtilisees: "Hypothèses utilisées :", voirSolution: "Voir la solution",
    vide: "Clique sur une notion ou une flèche du graphe pour afficher sa carte ici.",
    lienSansSens: "une des deux notions n’a pas de sens ici",
    lienPreuveAdd: c => `la preuve utilise l’additivité (+) : elle ne couvre pas les valuations ${c}`,
    lienApproxAdd: c => `résultat établi pour des valuations additives : il ne couvre pas les valuations ${c}`,
    lienCEIdent: "le contre-exemple utilise des valuations différentes : non vérifié avec des valuations identiques",
    stCommeAdd: "comme pour des valuations additives",
    stCEReste: c => `le contre-exemple additif reste valable : toute valuation additive est aussi ${c}`,
    stNonVerifClasse: c => `statut non vérifié pour des valuations ${c}`,
    stVraiIdent: "vrai en général, donc aussi avec des valuations identiques",
    stNonVerifIdent: "statut non vérifié avec des valuations identiques",
    stPropOui: (a, b) => `car ${a} existe toujours et ${a} ⇒ ${b}`, stPropNon: (a, b) => `car ${a} ⇒ ${b} et ${b} n’existe pas toujours`,
    ctxDesc: (c, id, nn) => `valuations ${c}${id ? ", identiques" : ""}${nn ? ", non normalisées" : ""}`,
    sousTitreCtx: (c, id, nn) => `(biens indivisibles, valuations ${c}${id ? ", identiques" : ""}${nn ? ", non normalisées" : ""})`,
    horsJeu: "Hors jeu ici", seulementAdd: "cette notion n’est définie que pour des valuations additives",
    sansNorm: "sans normalisation, comparer $v_i(A_i)$ à $v_j(A_j)$ dépend de l’échelle choisie par chaque agent : la notion perd son sens",
    fusionBoite: (a, b) => `avec $v_i = v_j$, ${a} et ${b} coïncident : une seule boîte`,
    equivIdent: "avec $v_i = v_j$, les deux notions coïncident : c’est une équivalence",
    ceResteGeneral: "le contre-exemple additif reste valable dans une classe plus générale",
    casPartApprox: "un cas particulier du cadre additif : le résultat reste vrai",
    casPartPreuve: "cas particulier du cadre additif : la preuve reste valable",
    preuveSansAdd: "la preuve n’utilise pas l’additivité : elle reste valable", rienNeChange: "rien ne change",
    selTitre: "Valuations", selAria: "Classe de valuations", identiques: "Identiques", normalisees: "Normalisées",
    identNorm: "Des valuations identiques sont automatiquement normalisées",
    et: " et ", ariaValeur: (g, a) => `valeur de ${g} pour ${a}`, partMaximin: "part maximin", seuil: "seuil",
    aucun: "aucun", biensRestants: "Biens restants", sac: "Sac", videSac: "vide",
    valuationsT: "Valuations", modifiables: "modifiables", paniers: "Paniers", rougeEnvie: "en rouge : envie",
    grapheEnvie: "Graphe d’envie", iEnvieJ: "i → j : i envie j", avancer: "Avancer dans l’algorithme",
    debut: "Début", prec: "Étape précédente", suiv: "Étape suivante", fin: "Fin", etapeSur: (k, K) => `Étape ${k} / ${K}`,
    pause: "Pause", lecture: "Lecture", algorithme: "Algorithme", essai: k => `Essai ${k} · `, departAlgo: "Départ",
    etapeFinie: k => `Étape ${k} · terminé`, etape: k => `Étape ${k}`,
    allocFinale: "Allocation finale", allocEnCours: "Allocation en cours",
    propMmsFinale: "PROP et MMS se jugent sur l’allocation finale.", garantie: "Garantie",
    lIdee: "L’idée.", pourquoiMarche: "Pourquoi ça marche.", personnalisee: "Personnalisée",
    algorithmes: "Algorithmes", algoSousTitre: "(pas à pas, valuations additives)",
    choixAlgo: "Algorithme", instance: "Instance", agents: "Agents", biens: "Biens", hasard: "Hasard",
    moinsAgent: "Un agent de moins", plusAgent: "Un agent de plus", moinsBien: "Un bien de moins", plusBien: "Un bien de plus",
    legende: "Légende", graphe: "Graphe des implications entre notions d’équité",
    defsTitre: "Définitions", defsSous: "Toutes les notions des cartes, en un seul endroit",
    defsIntro: "Chaque notion est rangée par carte puis par famille. Un clic sur un sigle ouvre sa carte sur le graphe.",
    defsFiltre: "Filtrer (EF1, part maximin…)", defsCadre: "Cadre et notations", notations: "Notations →", defsLecture: "Mode d’emploi", defsAucune: "Aucune notion ne correspond.",
    defsImpliquePar: "impliquée par", defsImplique: "implique", defsJumelle: "jumelle", defsAlgos: "Algorithmes",
    defsGarantie: "Garantie", defsVoirCarte: "Voir sur la carte", defsSommaire: "Sommaire",
    defsSource: "Source de la définition",
    evolue: "Cette carte accompagne une thèse en cours : elle évoluera avec elle.",
  },
  en: {
    btnTourniquet: "Round-robin", btnCycles: "Envy cycles", btnSacs: "Bags", btnSansMu: "Bags without μ", langue: "Language",
    siteLien: "Personal website",
    siteTitre: "Fairness map", siteSous: "Sharing indivisible goods: notions and implications",
    ongletBiens: "Fairness", ongletCorvees: "Chores", ongletPonderee: "Weighted", ongletValuations: "Valuations",
    ongletAlgos: "Algorithms", ongletDefs: "Definitions",
    famEnvie: "Envy", famPart: "Guaranteed share", famEgal: "Equality of utilities", famEff: "Efficiency and welfare",
    legStatuts: ["✓ always exists", "? open", "✗ not always"], legInconnu: "– not checked",
    legIndices: `<span class="idx moi">i</span> me · <span class="idx autre">j</span> another agent · dummy index (Σ, Π, min, max) uncoloured`,
    legJum: "⇠ ⇢ grey dashes: twin notions, no implication",
    legJumFus: "EF = EQ: twins merged, equivalent with identical valuations",
    plusExigeant: "↑ more demanding", moinsExigeant: "↓ less demanding",
    aucunAlpha: "✕ no α", plusVrai: "✕ no longer true",
    ariaApprox: (s, a, t) => `${s} implies ${a}-${t}: proof`, ariaNeg: (s, t) => `${s} implies no approximation of ${t}`,
    ariaPerdue: (s, t) => `${s} no longer implies ${t} when entitlements differ`,
    ariaFleche: (s, jum, t) => `${s} ${jum ? "and" : "implies"} ${t}: proof and counterexample`,
    ouvrirCarte: "Open the card.", fermer: "Close the card",
    aucuneGraphe: "none in this graph", ou: "where", famille: f => /classes|cases|restriction/i.test(f) ? f : `${f} family`, aRetenir: "Key points.",
    impliqueePar: "Implied by", jumelle: "Twin", implique: "Implies", carteDe: "Card of",
    versionApprochee: "Approximate version", dOuGraduations: "Where do these marks come from?",
    additivite: "additivity", monotonieCouts: "monotone costs", monotonieVal: "monotone valuations",
    pureLogique: "none, it is pure logic", depart: "Start", pont: "Bridge", voirValuations: "see Valuations",
    arrivee: "Goal", hypUtilisees: "Assumptions used:", voirSolution: "Show the solution",
    vide: "Click a notion or an arrow of the graph to show its card here.",
    lienSansSens: "one of the two notions is meaningless here",
    lienPreuveAdd: c => `the proof uses additivity (+): it does not cover ${c} valuations`,
    lienApproxAdd: c => `result established for additive valuations: it does not cover ${c} valuations`,
    lienCEIdent: "the counterexample uses different valuations: not checked with identical valuations",
    stCommeAdd: "as for additive valuations",
    stCEReste: c => `the additive counterexample still holds: every additive valuation is also ${c}`,
    stNonVerifClasse: c => `status not checked for ${c} valuations`,
    stVraiIdent: "true in general, hence also with identical valuations",
    stNonVerifIdent: "status not checked with identical valuations",
    stPropOui: (a, b) => `since ${a} always exists and ${a} ⇒ ${b}`, stPropNon: (a, b) => `since ${a} ⇒ ${b} and ${b} does not always exist`,
    ctxDesc: (c, id, nn) => `${c} valuations${id ? ", identical" : ""}${nn ? ", not normalized" : ""}`,
    sousTitreCtx: (c, id, nn) => `(indivisible goods, ${c} valuations${id ? ", identical" : ""}${nn ? ", not normalized" : ""})`,
    horsJeu: "Out of play here", seulementAdd: "this notion is only defined for additive valuations",
    sansNorm: "without normalization, comparing $v_i(A_i)$ with $v_j(A_j)$ depends on the scale each agent chose: the notion loses its meaning",
    fusionBoite: (a, b) => `with $v_i = v_j$, ${a} and ${b} coincide: a single box`,
    equivIdent: "with $v_i = v_j$, the two notions coincide: it is an equivalence",
    ceResteGeneral: "the additive counterexample still holds in a more general class",
    casPartApprox: "a special case of the additive setting: the result still holds",
    casPartPreuve: "a special case of the additive setting: the proof still holds",
    preuveSansAdd: "the proof does not use additivity: it still holds", rienNeChange: "nothing changes",
    selTitre: "Valuations", selAria: "Valuation class", identiques: "Identical", normalisees: "Normalized",
    identNorm: "Identical valuations are automatically normalized",
    et: " and ", ariaValeur: (g, a) => `value of ${g} for ${a}`, partMaximin: "maximin share", seuil: "threshold",
    aucun: "none", biensRestants: "Remaining goods", sac: "Bag", videSac: "empty",
    valuationsT: "Valuations", modifiables: "editable", paniers: "Bundles", rougeEnvie: "red: envy",
    grapheEnvie: "Envy graph", iEnvieJ: "i → j: i envies j", avancer: "Step through the algorithm",
    debut: "Start", prec: "Previous step", suiv: "Next step", fin: "End", etapeSur: (k, K) => `Step ${k} / ${K}`,
    pause: "Pause", lecture: "Play", algorithme: "Algorithm", essai: k => `Attempt ${k} · `, departAlgo: "Start",
    etapeFinie: k => `Step ${k} · done`, etape: k => `Step ${k}`,
    allocFinale: "Final allocation", allocEnCours: "Current allocation",
    propMmsFinale: "PROP and MMS are judged on the final allocation.", garantie: "Guarantee",
    lIdee: "The idea.", pourquoiMarche: "Why it works.", personnalisee: "Custom",
    algorithmes: "Algorithms", algoSousTitre: "(step by step, additive valuations)",
    choixAlgo: "Algorithm", instance: "Instance", agents: "Agents", biens: "Goods", hasard: "Random",
    moinsAgent: "One agent fewer", plusAgent: "One more agent", moinsBien: "One good fewer", plusBien: "One more good",
    legende: "Legend", graphe: "Graph of implications between fairness notions",
    defsTitre: "Definitions", defsSous: "Every notion of the maps, in one place",
    defsIntro: "Notions are grouped by map, then by family. Click an acronym to open its card on the graph.",
    defsFiltre: "Filter (EF1, maximin share…)", defsCadre: "Setting and notation", notations: "Notation →", defsLecture: "How to use it", defsAucune: "No notion matches.",
    defsImpliquePar: "implied by", defsImplique: "implies", defsJumelle: "twin", defsAlgos: "Algorithms",
    defsGarantie: "Guarantee", defsVoirCarte: "See on the map", defsSommaire: "Contents",
    defsSource: "Source of the definition",
    evolue: "This map accompanies an ongoing PhD thesis and will evolve with it.",
  },
};
const ui = (k, ...args) => { const v = UI[LANG][k] ?? UI.fr[k] ?? k; return typeof v === "function" ? v(...args) : v; };

/* ---------- Fusion d'une couche de traduction dans les données ---------- */
const estObjet = x => x && typeof x === "object" && !Array.isArray(x);
function fusion(base, dessus) {
  if (dessus === undefined) return base;
  if (Array.isArray(dessus)) {
    // tableau d'objets (échelles d'approximation) : élément par élément ; sinon remplacement
    if (Array.isArray(base) && dessus.every(estObjet) && base.every(estObjet))
      return base.map((b, k) => fusion(b, dessus[k]));
    return dessus;
  }
  if (estObjet(dessus) && estObjet(base)) {
    const r = { ...base };
    for (const k in dessus) r[k] = fusion(base[k], dessus[k]);
    return r;
  }
  return dessus;
}

/* ---------- Couche anglaise : sélecteur, algorithmes ---------- */
const CLASSES_EN = [
  { nom: "Additive", adj: "additive" }, { nom: "Submodular", adj: "submodular" }, { nom: "XOS", adj: "XOS" },
  { nom: "Subadditive", adj: "subadditive" }, { nom: "Monotone", adj: "monotone" },
];
const OPTIMUM_EN = { t: "an optimum always exists, since there are finitely many allocations" };
const EXCEPTIONS_EN = {
  "non-additive": {
    EF1: { t: T`envy-cycle elimination only uses (m) ([Lipton et al.](lms04), survey Theorem 5)` },
    EEFX: { t: T`even for monotone valuations ([Akrami and Rathi, AAAI 2025](akrami25))` },
    PO: OPTIMUM_EN, MNW: OPTIMUM_EN, USW: OPTIMUM_EN, Leximin: OPTIMUM_EN, EGW: OPTIMUM_EN,
  },
  sousmod: { EFX: { t: "open" } }, xos: { EFX: { t: "open" } }, sousadd: { EFX: { t: "open" } },
  monotone: { EFX: { t: "counterexample found by computer (SAT, 2026), see the EFX note" } },
  identiques: {
    EFX: { t: T`a leximin++ allocation works, even for monotone valuations ([Plaut and Roughgarden](plaut18), survey § 4.1.1)` },
    MMS: { t: T`everyone has the same maximin partition: each receives one of its bundles, worth at least $\mu_i$` },
    EF: { t: "a single good for two agents: the one without it envies the other" },
    PROP: { t: "a single good for two agents: one of them gets nothing" },
    EQ: { t: "a single good for two agents: one has the good’s value, the other 0" },
    PO: OPTIMUM_EN, MNW: OPTIMUM_EN, USW: OPTIMUM_EN, Leximin: OPTIMUM_EN, EGW: OPTIMUM_EN,
  },
};

const ALGOS_EN = {
  tourniquet: { nom: "Round-robin", src: T`[Survey, Algorithm 1, § 3.1](survey)`,
    def: "Agents pick in turn, always in the same order; on their turn, each takes their favourite good among those remaining.",
    lignes: [
      [0, T`For each round $t = 1, \dots, m$:`],
      [1, T`the agent $i$ whose turn it is (order $1, 2, \dots, n, 1, 2, \dots$) picks $g^* \in \operatorname*{arg\,max}_{g \in M} v_i(g)$`],
      [1, T`$A_i \gets A_i \cup \{g^*\}$, $\;M \gets M \setminus \{g^*\}$`],
    ],
    garantie: [["EF1", "additive valuations (+)"]],
    sourceGarantie: T`[Caragiannis et al.](mnw19), survey Theorem 1`,
    retenir: T`If $i$ picks before $j$, in every round $i$ takes a good worth, in their eyes, at least as much as the one $j$ will take next: $i$ does not envy $j$. And $j$ no longer envies $i$ once the first good picked by $i$ is removed. EF1 thus holds at every step.` },
  cycles: { nom: "Envy-cycle elimination", src: T`[Survey, Algorithm 2, § 3.1](survey)`,
    def: "Each good is given to an agent nobody envies. If everybody is envied, there is an envy cycle: bundles are rotated along it.",
    lignes: [
      [0, T`For each good, while some remain:`],
      [1, T`while every agent is envied:`],
      [2, T`find an envy cycle $i_1 \to i_2 \to \dots \to i_1$; each agent takes the bundle of the one they envy`],
      [1, T`$i \gets$ an agent nobody envies`],
      [1, T`they pick $g^* \in \operatorname*{arg\,max}_{g \in M} v_i(g)$; $\;A_i \gets A_i \cup \{g^*\}$`],
    ],
    garantie: [["EF1", "monotone valuations (m) are enough"], ["½-EFX", "additive (+)"], ["½-MMS", "additive (+)"]],
    sourceGarantie: T`[Lipton et al.](lms04), survey Theorems 5 and 6`,
    retenir: T`A good is only given to an agent nobody envies: envy towards their bundle disappears once this last good is removed. A rotation swaps bundles without changing their contents, and every agent on the cycle gains: EF1 holds at every step, and the number of envy arrows decreases.` },
  sacs: { nom: "Bag-filling", src: T`[Survey, Algorithm 3, § 5.1](survey)`,
    def: "Each agent is content with half of their maximin share. First the goods that suffice on their own are handed out, then a bag is filled good by good until some agent accepts it.",
    lignes: [
      [0, T`Threshold of each agent: $\tau_i = \mu_i / 2$`],
      [0, T`While at least two agents remain and some good $g$ is worth $v_i(g) > \tau_i$ to some agent $i$:`],
      [1, T`$A_i \gets \{g\}$; $\,i$ and $g$ leave`],
      [0, T`While at least two agents remain:`],
      [1, T`add a good to the bag, as long as $v_i(\text{bag}) < \tau_i$ for every remaining agent $i$`],
      [1, T`an agent $i$ with $v_i(\text{bag}) \ge \tau_i$ takes the bag and leaves`],
      [0, T`The last agent takes all the remaining goods`],
    ],
    garantie: [["½-MMS", "additive valuations (+)"]],
    sourceGarantie: T`[Ghodsi et al.](ghodsi21), survey Theorem 7`,
    retenir: T`When a bag leaves, it is worth less than $\mu_i$ to every remaining agent $i$: less than $\tau_i$ before its last good, plus one good worth at most $\tau_i$. So enough remains for $i$. Here $\mu_i$ is computed by brute force; in general it is an NP-hard problem.` },
  sansmu: { nom: "Bag-filling without knowing μ", src: T`based on the proof of [survey, Theorem 7](survey)`,
    def: "Bag-filling without ever computing maximin shares: start from overly optimistic thresholds, and lower the threshold of every agent who ends below it.",
    lignes: [
      [0, T`Initial thresholds: $\tau_i = v_i(M) / 2n$, which is at least $\mu_i / 2$`],
      [0, T`Run bag-filling with the thresholds $\tau_i$:`],
      [1, T`single goods, then bags, then the last agent takes the rest`],
      [0, T`If some agent $i$ ends below their threshold: $\tau_i \gets (1 - \varepsilon)\, \tau_i$, and start again`],
      [0, T`Otherwise, everyone has at least $\tau_i \ge (1 - \varepsilon)\, \mu_i / 2$`],
    ],
    garantie: [["(½ − ε)-MMS", "additive valuations (+), without computing μ; here ε = 1/10"]],
    sourceGarantie: T`classical idea of guessed then lowered thresholds; see [Ghodsi et al.](ghodsi21) and the survey, § 5`,
    retenir: T`If $\tau_i \le \mu_i / 2$, the bag-filling proof ensures that $i$ ends with at least $\tau_i$, whatever the others’ thresholds. An agent who fails therefore had $\tau_i > \mu_i / 2$: their threshold can safely be lowered, and it never drops below $(1 - \varepsilon)\, \mu_i / 2$. The $\mu_i$ column is only there for comparison: the algorithm never reads it.` },
};
const INSTANCES_ALGO_EN = [
  { nom: "Two agents, one swap", note: "Envy cycles: one rotation, and the final allocation is EF. Round-robin: EF1 without EFX. Bags: not even EF1." },
  { nom: "Three agents, a three-way cycle", note: "Envy cycles: Alice, Bob and Chloé rotate their bundles." },
  { nom: "A single good, then a bag", note: "Bags: d alone exceeds Bob’s threshold and leaves first; then a two-good bag, then the rest. Everyone gets at least half of their maximin share, but the allocation is not EF1." },
  { nom: "Bags without μ: two attempts", note: "Bags without μ: in the first attempt, Chloé ends below her threshold; once it is lowered, good c is enough for her in the first phase, and Bob takes the rest." },
  { nom: "Round-robin: EF1 but not EFX", note: "Bob envies Alice, even after removing the good he likes least in her bundle." },
];

const TYPES_LIEN_EN = {
  ">": { bandeau: "Implication", h1: "Why", h2: (a, b) => `Counterexample: ${b} ⇏ ${a}` },
  "~": { bandeau: "Twin notions", h1: "What sets them apart", h2: () => "Example" },
  "≈": { bandeau: "Approximate implication", h1: "Why", h2: () => "Limits" },
  "⊘": { bandeau: "No approximation", h1: "Counterexample, for every α > 0", h2: () => "Remark and source" },
  "≠": { bandeau: "Lost implication", h1: "What changes with unequal entitlements", h2: (a, b, L) => L.valuations ? "Counterexample" : "Remark and source" },
};

const DEFINITIONS_ALGO_EN = T`
  <p class="regle-or"><b>How to use it.</b> Step through with ◀ ▶ (or the keyboard arrows). The values in the table can be edited: the algorithm is rerun immediately, at the same step.</p>
  <dl class="defs">
    <dt>Bundles</dt>
    <dd>cell $(i, j)$ is $v_i(A_j)$; diagonal in bold, envy in red, as in the solutions of the cards</dd>
    <dt>$\mu_i$</dt>
    <dd>maximin share of agent $i$: the best value they can guarantee by cutting $M$ into $n$ bundles themselves and receiving the worst one (computed here by brute force)</dd>
    <dt>Envy</dt>
    <dd>arrow $i \to j$ when $v_i(A_j) > v_i(A_i)$; an agent with no incoming arrow is envied by nobody</dd>
  </dl>
  <p class="source">Based on the [survey](survey), Algorithms 1 to 3 (§ 3.1 and § 5.1); ties are broken by taking the first agent or the first good in order.</p>`;

/* Texte de chaque étape d'un algorithme, en anglais (le français est dans moteur.js) */
function texteEtapeEN(e) {
  const v = algo.v, n = v.length;
  const val = (i, S) => somme(v, i, S);
  const id = algo.id === "sansmu" && ["gros", "ajout", "prend", "dernier"].includes(e.type) ? "sacs" : algo.id;
  const seuils = t => t.map((x, i) => `${nomA(i)} ${fmt(x)}`).join(", ");
  switch (id + ":" + e.type) {
    case "tourniquet:debut": return `Empty allocation. The agents will pick in turn: ${NOMS_AGENTS.slice(0, n).join(", ")}, then again from the start.`;
    case "tourniquet:choix": return `Round ${e.tour + 1}, ${nomA(e.agent)}’s turn. Their favourite remaining good is ${nomB(e.bien)} (${v[e.agent][e.bien]} in their eyes): ${nomA(e.agent)} takes it.`;
    case "cycles:debut": return "Empty allocation: nobody envies anybody.";
    case "cycles:cycle": return `Everybody is envied, so there is an envy cycle: ${e.cycle.concat(e.cycle[0]).map(nomA).join(" → ")}.`;
    case "cycles:rotation": return "Each agent takes the bundle of the one they envied. The bundles did not change, only their owners; every agent on the cycle gains.";
    case "cycles:choix": {
      const qui = e.libres.length > 1 ? `Nobody envies ${listeNoms(e.libres)}; we take the first, ${nomA(e.agent)}, who` : `Nobody envies ${nomA(e.agent)}, who`;
      return `${qui} picks their favourite remaining good: ${nomB(e.bien)} (${v[e.agent][e.bien]} in their eyes).`;
    }
    case "sacs:debut": return "We compute each agent’s maximin share μ (last column of the valuations): each will accept any bundle worth at least τ = μ / 2.";
    case "sacs:gros": return `${nomB(e.bien)} is worth ${v[e.agent][e.bien]} to ${nomA(e.agent)}, more than their threshold τ = ${fmt(e.tau[e.agent])}: ${nomA(e.agent)} receives it alone and leaves.`;
    case "sacs:ajout": {
      const atteint = e.actifs.filter(i => val(i, e.sac) >= e.tau[i] - 1e-9);
      return `We add ${nomB(e.bien)} to the bag, which is now worth ${e.actifs.map(i => `${fmt(val(i, e.sac))} to ${nomA(i)}`).join(", ")}. ` +
        (atteint.length ? `${listeNoms(atteint)} ${atteint.length > 1 ? "reach their" : "reaches their"} threshold.` : "Nobody reaches their threshold yet.");
    }
    case "sacs:prend": return `${nomA(e.agent)} values the bag ${ensB(e.pris)} at ${fmt(val(e.agent, e.pris))}, at least their threshold ${fmt(e.tau[e.agent])}: ${nomA(e.agent)} takes it and leaves.` +
      (e.contents.length > 1 ? ` (${listeNoms(e.contents.slice(1))} would have accepted it too; we take the first.)` : "");
    case "sansmu:debut": return `The algorithm does not know μ (greyed column, shown only for comparison). It starts from optimistic thresholds, τ = v(M)/2n: ${seuils(e.tau)}.`;
    case "sansmu:essai": return `Attempt ${e.essai}, with thresholds ${seuils(e.tau)}.`;
    case "sansmu:panne": return `No good left to put in the bag, and it is enough for nobody: ${listeNoms(e.bloques)} ${e.bloques.length > 1 ? "are" : "is"} left with nothing.`;
    case "sansmu:echec": return `${e.rates.map(i => `${nomA(i)} ends with ${fmt(val(i, e.A[i]))}, below their threshold ${fmt(e.tau[i])}`).join("; ")}. This proves that ${e.rates.length > 1 ? "these thresholds exceeded" : "this threshold exceeded"} μ/2: we lower ${e.rates.length > 1 ? "them" : "it"} by 10% (${e.rates.map(i => `${nomA(i)} ${fmt(e.tau[i])} → ${fmt(e.nouveau[i])}`).join(", ")}) and start again.`;
    case "sansmu:succes": return `Everyone has at least their threshold: done, in ${e.essai} attempt${e.essai > 1 ? "s" : ""}.`;
    case "sacs:dernier": return `Only ${nomA(e.agent)} is left, and takes all the remaining goods: ${ensB(e.pris)}.`;
  }
  return "";
}

/* ---------- Bascule ---------- */
const CLE_LANGUE = "carte-equite-langue";
function langueInitiale() {
  const url = new URLSearchParams(location.search).get("lang");
  if (url === "fr" || url === "en") return url;
  try { const s = localStorage.getItem(CLE_LANGUE); if (s === "fr" || s === "en") return s; } catch (e) { /* stockage indisponible */ }
  return (navigator.language || "fr").toLowerCase().startsWith("fr") ? "fr" : "en";
}

function appliquerLangue(lang, redessiner = true) {
  LANG = lang === "en" ? "en" : "fr";
  try { localStorage.setItem(CLE_LANGUE, LANG); } catch (e) { /* stockage indisponible */ }
  const en = LANG === "en";
  document.documentElement.lang = LANG;

  // Données
  CARTES = {};
  for (const k in CARTES_FR) CARTES[k] = en ? fusion(CARTES_FR[k], EN_CARTES[k]) : CARTES_FR[k];
  STATUT = en ? EN_STATUT : STATUT_FR;
  NOMS_FAMILLES = en ? { ...EN_FAMILLES } : Object.fromEntries(Object.keys(FAMILLES).map(k => [k, NOMS_FAMILLES_FR[k]]));
  ALGOS = en ? fusion(ALGOS_FR, ALGOS_EN) : ALGOS_FR;
  INSTANCES_ALGO = en ? fusion(INSTANCES_ALGO_FR, INSTANCES_ALGO_EN) : INSTANCES_ALGO_FR;
  EXCEPTIONS = en ? fusion(EXCEPTIONS_FR, EXCEPTIONS_EN) : EXCEPTIONS_FR;
  CLASSES = CLASSES_FR.map((c, k) => en ? { ...c, ...CLASSES_EN[k] } : c);

  // Textes fixes de la page
  document.querySelectorAll("[data-i18n]").forEach(el => { el.innerHTML = ui(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-aria]").forEach(el => { el.setAttribute("aria-label", ui(el.dataset.i18nAria)); });
  document.querySelectorAll("[data-i18n-title]").forEach(el => { el.title = ui(el.dataset.i18nTitle); });
  document.querySelectorAll("[data-i18n-ph]").forEach(el => { el.placeholder = ui(el.dataset.i18nPh); });
  const [s1, s2, s3] = ui("legStatuts");
  document.getElementById("legende-statuts").innerHTML = `<span>${s1}</span><span>${s2}</span><span>${s3}</span><span id="legende-inconnu" hidden>${ui("legInconnu")}</span>`;
  document.getElementById("legende-indices").innerHTML = ui("legIndices");
  document.querySelectorAll(".langtoggle button").forEach(b => b.setAttribute("aria-pressed", b.dataset.lang === LANG));
  document.querySelector(".langtoggle").classList.toggle("en", en);

  if (!redessiner) return;
  // Vue courante, redessinée à l'identique (même carte, même sélection)
  const garde = selection;
  construireSelecteur();
  remplirInstances();
  afficherCarte(carteDeLAdresse());
  if (garde && carteId !== "algorithmes" && carteId !== "definitions" && (NOTIONS[garde] || LIENS[garde])) ouvrir(garde);
}
