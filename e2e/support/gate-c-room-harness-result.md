# P3-TO-07 Gate C Room Harness Result

- Date: 2026-09-14
- Task: `P3-TO-07`
- Role: Gate C infrastructure implementation
- Scope lease: `e2e/support/*` only
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
- Parent baseline: `69a2a9ca1f4cb453633caaa1a8c3aedec55dd1be`

## Delivered factory

`gate-c-room-harness.ts` centralizes the repeated production-room Gate C mechanics used by later Playwright representatives:

- observe browser WebSocket client messages, server projections, and server errors;
- restore a serialized `MatchRoomSnapshot` through the real room HTTP endpoint;
- build a reconnectable client identity from serialized snapshot state;
- open the real remote-room browser route with HTTP/WS endpoints;
- send a typed `ClientRoomMessage` through a real browser WebSocket;
- reload and require a **new post-reload projection** at the expected authoritative revision;
- replay a stale command and require a new `server:error` containing `Stale command revision` while the authoritative revision remains unchanged.

No game runtime, compiler, projection implementation, content, or KPI code is changed.

## Contract evidence

`gate-c-room-harness.spec.ts` runs against a real restored room and proves:

1. initial server projection arrives through the browser WebSocket;
2. a typed command commits and advances revision;
3. browser reload/reconnect produces a new projection rather than reusing pre-reload trace state;
4. the reconnected projection preserves the committed authoritative revision;
5. replaying the stale pre-commit command produces a fresh stale-revision server error;
6. stale replay does not mutate authoritative revision.

The test intentionally uses an already accepted lifecycle room snapshot only as a realistic room fixture; it does not claim or modify lifecycle semantics.

## Verification

```text
npm.cmd run typecheck
PASS

npx.cmd playwright test e2e/support/gate-c-room-harness.spec.ts --project=chromium --repeat-each=5
5/5 PASS

compatibility run:
- fd-command-spell-resource-core.spec.ts
- fd-golden-flow-2-combat-power-winner-vp.spec.ts
- fd-lifecycle-source-active.spec.ts
- support/gate-c-room-harness.spec.ts
4/4 PASS

git diff --check
PASS
```

## Guardrails / non-claims

- This is reusable Gate C test infrastructure only.
- It does not promote any card, mechanic family, or future TO13 representative.
- It does not infer Gate C correctness from unit tests.
- Future consumers must still assert their own projection/privacy/rollback semantics around the shared stale/reconnect mechanics.
- Independent review is still required before the queue treats TO07 as accepted/available.
