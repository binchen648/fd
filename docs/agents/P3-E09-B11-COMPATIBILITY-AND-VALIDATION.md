# B11 Compatibility Extension And Validation

Published: 2026-10-12. Task: P3-E09-B11-TRANSPORT-SECURITY-REPAIR.
Owner: designated Codex B / communication runtime owner.
This is a scoped continuation of the existing task, not completion or acceptance.

## Authorized Five-Path Extension

- apps/client/src/App.tsx
- apps/client/src/App.test.tsx
- e2e/support/start-conversion-magic-fixture-server.ts
- e2e/support/start-golden-eater-fixture-server.ts
- e2e/support/gate-c-room-harness.ts

Purpose only: local authenticated reconnect and required revision compatibility;
trusted fixture-process issuance of private credentials; snapshot credential
structure compatibility. Extend the existing source reservation to these paths.
Check actual competing modifications before touching them and preserve any
existing work. No UI redesign, ability semantics, other E2E edits, public token
exposure, insecure legacy fallback or weakening of assertions is authorized.
Trusted fixture credential issuance must not create an unauthenticated production
credential endpoint. Gate-C harness compatibility does not grant Gate C.

B can continue implementation and focused security negatives after binding the
existing source reservation. No extra A synchronization/role PR is required.

## Conditional Heavy Validation Batch

The requested sequential batch is authorized in scope:
npm ci -> typecheck -> related regressions/server/browser -> default full CI.
Use the existing timeout/concurrency settings. Record tested SHA, commands,
raw stdout/stderr, exits, times and hashes. Preserve failures rather than patching
unrelated tests. This authorizes the batch, not a claim of a currently quiet host.

Actual window status: WAITING_FOR_COORDINATION_AND_START_CONFIRMATION.
No duration/start/end or other-worker acknowledgement has been supplied here.
Planner cannot send messages to or pause other conversations in this session.
User/coordinator must relay the following to all active same-host heavy-test
owners and return their actual acknowledgements (or confirm there are none):

> B11 security validation requests exclusive heavy-test use on this host.
> Reply with role/task, whether a heavy run is active, its expected finish,
> and acknowledgement not to start another heavy run during the agreed window.
> Source/evidence read-only work may continue. No process should be killed.

After actual coordination, publish/relay one start record with designated B,
host, start/end and acknowledgements. B rechecks available disk/processes before
starting. Process observations do not replace the coordination record. If the
window expires, finish/record the current command and coordinate an extension
before another heavy command. Release the window explicitly after the batch.
Do not perpetually rerun passing commands for each later review.

Until then, complete implementation and light focused validation; do not claim
heavy-test exclusivity or overall readiness. Prior limited acknowledgement-risk
adoption applied only to historical carrier 463facb and does not waive this new
window condition automatically.

## Completion Boundary

Implementation completion requires a frozen exact candidate and a complete
scoped diff/receipt packet. Overall technical acceptance additionally requires
fresh RB final security/composition review and RA evidence review. G governance,
actual promotion-head required checks and separate I authorization remain later
gates. Existing 111/944, zero credit and 93 missing images are unchanged.
