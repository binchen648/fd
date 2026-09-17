# P3-A FB2-17 Recovery Blocker Synchronization

Date: 2026-09-17
Role: Codex A
Status: `BLOCKER_SYNCHRONIZED`

## Exact lineage

- Fresh R42-accepted FB2-16 recovery candidate: `bc45b2032ec344d2c743d8b32e3a3d05aa8b67ca`.
- Fresh post-R42 A synchronization: `b934ea69390b159176ad295116ccc8d9fe0506c7`.
- Fresh FB2-17 recovery blocker: `310e6546fa2457b6bf11b91e547d25eb39751e99`.
- Frozen F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`.
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.

Historical FB2-17/18/19 work is technical planning evidence only; no old implementation or review acceptance is inherited.

## S result synchronized

Fresh S returns `SUPPORT_DEFINITION_BLOCKED` without committing Shirou authoring, pack registration, runtime changes, generated product files, taxonomy/KPI changes, or any frozen identity.

A same-base detached material probe independently demonstrates that the requested support card's source/static/required-additional semantics are valid, but three representation/product-envelope blockers remain on the current integrated recovery lineage:

1. The standalone owned `master_skill` compiles with `initialZone: "skill"`, contradicting F1's game-start from-outside-game relationship.
2. Registering the archive through ordinary `authoringMasterFiles` makes Shirou an eighth playable master and synthesizes an unintended fallback command spell.
3. Normal deterministic generation materially changes both the content library and the evidence report, while the current FB2-17 May-touch list authorizes only the content library.

The probe keeps FB2-15 provisioning `7/7` and FB2-16 required-additional `8/8` green. The failed focused checks are roster/count/index effects caused by the unsupported registration path, not regressions in those accepted runtime contracts.

Accepted frozen overlap remains `111/944` (`11.76%`), leaving `833/944`; FM09 remains `MIGRATION_BLOCKED`.

## Dependency decision

The narrowest prerequisite is the card-level representation problem, because the support card cannot be semantically correct at all until it can be registered outside game with no `initialZone`.

P3-FB2-18-RECOVERY is therefore dispatched as an identity-free representation/compiler task. It may add only a card-level `initialPlacement: "outside_game"` contract for owned `master_skill` definitions, preserve that field through authoring loading, and cause executable compilation to register such a definition without assigning `initialZone`.

This task must not move/create cards, modify FB2-15 provisioning execution, register Shirou, add a support-only manifest path, migrate any frozen identity, change MatchSession/interpreter behavior, or touch taxonomy/KPI.

A separate support-only/rules-only registration seam will still be required after FB2-18 is independently accepted. That later dependency is not dispatched yet.
