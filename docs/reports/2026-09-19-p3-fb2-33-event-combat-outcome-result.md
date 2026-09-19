# P3-FB2-33 Event Combat Outcome Relation Result

Role: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Date: 2026-09-19

## Lineage

- A dispatch Base: `d858de4c786bd717ac29226a619bd29ed28a3ea1`
- Branch: `codex/b2-p3-fb2-33-event-combat-outcome`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Formal recovery remains `136/944`; FB2-33 earns zero frozen migration credit.

## Implemented capability

Implemented exactly two identity-free, exact type-only generic condition nodes:

- `{ type: "event_player_won_combat" }`
- `{ type: "event_player_lost_combat" }`

Semantics:

- evaluation uses only trusted `AbilityEvent.playerId` and trusted `AbilityEvent.battleResult`;
- won is true iff the known event player is present in `battleResult.winners`;
- lost is true iff the known event player is present in `battleResult.loserIds`;
- missing/unknown actor, missing result, unknown outcome player ids, duplicate ids, or winner/loser overlap fail closed to false;
- the two nodes are accepted only under ability `conditions`; non-condition placement is disabled by the loader;
- payload-bearing near-matches reject rather than silently broaden behavior;
- evaluation is read-only and emits no event;
- no activation trigger, effect, target, interaction, lifecycle, modifier, consumer migration, or event-producer route was added.

Locked Reference source authoring contains 13 occurrences across this pair and every occurrence is exact type-only shape.

## Scope

Production changes are limited to:

- `packages/rules/src/ability/loader.ts`
- `packages/rules/src/ability/interpreter.ts`

Focused evidence:

- `packages/rules/tests/fb2-33-event-combat-outcome.test.ts`

No F1 authoring, consumer archive, production pack/generated product, `data/phase3`, taxonomy/KPI, app behavior, merge, or retarget change is included.

Production diff identity audit found no canonical consumer id/owner/name, F1 hash, Locked Reference hash, or `core.structured-skill` handler-routing token.

## Fresh validation

The final validation environment was materialized in this exact worktree with `npm ci --ignore-scripts --offline`, installing 239 packages and preserving workspace `@fd/*` links to this worktree. An earlier cross-worktree `node_modules` junction attempt was discarded before formal evidence because its workspace links pointed at the previous FB2-32 worktree.

Final accepted evidence on the correct worktree:

- dependency materialization: PASS, 239 packages, 0 vulnerabilities;
- typecheck: PASS;
- focused FB2-33: `1 file / 7 tests PASS`;
- core + regression + focused: `79 files / 489 tests PASS`;
- official CI: `147 files / 1032 tests PASS`;
- content validation: `7 masters / 7 servants / 20 events / 0 blocking issues`;
- generated-content determinism: PASS with unchanged hashes:
  - content library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence report `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`;
- Locked Reference verification: PASS against exact `b2f9fa15fba07c63530bbf4612b03b8b704755f9`;
- client production build: PASS; only the existing Vite `node:crypto` browser-externalization warning appeared;
- `git diff --check`: PASS;
- production identity/hash/handler audit: PASS.

## Boundary

FB2-33 accepts no consumer migration and no parent combat trigger/event-producer family. It is only the reusable event-player combat-outcome condition seam. Formal recovery remains **`136/944`**, with **`808`** remaining. Historical `P3-FM09-RECOVERY` remains `MIGRATION_BLOCKED`.

Fresh independent R review is required before A capability synchronization.
