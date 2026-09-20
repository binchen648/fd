# P3-FB2-15 Recovery Game-Start Skill Provisioning Result

Date: 2026-09-17
Role: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`

## Lineage

- Integrated current-main baseline: `553779e8ffcc926ae4763ee86a2ea937e090c128`
- Recovery dispatch: `8376bece0e84a510aa8324f17d98c2f2deabaa07`
- Frozen F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

Historical FB2-15 candidate `61dd7af630a12bca0a71da16cc554bb65c4ce8bf` was used only as technical repair evidence for the two previously discovered R41 compiler/initialization defects. Its old review/acceptance is not inherited. This result is a newly rebuilt candidate on the integrated `111/944` main lineage and requires a fresh process-separated R41 review.

## Delivered contract

FB2-15 rebuilds one typed, identity-free game-start provisioning envelope:

```text
kind=forced_trigger
activation={ trigger: game_start }
effects=[{ type: provision_skill_cards, player: controller, targetDefinitionIds: [nonempty distinct ids...] }]
execution.mode=automatic
```

Compiler and runtime consume the same exact structural classifier. Before any initial-zone deferral, the compiler requires the whole provisioning envelope to match, requires the source to be an owned `master_skill`, and requires every target to already be a distinct registered automatic same-owner `master_skill`. The source may not provision itself or participate in another deferral path.

Runtime preflights the complete target batch before mutation. The source must be the controller-owned skill-zone card for the controller's master. Targets must remain deferred from normal initial placement, and any retained target must already be controller-owned, owner-only, face-up, inactive skill-zone material. Only missing targets are created, with deterministic runtime IDs and source attribution. Replay/restore and repeated game-start processing remain idempotent; invalid source/target state fails closed before partial creation.

No authoring migration, FM09 identity, owner-name, printed-text, or Reference-handler routing was added. No taxonomy/KPI rule, Reference input, broad Card Zone/Card Create/Trigger contract, or accepted FM08 material was changed. FB2-15 takes zero migration credit.

## Fresh validation on the recovery candidate

- `npm.cmd ci --offline`: PASS, 239 packages installed, 0 vulnerabilities.
- `npm.cmd run typecheck`: PASS.
- Focused FB2-15 compiler/runtime + FB2-14 compatibility + complex regressions: **4 files / 93 tests PASS**.
- Client production build: PASS; only the existing Vite `node:crypto` browser-externalization warning remains.
- `npm.cmd run test:ci`: **127 files / 798 tests PASS**.
- Rules core + regression: **67 files / 403 tests PASS**.
- `npm.cmd run content:validate`: **7 masters / 7 servants / 20 events / 0 blocking issues**.
- `npm.cmd run verify:generated-content`: PASS with unchanged hashes:
  - content library `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence report `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- Locked Reference verification at `b2f9fa15fba07c63530bbf4612b03b8b704755f9`: PASS.
- `npm.cmd run phase3:coverage`: unchanged **98 archives / 133 cards / 232 abilities**, compiled **70 cards / 14 characters / 0 blockers**, raw `22/3/127/0/80/124`.
- `npm.cmd run phase3:automation-audit`: unchanged `legacyResolveEffect=127`, `legacyExecuteAbility=3`, `notClassifiable=80`, `promotionFindings=20`.
- Future FM09 IDs in changed production source: none.
- `git diff --check`: PASS.

Coverage/audit command-generated artifacts were restored to the checked-in baseline after verification; no generated evidence drift is part of this candidate.

## Next gate

Run a fresh process-separated P3-R41 review from a fresh reviewer worktree/context against this exact candidate. R41 must independently verify the shared compiler/runtime classifier, validated deferral boundary, production initialization semantics, one-/multi-target atomicity, replay/restore idempotency, fail-closed malformed/source/target cases, B10/FB2-14 isolation, exact future FM09 family/exclusions, and final cleanliness.

Only after fresh R41 acceptance may Codex A synchronize the result and consider FM09 recovery. Current-main accepted overlap remains `111/944` throughout FB2-15/R41/A synchronization.
