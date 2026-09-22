# P3-A R110 Ciel S1b Consumer Migration Dispatch

Role: Codex A
Status: `READY`
Date: 2026-09-23

## Exact baseline

- Exact synchronized Base: `f94dd1b1569229d1f4efd02e767ab5804dea786a` (P3-A-R109 Ciel S3 acceptance synchronization).
- Formal migration on Base: **`154/944`**, **`790`** remaining.
- Material authoring overlap on Base: **`149/944`**.
- Base frozen recount: denominator `944`, `master.ciel.skill.s1b=0`, `master.ciel.skill.s3=1`, duplicate frozen ids `0`.
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- Accepted FB2-51 parent-route implementation: synchronized before this baseline; its runtime remains identity-free.
- Accepted Ciel S3 target definition: PR #429 Candidate `ae28674acb697beee116a676648ae70e2cd6b1ca`, fresh R `MIGRATION_ACCEPTED`, synchronized by R109.

No historical readiness label is reused. A reconstructed the whole card again on the exact synchronized R109 baseline.

## Frozen source and static metadata

The sole authorized new frozen identity is:

- id: `master.ciel.skill.s1b`;
- owner: `master.ciel` / 希耶尔;
- aliases / legacy id: `s1b`;
- name: `外典`;
- frozen printed text: `当一名对手于一回合内获得7点及以上的战果时，令【第七圣典】加入或返回你的技能区。`;
- frozen full-text SHA-256: `6ed54c1b75925d3b78f7bd89727b5363dc944cf571831c1a81618e788eb71e31`;
- source ability id: `seventh-scripture-return`;
- sole printed clause: `当一名对手于一回合内获得7点及以上的战果时，令【第七圣典】加入或返回你的技能区`;
- F1 source locator: `src/content/authoring/cards.json / skillCards[15].abilities[0].printedClause` at Phase-3 evidence commit `59f145434695d29bdd17e4cb3adc887e84182377`;
- clause SHA-256: `98a4becbbedd9d11ae2b93ea1b192b781a6943fb0ff62e1dbff4bb9697bbb6fc`.

Locked Reference corroborates static metadata only: Master skill, passive, cost `0`, base power `0`, attributes `[]`, requirement `none`. Reference identity-specific runtime routing is not inherited as product authorization.

## Fresh whole-card reconstruction

Current accepted infrastructure covers every semantic seam:

1. **Ordinary owned master-skill placement**: the existing Ciel file is an accepted `master_rule_definition_archive`. Its mixed rules-only contract permits ordinary master skills with no `initialPlacement` alongside deferred `outside_game` definitions. The compiler gives a non-deferred master skill `initialZone=skill`. Therefore s1b is authored without `initialPlacement`; it is not a deferred/provisioned card and has no 8-mana play gate.
2. **Trigger and opponent relation**: synchronized FB2-51 accepts only the authoritative trigger `player.victory-points.changed` plus exact FB2-31 `event_player_is_opponent`.
3. **Threshold semantics**: FB2-51 accepts only `event_round_victory_points_gain_crosses` with literal threshold `7`, using the server-owned current-round positive-VP ledger. Loss/zero/non-VP/self changes do not qualify, direct +7 and cumulative 3+4 cross once, later positive gains do not retrigger, duplicate root event ids are idempotent, and the ledger resets at the real round boundary.
4. **Definition return**: FB2-30 supplies the exact controller master-skill `return_card_by_definition` operation: destination `master-skills`, `createIfMissing=true`, face up, inactive, with transactional wrong-definition/duplicate handling.
5. **Target definition availability**: accepted/synchronized `master.ciel.skill.s3` now exists in the same owner rules archive as an executable `outside_game` master skill.
6. **No runtime identity route**: FB2-51 admission is structural and identity-free; S only authors data matching the accepted envelope.

A performed an in-memory, no-file-write synthetic compile on exact Base. The proposed normalized s1b returned:

- authoring FB2-51 classifier: `true`;
- full executable compile + `assertExecutableCardPack`: PASS;
- compiled s1b owner/card type: `master.ciel` / `master_skill`;
- compiled `initialPlacement`: absent;
- compiled `initialZone`: `skill`;
- compiled mode: `automatic`;
- compiled FB2-51 classifier: `true`;
- target `master.ciel.skill.s3`: present, same owner, `master_skill`, `initialPlacement=outside_game`;
- synthetic executable totals: `78 cards / 7 decks / 14 characters`.

The complete card is therefore mechanically **S_READY_NOW** on this current baseline. No B2 work is authorized or required for R110.

## Authorized S representation

Fresh S may append exactly one card to the end of `data/authoring/masters/master.ciel.json`:

- `id: master.ciel.skill.s1b`;
- `aliases: [s1b]`, `legacyId: s1b`, name `外典`;
- `cardType: master_skill`, owner `{ type: master, id: master.ciel }`;
- **no** `initialPlacement`;
- exact frozen printed text/hash above;
- `cardFace: { typeLabel: 被动, cost: 0, basePower: 0, attributes: [] }`;
- ordinary controller play timing surface consistent with the existing mixed Ciel archive, with `playRequirements: []`;
- one normalized ability `seventh-scripture-return`:
  - `kind: forced_trigger`;
  - `activation: { trigger: player.victory-points.changed }`;
  - exact conditions, in order: `event_player_is_opponent`, then `event_round_victory_points_gain_crosses(threshold=7)`;
  - empty targets/cost/creates/ruleModifiers/lifecycle/responseWindow/limit/visibility;
  - exact sole effect `return_card_by_definition` to `master.ciel.skill.s3`, controller, `master-skills`, create-if-missing, face-up, inactive;
  - automatic execution with no identity-specific host operation.

S may include per-card Phase-3 evidence metadata binding the exact F1 hashes, Locked Reference static metadata, and accepted FB2-30/FB2-31/FB2-51 contracts. It must not change existing s1a/s2/s3 semantics.

## Proactively authorized historical-test compatibility

Appending s1b is known mechanically to invalidate exactly two repository-wide/exclusive assertions in the existing S3 migration test. S may make only these narrow compatibility edits in `packages/rules/tests/ciel-s3-consumer-migration.test.ts`:

1. replace the exact whole-archive list assertion `[s1a, s2, s3]` with a check that the already-accepted s1a/s2/s3 identities remain present exactly once and in their accepted relative order, without claiming the Ciel archive can never gain another card;
2. remove/narrow only the stale absolute repository overlap assertion `overlap.length===149`, while preserving the frozen denominator `944`, duplicate-frozen-id `[]`, and local `master.ciel.skill.s3` exact-once invariants.

No other S3 semantic test may change. No other historical-test compatibility edit is pre-authorized; if full CI exposes another stale snapshot, stop at that exact finding for A scope clarification rather than widening S unilaterally.

## S scope

Task: `P3-S-R110-CIEL-S1B-CONSUMER-MIGRATION`
Branch: `codex/s-p3-r110-ciel-s1b-consumer-migration`
Base: exact R110 A dispatch Candidate.

Fresh S is authorized only to:

1. append exactly `master.ciel.skill.s1b` to the existing Ciel rules-only archive using the normalized envelope above;
2. regenerate only the deterministic existing rules-only generated representation needed for s1b executable registration;
3. add focused consumer migration tests for exact source/static metadata, loader/classifier admission, authoritative threshold semantics, exact s3 return/materialization, product isolation and frozen accounting;
4. apply only the two pre-authorized Ciel-S3 compatibility edits above;
5. add `docs/reports/2026-09-23-p3-s-r110-ciel-s1b-consumer-migration-result.md`.

Forbidden:

- any second frozen identity;
- any production runtime/compiler/client source change;
- any Ciel/name/skill-id/Chinese-text/hash branch in runtime;
- any arbitrary resource/threshold/cumulative-counter widening;
- any manifest registration change;
- any generated playable master/ordinary-card/deck/character surface change;
- changing accepted s1a/s2/s3 semantics;
- merge or retarget;
- formal migration credit before fresh independent R acceptance and A synchronization.

## Required S proof

At minimum S must prove:

- exact Base material overlap `149/944` -> Candidate `150/944`;
- exact added frozen identity `master.ciel.skill.s1b` only;
- frozen removals `0`, duplicate frozen ids `0`;
- s3 remains exact-once and semantically unchanged;
- loader report `[]`;
- authoring and compiled FB2-51 classifiers accept the exact whole envelope;
- compiled s1b is an ordinary `master_skill` in initial skill zone, not outside-game/deferred;
- real authoritative VP changes prove direct +7 and cumulative 3+4 crossing; later gains do not retrigger; self/zero/loss/non-VP do not qualify; round advance resets the ledger; duplicate ids remain idempotent; forged/malformed/stale/mismatched provenance fails closed;
- exact s3 return semantics prove existing same physical instance return when applicable and exactly-one creation when absent, with no duplication;
- production runtime/compiler/client source diff empty;
- pack manifest diff empty;
- generated diff restricted to deterministic existing Ciel rules-only s1b card/source-map/hash representation; playable master/ordinary-card/deck/character surfaces unchanged;
- focused s1b + FB2-51 + FB2-30 + FB2-31 + Ciel-S3 compatibility;
- typecheck;
- official `npm run test:ci -- --maxWorkers=2`;
- content validation;
- generated-content determinism;
- Locked Reference verification;
- client production build;
- Phase-3 coverage + automation audit;
- `git diff --check`.

Material authoring overlap becomes `150/944` only in the S Candidate. Formal migration remains **`154/944`**, **`790`** remaining until a fresh independent R returns `MIGRATION_ACCEPTED` for the exact S Candidate and A synchronizes that acceptance.

Long-term S rule: **S 完成 recertification 并提交 Exact Base/Candidate**。
