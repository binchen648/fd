# P3-FB2-21 Recovery — Shared Terrain / Deployment-Bonus Metric Result

Date: 2026-09-18
Role: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Credit: zero frozen-migration credit

## Exact base and scope

- Base: `98ce9b0c3967c598f9fb7d2736f418e15dcc5d30`.
- Integrated main ancestor: `553779e8ffcc926ae4763ee86a2ea937e090c128`.
- Handoff: `docs/reports/2026-09-18-p3-fb2-21-recovery-terrain-deployment-bonus-metric-handoff.md`.

The implementation is identity-free infrastructure only. It adds no Ciel or other frozen identity, no authoring archive, no pack registration, no generated product change, and no migration credit.

## Implementation

A new shared pure helper module `packages/rules/src/core/terrain-advantage.ts` now owns the terrain/deployment-bonus truth that was previously embedded in combat resolution:

- server-owned terrain assignment lookup;
- authored terrain bonus by slot;
- authored terrain multipliers;
- existing Preparation remote-operation doubling;
- existing authored terrain suppression;
- fail-closed zero for missing/invalid assignment and non-battlefield locations;
- pure read semantics with no mutation or events.

`combat-resolver.ts` consumes the same `terrainBonusAt(...)` helper, preserving the existing explicit participant `terrainSlotIndex` API while removing duplicated terrain multiplier / remote-operation / suppression logic.

The authoring formula loader recognizes exactly one new controlled server metric:

`controller.deployment_bonus`

The interpreter resolves that metric through `currentDeploymentBonus(state, controllerId)`. Near-match variables remain unsupported/fail closed. No identity, card name, printed text, Reference handler, or target allowlist participates in routing.

## Focused adversarial evidence

`packages/rules/tests/regression/fb2-terrain-deployment-bonus-metric.test.ts` adds seven identity-independent checks:

1. exact metric accepted; four near-match variables rejected;
2. server-owned assignments resolve independently for two controllers at different battlefields;
3. combat and metric share the same base authored terrain value;
4. authored multiplier is applied exactly once;
5. Preparation remote-operation doubling is applied exactly once;
6. authored suppression, missing assignment, invalid slot, and non-battlefield location all yield zero; the non-battlefield test injects a synthetic terrain bonus to prove the battlefield-tag guard is explicit rather than accidental;
7. repeated metric reads do not mutate game state, events, counters, or ability runtime.

Focused metric + existing combat resolver suite: **2 files / 17 tests PASS**.

## Validation

- `npm ci --offline`: PASS, 239 packages, 0 vulnerabilities.
- `npm run typecheck`: PASS.
- focused metric + combat tests: `17/17` PASS.
- rules core + regression: **70 files / 427 tests PASS**.
- client production build: PASS (existing Vite `node:crypto` externalization warning only).
- `npm run content:validate`: **7 masters / 7 servants / 20 events / 0 blockers**.
- `npm run content:compile`: PASS.
- `npm run verify:generated-content`: PASS with unchanged hashes:
  - content library `c9841d4bad3d43a525895372fabd3b49ea07e79075652a5cbd18fad3405e2e1e`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence report `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- locked Reference verification at `b2f9fa15fba07c63530bbf4612b03b8b704755f9`: PASS.
- coverage unchanged: `99 archives / 134 cards / 233 abilities`, compiled `71/14/0`, buckets `22/3/128/0/80/126`.
- automation audit unchanged: `128/3/80/20`.
- `git diff --check`: PASS.

## Full-CI timing disclosure

The unchanged official `npm run test:ci` gate was run repeatedly on the final implementation. Each final-candidate run collected the full suite and had exactly one failure: the pre-existing fixed-5-second test

`packages/rules/tests/match-session.test.ts` -> `runs eleven rounds or pauses with an explicit handled reason`

with observed parallel-suite times around `5.1-5.2s`. Every other candidate test passed: **841 PASS / 1 timing timeout** across 130 files / 842 tests.

This result is not represented as a green official gate and the timeout/test was not modified.

Independent timing evidence does not show a production performance regression from FB2-21:

- exact Base `98ce9b0...`, after the required workspace build, completed the unchanged official 129-file `test:ci` **835/835 PASS**, but the same long test took `4979ms`, only 21ms under its fixed timeout;
- isolated exact-Base long-test timings: approximately `1925ms`, `1950ms`, `2002ms`;
- isolated final-Candidate timings: approximately `1915ms`, `1947ms`, `1941ms`;
- restoring the old 129-file suite shape by excluding only the new FB2-21 regression still produced the same candidate timeout (`5206ms`), so the extra test file is not the cause;
- full final-Candidate suite with only runner `--testTimeout=15000` changed (no repo mutation) passes **130 files / 842 tests**; the long test completed in `5175ms` on that run.

Fresh R46 must independently assess this timing evidence; B2 does not convert it into reviewer acceptance.

## Scope and accounting

Candidate scope is exactly the shared helper, combat reuse, controlled metric loader/interpreter route, one focused regression file, and this result report. There are no authoring/data/generated/taxonomy/KPI/Reference changes and no Ciel-specific production route.

FB2-21 takes zero frozen identity credit. Accepted frozen overlap remains **111/944**, leaving **833/944**. Ciel s2 and the other ten frozen provisioning targets remain absent. P3-FM09 remains `MIGRATION_BLOCKED` pending accepted target dependencies.

A fresh independent R46 review is mandatory. Do not treat this B2 candidate as accepted infrastructure before that review and post-review A synchronization.