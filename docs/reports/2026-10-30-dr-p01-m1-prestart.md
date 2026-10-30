# DR-P01 M1 prestart audit

Observed origin/main and new Base: `7724bff0d849e13e5b6725c5b05f76dc6c03bce4`.
Frozen source reference: `2c50256280ef0ebdb1c1366cb09984530fd868ff`; historical technical Base: `f70120e48284a2c5409320fa02b8cadce1e7899a`.
New branch: `codex/dr-p01-m1-integration-20261030`. New worktree: `D:/fd-validation/dr-p01-m1-integration-20261030`.

Same owner: Feature Delivery Lead /root/dr_p01_delivery_lead. Transfer is recorded under explicit user authority; no external Owner ACK or remote publication is claimed. Original reservation/task bytes and frozen branch remain unchanged. Old binding becomes a frozen reference, with no concurrent writable grant.

30 exact paths = 9 production source + 19 tests/test support + 2 manifests. This is static scope verification, not runtime acceptance. No source has been replayed; no tests have run.

| # | Path | Category / handling | Reason |
|---|---|---|---|
| 1 | `apps/client/src/pages/MatchTable.test.tsx` | TEST_OR_TEST_SUPPORT / REPLAY_MINIMUM_DELTA_THEN_REVERIFY | Verify backend actions, progress text and end-turn disable/enable. |
| 2 | `apps/client/src/pages/MatchTable.tsx` | PRODUCTION_SOURCE / REPLAY_MINIMUM_DELTA_THEN_REVERIFY | Render authoritative action progress and public power; gate both end-turn buttons. |
| 3 | `apps/client/src/state/playtest-fixture-loader.ts` | PRODUCTION_SOURCE / REPLAY_MINIMUM_DELTA_THEN_REVERIFY | Add optional actionTurn and totalPower projection types. |
| 4 | `apps/client/src/state/remote-room-fixture.ts` | PRODUCTION_SOURCE / REPLAY_MINIMUM_DELTA_THEN_REVERIFY | Carry server action progress/power and map normal move/skip/empty-batch actions. |
| 5 | `apps/client/src/state/seven-authoring-smoke-fixture.ts` | PRODUCTION_SOURCE / REPLAY_MINIMUM_DELTA_THEN_REVERIFY | Carry local seven-seat projection and labels for new server actions. |
| 6 | `apps/server/src/match-server.test.ts` | TEST_OR_TEST_SUPPORT / REPLAY_MINIMUM_DELTA_THEN_REVERIFY | Raw WS authority, stale/replay rejection and authenticated durable restore coverage. |
| 7 | `docs/agents/manifests/reservations/DR-P01.json` | MANIFEST / REBIND_METADATA | Rewrite current binding, exact scope and authority; never copy obsolete base binding verbatim. |
| 8 | `docs/agents/manifests/tasks/DR-P01.json` | MANIFEST / REBIND_METADATA | Rewrite M1 task scope, dependencies, worktree and merged PR561 disposition. |
| 9 | `e2e/fd-action-turn-delivery.spec.ts` | TEST_OR_TEST_SUPPORT / REPLAY_MINIMUM_DELTA_THEN_REVERIFY | Real seven-seat browser/WS movement, staging, complete batch, reconnect and replay. |
| 10 | `e2e/fd-time-alter-core-primitive.spec.ts` | TEST_OR_TEST_SUPPORT / REPLAY_MINIMUM_DELTA_THEN_REVERIFY | Retain natural Origin Bullet legality regression and adapt ordinary action setup. |
| 11 | `e2e/support/start-action-turn-fixture-server.ts` | TEST_OR_TEST_SUPPORT / REPLAY_MINIMUM_DELTA_THEN_REVERIFY | Test-only real HTTP/WS server setup and readiness output for seven-seat E2E. |
| 12 | `packages/rules/src/__tests__/match-session-regressions.test.ts` | TEST_OR_TEST_SUPPORT / REPLAY_MINIMUM_DELTA_THEN_REVERIFY | Adapt staging and battle-dash setup to move/skip then complete regular batch. |
| 13 | `packages/rules/src/ability/interpreter.ts` | PRODUCTION_SOURCE / REPLAY_MINIMUM_DELTA_THEN_REVERIFY | Combine minimum A0 attack/effect target legality with DR action progression, batch legality, movement and private staging. |
| 14 | `packages/rules/src/ability/types.ts` | PRODUCTION_SOURCE / REPLAY_MINIMUM_DELTA_THEN_REVERIFY | Action command union, versioned continuation, reveal-event and public projection types. |
| 15 | `packages/rules/src/core/combat-resolver.ts` | PRODUCTION_SOURCE / REPLAY_MINIMUM_DELTA_THEN_REVERIFY | Pure public current-power projection; recheck no scoring/events or hidden contribution leakage. |
| 16 | `packages/rules/src/core/movement.ts` | PRODUCTION_SOURCE / REPLAY_MINIMUM_DELTA_THEN_REVERIFY | Canonical directed-arrow costs; recheck all shared movement consumers and route cost regression. |
| 17 | `packages/rules/src/match-session.ts` | PRODUCTION_SOURCE / REPLAY_MINIMUM_DELTA_THEN_REVERIFY | Authoritative step gates, durable/legacy restore, privacy, revision, AI and battle settlement continuation. |
| 18 | `packages/rules/tests/match-room-hub.test.ts` | TEST_OR_TEST_SUPPORT / REPLAY_MINIMUM_DELTA_THEN_REVERIFY | Adapt staff activation setup to legal complete ordinary batch. |
| 19 | `packages/rules/tests/match-session.test.ts` | TEST_OR_TEST_SUPPORT / REPLAY_MINIMUM_DELTA_THEN_REVERIFY | Shared complete-batch setup for staff and Conversion/Golden Eater regressions. |
| 20 | `packages/rules/tests/regression/action-turn-delivery.test.ts` | TEST_OR_TEST_SUPPORT / REPLAY_MINIMUM_DELTA_THEN_REVERIFY | New action-turn movement, batch, quotas, atomicity, privacy, restore, power and settlement regressions. |
| 21 | `packages/rules/tests/regression/card-action-close.test.ts` | TEST_OR_TEST_SUPPORT / REPLAY_MINIMUM_DELTA_THEN_REVERIFY | Play source and noble in same complete batch; retain source-close behavior assertions. |
| 22 | `packages/rules/tests/regression/cb-a0-time-alter-origin-bullet.test.ts` | TEST_OR_TEST_SUPPORT / REPLAY_MINIMUM_DELTA_THEN_REVERIFY | Keep required technical A0 regression; progress turns legally while preserving naturally drawn Origin Bullet. |
| 23 | `packages/rules/tests/regression/fb2-ruler-seal-subsystem.test.ts` | TEST_OR_TEST_SUPPORT / REPLAY_MINIMUM_DELTA_THEN_REVERIFY | Initialize explicit continuation on manually replaced trusted fixture before serialization. |
| 24 | `packages/rules/tests/regression/fb2-same-battlefield-private-hand-return-interaction.test.ts` | TEST_OR_TEST_SUPPORT / REPLAY_MINIMUM_DELTA_THEN_REVERIFY | Initialize continuation before trusted fixture restore; retain private hand-return assertions. |
| 25 | `packages/rules/tests/regression/golden-card-content-pipeline.test.ts` | TEST_OR_TEST_SUPPORT / REPLAY_MINIMUM_DELTA_THEN_REVERIFY | Adapt cost boundary and source-close setups to simultaneous complete batches. |
| 26 | `packages/rules/tests/regression/golden-flow-2-combat-power-winner-vp.test.ts` | TEST_OR_TEST_SUPPORT / REPLAY_MINIMUM_DELTA_THEN_REVERIFY | Complete ordinary turn legally before scoring; explicitly progress battle barrier. |
| 27 | `packages/rules/tests/regression/interaction-private-optional-runtime.test.ts` | TEST_OR_TEST_SUPPORT / REPLAY_MINIMUM_DELTA_THEN_REVERIFY | Initialize continuation before trusted fixture serialization; retain visibility checks. |
| 28 | `packages/rules/tests/regression/interaction-room-boundary.test.ts` | TEST_OR_TEST_SUPPORT / REPLAY_MINIMUM_DELTA_THEN_REVERIFY | Use move/skip and complete batch before private interaction activation with fresh revisions. |
| 29 | `packages/rules/tests/regression/trigger-resource-runtime.test.ts` | TEST_OR_TEST_SUPPORT / REPLAY_MINIMUM_DELTA_THEN_REVERIFY | Update expected mana and movement provenance to canonical workshop arrow cost 1. |
| 30 | `packages/rules/tests/regression/fb2-required-additional-play.test.ts` | TEST_OR_TEST_SUPPORT / REPLAY_MINIMUM_DELTA_THEN_REVERIFY | Retain append-only-only rejection, no impossible effect activation and atomic unchanged state. |

## Historical references excluded

- `artifacts/phase3-cb-a0-time-alter-play-legality-repair.json`: preserve original, no import or renewed approval requirement.
- `docs/agents/manifests/tasks/P3-CB-A0-TIME-ALTER-PLAY-LEGALITY-REPAIR.json`: preserve original, no import or renewed approval requirement.
- `docs/reports/2026-10-14-p3-cb-a0-time-alter-play-legality-repair.md`: preserve original, no import or renewed approval requirement.

K03 loader is unchanged and read-only. Retain the A0-named technical regression tests; filenames do not revive A0 governance.

Shared-runtime review hotspots: movement arrow costs affect all movement callers; combat helper must remain a pure public projection; MatchSession restore/privacy/revision/battle settlement changes need fresh verification. Existing tests adapted for setup must keep their semantic assertions.

Machine evidence: `artifacts/dr-p01-m1-prestart-path-audit.json`. Reservation addendum: `docs/agents/manifests/reservations/DR-P01-M1-SAME-OWNER-TRANSFER.json`.

Only the three explicit prestart record files are added outside the 30 candidate paths. Future validation outputs are named in the transfer. Independent verifier output remains verifier-owned.

Next implementation must use the new task/reservation copies, compose minimum A0 legality and DR deltas, and run fresh affected tests and complete CI before independent verification. Old evidence is provenance only. No merge/promotion authority is granted.

## Authoritative single-writer disposition (latest user instruction)

The former local-only transfer is superseded by the committed and pushed Planner SHARED-RUNTIME-LANE.json registry. DR-P01 M1 is GRANTED to the same Feature Delivery Lead on exact base7724bff0; CB-C02 is SUSPENDED/PARKED_BLOCKED at its preserved2d386ddd candidate. loader.ts is explicitly excluded from P01, has no active writer, and requires a future explicit grant. This resolves the previously recorded overlap without inferring release from candidate freezing. Original frozen worktrees and legacy records are unchanged. User authority is recorded; no unavailable external Owner ACK is claimed. The exact containing control SHA is reported in dispatch, without a self-referential fabricated hash.
