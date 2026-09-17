# P3-FB2-18 Recovery Outside-Game Initial Placement Result

Date: 2026-09-17
Role: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Credit: zero frozen-migration credit

## Exact lineage

- Fresh A blocker-sync base: `eba111fc8dd61e9b45813af62c96d3fc9168d495`.
- Fresh FB2-17 blocker: `310e6546fa2457b6bf11b91e547d25eb39751e99`.
- Fresh R42-accepted FB2-16 candidate: `bc45b2032ec344d2c743d8b32e3a3d05aa8b67ca`.
- Integrated current-main baseline remains `553779e8ffcc926ae4763ee86a2ea937e090c128`.

Historical FB2-18/R43 work was used only as technical repair evidence. No historical candidate or review acceptance is inherited.

## Delivered contract

FB2-18 adds exactly one identity-free card-level representation literal:

`initialPlacement: "outside_game"`

The loader accepts only that exact value and only when attached to a `master_skill` owned by a `master.*` archive. Unsupported literals, non-string values, unsupported card types, and servant-owned disguises fail closed.

The loader preserves the accepted literal into the normalized `AuthoringCard`. The executable compiler includes the field in semantic-survival validation and places such a definition into the deferred set before ordinary initial-zone assignment. The definition remains fully registered in the executable pack but receives no `initialZone`.

Ordinary master skills without the field retain existing `initialZone: "skill"` behavior. This contract does not create, move, reveal, activate, or provision any card and does not change `interpreter.ts`, MatchSession, FB2-15 provisioning execution, card identity routing, pack registration, or authoring content.

## Compatibility and fail-closed evidence

The focused recovery regression proves:

- exact literal survives `loadAuthoringJson`;
- identity-independent owned `master_skill` + `outside_game` compiles with no `initialZone`;
- ordinary master skill without the field still begins in `skill`;
- wrong literal and non-string placement fail closed;
- command-spell use fails closed;
- servant-owned card disguised as `master_skill` fails closed;
- explicit outside-game target coexists with a valid FB2-15 game-start provisioning source;
- a provisioning source that is itself explicitly outside-game/deferred is still rejected by the accepted FB2-15 source validation.

No card ID, owner name, printed text, Reference handler, or allowlist is used in the production placement decision.

## Fresh validation

- `npm.cmd ci --offline`: PASS, 239 packages installed, 0 vulnerabilities.
- `npm.cmd run typecheck`: PASS.
- Focused FB2-18 + executable compiler + FB2-15 + FB2-16: **4 files / 63 tests PASS**.
- Client production build from `apps/client`: PASS; only the existing Vite `node:crypto` browser-externalization warning remains.
- `npm.cmd run test:ci`: **129 files / 816 tests PASS**.
- Rules core + regression: **69 files / 420 tests PASS**.
- `npm.cmd run content:validate`: **7 masters / 7 servants / 20 events / 0 blocking issues**.
- `npm.cmd run verify:generated-content`: PASS. Because no current canonical card uses the new field, all generated hashes remain unchanged from the accepted FB2-16 product baseline:
  - content library `552d78de1816ce1278effdaae5ac925e41e4273353ed6a25dab54343b9d8b869`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence report `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- Locked Reference verification at `b2f9fa15fba07c63530bbf4612b03b8b704755f9`: PASS.
- `npm.cmd run phase3:coverage`: unchanged **98 archives / 133 cards / 232 abilities**, compiled **70 cards / 14 characters / 0 blockers**, raw `22/3/127/0/80/124`.
- `npm.cmd run phase3:automation-audit`: unchanged `legacyResolveEffect=127`, `legacyExecuteAbility=3`, `notClassifiable=80`, `promotionFindings=20`.
- `git diff --check`: PASS.

Coverage/audit command-generated artifacts were restored to the checked-in baseline after recording their outputs; they are not candidate changes.

## Scope and accounting

Candidate scope is limited to the representation/compiler seam and its focused regression plus this report. No authoring archive, pack manifest, generated product file, interpreter/runtime movement path, support-only registration, taxonomy/KPI, Reference, or frozen identity changes.

FB2-18 takes zero migration credit. Accepted overlap remains `111/944` (`11.76%`), leaving `833/944`; FM09 remains `MIGRATION_BLOCKED`.

## Next gate

The next legal gate is fresh process-separated P3-R43-RECOVERY review against the exact candidate produced from this result. The reviewer must independently verify field validation, loader preservation, executable no-`initialZone` behavior, unchanged default placement, identity-free routing, no runtime movement semantics, FB2-15/FB2-16 compatibility, validation evidence, scope, lineage, and final cleanliness.

Do not retry FB2-17, dispatch the support-only registration dependency, retry FM09, or jump to Ciel until fresh R43 acceptance and fresh A synchronization.
