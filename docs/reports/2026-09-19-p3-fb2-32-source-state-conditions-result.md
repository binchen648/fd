# P3-FB2-32 Source State Condition Result

Role: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Date: 2026-09-19

## Lineage

- A dispatch Base: `425c7d56e97b95b2a379bae81d49c89a2b739f65`
- Branch: `codex/b2-p3-fb2-32-source-state-conditions`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Formal recovery remains `136/944`; FB2-32 earns zero frozen migration credit.

## Implemented capability

Implemented exactly two identity-free type-only generic condition nodes:

- `{ type: "source_active" }`
- `{ type: "source_owned" }`

Semantics:

- `source_active` reuses the existing authoritative shared active-state helper: the physical source must be in `field|attack_area`, runtime-active, and face up;
- `source_owned` compares only the physical source `ownerPlayerId` with the current ability controller;
- malformed nodes with any payload beyond `type` reject rather than being silently interpreted;
- missing/nonphysical source context is a benign condition non-match (`false`), including event-rule source instances that have no physical card;
- evaluation is read-only and emits no domain event;
- no activation trigger, effect, target, interaction, lifecycle, or modifier route was added.

## Scope

Production changes are limited to:

- `packages/rules/src/ability/loader.ts`
- `packages/rules/src/ability/interpreter.ts`

Focused evidence:

- `packages/rules/tests/fb2-32-source-state-conditions.test.ts`

No F1 authoring, consumer archive, production pack registration/generated product, `data/phase3`, taxonomy/KPI, app, merge, or retarget change is included.

Production diff identity audit found no canonical consumer id, owner/name, F1 hash, Locked Reference hash, or `core.structured-skill` handler-routing token.

## Fresh validation

- dependency materialization: `npm ci --ignore-scripts` PASS, `239` packages installed; npm reports existing dependency advisories (`10 vulnerabilities`) with no lockfile change;
- typecheck: PASS;
- focused FB2-32 after reviewer revision: `1 file / 8 tests PASS`;
- core + regression + focused selection after reviewer revision: `79 files / 490 tests PASS`;
- official CI after reviewer revision: `146 files / 1025 tests PASS`;
- content validation: `7 masters / 7 servants / 20 events / 0 blocking issues`;
- generated-content determinism: PASS with unchanged hashes:
  - content library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence report `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`;
- Locked Reference verification: PASS against exact `b2f9fa15fba07c63530bbf4612b03b8b704755f9`;
- client production build: PASS; only the existing Vite `node:crypto` browser-externalization warning appeared;
- `git diff --check`: PASS;
- production identity/hash/handler scan: PASS;
- tracked worktree scope is limited to the two runtime/compiler files, one focused test, and this result report.

## Reviewer revision

Fresh R on initial Candidate `c89eac0357b2427aa9682a95f644f3e1442281bc` returned `IMPLEMENTATION_NEEDS_REVISION` at `https://github.com/binchen648/fd/pull/376#issuecomment-5742601244` with exactly two blockers. This revision closes only those findings:

1. loader acceptance is now position-aware for these two condition nodes: `source_active` / `source_owned` outside the top-level ability `conditions` route produce an unsupported report entry and disable the ability;
2. runtime condition evaluation now returns `false` when `ctx.sourceCardId` has no authoritative physical card, so valid event-rule source contexts do not throw `Card is not available`.

Focused regression evidence directly covers both reviewer probes: condition-as-effect is rejected/disabled, and a placement-backed event-rule source with `source_owned` completes without throwing or applying its guarded effect. No other capability or consumer route is added.

## Boundary

FB2-32 accepts no consumer migration and no parent trigger/effect family. It is one reusable source-state condition seam only. Formal recovery remains **`136/944`**, with **`808`** remaining. Historical `P3-FM09-RECOVERY` remains `MIGRATION_BLOCKED`.

Fresh independent R review is required before A capability synchronization.
