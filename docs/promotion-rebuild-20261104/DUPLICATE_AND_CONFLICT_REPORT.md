# Duplicate And Conflict Report

Baseline: e63cdeb2a065a9f87c24039d2b08bbe059513fed. This report compares exact Git trees and changed-path overlap; path overlap alone is not treated as semantic duplication.

## Exact head-tree duplicate groups

- Tree 051d0a4854214e2d8ba527dd38894516a76e27c0: #4, #6, #7, #8, #9
- Tree 4622f32dced1b52ed3d1f02b4d90d1b729f49f30: #13, #32
- Tree 6879ca34957ca14a577826eea121fa294b04c96d: #10, #36
- Tree b50f2d1a63a2ed3ed9bebf882fc35c00f39b2572: #417, #421
- Tree c5ac7816c059adb97378a01e80a40b4921d25cf3: #33, #34

## Most frequently overlapping paths

| Path | PR count |
|---|---:|
| docs/agents/PHASE3-TASK-INDEX.md | 251 |
| packages/rules/src/ability/interpreter.ts | 237 |
| packages/rules/src/ability/loader.ts | 204 |
| packages/rules/src/ability/types.ts | 168 |
| packages/rules/src/match-session.ts | 157 |
| data/generated/fd-playtest-v1.content-library.json | 147 |
| packages/rules/src/index.ts | 134 |
| data/phase3/full-roster-ability-inventory.json | 128 |
| data/packs/fd-playtest-v1/pack.json | 127 |
| data/generated/fd-playtest-v1.evidence-report.json | 127 |
| data/phase3/full-roster-runtime-capability-requests.json | 114 |
| docs/reports/phase3-full-roster-runtime-capability-requests.md | 114 |
| docs/audits/fd-full-roster-capability-catalog.md | 113 |
| data/phase3/full-roster-capability-catalog.json | 113 |
| scripts/tests/phase3-full-roster-capabilities.test.ts | 113 |
| packages/rules/src/core/combat-resolver.ts | 112 |
| scripts/tests/phase3-full-roster-semantics.test.ts | 110 |
| docs/audits/fd-full-roster-semantic-axis-matrix.md | 110 |
| scripts/phase3-reference/map-phase3-capabilities.ts | 109 |
| packages/rules/src/ability/executable-card-pack.ts | 108 |
| docs/reports/phase3-full-roster-rule-decisions.md | 107 |
| data/phase3/full-roster-rule-decisions.json | 107 |
| scripts/tests/phase3-decision-packets.test.ts | 107 |
| packages/rules/src/ability/resolution-dataflow.ts | 105 |
| data/phase3/full-roster-source-evidence-overlays.json | 105 |
| scripts/tests/phase3-full-roster-audit.test.ts | 104 |
| docs/reports/2026-09-15-phase3-full-roster-automation-audit.md | 102 |
| packages/rules/tests/match-session.test.ts | 100 |
| packages/rules/tests/executable-card-pack.test.ts | 91 |
| packages/rules/src/schema/game.ts | 89 |
| packages/rules/src/core/game-loop.ts | 86 |
| apps/server/src/match-server.test.ts | 84 |
| packages/rules/tests/regression/golden-flow-2-combat-power-winner-vp.test.ts | 84 |
| packages/rules/src/match-room-hub.ts | 84 |
| packages/rules/src/core/movement.ts | 84 |
| apps/server/src/match-server.ts | 84 |
| packages/rules/tests/regression/fb2-game-start-rule-overrides.test.ts | 83 |
| packages/rules/src/match-room.ts | 83 |
| packages/rules/tests/regression/complex-skills-regression.test.ts | 82 |
| packages/content/src/playtest-pack-loader.ts | 81 |

## Active-reservation conflicts

- PR #690 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #689 [BLOCKED] touches: apps/server/src/index.ts, apps/server/src/match-server.ts
- PR #688 [ALREADY_INCLUDED] touches: .github/workflows/test.yml, apps/client/src/state/match-room-client.test.ts, apps/client/src/state/match-room-client.ts, apps/server/src/index.ts, apps/server/src/match-server.ts, apps/server/src/room-store.test.ts, apps/server/src/room-store.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #687 [ALREADY_INCLUDED] touches: .github/workflows/test.yml
- PR #686 [ALREADY_INCLUDED] touches: packages/rules/src/match-session.ts
- PR #684 [ALREADY_INCLUDED] touches: packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #683 [ALREADY_INCLUDED] touches: packages/rules/src/match-session.ts
- PR #682 [ALREADY_INCLUDED] touches: packages/rules/src/match-session.ts, packages/rules/tests/match-room-hub.test.ts
- PR #681 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #680 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #679 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #678 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #677 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #676 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #675 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #674 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #670 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #666 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #664 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #663 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #662 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #658 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #655 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #654 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #651 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #650 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #649 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #648 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #647 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #646 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #645 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #644 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #643 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #642 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #641 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #640 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #639 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #638 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #637 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #636 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #635 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #634 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #633 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #632 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #631 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #630 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #629 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #628 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #627 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #626 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #625 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #624 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #623 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #622 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #621 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #620 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #619 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #618 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #617 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #616 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #615 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #614 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #613 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #612 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #611 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #610 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #609 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #608 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #607 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #606 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #605 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #604 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #603 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #602 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #601 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #600 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #599 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #598 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #597 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #596 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #595 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #594 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #593 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #592 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #591 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #590 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #589 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #588 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #587 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #563 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #559 [ALREADY_INCLUDED] touches: apps/client/src/state/match-room-client.ts, apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/tests/match-room-hub.test.ts
- PR #557 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #555 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #549 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #548 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #547 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #545 [ALREADY_INCLUDED] touches: .github/workflows/test.yml
- PR #544 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #540 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #535 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #533 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #526 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #524 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #522 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #518 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #517 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #515 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #513 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #511 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #510 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #507 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #505 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #497 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #493 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #492 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #490 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #489 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #487 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #485 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #483 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #481 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #478 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #476 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #472 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #470 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #469 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #466 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #463 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #461 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #459 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #458 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #457 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #453 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #452 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #451 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #450 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #445 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #441 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #440 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #439 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #438 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #436 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #433 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #427 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #424 [ALREADY_INCLUDED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts, packages/rules/tests/match-room-hub.test.ts
- PR #422 [ALREADY_INCLUDED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts, packages/rules/tests/match-room-hub.test.ts
- PR #415 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #413 [ALREADY_INCLUDED] touches: packages/rules/src/match-session.ts
- PR #405 [ALREADY_INCLUDED] touches: .github/workflows/test.yml
- PR #387 [ALREADY_INCLUDED] touches: packages/rules/src/match-session.ts
- PR #385 [ALREADY_INCLUDED] touches: packages/rules/src/match-session.ts
- PR #367 [ALREADY_INCLUDED] touches: packages/rules/src/match-session.ts
- PR #348 [ALREADY_INCLUDED] touches: packages/rules/src/match-session.ts
- PR #347 [ALREADY_INCLUDED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #346 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #340 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #333 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #40 [BLOCKED] touches: packages/rules/src/match-session.ts
- PR #39 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-room.ts, packages/rules/src/match-session.ts
- PR #35 [ALREADY_INCLUDED] touches: packages/rules/src/match-session.ts
- PR #28 [ALREADY_INCLUDED] touches: packages/rules/src/match-session.ts
- PR #5 [BLOCKED] touches: apps/server/src/match-server.ts, packages/rules/src/match-room-hub.ts, packages/rules/src/match-session.ts

A repeated path is a conflict candidate, not permission to combine changes. Runtime, content, master/data, and integration slices must be replayed and checked against the current contract before any consolidation.
