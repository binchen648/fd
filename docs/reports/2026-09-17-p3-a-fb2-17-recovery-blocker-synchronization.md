# P3-A FB2-17 Recovery Blocker Synchronization

Date: 2026-09-17
Role: Codex A
Status: `BLOCKER_SYNCHRONIZED`

## Exact lineage

- Fresh R42 A synchronization: `b934ea69390b159176ad295116ccc8d9fe0506c7`.
- Fresh FB2-17 recovery blocker: `310e6546fa2457b6bf11b91e547d25eb39751e99`.
- The blocker commit directly descends from the A synchronization and contains only `docs/reports/2026-09-17-p3-fb2-17-recovery-shirou-derived-card-support-definition-result.md`.
- Accepted FB2-16 recovery candidate remains `bc45b2032ec344d2c743d8b32e3a3d05aa8b67ca`.
- Current integrated-main baseline remains `553779e8ffcc926ae4763ee86a2ea937e090c128`.

## Fresh blocker synchronized

The fresh S probe reconfirms that the exact Shirou derived support definition cannot be accepted inside the current P3-FB2-17-RECOVERY contract.

Three independent dependencies were exposed:

1. **Outside-game representation:** a standalone owned `master_skill` is currently compiled with `initialZone: "skill"`, while F1 requires the derived card to begin outside game and enter skill only through game-start provisioning.
2. **Support-only registration:** registering the archive through current `authoringMasterFiles` makes Shirou an eighth playable master and synthesizes an unintended fallback command spell. A support-only/rules-only master registration seam is required later.
3. **Generated-output contract:** official deterministic generation materially changes the evidence report as well as the content library. A later retry must authorize legitimate generated outputs rather than hiding them.

The fresh S blocker took zero migration credit and committed no canonical authoring, pack, runtime, generated product, taxonomy/KPI, or frozen identity.

## Dispatch decision

The narrowest prerequisite is the first blocker only: an identity-free card-level representation seam `initialPlacement: "outside_game"` for owned `master_skill` definitions.

P3-FB2-18-RECOVERY must preserve this field through authoring loading and executable compilation, register the definition, and omit `initialZone`. It must not move/create cards, change game-start provisioning behavior, introduce support-only registration, touch authoring/product content, or take migration credit.

Support-only registration and generated-output reconciliation remain later, separately reviewable dependencies. P3-FM09 remains `MIGRATION_BLOCKED`; no FM10 or Ciel task is authorized. Accepted overlap remains `111/944` (`11.76%`), leaving `833/944`.
