# P3-FB2-14 Game-Start Rule Overrides - B2 r2 Result

Date: 2026-09-16
Owner: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Base old candidate: `86afe51311ff2b6cd05ea403044e8e226b0cde7d`
Base / A handoff: `50602c9355794c9c0c7fe4d79b75f7936d912c17`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Fresh R39 result: `REVIEW_BLOCKED` on P1 and P2 below.

## r2 repairs

### P1 - first-round Situation mana ordering

`MatchSession` now processes the single trusted `match-session-game-start` event after cards and the ability runtime are initialized but before `startRound(1)`. Automatic RuleOverrides are therefore installed before the first Situation mana grant, and the constructor no longer fires the event a second time.

The new MatchSession regression injects an identity-free synthetic setup ability into the test runtime pack. It proves that the first non-climax Situation grant is capped from 2 to 1, the accepted 1 is immediately counted in the round ledger, only 1 further mana remains under the regular-round cap, and serialize/restore preserves the ledger plus exactly one processed game-start event. The temporary constructor state created by `restoreMatchSession` is replaced by the snapshot and does not replay the snapshot event.

### P2 - execution metadata fail-closed boundary

Loader normalization changes only for automatic abilities containing `install_rule_override`: absent raw `hostOps` / `allowedOperations` normalize to an empty normalized `allowedOperations` array. Explicit legal operations remain visible in normalized data. `isGameStartRuleOverrideSemantic` now requires that normalized array to exist and be empty, so both explicit `hostOps=[adjust-mana]` and `allowedOperations=[adjust-mana]` variants fail closed.

Other automatic abilities retain their prior execution normalization. No identity, name, or printed-text routing was added.

## Modified files

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/loader.ts`
- `packages/rules/src/match-session.ts`
- `packages/rules/tests/regression/fb2-game-start-rule-overrides.test.ts`

This independent r2 report is the only additional candidate file. The old B2 result report remains unchanged.

## Validation

- `npm.cmd ci`: installed the locked dependency set. npm reported the existing baseline of 10 vulnerabilities (`1 low, 4 moderate, 4 high, 1 critical`). No `npm audit fix` was run and no dependency or lockfile was changed.
- `npm.cmd run typecheck`: PASS.
- `npm.cmd test -- --run packages/rules/tests/regression/fb2-game-start-rule-overrides.test.ts`: `10/10 PASS`.
- Focused plus MatchSession/high-risk command covering the focused file, full MatchSession, effect resolver, resolution dataflow, core movement, and FB2 movement: `68/68 PASS` across 6 files.
- `npm.cmd test -- --run packages/rules/tests/regression packages/rules/tests/core`: `395/395 PASS` across 66 files.
- `npm.cmd run content:validate`: `7 masters, 7 servants, 20 events, 0 blocking issues`.
- `npm.cmd run verify:generated-content`: PASS with unchanged hashes:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- `npm.cmd run test:ci`: `737/737 PASS` across 120 files.
- `npm.cmd run phase3:coverage`: archives/cards/abilities `90/123/222`; raw `22/3/127/0/70/124`; definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`; blocking issues `0`.
- `npm.cmd run phase3:automation-audit`: legacy resolve/execute/not-classifiable `127/3/70`; promotion findings `20`.
- `git diff --check`: PASS.

The content, determinism, full-CI, coverage, and automation commands used a temporary `NODE_OPTIONS=--require=<external preload>` workaround because sandboxed Node 24 could not resolve `os.userInfo()` during `tsx` startup. The CJS shim lived outside the repository, changed only `process.geteuid` for the process environment, and is not part of the candidate. Generated coverage/audit artifacts were restored to `HEAD` and are excluded from this runtime-only candidate.

## Scope and handoff

- Authoring diff from A handoff: `0` files.
- Exact future FM08 production IDs in `packages/rules/src`: `0` matches.
- Leonardo, Ophelia, and Wodime semantics in the r2 diff: `0` matches and no broadening.
- Reference changes: `0`.
- Task index / A metadata changes: `0`.
- Strict accepted overlap remains `101/944` pending a fresh independent R39 review.

No additional semantic defect was found within the two assigned blockers. This report claims implementation completion only. It does not claim Gate acceptance, FM08 readiness, migration credit, or accepted-overlap advancement.
