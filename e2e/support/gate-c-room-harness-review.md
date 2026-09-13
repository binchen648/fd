# P3-TO-07 Gate C Room Harness Independent Review

- Date: 2026-09-14
- Role: Independent review
- Task: `P3-TO-07`
- Target candidate: `5515d57adaf7ed31c12bad377700498cc5051b28`
- Parent baseline: `69a2a9ca1f4cb453633caaa1a8c3aedec55dd1be`
- Review branch: `codex/r-p3-to07-gate-c-factory-review`
- Final status: `REVIEW_ACCEPTED`

## Findings

No blocking finding remains.

The candidate is infrastructure-only. Its entire implementation diff is restricted to three files under `e2e/support/*`; no runtime, compiler, content, projection implementation, KPI, taxonomy, or product behavior is changed.

## Contract judgment

The shared harness correctly centralizes the repeated Gate C mechanics needed by later representatives:

- browser WebSocket tracing for client commands, server projections, and server errors;
- real room HTTP snapshot restore;
- reconnectable serialized client identity;
- real remote-room browser navigation;
- typed browser WebSocket command dispatch;
- reload/reconnect proof that requires the projection count to increase after reload before accepting the expected revision;
- stale-command replay proof requiring a fresh `server:error` containing `Stale command revision` and unchanged authoritative revision.

The reconnect helper does not pass merely because the pre-reload trace already has the expected revision. It records the pre-reload projection count and requires a new post-reload projection.

The stale helper does not reuse an old error. It records the pre-send error count and requires a newly received error before checking stale-revision semantics.

## Independent verification

```text
npm.cmd run typecheck
PASS

factory contract:
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

## Scope / non-claims

This review accepts the reusable Gate C infrastructure only.

It does **not**:

- promote Gate A/B/C for any card or mechanic representative;
- allow TO13 to inherit correctness without its own browser/server/projection assertions;
- change any runtime hot-file ownership rule;
- validate private-target semantics, rollback semantics, or interaction templates by itself.

Future TO13 work may consume this harness for stale/reconnect mechanics, but TO13 still requires its own scoped implementation and independent Gate evidence.

## Final judgment

`REVIEW_ACCEPTED`

Accepted Gate C factory candidate:

`5515d57adaf7ed31c12bad377700498cc5051b28`
