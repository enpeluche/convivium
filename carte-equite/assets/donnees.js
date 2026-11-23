"use strict";

/* ================================================================
   A. DONNÉES
   ----------------------------------------------------------------
   Tout le contenu est ici. Le reste du script ne fait que l'afficher.
   Convention d'écriture :
     - la définition formelle est en LaTeX pur, en trois morceaux :
         `q`  : les quantificateurs, écrits en français avec les maths entre $…$
                (« Pour tous agents $i, j$ : »), affichés en haut à gauche,
         `f`  : la formule elle-même, centrée,
         `ou` : (facultatif) les définitions auxiliaires, centrées sous « où » ;
     - les autres textes mélangent prose et maths entre $…$ ;
     - on écrit les chaînes avec T`…` (= String.raw) pour que les
       antislashs LaTeX (\forall, \ge…) restent tels quels.
   ================================================================ */
const T = String.raw;

const FAMILLES = {
  envie: { nom: "Envie",                   couleur: "var(--envie)" },
  part:  { nom: "Part garantie",           couleur: "var(--part)"  },
  egal:  { nom: "Égalité des utilités",    couleur: "var(--egal)"  },
  eff:   { nom: "Efficacité et bien-être", couleur: "var(--eff)"   },
};

// Statut d'existence : "yes" = existe toujours, "open" = ouvert, "no" = pas toujours
let NOMS_FAMILLES = Object.fromEntries(Object.entries(FAMILLES).map(([k, f]) => [k, f.nom]));
const NOMS_FAMILLES_FR = { ...NOMS_FAMILLES };

const STATUT_FR = { yes: "✓ existe toujours", open: "? ouvert", no: "✗ pas toujours", inconnu: "– non vérifié" };
const GLYPHE = { yes: "✓", open: "?", no: "✗", inconnu: "–" };

// Les partitions 𝒜ₖ(S) et les allocations 𝒜ₙ(M) sont définies une seule fois, dans le bloc de définitions sous le graphe.
// Allocations fractionnaires : x_{i,g} = part du bien g donnée à i
const ALLOCS_FRAC = T`\mathcal{F} = \{ x \in [0,1]^{N \times M} : \forall g,\ \textstyle\sum_i x_{i,g} = 1 \}, \qquad v_i(x_i) = \textstyle\sum_g x_{i,g}\, v_i(g)`;

// Chaque notion : position (x, y) dans le viewBox, famille, statut, noms, définition, formule, note.
// `jumelle` pointe vers la notion analogue de l'autre famille (sans implication).
const NOTIONS_BIENS = {
  /* ---------- Famille Envie ---------- */
  EF: { x: 470, y: 70, fam: "envie", ex: "no", jumelle: "EQ",
    src: T`[Survey, Déf. 1](survey)`,
    en: "Envy-freeness", fr: "Sans envie",
    def: "Personne ne préfère le panier d’un autre au sien.",
    q: T`Pour tous agents $i, j$ :`,
    f: T`v_i(A_i) \ge v_i(A_j)`,
    note: "Un seul bien pour deux agents suffit à l’empêcher. Décider s’il existe une allocation EF est NP-complet." },

  EFX: { x: 470, y: 280, fam: "envie", ex: "open", jumelle: "EQX",
    src: T`[Survey, Déf. 4](survey)`,
    en: "Envy-free up to any good", fr: "Sans envie à n’importe quel bien près",
    def: "L’envie disparaît quel que soit le bien retiré au panier envié, même le moins précieux.",
    q: T`Pour tous agents $i, j$ et tout bien $g \in A_j$ :`,
    f: T`v_i(A_i) \ge v_i(A_j \setminus \{g\})`,
    note: "Problème ouvert majeur : vrai pour 2 et 3 agents, ouvert dès 4 (additif). Faux pour des valuations monotones générales (contre-exemple par SAT, 2026)." },

  EFR: { x: 400, y: 390, fam: "envie", ex: "open",
    src: T`[Survey, § 6.1](survey)`,
    en: "Envy-free up to a random good", fr: "Sans envie à un bien tiré au hasard près",
    def: "L’envie disparaît en moyenne si l’on retire au panier envié un bien tiré au hasard.",
    q: T`Pour tous agents $i, j$ :`,
    f: T`v_i(A_i) \ge \mathop{\mathbb{E}}\limits_{g \sim \mathcal{U}(A_j)}\big[\, v_i(A_j \setminus \{g\}) \,\big]`,
    ou: [T`\mathcal{U}(A_j) \text{ : la loi uniforme sur les biens de } A_j`],
    note: "Problème ouvert 7 du [survey](survey)." },

  EFL: { x: 540, y: 390, fam: "envie", ex: "yes",
    src: T`[Survey, § 6.1](survey)`,
    en: "Envy-free up to one less-preferred good", fr: "Sans envie à un bien moins aimé près",
    def: T`Comme EF1, mais le bien retiré doit valoir moins, pour $i$, que son propre panier. On n’exige rien si $j$ n’a qu’un bien que $i$ valorise.`,
    q: T`Pour tous agents $i, j$ :`,
    f: T`|\{h \in A_j : v_i(h) > 0\}| \le 1 \;\text{ ou }\; \exists g \in A_j,\; \begin{cases} v_i(A_i) \ge v_i(g) \\ v_i(A_i) \ge v_i(A_j \setminus \{g\}) \end{cases}`,
    note: "Introduit par [Barman et al. (2018)](gmms18) ; se calcule en temps polynomial." },

  EF1: { x: 470, y: 500, fam: "envie", ex: "yes", jumelle: "EQ1",
    src: T`[Survey, Déf. 3](survey)`,
    en: "Envy-free up to one good", fr: "Sans envie à un bien près",
    def: "Si j’envie quelqu’un, lui retirer un bien bien choisi suffit à effacer mon envie.",
    q: T`Pour tous agents $i, j$ avec $A_j \neq \varnothing$, il existe un bien $g \in A_j$ tel que :`,
    f: T`v_i(A_i) \ge v_i(A_j \setminus \{g\})`,
    note: "Le tourniquet (round-robin) en donne une. EF1 + PO existe toujours (MNW) ; le calculer en temps polynomial est ouvert." },

  EEFX: { x: 300, y: 345, fam: "envie", ex: "yes",
    src: T`[Caragiannis et al. 2023](eefx23) ; [Survey, § 6.1](survey)`,
    en: "Epistemic EFX", fr: "EFX épistémique",
    def: "Je ne vois que mon panier : il existe une façon de répartir le reste entre les autres pour laquelle je serais EFX.",
    q: T`Pour tout agent $i$, il existe une partition $B = (B_j)_{j \ne i} \in \mathcal{A}_{n-1}(\overline{A_i})$ telle que, pour tout agent $j \ne i$ et tout bien $g \in B_j$ :`,
    f: T`v_i(A_i) \ge v_i(B_j \setminus \{g\})`,
    note: "Introduite par [Caragiannis, Garg, Rathi, Sharma et Varricchio (IJCAI 2023)](eefx23). Existe toujours, même pour des valuations monotones ([Akrami et Rathi, AAAI 2025](akrami25)). Avec 2 agents, EEFX = EFX. N’implique pas EF1 : obtenir EF1 et EEFX ensemble est un résultat à part (2026)." },

  /* ---------- Famille Part garantie ---------- */
  PROP: { x: 930, y: 170, fam: "part", ex: "no",
    src: T`[Survey, Déf. 2](survey)`,
    en: "Proportionality", fr: "Proportionnalité",
    def: T`Chacun reçoit au moins $1/n$ de la valeur totale, selon ses goûts.`,
    q: T`Pour tout agent $i$ :`,
    f: T`v_i(A_i) \ge \frac{v_i(M)}{n}`,
    note: T`Échoue avec un seul bien pour deux agents.` },

  PROPX: { x: 930, y: 280, fam: "part", ex: "no",
    src: T`[Survey, Déf. 13](survey)`,
    en: "Proportionality up to any good", fr: "Proportionnalité à n’importe quel bien près",
    def: "Ajouter n’importe quel bien que je n’ai pas me ferait atteindre ma juste part.",
    q: T`Pour tout agent $i$ et tout bien $g \notin A_i$ :`,
    f: T`v_i(A_i \cup \{g\}) \ge \frac{v_i(M)}{n}`,
    note: "Peut ne pas exister pour des biens ([Aziz et al.](aziz20)), mais existe toujours pour des corvées." },

  PROPm: { x: 930, y: 390, fam: "part", ex: "yes",
    src: T`[Survey, § 6.3](survey)`,
    en: "Proportionality up to the maximin good", fr: "Proportionnalité au bien maximin près",
    def: T`Ma part, plus le « plus petit bien » le plus précieux que je vois chez un autre, atteint $1/n$.`,
    q: T`Pour tout agent $i$ :`,
    f: T`v_i(A_i) + \max_{j \ne i}\, \min_{g \in A_j} v_i(g) \;\ge\; \frac{v_i(M)}{n}`,
    note: "Existence : [Baklanov et al., 2021](propm21)." },

  PROP1: { x: 930, y: 560, fam: "part", ex: "yes",
    src: T`[Survey, Déf. 12](survey)`,
    en: "Proportionality up to one good", fr: "Proportionnalité à un bien près",
    def: "Il me manque au plus un bien, pris chez un autre, pour atteindre ma juste part.",
    q: T`Pour tout agent $i$, il existe un bien $g \notin A_i$ tel que :`,
    f: T`v_i(A_i \cup \{g\}) \ge \frac{v_i(M)}{n}`,
    note: "PROP1 + PO existe aussi." },

  MMS: { x: 790, y: 450, fam: "part", ex: "no",
    src: T`[Survey, Déf. 5](survey)`,
    en: "Maximin share", fr: "Part maximin",
    def: T`Chacun reçoit ce qu’il se garantirait en découpant lui-même $n$ paniers et en prenant le pire.`,
    q: T`Pour tout agent $i$ :`,
    f: T`v_i(A_i) \ge \mu_i`,
    ou: [T`\mu_i = \max_{B \in \mathcal{A}_n(M)}\ \min_k\ v_i(B_k)`, T`\text{autrement dit : } \mu_i \ge t \iff \exists B \in \mathcal{A}_n(M),\ \forall k,\ v_i(B_k) \ge t`],
    note: T`Exemple : Alice $(7, 4, 3, 2)$, $n = 2$ : la meilleure coupe $\{7\} \mid \{4, 3, 2\}$ donne $\mu = 7$, sous la part proportionnelle $8$. Pas toujours atteignable ([Kurokawa et al., 2018](kpw18)).` },

  PMMS: { x: 650, y: 228, fam: "part", ex: "no",
    src: T`[Survey, Déf. 10](survey)`,
    en: "Pairwise maximin share", fr: "Part maximin par paires",
    def: "Pour chaque paire, remettre les deux paniers en commun et rejouer « je coupe, tu choisis » ne ferait rien gagner.",
    q: T`Pour tous agents $i, j$ :`,
    f: T`v_i(A_i) \ge \mu_i^2(A_i \cup A_j)`,
    ou: [T`\mu_i^2(S) = \max_{(P,Q) \in \mathcal{A}_2(S)}\ \min\{v_i(P), v_i(Q)\}`],
    note: T`Le problème ouvert 8 du survey est tranché : [Gölz (2026, prépublication)](golz26) donne une instance à 3 agents et 9 biens, additive, sans allocation PMMS. EFX reste ouvert : PMMS ⇒ EFX, donc ce contre-exemple ne dit rien d’EFX.` },

  GMMS: { x: 650, y: 160, fam: "part", ex: "no",
    src: T`[Survey, Déf. 11](survey)`,
    en: "Groupwise maximin share", fr: "Part maximin par groupes",
    def: "La condition maximin tient dans tout sous-groupe d’agents qui remettrait ses paniers en commun.",
    q: T`Pour tout groupe d’agents $T \subseteq N$ et tout agent $i \in T$ :`,
    f: T`v_i(A_i) \ge \mu_i^{|T|}\Big(\bigcup_{j \in T} A_j\Big)`,
    note: T`Problème ouvert 9 du [survey](survey) : quel est le meilleur α ? Le survey donnait $\tfrac47$ ; voir l’échelle ci-dessus.` },

  APS: { x: 790, y: 320, fam: "part", ex: "no",
    src: T`[Survey, § 8.3](survey)`,
    en: "Any-price share", fr: "Part à n’importe quel prix",
    def: T`Un adversaire fixe des prix positifs de somme 1 ; avec un budget de $1/n$, j’achète le meilleur panier abordable. $\mathrm{APS}_i$ est ce que je garantis face aux pires prix.`,
    q: T`Pour tout agent $i$ :`,
    f: T`v_i(A_i) \ge \mathrm{APS}_i`,
    ou: [T`\mathrm{APS}_i = \min_{p \in \Delta}\ \max\,\{ v_i(S) : S \subseteq M,\ p(S) \le 1/n \}`, T`\Delta = \{ p \in \mathbb{R}_+^M : \textstyle\sum_g p_g = 1 \}, \qquad p(S) = \textstyle\sum_{g \in S} p_g`],
    note: T`APS est un MMS « fractionnaire » (dualité de la programmation linéaire). Exemple : biens $(3, 1)$, $n = 2$ ; si $p_a \le 1/2$ on achète $a$, sinon $b$ coûte moins de $1/2$ : $\mathrm{APS} = 1$.` },

  /* ---------- Famille Égalité des utilités ---------- */
  EQ: { x: 100, y: 70, fam: "egal", ex: "no", jumelle: "EF",
    src: T`[Survey, Déf. 14](survey)`,
    en: "Equitability", fr: "Équitabilité",
    def: "Tout le monde reçoit la même utilité, chacun mesuré avec ses propres goûts.",
    q: T`Pour tous agents $i, j$ :`,
    f: T`v_i(A_i) = v_j(A_j)`,
    note: "Compare des utilités entre agents : il faut des valuations normalisées." },

  EQX: { x: 100, y: 280, fam: "egal", ex: "yes", jumelle: "EFX",
    src: T`[Survey, Déf. 16](survey)`,
    en: "Equitability up to any good", fr: "Équitabilité à n’importe quel bien près",
    def: "L’écart d’utilité disparaît quel que soit le bien retiré à l’agent le mieux loti.",
    q: T`Pour tous agents $i, j$ et tout bien $g \in A_j$ :`,
    f: T`v_i(A_i) \ge v_j(A_j \setminus \{g\})`,
    note: "Existence, pour des valeurs positives : [Gourvès et al.](gourves14) ; [Freeman et al., 2019](freeman19)." },

  EQ1: { x: 100, y: 500, fam: "egal", ex: "yes", jumelle: "EF1",
    src: T`[Survey, Déf. 15](survey)`,
    en: "Equitability up to one good", fr: "Équitabilité à un bien près",
    def: "Retirer un bien bien choisi au mieux loti suffit à effacer l’écart d’utilité.",
    q: T`Pour tous agents $i, j$ avec $A_j \neq \varnothing$, il existe un bien $g \in A_j$ tel que :`,
    f: T`v_i(A_i) \ge v_j(A_j \setminus \{g\})`,
  },

  /* ---------- Famille Efficacité et bien-être ---------- */
  PO: { x: 300, y: 600, fam: "eff", ex: "yes",
    src: T`[Survey, Déf. 6](survey)`,
    en: "Pareto optimality", fr: "Optimalité de Pareto",
    def: "Impossible d’améliorer le sort de quelqu’un sans dégrader celui d’un autre.",
    q: T`Il n’existe pas d’allocation $B \in \mathcal{A}_n(M)$ telle que :`,
    f: T`\begin{aligned} &\forall i,\ v_i(B_i) \ge v_i(A_i) \\ \text{et } &\exists i,\ v_i(B_i) > v_i(A_i) \end{aligned}`,
    note: "PO n’est pas « maximum de la somme » : c’est un élément maximal. Le maximum de la somme est PO, pas l’inverse." },

  fPO: { x: 140, y: 600, fam: "eff", ex: "yes",
    src: T`[Survey, § 7.1](survey)`,
    en: "Fractional Pareto optimality", fr: "Optimalité de Pareto fractionnaire",
    def: "PO même face aux allocations où l’on coupe les biens en morceaux.",
    q: T`Il n’existe pas d’allocation fractionnaire $x \in \mathcal{F}$ telle que :`,
    f: T`\begin{aligned} &\forall i,\ v_i(x_i) \ge v_i(A_i) \\ \text{et } &\exists i,\ v_i(x_i) > v_i(A_i) \end{aligned}`,
    ou: [ALLOCS_FRAC, T`\text{une allocation entière est le cas où chaque } x_{i,g} \in \{0, 1\}`],
    note: "Géométriquement : être sur la frontière de Pareto continue. EF1 + fPO existe toujours ([Barman et al., 2018](bkv18))." },

  MNW: { x: 300, y: 430, fam: "eff", ex: "yes",
    src: T`[Survey, Déf. 7](survey)`,
    en: "Maximum Nash welfare", fr: "Bien-être de Nash maximal",
    def: "Choisir l’allocation qui maximise le produit des utilités.",
    q: "",
    f: T`A \in \operatorname*{arg\,max}_{B \in \mathcal{A}_n(M)}\ \prod_i v_i(B_i)`,
    ou: [T`\text{si le produit maximal vaut } 0 \text{, on maximise d'abord le nombre d'agents d'utilité} > 0`],
    note: T`Idée de [Nash (marchandage, 1950)](nash50). Garantir EF1 et PO à la fois, c’est lui qui le fait ([Caragiannis et al., 2019](mnw19)). Difficile à calculer exactement.` },

  USW: { x: 470, y: 610, fam: "eff", ex: "yes",
    src: T`définition usuelle ; [Survey, § 8.7](survey)`,
    en: "Utilitarian social welfare", fr: "Bien-être utilitariste (somme maximale)",
    def: "Choisir l’allocation qui maximise la somme des utilités.",
    q: "",
    f: T`A \in \operatorname*{arg\,max}_{B \in \mathcal{A}_n(M)}\ \sum_i v_i(B_i)`,
    note: T`En additif, il suffit de donner chaque bien à l’agent qui l’aime le plus (temps polynomial). C’est la référence du prix de l’équité.` },

  Leximin: { x: 170, y: 420, fam: "eff", ex: "yes",
    src: T`[Survey, § 4.1](survey)`,
    en: "Leximin (egalitarian welfare)", fr: "Bien-être égalitariste, version leximin",
    def: "Maximiser l’utilité du plus mal loti, puis celle du deuxième plus mal loti, et ainsi de suite.",
    q: "",
    f: T`A \in \operatorname*{arg\,max}_{B \in \mathcal{A}_n(M)}^{\text{lex}}\ \big( v_{(1)}(B), \dots, v_{(n)}(B) \big)`,
    ou: [T`v_{(1)}(B) \le v_{(2)}(B) \le \dots \le v_{(n)}(B)`],
    note: T`Le max-min seul n’est que faiblement PO ; le leximin corrige ce défaut. Calcul NP-difficile en général (le max-min est le « problème du Père Noël »). Avec des valuations identiques, une variante (leximin++) donne EFX ([Plaut et Roughgarden](plaut18)).` },

  EGW: { x: 180, y: 340, fam: "eff", ex: "yes",
    src: T`[Survey, § 7.2](survey)`,
    en: "Egalitarian welfare (max-min)", fr: "Bien-être égalitariste (max-min)",
    def: "Choisir l’allocation qui maximise l’utilité du plus mal loti.",
    q: "",
    f: T`A \in \operatorname*{arg\,max}_{B \in \mathcal{A}_n(M)}\ \min_i v_i(B_i)`,
    note: "Le « problème du Père Noël » (Santa Claus) : APX-difficile à calculer. Un maximiseur n’est que faiblement PO (on peut améliorer les autres sans toucher au minimum) ; le leximin le raffine en PO. En ordonnancement répétitif, c’est le critère « K-fair » de Hermelin et al. et le seuil k de l’exemple 13-11-9-7-5." },
};

// Flèches d'implication : [A, B] signifie « A ⇒ B »
const IMPLICATIONS_BIENS = [
  ["EF", "GMMS"], ["EF", "PROP"], ["EF", "EFX"],
  ["GMMS", "PMMS"], ["GMMS", "MMS"], ["PMMS", "EFX"],
  ["PROP", "APS"], ["PROP", "PROPX"], ["APS", "MMS"],
  ["PROPX", "PROPm"], ["PROPm", "PROP1"],
  ["EFX", "EFL"], ["EFX", "EFR"], ["EFX", "EEFX"], ["EFL", "EF1"], ["EFR", "EF1"], ["EF1", "PROP1"],
  ["EQ", "EQX"], ["EQX", "EQ1"],
  ["MNW", "EF1"], ["MNW", "PO"], ["fPO", "PO"], ["USW", "PO"], ["Leximin", "PO"], ["Leximin", "EGW"],
];

// Notions jumelles : tirets gris dans les deux sens
const JUMELLES_BIENS = [["EQ", "EF"], ["EQX", "EFX"], ["EQ1", "EF1"]];

// Courbes visibles au survol : [type, A, B, courbure, position de l'étiquette sur la courbe (0 à 1)]
//   "≈" : A ⇒ α-B (vert)      "⊘" : A n'implique aucune approximation de B (rouge)
const COURBES_BIENS = [
  ["≈", "EF1", "PMMS", 100], ["≈", "EF1", "MMS", -40], ["≈", "EFX", "PMMS", -50],
  ["≈", "EFX", "MMS", 40], ["≈", "EFL", "GMMS", 50], ["≈", "MNW", "MMS", 90, 0.66],
  ["≈", "MNW", "PMMS", 170],
  ["⊘", "EF1", "EFX", 35, 0.8], ["⊘", "MNW", "EFX", -50],
  ["⊘", "MMS", "EF1", -50], ["⊘", "MMS", "PMMS", -30], ["⊘", "MMS", "EFX", 70],
  ["⊘", "USW", "EF1", 45],
  ["⊘", "EGW", "EF1", 60], ["⊘", "EGW", "MMS", -60],
];

// Contenu des cartes de flèches. Clé = "A>B" (implication), "A~B" (jumelles),
// "A≈B" (approchée : `alpha` en texte pour le SVG, `alphaTex` pour la carte), "A⊘B" (aucune).
const LIENS_BIENS = {
  "EF>GMMS": {
    pont: [[T`|T| \cdot v_i(A_i) \just{EF}{\ge} \sum_{j \in T} v_i(A_j) \just{+}{=} v_i(S), \qquad S = \bigcup_{j \in T} A_j`, []],
           [T`\mu_i^{|T|}(S) \just{1}{\le} \frac{v_i(S)}{|T|} \just{2}{\le} v_i(A_i)`, [T`dans toute partition de $S$ en $|T|$ paquets, le pire paquet vaut au plus la moyenne`, T`EF et (+)`]]],
    hyp: [T`additivité`],
    question: T`Calcule la part maximin d’Alice, seule puis dans le groupe des deux. Envie-t-elle Bob ?`,
    valuations: { biens: T`g`, agents: { "Alice": T`1`, "Bob": T`1` } },
    allocation: { "Alice": T``, "Bob": T`g` },
    preuve: T`Dans tout groupe $S$, l’allocation restreinte à $S$ est encore sans envie, donc proportionnelle entre les membres de $S$, donc chacun a au moins sa part maximin de $S$ (PROP ⇒ MMS).`,
    exemple: "Un bien, deux agents qui l’aiment. Celui qui n’a rien a une part maximin nulle (un des deux paquets est vide) : GMMS est vérifié, mais il envie l’autre." },
  "EF>PROP": {
    pont: [[T`n \cdot v_i(A_i) \just{EF}{\ge} \sum_{j \in N} v_i(A_j) \just{+}{=} v_i(M)`, []],
           [null, T`On divise par $n$.`]],
    hyp: [T`additivité`],
    question: T`Vérifie que chacun a au moins le tiers de sa valeur totale, puis compare ce qu’Alice a avec ce qu’elle voit chez Bob.`,
    valuations: { biens: T`a b c d`, agents: { "Alice": T`3 3 3 0`, "Bob": T`1 1 1 0`, "Chloé": T`0 0 0 3` } },
    allocation: { "Alice": T`a`, "Bob": T`b c`, "Chloé": T`d` },
    preuve: T`Sommer $v_i(A_i) \ge v_i(A_j)$ sur tous les $j$ : $n \cdot v_i(A_i) \ge \sum_j v_i(A_j) = v_i(M)$.`,
    exemple: T`Alice $(3, 3, 3, 0)$, Bob $(1, 1, 1, 0)$, Chloé $(0, 0, 0, 3)$. Alice $\{a\}$, Bob $\{b, c\}$, Chloé $\{d\}$ : chacun a son tiers, mais Alice voit 6 chez Bob et n’a que 3.` },
  "EF>EFX": {
    pont: [[T`v_i(A_i) \just{EF}{\ge} v_i(A_j) \just{m}{\ge} v_i(A_j \setminus \{g\}) \qquad (g \in A_j)`, []]],
    hyp: [T`monotonie`],
    question: T`Alice envie-t-elle Bob ? Et si l’on retire à Bob son unique bien ?`,
    valuations: { biens: T`g`, agents: { "Alice": T`1`, "Bob": T`1` } },
    allocation: { "Alice": T``, "Bob": T`g` },
    preuve: T`Retirer un bien ne peut que baisser $v_i(A_j)$ : si $v_i(A_i) \ge v_i(A_j)$, alors a fortiori $v_i(A_i) \ge v_i(A_j \setminus \{g\})$.`,
    exemple: "Un bien, deux agents. Retirer l’unique bien du panier envié laisse 0 : EFX est vérifié, EF non." },
  "GMMS>PMMS": {
    pont: [[T`v_i(A_i) \just{GMMS}{\ge} \mu_i^2(A_i \cup A_j)`, []]],
    hyp: [],
    preuve: T`PMMS est la condition GMMS restreinte aux groupes de deux agents, $S = \{i, j\}$.`,
    exemple: "PMMS et MMS sont incomparables ([Caragiannis et al., 2019](mnw19)) : une allocation PMMS qui n’est pas MMS n’est pas GMMS. Avec deux agents, les trois notions coïncident, il faut donc au moins trois agents." },
  "GMMS>MMS": {
    pont: [[T`v_i(A_i) \just{GMMS}{\ge} \mu_i^n\Big(\bigcup_{j \in N} A_j\Big) \just{1}{=} \mu_i^n(M) = \mu_i`, [T`les paniers de tous les agents forment $M$`]]],
    hyp: [],
    question: T`Calcule $\mu_i$ pour chacun, puis la part maximin de l’agent 2 dans le groupe $\{1, 2\}$.`,
    valuations: { biens: T`g_1 g_2 g_3 g_4 g_5`, agents: { "1": T`1 1 1 1 1`, "2": T`1 1 1 1 1`, "3": T`1 1 1 1 1` } },
    allocation: { "1": T`g_1 g_2 g_3`, "2": T`g_4`, "3": T`g_5` },
    preuve: T`MMS est la condition GMMS pour le groupe entier, $S = N$.`,
    exemple: T`Trois agents, cinq biens identiques valant 1, $\mu = 1$. Comptes $(3, 1, 1)$ : MMS est vérifié, mais les agents 1 et 2 réunis ont 4 biens, que l’agent 2 couperait en $2 + 2$ : il n’a que $1 < 2$.` },
  "PMMS>EFX": {
    pont: [[null, T`Par l’absurde : supposons $v_i(A_i) < v_i(A_j \setminus \{g\})$ pour un bien $g \in A_j$, et regardons la coupe $(A_i \cup \{g\},\ A_j \setminus \{g\})$ de $A_i \cup A_j$.`],
           [T`v_i(A_i \cup \{g\}) \just{+}{=} v_i(A_i) + v_i(g) \just{1}{>} v_i(A_i)`, [T`$v_i(g) > 0$`]],
           [T`\mu_i^2(A_i \cup A_j) \just{2}{\ge} \min\{v_i(A_i \cup \{g\}),\ v_i(A_j \setminus \{g\})\} \just{3}{>} v_i(A_i)`, [T`$\mu_i^2$ est le meilleur minimum sur toutes les coupes`, T`(1) et l’hypothèse de l’absurde`]],
           [null, T`$i$ gagnerait à redécouper la paire : contradiction avec PMMS.`]],
    hyp: [T`additivité`, T`valeurs > 0`],
    question: T`Bob envie-t-il encore Alice après le retrait de n’importe lequel de ses biens ? Cherche ensuite la meilleure coupe des quatre biens en deux paquets.`,
    valuations: { biens: T`a b c d`, agents: { "Alice": T`4 3 3 2`, "Bob": T`4 3 3 2` } },
    allocation: { "Alice": T`a b`, "Bob": T`c d` },
    preuve: T`Si $v_i(A_i) < v_i(A_j \setminus \{g\})$, la coupe $(A_i \cup \{g\},\ A_j \setminus \{g\})$ a ses deux morceaux de valeur $> v_i(A_i)$ (valeurs positives) : $i$ gagnerait à redécouper la paire, ce qui contredit PMMS.`,
    exemple: T`Deux agents identiques, biens $(4, 3, 3, 2)$, $\mu = 6$ ($\{4, 2\}$ et $\{3, 3\}$). Alice $\{4, 3\}$, Bob $\{3, 2\}$ : Bob est EFX (retirer 3 laisse $4 \le 5$), mais n’a que $5 < 6$.` },
  "PROP>APS": {
    pont: [[T`p^*_g = \frac{v_i(g)}{v_i(M)}, \qquad p^*(S) \just{1}{=} \frac{v_i(S)}{v_i(M)}`, [T`additivité ; c’est un prix particulier, proportionnel aux valeurs de $i$`]],
           [T`\mathrm{APS}_i \just{2}{\le} \max\{v_i(S) : p^*(S) \le \tfrac1n\} \just{3}{\le} \frac{v_i(M)}{n} \just{PROP}{\le} v_i(A_i)`, [T`APS est un minimum sur tous les prix`, T`(1) : $p^*(S) \le \tfrac1n$ donne $v_i(S) \le v_i(M)/n$`]]],
    hyp: [T`additivité`, T`$v_i(M) > 0$`],
    question: T`Quels prix empêchent Alice d’acheter quoi que ce soit avec un budget de $1/2$ ? Compare avec sa part proportionnelle.`,
    valuations: { biens: T`g`, agents: { "Alice": T`1`, "Bob": T`1` } },
    allocation: { "Alice": T``, "Bob": T`g` },
    preuve: T`$\mathrm{APS}_i$ est un minimum sur les prix, donc $\mathrm{APS}_i \le \max\{ v_i(S) : p^*(S) \le 1/n \}$ pour le prix particulier $p^*_g = v_i(g)/v_i(M) \in \Delta$. Par additivité $p^*(S) = v_i(S)/v_i(M)$, donc $p^*(S) \le 1/n \Rightarrow v_i(S) \le v_i(M)/n$. D’où $\mathrm{APS}_i \le v_i(M)/n \le v_i(A_i)$.`,
    exemple: T`Un bien, deux agents. Le prix 1 sur ce bien empêche de l’acheter avec un budget $1/2$ : $\mathrm{APS} = 0$ pour celui qui n’a rien. APS est vérifié, PROP ($1/2$) non.` },
  "PROP>PROPX": {
    pont: [[T`v_i(A_i \cup \{g\}) \just{m}{\ge} v_i(A_i) \just{PROP}{\ge} \frac{v_i(M)}{n} \qquad (g \notin A_i)`, []]],
    hyp: [T`monotonie`],
    question: T`Alice a-t-elle sa part proportionnelle ? La dépasserait-elle en recevant le bien ?`,
    valuations: { biens: T`g`, agents: { "Alice": T`1`, "Bob": T`1` } },
    allocation: { "Alice": T``, "Bob": T`g` },
    preuve: T`Ajouter un bien ne peut que faire monter la valeur : $v_i(A_i \cup \{g\}) \ge v_i(A_i) \ge v_i(M)/n$.`,
    exemple: T`Un bien, deux agents : celui qui n’a rien passerait à $1 > 1/2$ en recevant le bien. PROPX est vérifié, PROP non.` },
  "APS>MMS": {
    pont: [[null, T`Soit $B \in \mathcal{A}_n(M)$ la meilleure coupe de $i$, et $p \in \Delta$ un prix quelconque.`],
           [T`\exists \ell,\ p(B_\ell) \just{1}{\le} \frac1n`, [T`les $n$ paquets coûtent 1 au total : l’un coûte au plus la moyenne`]],
           [T`\max\{v_i(S) : p(S) \le \tfrac1n\} \just{2}{\ge} v_i(B_\ell) \just{3}{\ge} \mu_i`, [T`$B_\ell$ est abordable, par (1)`, T`chaque paquet de la meilleure coupe vaut au moins $\mu_i$`]],
           [null, T`C’est vrai pour tout prix $p$, donc $\mathrm{APS}_i \ge \mu_i$, puis $v_i(A_i) \ge \mathrm{APS}_i \ge \mu_i$.`]],
    hyp: [],
    preuve: T`Pour tout vecteur de prix, l’un des $n$ paquets de la meilleure coupe de $i$ coûte au plus $1/n$ ; $i$ peut l’acheter, et il vaut au moins $\mu_i$. Donc $\mathrm{APS}_i \ge \mu_i$.`,
    exemple: T`APS peut être strictement plus grande que MMS ([Babaioff, Ezra et Feige, 2021](aps21)) : une allocation qui donne à $i$ exactement $\mu_i$ est alors MMS sans être APS.` },
  "PROPX>PROPm": {
    pont: [[null, T`Soit $g^*$ un bien qui réalise $\max_{j \ne i} \min_{g \in A_j} v_i(g)$ (s’il y en a plusieurs, n’importe lequel) : il est dans le panier d’un autre agent, donc $g^* \notin A_i$.`],
           [T`v_i(A_i) + v_i(g^*) \just{+}{=} v_i(A_i \cup \{g^*\}) \just{PROPX}{\ge} \frac{v_i(M)}{n}`, []]],
    hyp: [T`additivité`],
    question: T`Pas d’allocation donnée : essaie de répartir les cinq biens pour que chacun atteigne sa part $13/3$ avec n’importe quel bien en plus. Qu’est-ce qui bloque ?`,
    valuations: { biens: T`a b c d e`, agents: { "1": T`3 3 3 3 1`, "2": T`3 3 3 3 1`, "3": T`3 3 3 3 1` } },
    preuve: T`Le bien qui réalise $\max_j \min_{g \in A_j} v_i(g)$ est hors de $A_i$ : PROPX, appliqué à ce bien, donne la condition PROPm.`,
    exemple: T`Trois agents, biens $(3, 3, 3, 3, 1)$ : aucune allocation PROPX n’existe (Table 3 du [survey](survey)), alors qu’une allocation PROPm existe toujours.` },
  "PROPm>PROP1": {
    pont: [[T`v_i(A_i \cup \{g^*\}) \just{+}{=} v_i(A_i) + v_i(g^*) \just{1}{\ge} \frac{v_i(M)}{n}`, [T`PROPm, où $g^* \notin A_i$ réalise le max`]]],
    hyp: [T`additivité`],
    question: T`Quel bien ajouter à Alice pour qu’elle atteigne sa part de 2 ? Quel est le plus petit bien de Bob, et celui de Chloé ?`,
    valuations: { biens: T`a b c d`, agents: { "Alice": T`3 1 1 1`, "Bob": T`3 1 1 1`, "Chloé": T`3 1 1 1` } },
    allocation: { "Alice": T``, "Bob": T`a b`, "Chloé": T`c d` },
    preuve: T`Le bien qui réalise le max de PROPm est un bien $g \notin A_i$ ; l’ajouter donne $v_i(A_i \cup \{g\}) \ge v_i(M)/n$.`,
    exemple: T`Trois agents identiques, biens $(3, 1, 1, 1)$, part 2. Alice rien, Bob $\{3, 1\}$, Chloé $\{1, 1\}$ : ajouter 3 donne PROP1 à Alice, mais le plus petit bien de chacun vaut 1, et $0 + 1 < 2$.` },
  "EFX>EFL": {
    pont: [[null, T`Si $A_j$ contient au plus un bien que $i$ valorise positivement, EFL est vrai par définition. Sinon, $A_j$ a au moins deux biens : soit $g$ un bien de $A_j$ que $i$ aime le moins (en cas d’égalité, n’importe lequel), et $h \ne g$ un autre bien de $A_j$.`],
           [T`v_i(A_i) \just{EFX}{\ge} v_i(A_j \setminus \{g\}) \just{1}{\ge} v_i(h) \just{2}{\ge} v_i(g)`, [T`monotonie des valuations, car $h \in A_j \setminus \{g\}$`, T`$g$ est un bien de $A_j$ que $i$ aime le moins`]],
           [null, T`La première inégalité est la deuxième condition d’EFL ; la chaîne entière donne la première.`]],
    hyp: [T`monotonie`],
    question: T`Pour Alice, quels biens de Bob peut-on retirer pour effacer son envie ? Lesquels ne suffisent pas ?`,
    valuations: { biens: T`a b c d`, agents: { "Alice": T`3 3 2 1`, "Bob": T`3 3 2 1` } },
    allocation: { "Alice": T`a`, "Bob": T`b c d` },
    preuve: T`Si $|A_j| \ge 2$, prendre $g$ un bien le moins aimé de $A_j$ : EFX donne $v_i(A_i) \ge v_i(A_j \setminus \{g\}) \ge v_i(g)$.`,
    exemple: T`Biens identiques $(3, 3, 2, 1)$. Alice $\{3\}$, Bob $\{3, 2, 1\}$ : retirer 3 laisse $3 \le 3$, et $3 \le 3$, donc EFL ; retirer 1 laisse $5 > 3$, donc pas EFX.` },
  "EFX>EFR": {
    pont: [[T`\mathop{\mathbb{E}}\limits_{g \sim \mathcal{U}(A_j)}\big[v_i(A_j \setminus \{g\})\big] \just{1}{\le} \max_{g \in A_j} v_i(A_j \setminus \{g\}) \just{EFX}{\le} v_i(A_i)`, [T`une moyenne est au plus le maximum`]]],
    hyp: [],
    question: T`Que reste-t-il en moyenne chez Bob quand on lui retire un bien au hasard ? Et dans le pire cas ?`,
    valuations: { biens: T`a b c`, agents: { "Alice": T`4 3 1`, "Bob": T`4 3 1` } },
    allocation: { "Alice": T`b`, "Bob": T`a c` },
    preuve: "EFX vaut pour chaque bien retiré, donc aussi en moyenne sur un bien tiré au hasard.",
    exemple: T`Biens identiques $(4, 3, 1)$. Alice $\{3\}$, Bob $\{4, 1\}$ : en moyenne il reste $(1 + 4)/2 = 2{,}5 \le 3$, donc EFR ; retirer 1 laisse $4 > 3$, donc pas EFX.` },
  "EFL>EF1": {
    pont: [[null, T`Si EFL est vrai par sa deuxième condition, le bien $g$ qu’elle donne convient : c’est celle d’EF1. Sinon, $A_j$ contient au plus un bien $h$ que $i$ valorise positivement : on retire $h$ (ou n’importe quel bien s’il n’y en a pas).`],
           [T`v_i(A_j \setminus \{h\}) \just{1}{=} 0 \just{2}{\le} v_i(A_i)`, [T`les biens restants valent 0 pour $i$ : additivité`, T`valeurs positives ou nulles`]]],
    hyp: [T`additivité`, T`valeurs ≥ 0`],
    question: T`Quel bien retirer à Bob pour qu’Alice ne l’envie plus ? Ce bien vaut-il moins que le panier d’Alice ?`,
    valuations: { biens: T`a b c`, agents: { "Alice": T`2 1 1`, "Bob": T`2 1 1` } },
    allocation: { "Alice": T`b`, "Bob": T`a c` },
    preuve: T`Le bien $g$ donné par EFL convient pour EF1 ; et si $|A_j| \le 1$, retirer l’unique bien laisse 0.`,
    exemple: T`Biens identiques $(2, 1, 1)$. Alice $\{1\}$, Bob $\{2, 1\}$ : retirer 2 laisse $1 \le 1$, donc EF1 ; mais aucun bien de Bob ne vérifie les deux conditions d’EFL.` },
  "EFR>EF1": {
    pont: [[T`\min_{g \in A_j} v_i(A_j \setminus \{g\}) \just{1}{\le} \mathop{\mathbb{E}}\limits_{g \sim \mathcal{U}(A_j)}\big[v_i(A_j \setminus \{g\})\big] \just{EFR}{\le} v_i(A_i)`, [T`un minimum est au plus la moyenne`]],
           [null, T`Le bien qui réalise ce minimum convient pour EF1.`]],
    hyp: [],
    question: T`Quel retrait chez Bob efface l’envie d’Alice ? Que reste-t-il chez Bob en moyenne ?`,
    valuations: { biens: T`a b c`, agents: { "Alice": T`2 1 1`, "Bob": T`2 1 1` } },
    allocation: { "Alice": T`b`, "Bob": T`a c` },
    preuve: T`Une moyenne est au moins égale au minimum : un des biens retirés laisse au plus la moyenne, donc au plus $v_i(A_i)$.`,
    exemple: T`Biens identiques $(2, 1, 1)$. Alice $\{1\}$, Bob $\{2, 1\}$ : EF1 (retirer 2 laisse 1), mais en moyenne il reste $(1 + 2)/2 = 1{,}5 > 1$.` },
  "EF1>PROP1": {
    pont: [[null, T`Soit $g^*$ un bien hors de $A_i$ de valeur maximale pour $i$ (s’il y en a plusieurs, n’importe lequel : seule sa valeur compte). Pour chaque $j \ne i$, EF1 donne un bien $g_j \in A_j$.`],
           [T`v_i(A_i) \just{1}{\ge} v_i(A_j) - v_i(g_j) \just{2}{\ge} v_i(A_j) - v_i(g^*)`, [T`EF1 et additivité`, T`$g_j \notin A_i$, donc $v_i(g_j) \le v_i(g^*)$`]],
           [T`n \cdot v_i(A_i) \just{3}{\ge} v_i(M) - (n - 1)\, v_i(g^*)`, [T`(2) sommé sur les $n - 1$ autres agents, plus $v_i(A_i)$ ; additivité`]],
           [T`v_i(A_i \cup \{g^*\}) \just{+}{=} v_i(A_i) + v_i(g^*) \just{4}{\ge} \frac{v_i(M) + v_i(g^*)}{n} \just{5}{\ge} \frac{v_i(M)}{n}`, [T`(3), réarrangé`, T`$v_i(g^*) \ge 0$`]]],
    hyp: [T`additivité`, T`valeurs ≥ 0`],
    question: T`Quelle est la part proportionnelle d’Alice ? Combien de biens faut-il retirer à Bob pour qu’elle ne l’envie plus ?`,
    valuations: { biens: T`a b c d`, agents: { "Alice": T`1 1 1 1`, "Bob": T`1 1 1 1` } },
    allocation: { "Alice": T`a`, "Bob": T`b c d` },
    preuve: T`Pour chaque $j$ : $v_i(A_i) \ge v_i(A_j) - v_i(g^*)$, avec $g^*$ un bien préféré de $i$ hors de $A_i$. Sommer sur $j$ : $n \cdot v_i(A_i) \ge v_i(M) - (n - 1)\, v_i(g^*)$, d’où $v_i(A_i) + v_i(g^*) \ge v_i(M)/n$.`,
    exemple: T`Deux agents, quatre biens valant 1. Alice $\{1\}$, Bob $\{1, 1, 1\}$ : avec un bien de plus, Alice atteint 2, sa part (PROP1) ; mais retirer un bien à Bob lui laisse $2 > 1$.` },
  "EQ>EQX": {
    pont: [[T`v_j(A_j \setminus \{g\}) \just{m}{\le} v_j(A_j) \just{EQ}{=} v_i(A_i)`, []]],
    hyp: [T`monotonie`],
    question: T`Compare les utilités d’Alice et de Bob, puis refais la comparaison après avoir retiré son bien à Alice.`,
    valuations: { biens: T`g`, agents: { "Alice": T`1`, "Bob": T`1` } },
    allocation: { "Alice": T`g`, "Bob": T`` },
    preuve: T`Retirer un bien ne peut que baisser $v_j(A_j)$.`,
    exemple: T`Un bien, deux agents qui le valent 1. Alice l’a : retirer l’unique bien laisse $0 \le 0$, donc EQX ; mais $1 \ne 0$.` },
  "EQX>EQ1": {
    pont: [[null, T`« Pour tout bien de $A_j$ » implique « pour un bien de $A_j$ », dès que $A_j \ne \varnothing$.`]],
    hyp: [],
    question: T`Quels biens de Bob peut-on retirer pour que son utilité ne dépasse plus celle d’Alice ?`,
    valuations: { biens: T`a b c`, agents: { "Alice": T`2 1 1`, "Bob": T`2 1 1` } },
    allocation: { "Alice": T`b`, "Bob": T`a c` },
    preuve: "« Pour tout bien » implique « pour un bien ».",
    exemple: T`Valeurs identiques $(2, 1, 1)$. Alice $\{1\}$, Bob $\{2, 1\}$ : retirer 2 laisse $1 \le 1$ (EQ1), retirer 1 laisse $2 > 1$ (pas EQX).` },
  "MNW>EF1": {
    pont: [[null, T`Par l’absurde : $i$ envie $j$ même après le retrait de n’importe quel bien de $A_j$. On déplace de $j$ vers $i$ un bien $g \in A_j$ qui minimise $v_j(g)/v_i(g)$.`], [T`\frac{v_i(A_i) + v_i(g)}{v_i(A_i)} \cdot \frac{v_j(A_j) - v_j(g)}{v_j(A_j)} > 1`, T`L’argument d’échange de [Caragiannis et al. (2019)](mnw19) montre que ce rapport dépasse 1 : le produit des utilités augmente, ce qui contredit MNW.`]],
    hyp: [T`additivité`],
    question: T`Cette allocation est-elle EF1 ? Compare son produit des utilités avec celui de l’allocation inverse.`,
    valuations: { biens: T`a b`, agents: { "Alice": T`3 1`, "Bob": T`1 3` } },
    allocation: { "Alice": T`b`, "Bob": T`a` },
    preuve: T`Argument d’échange ([Caragiannis et al., 2019](mnw19)) : si $i$ envie $j$ même après tout retrait, déplacer de $j$ vers $i$ le bien qui minimise $v_j(g)/v_i(g)$ augmente strictement le produit.`,
    exemple: T`Alice $(3, 1)$, Bob $(1, 3)$. Alice $\{b\}$, Bob $\{a\}$ est EF1 (chacun n’a qu’un bien), mais son produit vaut 1 contre 9 pour Alice $\{a\}$, Bob $\{b\}$.` },
  "MNW>PO": {
    pont: [[T`\prod_i v_i(B_i) \just{1}{>} \prod_i v_i(A_i)`, [T`si $B$ domine $A$ : chaque facteur augmente ou reste égal, l’un augmente strictement, et les utilités de $A$ sont strictement positives`]],
           [null, T`Contradiction avec MNW.`]],
    hyp: [T`utilités > 0`],
    question: T`Peut-on améliorer Bob sans que l’utilité d’Alice baisse ? Que vaut le produit des utilités ?`,
    valuations: { biens: T`a b`, agents: { "Alice": T`2 2`, "Bob": T`1 1` } },
    allocation: { "Alice": T`a b`, "Bob": T`` },
    preuve: "Une allocation qui en domine une autre ne diminue l’utilité de personne et augmente celle de quelqu’un : elle a un produit plus grand (quand les utilités sont positives).",
    exemple: T`Alice $(2, 2)$, Bob $(1, 1)$. Tout donner à Alice maximise la somme, donc c’est PO ; mais le produit vaut 0.` },
  "fPO>PO": {
    pont: [[T`\mathcal{A}_n(M) \subseteq \mathcal{F}`, T`Une allocation entière est une allocation fractionnaire dont chaque $x_{i,g}$ vaut 0 ou 1 : si rien dans $\mathcal{F}$ ne domine $A$, rien dans $\mathcal{A}_n(M)$ non plus.`]],
    hyp: [],
    question: T`Cherche un échange de biens entiers qui arrange les deux, puis un échange fractionnaire (une part de $a$ contre une part de $b$).`,
    valuations: { biens: T`a b`, agents: { "Alice": T`6 2`, "Bob": T`4 3` } },
    allocation: { "Alice": T`b`, "Bob": T`a` },
    preuve: "Une allocation entière est un cas particulier d’allocation fractionnaire : si rien de fractionnaire ne la domine, rien d’entier non plus.",
    exemple: T`Alice $(6, 2)$, Bob $(4, 3)$. Alice $\{b\}$, Bob $\{a\}$ est PO, mais céder 20 % de $b$ à Bob contre 10 % de $a$ donne $2{,}2$ et $4{,}2$ : pas fPO.` },
  "USW>PO": {
    pont: [[T`\sum_i v_i(B_i) \just{1}{>} \sum_i v_i(A_i)`, [T`si $B$ domine $A$ : personne n’y perd et quelqu’un y gagne`]],
           [null, T`Contradiction avec USW.`]],
    hyp: [],
    question: T`Peut-on améliorer l’un sans prendre à l’autre ? Compare la somme des utilités avec celle où Alice a tout.`,
    valuations: { biens: T`a b`, agents: { "Alice": T`2 2`, "Bob": T`1 1` } },
    allocation: { "Alice": T`a`, "Bob": T`b` },
    preuve: T`Si $B$ domine $A$, personne n’y perd et quelqu’un y gagne, donc $\sum_i v_i(B_i) > \sum_i v_i(A_i)$ : $A$ ne maximisait pas la somme.`,
    exemple: T`Alice $(2, 2)$, Bob $(1, 1)$. Un bien chacun est PO (donner plus à Alice oblige à prendre à Bob), mais la somme vaut 3 contre 4 en donnant tout à Alice.` },
  "Leximin>PO": {
    pont: [[T`v_{(k)}(B) \ge v_{(k)}(A) \quad \text{pour tout } k`, T`Si $B$ domine $A$, trier les deux vecteurs d’utilités préserve l’inégalité composante par composante ; comme les sommes diffèrent, elle est stricte pour au moins un $k$. $B$ bat donc $A$ dans l’ordre leximin.`]],
    hyp: [],
    question: T`Peut-on améliorer Bob sans prendre à Alice ? Compare l’utilité du plus mal loti ici et avec un bien chacun.`,
    valuations: { biens: T`a b`, agents: { "Alice": T`2 2`, "Bob": T`1 1` } },
    allocation: { "Alice": T`a b`, "Bob": T`` },
    preuve: T`Si $B$ domine $A$, chaque utilité de $B$ est $\ge$ celle de $A$, donc le vecteur trié de $B$ est $\ge$ celui de $A$ composante par composante, et strictement plus grand quelque part (les sommes diffèrent) : $B$ bat $A$ dans l’ordre leximin.`,
    exemple: T`Alice $(2, 2)$, Bob $(1, 1)$. Tout donner à Alice est PO (c’est la somme maximale), mais le plus mal loti a 0, contre 1 en donnant un bien à chacun.` },
  "Leximin>EGW": {
    pont: [[T`v_{(1)}(A) = \min_i v_i(A_i)`, T`La première composante du vecteur trié est la plus petite utilité. L’ordre leximin la compare en premier : une allocation leximin maximise donc le minimum.`]],
    hyp: [],
    preuve: "Le leximin compare d’abord la plus petite utilité : une allocation leximin maximise donc le minimum.",
    exemple: "Chloé n’aime aucun bien : toutes les allocations ont un minimum nul, donc toutes maximisent le min, même celle qui donne tout à Chloé. Le leximin, lui, départage ensuite au profit d’Alice et de Bob." },
  "EFX>EEFX": {
    pont: [[T`(A_j)_{j \ne i} \in \mathcal{A}_{n-1}(\overline{A_i})`, T`On choisit d’imaginer la répartition réelle, $B_j = A_j$ : les paniers des autres partitionnent bien ce qui reste. Pour ce choix, la condition d’EEFX est exactement celle d’EFX.`]],
    hyp: [],
    question: T`Alice est-elle EFX envers Bob ? Imagine une autre répartition des biens de Bob et de Chloé pour laquelle elle le serait.`,
    valuations: { biens: T`g_1 g_2 g_3 g_4`, agents: { "Alice": T`2 1 1 1` } },
    allocation: { "Alice": T`g_4`, "Bob": T`g_1 g_2`, "Chloé": T`g_3` },
    preuve: T`Prendre $B_j = A_j$ : la vraie allocation est l’une des répartitions que $i$ peut imaginer, et elle est EFX.`,
    exemple: T`Alice évalue $(2, 1, 1, 1)$. Alice $\{g_4\}$, Bob $\{g_1, g_2\}$, Chloé $\{g_3\}$ : pas EFX (Bob sans $g_2$ vaut $2 > 1$). Mais Alice peut imaginer Bob $\{g_1\}$ et Chloé $\{g_2, g_3\}$ : Bob privé de $g_1$ vaut 0, Chloé privée d’un bien vaut $1 \le 1$. Il faut au moins 3 agents : avec 2, EEFX = EFX.` },

  /* Jumelles */
  "EQ~EF": {
    question: T`Compare les utilités d’Alice et de Bob (EQ), puis ce qu’Alice a avec ce qu’elle voit chez Bob (EF).`,
    valuations: { biens: T`a b`, agents: { "Alice": T`0{,}6 0{,}4`, "Bob": T`0{,}4 0{,}6` } },
    allocation: { "Alice": T`b`, "Bob": T`a` },
    preuve: "EF compare les paniers avec les yeux d’un même agent ; EQ compare les satisfactions de deux agents. Elles coïncident quand tous les agents ont la même valuation.",
    exemple: T`Valeurs normalisées : Alice $(0{,}6\,;\,0{,}4)$, Bob $(0{,}4\,;\,0{,}6)$. Alice $\{b\}$, Bob $\{a\}$ : $0{,}4 = 0{,}4$ (EQ), mais Alice préfère $\{a\}$ ($0{,}6$). Inversement, Alice $\{a\}$, Bob $\{b\}$ est EF sans être EQ si Bob évaluait $(0{,}1\,;\,0{,}9)$.` },
  "EQX~EFX": {
    preuve: T`Même différence : EFX retire un bien et compare avec $v_i$, EQX retire un bien et compare avec $v_j$. Identiques si les valuations le sont.`,
    exemple: "Notions indépendantes en général : à retrouver sur le modèle de l’exemple EF / EQ, en prenant des valuations différentes." },
  "EQ1~EF1": {
    preuve: "Même différence qu’entre EF et EQ, au niveau « un bien près ».",
    exemple: "Toutes deux existent toujours, mais EF1 + PO existe toujours alors qu’EQ1 + PO peut échouer quand certaines valeurs sont nulles (Exemple 5 du [survey](survey))." },

  /* Implications approchées */
  "EF1≈PMMS": { alpha: "1/2", alphaTex: T`\tfrac12`,
    pont: [[null, T`Fixons $j$, et $g$ le bien que EF1 retire à $A_j$. Dans toute coupe $(P, Q) \in \mathcal{A}_2(A_i \cup A_j)$, un des morceaux ne contient pas $g$.`],
           [T`\min\{v_i(P), v_i(Q)\} \just{1}{\le} v_i(A_i) + v_i(A_j \setminus \{g\}) \just{EF1}{\le} 2\, v_i(A_i)`, [T`le morceau sans $g$ est inclus dans $A_i \cup (A_j \setminus \{g\})$ : monotonie et additivité`]],
           [null, T`C’est vrai pour toute coupe, donc $\mu_i^2(A_i \cup A_j) \le 2\, v_i(A_i)$.`]],
    hyp: [T`additivité`, T`monotonie`],
    arrivee: { q: T`Pour tous agents $i, j$ :`, f: T`v_i(A_i) \ge \tfrac12\, \mu_i^2(A_i \cup A_j)` },
    preuve: T`Paire $i, j$, et $g$ le bien que EF1 retire à $A_j$. Dans toute coupe $(P, Q)$ de $A_i \cup A_j$, un morceau contient $g$ ; l’autre vaut au plus $v_i(A_i) + v_i(A_j \setminus \{g\}) \le 2\, v_i(A_i)$. Donc $\mu_i^2(A_i \cup A_j) \le 2\, v_i(A_i)$.`,
    exemple: "Facteur serré ([Amanatidis, Birmpas et Markakis, 2018](abm18), Prop. 3.8)." },
  "EF1≈MMS": { alpha: "1/n", alphaTex: T`\tfrac1n`,
    pont: [[T`v_i(R) \just{1}{\le} n \cdot v_i(A_i), \qquad R = A_i \cup \bigcup_{j \ne i} (A_j \setminus \{g_j\})`, [T`EF1 pour chaque autre agent $j$, en retirant le bien $g_j$ ; additivité`]],
           [T`\mu_i = \mu_i^n(M) \just{2}{\le} \mu_i^1(R) = v_i(R)`, [T`retirer un bien et un agent ne fait pas baisser la part maximin (on supprime le paquet qui contenait le bien), appliqué $n - 1$ fois`]]],
    hyp: [T`additivité`, T`monotonie`],
    arrivee: { q: T`Pour tout agent $i$ :`, f: T`v_i(A_i) \ge \tfrac1n\, \mu_i` },
    preuve: T`Retirer à chaque autre agent $j$ le bien $g_j$ donné par EF1 : il reste $R = A_i \cup \bigcup_j (A_j \setminus \{g_j\})$, et $v_i(R) \le n \cdot v_i(A_i)$. Lemme : retirer un bien et un agent ne fait pas baisser la part maximin (on supprime le paquet qui contenait le bien). En l’appliquant $n - 1$ fois, $\mu_i \le \mu_i^1(R) = v_i(R) \le n \cdot v_i(A_i)$.`,
    exemple: "Facteur serré (Prop. 3.6). La garantie s’effondre quand n grandit." },
  "EFX≈PMMS": { alpha: "2/3", alphaTex: T`\tfrac23`,
    pont: [[null, T`Par l’absurde : notons $\mu = \mu_i^2(A_i \cup A_j)$ et supposons $v_i(A_i) < \tfrac23 \mu$.`],
           [T`v_i(A_j) \just{1}{\ge} 2\mu - v_i(A_i) \just{2}{>} \tfrac43\, \mu`, [T`les deux morceaux de la meilleure coupe valent au moins $\mu$, donc $2\mu \le v_i(A_i) + v_i(A_j)$ (additivité)`, T`hypothèse de l’absurde`]],
           [T`v_i(g) \just{3}{\ge} v_i(A_j) - v_i(A_i) \just{4}{>} \tfrac23\, \mu \qquad (g \in A_j)`, [T`EFX et additivité`, T`(2) et l’hypothèse de l’absurde`]],
           [null, T`Si $|A_j| \ge 2$, retirer un bien laisse un autre bien qui vaut plus que $v_i(A_i)$ : contradiction avec EFX. Si $A_j = \{g\}$, le morceau sans $g$ est inclus dans $A_i$, donc $\mu \le v_i(A_i)$ : contradiction.`]],
    hyp: [T`additivité`],
    arrivee: { q: T`Pour tous agents $i, j$ :`, f: T`v_i(A_i) \ge \tfrac23\, \mu_i^2(A_i \cup A_j)` },
    preuve: T`Paire $i, j$, $\mu = \mu_i^2(A_i \cup A_j)$, et supposons $v_i(A_i) < 2\mu/3$. Comme $2\mu \le v_i(A_i) + v_i(A_j)$, on a $v_i(A_j) > 4\mu/3$ ; par EFX, chaque bien $g$ de $A_j$ vaut $v_i(g) \ge v_i(A_j) - v_i(A_i) > 2\mu/3$. Si $|A_j| \ge 2$, retirer un bien laisse un autre bien $> 2\mu/3 > v_i(A_i)$ : contradiction avec EFX. Si $A_j = \{g\}$, le morceau sans $g$ est inclus dans $A_i$, donc $\mu \le v_i(A_i)$ : contradiction.`,
    exemple: "Facteur serré (Prop. 3.7)." },
  "EFX≈MMS": { alpha: "4/7", alphaTex: T`\tfrac47`,
    pont: [[null, T`Résultat de [Amanatidis, Birmpas et Markakis (2018)](abm18), Prop. 3.3 et 3.4. La preuve étudie la structure des « gros » biens et est nettement plus longue.`]],
    hyp: [T`additivité`],
    arrivee: { q: T`Pour tout agent $i$ :`, f: T`v_i(A_i) \ge \tfrac47\, \mu_i \qquad \big(\tfrac23 \text{ si } n \le 3\big)` },
    preuve: T`$\tfrac23$-MMS pour $n \le 3$ (serré), $\tfrac47$-MMS pour $n \ge 4$ ([Amanatidis et al., 2018](abm18), Prop. 3.3 et 3.4). La preuve étudie la structure des « gros » biens et est nettement plus longue.`,
    exemple: T`Presque serré : on ne peut pas dépasser $\tfrac{8}{13}$ pour $n = 4$, ni environ $0{,}59$ quand $n$ grandit. Surprise de l’article : PMMS, pourtant plus fort qu’EFX, ne garantit pas mieux en MMS.` },
  "EFL≈GMMS": { alpha: "1/2", alphaTex: T`\tfrac12`,
    pont: [[null, T`Résultat de [Barman, Biswas, Krishnamurthy et Narahari (2018)](gmms18), qui introduisent EFL pour cela. L’argument ressemble à EF1 ⇒ ½-PMMS, appliqué dans chaque groupe d’agents.`]],
    hyp: [T`additivité`],
    arrivee: { q: T`Pour tout groupe d’agents $T \subseteq N$ et tout agent $i \in T$ :`, f: T`v_i(A_i) \ge \tfrac12\, \mu_i^{|T|}\Big(\bigcup_{j \in T} A_j\Big)` },
    preuve: T`Résultat de [Barman, Biswas, Krishnamurthy et Narahari (2018)](gmms18), qui introduisent EFL pour cela ; l’argument ressemble à EF1 ⇒ $\tfrac12$-PMMS, appliqué à chaque groupe d’agents.`,
    exemple: T`Comme une allocation EFL existe toujours et se calcule en temps polynomial, on obtient $\tfrac12$-GMMS gratuitement. Le meilleur facteur d’existence connu pour GMMS est $\tfrac47$.` },
  "MNW≈MMS": { alpha: "≈1/√n", alphaTex: T`\tfrac{1}{\sqrt n}`,
    pont: [[null, T`Théorème 4.1 de [Caragiannis et al. (2019)](mnw19). Le facteur est de l’ordre de $1/\sqrt n$.`]],
    hyp: [T`additivité`],
    arrivee: { q: T`Pour tout agent $i$ :`, f: T`v_i(A_i) \ge \frac{2}{1 + \sqrt{4n - 3}}\, \mu_i` },
    preuve: T`Théorème 4.1 de [Caragiannis et al. (2019)](mnw19) : toute allocation MNW est $\dfrac{2}{1 + \sqrt{4n - 3}}$-MMS, un facteur de l’ordre de $1/\sqrt n$.`,
    exemple: T`Facteur serré. Pour $n = 2$ il vaut $\varphi - 1 \approx 0{,}618$, ce qui donne la flèche MNW ⇒ $0{,}618$-PMMS.` },
  "MNW≈PMMS": { alpha: "0,618", alphaTex: T`0{,}618`,
    pont: [[null, T`Restriction : si $A$ maximise le produit, la sous-allocation $(A_i, A_j)$ maximise aussi le produit sur le petit problème « deux agents, biens $A_i \cup A_j$ » (sinon, la remplacer augmenterait le produit global).`], [T`\frac{2}{1 + \sqrt{4n - 3}} \;\xrightarrow{\;n = 2\;}\; \frac{2}{1 + \sqrt5} = \varphi - 1 \approx 0{,}618`, T`On applique à ce problème à deux agents la garantie MNW ⇒ MMS ([Caragiannis et al.](mnw19), Th. 4.1).`]],
    hyp: [T`additivité`],
    arrivee: { q: T`Pour tous agents $i, j$ :`, f: T`v_i(A_i) \ge 0{,}618\, \mu_i^2(A_i \cup A_j)` },
    preuve: T`1. Restriction : si $A$ maximise le produit, alors pour toute paire $i, j$, la sous-allocation $(A_i, A_j)$ maximise aussi le produit sur le petit problème « deux agents, biens $A_i \cup A_j$ » (sinon, la remplacer augmenterait le produit global). 2. Pour $n$ agents, une allocation MNW est $\frac{2}{1 + \sqrt{4n - 3}}$-MMS ([Caragiannis et al.](mnw19), Th. 4.1). 3. Avec $n = 2$ : $\frac{2}{1 + \sqrt5} = \frac{\sqrt5 - 1}{2} = \varphi - 1 \approx 0{,}618$. Donc $v_i(A_i) \ge 0{,}618 \cdot \mu_i^2(A_i \cup A_j)$ : c’est $0{,}618$-PMMS (Corollaire 4.7).`,
    exemple: T`Le facteur est serré : pour tout $\varepsilon > 0$, certaines instances n’ont aucune allocation MNW $(0{,}618 + \varepsilon)$-PMMS. Et la garantie ne descend pas jusqu’à EFX : MNW ne donne aucune approximation constante d’EFX ([Amanatidis et al., IJCAI 2020](efxstories20)). Le $0{,}618$-EFX connu vient d’un autre algorithme (élimination des cycles d’envie, [Amanatidis, Markakis et Ntokos, 2020](birds20)).` },

  /* Aucune approximation possible */
  "EF1⊘EFX": {
    question: T`Quel retrait chez Bob efface l’envie d’Alice ? Et si l’on retire l’autre bien ? Que se passe-t-il quand $\varepsilon \to 0$ ?`,
    valuations: { biens: T`a b c`, agents: { "Alice": T`1 \varepsilon \varepsilon`, "Bob": T`1 \varepsilon \varepsilon` } },
    allocation: { "Alice": T`b`, "Bob": T`a c` },
    preuve: T`Biens identiques $(1, \varepsilon, \varepsilon)$. Alice $\{\varepsilon\}$, Bob $\{1, \varepsilon\}$. EF1 : retirer 1 laisse $\varepsilon \le \varepsilon$. Mais retirer $\varepsilon$ laisse 1, et $\varepsilon \ge \alpha \cdot 1$ est faux dès que $\varepsilon < \alpha$. Comme $\varepsilon$ est aussi petit qu’on veut, aucun $\alpha > 0$ ne marche.`,
    exemple: "[Amanatidis et al., 2018](abm18), Prop. 3.1." },
  "MNW⊘EFX": {
    preuve: T`Il existe des instances où l’allocation MNW n’est que $\tfrac1w$-EFX, avec $w$ aussi grand qu’on veut.`,
    exemple: "[Amanatidis et al., « Maximum Nash welfare and other stories about EFX », IJCAI 2020](efxstories20). MNW est en revanche EFX pour les valuations à deux valeurs." },
  "MMS⊘EF1": {
    question: T`Que vaut la part maximin de chacun avec trois agents et deux biens ? Alice envie-t-elle encore Bob après un retrait ?`,
    valuations: { biens: T`a b`, agents: { "Alice": T`1 1`, "Bob": T`1 1`, "Chloé": T`1 1` } },
    allocation: { "Alice": T``, "Bob": T`a b`, "Chloé": T`` },
    preuve: T`Trois agents, deux biens valant 1 pour tous. Toute coupe en trois paquets en laisse un vide, donc $\mu = 0$ pour tout le monde, et n’importe quelle allocation est MMS. Donner les deux biens à Bob : Alice voit encore $1 > 0$ après un retrait, donc pas $\beta$-EF1, quel que soit $\beta$.`,
    exemple: T`[Amanatidis et al., 2018](abm18), Prop. 4.7 (vrai même pour $\alpha$-MMS).` },
  "MMS⊘PMMS": {
    question: T`Que vaut $\mu_i$ pour chacun ? Et la part maximin d’Alice pour la paire Alice–Bob ?`,
    valuations: { biens: T`a b`, agents: { "Alice": T`1 1`, "Bob": T`1 1`, "Chloé": T`1 1` } },
    allocation: { "Alice": T``, "Bob": T`a b`, "Chloé": T`` },
    preuve: T`Même instance : trois agents, deux biens valant 1, Bob a tout, et l’allocation est MMS ($\mu = 0$). Pour la paire Alice et Bob, la coupe $\{a\} \mid \{b\}$ donne $\mu^2 = 1$, alors qu’Alice a 0.`,
    exemple: "[Amanatidis et al., 2018](abm18), Prop. 4.5." },
  "MMS⊘EFX": {
    question: T`L’allocation est-elle MMS ? Alice envie-t-elle encore Bob après le retrait de n’importe quel bien ?`,
    valuations: { biens: T`a b`, agents: { "Alice": T`1 1`, "Bob": T`1 1`, "Chloé": T`1 1` } },
    allocation: { "Alice": T``, "Bob": T`a b`, "Chloé": T`` },
    preuve: T`Même instance : Bob a les deux biens et l’allocation est MMS. Alice retire l’un d’eux et voit encore 1, alors qu’elle a 0 : pas $\beta$-EFX, quel que soit $\beta > 0$.`,
    exemple: T`[Amanatidis et al., 2018](abm18), Cor. 4.9. À comparer : PMMS exact ⇒ EFX, mais $\alpha$-PMMS ⇏ $\beta$-EFX (Prop. 4.8).` },
  "USW⊘EF1": {
    question: T`Cette allocation maximise-t-elle la somme ? Bob envie-t-il encore Alice après un retrait ?`,
    valuations: { biens: T`a b`, agents: { "Alice": T`2 2`, "Bob": T`1 1` } },
    allocation: { "Alice": T`a b`, "Bob": T`` },
    preuve: T`Alice $(2, 2)$, Bob $(1, 1)$. La seule allocation de somme maximale donne tout à Alice. Bob retire un bien à Alice et voit encore 1, alors qu’il a 0 : $0 \ge \alpha \cdot 1$ est faux pour tout $\alpha > 0$.`,
    exemple: "C’est l’exemple de base du prix de l’équité : imposer EF1 fait passer la somme de 4 à 3." },
  "EGW⊘EF1": {
    question: T`Quel est le meilleur minimum possible ? Cette allocation l’atteint-elle ? Combien Alice voit-elle chez Bob après un retrait ?`,
    valuations: { biens: T`g_1 g_2 \cdots g_{m-1} g_m`, agents: { "Alice": T`1 1 \cdots 1 1`, "Bob": T`1 0 \cdots 0 0` } },
    allocation: { "Alice": T`g_m`, "Bob": T`g_1 g_2 \cdots g_{m-1}` },
    preuve: T`Alice évalue $m$ biens à 1 ; Bob évalue $g_1$ à 1 et les autres à 0. Le minimum vaut au plus 1 (Bob ne peut pas dépasser 1). Bob $\{g_1, \dots, g_{m-1}\}$, Alice $\{g_m\}$ atteint ce max-min, mais Alice voit $m - 2$ chez Bob après retrait d’un bien, contre 1 pour elle : pas $\alpha$-EF1 dès que $m > 2 + 1/\alpha$.`,
    exemple: "Le défaut vient de la non-unicité : beaucoup d’allocations ont le même minimum, et EGW ne regarde pas les autres agents." },
  "EGW⊘MMS": {
    question: T`Cette allocation atteint-elle le max-min ? Que vaut la part maximin d’Alice avec deux agents ?`,
    valuations: { biens: T`g_1 g_2 \cdots g_{m-1} g_m`, agents: { "Alice": T`1 1 \cdots 1 1`, "Bob": T`1 0 \cdots 0 0` } },
    allocation: { "Alice": T`g_m`, "Bob": T`g_1 g_2 \cdots g_{m-1}` },
    preuve: T`Même exemple : avec 2 agents, la part maximin d’Alice vaut $\lfloor m/2 \rfloor$, mais l’allocation max-min ci-dessus ne lui donne que 1 : pas $\alpha$-MMS dès que $\lfloor m/2 \rfloor > 1/\alpha$.`,
    exemple: "Maximiser le minimum protège le plus mal loti au sens des valeurs brutes, pas chacun par rapport à sa propre part." },
};


// La carte des biens, rassemblée en un seul objet. Le moteur (parties B à F) affiche
// n'importe quel objet de cette forme ; la carte des corvées (partie A bis) a la même.
const CARTE_BIENS = {
  titre: "Carte de l'équité",
  sousTitre: "(biens indivisibles, valuations additives)",
  legendeApprox: "‐ ‐ ➝ vert : implication approchée A ⇒ α-B",
  depart: "EF1",                       // carte ouverte au chargement
  notions: NOTIONS_BIENS, implications: IMPLICATIONS_BIENS, jumelles: JUMELLES_BIENS,
  courbes: COURBES_BIENS, liens: LIENS_BIENS,
  definitions: T`
    <dl class="defs">
      <dt>Agents, biens</dt>
      <dd>$N = \{1, \dots, n\}$ les agents, $M$ les biens, $m = |M|$ ; chaque $v_i$ est additive : $v_i(S) = \sum_{g \in S} v_i(g)$</dd>
      <dt>Partitions</dt>
      <dd>$\mathcal{A}_k(S) = \{ (B_1, \dots, B_k) : B_1 \sqcup \dots \sqcup B_k = S \}$</dd>
      <dt>Allocations</dt>
      <dd>$\mathcal{A}_n(M)$ : chaque agent reçoit un paquet et tous les biens sont distribués ; il y en a $|\mathcal{A}_n(M)| = n^m$. On note $\overline{A_i} = M \setminus A_i$</dd>
      <dt>Part maximin</dt>
      <dd>$\mu_i^k(S) = \max_{B \in \mathcal{A}_k(S)}\ \min_\ell\ v_i(B_\ell)$, et $\mu_i = \mu_i^n(M)$</dd>
    </dl>
    <p class="source">D’après le survey d’[Amanatidis et al. (2023)](survey) et les travaux suivants.</p>`,
};

/* ================================================================
   A bis. DONNÉES — CARTE DES CORVÉES
   ----------------------------------------------------------------
   Même format que la carte des biens. Ici chaque agent a un coût
   c_i ≥ 0 et veut en porter le moins possible : les inégalités
   s'inversent, et « à une corvée près » retire une corvée de son
   PROPRE panier (règle d'or).
   ================================================================ */

// Allocations fractionnaires, version coûts
const ALLOCS_FRAC_COUTS = T`\mathcal{F} = \{ x \in [0,1]^{N \times M} : \forall g,\ \textstyle\sum_i x_{i,g} = 1 \}, \qquad c_i(x_i) = \textstyle\sum_g x_{i,g}\, c_i(g)`;

const NOTIONS_CORVEES = {
  /* ---------- Famille Envie ---------- */
  EF: { x: 470, y: 150, fam: "envie", ex: "no", jumelle: "EQ",
    src: T`adaptée de [Survey, Déf. 1](survey)`,
    en: "Envy-freeness", fr: "Sans envie",
    def: "Personne ne préfère échanger sa charge de travail contre celle d’un autre.",
    q: T`Pour tous agents $i, j$ :`,
    f: T`c_i(A_i) \le c_i(A_j)`,
    note: "Une seule corvée pour deux agents suffit à l’empêcher : celui qui l’a envie celui qui n’a rien. Avec des corvées, on envie celui qui a le moins de travail." },

  EFX: { x: 470, y: 280, fam: "envie", ex: "no", jumelle: "EQX",
    src: T`[Survey, Déf. 21](survey)`,
    en: "Envy-free up to any chore", fr: "Sans envie à n’importe quelle corvée près",
    def: "L’envie disparaît quelle que soit la corvée que je retire de <b>mon</b> panier, même la plus légère.",
    q: T`Pour tous agents $i, j$ et toute corvée $g \in A_i$ :`,
    f: T`c_i(A_i \setminus \{g\}) \le c_i(A_j)`,
    note: T`Avec des coûts nuls, on distingue EFX ($g$ de coût $> 0$) et $\mathrm{EFX}_0$ (toute $g$). Pas toujours, même en additif : [He et Tao (2026, prépublication)](hetao26) construisent pour tout $n \ge 4$ une instance sans allocation EFX, avec seulement trois valeurs de coût (exemple : 4 agents, 13 corvées, coûts dans $\{1, 7, 20\}$). Pour des coûts monotones (superadditifs), la non-existence était connue dès 3 agents ([Christoforidis et Santorinaios, IJCAI 2024](cs24)). Ouvert : 3 agents en additif. Approximations : 2-EFX pour 3 agents, et un facteur constant en général.` },

  EF1: { x: 470, y: 500, fam: "envie", ex: "yes", jumelle: "EQ1",
    src: T`[Survey, Déf. 21](survey)`,
    en: "Envy-free up to one chore", fr: "Sans envie à une corvée près",
    def: "Si j’envie quelqu’un, me retirer une corvée bien choisie suffit à effacer mon envie.",
    q: T`Pour tous agents $i, j$ avec $A_i \neq \varnothing$, il existe une corvée $g \in A_i$ telle que :`,
    f: T`c_i(A_i \setminus \{g\}) \le c_i(A_j)`,
    note: T`Le tourniquet marche encore : à son tour, chacun prend la corvée restante qui lui coûte le moins. Retourner les signes de la définition des biens (retirer chez l’autre) ne marche pas. EF1 + PO existe toujours en additif : grand problème ouvert résolu par [Mahara (prépublication, 2025)](mahara25), après les cas particuliers (3 agents, coûts bivalués).` },

  /* ---------- Famille Part garantie ---------- */
  PROP: { x: 930, y: 200, fam: "part", ex: "no",
    src: T`adaptée de [Survey, Déf. 2](survey)`,
    en: "Proportionality", fr: "Proportionnalité",
    def: T`Chacun porte au plus $1/n$ du travail total, mesuré avec ses propres coûts.`,
    q: T`Pour tout agent $i$ :`,
    f: T`c_i(A_i) \le \frac{c_i(M)}{n}`,
    note: "Le sens de l’inégalité s’inverse par rapport aux biens. Échoue avec une seule corvée pour deux agents." },

  PROPX: { x: 930, y: 330, fam: "part", ex: "yes",
    src: T`[Survey, § 8.9](survey)`,
    en: "Proportionality up to any chore", fr: "Proportionnalité à n’importe quelle corvée près",
    def: "Retirer n’importe laquelle de mes corvées me ferait passer sous ma juste part.",
    q: T`Pour tout agent $i$ et toute corvée $g \in A_i$ :`,
    f: T`c_i(A_i \setminus \{g\}) \le \frac{c_i(M)}{n}`,
    note: T`Différence frappante avec les biens : PROPX existe toujours pour des corvées ([Li, Li et Wu, 2022](liliwu22)), alors qu’il peut échouer pour des biens. PROPm devient donc inutile ici.` },

  PROP1: { x: 930, y: 560, fam: "part", ex: "yes",
    src: T`adaptée de [Survey, Déf. 12](survey)`,
    en: "Proportionality up to one chore", fr: "Proportionnalité à une corvée près",
    def: "Il suffit de me retirer une corvée bien choisie pour que je sois sous ma juste part.",
    q: T`Pour tout agent $i$ avec $A_i \neq \varnothing$, il existe une corvée $g \in A_i$ telle que :`,
    f: T`c_i(A_i \setminus \{g\}) \le \frac{c_i(M)}{n}`,
    note: "" },

  MMS: { x: 760, y: 450, fam: "part", ex: "no",
    src: T`[Survey, § 8.9](survey)`,
    en: "Maximin share (chores)", fr: "Part maximin (corvées)",
    def: T`Chacun porte au plus ce qu’il subirait en découpant lui-même $n$ paquets et en recevant le plus lourd.`,
    q: T`Pour tout agent $i$ :`,
    f: T`c_i(A_i) \le \mu_i`,
    ou: [T`\mu_i = \min_{B \in \mathcal{A}_n(M)}\ \max_k\ c_i(B_k)`],
    note: T`Le max et le min s’échangent : je coupe pour que le pire paquet (le plus lourd) soit le plus léger possible. Non-existence : [Aziz et al., 2017](aziz17) ; contre-exemple de [Feige, Sapir et Tauber, 2021](fst21). Meilleure garantie connue : $\tfrac{13}{11}$-MMS ([Huang et Segal-Halevi, 2023](hsh23)). Ici $\alpha \ge 1$ : on accepte un coût jusqu’à $\alpha \cdot \mu_i$.` },

  /* ---------- Famille Égalité ---------- */
  EQ: { x: 100, y: 150, fam: "egal", ex: "no", jumelle: "EF",
    src: T`[Freeman et al. 2020](fsvx20)`,
    en: "Equitability", fr: "Équitabilité",
    def: "Tout le monde subit le même coût, chacun mesuré avec ses propres coûts.",
    q: T`Pour tous agents $i, j$ :`,
    f: T`c_i(A_i) = c_j(A_j)`,
    note: T`Compare des coûts entre agents : il faut des coûts normalisés (par exemple $c_i(M) = 1$).` },

  EQX: { x: 100, y: 280, fam: "egal", ex: "yes", jumelle: "EFX",
    src: T`[Freeman et al. 2020](fsvx20)`,
    en: "Equitability up to any chore", fr: "Équitabilité à n’importe quelle corvée près",
    def: "L’écart de coût disparaît quelle que soit la corvée retirée au plus chargé.",
    q: T`Pour tous agents $i, j$ et toute corvée $g \in A_i$ :`,
    f: T`c_i(A_i \setminus \{g\}) \le c_j(A_j)`,
    note: T`Se calcule en temps polynomial ([Freeman, Sikdar, Vaish et Xia, 2020](fsvx20), Prop. 3). Mais EQX + PO peut échouer dès 2 agents et 3 corvées, et décider s’il existe est fortement NP-difficile (leur Th. 1).` },

  EQ1: { x: 100, y: 500, fam: "egal", ex: "yes", jumelle: "EF1",
    src: T`[Freeman et al. 2020](fsvx20)`,
    en: "Equitability up to one chore", fr: "Équitabilité à une corvée près",
    def: "Retirer une corvée bien choisie au plus chargé suffit à effacer l’écart de coût.",
    q: T`Pour tous agents $i, j$ avec $A_i \neq \varnothing$, il existe une corvée $g \in A_i$ telle que :`,
    f: T`c_i(A_i \setminus \{g\}) \le c_j(A_j)`,
    note: T`EQ1 + PO existe aussi, avec un algorithme pseudo-polynomial ([Freeman et al., 2020](fsvx20), Th. 2). Inversion par rapport aux biens, où EQ1 + PO peut échouer quand des valeurs sont nulles. Différence avec EF1 : à droite, c’est $c_j$, le coût vu par $j$.` },

  /* ---------- Famille Efficacité et bien-être ---------- */
  PO: { x: 300, y: 600, fam: "eff", ex: "yes",
    src: T`adaptée de [Survey, Déf. 6](survey)`,
    en: "Pareto optimality", fr: "Optimalité de Pareto",
    def: "Impossible d’alléger quelqu’un sans alourdir quelqu’un d’autre.",
    q: T`Il n’existe pas d’allocation $B \in \mathcal{A}_n(M)$ telle que :`,
    f: T`\begin{aligned} &\forall i,\ c_i(B_i) \le c_i(A_i) \\ \text{et } &\exists i,\ c_i(B_i) < c_i(A_i) \end{aligned}`,
    note: "Si tous les agents ont les mêmes coûts, la somme est constante et toutes les allocations sont PO." },

  fPO: { x: 140, y: 600, fam: "eff", ex: "yes",
    src: T`adaptée de [Survey, § 7.1](survey)`,
    en: "Fractional Pareto optimality", fr: "Optimalité de Pareto fractionnaire",
    def: "PO même face aux allocations où l’on coupe les corvées en morceaux.",
    q: T`Il n’existe pas d’allocation fractionnaire $x \in \mathcal{F}$ telle que :`,
    f: T`\begin{aligned} &\forall i,\ c_i(x_i) \le c_i(A_i) \\ \text{et } &\exists i,\ c_i(x_i) < c_i(A_i) \end{aligned}`,
    ou: [ALLOCS_FRAC_COUTS],
    note: T`Se vérifie par programmation linéaire. L’article de [Mahara (2025)](mahara25) sur EF1 + PO traite aussi EF1 + fPO : à lire pour le résultat exact.` },

  USW: { x: 620, y: 610, fam: "eff", ex: "yes",
    src: T`définition usuelle`,
    en: "Minimum total cost", fr: "Coût total minimal (utilitariste)",
    def: "Choisir l’allocation qui minimise la somme des coûts.",
    q: "",
    f: T`A \in \operatorname*{arg\,min}_{B \in \mathcal{A}_n(M)}\ \sum_i c_i(B_i)`,
    note: T`Chaque corvée va à l’agent pour qui elle coûte le moins (temps polynomial). Le bien-être de Nash (MNW) n’a pas d’analogue naturel pour les corvées : minimiser le produit des coûts ne donne pas EF1.` },

  EGW: { x: 190, y: 430, fam: "eff", ex: "yes",
    src: T`adaptée de [Survey, § 7.2](survey)`,
    en: "Egalitarian (min-max cost)", fr: "Bien-être égalitariste (min-max)",
    def: "Choisir l’allocation qui minimise le coût du plus chargé.",
    q: "",
    f: T`A \in \operatorname*{arg\,min}_{B \in \mathcal{A}_n(M)}\ \max_i c_i(B_i)`,
    note: T`C’est exactement l’ordonnancement sur machines non liées en minimisant le makespan ($R \,\|\, C_{\max}$) : NP-difficile, 2-approximable ([Lenstra, Shmoys et Tardos, 1990](lst90)). C’est aussi le critère « K-fair » de Hermelin et al. Un minimiseur n’est que faiblement PO ; le leximin le raffine.` },

  Leximin: { x: 300, y: 360, fam: "eff", ex: "yes",
    src: T`adaptée de [Survey, § 4.1](survey)`,
    en: "Leximin (chores)", fr: "Égalitariste, version leximin",
    def: "Minimiser le coût du plus chargé, puis celui du deuxième plus chargé, et ainsi de suite.",
    q: "",
    f: T`A \in \operatorname*{arg\,min}_{B \in \mathcal{A}_n(M)}^{\text{lex}}\ \big( c_{(1)}(B), \dots, c_{(n)}(B) \big)`,
    ou: [T`c_{(1)}(B) \ge c_{(2)}(B) \ge \dots \ge c_{(n)}(B)`],
    note: T`Pour des corvées, le leximin ne garantit même pas EQ1 ([Freeman et al., 2020](fsvx20), Ex. 2), et le calculer est NP-difficile.` },
};

const IMPLICATIONS_CORVEES = [
  ["EF", "PROP"], ["EF", "EFX"], ["EFX", "EF1"], ["EFX", "PROPX"], ["EF1", "PROP1"],
  ["PROP", "PROPX"], ["PROPX", "PROP1"], ["PROP", "MMS"],
  ["EQ", "EQX"], ["EQX", "EQ1"],
  ["fPO", "PO"], ["USW", "PO"], ["Leximin", "PO"], ["Leximin", "EGW"],
];

const JUMELLES_CORVEES = [["EQ", "EF"], ["EQX", "EFX"], ["EQ1", "EF1"]];

const COURBES_CORVEES = [
  ["≈", "PROP1", "MMS", -40],
  ["⊘", "EF1", "EFX", 35, 0.8],
  ["⊘", "USW", "EF1", 45],
  ["⊘", "EGW", "EF1", -60],
  ["⊘", "MMS", "EF1", 50],
];

// Instances réutilisées dans plusieurs exemples
const UNE_CORVEE_ALICE = { valuations: { biens: "g", agents: { Alice: "1", Bob: "1" } }, allocation: { Alice: "g", Bob: "" } };
const GROSSE_ET_PETITES = {
  valuations: { biens: T`h p_1 \cdots p_9`, agents: { Alice: T`10 1 \cdots 1`, Bob: T`10 1 \cdots 1`, Chloé: T`10 1 \cdots 1` } },
  allocation: { Alice: "", Bob: T`p_1 \cdots p_9`, Chloé: "h" },
};
const QUATRE_CORVEES_TROIS_AGENTS = {
  valuations: { biens: "a b c d", agents: { Alice: "1 1 1 1", Bob: T`\cdot \cdot 0 0` } },
  allocation: { Alice: "a b", Bob: "c d", Chloé: "" },
};

const LIENS_CORVEES = {
  "EF>PROP": {
    pont: [[T`n \cdot c_i(A_i) \just{EF}{\le} \sum_{j \in N} c_i(A_j) \just{+}{=} c_i(M)`, []],
           [null, T`On divise par $n$.`]],
    hyp: [T`additivité`],
    valuations: { biens: "a b c", agents: { Alice: "2 2 2", Bob: "3 0 0" } },
    allocation: { Alice: "a", Bob: "b c", Chloé: "" },
    question: T`Vérifie que chacun porte au plus le tiers de son coût total, puis compare la charge d’Alice avec celle de Chloé.`,
    preuve: T`Sommer $c_i(A_i) \le c_i(A_j)$ sur tous les $j$ : $n \cdot c_i(A_i) \le \sum_j c_i(A_j) = c_i(M)$.`,
    exemple: T`Alice porte $2 = 6/3$, Bob 0 : PROP (les coûts de Chloé n’importent pas, elle ne porte rien). Mais Alice envie Chloé ($2 > 0$).` },
  "EF>EFX": { ...UNE_CORVEE_ALICE,
    pont: [[T`c_i(A_i \setminus \{g\}) \just{m}{\le} c_i(A_i) \just{EF}{\le} c_i(A_j)`, []]],
    hyp: [T`monotonie`],
    question: "Alice envie-t-elle Bob ? Et si elle retire son unique corvée ?",
    preuve: T`Retirer une corvée de son panier ne peut que l’alléger : $c_i(A_i \setminus \{g\}) \le c_i(A_i) \le c_i(A_j)$.`,
    exemple: T`Alice retire sa corvée : $0 \le 0$, donc EFX ; mais elle envie Bob ($1 > 0$).` },
  "EFX>EF1": {
    pont: [[null, T`« Pour toute corvée de $A_i$ » implique « pour une corvée de $A_i$ », dès que $A_i \ne \varnothing$.`]],
    hyp: [],
    valuations: { biens: "a b c", agents: { Alice: "2 1 1", Bob: "2 1 1" } },
    allocation: { Alice: "a b", Bob: "c" },
    question: "Quelle corvée Alice peut-elle retirer de son panier pour ne plus envier Bob ? Laquelle ne suffit pas ?",
    preuve: T`« Pour toute corvée de $A_i$ » implique « pour une corvée de $A_i$ » ($A_i$ non vide).`,
    exemple: T`Retirer $a$ laisse $1 \le 1$ (EF1), retirer $b$ laisse $2 > 1$ (pas EFX).` },
  "EFX>PROPX": { ...QUATRE_CORVEES_TROIS_AGENTS,
    pont: [[T`c_i(A_i \setminus \{g\}) \just{EFX}{\le} c_i(A_j) \ \ (j \ne i), \qquad c_i(A_i \setminus \{g\}) \just{m}{\le} c_i(A_i)`, []],
           [T`n \cdot c_i(A_i \setminus \{g\}) \just{1}{\le} \sum_{j \in N} c_i(A_j) \just{+}{=} c_i(M)`, [T`on somme les $n$ inégalités EFX et (m)`]],
           [null, T`Pour des biens, EFX n’implique pas PROPX : c’est l’inégalité (m), face à soi-même, qui fait la différence.`]],
    hyp: [T`additivité`, T`monotonie`],
    question: T`Quelle est la part proportionnelle d’Alice ? Après avoir retiré une corvée, est-elle en dessous ? Et face à Chloé ?`,
    preuve: T`Fixons $g \in A_i$. EFX donne $c_i(A_i \setminus \{g\}) \le c_i(A_j)$ pour tout $j \ne i$, et c’est trivial pour $j = i$. On somme sur les $n$ agents : $n \cdot c_i(A_i \setminus \{g\}) \le c_i(M)$. Surprise : pour des biens, EFX n’implique pas PROPX.`,
    exemple: T`Retirer une corvée laisse $1 \le 4/3$ à Alice (PROPX), mais $1 > 0$ face à Chloé (pas EFX). Bob ne porte que des corvées de coût nul, ses autres coûts n’importent pas.` },
  "EF1>PROP1": { ...QUATRE_CORVEES_TROIS_AGENTS,
    pont: [[null, T`Soit $g^*$ une corvée de $A_i$ de coût maximal pour $i$ (s’il y en a plusieurs, n’importe laquelle). Pour chaque $j \ne i$, EF1 donne une corvée $g_j \in A_i$.`],
           [T`c_i(A_i \setminus \{g^*\}) \just{1}{\le} c_i(A_i \setminus \{g_j\}) \just{EF1}{\le} c_i(A_j)`, [T`additivité : retirer la corvée la plus lourde allège au moins autant`]],
           [T`n \cdot c_i(A_i \setminus \{g^*\}) \just{2}{\le} c_i(M)`, [T`EF1 pour tous les $j$, sommé comme pour EFX ⇒ PROPX`]]],
    hyp: [T`additivité`, T`coûts ≥ 0`],
    question: T`Retire une corvée à Alice : passe-t-elle sous sa part $4/3$ ? Envie-t-elle encore Chloé ?`,
    preuve: T`Même calcul que EFX ⇒ PROPX, avec la corvée $g$ donnée par EF1 : $n \cdot c_i(A_i \setminus \{g\}) \le c_i(M)$.`,
    exemple: T`Alice est à une corvée près de $4/3$ (PROP1), mais envie Chloé même après avoir retiré une corvée ($1 > 0$).` },
  "PROP>PROPX": { ...UNE_CORVEE_ALICE,
    pont: [[T`c_i(A_i \setminus \{g\}) \just{m}{\le} c_i(A_i) \just{PROP}{\le} \frac{c_i(M)}{n}`, []]],
    hyp: [T`monotonie`],
    question: "Alice porte-t-elle au plus la moitié du travail ? Et sans sa corvée ?",
    preuve: T`Retirer une corvée ne peut que baisser le coût : $c_i(A_i \setminus \{g\}) \le c_i(A_i) \le c_i(M)/n$.`,
    exemple: T`Alice porte $1 > 1/2$ (pas PROP), mais sans sa corvée elle porte 0 (PROPX).` },
  "PROPX>PROP1": {
    pont: [[null, T`« Pour toute corvée » implique « pour une corvée », dès que $A_i \ne \varnothing$.`]],
    hyp: [],
    valuations: { biens: "a b c", agents: { Alice: "2 1 1", Bob: "2 1 1" } },
    allocation: { Alice: "a b c", Bob: "" },
    question: "La part de chacun vaut 2. Quelle corvée retirer à Alice pour y arriver ? Laquelle ne suffit pas ?",
    preuve: "« Pour toute corvée » implique « pour une corvée ».",
    exemple: T`Retirer $a$ laisse $2 \le 2$ (PROP1), retirer $b$ laisse $3 > 2$ (pas PROPX).` },
  "PROP>MMS": { ...UNE_CORVEE_ALICE,
    pont: [[T`\max_k c_i(B_k) \just{1}{\ge} \frac{c_i(M)}{n} \qquad \big(B \in \mathcal{A}_n(M)\big)`, [T`le plus lourd des $n$ paquets pèse au moins la moyenne (additivité)`]],
           [T`c_i(A_i) \just{PROP}{\le} \frac{c_i(M)}{n} \just{2}{\le} \mu_i`, [T`(1), pour la meilleure coupe`]]],
    hyp: [T`additivité`],
    question: T`Que vaut $\mu$ quand on coupe une seule corvée en deux paquets ? Compare la charge d’Alice avec $\mu$, puis avec la moitié du travail.`,
    preuve: T`Dans toute partition en $n$ paquets, le plus lourd pèse au moins la moyenne : $\mu_i \ge c_i(M)/n$. Donc $c_i(A_i) \le c_i(M)/n \le \mu_i$. Pour les biens, il fallait passer par APS ; ici le lien est direct.`,
    exemple: T`Un paquet contient forcément la corvée, donc $\mu = 1$. Alice porte $1 \le \mu$ (MMS), mais $1 > 1/2$ (pas PROP).` },
  "EQ>EQX": { ...UNE_CORVEE_ALICE,
    pont: [[T`c_i(A_i \setminus \{g\}) \just{m}{\le} c_i(A_i) \just{EQ}{=} c_j(A_j)`, []]],
    hyp: [T`monotonie`],
    question: "Alice et Bob portent-ils le même coût ? Et si Alice retire sa corvée ?",
    preuve: T`Retirer une corvée ne peut que baisser $c_i(A_i)$.`,
    exemple: T`$1 \ne 0$, donc pas EQ ; sans sa corvée, $0 \le 0$, donc EQX.` },
  "EQX>EQ1": {
    pont: [[null, T`« Pour toute corvée » implique « pour une corvée », dès que $A_i \ne \varnothing$.`]],
    hyp: [],
    valuations: { biens: "a b c", agents: { Alice: "2 1 1", Bob: "2 1 1" } },
    allocation: { Alice: "a b", Bob: "c" },
    question: "Quelles corvées Alice peut-elle retirer pour ne pas porter plus que Bob ?",
    preuve: "« Pour toute corvée » implique « pour une corvée ».",
    exemple: T`Retirer $a$ laisse $1 \le 1$ (EQ1), retirer $b$ laisse $2 > 1$ (pas EQX).` },
  "fPO>PO": {
    pont: [[T`\mathcal{A}_n(M) \subseteq \mathcal{F}`, T`Une allocation entière est une allocation fractionnaire dont chaque $x_{i,g}$ vaut 0 ou 1 : si rien dans $\mathcal{F}$ ne domine $A$, rien dans $\mathcal{A}_n(M)$ non plus.`]],
    hyp: [],
    valuations: { biens: "a b", agents: { Alice: "1 3", Bob: "2 4" } },
    allocation: { Alice: "b", Bob: "a" },
    question: T`Cherche un échange de corvées entières qui allège les deux, puis un échange fractionnaire (une part de $a$ contre une part de $b$).`,
    preuve: "Une allocation entière est un cas particulier d’allocation fractionnaire.",
    exemple: T`Les coûts valent $(3, 2)$ et aucune allocation entière ne fait mieux pour les deux. Mais si Alice cède 20 % de $b$ et prend 50 % de $a$, on obtient $(2{,}9\,;\,1{,}8)$ : pas fPO.` },
  "USW>PO": {
    pont: [[T`\sum_i c_i(B_i) \just{1}{<} \sum_i c_i(A_i)`, [T`si $B$ domine $A$ : personne n’y perd et quelqu’un y gagne`]],
           [null, T`Contradiction avec USW.`]],
    hyp: [],
    valuations: { biens: "a b", agents: { Alice: "1 1", Bob: "2 2" } },
    allocation: { Alice: "a", Bob: "b" },
    question: "Peut-on alléger l’un sans alourdir l’autre ? Compare le coût total avec celui où Alice prend tout.",
    preuve: T`Si $B$ domine $A$, personne n’y perd et quelqu’un y gagne : $\sum_i c_i(B_i) < \sum_i c_i(A_i)$, donc $A$ ne minimisait pas la somme.`,
    exemple: T`Une corvée chacun coûte $(1, 2)$ : c’est PO, mais la somme vaut 3 contre 2 en donnant tout à Alice.` },
  "Leximin>PO": {
    pont: [[T`c_{(k)}(B) \le c_{(k)}(A) \quad \text{pour tout } k`, T`Si $B$ domine $A$, trier les coûts par ordre décroissant préserve l’inégalité composante par composante, stricte pour au moins un $k$ : $B$ bat $A$ dans l’ordre leximin.`]],
    hyp: [],
    valuations: { biens: "a b", agents: { Alice: "1 1", Bob: "1 1" } },
    allocation: { Alice: "a b", Bob: "" },
    question: "Peut-on alléger Alice sans alourdir Bob ? Compare le coût du plus chargé ici et avec une corvée chacun.",
    preuve: T`Si $B$ domine $A$, le vecteur trié des coûts de $B$ est $\le$ celui de $A$ composante par composante, et strictement plus petit quelque part : $B$ bat $A$ dans l’ordre leximin.`,
    exemple: T`Tout donner à Alice coûte $(2, 0)$ : c’est PO (la somme est constante), mais le plus chargé porte 2 contre 1.` },
  "Leximin>EGW": { ...GROSSE_ET_PETITES,
    pont: [[T`c_{(1)}(A) = \max_i c_i(A_i)`, T`La première composante du vecteur trié est le plus grand coût ; le leximin la minimise en premier.`]],
    hyp: [],
    question: "Quel est le meilleur coût maximal possible ? Cette allocation l’atteint-elle ? Comment mieux répartir les petites corvées ?",
    preuve: T`Le leximin compare d’abord le plus grand coût : un vecteur leximin-optimal minimise donc $\max_i c_i(A_i)$.`,
    exemple: T`Celui qui a $h$ porte au moins 10, et ici le max vaut 10 : c’est min-max. Le leximin donnerait plutôt 5 et 4 à Bob et Alice.` },
  "EQ~EF": {
    valuations: { biens: "a b", agents: { Alice: T`0{,}6 0{,}4`, Bob: T`0{,}4 0{,}6` } },
    allocation: { Alice: "a", Bob: "b" },
    question: "Compare les coûts d’Alice et de Bob (EQ), puis la charge d’Alice avec celle de Bob vue par Alice (EF).",
    preuve: "EF compare deux paniers avec les coûts d’un même agent ; EQ compare les coûts subis par deux agents. Identiques si tous ont les mêmes coûts.",
    exemple: T`$0{,}6 = 0{,}6$ (EQ), mais Alice préférerait $b$ ($0{,}4$).` },
  "EQX~EFX": {
    preuve: T`EFX retire une corvée et compare avec $c_i$, EQX retire une corvée et compare avec $c_j$.`,
    exemple: "Indépendantes en général : reprendre l’exemple EF / EQ." },
  "EQ1~EF1": {
    preuve: "Même différence qu’entre EF et EQ, au niveau « une corvée près ».",
    exemple: T`Les deux existent toujours, et pour des corvées les deux sont compatibles avec PO : EQ1 + PO ([Freeman et al., 2020](fsvx20)), EF1 + PO ([Mahara, 2025](mahara25)).` },

  /* Implication approchée */
  "PROP1≈MMS": { alpha: "2", alphaTex: "2",
    pont: [[T`c_i(A_i \setminus \{g\}) \just{PROP1}{\le} \frac{c_i(M)}{n} \just{1}{\le} \mu_i`, [T`voir PROP ⇒ MMS`]],
           [T`c_i(g) \just{2}{\le} \mu_i`, [T`$g$ est dans un paquet de la meilleure coupe, qui pèse au plus $\mu_i$`]],
           [T`c_i(A_i) \just{+}{=} c_i(A_i \setminus \{g\}) + c_i(g) \just{3}{\le} 2\, \mu_i`, [T`(1) et (2)`]]],
    hyp: [T`additivité`, T`coûts ≥ 0`],
    arrivee: { q: T`Pour tout agent $i$ :`, f: T`c_i(A_i) \le 2\, \mu_i` },
    preuve: T`PROP1 donne $g \in A_i$ avec $c_i(A_i \setminus \{g\}) \le c_i(M)/n \le \mu_i$. Et $c_i(g) \le \mu_i$ : la corvée $g$ est dans un paquet de la meilleure coupe, qui pèse au plus $\mu_i$. En additionnant : $c_i(A_i) \le 2\mu_i$. Comme EF1 ⇒ PROP1, toute allocation EF1 est aussi 2-MMS.`,
    exemple: T`Pas forcément serré. Des algorithmes dédiés font mieux : $\tfrac{13}{11}$-MMS ([Huang et Segal-Halevi, 2023](hsh23)).` },

  /* Aucune approximation possible */
  "USW⊘EF1": {
    valuations: { biens: "a b", agents: { Alice: "1 1", Bob: "2 2" } },
    allocation: { Alice: "a b", Bob: "" },
    question: "Cette allocation minimise-t-elle le coût total ? Alice envie-t-elle encore Bob après avoir retiré une corvée ?",
    preuve: T`Le coût total minimal donne tout à Alice. Elle retire une corvée et porte encore 1, alors que Bob porte 0 : $1 \le \alpha \cdot 0$ est faux pour tout $\alpha$.`,
    exemple: "Exemple de base du prix de l’équité pour les corvées." },
  "EGW⊘EF1": { ...GROSSE_ET_PETITES,
    question: "Que vaut le min-max ? Cette allocation l’atteint-elle ? Combien Bob porte-t-il encore après avoir retiré une corvée ?",
    preuve: T`Celui qui a $h$ porte au moins 10, donc le min-max vaut 10. Bob porte $9 \le 10$ : l’allocation est min-max. Bob retire une corvée et porte encore $8 > \alpha \cdot 0$ : pas $\alpha$-EF1, quel que soit $\alpha$.`,
    exemple: "Le min-max ne regarde que le plus chargé : les autres peuvent être très mal répartis. Le leximin corrige ce défaut." },
  "MMS⊘EF1": {
    valuations: { biens: "a b c d", agents: { Alice: "3 1 1 1", Bob: "3 1 1 1", Chloé: "3 1 1 1" } },
    allocation: { Alice: "a", Bob: "b c d", Chloé: "" },
    question: T`Que vaut $\mu$ ? Chacun porte-t-il au plus $\mu$ ? Bob envie-t-il encore Chloé après avoir retiré une corvée ?`,
    preuve: T`La coupe $\{a\} \mid \{b, c\} \mid \{d\}$ donne $\mu = 3$. Chacun porte au plus 3 (MMS). Bob retire une corvée et porte encore $2 > \alpha \cdot 0$.`,
    exemple: "Même phénomène que pour les biens : le seuil maximin est trop lâche pour empêcher l’envie." },
  "EF1⊘EFX": {
    valuations: { biens: "a b c", agents: { Alice: T`1 \varepsilon \varepsilon`, Bob: T`1 \varepsilon \varepsilon` } },
    allocation: { Alice: "a b", Bob: "c" },
    question: T`Quelle corvée Alice doit-elle retirer pour ne plus envier Bob ? Et si elle retire l’autre ? Que se passe-t-il quand $\varepsilon \to 0$ ?`,
    preuve: T`EF1 : retirer $a$ laisse $\varepsilon \le \varepsilon$. Mais retirer $b$ laisse 1, et $1 \le \alpha \cdot \varepsilon$ est faux dès que $\varepsilon < 1/\alpha$.`,
    exemple: T`Comme $\varepsilon$ est aussi petit qu’on veut, aucun $\alpha$ ne marche.` },
};

const CARTE_CORVEES = {
  titre: "Carte des corvées",
  familles: { egal: "Égalité des coûts" },   // noms de famille propres à cette carte
  sousTitre: "(corvées indivisibles, coûts additifs)",
  legendeApprox: "‐ ‐ ➝ vert : A ⇒ α-B, coût ≤ α × seuil (α ≥ 1)",
  depart: "EF1",
  notions: NOTIONS_CORVEES, implications: IMPLICATIONS_CORVEES, jumelles: JUMELLES_CORVEES,
  courbes: COURBES_CORVEES, liens: LIENS_CORVEES,
  definitions: T`
    <p class="regle-or"><b>Règle d’or.</b> « À une corvée près » retire une corvée de son <b>propre</b> panier, jamais de celui de l’autre.</p>
    <dl class="defs">
      <dt>Agents, corvées</dt>
      <dd>$N = \{1, \dots, n\}$ les agents, $M$ les corvées, $m = |M|$ ; chaque $c_i \ge 0$ est additive, et chacun veut en porter le moins possible</dd>
      <dt>Partitions</dt>
      <dd>$\mathcal{A}_k(S) = \{ (B_1, \dots, B_k) : B_1 \sqcup \dots \sqcup B_k = S \}$</dd>
      <dt>Allocations</dt>
      <dd>$\mathcal{A}_n(M)$ : chaque agent reçoit un paquet et toutes les corvées sont distribuées ; il y en a $|\mathcal{A}_n(M)| = n^m$</dd>
      <dt>Part maximin</dt>
      <dd>$\mu_i^k(S) = \min_{B \in \mathcal{A}_k(S)}\ \max_\ell\ c_i(B_\ell)$, et $\mu_i = \mu_i^n(M)$</dd>
    </dl>
    <p class="source">Absents par rapport aux biens : APS, GMMS, PMMS, PROPm (inutile, PROPX existe toujours) et MNW (pas d’analogue naturel). D’après le [survey](survey) et les travaux suivants ; statuts vérifiés le 22 octobre 2026.</p>`,
};


/* ================================================================
   A ter. DONNÉES — CARTE PONDÉRÉE (droits inégaux)
   ----------------------------------------------------------------
   Chaque agent a un droit s_i (Σ s_i = 1). Avec s_i = 1/n, chaque
   notion redevient celle de la carte des biens. On ne met ici que
   ce que donnent le survey (§ 8.3) et les articles cités : pas
   encore de famille Égalité, et pas d'exercice pour les deux
   implications perdues (leurs contre-exemples sont dans les articles).
   ================================================================ */

const NOTIONS_PONDEREE = {
  /* ---------- Famille Envie ---------- */
  WEF: { x: 470, y: 70, fam: "envie", ex: "no",
    src: T`[Survey, Déf. 18](survey)`,
    en: "Weighted envy-freeness", fr: "Sans envie pondérée",
    def: "Chacun compare ce qu’il a à ce qu’ont les autres, à proportion des droits de chacun.",
    q: T`Pour tous agents $i, j$ :`,
    f: T`\frac{v_i(A_i)}{s_i} \ge \frac{v_i(A_j)}{s_j}`,
    note: T`Avec $s_i = 1/n$ pour tous, on retrouve EF. Un seul bien pour deux agents suffit encore à l’empêcher.` },

  WEFX: { x: 470, y: 250, fam: "envie", ex: "no",
    src: T`[Hajiaghayi et al. 2023](hsy23)`,
    en: "Weighted EFX", fr: "Sans envie pondérée à n’importe quel bien près",
    def: "L’envie pondérée disparaît quel que soit le bien retiré au panier envié.",
    q: T`Pour tous agents $i, j$ et tout bien $g \in A_j$ :`,
    f: T`\frac{v_i(A_i)}{s_i} \ge \frac{v_i(A_j \setminus \{g\})}{s_j}`,
    note: T`Peut ne pas exister même avec 2 agents ([Hajiaghayi, Springer et Yami, 2023](hsy23)) : dans leur contre-exemple, on ne dépasse pas $0{,}786$-WEFX. Existe si les valuations sont identiques, ou pour 2 agents dont les poids sont entiers. Contraste avec les droits égaux, où EFX existe pour 2 et 3 agents.` },

  WEF1: { x: 470, y: 420, fam: "envie", ex: "yes",
    src: T`[Survey, Déf. 18](survey)`,
    en: "Weighted EF1", fr: "Sans envie pondérée à un bien près",
    def: "Si j’envie quelqu’un, compte tenu des droits, lui retirer un bien bien choisi suffit à effacer mon envie.",
    q: T`Pour tous agents $i, j$ avec $A_j \neq \varnothing$, il existe un bien $g \in A_j$ tel que :`,
    f: T`\frac{v_i(A_i)}{s_i} \ge \frac{v_i(A_j \setminus \{g\})}{s_j}`,
    note: T`Existe toujours : une séquence de choix pondérée, qui généralise le tourniquet, en donne une ([Chakraborty, Igarashi, Suksompong et Zick, 2021](wef21)). WEF1 + PO existe aussi (algorithme pseudo-polynomial). L’élimination des cycles d’envie, elle, ne se généralise pas. Dans la famille WEF(x, y) de [Chakraborty, Segal-Halevi et Suksompong (2022)](csss22), WEF1 = WEF(1, 0) ; chaque WEF(x, 1 − x) existe toujours (avec x = ½, c’est la méthode de Webster pour répartir des sièges).` },

  WWEF1: { x: 470, y: 580, fam: "envie", ex: "yes",
    src: T`[Chakraborty et al. 2021](wef21)`,
    en: "Weak weighted EF1", fr: "Sans envie pondérée faible à un bien près",
    def: T`Comme WEF1, mais on peut aussi, au lieu de retirer le bien à $j$, en donner une copie à $i$.`,
    q: T`Pour tous agents $i, j$ avec $A_j \neq \varnothing$, il existe un bien $g \in A_j$ tel que :`,
    f: T`\frac{v_i(A_i)}{s_i} \ge \frac{v_i(A_j \setminus \{g\})}{s_j} \quad \text{ou} \quad \frac{v_i(A_i \cup \{g\})}{s_i} \ge \frac{v_i(A_j)}{s_j}`,
    note: T`Version faible introduite par [Chakraborty et al. (2021)](wef21). Avec des droits égaux, les deux conditions sont équivalentes (valuations additives) et l’on retrouve EF1.` },

  /* ---------- Famille Part garantie ---------- */
  WPROP: { x: 900, y: 120, fam: "part", ex: "no",
    src: T`[CSS 2022, Déf. 3.4](csss22)`,
    en: "Weighted proportionality", fr: "Proportionnalité pondérée",
    def: T`Chacun reçoit au moins la fraction $s_i$ de la valeur totale, selon ses goûts.`,
    q: T`Pour tout agent $i$ :`,
    f: T`v_i(A_i) \ge s_i \cdot v_i(M)`,
    note: T`Avec $s_i = 1/n$, on retrouve PROP. Échoue avec un seul bien pour deux agents.` },

  WPROP1: { x: 900, y: 580, fam: "part", ex: "yes",
    src: T`[Survey, § 8.3](survey)`,
    en: "Weighted PROP1", fr: "Proportionnalité pondérée à un bien près",
    def: T`Il me manque au plus un bien, pris chez un autre, pour atteindre ma part $s_i \cdot v_i(M)$.`,
    q: T`Pour tout agent $i$, il existe un bien $g \notin A_i$ tel que :`,
    f: T`v_i(A_i \cup \{g\}) \ge s_i \cdot v_i(M)`,
    note: T`WPROP1 + PO existe : [Aziz, Moulin et Sandomirskiy (2020)](aziz20) en calculent une en temps polynomial. Dans la famille WPROP(x, y) de [Chakraborty, Segal-Halevi et Suksompong (2022)](csss22), WPROP1 = WPROP(0, 1).` },

  WMMS: { x: 760, y: 420, fam: "part", ex: "no",
    src: T`[Survey, Déf. 19](survey)`,
    en: "Weighted maximin share", fr: "Part maximin pondérée",
    def: T`On juge chaque partition par son pire rapport « valeur du paquet / droit de son destinataire ». La meilleure partition donne le ratio $F_i$, et la part de $i$ vaut $F_i \cdot s_i \cdot v_i(M)$.`,
    q: T`Pour tout agent $i$ :`,
    f: T`v_i(A_i) \ge F_i \cdot s_i \cdot v_i(M)`,
    ou: [T`F_i = \max_{B \in \mathcal{A}_n(M)}\ \min_{j \in N}\ \frac{v_i(B_j)}{s_j \cdot v_i(M)}`],
    note: T`Définition de [Farhadi et al. (2019)](farhadi19). Toujours $F_i \le 1$, donc la part WMMS ne dépasse pas $s_i \cdot v_i(M)$ ; avec des droits égaux, on retrouve MMS. La meilleure garantie possible est $\tfrac1n$-WMMS, et, de façon surprenante, le simple tourniquet l’atteint. Contrairement à NMMS, la part WMMS de $i$ dépend des droits de tous les agents.` },

  NMMS: { x: 620, y: 330, fam: "part", ex: "no",
    src: T`[CSS 2022, Déf. 4.4](csss22)`,
    en: "Normalized maximin share", fr: "Part maximin normalisée",
    def: T`Ma part maximin habituelle, mise à l’échelle de mon droit : $n \cdot s_i$ fois ce que je garantirais en découpant moi-même $n$ paquets.`,
    q: T`Pour tout agent $i$ :`,
    f: T`v_i(A_i) \ge n \cdot s_i \cdot \mu_i`,
    note: T`Définie par [Chakraborty, Segal-Halevi et Suksompong (2022)](csss22). Elle ne dépend que du droit de $i$, pas de ceux des autres. Avec des droits égaux, $n \cdot s_i = 1$ et l’on retrouve MMS. On ne peut pas garantir mieux que $\tfrac1n$-NMMS (leur Th. 4.6), et WEF1 l’atteint (Th. 4.8).` },

  APS: { x: 760, y: 260, fam: "part", ex: "no",
    src: T`[Survey, § 8.3](survey)`,
    en: "Any-price share", fr: "Part à n’importe quel prix",
    def: T`Un adversaire fixe des prix positifs de somme 1 ; avec un budget égal à mon droit $s_i$, j’achète le meilleur panier abordable. $\mathrm{APS}_i$ est ce que je garantis face aux pires prix.`,
    q: T`Pour tout agent $i$ :`,
    f: T`v_i(A_i) \ge \mathrm{APS}_i`,
    ou: [T`\mathrm{APS}_i = \min_{p \in \Delta}\ \max\,\{ v_i(S) : S \subseteq M,\ p(S) \le s_i \}`,
         T`\Delta = \{ p \in \mathbb{R}_+^M : \textstyle\sum_g p_g = 1 \}, \qquad p(S) = \textstyle\sum_{g \in S} p_g`],
    note: T`Notion conçue pour les droits inégaux ([Babaioff, Ezra et Feige, 2021](aps21)) : c’est la même que sur la carte des biens, avec le budget $s_i$ à la place de $1/n$. Pas toujours atteignable, mais on sait garantir à chacun $\tfrac35$ de son APS. Le survey ne donne pas de lien direct avec WMMS : pas de flèche entre les deux.` },

  /* ---------- Famille Efficacité et bien-être ---------- */
  PO: { ...NOTIONS_BIENS.PO, x: 230, y: 600,
    note: "Ne dépend pas des droits : c’est la même notion que sur la carte des biens." },
  fPO: { ...NOTIONS_BIENS.fPO, x: 80, y: 600,
    note: "Ne dépend pas des droits : c’est la même notion que sur la carte des biens." },
  USW: { ...NOTIONS_BIENS.USW, x: 80, y: 460,
    note: "La somme ne tient pas compte des droits : chaque bien va toujours à celui qui l’aime le plus." },

  MWNW: { x: 230, y: 420, fam: "eff", ex: "yes",
    src: T`[CSS 2022, Déf. 3.11](csss22)`,
    en: "Maximum weighted Nash welfare", fr: "Bien-être de Nash pondéré maximal",
    def: "Choisir l’allocation qui maximise le produit des utilités, chacune élevée à la puissance de son droit.",
    q: "",
    f: T`A \in \operatorname*{arg\,max}_{B \in \mathcal{A}_n(M)}\ \prod_i v_i(B_i)^{s_i}`,
    note: T`Avec des droits égaux, on retrouve MNW.` },
};

const IMPLICATIONS_PONDEREE = [
  ["WEF", "WPROP"], ["WEF", "WEFX"], ["WEFX", "WEF1"], ["WEF1", "WWEF1"],
  ["WPROP", "APS"], ["WPROP", "WMMS"], ["WPROP", "WPROP1"], ["WPROP", "NMMS"],
  ["fPO", "PO"], ["USW", "PO"], ["MWNW", "PO"], ["MWNW", "WWEF1"],
];

const JUMELLES_PONDEREE = [];

// ≠ : implication vraie à droits égaux (EF1 ⇒ PROP1, MNW ⇒ EF1) mais fausse en général
const COURBES_PONDEREE = [
  ["≠", "WEF1", "WPROP1", -50],
  ["≠", "MWNW", "WEF1", -45],
  ["≠", "MWNW", "WPROP1", 110, 0.72],
  ["≈", "WEF1", "NMMS", 40],
  ["≈", "WMMS", "NMMS", 35],
  ["⊘", "NMMS", "WMMS", 35],
  ["⊘", "WEF1", "WMMS", -40],
  ["⊘", "WPROP1", "NMMS", -90],
  ["⊘", "WPROP1", "WMMS", -30],
  ["⊘", "MWNW", "NMMS", -70],
];

// Un bien, deux agents ; Bob l'a. Les droits sont donnés en dernière colonne.
const UN_BIEN_BOB_DROITS = (sA, sB) => ({
  valuations: { biens: "g", agents: { Alice: "1", Bob: "1" }, droits: { Alice: sA, Bob: sB } },
  allocation: { Alice: "", Bob: "g" },
});
const DROITS_EGAUX_2 = { Alice: T`\tfrac12`, Bob: T`\tfrac12` };

const LIENS_PONDEREE = {
  "WEF>WPROP": {
    pont: [[T`v_i(A_j) \just{WEF}{\le} \frac{s_j}{s_i}\, v_i(A_i)`, []],
           [T`v_i(M) \just{+}{=} \sum_{j \in N} v_i(A_j) \just{1}{\le} \frac{v_i(A_i)}{s_i} \sum_{j \in N} s_j \just{2}{=} \frac{v_i(A_i)}{s_i}`, [T`WEF, sommé sur tous les agents`, T`droits de somme 1`]],
           [null, T`On multiplie par $s_i$.`]],
    hyp: [T`additivité`, T`droits de somme 1`],
    valuations: { ...LIENS_BIENS["EF>PROP"].valuations, droits: { Alice: T`\tfrac13`, Bob: T`\tfrac13`, Chloé: T`\tfrac13` } },
    allocation: LIENS_BIENS["EF>PROP"].allocation,
    question: T`Vérifie que chacun a au moins le tiers de sa valeur totale, puis compare $v_{\text{Alice}}(A_{\text{Alice}})/s_{\text{Alice}}$ avec ce qu’Alice voit chez Bob, divisé par $s_{\text{Bob}}$.`,
    preuve: T`De $v_i(A_i)/s_i \ge v_i(A_j)/s_j$, on tire $s_j \cdot v_i(A_i)/s_i \ge v_i(A_j)$. On somme sur tous les $j$ : $\frac{v_i(A_i)}{s_i} \sum_j s_j \ge v_i(M)$, et comme $\sum_j s_j = 1$, on obtient $v_i(A_i) \ge s_i \cdot v_i(M)$.`,
    exemple: T`Avec des droits égaux, c’est l’exemple de la carte des biens : chacun a son tiers, mais $3 / \tfrac13 = 9 < 6 / \tfrac13 = 18$.` },
  "WEF>WEFX": { ...UN_BIEN_BOB_DROITS(T`\tfrac13`, T`\tfrac23`),
    pont: [[T`\frac{v_i(A_i)}{s_i} \just{WEF}{\ge} \frac{v_i(A_j)}{s_j} \just{m}{\ge} \frac{v_i(A_j \setminus \{g\})}{s_j}`, []]],
    hyp: [T`monotonie`],
    question: "Alice envie-t-elle Bob, compte tenu des droits ? Et si l’on retire à Bob son unique bien ?",
    preuve: T`Retirer un bien ne peut que baisser $v_i(A_j)$, donc le membre de droite.`,
    exemple: T`Retirer $g$ laisse $0 \le 0$ : WEFX. Mais $0 / \tfrac13 = 0 < 1 / \tfrac23 = 1{,}5$ : pas WEF.` },
  "WEFX>WEF1": {
    pont: [[null, T`« Pour tout bien de $A_j$ » implique « pour un bien de $A_j$ », dès que $A_j \ne \varnothing$.`]],
    hyp: [],
    valuations: { biens: "a b c", agents: { Alice: "2 1 1", Bob: "2 1 1" }, droits: DROITS_EGAUX_2 },
    allocation: { Alice: "b", Bob: "a c" },
    question: "Avec des droits égaux, quel bien retirer à Bob pour effacer l’envie d’Alice ? Lequel ne suffit pas ?",
    preuve: T`« Pour tout bien de $A_j$ » implique « pour un bien de $A_j$ ».`,
    exemple: T`Retirer $a$ laisse $1 \le 1$ (WEF1) ; retirer $c$ laisse $2 > 1$ (pas WEFX).` },
  "WEF1>WWEF1": {
    pont: [[null, T`WEF1 est la première des deux conditions de WWEF1, reliées par « ou » : qui la vérifie vérifie WWEF1.`]],
    hyp: [],
    valuations: { biens: "a b", agents: { Alice: "1 1", Bob: "1 1" }, droits: { Alice: T`0{,}1`, Bob: T`0{,}9` } },
    allocation: { Alice: "", Bob: "a b" },
    question: T`Retire un bien à Bob : Alice l’envie-t-elle encore, compte tenu des droits ? Et si l’on donne plutôt à Alice une copie d’un bien de Bob ?`,
    preuve: "WEF1 est la première des deux conditions de WWEF1 : qui la vérifie vérifie WWEF1.",
    exemple: T`Après un retrait, $1 / 0{,}9 \approx 1{,}11 > 0 / 0{,}1 = 0$ : pas WEF1. Avec une copie d’un bien, Alice a $1 / 0{,}1 = 10 \ge 2 / 0{,}9 \approx 2{,}22$ : WWEF1. Bob n’envie personne.` },
  "WPROP>WPROP1": { ...UN_BIEN_BOB_DROITS(T`\tfrac12`, T`\tfrac12`),
    pont: [[T`v_i(A_i \cup \{g\}) \just{m}{\ge} v_i(A_i) \just{WPROP}{\ge} s_i \cdot v_i(M)`, []]],
    hyp: [T`monotonie`],
    question: T`Alice a-t-elle sa part $s_{\text{Alice}} \cdot v(M)$ ? L’atteindrait-elle avec le bien de Bob ?`,
    preuve: T`Si $v_i(A_i) \ge s_i \cdot v_i(M)$, ajouter n’importe quel bien garde l’inégalité.`,
    exemple: T`Alice a $0 < \tfrac12$ : pas WPROP. Avec $g$, elle aurait $1 \ge \tfrac12$ : WPROP1.` },
  "WPROP>APS": { ...UN_BIEN_BOB_DROITS(T`\tfrac12`, T`\tfrac12`),
    pont: [[T`p^*_g = \frac{v_i(g)}{v_i(M)}, \qquad p^*(S) \le s_i \just{1}{\Longrightarrow} v_i(S) \le s_i \cdot v_i(M)`, [T`additivité : $p^*(S) = v_i(S)/v_i(M)$`]],
           [T`\mathrm{APS}_i \just{2}{\le} s_i \cdot v_i(M) \just{WPROP}{\le} v_i(A_i)`, [T`APS est un minimum sur les prix : au plus sa valeur face à $p^*$, puis (1)`]]],
    hyp: [T`additivité`, T`$v_i(M) > 0$`],
    question: T`Quel prix empêche Alice d’acheter le bien avec son budget $s_{\text{Alice}} = \tfrac12$ ? Compare avec sa part pondérée.`,
    preuve: T`$\mathrm{APS}_i$ est un minimum sur les prix ; prenons $p^*_g = v_i(g)/v_i(M)$. Un panier abordable vérifie $p^*(S) = v_i(S)/v_i(M) \le s_i$, donc $v_i(S) \le s_i \cdot v_i(M)$. D’où $\mathrm{APS}_i \le s_i \cdot v_i(M) \le v_i(A_i)$.`,
    exemple: T`Le prix 1 sur $g$ la prive de tout : $\mathrm{APS} = 0$, et Alice, qui n’a rien, est APS. Mais $0 < \tfrac12$ : pas WPROP.` },
  "WPROP>WMMS": { ...UN_BIEN_BOB_DROITS(T`\tfrac12`, T`\tfrac12`),
    pont: [[T`\min_{j \in N} \frac{v_i(B_j)}{s_j\, v_i(M)} \just{1}{\le} \frac{\sum_j v_i(B_j)}{\sum_j s_j\, v_i(M)} \just{2}{=} 1`, [T`un minimum de rapports est au plus le rapport des sommes`, T`additivité et droits de somme 1`]],
           [T`F_i \cdot s_i \cdot v_i(M) \just{3}{\le} s_i \cdot v_i(M) \just{WPROP}{\le} v_i(A_i)`, [T`$F_i \le 1$, par (1) et (2) pour toute partition $B \in \mathcal{A}_n(M)$`]]],
    hyp: [T`additivité`, T`droits de somme 1`],
    question: T`Que vaut $F_{\text{Alice}}$ quand l’un des deux paquets est forcément vide ? Compare la part WMMS d’Alice avec sa part pondérée.`,
    preuve: T`Pour toute partition $B$, $\min_j \frac{v_i(B_j)}{s_j \cdot v_i(M)} \le \frac{\sum_j v_i(B_j)}{\sum_j s_j \cdot v_i(M)} = 1$ (un minimum de rapports est au plus le rapport des sommes). Donc $F_i \le 1$, et la part WMMS vaut au plus $s_i \cdot v_i(M) \le v_i(A_i)$.`,
    exemple: T`Toute partition laisse un paquet vide, donc $F_{\text{Alice}} = 0$ : la part WMMS est nulle, et Alice la reçoit. Mais $0 < \tfrac12$ : pas WPROP.` },
  "fPO>PO": LIENS_BIENS["fPO>PO"],
  "USW>PO": LIENS_BIENS["USW>PO"],
  "MWNW>PO": {
    pont: [[T`\prod_i v_i(B_i)^{s_i} \just{1}{>} \prod_i v_i(A_i)^{s_i}`, [T`si $B$ domine $A$ : chaque facteur augmente ou reste égal, l’un augmente strictement, et les utilités de $A$ sont strictement positives`]],
           [null, T`Contradiction avec MWNW.`]],
    hyp: [T`utilités > 0`],
    valuations: { ...LIENS_BIENS["MNW>PO"].valuations, droits: DROITS_EGAUX_2 },
    allocation: LIENS_BIENS["MNW>PO"].allocation,
    question: LIENS_BIENS["MNW>PO"].question,
    preuve: T`Si $B$ domine $A$ (utilités positives), chaque facteur $v_i(B_i)^{s_i}$ est au moins $v_i(A_i)^{s_i}$, et l’un est strictement plus grand : le produit augmente.`,
    exemple: LIENS_BIENS["MNW>PO"].exemple },
  "MWNW>WWEF1": {
    pont: [[null, T`Résultat de [Chakraborty et al. (2021)](wef21), qui généralise l’argument d’échange de Caragiannis et al. (MNW ⇒ EF1). Avec des droits inégaux, l’échange ne garantit plus WEF1, seulement sa version faible.`]],
    hyp: [T`additivité`],
    valuations: { biens: "a b", agents: { Alice: "3 1", Bob: "1 3" }, droits: DROITS_EGAUX_2 },
    allocation: { Alice: "b", Bob: "a" },
    question: "Cette allocation est-elle WWEF1 ? Compare son produit pondéré avec celui de l’allocation inverse.",
    preuve: T`Résultat de [Chakraborty et al. (2021)](wef21), qui généralise le théorème de Caragiannis et al. (MNW ⇒ EF1) aux droits inégaux.`,
    exemple: T`Chacun n’a qu’un bien : le lui retirer laisse 0, donc WEF1 et a fortiori WWEF1. Mais le produit vaut $1^{1/2} \cdot 1^{1/2} = 1$, contre $3^{1/2} \cdot 3^{1/2} = 3$ pour l’allocation inverse : pas MWNW.` },

  /* Implications perdues */
  "WEF1≠WPROP1": {
    valuations: { biens: "a b c", agents: { Alice: "1 1 1", Bob: "1 1 1", Chloé: "1 1 1", David: "1 1 1" },
                  droits: { Alice: T`\tfrac12`, Bob: T`\tfrac16`, Chloé: T`\tfrac16`, David: T`\tfrac16` } },
    allocation: { Alice: "", Bob: "a", Chloé: "b", David: "c" },
    question: T`Vérifie que l’allocation est WEF1. Alice atteint-elle sa part $s_{\text{Alice}} \cdot v(M)$ avec un bien de plus ? Et si tous les droits valaient $\tfrac14$ ?`,
    preuve: T`Avec des droits égaux, EF1 ⇒ PROP1. Avec des droits inégaux, la correction « à un bien près » reste d’un bien entier, alors que les parts deviennent relatives. [Chakraborty, Segal-Halevi et Suksompong (2022)](csss22) rangent WEF1 = WEF(1, 0) et WPROP1 = WPROP(0, 1) dans deux familles paramétrées : WEF(x, y) implique WPROP(x, y) (leur Cor. 3.8), mais WEF(x, 1 − x) n’implique pas WPROP(x′, 1 − x′) dès que x′ ≠ x (Cor. 3.10).`,
    exemple: T`Chaque panier envié ne contient qu’un bien, et le retirer laisse 0 : personne n’envie personne à un bien près, donc WEF1. Mais avec un bien de plus, Alice aurait $1 < \tfrac12 \cdot 3$ : pas WPROP1. Avec des droits égaux, la même allocation serait PROP1, car $1 \ge \tfrac14 \cdot 3$.` },
  "MWNW≠WEF1": {
    preuve: T`Avec des droits égaux, MNW ⇒ EF1 (Caragiannis et al.). Avec des droits inégaux, une allocation qui maximise $\prod_i v_i(A_i)^{s_i}$ n’est pas forcément WEF1 ; elle reste PO et WWEF1 ([Chakraborty et al., 2021](wef21)).`,
    exemple: "WEF1 + PO existe quand même toujours, mais par un autre algorithme, pseudo-polynomial." },
  "MWNW≠WPROP1": {
    valuations: { biens: "a b c d", agents: { Alice: "1 1 1 1", Bob: "1 1 1 1", Chloé: "1 1 1 1", David: "1 1 1 1" },
                  droits: { Alice: T`\tfrac34`, Bob: T`\tfrac1{12}`, Chloé: T`\tfrac1{12}`, David: T`\tfrac1{12}` } },
    allocation: { Alice: "a", Bob: "b", Chloé: "c", David: "d" },
    question: T`Pourquoi une allocation MWNW donne-t-elle un bien à chacun ? Alice atteint-elle alors sa part avec un bien de plus ?`,
    preuve: T`Avec des droits égaux, MNW ⇒ EF1 ⇒ PROP1. Avec des droits inégaux, [Chakraborty, Segal-Halevi et Suksompong (2022)](csss22) (Th. 3.12) construisent, pour tout x, une instance à biens identiques où aucune allocation MWNW n’est WPROP(x, 1 − x) ; avec x = 0, c’est WPROP1.`,
    exemple: T`Si quelqu’un n’a rien, le produit $\prod_i v_i(A_i)^{s_i}$ est nul : l’allocation MWNW donne donc un bien à chacun. Avec un bien de plus, Alice aurait 2, alors que sa part vaut $\tfrac34 \cdot 4 = 3$ : pas WPROP1. C’est leur instance pour x = 0, avec 4 agents et des droits proportionnels à $(3, \tfrac13, \tfrac13, \tfrac13)$.` },

  /* Nouvelle notion : NMMS */
  "WPROP>NMMS": { ...UN_BIEN_BOB_DROITS(T`\tfrac12`, T`\tfrac12`),
    pont: [[T`\mu_i \just{1}{\le} \frac{v_i(M)}{n}`, [T`le pire des $n$ paquets vaut au plus la moyenne (additivité)`]],
           [T`n \cdot s_i \cdot \mu_i \just{2}{\le} s_i \cdot v_i(M) \just{WPROP}{\le} v_i(A_i)`, [T`(1), multiplié par $n \cdot s_i$`]]],
    hyp: [T`additivité`],
    question: T`Que vaut $\mu$ pour Alice, quand l’un des deux paquets est forcément vide ? Compare sa part NMMS avec sa part pondérée.`,
    preuve: T`La part maximin est au plus la moyenne : $\mu_i \le v_i(M)/n$, donc $n \cdot s_i \cdot \mu_i \le s_i \cdot v_i(M)$.`,
    exemple: T`$\mu = 0$, donc la part NMMS d’Alice est nulle et elle la reçoit. Mais $0 < \tfrac12$ : pas WPROP.` },
  "WEF1≈NMMS": { alpha: "1/n", alphaTex: T`\tfrac1n`,
    pont: [[null, T`Théorème 4.8 de [Chakraborty, Segal-Halevi et Suksompong (2022)](csss22) : toute allocation WEF1 est $\tfrac1n$-NMMS. La preuve passe par une version renforcée de WPROP(1, 0) (leur Lemme 4.7).`]],
    hyp: [T`additivité`],
    arrivee: { q: T`Pour tout agent $i$ :`, f: T`v_i(A_i) \ge \tfrac1n \cdot n \cdot s_i \cdot \mu_i = s_i \cdot \mu_i` },
    preuve: T`Théorème 4.8 de [Chakraborty, Segal-Halevi et Suksompong (2022)](csss22).`,
    exemple: T`Facteur serré : on ne peut pas garantir mieux que $\tfrac1n$-NMMS (Th. 4.6). Comme une allocation WEF1 existe toujours, $\tfrac1n$-NMMS aussi.` },
  "WMMS≈NMMS": { alpha: "1/n", alphaTex: T`\tfrac1n`,
    pont: [[null, T`Théorème 4.12 de [Chakraborty, Segal-Halevi et Suksompong (2022)](csss22).`]],
    hyp: [T`additivité`],
    arrivee: { q: T`Pour tout agent $i$ :`, f: T`v_i(A_i) \ge s_i \cdot \mu_i` },
    preuve: T`Théorème 4.12 de [Chakraborty, Segal-Halevi et Suksompong (2022)](csss22).`,
    exemple: "Facteur serré (Th. 4.12). Ce n’est pas une conséquence du résultat précédent, car une allocation WMMS n’existe pas toujours." },
  "NMMS⊘WMMS": {
    preuve: T`Théorème 4.13 de [Chakraborty, Segal-Halevi et Suksompong (2022)](csss22) : dès 3 agents, une allocation NMMS peut ne donner aucune fraction positive de la part WMMS.`,
    exemple: T`La part WMMS de $i$ dépend des droits de tous les agents, la part NMMS seulement du sien : avec des droits très inégaux, les deux seuils n’ont plus de commune mesure.` },
  "WEF1⊘WMMS": {
    preuve: T`WEF1 n’implique aucune approximation positive de WMMS : résultat de [Chakraborty et al.](wef21), étendu par [Chakraborty, Segal-Halevi et Suksompong (2022)](csss22) à toute la famille WEF(x, 1 − x).`,
    exemple: "Contraste : WEF1 garantit 1/n-NMMS (courbe verte). Les deux parts maximin pondérées se comportent très différemment." },
  "WPROP1⊘WMMS": {
    preuve: T`[Chakraborty, Segal-Halevi et Suksompong (2022)](csss22) : aucune WPROP(x, 1 − x) n’implique d’approximation positive de WMMS ; avec x = 0, c’est WPROP1.`,
    exemple: "Preuve dans leur annexe B.1." },
  "WPROP1⊘NMMS": {
    preuve: T`[Chakraborty, Segal-Halevi et Suksompong (2022)](csss22) : pour x < 1, WPROP(x, 1 − x) n’implique aucune approximation positive de NMMS ; avec x = 0, c’est WPROP1.`,
    exemple: "Contraste : WEF1 = WEF(1, 0) donne 1/n-NMMS. C’est l’extrémité x = 1 de la famille qui sauve la garantie." },
  "MWNW⊘NMMS": {
    preuve: T`[Chakraborty, Segal-Halevi et Suksompong (2022)](csss22) : le Nash pondéré maximal n’implique aucune approximation positive de NMMS.`,
    exemple: T`Contraste avec les droits égaux, où MNW garantit $\frac{2}{1 + \sqrt{4n - 3}}$-MMS.` },
};

const CARTE_PONDEREE = {
  titre: "Carte pondérée",
  sousTitre: "(biens indivisibles, valuations additives, droits inégaux)",
  legendeApprox: "‐ ‐ ➝ vert : implication approchée A ⇒ α-B",
  depart: "WEF1",
  notions: NOTIONS_PONDEREE, implications: IMPLICATIONS_PONDEREE, jumelles: JUMELLES_PONDEREE,
  courbes: COURBES_PONDEREE, liens: LIENS_PONDEREE,
  definitions: T`
    <p class="regle-or"><b>Idée.</b> Chacun est jugé à proportion de son droit : on compare $v_i(A_i)/s_i$ plutôt que $v_i(A_i)$. Avec $s_i = 1/n$ pour tous, chaque notion redevient celle de la carte de l’équité.</p>
    <dl class="defs">
      <dt>Agents, biens</dt>
      <dd>$N = \{1, \dots, n\}$ les agents, $M$ les biens ; chaque $v_i$ est additive : $v_i(S) = \sum_{g \in S} v_i(g)$</dd>
      <dt>Droits</dt>
      <dd>chaque agent a un droit $s_i \in \,]0, 1[$, avec $\sum_{i \in N} s_i = 1$ (par exemple une part d’héritage)</dd>
      <dt>Partitions</dt>
      <dd>$\mathcal{A}_k(S) = \{ (B_1, \dots, B_k) : B_1 \sqcup \dots \sqcup B_k = S \}$</dd>
      <dt>Allocations</dt>
      <dd>$\mathcal{A}_n(M)$ : chaque agent reçoit un paquet et tous les biens sont distribués ; il y en a $|\mathcal{A}_n(M)| = n^m$. On note $\overline{A_i} = M \setminus A_i$</dd>
      <dt>Part maximin</dt>
      <dd>$\mu_i = \max_{B \in \mathcal{A}_n(M)}\ \min_\ell\ v_i(B_\ell)$, la part maximin sans droits</dd>
    </dl>
    <p class="source">D’après le [survey](survey) (§ 8.3, « Arbitrary entitlements ») et les articles cités dans les cartes. Encore absents : la famille Égalité, et les familles WEF(x, y) et WPROP(x, y) en dehors de WEF1 = WEF(1, 0) et WPROP1 = WPROP(0, 1).</p>`,
};

/* ================================================================
   A quater. DONNÉES — CARTE DES VALUATIONS
   ----------------------------------------------------------------
   Une flèche A → B se lit « toute valuation A est aussi B ».
   De gauche à droite, du plus particulier au plus général (survey § 8.2,
   où toutes les inclusions sont dites strictes). Ici v est la valuation
   d'un agent ; « Identiques » est une restriction d'une autre nature.
   ================================================================ */
const NOTIONS_VALUATIONS = {
  Binaire: { x: 120, y: 130, fam: "part",
    src: T`[Survey, § 4.1.5](survey)`,
    en: "Binary valuations", fr: "Valuation binaire",
    def: "Additive, et chaque bien vaut 0 ou 1 : on le veut ou on ne le veut pas.",
    q: T`Additive, et pour tout bien $g$ :`,
    f: T`v(g) \in \{0, 1\}`,
    note: T`Cas particulier des valuations bivaluées. C’est là que la version faible d’EFX (on ne retire que des biens de valeur positive) se distingue vraiment de la version forte (survey, § 4.1.5).` },

  Bivaluée: { x: 120, y: 230, fam: "part",
    src: T`[Survey, § 4.1.4](survey)`,
    en: "Bi-valued valuations", fr: "Valuation bivaluée",
    def: T`Additive, et chaque bien ne peut prendre que deux valeurs, $a$ ou $b$ (propres à l’agent).`,
    q: T`Additive, et pour tout bien $g$ :`,
    f: T`v(g) \in \{a, b\}`,
    note: T`EFX y existe et se calcule efficacement, pour tout nombre d’agents ; EFX + PO aussi. Toute allocation MNW y est EFX (survey, § 4.1.4).` },

  Additive: { x: 120, y: 330, fam: "envie",
    src: T`[Survey, § 2](survey)`,
    en: "Additive valuations", fr: "Valuation additive · symbole (+)",
    def: "La valeur d’un panier est la somme des valeurs de ses biens. C’est le cadre des trois autres cartes.",
    q: T`Pour toute partie $S \subseteq M$ :`,
    f: T`v(S) = \sum_{g \in S} v(g)`,
    note: T`Dans les preuves des autres cartes, le symbole (+) au-dessus d’une relation signale que l’on utilise cette propriété. MMS : le survey donnait $\tfrac34 + \tfrac1{12n}$ (Table 7) ; on sait maintenant garantir $\tfrac79$, et on ne peut pas dépasser $\tfrac{39}{40}$ (voir l’échelle de MMS sur la carte de l’équité).` },

  "Sous-modulaire": { x: 330, y: 330, fam: "envie",
    src: T`[Survey, § 8.2](survey)`,
    en: "Submodular valuations", fr: "Valuation sous-modulaire",
    def: "Des rendements décroissants : un bien rapporte moins quand on en a déjà plus.",
    q: T`Pour toutes parties $S, T \subseteq M$ :`,
    f: T`v(S \cup T) + v(S \cap T) \le v(S) + v(T)`,
    note: T`Autrement dit : $v(S \cup \{g\}) - v(S) \ge v(T \cup \{g\}) - v(T)$ pour $S \subseteq T$ et $g \notin T$. MMS : on sait garantir $\tfrac13$, et on ne peut pas dépasser $\tfrac34$ ; le tourniquet donne déjà 0,21-MMS (survey, § 8.2 et Table 7).` },

  XOS: { x: 510, y: 330, fam: "envie",
    src: T`[Survey, § 8.2](survey)`,
    en: "XOS (fractionally subadditive) valuations", fr: "Valuation XOS (fractionnellement sous-additive)",
    def: "Le meilleur de plusieurs façons additives d’évaluer : la valeur d’un panier est le maximum de plusieurs fonctions additives.",
    q: T`Il existe des fonctions additives $a_1, \dots, a_k \ge 0$ telles que, pour toute partie $S$ :`,
    f: T`v(S) = \max_{\ell \in [k]} a_\ell(S)`,
    note: T`MMS : on sait garantir $\tfrac1{4{,}6}$, et on ne peut pas dépasser $\tfrac12$ (survey, § 8.2 et Table 7).` },

  "Sous-additive": { x: 680, y: 330, fam: "envie",
    src: T`[Survey, § 8.2](survey)`,
    en: "Subadditive valuations", fr: "Valuation sous-additive",
    def: "Deux paniers réunis ne valent jamais plus que la somme de leurs valeurs : pas de complémentarité.",
    q: T`Pour toutes parties $S, T \subseteq M$ :`,
    f: T`v(S \cup T) \le v(S) + v(T)`,
    note: T`MMS : on sait garantir de l’ordre de $1/(\log n \log\log n)$, et on ne peut pas dépasser $\tfrac12$ (survey, § 8.2 et Table 7).` },

  Monotone: { x: 900, y: 330, fam: "envie",
    src: T`[Survey, § 2](survey)`,
    en: "Monotone valuations", fr: "Valuation monotone · symbole (m)",
    def: "Avoir plus ne fait jamais perdre de valeur. C’est l’hypothèse de base de tout le survey.",
    q: T`Pour toutes parties $S \subseteq T \subseteq M$ :`,
    f: T`v(S) \le v(T), \qquad v(\varnothing) = 0`,
    note: T`Le survey suppose partout des valuations normalisées et monotones (§ 2) : (m) est donc toujours disponible. À ce niveau de généralité, EF1 existe encore (élimination des cycles d’envie) et $\tfrac12$-EFX aussi ([Plaut et Roughgarden](plaut18)), mais aucune approximation de MMS n’est garantie (survey, Exemple 7).` },

  Identiques: { x: 510, y: 520, fam: "eff",
    src: T`[Survey, § 4.1.1](survey)`,
    en: "Identical valuations", fr: "Valuations identiques",
    def: "Tous les agents évaluent de la même façon. Une restriction d’une autre nature : elle se combine avec n’importe quelle classe.",
    q: T`Pour tous agents $i, j$ :`,
    f: T`v_i = v_j`,
    note: T`EFX y existe toujours, même hors additif : une allocation leximin++ convient ([Plaut et Roughgarden](plaut18), survey § 4.1.1).` },
};

const IMPLICATIONS_VALUATIONS = [
  ["Binaire", "Bivaluée"], ["Bivaluée", "Additive"], ["Additive", "Sous-modulaire"],
  ["Sous-modulaire", "XOS"], ["XOS", "Sous-additive"], ["Sous-additive", "Monotone"],
];

const LIENS_VALUATIONS = {
  "Binaire>Bivaluée": {
    preuve: T`Deux valeurs possibles, $0$ et $1$ : c’est un cas particulier.`,
    exemple: T`Des valeurs dans $\{1, 2\}$ : bivaluée, pas binaire.` },
  "Bivaluée>Additive": {
    preuve: T`Une valuation bivaluée est additive par définition : seules les valeurs des biens sont restreintes.`,
    exemple: T`Des biens de valeurs $1$, $2$ et $3$ : additive, pas bivaluée.` },
  "Additive>Sous-modulaire": {
    pont: [[T`v(S \cup T) + v(S \cap T) \just{+}{=} v(S) + v(T)`, T`Chaque bien de $S \cup T$ est compté une fois de chaque côté, et deux fois s’il est dans $S \cap T$ : l’inégalité est une égalité.`]],
    hyp: [],
    preuve: T`Pour une valuation additive, l’inégalité de sous-modularité est une égalité.`,
    exemple: T`On ne profite que du meilleur bien : $v(S) = \max_{g \in S} v(g)$. C’est sous-modulaire, mais pas additif : avec deux biens de valeur 1, $v(\{a, b\}) = 1 \ne 2$.` },
  "Sous-modulaire>XOS": {
    preuve: T`Toute valuation sous-modulaire est XOS : résultat classique, rappelé au [§ 8.2 du survey](survey), sans preuve courte.`,
    exemple: T`Sur quatre biens, $v = \max(a_1, a_2)$ avec $a_1 = (1, 1, 0, 0)$ et $a_2 = (0, 0, 1, 1)$ : XOS. Mais $g_2$ rapporte $0$ ajouté à $\{g_3\}$ et $1$ ajouté à $\{g_1, g_3\}$ : des rendements croissants, donc pas sous-modulaire.` },
  "XOS>Sous-additive": {
    pont: [[T`v(S \cup T) \just{1}{=} a_\ell(S \cup T) \just{2}{\le} a_\ell(S) + a_\ell(T) \just{3}{\le} v(S) + v(T)`,
            [T`$a_\ell$ est une des fonctions additives qui réalisent le max pour $S \cup T$`, T`$a_\ell$ est additive et positive ($S$ et $T$ peuvent se chevaucher)`, T`$a_\ell \le v$ partout, puisque $v$ est le max des $a_k$`]]],
    hyp: [],
    preuve: T`On prend la fonction additive qui réalise le max pour $S \cup T$.`,
    exemple: T`Sur trois biens, $v(S) = \lceil |S|/2 \rceil$ : sous-additive. Pas XOS : il faudrait une fonction additive $a \le v$ avec $a(M) = 2$, or chaque paire vaut 1, et en sommant les trois paires, $2\, a(M) \le 3$.` },
  "Sous-additive>Monotone": {
    preuve: T`Dans le survey, toutes les valuations sont monotones et normalisées (§ 2) : les classes plus particulières le sont donc aussi.`,
    exemple: T`Deux biens complémentaires, comme une paire de chaussures : $v(\{a\}) = v(\{b\}) = 0$ et $v(\{a, b\}) = 2$. Monotone, mais pas sous-additive, car $2 > 0 + 0$.` },
};

const CARTE_VALUATIONS = {
  titre: "Valuations",
  sousTitre: "(classes de valuations et symboles des hypothèses)",
  legendeApprox: "",
  depart: "Additive",
  simple: true, sansHypotheses: true,
  reperes: ["← plus particulier · plus général →", ""],
  libelles: ["Contient", "Contenue dans"],
  familles: { envie: "Classes de valuations", part: "Cas particuliers", eff: "Autre restriction" },
  notions: NOTIONS_VALUATIONS, implications: IMPLICATIONS_VALUATIONS, jumelles: [], courbes: [], liens: LIENS_VALUATIONS,
  definitions: T`
    <p class="regle-or"><b>Lecture.</b> Une flèche A → B signifie « toute valuation A est aussi B ». Dans les preuves des autres cartes, le symbole au-dessus d’une relation indique l’hypothèse utilisée.</p>
    <dl class="defs">
      <dt>(+)</dt>
      <dd>additivité : $v(S \cup T) = v(S) + v(T)$ pour des parties disjointes</dd>
      <dt>(m)</dt>
      <dd>monotonie : $S \subseteq T \Rightarrow v(S) \le v(T)$, supposée partout dans le survey, avec $v(\varnothing) = 0$</dd>
      <dt>Signes</dt>
      <dd>les hypothèses « valeurs ≥ 0 », « valeurs > 0 », « $v_i(M) > 0$ » portent sur les nombres, pas sur la forme de $v$ : elles restent écrites en toutes lettres</dd>
    </dl>
    <p class="source">D’après le [survey](survey), § 2, § 4.1 et § 8.2 ; toutes les inclusions du schéma sont strictes (§ 8.2).</p>`,
};

// Toutes les cartes, par identifiant (c'est aussi le nom dans l'adresse : #biens, #corvees, #ponderee, #valuations)
/* ================================================================
   A quinquies. ÉCHELLES D'APPROXIMATION (α-relâchements)
   ----------------------------------------------------------------
   Pour une notion X, « α-X » affaiblit X d'un facteur α. Chaque ligne est un contexte
   (classe de valuations, nombre d'agents) et porte deux graduations :
     existe     : jusqu'où l'on sait garantir α-X (zone verte) ;
     impossible : à partir d'où un contre-exemple l'interdit (zone rouge).
   Entre les deux : problème ouvert (zone orange). impossible absent = ouvert jusqu'à α = 1 inclus.
   Pour les biens, α ∈ [0, 1] et α = 1 est la notion exacte. Pour les corvées (sens: "bas"),
   α ≥ 1 multiplie le coût toléré, et α = 1 est la notion exacte, à gauche.
   Statuts vérifiés le 6 novembre 2026.
   ================================================================ */
const MEME_UN_BIEN = { x: 0, l: T`0`, t: "aucun α > 0 : un seul bien pour deux agents, l’un n’a rien", src: "" };

const APPROX_BIENS = {
  MMS: {
    def: T`v_i(A_i) \ge \alpha \cdot \mu_i`,
    lignes: [
      { ctx: "additive",
        existe: { x: 7 / 9, l: T`7/9`, t: "existe toujours", src: T`[Huang et Zhou, 2025, prépublication](hz25) ; avant : $\tfrac{10}{13}$ (SODA 2026), et $\tfrac34 + \tfrac1{12n}$ dans le survey` },
        impossible: { x: 39 / 40, l: T`39/40`, t: "impossible au-delà, dès 3 agents", src: T`[Feige, Sapir et Tauber, 2021](fst21)` } },
      { ctx: "3 agents",
        existe: { x: 11 / 12, l: T`11/12`, t: "existe toujours", src: T`[survey, § 5.3](survey)` },
        impossible: { x: 39 / 40, l: T`39/40`, t: "impossible au-delà", src: T`[Feige, Sapir et Tauber, 2021](fst21)` } },
      { ctx: "2 agents",
        existe: { x: 1, l: T`1`, t: "MMS exact : je coupe, tu choisis", src: T`[survey, § 5.3](survey)` } },
      { ctx: "sous-modulaire",
        existe: { x: 1 / 3, l: T`1/3`, t: "existe toujours", src: T`[Ghodsi et al.](ghodsi21), survey Table 7` },
        impossible: { x: 3 / 4, l: T`3/4`, t: "impossible au-delà", src: T`[Ghodsi et al.](ghodsi21)` } },
      { ctx: "XOS",
        existe: { x: 1 / 4.6, l: T`1/4{,}6`, t: "existe toujours", src: T`Seddighin et Seddighin, [survey, § 8.2](survey)` },
        impossible: { x: 1 / 2, l: T`1/2`, t: "impossible au-delà", src: T`[Ghodsi et al.](ghodsi21)` } },
      { ctx: "monotone",
        existe: { x: 0, l: T`0`, t: "", src: "" },
        impossible: { x: 0, l: T`0`, t: "aucun α > 0 garanti", src: T`[survey, Exemple 7](survey)` } },
    ] },
  EFX: {
    def: T`v_i(A_i) \ge \alpha \cdot v_i(A_j \setminus \{g\})`,
    lignes: [
      { ctx: "additive",
        existe: { x: 0.618, l: T`\varphi - 1`, t: "existe toujours (φ − 1 ≈ 0,618)", src: T`[Amanatidis, Markakis et Ntokos, 2020](birds20)` } },
      { ctx: "additive, ≤ 7 agents",
        existe: { x: 2 / 3, l: T`2/3`, t: "existe toujours", src: T`[Amanatidis, Filos-Ratsikas et Sgouritsa, 2024](afs24)` } },
      { ctx: "additive, 3 agents",
        existe: { x: 1, l: T`1`, t: "EFX exact", src: T`[Chaudhury, Garg et Mehlhorn, 2020](cgm20)` } },
      { ctx: "sous-additive",
        existe: { x: 1 / 2, l: T`1/2`, t: "existe toujours", src: T`[Plaut et Roughgarden](plaut18)` } },
    ] },
  EFR: {
    def: T`v_i(A_i) \ge \alpha \cdot \mathop{\mathbb{E}}\limits_{g \sim \mathcal{U}(A_j)}\big[\, v_i(A_j \setminus \{g\}) \,\big]`,
    lignes: [
      { ctx: "additive",
        existe: { x: 0.73, l: T`0{,}73`, t: "existe toujours, et se calcule en temps polynomial", src: T`Farhadi, Hajiaghayi, Latifian, Seddighin et Yami (AAAI 2021), [survey, § 6.1](survey)` } },
    ] },
  PMMS: {
    def: T`v_i(A_i) \ge \alpha \cdot \mu^2_i(A_i \cup A_j)`,
    lignes: [
      { ctx: "additive",
        existe: { x: (Math.sqrt(17) - 1) / 4, l: T`0{,}781`, t: "existe toujours (√17 − 1)/4", src: T`Kurokawa (thèse), [survey, § 6.2](survey)` },
        impossible: { x: 78 / 79, l: T`78/79`, t: "impossible au-delà, dès 3 agents", src: T`[Gölz, 2026, prépublication](golz26)` } },
    ] },
  GMMS: {
    def: T`v_i(A_i) \ge \alpha \cdot \mathrm{GMMS}_i`,
    lignes: [
      { ctx: "additive",
        existe: { x: 0.618, l: T`\varphi - 1`, t: "existe toujours", src: T`[Amanatidis, Korfiati, Markakis et Santorinaios, 2026, prépublication](amks26) ; le survey donnait $\tfrac47$` },
        impossible: { x: 39 / 40, l: T`39/40`, t: "impossible au-delà (GMMS ⇒ MMS)", src: T`[Feige, Sapir et Tauber, 2021](fst21)` } },
      { ctx: "3 ou 4 agents",
        existe: { x: 2 / 3, l: T`2/3`, t: "existe toujours", src: T`[Amanatidis et al., 2026](amks26)` },
        impossible: { x: 39 / 40, l: T`39/40`, t: "impossible au-delà", src: T`[Feige, Sapir et Tauber, 2021](fst21)` } },
    ] },
  APS: {
    def: T`v_i(A_i) \ge \alpha \cdot \mathrm{APS}_i`,
    lignes: [
      { ctx: "additive",
        existe: { x: 3 / 5, l: T`3/5`, t: "existe toujours", src: T`[Babaioff, Ezra et Feige, 2021](aps21)` },
        impossible: { x: 39 / 40, l: T`39/40`, t: "impossible au-delà, car $\mathrm{APS}_i \ge \mu_i$ : α-APS ⇒ α-MMS", src: T`[Feige, Sapir et Tauber, 2021](fst21)` } },
    ] },
  PROP: {
    def: T`v_i(A_i) \ge \alpha \cdot \frac{v_i(M)}{n}`,
    lignes: [{ ctx: "additive", existe: { x: 0, l: T`0`, t: "", src: "" }, impossible: MEME_UN_BIEN }] },
  EF: {
    def: T`v_i(A_i) \ge \alpha \cdot v_i(A_j)`,
    lignes: [{ ctx: "additive", existe: { x: 0, l: T`0`, t: "", src: "" }, impossible: MEME_UN_BIEN }] },
};

const APPROX_CORVEES = {
  MMS: {
    def: T`c_i(A_i) \le \alpha \cdot \mu_i`, sens: "bas", echelle: [1, 1.5],
    lignes: [
      { ctx: "additive",
        existe: { x: 13 / 11, l: T`13/11`, t: "existe toujours", src: T`[Huang et Segal-Halevi, 2023](hsh23)` },
        impossible: { x: 44 / 43, l: T`44/43`, t: "impossible en deçà, dès 3 agents", src: T`[Feige, Sapir et Tauber, 2021](fst21)` } },
    ] },
};

const APPROX_PONDEREE = {
  WMMS: {
    def: T`v_i(A_i) \ge \alpha \cdot \mathrm{WMMS}_i`, note: "dessiné pour n = 3",
    lignes: [
      { ctx: "additive",
        existe: { x: 1 / 3, l: T`1/n`, t: "existe toujours, atteint par le tourniquet", src: T`[Farhadi et al., 2019](farhadi19)` },
        impossible: { x: 1 / 3, l: T`1/n`, t: "impossible au-delà", src: T`[Farhadi et al., 2019](farhadi19)` } },
    ] },
  APS: {
    def: T`v_i(A_i) \ge \alpha \cdot \mathrm{APS}_i`,
    lignes: [
      { ctx: "additive",
        existe: { x: 3 / 5, l: T`3/5`, t: "existe toujours, même avec des droits inégaux", src: T`[Babaioff, Ezra et Feige, 2021](aps21)` },
        impossible: { x: 39 / 40, l: T`39/40`, t: "impossible au-delà (déjà avec des droits égaux)", src: T`[Feige, Sapir et Tauber, 2021](fst21)` } },
    ] },
};

CARTE_BIENS.approx = APPROX_BIENS;
CARTE_BIENS.selecteur = true;
CARTE_CORVEES.approx = APPROX_CORVEES;
CARTE_PONDEREE.approx = APPROX_PONDEREE;

const CARTES_FR = { biens: CARTE_BIENS, corvees: CARTE_CORVEES, ponderee: CARTE_PONDEREE, valuations: CARTE_VALUATIONS };
