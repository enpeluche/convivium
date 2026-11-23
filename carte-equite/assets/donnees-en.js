"use strict";
/* ================================================================
   ENGLISH LAYER
   ----------------------------------------------------------------
   Laid over the French data (donnees.js) when the page is in English:
   langue.js merges each object below into its French counterpart.
     - plain objects are merged key by key;
     - arrays of objects (approximation scales) are merged element by element;
     - any other array (hyp, ou, pont…) replaces the French one.
   Proof bridges (pont) reuse the French formulas: P(liens, key, [...])
   only replaces the text of each step (see the function P below).
   LaTeX decimal commas {,} are turned into points at display time.
   ================================================================ */

// P(L, key, list): the French bridge L[key].pont, where the text of step k is replaced by list[k]:
//   undefined → unchanged; a string or an array of reasons → replaces the text;
//   { f, t } → replaces the formula and/or the text.
function P(L, cle, liste) {
  return L[cle].pont.map(([f, pourquoi], k) => {
    const e = liste[k];
    if (e === undefined) return [f, pourquoi];
    if (e && typeof e === "object" && !Array.isArray(e)) return [e.f ?? f, e.t ?? pourquoi];
    return [f, e];
  });
}

const H_ADD = "additivity", H_MONO = "monotonicity";
const POUR_TOUT_IJ = T`For all agents $i, j$:`;
const POUR_TOUT_I = T`For every agent $i$:`;
const POUR_TOUT_G_J = T`For all agents $i, j$ and every good $g \in A_j$:`;
const IL_EXISTE_G_J = T`For all agents $i, j$ with $A_j \neq \varnothing$, there is a good $g \in A_j$ such that:`;
const IL_EXISTE_C_I = T`For all agents $i, j$ with $A_i \neq \varnothing$, there is a chore $g \in A_i$ such that:`;
const POUR_TOUTE_C_I = T`For all agents $i, j$ and every chore $g \in A_i$:`;
const PAS_DE_B = T`There is no allocation $B \in \mathcal{A}_n(M)$ such that:`;
const PAS_DE_X = T`There is no fractional allocation $x \in \mathcal{F}$ such that:`;
const TOUT_IMPLIQUE_UN = T`“For every good of $A_j$” implies “for some good of $A_j$”, as soon as $A_j \ne \varnothing$.`;
const TOUTE_IMPLIQUE_UNE = T`“For every chore” implies “for some chore”, as soon as $A_i \ne \varnothing$.`;

/* ---------------------------------------------------------------- Goods map */
const EN_NOTIONS_BIENS = {
  EF: { src: T`[Survey, Def. 1](survey)`,
    def: "Nobody prefers someone else’s bundle to their own.", q: POUR_TOUT_IJ,
    note: "A single good for two agents is enough to rule it out. Deciding whether an EF allocation exists is NP-complete." },
  EFX: { src: T`[Survey, Def. 4](survey)`,
    def: "Envy disappears whichever good is removed from the envied bundle, even the least valuable one.", q: POUR_TOUT_G_J,
    note: "Major open problem: true for 2 and 3 agents, open from 4 agents on (additive). False for general monotone valuations (SAT-based counterexample, 2026)." },
  EFR: { def: "Envy disappears on average if a uniformly random good is removed from the envied bundle.", q: POUR_TOUT_IJ,
    ou: [T`\mathcal{U}(A_j) \text{: the uniform distribution over the goods of } A_j`],
    note: "Open problem 7 of the [survey](survey)." },
  EFL: { def: T`Like EF1, but the removed good must be worth less, to $i$, than $i$’s own bundle. Nothing is required if $j$ holds at most one good that $i$ values.`,
    q: POUR_TOUT_IJ,
    f: T`|\{h \in A_j : v_i(h) > 0\}| \le 1 \;\text{ or }\; \exists g \in A_j,\; \begin{cases} v_i(A_i) \ge v_i(g) \\ v_i(A_i) \ge v_i(A_j \setminus \{g\}) \end{cases}`,
    note: "Introduced by [Barman et al. (2018)](gmms18); computable in polynomial time." },
  EF1: { src: T`[Survey, Def. 3](survey)`,
    def: "If I envy someone, removing one well-chosen good from their bundle is enough to erase my envy.", q: IL_EXISTE_G_J,
    note: "Round-robin produces one. EF1 + PO always exists (MNW); computing it in polynomial time is open." },
  EEFX: { def: "I only see my own bundle: there is a way of splitting the rest among the others for which I would be EFX.",
    q: T`For every agent $i$, there is a partition $B = (B_j)_{j \ne i} \in \mathcal{A}_{n-1}(\overline{A_i})$ such that, for every agent $j \ne i$ and every good $g \in B_j$:`,
    note: T`Introduced by [Caragiannis, Garg, Rathi, Sharma and Varricchio (IJCAI 2023)](eefx23). Always exists, even for monotone valuations ([Akrami and Rathi, AAAI 2025](akrami25)). With 2 agents, EEFX = EFX. Does not imply EF1: getting EF1 and EEFX together is a separate result (2026).` },

  PROP: { src: T`[Survey, Def. 2](survey)`,
    def: T`Everyone gets at least $1/n$ of the total value, by their own taste.`, q: POUR_TOUT_I,
    note: "Fails with a single good for two agents." },
  PROPX: { src: T`[Survey, Def. 13](survey)`,
    def: "Adding any good I do not have would bring me up to my fair share.",
    q: T`For every agent $i$ and every good $g \notin A_i$:`,
    note: "May fail to exist for goods ([Aziz et al.](aziz20)), but always exists for chores." },
  PROPm: { def: T`My share, plus the most valuable “smallest good” I see in someone else’s bundle, reaches $1/n$.`, q: POUR_TOUT_I,
    note: "Existence: [Baklanov et al., 2021](propm21)." },
  PROP1: { src: T`[Survey, Def. 12](survey)`,
    def: "I am at most one good, taken from someone else, short of my fair share.",
    q: T`For every agent $i$, there is a good $g \notin A_i$ such that:`,
    note: "PROP1 + PO also exists." },
  MMS: { src: T`[Survey, Def. 5](survey)`,
    def: T`Everyone gets what they could guarantee by cutting $n$ bundles themselves and receiving the worst one.`, q: POUR_TOUT_I,
    ou: [T`\mu_i = \max_{B \in \mathcal{A}_n(M)}\ \min_k\ v_i(B_k)`, T`\text{in other words: } \mu_i \ge t \iff \exists B \in \mathcal{A}_n(M),\ \forall k,\ v_i(B_k) \ge t`],
    note: T`Example: Alice $(7, 4, 3, 2)$, $n = 2$: the best cut $\{7\} \mid \{4, 3, 2\}$ gives $\mu = 7$, below the proportional share $8$. Not always achievable ([Kurokawa et al., 2018](kpw18)).` },
  PMMS: { src: T`[Survey, Def. 10](survey)`,
    def: "For every pair, pooling the two bundles and replaying “I cut, you choose” would gain nothing.", q: POUR_TOUT_IJ,
    note: T`Open problem 8 of the survey is settled: [Gölz (2026, preprint)](golz26) gives an additive instance with 3 agents and 9 goods and no PMMS allocation. EFX remains open: PMMS ⇒ EFX, so this counterexample says nothing about EFX.` },
  GMMS: { src: T`[Survey, Def. 11](survey)`,
    def: "The maximin condition holds in every subgroup of agents that would pool its bundles.",
    q: T`For every group of agents $T \subseteq N$ and every agent $i \in T$:`,
    note: T`Open problem 9 of the [survey](survey): what is the best α? The survey gave $\tfrac47$; see the scale above.` },
  APS: { def: T`An adversary sets non-negative prices summing to 1; with a budget of $1/n$, I buy the best affordable bundle. $\mathrm{APS}_i$ is what I can guarantee against the worst prices.`,
    q: POUR_TOUT_I,
    note: T`APS is a “fractional” MMS (linear-programming duality). Example: goods $(3, 1)$, $n = 2$; if $p_a \le 1/2$ we buy $a$, otherwise $b$ costs less than $1/2$: $\mathrm{APS} = 1$.` },

  EQ: { src: T`[Survey, Def. 14](survey)`,
    def: "Everyone gets the same utility, each measured by their own taste.", q: POUR_TOUT_IJ,
    note: "Compares utilities across agents: valuations must be normalized." },
  EQX: { src: T`[Survey, Def. 16](survey)`,
    def: "The utility gap disappears whichever good is removed from the better-off agent.", q: POUR_TOUT_G_J,
    note: "Existence, for positive values: [Gourvès et al.](gourves14); [Freeman et al., 2019](freeman19)." },
  EQ1: { src: T`[Survey, Def. 15](survey)`,
    def: "Removing one well-chosen good from the better-off agent is enough to erase the utility gap.", q: IL_EXISTE_G_J },

  PO: { src: T`[Survey, Def. 6](survey)`,
    def: "Impossible to make someone better off without making someone else worse off.", q: PAS_DE_B,
    f: T`\begin{aligned} &\forall i,\ v_i(B_i) \ge v_i(A_i) \\ \text{and } &\exists i,\ v_i(B_i) > v_i(A_i) \end{aligned}`,
    note: "PO is not “maximum sum”: it is a maximal element. The maximum sum is PO, not the other way round." },
  fPO: { def: "PO even against allocations that cut goods into pieces.", q: PAS_DE_X,
    f: T`\begin{aligned} &\forall i,\ v_i(x_i) \ge v_i(A_i) \\ \text{and } &\exists i,\ v_i(x_i) > v_i(A_i) \end{aligned}`,
    ou: [ALLOCS_FRAC, T`\text{an integral allocation is the case where every } x_{i,g} \in \{0, 1\}`],
    note: "Geometrically: lying on the continuous Pareto frontier. EF1 + fPO always exists ([Barman et al., 2018](bkv18))." },
  MNW: { src: T`[Survey, Def. 7](survey)`,
    def: "Pick the allocation that maximizes the product of utilities.",
    ou: [T`\text{if the maximum product is } 0 \text{, first maximize the number of agents with utility} > 0`],
    note: T`Idea due to [Nash (bargaining, 1950)](nash50). It is what guarantees EF1 and PO at once ([Caragiannis et al., 2019](mnw19)). Hard to compute exactly.` },
  USW: { src: T`standard definition; [Survey, § 8.7](survey)`,
    def: "Pick the allocation that maximizes the sum of utilities.",
    note: "With additive valuations, it suffices to give each good to the agent who likes it most (polynomial time). It is the benchmark of the price of fairness." },
  Leximin: { def: "Maximize the utility of the worst-off agent, then of the second worst-off, and so on.",
    note: T`Max-min alone is only weakly PO; leximin fixes that. NP-hard in general (max-min is the “Santa Claus problem”). With identical valuations, a variant (leximin++) gives EFX ([Plaut and Roughgarden](plaut18)).` },
  EGW: { def: "Pick the allocation that maximizes the utility of the worst-off agent.",
    note: "The “Santa Claus problem”: APX-hard to compute. A maximizer is only weakly PO (the others can be improved without touching the minimum); leximin refines it into PO. In repetitive scheduling, it is the “K-fair” criterion of Hermelin et al. and the threshold k of the 13-11-9-7-5 example." },
};

const LB = LIENS_BIENS;
const EN_LIENS_BIENS = {
  "EF>GMMS": { pont: P(LB, "EF>GMMS", [undefined, [T`in any partition of $S$ into $|T|$ bundles, the worst bundle is worth at most the average`, T`EF and (+)`]]),
    hyp: [H_ADD],
    question: T`Compute Alice’s maximin share, alone and then within the group of two. Does she envy Bob?`,
    preuve: T`In any group $S$, the allocation restricted to $S$ is still envy-free, hence proportional among the members of $S$, hence everyone gets at least their maximin share of $S$ (PROP ⇒ MMS).`,
    exemple: "One good, two agents who like it. The one with nothing has a zero maximin share (one of the two bundles is empty): GMMS holds, but they envy the other." },
  "EF>PROP": { pont: P(LB, "EF>PROP", [undefined, T`Divide by $n$.`]), hyp: [H_ADD],
    question: T`Check that everyone has at least a third of their total value, then compare what Alice has with what she sees in Bob’s bundle.`,
    preuve: T`Sum $v_i(A_i) \ge v_i(A_j)$ over all $j$: $n \cdot v_i(A_i) \ge \sum_j v_i(A_j) = v_i(M)$.`,
    exemple: T`Alice $(3, 3, 3, 0)$, Bob $(1, 1, 1, 0)$, Chloé $(0, 0, 0, 3)$. Alice $\{a\}$, Bob $\{b, c\}$, Chloé $\{d\}$: everyone has their third, but Alice sees 6 in Bob’s bundle and has only 3.` },
  "EF>EFX": { hyp: [H_MONO],
    question: "Does Alice envy Bob? And if Bob’s only good is removed?",
    preuve: T`Removing a good can only lower $v_i(A_j)$: if $v_i(A_i) \ge v_i(A_j)$, then a fortiori $v_i(A_i) \ge v_i(A_j \setminus \{g\})$.`,
    exemple: "One good, two agents. Removing the only good from the envied bundle leaves 0: EFX holds, EF does not." },
  "GMMS>PMMS": {
    preuve: T`PMMS is the GMMS condition restricted to groups of two agents, $S = \{i, j\}$.`,
    exemple: "PMMS and MMS are incomparable ([Caragiannis et al., 2019](mnw19)): a PMMS allocation that is not MMS is not GMMS. With two agents the three notions coincide, so at least three agents are needed." },
  "GMMS>MMS": { pont: P(LB, "GMMS>MMS", [[T`the bundles of all agents make up $M$`]]),
    question: T`Compute $\mu_i$ for each agent, then agent 2’s maximin share within the group $\{1, 2\}$.`,
    preuve: T`MMS is the GMMS condition for the whole group, $S = N$.`,
    exemple: T`Three agents, five identical goods worth 1, $\mu = 1$. Counts $(3, 1, 1)$: MMS holds, but agents 1 and 2 together have 4 goods, which agent 2 would cut as $2 + 2$: they only have $1 < 2$.` },
  "PMMS>EFX": { pont: P(LB, "PMMS>EFX", [
      T`By contradiction: suppose $v_i(A_i) < v_i(A_j \setminus \{g\})$ for some good $g \in A_j$, and look at the cut $(A_i \cup \{g\},\ A_j \setminus \{g\})$ of $A_i \cup A_j$.`,
      [T`$v_i(g) > 0$`],
      [T`$\mu_i^2$ is the best minimum over all cuts`, T`(1) and the contradiction hypothesis`],
      T`$i$ would gain by re-cutting the pair: this contradicts PMMS.`]),
    hyp: [H_ADD, "values > 0"],
    question: T`Does Bob still envy Alice after the removal of any one of her goods? Then look for the best cut of the four goods into two bundles.`,
    preuve: T`If $v_i(A_i) < v_i(A_j \setminus \{g\})$, both pieces of the cut $(A_i \cup \{g\},\ A_j \setminus \{g\})$ are worth $> v_i(A_i)$ (positive values): $i$ would gain by re-cutting the pair, which contradicts PMMS.`,
    exemple: T`Two identical agents, goods $(4, 3, 3, 2)$, $\mu = 6$ ($\{4, 2\}$ and $\{3, 3\}$). Alice $\{4, 3\}$, Bob $\{3, 2\}$: Bob is EFX (removing 3 leaves $4 \le 5$), but has only $5 < 6$.` },
  "PROP>APS": { pont: P(LB, "PROP>APS", [
      [T`additivity; this is a particular price vector, proportional to $i$’s values`],
      [T`APS is a minimum over all prices`, T`(1): $p^*(S) \le \tfrac1n$ gives $v_i(S) \le v_i(M)/n$`]]),
    hyp: [H_ADD, T`$v_i(M) > 0$`],
    question: T`Which prices prevent Alice from buying anything with a budget of $1/2$? Compare with her proportional share.`,
    preuve: T`$\mathrm{APS}_i$ is a minimum over prices, so $\mathrm{APS}_i \le \max\{ v_i(S) : p^*(S) \le 1/n \}$ for the particular price vector $p^*_g = v_i(g)/v_i(M) \in \Delta$. By additivity $p^*(S) = v_i(S)/v_i(M)$, so $p^*(S) \le 1/n \Rightarrow v_i(S) \le v_i(M)/n$. Hence $\mathrm{APS}_i \le v_i(M)/n \le v_i(A_i)$.`,
    exemple: T`One good, two agents. Price 1 on that good makes it unaffordable with a budget of $1/2$: $\mathrm{APS} = 0$ for the agent with nothing. APS holds, PROP ($1/2$) does not.` },
  "PROP>PROPX": { hyp: [H_MONO],
    question: "Does Alice have her proportional share? Would she exceed it by receiving the good?",
    preuve: T`Adding a good can only increase the value: $v_i(A_i \cup \{g\}) \ge v_i(A_i) \ge v_i(M)/n$.`,
    exemple: T`One good, two agents: the one with nothing would reach $1 > 1/2$ by receiving the good. PROPX holds, PROP does not.` },
  "APS>MMS": { pont: P(LB, "APS>MMS", [
      T`Let $B \in \mathcal{A}_n(M)$ be $i$’s best cut, and $p \in \Delta$ any price vector.`,
      [T`the $n$ bundles cost 1 in total: one of them costs at most the average`],
      [T`$B_\ell$ is affordable, by (1)`, T`every bundle of the best cut is worth at least $\mu_i$`],
      T`This holds for every price vector $p$, so $\mathrm{APS}_i \ge \mu_i$, and then $v_i(A_i) \ge \mathrm{APS}_i \ge \mu_i$.`]),
    preuve: T`For every price vector, one of the $n$ bundles of $i$’s best cut costs at most $1/n$; $i$ can buy it, and it is worth at least $\mu_i$. Hence $\mathrm{APS}_i \ge \mu_i$.`,
    exemple: T`APS can be strictly larger than MMS ([Babaioff, Ezra and Feige, 2021](aps21)): an allocation giving $i$ exactly $\mu_i$ is then MMS without being APS.` },
  "PROPX>PROPm": { pont: P(LB, "PROPX>PROPm", [
      T`Let $g^*$ be a good achieving $\max_{j \ne i} \min_{g \in A_j} v_i(g)$ (any one if there are several): it lies in another agent’s bundle, so $g^* \notin A_i$.`]),
    hyp: [H_ADD],
    question: T`No allocation given: try to split the five goods so that everyone reaches their share $13/3$ with any extra good. What gets in the way?`,
    preuve: T`The good achieving $\max_j \min_{g \in A_j} v_i(g)$ lies outside $A_i$: PROPX applied to that good gives the PROPm condition.`,
    exemple: T`Three agents, goods $(3, 3, 3, 3, 1)$: no PROPX allocation exists (Table 3 of the [survey](survey)), whereas a PROPm allocation always exists.` },
  "PROPm>PROP1": { pont: P(LB, "PROPm>PROP1", [[T`PROPm, where $g^* \notin A_i$ achieves the max`]]),
    hyp: [H_ADD],
    question: T`Which good should Alice receive to reach her share of 2? What is Bob’s smallest good, and Chloé’s?`,
    preuve: T`The good achieving the PROPm max is a good $g \notin A_i$; adding it gives $v_i(A_i \cup \{g\}) \ge v_i(M)/n$.`,
    exemple: T`Three identical agents, goods $(3, 1, 1, 1)$, share 2. Alice nothing, Bob $\{3, 1\}$, Chloé $\{1, 1\}$: adding 3 gives Alice PROP1, but everyone’s smallest good is worth 1, and $0 + 1 < 2$.` },
  "EFX>EFL": { pont: P(LB, "EFX>EFL", [
      T`If $A_j$ contains at most one good that $i$ values positively, EFL holds by definition. Otherwise $A_j$ has at least two goods: let $g$ be a good of $A_j$ that $i$ likes least (any one in case of ties), and $h \ne g$ another good of $A_j$.`,
      [T`monotone valuations, since $h \in A_j \setminus \{g\}$`, T`$g$ is a good of $A_j$ that $i$ likes least`],
      T`The first inequality is EFL’s second condition; the whole chain gives the first.`]),
    hyp: [H_MONO],
    question: T`For Alice, which of Bob’s goods can be removed to erase her envy? Which ones are not enough?`,
    preuve: T`If $|A_j| \ge 2$, take $g$ a least-liked good of $A_j$: EFX gives $v_i(A_i) \ge v_i(A_j \setminus \{g\}) \ge v_i(g)$.`,
    exemple: T`Identical valuations $(3, 3, 2, 1)$. Alice $\{3\}$, Bob $\{3, 2, 1\}$: removing 3 leaves $3 \le 3$, and $3 \le 3$, so EFL; removing 1 leaves $5 > 3$, so not EFX.` },
  "EFX>EFR": { pont: P(LB, "EFX>EFR", [[T`an average is at most the maximum`]]),
    question: T`What remains on average in Bob’s bundle when a random good is removed? And in the worst case?`,
    preuve: "EFX holds for every removed good, hence also on average over a random good.",
    exemple: T`Identical valuations $(4, 3, 1)$. Alice $\{3\}$, Bob $\{4, 1\}$: on average $(1 + 4)/2 = 2.5 \le 3$ remains, so EFR; removing 1 leaves $4 > 3$, so not EFX.` },
  "EFL>EF1": { pont: P(LB, "EFL>EF1", [
      T`If EFL holds through its second condition, the good $g$ it provides works: that is EF1’s condition. Otherwise $A_j$ contains at most one good $h$ that $i$ values positively: remove $h$ (or any good if there is none).`,
      [T`the remaining goods are worth 0 to $i$: additivity`, T`non-negative values`]]),
    hyp: [H_ADD, "values ≥ 0"],
    question: T`Which good should be removed from Bob for Alice to stop envying him? Is that good worth less than Alice’s bundle?`,
    preuve: T`The good $g$ given by EFL works for EF1; and if $|A_j| \le 1$, removing the only good leaves 0.`,
    exemple: T`Identical valuations $(2, 1, 1)$. Alice $\{1\}$, Bob $\{2, 1\}$: removing 2 leaves $1 \le 1$, so EF1; but no good of Bob’s satisfies both EFL conditions.` },
  "EFR>EF1": { pont: P(LB, "EFR>EF1", [[T`a minimum is at most the average`], T`The good achieving this minimum works for EF1.`]),
    question: T`Which removal from Bob erases Alice’s envy? What remains in Bob’s bundle on average?`,
    preuve: T`An average is at least the minimum: one of the removed goods leaves at most the average, hence at most $v_i(A_i)$.`,
    exemple: T`Identical valuations $(2, 1, 1)$. Alice $\{1\}$, Bob $\{2, 1\}$: EF1 (removing 2 leaves 1), but on average $(1 + 2)/2 = 1.5 > 1$ remains.` },
  "EF1>PROP1": { pont: P(LB, "EF1>PROP1", [
      T`Let $g^*$ be a good outside $A_i$ of maximum value for $i$ (any one if there are several: only its value matters). For each $j \ne i$, EF1 gives a good $g_j \in A_j$.`,
      [T`EF1 and additivity`, T`$g_j \notin A_i$, so $v_i(g_j) \le v_i(g^*)$`],
      [T`(2) summed over the $n - 1$ other agents, plus $v_i(A_i)$; additivity`],
      [T`(3), rearranged`, T`$v_i(g^*) \ge 0$`]]),
    hyp: [H_ADD, "values ≥ 0"],
    question: T`What is Alice’s proportional share? How many goods must be removed from Bob for her to stop envying him?`,
    preuve: T`For each $j$: $v_i(A_i) \ge v_i(A_j) - v_i(g^*)$, with $g^*$ a favourite good of $i$ outside $A_i$. Summing over $j$: $n \cdot v_i(A_i) \ge v_i(M) - (n - 1)\, v_i(g^*)$, hence $v_i(A_i) + v_i(g^*) \ge v_i(M)/n$.`,
    exemple: T`Two agents, four goods worth 1. Alice $\{1\}$, Bob $\{1, 1, 1\}$: with one more good, Alice reaches 2, her share (PROP1); but removing one good from Bob still leaves him $2 > 1$.` },
  "EQ>EQX": { hyp: [H_MONO],
    question: "Compare Alice’s and Bob’s utilities, then compare again after removing Alice’s good.",
    preuve: T`Removing a good can only lower $v_j(A_j)$.`,
    exemple: T`One good, two agents who value it at 1. Alice has it: removing the only good leaves $0 \le 0$, so EQX; but $1 \ne 0$.` },
  "EQX>EQ1": { pont: P(LB, "EQX>EQ1", [TOUT_IMPLIQUE_UN]),
    question: T`Which of Bob’s goods can be removed so that his utility no longer exceeds Alice’s?`,
    preuve: "“For every good” implies “for some good”.",
    exemple: T`Identical values $(2, 1, 1)$. Alice $\{1\}$, Bob $\{2, 1\}$: removing 2 leaves $1 \le 1$ (EQ1), removing 1 leaves $2 > 1$ (not EQX).` },
  "MNW>EF1": { pont: P(LB, "MNW>EF1", [
      T`By contradiction: $i$ envies $j$ even after removing any good from $A_j$. Move from $j$ to $i$ a good $g \in A_j$ minimizing $v_j(g)/v_i(g)$.`,
      T`The exchange argument of [Caragiannis et al. (2019)](mnw19) shows that this ratio exceeds 1: the product of utilities increases, contradicting MNW.`]),
    hyp: [H_ADD],
    question: "Is this allocation EF1? Compare its product of utilities with that of the reverse allocation.",
    preuve: T`Exchange argument ([Caragiannis et al., 2019](mnw19)): if $i$ envies $j$ even after any removal, moving from $j$ to $i$ the good minimizing $v_j(g)/v_i(g)$ strictly increases the product.`,
    exemple: T`Alice $(3, 1)$, Bob $(1, 3)$. Alice $\{b\}$, Bob $\{a\}$ is EF1 (each has only one good), but its product is 1 versus 9 for Alice $\{a\}$, Bob $\{b\}$.` },
  "MNW>PO": { pont: P(LB, "MNW>PO", [
      [T`if $B$ dominates $A$: each factor increases or stays equal, one strictly increases, and the utilities in $A$ are positive`],
      T`Contradiction with MNW.`]),
    hyp: ["utilities > 0"],
    question: "Can Bob be made better off without lowering Alice’s utility? What is the product of utilities?",
    preuve: "An allocation that dominates another lowers nobody’s utility and raises someone’s: it has a larger product (when utilities are positive).",
    exemple: T`Alice $(2, 2)$, Bob $(1, 1)$. Giving everything to Alice maximizes the sum, so it is PO; but the product is 0.` },
  "fPO>PO": { pont: P(LB, "fPO>PO", [T`An integral allocation is a fractional allocation in which every $x_{i,g}$ is 0 or 1: if nothing in $\mathcal{F}$ dominates $A$, nothing in $\mathcal{A}_n(M)$ does either.`]),
    question: T`Look for an exchange of whole goods that suits both, then a fractional exchange (part of $a$ for part of $b$).`,
    preuve: "An integral allocation is a special case of a fractional allocation: if nothing fractional dominates it, nothing integral does either.",
    exemple: T`Alice $(6, 2)$, Bob $(4, 3)$. Alice $\{b\}$, Bob $\{a\}$ is PO, but giving Bob 20% of $b$ in exchange for 10% of $a$ gives $2.2$ and $4.2$: not fPO.` },
  "USW>PO": { pont: P(LB, "USW>PO", [[T`if $B$ dominates $A$: nobody loses and someone gains`], T`Contradiction with USW.`]),
    question: "Can one agent be made better off without taking from the other? Compare the sum of utilities with the one where Alice gets everything.",
    preuve: T`If $B$ dominates $A$, nobody loses and someone gains, so $\sum_i v_i(B_i) > \sum_i v_i(A_i)$: $A$ did not maximize the sum.`,
    exemple: T`Alice $(2, 2)$, Bob $(1, 1)$. One good each is PO (giving Alice more requires taking from Bob), but the sum is 3 versus 4 when Alice gets everything.` },
  "Leximin>PO": { pont: P(LB, "Leximin>PO", [{ f: T`v_{(k)}(B) \ge v_{(k)}(A) \quad \text{for all } k`,
      t: T`If $B$ dominates $A$, sorting both utility vectors preserves the componentwise inequality; since the sums differ, it is strict for at least one $k$. So $B$ beats $A$ in the leximin order.` }]),
    question: "Can Bob be made better off without taking from Alice? Compare the utility of the worst-off agent here and with one good each.",
    preuve: T`If $B$ dominates $A$, every utility in $B$ is $\ge$ the one in $A$, so the sorted vector of $B$ is componentwise $\ge$ that of $A$, and strictly larger somewhere (the sums differ): $B$ beats $A$ in the leximin order.`,
    exemple: T`Alice $(2, 2)$, Bob $(1, 1)$. Giving everything to Alice is PO (it is the maximum sum), but the worst-off agent has 0, versus 1 when each gets one good.` },
  "Leximin>EGW": { pont: P(LB, "Leximin>EGW", [T`The first component of the sorted vector is the smallest utility. The leximin order compares it first: a leximin allocation therefore maximizes the minimum.`]),
    preuve: "Leximin compares the smallest utility first: a leximin allocation therefore maximizes the minimum.",
    exemple: "Chloé likes no good: every allocation has a zero minimum, so all of them maximize the min, even the one giving everything to Chloé. Leximin then breaks the tie in favour of Alice and Bob." },
  "EFX>EEFX": { pont: P(LB, "EFX>EEFX", [T`Choose to imagine the actual split, $B_j = A_j$: the others’ bundles do partition what remains. For this choice, the EEFX condition is exactly EFX.`]),
    question: "Is Alice EFX towards Bob? Imagine another split of Bob’s and Chloé’s goods for which she would be.",
    preuve: T`Take $B_j = A_j$: the actual allocation is one of the splits $i$ can imagine, and it is EFX.`,
    exemple: T`Alice values $(2, 1, 1, 1)$. Alice $\{g_4\}$, Bob $\{g_1, g_2\}$, Chloé $\{g_3\}$: not EFX (Bob without $g_2$ is worth $2 > 1$). But Alice can imagine Bob $\{g_1\}$ and Chloé $\{g_2, g_3\}$: Bob without $g_1$ is worth 0, Chloé without one good is worth $1 \le 1$. At least 3 agents are needed: with 2, EEFX = EFX.` },

  "EQ~EF": {
    question: "Compare Alice’s and Bob’s utilities (EQ), then what Alice has with what she sees in Bob’s bundle (EF).",
    preuve: "EF compares bundles through the eyes of a single agent; EQ compares the satisfaction of two agents. They coincide when all agents have the same valuation.",
    exemple: T`Normalized values: Alice $(0.6,\ 0.4)$, Bob $(0.4,\ 0.6)$. Alice $\{b\}$, Bob $\{a\}$: $0.4 = 0.4$ (EQ), but Alice prefers $\{a\}$ ($0.6$). Conversely, Alice $\{a\}$, Bob $\{b\}$ is EF without being EQ if Bob valued $(0.1,\ 0.9)$.` },
  "EQX~EFX": {
    preuve: T`Same difference: EFX removes a good and compares with $v_i$, EQX removes a good and compares with $v_j$. Identical if the valuations are.`,
    exemple: "Independent notions in general: build an example along the lines of EF / EQ, with different valuations." },
  "EQ1~EF1": {
    preuve: "Same difference as between EF and EQ, at the “up to one good” level.",
    exemple: "Both always exist, but EF1 + PO always exists whereas EQ1 + PO can fail when some values are zero (Example 5 of the [survey](survey))." },

  "EF1≈PMMS": { pont: P(LB, "EF1≈PMMS", [
      T`Fix $j$, and $g$ the good EF1 removes from $A_j$. In every cut $(P, Q) \in \mathcal{A}_2(A_i \cup A_j)$, one of the pieces does not contain $g$.`,
      [T`the piece without $g$ is contained in $A_i \cup (A_j \setminus \{g\})$: monotonicity and additivity`],
      T`This holds for every cut, so $\mu_i^2(A_i \cup A_j) \le 2\, v_i(A_i)$.`]),
    hyp: [H_ADD, H_MONO], arrivee: { q: POUR_TOUT_IJ },
    preuve: T`Pair $i, j$, and $g$ the good EF1 removes from $A_j$. In every cut $(P, Q)$ of $A_i \cup A_j$, one piece contains $g$; the other is worth at most $v_i(A_i) + v_i(A_j \setminus \{g\}) \le 2\, v_i(A_i)$. Hence $\mu_i^2(A_i \cup A_j) \le 2\, v_i(A_i)$.`,
    exemple: "Tight factor ([Amanatidis, Birmpas and Markakis, 2018](abm18), Prop. 3.8)." },
  "EF1≈MMS": { pont: P(LB, "EF1≈MMS", [
      [T`EF1 for every other agent $j$, removing the good $g_j$; additivity`],
      [T`removing one good and one agent does not lower the maximin share (delete the bundle that contained the good), applied $n - 1$ times`]]),
    hyp: [H_ADD, H_MONO], arrivee: { q: POUR_TOUT_I },
    preuve: T`Remove from every other agent $j$ the good $g_j$ given by EF1: what remains is $R = A_i \cup \bigcup_j (A_j \setminus \{g_j\})$, and $v_i(R) \le n \cdot v_i(A_i)$. Lemma: removing one good and one agent does not lower the maximin share (delete the bundle that contained the good). Applying it $n - 1$ times, $\mu_i \le \mu_i^1(R) = v_i(R) \le n \cdot v_i(A_i)$.`,
    exemple: "Tight factor (Prop. 3.6). The guarantee collapses as n grows." },
  "EFX≈PMMS": { pont: P(LB, "EFX≈PMMS", [
      T`By contradiction: write $\mu = \mu_i^2(A_i \cup A_j)$ and suppose $v_i(A_i) < \tfrac23 \mu$.`,
      [T`both pieces of the best cut are worth at least $\mu$, so $2\mu \le v_i(A_i) + v_i(A_j)$ (additivity)`, T`contradiction hypothesis`],
      [T`EFX and additivity`, T`(2) and the contradiction hypothesis`],
      T`If $|A_j| \ge 2$, removing one good leaves another good worth more than $v_i(A_i)$: contradiction with EFX. If $A_j = \{g\}$, the piece without $g$ is contained in $A_i$, so $\mu \le v_i(A_i)$: contradiction.`]),
    hyp: [H_ADD], arrivee: { q: POUR_TOUT_IJ },
    preuve: T`Pair $i, j$, $\mu = \mu_i^2(A_i \cup A_j)$, and suppose $v_i(A_i) < 2\mu/3$. Since $2\mu \le v_i(A_i) + v_i(A_j)$, we get $v_i(A_j) > 4\mu/3$; by EFX, every good $g$ of $A_j$ is worth $v_i(g) \ge v_i(A_j) - v_i(A_i) > 2\mu/3$. If $|A_j| \ge 2$, removing one good leaves another good $> 2\mu/3 > v_i(A_i)$: contradiction with EFX. If $A_j = \{g\}$, the piece without $g$ is contained in $A_i$, so $\mu \le v_i(A_i)$: contradiction.`,
    exemple: "Tight factor (Prop. 3.7)." },
  "EFX≈MMS": { pont: P(LB, "EFX≈MMS", [T`Result of [Amanatidis, Birmpas and Markakis (2018)](abm18), Prop. 3.3 and 3.4. The proof studies the structure of “large” goods and is much longer.`]),
    hyp: [H_ADD], arrivee: { q: POUR_TOUT_I, f: T`v_i(A_i) \ge \tfrac47\, \mu_i \qquad \big(\tfrac23 \text{ if } n \le 3\big)` },
    preuve: T`$\tfrac23$-MMS for $n \le 3$ (tight), $\tfrac47$-MMS for $n \ge 4$ ([Amanatidis et al., 2018](abm18), Prop. 3.3 and 3.4). The proof studies the structure of “large” goods and is much longer.`,
    exemple: T`Almost tight: one cannot exceed $\tfrac{8}{13}$ for $n = 4$, nor about $0.59$ as $n$ grows. The paper’s surprise: PMMS, though stronger than EFX, does not guarantee more in terms of MMS.` },
  "EFL≈GMMS": { pont: P(LB, "EFL≈GMMS", [T`Result of [Barman, Biswas, Krishnamurthy and Narahari (2018)](gmms18), who introduce EFL for this purpose. The argument resembles EF1 ⇒ ½-PMMS, applied within each group of agents.`]),
    hyp: [H_ADD], arrivee: { q: T`For every group of agents $T \subseteq N$ and every agent $i \in T$:` },
    preuve: T`Result of [Barman, Biswas, Krishnamurthy and Narahari (2018)](gmms18), who introduce EFL for this purpose; the argument resembles EF1 ⇒ $\tfrac12$-PMMS, applied to each group of agents.`,
    exemple: T`Since an EFL allocation always exists and is computable in polynomial time, $\tfrac12$-GMMS comes for free. The best known existence factor for GMMS is $\tfrac47$.` },
  "MNW≈MMS": { pont: P(LB, "MNW≈MMS", [T`Theorem 4.1 of [Caragiannis et al. (2019)](mnw19). The factor is of order $1/\sqrt n$.`]),
    hyp: [H_ADD], arrivee: { q: POUR_TOUT_I },
    preuve: T`Theorem 4.1 of [Caragiannis et al. (2019)](mnw19): every MNW allocation is $\dfrac{2}{1 + \sqrt{4n - 3}}$-MMS, a factor of order $1/\sqrt n$.`,
    exemple: T`Tight factor. For $n = 2$ it equals $\varphi - 1 \approx 0.618$, which gives the arrow MNW ⇒ $0.618$-PMMS.` },
  "MNW≈PMMS": { alpha: "0.618", pont: P(LB, "MNW≈PMMS", [
      T`Restriction: if $A$ maximizes the product, the sub-allocation $(A_i, A_j)$ also maximizes the product on the small problem “two agents, goods $A_i \cup A_j$” (otherwise, replacing it would increase the global product).`,
      T`Apply to this two-agent problem the guarantee MNW ⇒ MMS ([Caragiannis et al.](mnw19), Th. 4.1).`]),
    hyp: [H_ADD], arrivee: { q: POUR_TOUT_IJ },
    preuve: T`1. Restriction: if $A$ maximizes the product, then for every pair $i, j$, the sub-allocation $(A_i, A_j)$ also maximizes the product on the small problem “two agents, goods $A_i \cup A_j$” (otherwise, replacing it would increase the global product). 2. For $n$ agents, an MNW allocation is $\frac{2}{1 + \sqrt{4n - 3}}$-MMS ([Caragiannis et al.](mnw19), Th. 4.1). 3. With $n = 2$: $\frac{2}{1 + \sqrt5} = \frac{\sqrt5 - 1}{2} = \varphi - 1 \approx 0.618$. Hence $v_i(A_i) \ge 0.618 \cdot \mu_i^2(A_i \cup A_j)$: this is $0.618$-PMMS (Corollary 4.7).`,
    exemple: T`The factor is tight: for every $\varepsilon > 0$, some instances have no $(0.618 + \varepsilon)$-PMMS MNW allocation. And the guarantee does not extend to EFX: MNW gives no constant approximation of EFX ([Amanatidis et al., IJCAI 2020](efxstories20)). The known $0.618$-EFX comes from another algorithm (envy-cycle elimination, [Amanatidis, Markakis and Ntokos, 2020](birds20)).` },

  "EF1⊘EFX": {
    question: T`Which removal from Bob erases Alice’s envy? And if the other good is removed? What happens as $\varepsilon \to 0$?`,
    preuve: T`Identical valuations $(1, \varepsilon, \varepsilon)$. Alice $\{\varepsilon\}$, Bob $\{1, \varepsilon\}$. EF1: removing 1 leaves $\varepsilon \le \varepsilon$. But removing $\varepsilon$ leaves 1, and $\varepsilon \ge \alpha \cdot 1$ fails as soon as $\varepsilon < \alpha$. Since $\varepsilon$ can be as small as we like, no $\alpha > 0$ works.` },
  "MNW⊘EFX": {
    preuve: T`There are instances where the MNW allocation is only $\tfrac1w$-EFX, with $w$ as large as we like.`,
    exemple: "[Amanatidis et al., “Maximum Nash welfare and other stories about EFX”, IJCAI 2020](efxstories20). MNW is however EFX for two-valued valuations." },
  "MMS⊘EF1": {
    question: "What is everyone’s maximin share with three agents and two goods? Does Alice still envy Bob after one removal?",
    preuve: T`Three agents, two goods worth 1 to everyone. Every cut into three bundles leaves one empty, so $\mu = 0$ for everyone, and any allocation is MMS. Give both goods to Bob: Alice still sees $1 > 0$ after one removal, so not $\beta$-EF1, whatever $\beta$.`,
    exemple: T`[Amanatidis et al., 2018](abm18), Prop. 4.7 (true even for $\alpha$-MMS).` },
  "MMS⊘PMMS": {
    question: T`What is $\mu_i$ for everyone? And Alice’s maximin share for the pair Alice–Bob?`,
    preuve: T`Same instance: three agents, two goods worth 1, Bob has everything, and the allocation is MMS ($\mu = 0$). For the pair Alice and Bob, the cut $\{a\} \mid \{b\}$ gives $\mu^2 = 1$, while Alice has 0.` },
  "MMS⊘EFX": {
    question: "Is the allocation MMS? Does Alice still envy Bob after removing any good?",
    preuve: T`Same instance: Bob has both goods and the allocation is MMS. Alice removes one of them and still sees 1, while she has 0: not $\beta$-EFX, whatever $\beta > 0$.`,
    exemple: T`[Amanatidis et al., 2018](abm18), Cor. 4.9. Compare: exact PMMS ⇒ EFX, but $\alpha$-PMMS ⇏ $\beta$-EFX (Prop. 4.8).` },
  "USW⊘EF1": {
    question: "Does this allocation maximize the sum? Does Bob still envy Alice after one removal?",
    preuve: T`Alice $(2, 2)$, Bob $(1, 1)$. The only maximum-sum allocation gives everything to Alice. Bob removes one good from Alice and still sees 1, while he has 0: $0 \ge \alpha \cdot 1$ fails for every $\alpha > 0$.`,
    exemple: "This is the basic example of the price of fairness: imposing EF1 lowers the sum from 4 to 3." },
  "EGW⊘EF1": {
    question: "What is the best possible minimum? Does this allocation achieve it? How much does Alice see in Bob’s bundle after one removal?",
    preuve: T`Alice values $m$ goods at 1; Bob values $g_1$ at 1 and the others at 0. The minimum is at most 1 (Bob cannot exceed 1). Bob $\{g_1, \dots, g_{m-1}\}$, Alice $\{g_m\}$ achieves this max-min, but Alice sees $m - 2$ in Bob’s bundle after removing one good, versus 1 for her: not $\alpha$-EF1 as soon as $m > 2 + 1/\alpha$.`,
    exemple: "The flaw comes from non-uniqueness: many allocations share the same minimum, and EGW ignores the other agents." },
  "EGW⊘MMS": {
    question: "Does this allocation achieve the max-min? What is Alice’s maximin share with two agents?",
    preuve: T`Same example: with 2 agents, Alice’s maximin share is $\lfloor m/2 \rfloor$, but the max-min allocation above gives her only 1: not $\alpha$-MMS as soon as $\lfloor m/2 \rfloor > 1/\alpha$.`,
    exemple: "Maximizing the minimum protects the worst-off in terms of raw values, not each agent relative to their own share." },
};

/* ---------------------------------------------------------------- Chores map */
const EN_NOTIONS_CORVEES = {
  EF: { src: T`adapted from [Survey, Def. 1](survey)`,
    def: "Nobody would rather swap their workload for someone else’s.", q: POUR_TOUT_IJ,
    note: "A single chore for two agents is enough to rule it out: the one holding it envies the one with nothing. With chores, one envies whoever has the least work." },
  EFX: { src: T`[Survey, Def. 21](survey)`,
    def: "Envy disappears whichever chore I remove from <b>my own</b> bundle, even the lightest.", q: POUR_TOUTE_C_I,
    note: T`With zero costs, one distinguishes EFX ($g$ with cost $> 0$) and $\mathrm{EFX}_0$ (any $g$). Not always, even when additive: [He and Tao (2026, preprint)](hetao26) build, for every $n \ge 4$, an instance with no EFX allocation, using only three cost values (example: 4 agents, 13 chores, costs in $\{1, 7, 20\}$). For monotone (superadditive) costs, non-existence was known from 3 agents on ([Christoforidis and Santorinaios, IJCAI 2024](cs24)). Open: 3 agents, additive. Approximations: 2-EFX for 3 agents, and a constant factor in general.` },
  EF1: { src: T`[Survey, Def. 21](survey)`,
    def: "If I envy someone, removing one well-chosen chore from my own bundle is enough to erase my envy.", q: IL_EXISTE_C_I,
    note: T`Round-robin still works: on their turn, each agent takes the remaining chore that costs them least. Flipping the signs of the goods definition (removing from the other’s bundle) does not work. EF1 + PO always exists for additive costs: a major open problem solved by [Mahara (preprint, 2025)](mahara25), after special cases (3 agents, bi-valued costs).` },
  PROP: { src: T`adapted from [Survey, Def. 2](survey)`,
    def: T`Everyone bears at most $1/n$ of the total work, measured with their own costs.`, q: POUR_TOUT_I,
    note: "The inequality is reversed compared to goods. Fails with a single chore for two agents." },
  PROPX: { def: "Removing any one of my chores would bring me below my fair share.",
    q: T`For every agent $i$ and every chore $g \in A_i$:`,
    note: T`Striking difference with goods: PROPX always exists for chores ([Li, Li and Wu, 2022](liliwu22)), whereas it can fail for goods. PROPm is therefore useless here.` },
  PROP1: { src: T`adapted from [Survey, Def. 12](survey)`,
    def: "Removing one well-chosen chore from me is enough to bring me under my fair share.",
    q: T`For every agent $i$ with $A_i \neq \varnothing$, there is a chore $g \in A_i$ such that:` },
  MMS: { def: T`Everyone bears at most what they would suffer by cutting $n$ bundles themselves and receiving the heaviest.`, q: POUR_TOUT_I,
    note: T`Max and min swap: I cut so that the worst (heaviest) bundle is as light as possible. Non-existence: [Aziz et al., 2017](aziz17); counterexample of [Feige, Sapir and Tauber, 2021](fst21). Best known guarantee: $\tfrac{13}{11}$-MMS ([Huang and Segal-Halevi, 2023](hsh23)). Here $\alpha \ge 1$: a cost up to $\alpha \cdot \mu_i$ is accepted.` },
  EQ: { def: "Everyone suffers the same cost, each measured with their own costs.", q: POUR_TOUT_IJ,
    note: T`Compares costs across agents: costs must be normalized (for instance $c_i(M) = 1$).` },
  EQX: { def: "The cost gap disappears whichever chore is removed from the most loaded agent.", q: POUR_TOUTE_C_I,
    note: T`Computable in polynomial time ([Freeman, Sikdar, Vaish and Xia, 2020](fsvx20), Prop. 3). But EQX + PO can fail with 2 agents and 3 chores, and deciding whether it exists is strongly NP-hard (their Th. 1).` },
  EQ1: { def: "Removing one well-chosen chore from the most loaded agent is enough to erase the cost gap.", q: IL_EXISTE_C_I,
    note: T`EQ1 + PO also exists, with a pseudo-polynomial algorithm ([Freeman et al., 2020](fsvx20), Th. 2). The opposite of goods, where EQ1 + PO can fail when some values are zero. Difference with EF1: on the right-hand side it is $c_j$, the cost as seen by $j$.` },
  PO: { src: T`adapted from [Survey, Def. 6](survey)`,
    def: "Impossible to relieve someone without burdening someone else.", q: PAS_DE_B,
    f: T`\begin{aligned} &\forall i,\ c_i(B_i) \le c_i(A_i) \\ \text{and } &\exists i,\ c_i(B_i) < c_i(A_i) \end{aligned}`,
    note: "If all agents have the same costs, the sum is constant and every allocation is PO." },
  fPO: { src: T`adapted from [Survey, § 7.1](survey)`,
    def: "PO even against allocations that cut chores into pieces.", q: PAS_DE_X,
    f: T`\begin{aligned} &\forall i,\ c_i(x_i) \le c_i(A_i) \\ \text{and } &\exists i,\ c_i(x_i) < c_i(A_i) \end{aligned}`,
    note: T`Can be checked by linear programming. [Mahara (2025)](mahara25)’s paper on EF1 + PO also covers EF1 + fPO: see it for the exact result.` },
  USW: { src: "standard definition",
    def: "Pick the allocation that minimizes the sum of costs.",
    note: "Each chore goes to the agent for whom it costs least (polynomial time). Nash welfare (MNW) has no natural analogue for chores: minimizing the product of costs does not give EF1." },
  EGW: { src: T`adapted from [Survey, § 7.2](survey)`,
    def: "Pick the allocation that minimizes the cost of the most loaded agent.",
    note: T`This is exactly scheduling on unrelated machines to minimize the makespan ($R \,\|\, C_{\max}$): NP-hard, 2-approximable ([Lenstra, Shmoys and Tardos, 1990](lst90)). It is also the “K-fair” criterion of Hermelin et al. A minimizer is only weakly PO; leximin refines it.` },
  Leximin: { src: T`adapted from [Survey, § 4.1](survey)`,
    def: "Minimize the cost of the most loaded agent, then of the second most loaded, and so on.",
    note: T`For chores, leximin does not even guarantee EQ1 ([Freeman et al., 2020](fsvx20), Ex. 2), and computing it is NP-hard.` },
};

const LC = LIENS_CORVEES;
const EN_LIENS_CORVEES = {
  "EF>PROP": { pont: P(LC, "EF>PROP", [undefined, T`Divide by $n$.`]), hyp: [H_ADD],
    question: T`Check that everyone bears at most a third of their total cost, then compare Alice’s load with Chloé’s.`,
    preuve: T`Sum $c_i(A_i) \le c_i(A_j)$ over all $j$: $n \cdot c_i(A_i) \le \sum_j c_i(A_j) = c_i(M)$.`,
    exemple: T`Alice bears $2 = 6/3$, Bob 0: PROP (Chloé’s costs do not matter, she bears nothing). But Alice envies Chloé ($2 > 0$).` },
  "EF>EFX": { hyp: [H_MONO],
    question: "Does Alice envy Bob? And if she removes her only chore?",
    preuve: T`Removing a chore from one’s bundle can only lighten it: $c_i(A_i \setminus \{g\}) \le c_i(A_i) \le c_i(A_j)$.`,
    exemple: T`Alice removes her chore: $0 \le 0$, so EFX; but she envies Bob ($1 > 0$).` },
  "EFX>EF1": { pont: P(LC, "EFX>EF1", [T`“For every chore of $A_i$” implies “for some chore of $A_i$”, as soon as $A_i \ne \varnothing$.`]),
    question: "Which chore can Alice remove from her bundle to stop envying Bob? Which one is not enough?",
    preuve: T`“For every chore of $A_i$” implies “for some chore of $A_i$” ($A_i$ non-empty).`,
    exemple: T`Removing $a$ leaves $1 \le 1$ (EF1), removing $b$ leaves $2 > 1$ (not EFX).` },
  "EFX>PROPX": { pont: P(LC, "EFX>PROPX", [undefined, [T`sum the $n$ EFX inequalities and (m)`],
      T`For goods, EFX does not imply PROPX: the inequality (m), against oneself, makes the difference.`]),
    hyp: [H_ADD, H_MONO],
    question: T`What is Alice’s proportional share? After removing one chore, is she below it? And against Chloé?`,
    preuve: T`Fix $g \in A_i$. EFX gives $c_i(A_i \setminus \{g\}) \le c_i(A_j)$ for every $j \ne i$, and it is trivial for $j = i$. Summing over the $n$ agents: $n \cdot c_i(A_i \setminus \{g\}) \le c_i(M)$. Surprise: for goods, EFX does not imply PROPX.`,
    exemple: T`Removing one chore leaves Alice with $1 \le 4/3$ (PROPX), but $1 > 0$ against Chloé (not EFX). Bob only bears zero-cost chores; his other costs do not matter.` },
  "EF1>PROP1": { pont: P(LC, "EF1>PROP1", [
      T`Let $g^*$ be a chore of $A_i$ of maximum cost for $i$ (any one if there are several). For each $j \ne i$, EF1 gives a chore $g_j \in A_i$.`,
      [T`additivity: removing the heaviest chore lightens at least as much`],
      [T`EF1 for all $j$, summed as in EFX ⇒ PROPX`]]),
    hyp: [H_ADD, "costs ≥ 0"],
    question: T`Remove one chore from Alice: does she drop below her share $4/3$? Does she still envy Chloé?`,
    preuve: T`Same computation as EFX ⇒ PROPX, with the chore $g$ given by EF1: $n \cdot c_i(A_i \setminus \{g\}) \le c_i(M)$.`,
    exemple: T`Alice is one chore away from $4/3$ (PROP1), but envies Chloé even after removing a chore ($1 > 0$).` },
  "PROP>PROPX": { hyp: [H_MONO],
    question: "Does Alice bear at most half of the work? And without her chore?",
    preuve: T`Removing a chore can only lower the cost: $c_i(A_i \setminus \{g\}) \le c_i(A_i) \le c_i(M)/n$.`,
    exemple: T`Alice bears $1 > 1/2$ (not PROP), but without her chore she bears 0 (PROPX).` },
  "PROPX>PROP1": { pont: P(LC, "PROPX>PROP1", [TOUTE_IMPLIQUE_UNE]),
    question: "Everyone’s share is 2. Which chore should be removed from Alice to get there? Which one is not enough?",
    preuve: "“For every chore” implies “for some chore”.",
    exemple: T`Removing $a$ leaves $2 \le 2$ (PROP1), removing $b$ leaves $3 > 2$ (not PROPX).` },
  "PROP>MMS": { pont: P(LC, "PROP>MMS", [[T`the heaviest of the $n$ bundles weighs at least the average (additivity)`], [T`(1), for the best cut`]]),
    hyp: [H_ADD],
    question: T`What is $\mu$ when a single chore is cut into two bundles? Compare Alice’s load with $\mu$, then with half of the work.`,
    preuve: T`In every partition into $n$ bundles, the heaviest weighs at least the average: $\mu_i \ge c_i(M)/n$. So $c_i(A_i) \le c_i(M)/n \le \mu_i$. For goods one had to go through APS; here the link is direct.`,
    exemple: T`One bundle necessarily contains the chore, so $\mu = 1$. Alice bears $1 \le \mu$ (MMS), but $1 > 1/2$ (not PROP).` },
  "EQ>EQX": { hyp: [H_MONO],
    question: "Do Alice and Bob bear the same cost? And if Alice removes her chore?",
    preuve: T`Removing a chore can only lower $c_i(A_i)$.`,
    exemple: T`$1 \ne 0$, so not EQ; without her chore, $0 \le 0$, so EQX.` },
  "EQX>EQ1": { pont: P(LC, "EQX>EQ1", [TOUTE_IMPLIQUE_UNE]),
    question: "Which chores can Alice remove so as not to bear more than Bob?",
    preuve: "“For every chore” implies “for some chore”.",
    exemple: T`Removing $a$ leaves $1 \le 1$ (EQ1), removing $b$ leaves $2 > 1$ (not EQX).` },
  "fPO>PO": { pont: P(LC, "fPO>PO", [T`An integral allocation is a fractional allocation in which every $x_{i,g}$ is 0 or 1: if nothing in $\mathcal{F}$ dominates $A$, nothing in $\mathcal{A}_n(M)$ does either.`]),
    question: T`Look for an exchange of whole chores that relieves both, then a fractional exchange (part of $a$ for part of $b$).`,
    preuve: "An integral allocation is a special case of a fractional allocation.",
    exemple: T`The costs are $(3, 2)$ and no integral allocation does better for both. But if Alice gives up 20% of $b$ and takes 50% of $a$, we get $(2.9,\ 1.8)$: not fPO.` },
  "USW>PO": { pont: P(LC, "USW>PO", [[T`if $B$ dominates $A$: nobody loses and someone gains`], T`Contradiction with USW.`]),
    question: "Can one agent be relieved without burdening the other? Compare the total cost with the one where Alice takes everything.",
    preuve: T`If $B$ dominates $A$, nobody loses and someone gains: $\sum_i c_i(B_i) < \sum_i c_i(A_i)$, so $A$ did not minimize the sum.`,
    exemple: T`One chore each costs $(1, 2)$: it is PO, but the sum is 3 versus 2 when Alice gets everything.` },
  "Leximin>PO": { pont: P(LC, "Leximin>PO", [{ f: T`c_{(k)}(B) \le c_{(k)}(A) \quad \text{for all } k`,
      t: T`If $B$ dominates $A$, sorting costs in decreasing order preserves the componentwise inequality, strict for at least one $k$: $B$ beats $A$ in the leximin order.` }]),
    question: "Can Alice be relieved without burdening Bob? Compare the cost of the most loaded agent here and with one chore each.",
    preuve: T`If $B$ dominates $A$, the sorted cost vector of $B$ is componentwise $\le$ that of $A$, and strictly smaller somewhere: $B$ beats $A$ in the leximin order.`,
    exemple: T`Giving everything to Alice costs $(2, 0)$: it is PO (the sum is constant), but the most loaded agent bears 2 versus 1.` },
  "Leximin>EGW": { pont: P(LC, "Leximin>EGW", [T`The first component of the sorted vector is the largest cost; leximin minimizes it first.`]),
    question: "What is the best possible maximum cost? Does this allocation achieve it? How could the small chores be better shared?",
    preuve: T`Leximin compares the largest cost first: a leximin-optimal vector therefore minimizes $\max_i c_i(A_i)$.`,
    exemple: T`Whoever has $h$ bears at least 10, and here the max is 10: it is min-max. Leximin would rather give 5 and 4 to Bob and Alice.` },
  "EQ~EF": {
    question: "Compare Alice’s and Bob’s costs (EQ), then Alice’s load with Bob’s as seen by Alice (EF).",
    preuve: "EF compares two bundles with the costs of a single agent; EQ compares the costs borne by two agents. Identical if everyone has the same costs.",
    exemple: T`$0.6 = 0.6$ (EQ), but Alice would prefer $b$ ($0.4$).` },
  "EQX~EFX": {
    preuve: T`EFX removes a chore and compares with $c_i$, EQX removes a chore and compares with $c_j$.`,
    exemple: "Independent in general: adapt the EF / EQ example." },
  "EQ1~EF1": {
    preuve: "Same difference as between EF and EQ, at the “up to one chore” level.",
    exemple: T`Both always exist, and for chores both are compatible with PO: EQ1 + PO ([Freeman et al., 2020](fsvx20)), EF1 + PO ([Mahara, 2025](mahara25)).` },
  "PROP1≈MMS": { pont: P(LC, "PROP1≈MMS", [[T`see PROP ⇒ MMS`], [T`$g$ lies in a bundle of the best cut, which weighs at most $\mu_i$`], [T`(1) and (2)`]]),
    hyp: [H_ADD, "costs ≥ 0"], arrivee: { q: POUR_TOUT_I },
    preuve: T`PROP1 gives $g \in A_i$ with $c_i(A_i \setminus \{g\}) \le c_i(M)/n \le \mu_i$. And $c_i(g) \le \mu_i$: the chore $g$ lies in a bundle of the best cut, which weighs at most $\mu_i$. Adding up: $c_i(A_i) \le 2\mu_i$. Since EF1 ⇒ PROP1, every EF1 allocation is also 2-MMS.`,
    exemple: T`Not necessarily tight. Dedicated algorithms do better: $\tfrac{13}{11}$-MMS ([Huang and Segal-Halevi, 2023](hsh23)).` },
  "USW⊘EF1": {
    question: "Does this allocation minimize the total cost? Does Alice still envy Bob after removing one chore?",
    preuve: T`The minimum total cost gives everything to Alice. She removes one chore and still bears 1, while Bob bears 0: $1 \le \alpha \cdot 0$ fails for every $\alpha$.`,
    exemple: "Basic example of the price of fairness for chores." },
  "EGW⊘EF1": {
    question: "What is the min-max? Does this allocation achieve it? How much does Bob still bear after removing one chore?",
    preuve: T`Whoever has $h$ bears at least 10, so the min-max is 10. Bob bears $9 \le 10$: the allocation is min-max. Bob removes one chore and still bears $8 > \alpha \cdot 0$: not $\alpha$-EF1, whatever $\alpha$.`,
    exemple: "Min-max only looks at the most loaded agent: the others can be very badly balanced. Leximin fixes this flaw." },
  "MMS⊘EF1": {
    question: T`What is $\mu$? Does everyone bear at most $\mu$? Does Bob still envy Chloé after removing one chore?`,
    preuve: T`The cut $\{a\} \mid \{b, c\} \mid \{d\}$ gives $\mu = 3$. Everyone bears at most 3 (MMS). Bob removes one chore and still bears $2 > \alpha \cdot 0$.`,
    exemple: "Same phenomenon as for goods: the maximin threshold is too loose to prevent envy." },
  "EF1⊘EFX": {
    question: T`Which chore must Alice remove to stop envying Bob? And if she removes the other one? What happens as $\varepsilon \to 0$?`,
    preuve: T`EF1: removing $a$ leaves $\varepsilon \le \varepsilon$. But removing $b$ leaves 1, and $1 \le \alpha \cdot \varepsilon$ fails as soon as $\varepsilon < 1/\alpha$.`,
    exemple: T`Since $\varepsilon$ can be as small as we like, no $\alpha$ works.` },
};

/* ---------------------------------------------------------------- Weighted map */
const EN_NOTIONS_PONDEREE = {
  WEF: { src: T`[Survey, Def. 18](survey)`,
    def: "Everyone compares what they have with what others have, in proportion to each one’s entitlement.", q: POUR_TOUT_IJ,
    note: T`With $s_i = 1/n$ for all, this is EF. A single good for two agents is still enough to rule it out.` },
  WEFX: { def: "Weighted envy disappears whichever good is removed from the envied bundle.", q: POUR_TOUT_G_J,
    note: T`May fail to exist even with 2 agents ([Hajiaghayi, Springer and Yami, 2023](hsy23)): in their counterexample one cannot exceed $0.786$-WEFX. Exists for identical valuations, or for 2 agents with integer weights. Contrast with equal entitlements, where EFX exists for 2 and 3 agents.` },
  WEF1: { src: T`[Survey, Def. 18](survey)`,
    def: "If I envy someone, taking entitlements into account, removing one well-chosen good from them is enough to erase my envy.", q: IL_EXISTE_G_J,
    note: T`Always exists: a weighted picking sequence, which generalizes round-robin, produces one ([Chakraborty, Igarashi, Suksompong and Zick, 2021](wef21)). WEF1 + PO also exists (pseudo-polynomial algorithm). Envy-cycle elimination, on the other hand, does not generalize. In the WEF(x, y) family of [Chakraborty, Segal-Halevi and Suksompong (2022)](csss22), WEF1 = WEF(1, 0); every WEF(x, 1 − x) always exists (with x = ½, this is Webster’s method for apportioning seats).` },
  WWEF1: { def: T`Like WEF1, but instead of removing the good from $j$, one may also give a copy of it to $i$.`, q: IL_EXISTE_G_J,
    f: T`\frac{v_i(A_i)}{s_i} \ge \frac{v_i(A_j \setminus \{g\})}{s_j} \quad \text{or} \quad \frac{v_i(A_i \cup \{g\})}{s_i} \ge \frac{v_i(A_j)}{s_j}`,
    note: T`Weak version introduced by [Chakraborty et al. (2021)](wef21). With equal entitlements, both conditions are equivalent (additive valuations) and we get back EF1.` },
  WPROP: { src: T`[CSS 2022, Def. 3.4](csss22)`,
    def: T`Everyone gets at least the fraction $s_i$ of the total value, by their own taste.`, q: POUR_TOUT_I,
    note: T`With $s_i = 1/n$, this is PROP. Fails with a single good for two agents.` },
  WPROP1: { def: T`I am at most one good, taken from someone else, short of my share $s_i \cdot v_i(M)$.`,
    q: T`For every agent $i$, there is a good $g \notin A_i$ such that:`,
    note: T`WPROP1 + PO exists: [Aziz, Moulin and Sandomirskiy (2020)](aziz20) compute one in polynomial time. In the WPROP(x, y) family of [Chakraborty, Segal-Halevi and Suksompong (2022)](csss22), WPROP1 = WPROP(0, 1).` },
  WMMS: { src: T`[Survey, Def. 19](survey)`,
    def: T`Each partition is judged by its worst ratio “bundle value / entitlement of its recipient”. The best partition gives the ratio $F_i$, and $i$’s share is $F_i \cdot s_i \cdot v_i(M)$.`, q: POUR_TOUT_I,
    note: T`Definition of [Farhadi et al. (2019)](farhadi19). Always $F_i \le 1$, so the WMMS share never exceeds $s_i \cdot v_i(M)$; with equal entitlements this is MMS. The best possible guarantee is $\tfrac1n$-WMMS and, surprisingly, plain round-robin achieves it. Unlike NMMS, $i$’s WMMS share depends on everyone’s entitlements.` },
  NMMS: { src: T`[CSS 2022, Def. 4.4](csss22)`,
    def: T`My usual maximin share, scaled to my entitlement: $n \cdot s_i$ times what I would guarantee by cutting $n$ bundles myself.`, q: POUR_TOUT_I,
    note: T`Defined by [Chakraborty, Segal-Halevi and Suksompong (2022)](csss22). It depends only on $i$’s entitlement, not on the others’. With equal entitlements, $n \cdot s_i = 1$ and we get back MMS. One cannot guarantee better than $\tfrac1n$-NMMS (their Th. 4.6), and WEF1 achieves it (Th. 4.8).` },
  APS: { def: T`An adversary sets non-negative prices summing to 1; with a budget equal to my entitlement $s_i$, I buy the best affordable bundle. $\mathrm{APS}_i$ is what I can guarantee against the worst prices.`, q: POUR_TOUT_I,
    note: T`A notion designed for unequal entitlements ([Babaioff, Ezra and Feige, 2021](aps21)): the same as on the goods map, with budget $s_i$ instead of $1/n$. Not always achievable, but everyone can be guaranteed $\tfrac35$ of their APS. The survey gives no direct link with WMMS: no arrow between the two.` },
  PO: { ...EN_NOTIONS_BIENS.PO, note: "Does not depend on entitlements: it is the same notion as on the goods map." },
  fPO: { ...EN_NOTIONS_BIENS.fPO, note: "Does not depend on entitlements: it is the same notion as on the goods map." },
  USW: { ...EN_NOTIONS_BIENS.USW, note: "The sum ignores entitlements: each good still goes to whoever likes it most." },
  MWNW: { src: T`[CSS 2022, Def. 3.11](csss22)`,
    def: "Pick the allocation that maximizes the product of utilities, each raised to the power of its entitlement.",
    note: T`With equal entitlements, this is MNW.` },
};

const LP = LIENS_PONDEREE;
const EN_LIENS_PONDEREE = {
  "WEF>WPROP": { pont: P(LP, "WEF>WPROP", [undefined, [T`WEF, summed over all agents`, T`entitlements sum to 1`], T`Multiply by $s_i$.`]),
    hyp: [H_ADD, "entitlements summing to 1"],
    question: T`Check that everyone has at least a third of their total value, then compare $v_{\text{Alice}}(A_{\text{Alice}})/s_{\text{Alice}}$ with what Alice sees in Bob’s bundle, divided by $s_{\text{Bob}}$.`,
    preuve: T`From $v_i(A_i)/s_i \ge v_i(A_j)/s_j$ we get $s_j \cdot v_i(A_i)/s_i \ge v_i(A_j)$. Summing over all $j$: $\frac{v_i(A_i)}{s_i} \sum_j s_j \ge v_i(M)$, and since $\sum_j s_j = 1$, $v_i(A_i) \ge s_i \cdot v_i(M)$.`,
    exemple: T`With equal entitlements, this is the example from the goods map: everyone has their third, but $3 / \tfrac13 = 9 < 6 / \tfrac13 = 18$.` },
  "WEF>WEFX": { hyp: [H_MONO],
    question: "Does Alice envy Bob, taking entitlements into account? And if Bob’s only good is removed?",
    preuve: T`Removing a good can only lower $v_i(A_j)$, hence the right-hand side.`,
    exemple: T`Removing $g$ leaves $0 \le 0$: WEFX. But $0 / \tfrac13 = 0 < 1 / \tfrac23 = 1.5$: not WEF.` },
  "WEFX>WEF1": { pont: P(LP, "WEFX>WEF1", [TOUT_IMPLIQUE_UN]),
    question: "With equal entitlements, which good should be removed from Bob to erase Alice’s envy? Which one is not enough?",
    preuve: T`“For every good of $A_j$” implies “for some good of $A_j$”.`,
    exemple: T`Removing $a$ leaves $1 \le 1$ (WEF1); removing $c$ leaves $2 > 1$ (not WEFX).` },
  "WEF1>WWEF1": { pont: P(LP, "WEF1>WWEF1", [T`WEF1 is the first of the two conditions of WWEF1, joined by “or”: whoever satisfies it satisfies WWEF1.`]),
    question: T`Remove a good from Bob: does Alice still envy him, taking entitlements into account? And if instead Alice is given a copy of one of Bob’s goods?`,
    preuve: "WEF1 is the first of the two conditions of WWEF1: whoever satisfies it satisfies WWEF1.",
    exemple: T`After one removal, $1 / 0.9 \approx 1.11 > 0 / 0.1 = 0$: not WEF1. With a copy of a good, Alice has $1 / 0.1 = 10 \ge 2 / 0.9 \approx 2.22$: WWEF1. Bob envies nobody.` },
  "WPROP>WPROP1": { hyp: [H_MONO],
    question: T`Does Alice have her share $s_{\text{Alice}} \cdot v(M)$? Would she reach it with Bob’s good?`,
    preuve: T`If $v_i(A_i) \ge s_i \cdot v_i(M)$, adding any good preserves the inequality.`,
    exemple: T`Alice has $0 < \tfrac12$: not WPROP. With $g$, she would have $1 \ge \tfrac12$: WPROP1.` },
  "WPROP>APS": { pont: P(LP, "WPROP>APS", [[T`additivity: $p^*(S) = v_i(S)/v_i(M)$`], [T`APS is a minimum over prices: at most its value against $p^*$, then (1)`]]),
    hyp: [H_ADD, T`$v_i(M) > 0$`],
    question: T`Which price prevents Alice from buying the good with her budget $s_{\text{Alice}} = \tfrac12$? Compare with her weighted share.`,
    preuve: T`$\mathrm{APS}_i$ is a minimum over prices; take $p^*_g = v_i(g)/v_i(M)$. An affordable bundle satisfies $p^*(S) = v_i(S)/v_i(M) \le s_i$, so $v_i(S) \le s_i \cdot v_i(M)$. Hence $\mathrm{APS}_i \le s_i \cdot v_i(M) \le v_i(A_i)$.`,
    exemple: T`Price 1 on $g$ deprives her of everything: $\mathrm{APS} = 0$, and Alice, who has nothing, is APS. But $0 < \tfrac12$: not WPROP.` },
  "WPROP>WMMS": { pont: P(LP, "WPROP>WMMS", [[T`a minimum of ratios is at most the ratio of the sums`, T`additivity and entitlements summing to 1`], [T`$F_i \le 1$, by (1) and (2) for every partition $B \in \mathcal{A}_n(M)$`]]),
    hyp: [H_ADD, "entitlements summing to 1"],
    question: T`What is $F_{\text{Alice}}$ when one of the two bundles is necessarily empty? Compare Alice’s WMMS share with her weighted share.`,
    preuve: T`For every partition $B$, $\min_j \frac{v_i(B_j)}{s_j \cdot v_i(M)} \le \frac{\sum_j v_i(B_j)}{\sum_j s_j \cdot v_i(M)} = 1$ (a minimum of ratios is at most the ratio of the sums). So $F_i \le 1$, and the WMMS share is at most $s_i \cdot v_i(M) \le v_i(A_i)$.`,
    exemple: T`Every partition leaves an empty bundle, so $F_{\text{Alice}} = 0$: the WMMS share is zero, and Alice receives it. But $0 < \tfrac12$: not WPROP.` },
  "fPO>PO": EN_LIENS_BIENS["fPO>PO"],
  "USW>PO": EN_LIENS_BIENS["USW>PO"],
  "MWNW>PO": { pont: P(LP, "MWNW>PO", [[T`if $B$ dominates $A$: each factor increases or stays equal, one strictly increases, and the utilities in $A$ are positive`], T`Contradiction with MWNW.`]),
    hyp: ["utilities > 0"],
    question: EN_LIENS_BIENS["MNW>PO"].question,
    preuve: T`If $B$ dominates $A$ (positive utilities), each factor $v_i(B_i)^{s_i}$ is at least $v_i(A_i)^{s_i}$, and one is strictly larger: the product increases.`,
    exemple: EN_LIENS_BIENS["MNW>PO"].exemple },
  "MWNW>WWEF1": { pont: P(LP, "MWNW>WWEF1", [T`Result of [Chakraborty et al. (2021)](wef21), generalizing the exchange argument of Caragiannis et al. (MNW ⇒ EF1). With unequal entitlements, the exchange no longer guarantees WEF1, only its weak version.`]),
    hyp: [H_ADD],
    question: "Is this allocation WWEF1? Compare its weighted product with that of the reverse allocation.",
    preuve: T`Result of [Chakraborty et al. (2021)](wef21), which generalizes the theorem of Caragiannis et al. (MNW ⇒ EF1) to unequal entitlements.`,
    exemple: T`Each agent has only one good: removing it leaves 0, so WEF1 and a fortiori WWEF1. But the product is $1^{1/2} \cdot 1^{1/2} = 1$, versus $3^{1/2} \cdot 3^{1/2} = 3$ for the reverse allocation: not MWNW.` },
  "WEF1≠WPROP1": {
    question: T`Check that the allocation is WEF1. Does Alice reach her share $s_{\text{Alice}} \cdot v(M)$ with one more good? And if all entitlements were $\tfrac14$?`,
    preuve: T`With equal entitlements, EF1 ⇒ PROP1. With unequal entitlements, the “up to one good” correction remains a whole good, whereas the shares become relative. [Chakraborty, Segal-Halevi and Suksompong (2022)](csss22) place WEF1 = WEF(1, 0) and WPROP1 = WPROP(0, 1) in two parameterized families: WEF(x, y) implies WPROP(x, y) (their Cor. 3.8), but WEF(x, 1 − x) does not imply WPROP(x′, 1 − x′) as soon as x′ ≠ x (Cor. 3.10).`,
    exemple: T`Each envied bundle contains a single good, and removing it leaves 0: nobody envies anybody up to one good, so WEF1. But with one more good, Alice would have $1 < \tfrac12 \cdot 3$: not WPROP1. With equal entitlements, the same allocation would be PROP1, since $1 \ge \tfrac14 \cdot 3$.` },
  "MWNW≠WEF1": {
    preuve: T`With equal entitlements, MNW ⇒ EF1 (Caragiannis et al.). With unequal entitlements, an allocation maximizing $\prod_i v_i(A_i)^{s_i}$ is not necessarily WEF1; it remains PO and WWEF1 ([Chakraborty et al., 2021](wef21)).`,
    exemple: "WEF1 + PO still always exists, but through another, pseudo-polynomial, algorithm." },
  "MWNW≠WPROP1": {
    question: "Why does an MWNW allocation give one good to each agent? Does Alice then reach her share with one more good?",
    preuve: T`With equal entitlements, MNW ⇒ EF1 ⇒ PROP1. With unequal entitlements, [Chakraborty, Segal-Halevi and Suksompong (2022)](csss22) (Th. 3.12) build, for every x, an instance with identical goods where no MWNW allocation is WPROP(x, 1 − x); with x = 0, this is WPROP1.`,
    exemple: T`If someone has nothing, the product $\prod_i v_i(A_i)^{s_i}$ is zero: the MWNW allocation therefore gives one good to each agent. With one more good, Alice would have 2, whereas her share is $\tfrac34 \cdot 4 = 3$: not WPROP1. This is their instance for x = 0, with 4 agents and entitlements proportional to $(3, \tfrac13, \tfrac13, \tfrac13)$.` },
  "WPROP>NMMS": { pont: P(LP, "WPROP>NMMS", [[T`the worst of the $n$ bundles is worth at most the average (additivity)`], [T`(1), multiplied by $n \cdot s_i$`]]),
    hyp: [H_ADD],
    question: T`What is $\mu$ for Alice, when one of the two bundles is necessarily empty? Compare her NMMS share with her weighted share.`,
    preuve: T`The maximin share is at most the average: $\mu_i \le v_i(M)/n$, so $n \cdot s_i \cdot \mu_i \le s_i \cdot v_i(M)$.`,
    exemple: T`$\mu = 0$, so Alice’s NMMS share is zero and she receives it. But $0 < \tfrac12$: not WPROP.` },
  "WEF1≈NMMS": { pont: P(LP, "WEF1≈NMMS", [T`Theorem 4.8 of [Chakraborty, Segal-Halevi and Suksompong (2022)](csss22): every WEF1 allocation is $\tfrac1n$-NMMS. The proof goes through a strengthened version of WPROP(1, 0) (their Lemma 4.7).`]),
    hyp: [H_ADD], arrivee: { q: POUR_TOUT_I },
    preuve: T`Theorem 4.8 of [Chakraborty, Segal-Halevi and Suksompong (2022)](csss22).`,
    exemple: T`Tight factor: one cannot guarantee better than $\tfrac1n$-NMMS (Th. 4.6). Since a WEF1 allocation always exists, so does a $\tfrac1n$-NMMS one.` },
  "WMMS≈NMMS": { pont: P(LP, "WMMS≈NMMS", [T`Theorem 4.12 of [Chakraborty, Segal-Halevi and Suksompong (2022)](csss22).`]),
    hyp: [H_ADD], arrivee: { q: POUR_TOUT_I },
    preuve: T`Theorem 4.12 of [Chakraborty, Segal-Halevi and Suksompong (2022)](csss22).`,
    exemple: "Tight factor (Th. 4.12). This is not a consequence of the previous result, since a WMMS allocation does not always exist." },
  "NMMS⊘WMMS": {
    preuve: T`Theorem 4.13 of [Chakraborty, Segal-Halevi and Suksompong (2022)](csss22): from 3 agents on, an NMMS allocation may give no positive fraction of the WMMS share.`,
    exemple: T`$i$’s WMMS share depends on everyone’s entitlements, the NMMS share only on $i$’s own: with very unequal entitlements, the two thresholds are no longer comparable.` },
  "WEF1⊘WMMS": {
    preuve: T`WEF1 implies no positive approximation of WMMS: a result of [Chakraborty et al.](wef21), extended by [Chakraborty, Segal-Halevi and Suksompong (2022)](csss22) to the whole WEF(x, 1 − x) family.`,
    exemple: "Contrast: WEF1 guarantees 1/n-NMMS (green curve). The two weighted maximin shares behave very differently." },
  "WPROP1⊘WMMS": {
    preuve: T`[Chakraborty, Segal-Halevi and Suksompong (2022)](csss22): no WPROP(x, 1 − x) implies a positive approximation of WMMS; with x = 0, this is WPROP1.`,
    exemple: "Proof in their appendix B.1." },
  "WPROP1⊘NMMS": {
    preuve: T`[Chakraborty, Segal-Halevi and Suksompong (2022)](csss22): for x < 1, WPROP(x, 1 − x) implies no positive approximation of NMMS; with x = 0, this is WPROP1.`,
    exemple: "Contrast: WEF1 = WEF(1, 0) gives 1/n-NMMS. It is the x = 1 end of the family that saves the guarantee." },
  "MWNW⊘NMMS": {
    preuve: T`[Chakraborty, Segal-Halevi and Suksompong (2022)](csss22): maximum weighted Nash welfare implies no positive approximation of NMMS.`,
    exemple: T`Contrast with equal entitlements, where MNW guarantees $\frac{2}{1 + \sqrt{4n - 3}}$-MMS.` },
};

/* ---------------------------------------------------------------- Valuations map */
const EN_NOTIONS_VALUATIONS = {
  Binaire: { sigle: "Binary", def: "Additive, and every good is worth 0 or 1: you want it or you don’t.", q: T`Additive, and for every good $g$:`,
    note: T`A special case of bi-valued valuations. This is where the weak version of EFX (only goods of positive value are removed) really differs from the strong one (survey, § 4.1.5).` },
  Bivaluée: { sigle: "Bi-valued", def: T`Additive, and every good can take only two values, $a$ or $b$ (specific to the agent).`, q: T`Additive, and for every good $g$:`,
    note: T`EFX exists and can be computed efficiently, for any number of agents; so does EFX + PO. Every MNW allocation is EFX here (survey, § 4.1.4).` },
  Additive: { sigle: "Additive", def: "The value of a bundle is the sum of the values of its goods. This is the setting of the other three maps.",
    q: T`For every subset $S \subseteq M$:`,
    note: T`In the proofs of the other maps, the symbol (+) above a relation signals that this property is used. MMS: the survey gave $\tfrac34 + \tfrac1{12n}$ (Table 7); we now know how to guarantee $\tfrac79$, and one cannot exceed $\tfrac{39}{40}$ (see the MMS scale on the fairness map).` },
  "Sous-modulaire": { sigle: "Submodular", def: "Diminishing returns: a good brings less when you already have more.",
    q: T`For all subsets $S, T \subseteq M$:`,
    note: T`In other words: $v(S \cup \{g\}) - v(S) \ge v(T \cup \{g\}) - v(T)$ for $S \subseteq T$ and $g \notin T$. MMS: $\tfrac13$ can be guaranteed, and one cannot exceed $\tfrac34$; round-robin already gives 0.21-MMS (survey, § 8.2 and Table 7).` },
  XOS: { sigle: "XOS", def: "The best of several additive ways of valuing: the value of a bundle is the maximum of several additive functions.",
    q: T`There are additive functions $a_1, \dots, a_k \ge 0$ such that, for every subset $S$:`,
    note: T`MMS: $\tfrac1{4.6}$ can be guaranteed, and one cannot exceed $\tfrac12$ (survey, § 8.2 and Table 7).` },
  "Sous-additive": { sigle: "Subadditive", def: "Two bundles together are never worth more than the sum of their values: no complementarity.",
    q: T`For all subsets $S, T \subseteq M$:`,
    note: T`MMS: a factor of order $1/(\log n \log\log n)$ can be guaranteed, and one cannot exceed $\tfrac12$ (survey, § 8.2 and Table 7).` },
  Monotone: { sigle: "Monotone", def: "Having more never loses value. This is the basic assumption of the whole survey.",
    q: T`For all subsets $S \subseteq T \subseteq M$:`,
    note: T`The survey assumes normalized monotone valuations throughout (§ 2): (m) is therefore always available. At this level of generality, EF1 still exists (envy-cycle elimination) and so does $\tfrac12$-EFX ([Plaut and Roughgarden](plaut18)), but no approximation of MMS is guaranteed (survey, Example 7).` },
  Identiques: { sigle: "Identical", def: "All agents value things the same way. A restriction of another kind: it combines with any class.", q: POUR_TOUT_IJ,
    note: T`EFX always exists here, even beyond additive: a leximin++ allocation works ([Plaut and Roughgarden](plaut18), survey § 4.1.1).` },
};

const LV = LIENS_VALUATIONS;
const EN_LIENS_VALUATIONS = {
  "Binaire>Bivaluée": { preuve: T`Two possible values, $0$ and $1$: a special case.`, exemple: T`Values in $\{1, 2\}$: bi-valued, not binary.` },
  "Bivaluée>Additive": { preuve: "A bi-valued valuation is additive by definition: only the values of the goods are restricted.",
    exemple: T`Goods with values $1$, $2$ and $3$: additive, not bi-valued.` },
  "Additive>Sous-modulaire": { pont: P(LV, "Additive>Sous-modulaire", [T`Each good of $S \cup T$ is counted once on each side, and twice if it lies in $S \cap T$: the inequality is an equality.`]),
    preuve: "For an additive valuation, the submodularity inequality is an equality.",
    exemple: T`Only the best good counts: $v(S) = \max_{g \in S} v(g)$. This is submodular but not additive: with two goods of value 1, $v(\{a, b\}) = 1 \ne 2$.` },
  "Sous-modulaire>XOS": { preuve: T`Every submodular valuation is XOS: a classical result, recalled in [§ 8.2 of the survey](survey), without a short proof.`,
    exemple: T`On four goods, $v = \max(a_1, a_2)$ with $a_1 = (1, 1, 0, 0)$ and $a_2 = (0, 0, 1, 1)$: XOS. But $g_2$ adds $0$ to $\{g_3\}$ and $1$ to $\{g_1, g_3\}$: increasing returns, so not submodular.` },
  "XOS>Sous-additive": { pont: P(LV, "XOS>Sous-additive", [[T`$a_\ell$ is one of the additive functions achieving the max for $S \cup T$`, T`$a_\ell$ is additive and non-negative ($S$ and $T$ may overlap)`, T`$a_\ell \le v$ everywhere, since $v$ is the max of the $a_k$`]]),
    preuve: T`Take the additive function achieving the max for $S \cup T$.`,
    exemple: T`On three goods, $v(S) = \lceil |S|/2 \rceil$: subadditive. Not XOS: it would need an additive function $a \le v$ with $a(M) = 2$, but each pair is worth 1, and summing over the three pairs, $2\, a(M) \le 3$.` },
  "Sous-additive>Monotone": { preuve: "In the survey, all valuations are monotone and normalized (§ 2): the more specific classes are therefore too.",
    exemple: T`Two complementary goods, like a pair of shoes: $v(\{a\}) = v(\{b\}) = 0$ and $v(\{a, b\}) = 2$. Monotone, but not subadditive, since $2 > 0 + 0$.` },
};

/* ---------------------------------------------------------------- Approximation scales */
const FST = T`[Feige, Sapir and Tauber, 2021](fst21)`;
const EN_MEME_UN_BIEN = { t: "no α > 0: a single good for two agents, one of them gets nothing" };
const EN_APPROX_BIENS = {
  MMS: { lignes: [
    { ctx: "additive", existe: { t: "always exists", src: T`[Huang and Zhou, 2025, preprint](hz25); before: $\tfrac{10}{13}$ (SODA 2026), and $\tfrac34 + \tfrac1{12n}$ in the survey` },
      impossible: { t: "impossible beyond, from 3 agents on", src: FST } },
    { ctx: "3 agents", existe: { t: "always exists" }, impossible: { t: "impossible beyond", src: FST } },
    { ctx: "2 agents", existe: { t: "exact MMS: I cut, you choose" } },
    { ctx: "submodular", existe: { t: "always exists" }, impossible: { t: "impossible beyond" } },
    { ctx: "XOS", existe: { t: "always exists", src: T`Seddighin and Seddighin, [survey, § 8.2](survey)` }, impossible: { t: "impossible beyond" } },
    { ctx: "monotone", impossible: { t: "no α > 0 guaranteed", src: T`[survey, Example 7](survey)` } },
  ] },
  EFX: { lignes: [
    { ctx: "additive", existe: { t: "always exists (φ − 1 ≈ 0.618)", src: T`[Amanatidis, Markakis and Ntokos, 2020](birds20)` } },
    { ctx: "additive, ≤ 7 agents", existe: { t: "always exists", src: T`[Amanatidis, Filos-Ratsikas and Sgouritsa, 2024](afs24)` } },
    { ctx: "additive, 3 agents", existe: { t: "exact EFX", src: T`[Chaudhury, Garg and Mehlhorn, 2020](cgm20)` } },
    { ctx: "subadditive", existe: { t: "always exists", src: T`[Plaut and Roughgarden](plaut18)` } },
  ] },
  EFR: { lignes: [
    { ctx: "additive", existe: { t: "always exists, and computable in polynomial time", src: T`Farhadi, Hajiaghayi, Latifian, Seddighin and Yami (AAAI 2021), [survey, § 6.1](survey)` } },
  ] },
  PMMS: { lignes: [
    { ctx: "additive", existe: { t: "always exists (√17 − 1)/4", src: T`Kurokawa (PhD thesis), [survey, § 6.2](survey)` },
      impossible: { t: "impossible beyond, from 3 agents on", src: T`[Gölz, 2026, preprint](golz26)` } },
  ] },
  GMMS: { lignes: [
    { ctx: "additive", existe: { t: "always exists", src: T`[Amanatidis, Korfiati, Markakis and Santorinaios, 2026, preprint](amks26); the survey gave $\tfrac47$` },
      impossible: { t: "impossible beyond (GMMS ⇒ MMS)", src: FST } },
    { ctx: "3 or 4 agents", existe: { t: "always exists" }, impossible: { t: "impossible beyond", src: FST } },
  ] },
  APS: { lignes: [
    { ctx: "additive", existe: { t: "always exists", src: T`[Babaioff, Ezra and Feige, 2021](aps21)` },
      impossible: { t: T`impossible beyond, since $\mathrm{APS}_i \ge \mu_i$: α-APS ⇒ α-MMS`, src: FST } },
  ] },
  PROP: { lignes: [{ impossible: EN_MEME_UN_BIEN }] },
  EF: { lignes: [{ impossible: EN_MEME_UN_BIEN }] },
};
const EN_APPROX_CORVEES = {
  MMS: { lignes: [
    { existe: { t: "always exists", src: T`[Huang and Segal-Halevi, 2023](hsh23)` }, impossible: { t: "impossible below, from 3 agents on", src: FST } },
  ] },
};
const EN_APPROX_PONDEREE = {
  WMMS: { note: "drawn for n = 3", lignes: [
    { existe: { t: "always exists, achieved by round-robin" }, impossible: { t: "impossible beyond" } },
  ] },
  APS: { lignes: [
    { existe: { t: "always exists, even with unequal entitlements", src: T`[Babaioff, Ezra and Feige, 2021](aps21)` },
      impossible: { t: "impossible beyond (already with equal entitlements)", src: FST } },
  ] },
};

/* ---------------------------------------------------------------- The four maps */
const EN_CARTES = {
  biens: {
    titre: "Fairness map", sousTitre: "(indivisible goods, additive valuations)",
    notions: EN_NOTIONS_BIENS, liens: EN_LIENS_BIENS, approx: EN_APPROX_BIENS,
    definitions: T`
    <dl class="defs">
      <dt>Agents, goods</dt>
      <dd>$N = \{1, \dots, n\}$ the agents, $M$ the goods, $m = |M|$; each $v_i$ is additive: $v_i(S) = \sum_{g \in S} v_i(g)$</dd>
      <dt>Partitions</dt>
      <dd>$\mathcal{A}_k(S) = \{ (B_1, \dots, B_k) : B_1 \sqcup \dots \sqcup B_k = S \}$</dd>
      <dt>Allocations</dt>
      <dd>$\mathcal{A}_n(M)$: every agent receives a bundle and all goods are distributed; there are $|\mathcal{A}_n(M)| = n^m$ of them. We write $\overline{A_i} = M \setminus A_i$</dd>
      <dt>Maximin share</dt>
      <dd>$\mu_i^k(S) = \max_{B \in \mathcal{A}_k(S)}\ \min_\ell\ v_i(B_\ell)$, and $\mu_i = \mu_i^n(M)$</dd>
    </dl>
    <p class="source">Based on the survey by [Amanatidis et al. (2023)](survey) and subsequent work.</p>`,
  },
  corvees: {
    titre: "Chores map", sousTitre: "(indivisible chores, additive costs)", familles: { egal: "Equality of costs" },
    notions: EN_NOTIONS_CORVEES, liens: EN_LIENS_CORVEES, approx: EN_APPROX_CORVEES,
    definitions: T`
    <p class="regle-or"><b>Golden rule.</b> “Up to one chore” removes a chore from one’s <b>own</b> bundle, never from the other’s.</p>
    <dl class="defs">
      <dt>Agents, chores</dt>
      <dd>$N = \{1, \dots, n\}$ the agents, $M$ the chores, $m = |M|$; each $c_i \ge 0$ is additive, and everyone wants to bear as little as possible</dd>
      <dt>Partitions</dt>
      <dd>$\mathcal{A}_k(S) = \{ (B_1, \dots, B_k) : B_1 \sqcup \dots \sqcup B_k = S \}$</dd>
      <dt>Allocations</dt>
      <dd>$\mathcal{A}_n(M)$: every agent receives a bundle and all chores are distributed; there are $|\mathcal{A}_n(M)| = n^m$ of them</dd>
      <dt>Maximin share</dt>
      <dd>$\mu_i^k(S) = \min_{B \in \mathcal{A}_k(S)}\ \max_\ell\ c_i(B_\ell)$, and $\mu_i = \mu_i^n(M)$</dd>
    </dl>
    <p class="source">Missing compared to goods: APS, GMMS, PMMS, PROPm (useless, since PROPX always exists) and MNW (no natural analogue). Based on the [survey](survey) and subsequent work; statuses checked on 22 October 2026.</p>`,
  },
  ponderee: {
    titre: "Weighted map", sousTitre: "(indivisible goods, additive valuations, unequal entitlements)",
    notions: EN_NOTIONS_PONDEREE, liens: EN_LIENS_PONDEREE, approx: EN_APPROX_PONDEREE,
    definitions: T`
    <p class="regle-or"><b>Idea.</b> Everyone is judged in proportion to their entitlement: we compare $v_i(A_i)/s_i$ rather than $v_i(A_i)$. With $s_i = 1/n$ for all, every notion becomes the one of the fairness map.</p>
    <dl class="defs">
      <dt>Agents, goods</dt>
      <dd>$N = \{1, \dots, n\}$ the agents, $M$ the goods; each $v_i$ is additive: $v_i(S) = \sum_{g \in S} v_i(g)$</dd>
      <dt>Entitlements</dt>
      <dd>each agent has an entitlement $s_i \in \,]0, 1[$, with $\sum_{i \in N} s_i = 1$ (for instance a share of an inheritance)</dd>
      <dt>Partitions</dt>
      <dd>$\mathcal{A}_k(S) = \{ (B_1, \dots, B_k) : B_1 \sqcup \dots \sqcup B_k = S \}$</dd>
      <dt>Allocations</dt>
      <dd>$\mathcal{A}_n(M)$: every agent receives a bundle and all goods are distributed; there are $|\mathcal{A}_n(M)| = n^m$ of them. We write $\overline{A_i} = M \setminus A_i$</dd>
      <dt>Maximin share</dt>
      <dd>$\mu_i = \max_{B \in \mathcal{A}_n(M)}\ \min_\ell\ v_i(B_\ell)$, the maximin share without entitlements</dd>
    </dl>
    <p class="source">Based on the [survey](survey) (§ 8.3, “Arbitrary entitlements”) and the papers cited in the cards. Still missing: the Equality family, and the WEF(x, y) and WPROP(x, y) families beyond WEF1 = WEF(1, 0) and WPROP1 = WPROP(0, 1).</p>`,
  },
  valuations: {
    titre: "Valuations", sousTitre: "(valuation classes and assumption symbols)",
    reperes: ["← more specific · more general →", ""], libelles: ["Contains", "Contained in"],
    familles: { envie: "Valuation classes", part: "Special cases", eff: "Other restriction" },
    notions: EN_NOTIONS_VALUATIONS, liens: EN_LIENS_VALUATIONS,
    definitions: T`
    <p class="regle-or"><b>How to read it.</b> An arrow A → B means “every A valuation is also B”. In the proofs of the other maps, the symbol above a relation indicates the assumption used.</p>
    <dl class="defs">
      <dt>(+)</dt>
      <dd>additivity: $v(S \cup T) = v(S) + v(T)$ for disjoint subsets</dd>
      <dt>(m)</dt>
      <dd>monotonicity: $S \subseteq T \Rightarrow v(S) \le v(T)$, assumed throughout the survey, with $v(\varnothing) = 0$</dd>
      <dt>Signs</dt>
      <dd>the assumptions “values ≥ 0”, “values > 0”, “$v_i(M) > 0$” are about the numbers, not about the form of $v$: they stay spelled out</dd>
    </dl>
    <p class="source">Based on the [survey](survey), § 2, § 4.1 and § 8.2; all inclusions in the diagram are strict (§ 8.2).</p>`,
  },
};

const EN_FAMILLES = { envie: "Envy", part: "Guaranteed share", egal: "Equality of utilities", eff: "Efficiency and welfare" };
const EN_STATUT = { yes: "✓ always exists", open: "? open", no: "✗ not always", inconnu: "– not checked" };
