# P3-FB2-27 Ruler Seal Subsystem Result

Role: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Date: 2026-09-19

## Exact lineage

- A dispatch Base: `fbc7687edf13c27eb7383117ba22551054aa4e96`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Formal recovery-line accepted baseline: `121/944` (`12.82%`), `823` remaining

This B2 task implements only the identity-free Ruler seal relationship/runtime capability requested by the A dispatch. It migrates no frozen identity and earns zero frozen migration credit.

## Implemented structural contracts

Two strict structural gateways are introduced. Both are source-ID/name/text/Reference-handler independent and fail closed when any reserved FB2-27 node is present but the complete shape is not exact.

### Ruler binding contract

The exact binding ability is:

- `phase_action` in the `action` / `controller_action_window`;
- exactly one player target `bound_players`, selecting exactly two other players;
- exact constraints `not_controller` + `least_ruler_binding_count`;
- exact effects:
  - `grant_ruler_seals`;
  - `ruler_copy_steal_guard` with `forbid_source_and_effects`;
- exact `<per game three times>` card ability limit;
- automatic execution with no host operations;
- no extra conditions/cost/creates/rule modifiers/lifecycle/visibility surface.

The no-copy/no-steal clause is therefore explicit structural material. Current production has no generic copy/steal execution surface, so this B2 seam does not invent unrelated copy/steal machinery; malformed or altered guard shapes fail closed at the FB2-27 gateway.

### Ruler seal-use contract

The exact use ability is:

- `phase_action` in the `action` / `controller_action_window`;
- exact option target with the three branches `move`, `lock_movement`, `free_play_reward`;
- exact bound-player target constrained by `bound_by_controller_ruler_seal`;
- one `use_ruler_seal` effect carrying exactly two structural move destinations and reward `2` VP;
- no source-card per-game use limit. Once-only use is enforced on each granted `RulerSealBinding` itself.

## Runtime semantics

### Issuer-scoped game-long history

Runtime state records:

- active/unspent and spent issuer -> bound-player seal relationships in `AbilityRuntime`;
- game-long binding history scoped by issuer and bound player in `AbilityRuntime`;
- pending one-shot delayed reward records in `AbilityRuntime`;
- the temporary round movement lock in `GameState.ruleOverrides`, so core movement and session boundaries share one authoritative state.

Spending a seal never decrements binding history.

Least-bound selection follows the sequential Reference rule for a two-player binding action: the first player must be currently minimum for that issuer; the first simulated binding is then applied before determining the legal second minimum. This matters when one uniquely minimum player would remain uniquely minimum after the first binding: the same player cannot be selected twice, so in that state there is no legal two-distinct-player binding pair. Binding history for one Ruler issuer never affects another issuer's minimum counts.

### Seal ownership / consumption

Only the issuer of an unspent issuer -> bound-player relationship can use that seal against that bound player. The selected seal is marked spent exactly once. Existing transactional command rollback keeps rejected/corrupt attempts mutation-free.

### Move branch

The issuer selects the bound player and then one of the two exact structurally-authored destinations. The runtime validates the current enabled-location set again at continuation time, moves the bound player, records effect movement, and emits the normal enter-location event. It does not route on any Ruler/card identity.

### Round movement-lock branch

The selected bound player receives a current-round Ruler movement lock. Both ability movement checks and the production `MatchSession` deployment boundary honor that lock. The lock expires at the next round.

### Free-play + delayed reward branch

The selected bound player gets a private `0..1` hand-card choice. The effect-play route waives only printed mana **cost**; ordinary play requirements still apply. Declining is legal. Regardless of whether a card is selected, the one-shot battle reward is armed.

When the bound player next participates in the relevant battle result in that round:

- if the bound player wins, the issuer receives exactly `+2 VP`;
- if the bound player loses, the pending reward is consumed with no VP;
- replay of the same event ID cannot duplicate reward settlement.

Stale/corrupt private continuation metadata rejects mutation-free.

## Exact Candidate scope

Base→Candidate is intentionally limited to these 11 files:

1. `packages/rules/src/ability/ruler-seal.ts`
2. `packages/rules/src/ability/interpreter.ts`
3. `packages/rules/src/ability/loader.ts`
4. `packages/rules/src/ability/types.ts`
5. `packages/rules/src/core/movement.ts`
6. `packages/rules/src/core/rule-overrides.ts`
7. `packages/rules/src/schema/game.ts`
8. `packages/rules/src/match-session.ts`
9. `packages/rules/src/index.ts`
10. `packages/rules/tests/regression/fb2-ruler-seal-subsystem.test.ts`
11. `docs/reports/2026-09-19-p3-fb2-27-ruler-seal-subsystem-result.md`

The `core/movement.ts` / `core/rule-overrides.ts` / `schema/game.ts` changes are the narrow product-boundary support required for the round movement-lock branch: one authoritative round-scoped lock is installed in `GameState.ruleOverrides`, then both the core movement executor and MatchSession legal-deployment boundary honor it. There is no second lock representation in `AbilityRuntime`.
## Product and identity isolation

Production routing uses only exact structural authoring nodes. A production-source scan over the changed runtime files has zero hits for:

- Amakusa / Amor / Jeanne / Morgan / Oberon identities or names;
- the exact six future consumer IDs;
- `core.ruler-class`;
- Ruler printed Chinese text;
- F1 or Reference commit hashes.

There is zero diff under:

- `data/authoring/**`
- `data/packs/**`
- `data/generated/**`
- `apps/**`
- `scripts/**`
- `data/phase3/**`

The Reference checkout remains exact and clean.

## Validation

Fresh B2 validation on the final implementation includes:

- `npm ci --offline`: 239 packages, 0 vulnerabilities;
- typecheck: PASS;
- focused FB2-27 structural/runtime suite: `1 file / 12 tests PASS`;
- cross-runtime focused suite covering MatchSession, replay, private interactions, and authoring interpreter: PASS;
- official full CI on the final source: `139 files / 942 tests PASS`;
- rules `src + core + regression` on the final source: `80 files / 482 tests PASS`;
- content validate/compile: `7 masters / 7 servants / 20 events / 0 blocking issues`;
- generated determinism: PASS with hashes unchanged from the R56 baseline:
  - library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`;
- locked Reference verification: PASS;
- client production build: PASS (existing Vite `node:crypto` browser-externalization warning only);
- Phase 3 coverage unchanged: `106 archives / 144 cards / 249 abilities`, compiled `76 / 14 / 0`, routing `22/3/135/0/89/131`;
- automation audit unchanged: `135/3/89/20`;
- `git diff --check`: PASS.

## Frozen accounting

Mechanical comparison against authoritative F1 and exact Base/current production authoring:

- denominator: `944`;
- Base authoring cards: `144`;
- Base frozen overlap: `121/944`;
- Candidate authoring cards: `144`;
- Candidate frozen overlap: `121/944`;
- frozen additions: `[]`;
- frozen removals: `[]`;
- duplicate frozen canonical IDs: `[]`.

Therefore FB2-27 earns **zero frozen migration credit**. Formal recovery accepted remains **`121/944`**, with **`823`** remaining.

If and only if fresh independent R accepts this B2 Candidate and later A capability synchronization records that acceptance, a separate S task may attempt the exact six Ruler-family consumers named in the A dispatch. This Candidate itself does not claim `127/944`.

Historical P3-FM09 remains `MIGRATION_BLOCKED`. No FM10 is started or unblocked by FB2-27.
