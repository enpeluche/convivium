/* =============================================================================
   Texte de l'onglet « Modèle », en LaTeX rendu par KaTeX.
   Écrit avec String.raw : les antislashs (\frac, \sum…) sont pris tels quels.
   Délimiteurs : \( … \) dans le texte, \[ … \] centré.
   Macros (définies dans app.js) : \A = 𝒜, \T = 𝒯, \indic = 𝟏, \argmax.
   ============================================================================= */
"use strict";

/* Figure : dynamique d'un agent, λ = 1, σ = 3, servi aux instants 1 et 4 (comme dans la thèse). */
const FIG_DYN = (servi, legend) => String.raw`
<figure class="fig">
<svg viewBox="0 0 540 250" role="img" aria-label="${legend}">
  <defs>
    <marker id="ar-m" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--minus)"/></marker>
    <marker id="ar-p" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--a2)"/></marker>
  </defs>
  <g class="grid">
    <line x1="60" y1="190" x2="500" y2="190"/><line x1="60" y1="140" x2="500" y2="140"/><line x1="60" y1="90" x2="500" y2="90"/><line x1="60" y1="40" x2="500" y2="40"/>
  </g>
  <g class="axis"><line x1="60" y1="190" x2="505" y2="190"/><line x1="60" y1="190" x2="60" y2="22"/></g>
  <g class="tick">
    <text x="50" y="194">0</text><text x="50" y="144">1</text><text x="50" y="94">2</text><text x="50" y="44">3</text>
    <text x="60" y="210" class="c">0</text><text x="145" y="210" class="c">1</text><text x="230" y="210" class="c">2</text>
    <text x="315" y="210" class="c">3</text><text x="400" y="210" class="c">4</text><text x="485" y="210" class="c">5</text>
    <text x="512" y="194" class="var">t</text><text x="66" y="18" class="var">u<tspan dy="4" font-size="10">i</tspan><tspan dy="-4">(t)</tspan></text>
  </g>
  <rect x="145" y="222" width="85" height="18" rx="4" class="band"/><text x="187.5" y="235" class="c bandtxt">${servi}</text>
  <rect x="400" y="222" width="85" height="18" rx="4" class="band"/><text x="442.5" y="235" class="c bandtxt">${servi}</text>
  <line x1="145" y1="90" x2="230" y2="40" class="ghost"/><circle cx="230" cy="40" r="3" class="ghostdot"/>
  <line x1="400" y1="90" x2="485" y2="40" class="ghost"/><circle cx="485" cy="40" r="3" class="ghostdot"/>
  <line x1="230" y1="44" x2="230" y2="184" class="down" marker-end="url(#ar-m)"/>
  <line x1="485" y1="44" x2="485" y2="184" class="down" marker-end="url(#ar-m)"/>
  <text x="222" y="118" class="lab minus" text-anchor="end">−σ<tspan dy="4" font-size="10">i</tspan></text>
  <text x="493" y="118" class="lab minus">−σ<tspan dy="4" font-size="10">i</tspan></text>
  <line x1="315" y1="188" x2="315" y2="146" class="up" marker-end="url(#ar-p)"/>
  <text x="323" y="172" class="lab plus">+λ<tspan dy="4" font-size="10">i</tspan></text>
  <polyline points="60,140 145,90 230,190 315,140 400,90 485,190" class="traj"/>
  <g class="pts"><circle cx="60" cy="140" r="3.5"/><circle cx="145" cy="90" r="3.5"/><circle cx="230" cy="190" r="3.5"/><circle cx="315" cy="140" r="3.5"/><circle cx="400" cy="90" r="3.5"/><circle cx="485" cy="190" r="3.5"/></g>
</svg>
<figcaption>${legend}</figcaption>
</figure>`;

/* Barre des régimes, avec le X du scénario courant (placé par app.js). */
const REGBAR = (a, e, f, here) => String.raw`
<div class="regbar" aria-hidden="true">
  <div class="zone ab"><b>${a}</b><span>\(X < 1\)</span></div>
  <div class="zone fa"><b>${f}</b><span>\(X > 1\)</span></div>
  <div class="eqmark"><i></i><b>${e}</b><span>\(X = 1\)</span></div>
  <div class="here" id="regmark"><i></i><span id="regmarklab">${here}</span></div>
</div>`;

const MODEL_TEXT = {
fr: String.raw`
<section class="prose">
<p class="lead">Un ensemble \(\A = \{1, \dots, n\}\) d'agents <b>partagent une même ressource</b>. À chaque instant \(t \in \T = \{t \in \mathbb{N} : t < T\}\), la ressource est allouée à <b>exactement un</b> agent.</p>

<h3>Agents et politique</h3>
<div class="box def"><span class="tag">Définition — politique de service</span>
Une politique de service est une application \(s : \T \to \A\) ; \(s(t)\) est l'agent servi à l'instant \(t\).</div>
<div class="box def"><span class="tag">Définition — fonction de choix</span>
Une fonction de choix est une application \(\chi : \mathcal{P}(\A) \setminus \{\emptyset\} \to \A\) telle que \(\chi(S) \in S\) pour tout \(S\). Elle départage les ex æquo.</div>

<h3>Dynamique</h3>
<p>Chaque agent \(i\) a un <b>état</b> \(u_i(t) \in \mathbb{N}\) (sa frustration) et deux paramètres entiers : un <b>pas d'arrivée</b> \(\lambda_i \geq 1\) et une <b>capacité de service</b> \(\sigma_i > \lambda_i\). L'état initial \(u(0)\) est donné.</p>
<div class="box def"><span class="tag">Définition — dynamique</span>
\[
u_i(t+1) =
\begin{cases}
  \max\bigl(0,\; u_i(t) + \lambda_i - \sigma_i\bigr) & \text{si } s(t) = i, \\[4pt]
  u_i(t) + \lambda_i & \text{sinon.}
\end{cases}
\]</div>
${FIG_DYN("servi", "Un agent avec λ = 1 et σ = 3 (x = 1/3), servi aux instants 1 et 4. À chaque instant l'état reçoit λ, y compris quand l'agent est servi (pointillés) ; le service retire alors σ. Sur 3 instants, les trois arrivées sont exactement compensées par un service.")}
<div class="box rem"><span class="tag">Remarque</span>
La condition \(\sigma_i > \lambda_i\) assure qu'être servi fait diminuer strictement un état positif.</div>

<h3>Besoin et charge</h3>
<div class="box def"><span class="tag">Définition — besoin, charge, régimes</span>
\[
x_i = \frac{\lambda_i}{\sigma_i} \in \,]0, 1[\,,
\qquad
X = \sum_{i \in \A} x_i .
\]
On parle d'<b>abondance</b> si \(X < 1\), d'<b>équilibre</b> si \(X = 1\) et de <b>famine</b> si \(X > 1\).</div>
${REGBAR("abondance", "équilibre", "famine", "scénario courant")}

<h3>Politique étudiée</h3>
<div class="box key">
\[
s(t) = \chi\Bigl(\,\argmax\limits_{i \in \A} \frac{u_i(t)}{\lambda_i}\Bigr)
\]
<p class="c">On sert l'agent dont l'<b>état normalisé</b> \(u_i / \lambda_i\) est le plus grand ; \(\chi\) tranche les égalités.</p></div>
<p>Le simulateur propose trois fonctions de choix :</p>
<div class="cards">
  <div class="mini"><b>Priorité</b>
    \[ \chi(S) = \argmin\limits_{i \in S} \pi(i) \]
    pour un ordre \(\pi\) fixé sur les agents (rang 1 = servi en premier).</div>
  <div class="mini"><b>Tourniquet</b>
    \[ \chi_t(S) = \text{premier } i \in S \text{ après } p_t \]
    dans l'ordre circulaire \(A, B, C, \dots\) ; \(p_t\) est l'agent choisi à l'égalité précédente. \(\chi\) dépend alors du passé.</div>
  <div class="mini"><b>Au hasard</b>
    \[ \chi(S) \sim \mathcal{U}(S) \]
    tirage uniforme parmi les ex æquo (graine fixée : la trajectoire est reproductible).</div>
</div>

<h3>Services reçus</h3>
<div class="box def"><span class="tag">Définition — nombre de services, part reçue</span>
\[
N_i(t) = \sum_{k=0}^{t-1} \indic\bigl[s(k) = i\bigr],
\qquad
y_i(t) = \frac{N_i(t)}{t} \quad (t \geq 1).
\]</div>
<div class="box rem"><span class="tag">Remarque</span>
\(\displaystyle\sum_{i \in \A} N_i(t) = t\) et \(\displaystyle\sum_{i \in \A} y_i(t) = 1\). En famine, \(\sum_i x_i > 1 = \sum_i y_i(t)\) : les besoins ne peuvent pas tous être couverts.</div>
<div class="box def"><span class="tag">Définition — retard moyen</span>
\[
r_i(t) = x_i - y_i(t),
\qquad\text{et donc}\qquad
\sum_{i \in \A} r_i(t) = X - 1
\]
quelle que soit la politique : celle-ci ne fait que <b>répartir</b> cet écart entre les agents. À l'équilibre, \(\sum_i r_i(t) = 0\), et \(y_i = x_i\) pour tout \(i\) n'est qu'une des répartitions possibles.</div>

<h3>Gaspillage</h3>
<div class="box def"><span class="tag">Définition — gaspillage</span>
\[
g_i(t) = \indic\bigl[s(t) = i\bigr]\,\max\bigl(0,\; \sigma_i - \lambda_i - u_i(t)\bigr),
\qquad
\gamma_i(t) = \frac{g_i(t)}{\sigma_i},
\qquad
\Gamma(t) = \sum_{k=0}^{t-1} \sum_{i \in \A} \gamma_i(k).
\]
\(\gamma_i(t)\) est la fraction de la capacité de service perdue au plancher ; elle vaut au plus \(1 - x_i\).</div>
<div class="box rem"><span class="tag">Remarque — la dynamique en une ligne</span>
\[
u_i(t+1) = u_i(t) + \lambda_i - \sigma_i\, \indic\bigl[s(t) = i\bigr] + g_i(t)
\quad\Longrightarrow\quad
u_i(t) = u_i(0) + t\,\sigma_i\, r_i(t) + \sum_{k=0}^{t-1} g_i(k).
\]
Hors gaspillage, \(\sigma_i r_i(t)\) est la pente moyenne de l'état entre \(0\) et \(t\).</div>

<h3>Régime asymptotique</h3>
<div class="box def"><span class="tag">Définition — suite ultimement périodique</span>
\((v(t))_{t}\) est ultimement périodique s'il existe \(\tau_0 \in \mathbb{N}\) et \(\tau \geq 1\) tels que \(v(t + \tau) = v(t)\) pour tout \(t \geq \tau_0\). Le plus petit \(\tau\) est la <b>période</b>, le plus petit \(\tau_0\) la <b>prépériode</b>.</div>
<div class="box def"><span class="tag">Définition — pic, creux, état moyen</span>
\[
\hat u_i = \limsup_{t \to \infty} u_i(t),
\qquad
\check u_i = \liminf_{t \to \infty} u_i(t),
\qquad
\bar u_i = \lim_{t \to \infty} \frac{1}{t} \sum_{k=0}^{t-1} u_i(k).
\]</div>
<div class="box rem"><span class="tag">Proposition</span>
Si \(u_i\) est ultimement périodique, de période \(\tau_i\) et de prépériode \(\tau_{0,i}\), alors \(\bar u_i\) existe et vaut la moyenne sur une période :
\[
\bar u_i = \frac{1}{\tau_i} \sum_{t=\tau_{0,i}}^{\tau_{0,i} + \tau_i - 1} u_i(t).
\]
Avec un départage déterministe, l'état suivant ne dépend que de l'état courant (et, pour le tourniquet, de sa position) : dès qu'un état se répète, la trajectoire est ultimement périodique. L'onglet <b>Analyse</b> détecte \(\tau\) et \(\tau_0\) et affiche \(\hat u_i\), \(\check u_i\), \(\bar u_i\).</div>

<h3>Grandeurs sur les agents</h3>
\[
u_{\max}(t) = \max_{i \in \A} u_i(t), \qquad
u_{\min}(t) = \min_{i \in \A} u_i(t), \qquad
\langle u \rangle(t) = \frac{1}{n} \sum_{i \in \A} u_i(t),
\]
\[
\delta_i(t) = u_i(t) - \langle u \rangle(t), \qquad
e(t) = u_{\max}(t) - u_{\min}(t),
\qquad \sum_{i \in \A} \delta_i(t) = 0, \quad \max_{i} \lvert \delta_i(t) \rvert \leq e(t).
\]

<h3>Parts de référence</h3>
<p>L'histogramme de l'onglet Analyse compare les parts reçues à :</p>
<div class="cards">
  <div class="mini"><b>Famine</b> \[ y_i = \frac{x_i}{X} \] chacun reçoit la même fraction \(1/X\) de son besoin.</div>
  <div class="mini"><b>Équilibre</b> \[ y_i = x_i \] ni manque, ni surplus.</div>
  <div class="mini"><b>Abondance</b> \[ y_i = \max(x_i, \theta^*) \] où \(\theta^*\) vérifie \(\sum_{i} \max(x_i, \theta^*) = 1\) : les petits besoins sont relevés au niveau commun \(\theta^*\).</div>
</div>

<p class="note">Les valeurs sont entières sans perte de généralité : pour une politique fixée, multiplier \(u(0)\) et tous les \(\lambda_i, \sigma_i\) par un même entier \(k \geq 1\) multiplie chaque \(u_i(t)\) par \(k\), sans changer ni l'ordre entre les états ni les besoins.</p>
</section>`,

en: String.raw`
<section class="prose">
<p class="lead">A set \(\A = \{1, \dots, n\}\) of agents <b>share a single resource</b>. At each time step \(t \in \T = \{t \in \mathbb{N} : t < T\}\), the resource is allocated to <b>exactly one</b> agent.</p>

<h3>Agents and policy</h3>
<div class="box def"><span class="tag">Definition — service policy</span>
A service policy is a map \(s : \T \to \A\); \(s(t)\) is the agent served at time \(t\).</div>
<div class="box def"><span class="tag">Definition — choice function</span>
A choice function is a map \(\chi : \mathcal{P}(\A) \setminus \{\emptyset\} \to \A\) such that \(\chi(S) \in S\) for every \(S\). It breaks ties.</div>

<h3>Dynamics</h3>
<p>Each agent \(i\) has a <b>state</b> \(u_i(t) \in \mathbb{N}\) (its frustration) and two integer parameters: an <b>arrival step</b> \(\lambda_i \geq 1\) and a <b>service capacity</b> \(\sigma_i > \lambda_i\). The initial state \(u(0)\) is given.</p>
<div class="box def"><span class="tag">Definition — dynamics</span>
\[
u_i(t+1) =
\begin{cases}
  \max\bigl(0,\; u_i(t) + \lambda_i - \sigma_i\bigr) & \text{if } s(t) = i, \\[4pt]
  u_i(t) + \lambda_i & \text{otherwise.}
\end{cases}
\]</div>
${FIG_DYN("served", "An agent with λ = 1 and σ = 3 (x = 1/3), served at times 1 and 4. At every step the state receives λ, including when the agent is served (dashed); the service then removes σ. Over 3 steps, the three arrivals are exactly offset by one service.")}
<div class="box rem"><span class="tag">Remark</span>
The condition \(\sigma_i > \lambda_i\) ensures that being served strictly decreases a positive state.</div>

<h3>Need and load</h3>
<div class="box def"><span class="tag">Definition — need, load, regimes</span>
\[
x_i = \frac{\lambda_i}{\sigma_i} \in \,]0, 1[\,,
\qquad
X = \sum_{i \in \A} x_i .
\]
We speak of <b>abundance</b> if \(X < 1\), <b>balance</b> if \(X = 1\) and <b>scarcity</b> if \(X > 1\).</div>
${REGBAR("abundance", "balance", "scarcity", "current scenario")}

<h3>Policy under study</h3>
<div class="box key">
\[
s(t) = \chi\Bigl(\,\argmax\limits_{i \in \A} \frac{u_i(t)}{\lambda_i}\Bigr)
\]
<p class="c">Serve the agent whose <b>normalized state</b> \(u_i / \lambda_i\) is the largest; \(\chi\) breaks ties.</p></div>
<p>The simulator offers three choice functions:</p>
<div class="cards">
  <div class="mini"><b>Priority</b>
    \[ \chi(S) = \argmin\limits_{i \in S} \pi(i) \]
    for a fixed order \(\pi\) on the agents (rank 1 = served first).</div>
  <div class="mini"><b>Round robin</b>
    \[ \chi_t(S) = \text{first } i \in S \text{ after } p_t \]
    in the circular order \(A, B, C, \dots\); \(p_t\) is the agent chosen at the previous tie. \(\chi\) then depends on the past.</div>
  <div class="mini"><b>Random</b>
    \[ \chi(S) \sim \mathcal{U}(S) \]
    uniform draw among tied agents (fixed seed: the trajectory is reproducible).</div>
</div>

<h3>Services received</h3>
<div class="box def"><span class="tag">Definition — number of services, received share</span>
\[
N_i(t) = \sum_{k=0}^{t-1} \indic\bigl[s(k) = i\bigr],
\qquad
y_i(t) = \frac{N_i(t)}{t} \quad (t \geq 1).
\]</div>
<div class="box rem"><span class="tag">Remark</span>
\(\displaystyle\sum_{i \in \A} N_i(t) = t\) and \(\displaystyle\sum_{i \in \A} y_i(t) = 1\). Under scarcity, \(\sum_i x_i > 1 = \sum_i y_i(t)\): needs cannot all be met.</div>
<div class="box def"><span class="tag">Definition — average lag</span>
\[
r_i(t) = x_i - y_i(t),
\qquad\text{hence}\qquad
\sum_{i \in \A} r_i(t) = X - 1
\]
whatever the policy: the policy only <b>distributes</b> this gap among the agents. At balance, \(\sum_i r_i(t) = 0\), and \(y_i = x_i\) for all \(i\) is only one possible distribution.</div>

<h3>Waste</h3>
<div class="box def"><span class="tag">Definition — waste</span>
\[
g_i(t) = \indic\bigl[s(t) = i\bigr]\,\max\bigl(0,\; \sigma_i - \lambda_i - u_i(t)\bigr),
\qquad
\gamma_i(t) = \frac{g_i(t)}{\sigma_i},
\qquad
\Gamma(t) = \sum_{k=0}^{t-1} \sum_{i \in \A} \gamma_i(k).
\]
\(\gamma_i(t)\) is the fraction of service capacity lost at the floor; it is at most \(1 - x_i\).</div>
<div class="box rem"><span class="tag">Remark — the dynamics in one line</span>
\[
u_i(t+1) = u_i(t) + \lambda_i - \sigma_i\, \indic\bigl[s(t) = i\bigr] + g_i(t)
\quad\Longrightarrow\quad
u_i(t) = u_i(0) + t\,\sigma_i\, r_i(t) + \sum_{k=0}^{t-1} g_i(k).
\]
Without waste, \(\sigma_i r_i(t)\) is the average slope of the state between \(0\) and \(t\).</div>

<h3>Asymptotic regime</h3>
<div class="box def"><span class="tag">Definition — ultimately periodic sequence</span>
\((v(t))_{t}\) is ultimately periodic if there exist \(\tau_0 \in \mathbb{N}\) and \(\tau \geq 1\) such that \(v(t + \tau) = v(t)\) for all \(t \geq \tau_0\). The smallest \(\tau\) is the <b>period</b>, the smallest \(\tau_0\) the <b>pre-period</b>.</div>
<div class="box def"><span class="tag">Definition — peak, trough, mean state</span>
\[
\hat u_i = \limsup_{t \to \infty} u_i(t),
\qquad
\check u_i = \liminf_{t \to \infty} u_i(t),
\qquad
\bar u_i = \lim_{t \to \infty} \frac{1}{t} \sum_{k=0}^{t-1} u_i(k).
\]</div>
<div class="box rem"><span class="tag">Proposition</span>
If \(u_i\) is ultimately periodic, with period \(\tau_i\) and pre-period \(\tau_{0,i}\), then \(\bar u_i\) exists and equals the mean over one period:
\[
\bar u_i = \frac{1}{\tau_i} \sum_{t=\tau_{0,i}}^{\tau_{0,i} + \tau_i - 1} u_i(t).
\]
With deterministic tie-breaking, the next state depends only on the current one (and, for the round robin, on its position): as soon as a state repeats, the trajectory is ultimately periodic. The <b>Analysis</b> tab detects \(\tau\) and \(\tau_0\) and shows \(\hat u_i\), \(\check u_i\), \(\bar u_i\).</div>

<h3>Quantities over agents</h3>
\[
u_{\max}(t) = \max_{i \in \A} u_i(t), \qquad
u_{\min}(t) = \min_{i \in \A} u_i(t), \qquad
\langle u \rangle(t) = \frac{1}{n} \sum_{i \in \A} u_i(t),
\]
\[
\delta_i(t) = u_i(t) - \langle u \rangle(t), \qquad
e(t) = u_{\max}(t) - u_{\min}(t),
\qquad \sum_{i \in \A} \delta_i(t) = 0, \quad \max_{i} \lvert \delta_i(t) \rvert \leq e(t).
\]

<h3>Reference shares</h3>
<p>The histogram of the Analysis tab compares received shares with:</p>
<div class="cards">
  <div class="mini"><b>Scarcity</b> \[ y_i = \frac{x_i}{X} \] each agent receives the same fraction \(1/X\) of its need.</div>
  <div class="mini"><b>Balance</b> \[ y_i = x_i \] neither shortfall nor excess.</div>
  <div class="mini"><b>Abundance</b> \[ y_i = \max(x_i, \theta^*) \] where \(\theta^*\) satisfies \(\sum_{i} \max(x_i, \theta^*) = 1\): small needs are raised to the common level \(\theta^*\).</div>
</div>

<p class="note">Integer values lose no generality: for a fixed policy, multiplying \(u(0)\) and every \(\lambda_i, \sigma_i\) by the same integer \(k \geq 1\) multiplies each \(u_i(t)\) by \(k\), changing neither the order between states nor the needs.</p>
</section>`,
};
