# P3-FB2-18 Recovery Outside-Game Initial Placement Result

Date: 2026-09-17
Role: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Credit: zero frozen-migration credit

## Exact base

- Fresh A blocker-synchronization base: `d87e74007f2cf723b2436f27f284ebd09145a48f`.
- Fresh FB2-17 blocker: `310e6546fa2457b6bf11b91e547d25eb39751e99`.
- Fresh R42-accepted FB2-16 recovery candidate: `bc45b2032ec344d2c743d8b32e3a3d05aa8b67ca`.
- Integrated current-main baseline remains `553779e8ffcc926ae4763ee86a2ea937e090c128`.
- Locked Reference remains `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.

Historical FB2-18 implementation `6a6d00b...` was used only as technical repair evidence for a previously identified representation seam. No historical R43 acceptance or downstream support-definition acceptance is inherited.

## Delivered contract

FB2-18 adds exactly one identity-free optional authoring representation field:

`initialPlacement: "outside_game"`

The loader accepts only that exact literal, only for an owned `master_skill` inside a `master.*` archive, and preserves it on the normalized `AuthoringCard`. Unknown values, unsupported card types, and servant-owned disguises fail closed through normal loader reporting.

Executable compilation treats a card carrying that exact field as explicitly deferred: the definition remains registered, but no `initialZone` is assigned. The compiler also preserves the field through semantic-survival validation and rejects any invalid non-master-skill use that somehow reaches the executable layer.

Ordinary owned `master_skill` definitions without `initialPlacement` retain the pre-existing default `initialZone: "skill"` path. Existing FB2-15 source-driven game-start provisioning deferral remains intact; an explicitly deferred card cannot silently become a provisioning source. No card creation/movement/runtime dispatch behavior was added.

Production routing contains no Shirou/card ID, owner/name, printed-text, target-definition, or Reference-handler allowlist. No authoring, pack manifest, generated content, interpreter, MatchSession, support-only registration, taxonomy/KPI, frozen migration, or Reference file changes are part of this candidate.

## Fresh focused evidence

The new focused regression contains 9 tests covering:

- exact literal preservation through `loadAuthoringJson`;
- owned `master_skill` registration with no `initialZone`;
- unchanged default skill-zone placement for ordinary master skills;
- fail-closed malformed/unknown placement values;
- fail-closed unsupported card types;
- fail-closed servant-owned cards disguised as `master_skill`;
- coexistence with FB2-15 provisioning without weakening source/target validation;
- rejection of a game-start provisioning source that is itself explicitly deferred.

Focused FB2-18 + executable compiler + FB2-15 + FB2-16 run: **4 files / 63 tests PASS**.

## Full validation

- `npm.cmd ci --offline`: PASS, 239 packages installed, 0 vulnerabilities.
- `npm.cmd run typecheck`: PASS.
- Client production build from `apps/client`: PASS; only the existing Vite `node:crypto` browser-externalization warning remains.
- `npm.cmd run test:ci`: **129 files / 816 tests PASS**.
- Rules core + regression: **69 files / 420 tests PASS**.
- `npm.cmd run content:validate`: **7 masters / 7 servants / 20 events / 0 blocking issues**.
- `npm.cmd run verify:generated-content`: PASS; generated product hashes are unchanged from the accepted FB2-16 baseline:
  - content library `552d78de1816ce1278effdaae5ac925e41e4273353ed6a25dab54343b9d8b869`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence report `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- Locked Reference verification at `b2f9fa15fba07c63530bbf4612b03b8b704755f9`: PASS.
- `npm.cmd run phase3:coverage`: unchanged **98 archives / 133 cards / 232 abilities**, compiled **70 cards / 14 characters / 0 blockers**, raw `22/3/127/0/80/124`.
- `npm.cmd run phase3:automation-audit`: unchanged `legacyResolveEffect=127`, `legacyExecuteAbility=3`, `notClassifiable=80`, `promotionFindings=20`.
- `git diff --check`: PASS.

Coverage/audit command-generated artifacts were restored to the checked-in baseline after their outputs were recorded.

## Scope and next gate

FB2-18 is representation/compiler dependency closure only and takes zero migration credit. Accepted current-main overlap remains `111/944` (`11.76%`), leaving `833/944`.

This candidate intentionally does **not** solve the other two FB2-17 blockers: support-only/rules-only registration and generated-output contract reconciliation. It therefore does not authorize a direct FB2-17 retry, FM09 retry, FM10, or Ciel task.

The next legal gate is fresh process-separated `P3-R43-RECOVERY` review from a fresh reviewer worktree/context against the exact candidate commit containing this report. The reviewer must independently verify exact field validation, loader preservation, executable no-`initialZone` behavior, unchanged default placement, identity-free routing, absence of runtime movement semantics, FB2-15/FB2-16 compatibility, full validation, scope, zero-credit accounting, and final cleanliness.
