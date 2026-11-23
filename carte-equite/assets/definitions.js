"use strict";
/* ================================================================
   ONGLET DÉFINITIONS
   ----------------------------------------------------------------
   Toutes les notions des quatre cartes, générées à partir des
   données (donc toujours à jour et dans la langue courante) :
   carte → famille → notion, avec quantificateurs, formule KaTeX,
   « où », source, statut et implications. Puis les algorithmes.
   Un filtre en haut, un sommaire à gauche ; un clic sur un sigle
   ouvre la notion sur son graphe.
   ================================================================ */

const ORDRE_CARTES = ["biens", "corvees", "ponderee", "valuations"];
const ORDRE_FAMILLES = ["envie", "part", "egal", "eff"];
let defsRendues = null;   // langue pour laquelle la page a été construite

// Change la vue affichée : le graphe et sa carte, ou la page des définitions
function montrerVue(vue) {
  const defs = vue === "defs";
  document.getElementById("vue-carte").hidden = defs;
  document.getElementById("vue-defs").hidden = !defs;
  document.body.classList.toggle("en-defs", defs);
  if (defs) card.hidden = true;
}

const sansAccents = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const texteBrut = html => { const d = document.createElement("div"); d.innerHTML = html; return d.textContent; };

function htmlDefinitionsCarte(cleCarte) {
  const C = CARTES[cleCarte], N = C.notions;
  const nomFamille = k => C.familles?.[k] ?? NOMS_FAMILLES[k];
  const impl = C.implications;
  const chip = (id, carte = cleCarte) => {
    const n = CARTES[carte].notions[id];
    return `<button type="button" class="chip" data-carte="${carte}" data-go="${id}" style="--cc:${FAMILLES[n.fam].couleur}">${n.sigle ?? id}</button>`;
  };
  let familles = "";
  for (const f of ORDRE_FAMILLES) {
    const ids = Object.keys(N).filter(id => N[id].fam === f);
    if (!ids.length) continue;
    const boites = ids.map(id => {
      const n = N[id], ex = n.ex;
      const par = impl.filter(([, b]) => b === id).map(([a]) => a);
      const vers = impl.filter(([a]) => a === id).map(([, b]) => b);
      const q = n.q ? `<div class="quant">${texte(n.q)}</div>` : "";
      const ou = n.ou ? `<div class="ou"><span class="ou-mot">${ui("ou")}</span>${n.ou.map(l => tex(l, true)).join("")}</div>` : "";
      const liens = [
        par.length ? `<span><i>${C.libelles?.[0]?.toLowerCase() ?? ui("defsImpliquePar")}</i> ${par.map(x => chip(x)).join("")}</span>` : "",
        n.jumelle ? `<span><i>${ui("defsJumelle")}</i> ${chip(n.jumelle)}</span>` : "",
        vers.length ? `<span><i>${C.libelles?.[1]?.toLowerCase() ?? ui("defsImplique")}</i> ${vers.map(x => chip(x)).join("")}</span>` : "",
      ].filter(Boolean).join("");
      const nom = LANG === "en" ? n.en : `${n.fr} <span class="en-nom">· ${n.en}</span>`;
      const cherche = sansAccents(`${id} ${n.sigle ?? ""} ${n.fr} ${n.en} ${texteBrut(n.def)}`);
      return `
        <article class="def-notion" id="def-${cleCarte}-${id}" data-cherche="${cherche.replace(/"/g, "")}" style="--fc:${FAMILLES[n.fam].couleur}">
          <header>
            ${chip(id)}
            <h4>${nom}</h4>
            ${ex ? `<span class="status">${STATUT[ex]}</span>` : ""}
          </header>
          <p class="def-texte">${texte(n.def)}</p>
          <div class="formula">${q}<div class="corps">${tex(n.f, true)}</div>${ou}</div>
          <footer>
            ${n.src ? `<span class="def-src" title="${ui("defsSource")}">${texte(n.src)}</span>` : ""}
            ${liens ? `<span class="def-liens">${liens}</span>` : ""}
          </footer>
        </article>`;
    }).join("");
    familles += `<section class="def-famille" id="def-${cleCarte}-fam-${f}"><h3 style="--fc:${FAMILLES[f].couleur}"><span class="sw"></span>${nomFamille(f)}</h3>${boites}</section>`;
  }
  return `
    <section class="def-carte" id="def-${cleCarte}">
      <h2>${C.titre} <small>${C.sousTitre}</small></h2>
      <details class="def-cadre" open><summary>${ui("defsCadre")}</summary>${texte(C.definitions)}</details>
      ${familles}
    </section>`;
}

function htmlDefinitionsAlgos() {
  const algos = Object.entries(ALGOS).map(([id, A]) => `
    <article class="def-notion def-algo" id="def-algo-${id}" data-cherche="${sansAccents(`${A.nom} ${A.en} ${A.def}`).replace(/"/g, "")}" style="--fc:${A.fc}">
      <header><h4>${A.nom}</h4><span class="def-src">${texte(A.src)}</span></header>
      <p class="def-texte">${A.def}</p>
      <ol class="pseudo">${A.lignes.map(([niv, s]) => `<li style="--niv:${niv}">${texte(s)}</li>`).join("")}</ol>
      <footer><span><b>${ui("defsGarantie")}</b> ${A.garantie.map(([n, h]) => `${n} (${h})`).join(" · ")}</span></footer>
    </article>`).join("");
  const lecture = texte(LANG === "en" ? DEFINITIONS_ALGO_EN : DEFINITIONS_ALGO_FR);
  return `<section class="def-carte" id="def-algos"><h2>${ui("defsAlgos")}</h2><details class="def-cadre" open><summary>${ui("defsLecture")}</summary>${lecture}</details>${algos}</section>`;
}

function htmlSommaire() {
  const cartes = ORDRE_CARTES.map(k => {
    const C = CARTES[k];
    const fams = ORDRE_FAMILLES.filter(f => Object.values(C.notions).some(n => n.fam === f))
      .map(f => `<li><a href="#def-${k}-fam-${f}" data-ancre style="--fc:${FAMILLES[f].couleur}">${C.familles?.[f] ?? NOMS_FAMILLES[f]}</a></li>`).join("");
    return `<li><a href="#def-${k}" data-ancre class="toc-carte">${C.titre}</a><ul>${fams}</ul></li>`;
  }).join("");
  return `<ul>${cartes}<li><a href="#def-algos" data-ancre class="toc-carte">${ui("defsAlgos")}</a></li></ul>`;
}

function construireDefinitions() {
  document.getElementById("defs-sommaire").innerHTML = htmlSommaire();
  document.getElementById("defs-contenu").innerHTML =
    ORDRE_CARTES.map(htmlDefinitionsCarte).join("") + htmlDefinitionsAlgos() +
    `<p class="defs-aucune" id="defs-aucune" hidden>${ui("defsAucune")}</p><p class="evolue">${ui("evolue")}</p>`;
  defsRendues = LANG;
  filtrerDefinitions();
}

function filtrerDefinitions() {
  const q = sansAccents(document.getElementById("defs-filtre").value.trim());
  let total = 0;
  document.querySelectorAll("#defs-contenu .def-notion").forEach(el => {
    const ok = !q || el.dataset.cherche.includes(q);
    el.hidden = !ok; if (ok) total++;
  });
  document.querySelectorAll("#defs-contenu .def-famille, #defs-contenu .def-carte").forEach(sec => {
    sec.hidden = !sec.querySelector(".def-notion:not([hidden])");
  });
  document.getElementById("defs-aucune").hidden = total > 0;
}

function afficherDefinitions() {
  carteId = "definitions";
  selection = null;
  montrerVue("defs");
  document.querySelectorAll(".onglets a").forEach(a => a.toggleAttribute("aria-current", a.dataset.carte === "definitions"));
  document.title = `${ui("defsTitre")} · ${ui("siteTitre")}`;
  if (defsRendues !== LANG) construireDefinitions();
  // arrivée depuis le lien « Notations » d'une carte : aller à la section de cette carte
  if (cibleDefs) { const el = document.getElementById(cibleDefs); cibleDefs = null; if (el) requestAnimationFrame(() => el.scrollIntoView({ block: "start" })); }
}
let cibleDefs = null;

function brancherDefinitions() {
  // Lien « Notations » à côté du titre d'une carte : ouvre les définitions à la section de cette carte
  document.getElementById("lien-notations").addEventListener("click", () => {
    cibleDefs = carteId === "algorithmes" ? "def-algos" : `def-${carteId}`;
  });
  document.getElementById("defs-filtre").addEventListener("input", filtrerDefinitions);
  // Sigle → ouvrir la notion sur son graphe ; ancre du sommaire → défiler sans changer d'onglet
  document.getElementById("vue-defs").addEventListener("click", ev => {
    const chip = ev.target.closest(".chip[data-carte]");
    if (chip) { aOuvrir = chip.dataset.go; location.hash = chip.dataset.carte; return; }
    const ancre = ev.target.closest("a[data-ancre]");
    if (ancre) {
      ev.preventDefault();
      document.getElementById(ancre.getAttribute("href").slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}
