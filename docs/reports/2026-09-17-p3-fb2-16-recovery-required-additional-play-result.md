# P3-FB2-16 Recovery Required Additional-Play Result

Date: 2026-09-17
Role: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`

## Lineage

- Integrated current-main baseline: `553779e8ffcc926ae4763ee86a2ea937e090c128`
- Accepted FB2-15 recovery candidate: `23a666913a3050ad55d781e3f5b3a1518add4c3e`
- FM09 fresh S blocker: `9c6e38b33de1f1d6f090e9c644d0ab66dbbee4e7`
- Fresh dependency-planning base: `ff0c9cb853d9b72273736d41ca85d8d1f08614fa`
- Frozen F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

Historical FB2-16 candidate/fix material ending at `ed7d578` was used only as technical repair evidence for already-discovered marker/effect-route edge cases. No historical R42 acceptance or downstream support-definition acceptance is inherited.

## Delivered contract

FB2-16 rebuilds one narrow identity-free required-additional-play contract.

A shared structural helper recognizes only the exact passive marker envelope whose sole effect is bare `{ type: append_only_rule }`. It rejects foreign or near-match shapes, including explicit unrelated `rule` fields, extra effect fields, wrong activation, and response-window drift. Production routing contains no card ID, owner/name, printed-text, Reference-handler, or target-definition allowlist.

The executable compiler and runtime consume that same marker. An exact required-additional `master_skill` is classified as `attack / attack_area`; standalone play remains rejected; regular batches may include one or more marked cards only when an ordinary regular attack is present. Marked cards pay in the same aggregate transaction and count as cards played, but do not consume regular attack allowance or increment `attacksDeclaredThisRound`.

Staged regular-play flow may append a marked card only after an ordinary attack is staged. Required-additional-only batches fail closed. Effect-play remains separate: `play_source_card` rejects required-additional cards, and the existing effect-batch route does not gain additional-play permission. Sieg's accepted explicit extra-regular-play allowance remains independent from append-only accounting.

Current `basic.luck` foreign `append_only_rule` behavior remains outside this classifier. No authoring migration, FM09 retry, Shirou support-definition registration, taxonomy/KPI promotion, or broad PLAY/ACTIVATE acceptance is part of this candidate.

## Deterministic product classification

Official `content:compile` changes only the executable classification of canonical Maiya Support Shot plus the executable definition hash:

- `master.maiya.deck.support-shot`: `support / field` -> `attack / attack_area`
- executable definition hash: `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333` -> `55e53412f43ec87365fe46070d5bd93aa943985d4b8121b08b5e9851eb012382`

Generated determinism PASS:

- content library SHA-256: `552d78de1816ce1278effdaae5ac925e41e4273353ed6a25dab54343b9d8b869`
- fixture SHA-256 unchanged: `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
- evidence-report SHA-256 unchanged: `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`

## Fresh validation

- `npm.cmd ci --offline`: PASS, 239 packages installed, 0 vulnerabilities.
- `npm.cmd run typecheck`: PASS.
- Focused FB2-16 compiler/runtime + FB2-14/FB2-15 compatibility: **4 files / 65 tests PASS**.
- `npm.cmd run content:compile`: PASS, **7 masters / 7 servants / 20 events / 0 blocking issues**.
- `npm.cmd run verify:generated-content`: PASS with hashes above.
- Client production build from `apps/client`: PASS; only the existing Vite `node:crypto` browser-externalization warning remains.
- `npm.cmd run test:ci`: **128 files / 807 tests PASS**.
- Rules core + regression: **68 files / 411 tests PASS**.
- `npm.cmd run content:validate`: **7 masters / 7 servants / 20 events / 0 blocking issues**.
- Locked Reference verification at `b2f9fa15fba07c63530bbf4612b03b8b704755f9`: PASS.
- `npm.cmd run phase3:coverage`: unchanged **98 archives / 133 cards / 232 abilities**, compiled **70 cards / 14 characters / 0 blockers**, raw `22/3/127/0/80/124`.
- `npm.cmd run phase3:automation-audit`: unchanged `legacyResolveEffect=127`, `legacyExecuteAbility=3`, `notClassifiable=80`, `promotionFindings=20`.
- `git diff --check`: PASS.

Coverage/audit command-generated artifacts were restored to the checked-in baseline after their outputs were recorded. They are not part of the candidate.

## Credit state and next gate

FB2-16 is runtime/compiler dependency closure only and takes zero migration credit. Accepted current-main overlap remains `111/944` (`11.76%`), leaving `833/944`.

The next legal gate is a fresh process-separated P3-R42-RECOVERY review from a fresh reviewer worktree/context against the exact candidate commit produced from this result. The reviewer must independently verify structural marker isolation, shared compiler/runtime classification, standalone/batch/staged behavior, quota/counter separation, payment rollback, effect-play/foreign-marker/Sieg isolation, generated determinism, compatibility with FB2-14/FB2-15, identity-free routing, scope, lineage, and final cleanliness.

Only after fresh R42 returns `IMPLEMENTATION_ACCEPTED_CANDIDATE` may Codex A synchronize the boundary and plan the next support-definition dependency. FM09 remains blocked; do not jump directly to Ciel.
