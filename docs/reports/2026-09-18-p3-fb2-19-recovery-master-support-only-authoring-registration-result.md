# P3-FB2-19 Recovery Master Support-Only Authoring Registration Result

Date: 2026-09-18
Role: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Credit: zero frozen-migration credit

## Exact base and lineage

- Exact fresh A blocker-synchronization base: `6e288560ea5419db5aa896ad940b5b556e29b8bd`.
- Fresh FB2-17-R1 blocker: `7e0356146766486180bcd959ee4e90dcfe193be5`.
- Fresh R43-accepted FB2-18 candidate: `cb81559033db6b96b1f26cf7d9bd15686db5d4fb`.
- Integrated current-main baseline remains `553779e8ffcc926ae4763ee86a2ea937e090c128`.

Historical FB2-19 implementation `c5ddee2...` was used only as technical repair evidence. Its old R44/downstream acceptance is not inherited. The historical patch did not apply cleanly to the current recovery base, so the generic seam was manually rebuilt against the current FB2-15/16/18 lineage.

## Delivered contract

The content manifest now has one optional, identity-free support-only channel:

`authoringMasterSupportFiles?: string[]`

The channel accepts only archives with the exact discriminator:

`archiveType: "master_support_definition_archive"`

The content loader fails closed unless a support archive:

- has an id beginning with `master.`;
- contains at least one card;
- contains only `master_skill` cards;
- gives every card exact `initialPlacement: "outside_game"`;
- defines no deck;
- defines no playable-master `publicInformation` surface.

A support archive accidentally registered through ordinary `authoringMasterFiles` is rejected rather than silently becoming a playable master.

A valid support archive enters `authoringArchives` and therefore deterministic `library.rules.archives`, but is not converted into a playable `MasterDefinition`, does not add presentation cards, and does not alter fixture seats.

The executable compiler recognizes the same exact discriminator. It compiles the support archive's card definitions and source-map entries while intentionally omitting:

- `ExecutableCharacterDefinition` creation;
- fallback command-spell synthesis;
- deck creation;
- playable-character setup material.

The support card remains structurally owned by the master archive, preserves `initialPlacement: "outside_game"`, and receives no `initialZone`. Existing ordinary master archives retain their existing character and fallback-command-spell behavior.

No production identity, production pack entry, production generated file, MatchSession/interpreter path, provisioning execution, required-additional execution, taxonomy/KPI, F1, or Reference file is changed.

Production source routing contains no Shirou identity, derived-card ID/name, printed-text rule, or Reference-handler special case.

## Fresh focused evidence

Focused run covers:

- content-loader support-only manifest and fail-closed boundaries;
- executable support-only card registration without character/fallback/deck surface;
- malformed support archive rejection;
- wrong-channel rejection;
- FB2-15 game-start skill provisioning compatibility;
- FB2-16 required-additional compatibility;
- FB2-18 outside-game placement compatibility.

Result: **5 files / 91 tests PASS**.

The generic loader tests verify a support archive enters rules-only material while the playable master roster and fixture seats remain unchanged. Compiler tests verify exactly one support card is added, no support owner character/fallback/deck appears, the support card has no `initialZone`, and existing servant archive source-map indices remain stable.

## Full validation

- `npm.cmd ci --offline`: PASS, 239 packages, 0 vulnerabilities.
- `npm.cmd run typecheck`: PASS.
- Client production build from `apps/client`: PASS; only the existing Vite `node:crypto` browser-externalization warning remains.
- First `npm.cmd run test:ci`: one 5-second timeout in `scripts/tests/phase3-full-roster-inventory.test.ts`; no assertion or semantic failure.
- Isolated rerun of that file: **12/12 PASS**, with the previously timed-out case completing in ~340ms.
- Official `npm.cmd run test:ci` rerun unchanged: **129 files / 832 tests PASS**.
- Rules core + regression: **69 files / 420 tests PASS**.
- `npm.cmd run content:validate`: **7 masters / 7 servants / 20 events / 0 blocking issues**.
- `npm.cmd run verify:generated-content`: PASS; production generated hashes remain unchanged:
  - content library `552d78de1816ce1278effdaae5ac925e41e4273353ed6a25dab54343b9d8b869`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence report `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- Locked Reference verification at `b2f9fa15fba07c63530bbf4612b03b8b704755f9`: PASS.
- Phase 3 coverage remains **98 archives / 133 cards / 232 abilities**, compiled **70 cards / 14 characters / 0 blockers**, raw `22/3/127/0/80/124`.
- Automation audit remains `legacyResolveEffect=127`, `legacyExecuteAbility=3`, `notClassifiable=80`, `promotionFindings=20`.
- `git diff --check`: PASS.

The first full-CI timeout is treated as local performance jitter because the same test passed immediately in isolation and the unchanged official full suite subsequently passed completely. No timeout or test-source change was made.

Coverage/audit command-generated artifact rewrites were restored to the checked-in base after recording their outputs.

## Scope and accounting

This candidate changes only the generic support-only registration seam, its focused tests, and this result report. It does not add any support card or frozen identity to production data.

FB2-19 therefore takes zero frozen-migration credit. Accepted overlap remains **111/944**, leaving **833/944**. P3-FM09 remains `MIGRATION_BLOCKED`.

## Next gate

The next legal step is fresh process-separated `P3-R44-RECOVERY` review from a fresh reviewer worktree/context against the exact candidate commit containing this report.

The reviewer must independently recheck the exact manifest/discriminator contract, fail-closed malformed and wrong-channel behavior, rules-only assembly, unchanged playable/presentation roster, executable card-only registration, absence of character/fallback/deck generation, stable normal archive behavior, FB2-15/16/18 compatibility, identity-free routing, unchanged production generated content, zero-credit accounting, exact scope, full validation, and final cleanliness.

Do not start FB2-17-R2, FM09 retry, FM10, or Ciel before fresh R44 acceptance and post-review A synchronization.
