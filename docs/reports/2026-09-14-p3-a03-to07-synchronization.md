# P3-A03 TO-07 Synchronization

- Date: 2026-09-14
- Role: Codex A synchronization
- Accepted factory candidate: `5515d57adaf7ed31c12bad377700498cc5051b28`
- Source reviewer evidence: `5951985194fdb60c949d6c9535d81a4215480bf4`
- Review status: `REVIEW_ACCEPTED`
- Synchronization status: `COVERAGE_SYNC_CANDIDATE`

## Accepted infrastructure

P3-TO-07 supplies reusable Playwright Gate C room helpers for:

- WebSocket command/projection/error tracing;
- serialized room restore and reconnectable client identity;
- remote-room browser navigation;
- typed room command dispatch;
- reload/reconnect proof requiring a new projection;
- stale revision replay proof requiring a new stale error and unchanged authoritative revision.

Independent evidence is typecheck PASS, factory `5/5` PASS, and existing Gate C compatibility set `4/4` PASS.

## KPI guard

TO-07 is E2E infrastructure only. It changes no runtime semantic route and therefore contributes **no legacy/new/dual delta**. No coverage artifact or classifier change is required for this synchronization.

## Queue update

- P3-TO-07: `REVIEW_ACCEPTED`.
- P3-TO-13: `READY_RUNTIME_OWNER`.
- TO-12 has already released the runtime lane.
- TO-13 may consume the accepted TO-07 helper but must supply its own private/optional interaction assertions and independent Gate A/B/C evidence.

No card, ability, or interaction family inherits Gate C acceptance from TO-07 alone.

Final A03 status: `COVERAGE_SYNC_CANDIDATE`.
