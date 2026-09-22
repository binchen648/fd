# P3-A FB2-25 Game-Start Fixed Set-Mana Dispatch

Date: 2026-09-18
Role: Codex A
Status: `DISPATCHED`
Credit: `0` frozen identities; runtime capability only

## Baseline

- Accepted recovery baseline: `fa27e9b132990a6fde164b8806443c533383375f`.
- Recovery-line accepted frozen overlap: `115/944` (12.18%), leaving `829/944`.
- Integrated main remains `553779e8ffcc926ae4763ee86a2ea937e090c128` / accepted `111/944`.
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`.
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.

## Why this task is next

The post-R50 readiness refresh found no further missing identity that is already covered by an accepted complete semantic signature. The apparent Okita/Riding match is explicitly excluded by prior A/R evidence because Okita has repeat-play / draw-after-each-use semantics rather than Riding semantics. Leonardo and Ophelia remain excluded from FM08 for their previously recorded capability-completeness gaps.

The smallest newly actionable reusable gap is the parent route left open by accepted FB2-05 fixed-controller exact `set_mana`. F1 has exactly two block-free rows with the same complete envelope `game.started -> SET_MANA` and no additional condition/lifecycle/modifier semantics:

- `master.iliya.skill.s1` — initial Mana = 6;
- `master.taiga.skill.s1` — initial Mana = 3.

`master.zouken.skill.s1` is not a member because it additionally owns a game-long `mana_capacity:set` modifier. `master.shirou-emiya.skill.s1` is not a member because F1 normalizes it as `rule:initial_mana:set`, not this trigger/effect envelope.

FB2-05 / R22 accepted only the fixed-controller exact `set_mana` primitive/component and explicitly left Iliya/Taiga waiting on parent Trigger semantics. Subsequent accepted runtime introduced the trusted `game_start` MatchSession event and exact game-start families, but those acceptances did not authorize arbitrary game-start triggers. FB2-25 therefore closes only this exact composition rather than inheriting a broad Trigger Gateway claim.

## Authorized B2 envelope

Add one identity-free fail-closed semantic contract for exactly:

- ability kind `forced_trigger`;
- execution mode `automatic`;
- activation exactly `{ trigger: 'game_start' }`;
- no conditions, targets, cost, creates, ruleModifiers, response-window semantics, limit, visibility, or lifecycle semantics;
- exactly one effect;
- effect exactly the already accepted FB2-05 fixed-controller literal `set_mana` component;
- fixed non-negative safe-integer amount within the authoritative runtime Mana cap;
- duplicate trusted `game_start` replay remains idempotent through existing processed-event behavior.

Near-matches must fail closed, including additional effects, conditions, lifecycle/modifier fields, non-controller target, expression/fractional/negative amount, non-game-start trigger, or extra activation metadata.

Valid execution must reuse existing typed Resolution Data-flow `set_mana`; no new resource primitive is authorized.

## Allowed scope

Codex B2 may modify only the narrow runtime classifier/guard needed to own this exact semantic plus focused regression tests and its result report. Prefer no schema expansion if the current schema already represents the envelope.

No F1 identity, owner name, printed text, Reference handler, or fixed amount may appear in production runtime routing. No authoring migration is allowed. No coverage/taxonomy/KPI rule change. No MatchSession timing redesign. No broad `game_start`, Trigger, Lifecycle, Modifier, or Resource acceptance.

## Required evidence

Focused tests must prove:

1. exact valid shapes with amounts 3 and 6 classify and execute on trusted `game_start`;
2. exact assignment, typed `mana_adjusted` event, same-value no-op, cap validation, and rollback continue to match FB2-05;
3. malformed/near-match parent shapes fail closed;
4. unrelated game-start RuleOverride and skill-provisioning semantics remain accepted and unchanged;
5. no production identity routing;
6. official typecheck, content/determinism, full CI, rules core+regression, client build, Reference, coverage/audit, diff check, scope, and cleanliness pass.

## Credit / next gate

FB2-25 takes zero frozen migration credit. Recovery accepted remains `115/944`. If a fresh independent R accepts the exact B2 Candidate, A may synchronize the capability and then freshly re-evaluate the two exact F1 identities for an S migration batch. No `117/944` claim is authorized before that later S Candidate receives fresh migration review and post-review A synchronization.

P3-FM09 remains `MIGRATION_BLOCKED`; this task does not dispatch FM10.
