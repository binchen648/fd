# Blocked Items Register

Baseline: e63cdeb2a065a9f87c24039d2b08bbe059513fed.

| Blocker | Evidence | Consequence |
|---|---|---|
| Active runtime reservation | docs/agents/manifests/reservations/SHARED-RUNTIME-LANE.json; active task A-RECOVER-04; granted paths: apps/server/src/room-store.ts, apps/server/src/room-store.test.ts, apps/server/src/match-server.ts, apps/server/src/index.ts, packages/rules/src/match-room-hub.ts, packages/rules/tests/match-room-hub.test.ts, packages/rules/tests/regression/seven-player-restart.test.ts, apps/client/src/state/match-room-client.ts, apps/client/src/state/match-room-client.test.ts, .github/workflows/test.yml, packages/rules/src/match-session.ts, packages/rules/src/match-room.ts | Do not write or replay touching files until an explicit release/new grant exists. |
| Stale/non-main bases | 582 PRs | Requires semantic replay from current main; old PR base cannot be promoted. |
| Stacked role topology | 508 open PRs | Do not merge or retarget; extract valid deltas only after replay. |
| Altera/Arthur primitive/source conflict | typed magic-resistance has no admitted set_opponent_power_to_zero primitive; Arthur source authority unresolved | Runtime Proposal / source review required; no legacy disguise. |
| Abigail evidence gap | SC3a input is absent | Do not infer or fabricate the missing ability. |
| Independent acceptance | historical author/relay comments are not independent GitHub review | Every final candidate needs fresh exact-HEAD review plus required checks. |

## Candidate-specific blockers

- PR #690: active-reservation:A-RECOVER-04:packages/rules/src/match-session.ts
- PR #689: active-reservation:A-RECOVER-04:apps/server/src/index.ts,apps/server/src/match-server.ts
