# P3-FB2-31 Event Player Relation Condition Result

Role: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Date: 2026-09-19

## Lineage

- A dispatch Base: `26042ddf24284d2ecbe053ee70cb447c28f03cc2`
- Branch: `codex/b2-p3-fb2-31-event-player-relation`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Formal recovery remains `136/944`; FB2-31 earns zero frozen migration credit.

## Implemented capability

Implemented exactly two identity-free generic condition nodes:

- `{ type: "event_player_is_controller" }`
- `{ type: "event_player_is_opponent" }`

The runtime evaluates only trusted `AbilityEvent.playerId` against the current ability controller:

- controller relation is true only for a known repository player equal to the controller;
- opponent relation is true only for a known repository player different from the controller;
- missing/empty/unknown event actor fails closed as false;
- malformed nodes with extra payload fields reject rather than being silently interpreted.

The loader recognizes the two node types but enforces the exact type-only structural shape. No trigger was added to the accepted trigger set, and a synthetic unaccepted trigger remains reported as `Unmapped trigger` even when paired with the new condition.

Condition evaluation is read-only. Focused tests snapshot authoritative state around controller/opponent evaluation and malformed-runtime rejection.

## Scope

Production changes are limited to:

- `packages/rules/src/ability/loader.ts`
- `packages/rules/src/ability/interpreter.ts`

Focused evidence:

- `packages/rules/tests/fb2-31-event-player-relation.test.ts`

This task does not change F1 authoring, consumer archives, production pack registration, generated product, `data/phase3`, taxonomy/KPI, apps, merge topology, or PR retargeting.

Production diff identity audit found no Arcueid/Ciel identity, canonical consumer ID, F1 hash, Locked Reference hash, or `core.structured-skill` handler-routing token.

## Fresh validation

- dependency materialization: `npm ci --ignore-scripts` PASS, `239` packages installed; npm audit reports existing dependency advisories (`10 vulnerabilities`) and no lockfile change was made;
- typecheck: PASS (`npm.cmd run typecheck`);
- focused FB2-31: `1 file / 6 tests PASS`;
- core + regression + focused selection: `79 files / 488 tests PASS`;
- official CI: `145 files / 1017 tests PASS`;
- content validation: `7 masters / 7 servants / 20 events / 0 blocking issues`;
- generated-content determinism: PASS with unchanged hashes:
  - content library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence report `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`;
- Locked Reference verification: PASS against exact `b2f9fa15fba07c63530bbf4612b03b8b704755f9`;
- client production build: PASS; only the existing Vite `node:crypto` browser-externalization warning appeared;
- `git diff --check`: PASS;
- production identity/hash/handler scan: PASS;
- tracked worktree contains only the two runtime files, one focused test, and this result report.

The first focused invocation before workspace TypeScript outputs existed could not collect because `@fd/content/rules` was not materialized. `npm.cmd run typecheck` generated the normal workspace build outputs; the unchanged focused test then passed `6/6`. This was worktree bootstrap sequencing, not a Candidate assertion failure.

## Boundary

FB2-31 accepts no consumer migration and no parent trigger/effect family. It is one reusable condition-evaluation seam only. Formal recovery remains **`136/944`**, with **`808`** remaining. Historical `P3-FM09-RECOVERY` remains `MIGRATION_BLOCKED`.

Fresh independent R review is required before A capability synchronization.
