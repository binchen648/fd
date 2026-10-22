# P3-B Achilles scoped Candidate implementation report

Date: 2026-10-22

## Authority and exact lineage

- Exact base: `5fb0147a9b89f0d181b872a95059f853dbed8eec`
- Accepted source-bound decision: `1c5dacd7d1d8368eefe1ca901e5c35e70740fa86`
- Reviewer accepted contract commit: `91485a1e89ea53b3926a227ea0832e02f0f19cda`
- Candidate branch: `codex/achilles-owner-complete`
- Frozen inventory was not modified.
- The authoring archive, pack manifest, generated executable source-map, and evidence report carry the decision/reviewer identity and source clause hashes.

## Implemented minimum

### S1 — 勇者的不凋花 / 疾风驰骋

- The reveal trigger accepts only the post-scoring `after_controller_loses_battle` event with battle-phase resolution ID, battle ID, result ID, battlefield ID, authoritative participant IDs, and loser membership.
- The authoritative action-time participant set requires a declared current battlefield and active player participants. The implementation does not synthesize NPC participants or scan unrelated locations.
- Each confirmed opponent is processed once with the server-owned deterministic runtime RNG. A missing hand blocks the transaction before mutation.
- The natural “未弃置牌” branch remains blocked: multi-card hands never write a zero receipt because the unselected-card comparison is not contract-proven. Power zero is allowed only when the authoritative pre-discard hand is a singleton and that discarded card has an authored, unambiguous non-Luck/non-Agility classification; unknown definitions and ambiguous attributes fail closed.
- Power zero is stored against the canonical battle-phase/battle/result/settlement identity and consumed by the authoritative combat resolver. The receipt is deleted at settlement, so a second same-round battle on the same battlefield receives a distinct identity and cannot reuse the prior receipt.

### S2 — 湛蓝天空

- One activation creates one server-owned choice window with the three printed options.
- `discard_hand` performs an immediate same-battlefield opponent discard using deterministic server RNG and fails closed for a no-hand opponent.
- `hide_true_name` atomically pays 3 mana, removes the controller from revealed servant projections, records prior visibility, and restores it at `round_end`.
- `forbid_skills` is explicitly contract-blocked. It has no rule modifier and selection returns a transactional failure.

### S3 — 英雄对决

- Activation accepts only an exact one active player opponent on the controller’s current battlefield.
- The implementation records a source-bound controller/opponent/battlefield pair receipt.
- NPC movement/deployment/duration semantics, external effect immunity, movement lock, and persistent immunity are not installed or inferred. Terrain/external effects remain active, as required by the blocked boundary.

## Restore/replay and adversarial coverage

- Added persisted Achilles runtime fields for hidden-name restoration, exact-one pair receipts, and battle-local power-zero receipts.
- Restore-boundary validation checks source identity, controller ownership, active lifecycle, canonical battle/result/settlement identity, player/location/card references, participant/target subset relationships, current-round lifetime, and discarded-card existence. Forged result identity is rejected.
- Canonical S2 pending decisions reject forged candidate lists and stale source/phase state.
- Focused tests cover malformed loss events, idempotent replay, no-hand fail-closed behavior, deterministic one-discard behavior, unselected-card classification, battle settlement power zero, blocked S2 branch 2, round-end reveal restoration, forged restore state, exact-one S3 scope, and absence of persistent locks.

## Evidence

- Focused Achilles/production regression run: `57 passed` across 4 files, including same-round repeated-battle identity, settlement cleanup, forged result identity, and strict singleton-discard classification.
- `npm run typecheck`: passed.
- `npm run content:validate`: passed; `8 masters, 8 servants, 20 events, 0 blocking issues`.
- `npm run verify:generated-content`: passed.
  - library SHA-256: `af3350d4fa26060e3f7e29366b4800e09bbf788e7211d8e19e3bceafecae6eca`
  - fixture SHA-256: `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence SHA-256: `ee2a6906c9fa45c0d1c897c5ce74863bdceb7704fe1df36cbf4ff748c92f182a`
- `npm run verify:playtest-v1`: passed; `8 masters, 8 servants, 20 events, 96 starting-deck cards, 0 private-view leaks`.
- `git diff --check`: passed.
- `npm run test:source-assets`: blocked by the checkout’s pre-existing absence of the complete external CHM/source asset tree; it reports 107 missing required images, including the source archive paths. No source asset was fabricated or copied into the frozen inventory.
- Full `npm test` is not a clean baseline in this checkout: the run reports 57 failures, dominated by the pre-existing 8-roster-vs-7-roster expectation drift, absent external CHM pages/assets, and legacy tests that assume blocked mechanics. The Achilles-specific failures were updated to the accepted scoped boundary and pass in the focused run above.

## Explicit refusal boundary

No NPC participant model, no no-hand fallback, no unselected-card inference, no guessed card classification, no skill-card prohibition, no movement/deployment lock, no duration guess, no external-effect immunity, no persistent lock/immunity, no legacy `Math.random()`, and no old handler/fixture was used as authorization.
