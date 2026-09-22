# P3-A FB2-35 Round Active-Attack Paid-Cost Combat-Power Dispatch

Role: Codex A
Status: `READY`
Date: 2026-09-20

## Exact baseline

- Exact formal Base: R74 Stheno migration acceptance synchronization `e93c3b03d82a3a579473a4da67124319ba9975ec`
- Formal migration accepted: `137/944`
- Formal remaining: `807`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Migration-closure-first choice

Fresh overlay over the remaining READY_GENERIC_EXTENSION rows identifies `servant.ibaraki.skill.sc-ibaraki-1` as the nearest honest closure target after Stheno.

Its source-grounded axes are intentionally small:

- condition: exact type-only `source_owned` (already accepted by FB2-32);
- modifier: one `combat_power:add` rule;
- lifecycle: the modifier is permanent;
- no trigger, interaction, target selection, cost, card-zone move, hidden-info selection, or effect body.

Locked Reference exact ability:

- kind: passive;
- conditions: `[ { type: "source_owned" } ]`;
- exactly one rule modifier:
  - `operation = add`;
  - `rule = combat_power`;
  - `scope.subject = players_at_source_battlefield`;
  - `scope.where = [ { type: "round_active_attack_paid_cost_sum_is_highest" } ]`;
  - `value = { type: "constant", value: 6 }`;
  - modifier lifecycle `{ duration: "permanent" }`;
  - priority `{ tier: "card_text", specificity: "specific" }`;
  - conflictPolicy `higher_priority_wins`.

Locked Reference has one other `combat_power:add` occurrence, `master.twice.skill.ascension`, but it uses a different controller-only scope and a different victory-points condition. It is explicitly out of scope and must remain unsupported by FB2-35.

## Exact runtime gap

Current runtime does not support `rule = combat_power` in the loader. Existing generic ongoing power modifiers modify individual card power, not participant total combat power, so they are not an equivalent route.

Current CardRuntimeState records `playedRound` but not actual mana paid for that play. FB2-35 must not substitute printed cost for paid cost. The accepted metric is server-owned actual paid mana at authoritative play time.

## Authorized B2 seam

Implement only the identity-free exact Ibaraki structural envelope above.

### Paid-on-play provenance

Extend generic per-card runtime play provenance so authoritative `playBatch` records actual mana paid for each card instance at that play:

- normal face-up paid play: the amount actually charged for that card;
- waived/free play: `0`;
- face-down play: `0`;
- rejected/transactionally failed play: no record;
- the value is scoped to the recorded `playedRound` and is overwritten only by a later authoritative play of the same physical instance.

This provenance is generic infrastructure only and earns zero migration credit.

### Combat metric

For a battlefield at resolution time, compute each active participant's current-round active-attack paid-cost sum using only physical/authored attack cards that:

- are controlled by that participant;
- are currently in the authoritative attack/combat area for that battle path;
- have runtime source state active and not face-down;
- have `playedRound === current round`;
- have a finite nonnegative safe-integer paid-on-play value.

Missing/malformed paid provenance fails closed for that candidate card rather than substituting printed cost.

The highest metric is tie-preserving: every participant whose valid sum equals the maximum qualifies. Zero is a real sum only for participants who have at least one qualifying active attack with recorded paid provenance; participants with no qualifying attack do not become zero-cost winners by absence.

### Modifier application

The +6 applies exactly when all are true:

- source card exists and is owned/controlled consistently with the accepted `source_owned` condition;
- source controller is at the battlefield being resolved;
- the exact passive modifier shape above is present and automatic;
- target participant is at that source battlefield;
- target participant qualifies for the highest current-round active-attack paid-cost sum.

Add exactly +6 to participant total combat power before winner selection. Ties at the highest paid-cost sum all receive +6. It must not alter card base/current power, event/location/terrain modifiers, reward distribution, defeat rules, or any other modifier family.

### Fail-closed / no widening

Reject or ignore near-matches, including:

- other `combat_power` operations;
- other values;
- other subjects;
- missing/extra `scope.where` predicates;
- other lifecycle/priority/conflict shapes;
- extra conditions/effects/targets/cost/creates;
- the Twice occurrence;
- identity/name/text/hash/Reference-handler based routing.

No consumer authoring migration is authorized in B2. No taxonomy/KPI credit change. Do not merge or retarget.

## Required B2 evidence

Fresh B2 must prove at minimum:

- loader exact-shape accept + near-match rejection;
- generic paid-on-play provenance for normal, free/waived, face-down, and failed plays;
- one winner and tied highest paid-cost sums;
- lower paid-cost participant gets no +6;
- participant with no qualifying active attack does not qualify by zero;
- closed/inactive/face-down/wrong-round attack does not count;
- source controller outside the battlefield does not apply the modifier;
- source-owned failure closes the route;
- +6 changes participant effective combat power and winner selection through production combat resolution;
- card power itself is unchanged;
- no impact on the out-of-scope Twice shape;
- identity/name/text/hash/Reference-handler audit;
- typecheck, focused tests, core+regression, official CI, content validation, generated determinism, Locked Reference verification, client build, diff-check, and clean final status.

FB2-35 earns zero migration credit. Formal project state stays `137/944`, remaining `807`, until a later S migration is independently accepted and A-synchronized.

## Mandatory next step on acceptance

Immediately re-overlay `servant.ibaraki.skill.sc-ibaraki-1`. If FB2-35 closes the exact remaining gap and no new blocker appears, dispatch S for Ibaraki before any unrelated B2 seam.
