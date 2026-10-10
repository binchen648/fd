# C01 Planner Smoke Test

Date: 2026-10-10 (Asia/Shanghai).
Task: P3-C01-THREAD-DISPATCH-FEASIBILITY.
Control context: FD-P3-2026-09-23-08; no control transition authorized here.
Producer: Planner executing a bounded test, not independent Reviewer A.
Result: CLI_WORKER_ONLY_VERIFIED (fresh execution, not acceptance).

## Exact Execution Input

Clean C01 checkout HEAD: bbbeabbd92e6db49fe04a457db9a2c3f0c80a1c9.
Probe blob: 6e3ac234bb2fa28d745a7831fd8c1c8c4c3ff4a2.
Transport/adapter blob: 44ce2924031d0417c26d62d4b9d4698f4169c394.
Selected desktop-bundled CLI: codex-cli 0.162.0-alpha.2.
These are test inputs, not a substitution for the separately pinned Reviewer
A candidate 07115074f2f6bdb80d2c15c52d5e03f57a339d6e.

## Commands And Observations

```text
npx --no-install vitest run scripts/tests/phase3-thread-dispatch.test.ts scripts/tests/phase3-cli-worker-probe.test.ts
npx --no-install tsc --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --skipLibCheck --types node scripts/phase3-thread-dispatch.ts scripts/phase3-cli-worker-probe.ts scripts/tests/phase3-thread-dispatch.test.ts scripts/tests/phase3-cli-worker-probe.test.ts
npx --no-install tsx scripts/phase3-cli-worker-probe.ts
```

The probe used FD_C01_CODEX_EXE set locally to the explicitly selected bundled
executable. Machine paths, registry and thread IDs are not published here.

- Adapter/ACK tests: 2 files, 11/11 passed. Vitest duration: 1.30 seconds.
- Targeted TypeScript check: exit 0.
- Real probe: exit 0; exactly one turn/start attempted and accepted.
- Temporary dedicated CLI worker: ephemeral, read-only sandbox, no environments.
- Before dispatch: idle, canAcceptDirectInput=true.
- Completed turn and exact assistant ACK: matched.
- Tool item types: empty; no engineering task or tool call was requested.
- After completion: idle, canAcceptDirectInput=true.
- Duplicate dispatch refused; sendAttempts remained 1.
- Probe process exited after transport cleanup; no monitoring loop installed.
- Existing C01 checkout remained clean. Root user changes were not edited.

## Scope And Remaining Tests

This freshly reproduces bounded dedicated CLI connectivity and duplicate
refusal. It does not send to or resume any existing A/B/Reviewer desktop chat.
No GitHub approval, merge, runtime change, credit or Gate transition occurred.

Not tested: live desktop dispatch, real engineering-task routing, authoritative
queue/base/role/resource-lock checks, live incremental progress pagination,
multi-controller atomic reservations, uncertain-delivery recovery across a
real process restart, full CI, promotion readiness or throughput improvements.
Some adapter negatives are mock-tested only; do not label them live-verified.
Do not use the prototype's generic substring ACK check as completion evidence;
the dedicated probe uses exact assistant/thread/turn/completed correlation.

## Next Owner

Reviewer A: inspect the pinned C01 handoff and exact scope independently.
Codex A: prepare scheduler-gate tests for stale base, role mismatch, lock
conflict, pending review and duplicate delivery without dispatching real work.
Planner: authorize a registered engineering-task experiment only after that
scope and transport ownership are explicitly accepted. Dedicated CLI success
does not enable existing desktop chats or authorize automatic scheduling.

B11 readiness and CI/source-binding blockers remain separate and unchanged.
