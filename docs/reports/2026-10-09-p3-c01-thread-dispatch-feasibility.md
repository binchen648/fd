# P3-C01 Thread Dispatch Feasibility

Date: 2026-10-09
Owner: Codex A / Automation Engineer
Task: P3-C01-THREAD-DISPATCH-FEASIBILITY

## Verdict

BLOCKED for full desktop-thread dispatch verification.

The installed app-server protocol supports thread listing, thread reading, incremental item listing, turn start, and turn completion notifications. This run verified metadata listing for FD cwd through `codex app-server --stdio`, but no user-designated experiment thread ID was provided, so no thread body was read and no probe was sent.

## Environment

- Original workspace: `D:\fd`
- Original workspace status before work: dirty, with pre-existing tracked and untracked changes.
- Worktree: `C:\Users\chenshang\.config\superpowers\worktrees\fd\c01-thread-dispatch-feasibility`
- Branch: `codex/c01-thread-dispatch-feasibility`
- Base: exact `origin/main` at `fefcf4f7f5bd66ed7693889fb99391e6e7321016`
- CLI version observed by `codex --version`: `codex-cli 0.147.0`
- app-server stdio user agent observed by protocol probe: `fd-c01-thread-dispatch/0.162.0-alpha.2 (Windows 10.0.26100; x86_64) dumb (fd-c01-thread-dispatch; 0.1.0)`
- `codex app-server daemon version`: unsupported on Windows with `codex app-server daemon lifecycle is only supported on Unix platforms`

## Protocol Capabilities

Actually verified:

- `codex app-server generate-ts --experimental` generated protocol bindings.
- `codex app-server generate-json-schema --experimental` generated protocol schemas.
- `thread/list` over `codex app-server --stdio` initialized successfully and returned FD cwd thread metadata.
- Adapter tests verify refusal for unregistered threads, running/unknown status, duplicate dispatch IDs, ACK mismatch, and cursor-based progress reads.

Protocol shows support, not end-to-end verified:

- `thread/read` exists and returns a `Thread`.
- `thread/items/list` exists and supports cursors.
- `thread/resume` exists and can rejoin a running thread by `threadId`, but this is a concurrency risk if used incorrectly.
- `turn/start` exists and is the likely send primitive for a loaded/direct-input-capable thread.
- `turn/completed` and `thread/status/changed` notifications exist and can distinguish transport acceptance from turn completion.

Not verified in this run:

- Reading a user-designated experiment thread.
- Confirming an existing desktop thread is `idle` with `canAcceptDirectInput=true`.
- Sending the C01 probe to a desktop thread.
- Receiving a matching `ACK:<dispatchId>`.

## Probe Evidence

No probe was sent. The run stopped before dispatch because no experiment thread ID was provided.

Sanitized protocol-list evidence:

```json
{
  "initialized": true,
  "listedThreads": 3,
  "cwd": "D:\\fd",
  "observedStatuses": ["notLoaded"],
  "canAcceptDirectInput": [null],
  "sources": ["vscode"]
}
```

The real output contained thread IDs, which are not recorded here as committed evidence.

## Safety Findings

- Command presence is not enough. `codex exec resume SESSION_ID PROMPT` exists, but it would start a separate CLI execution path and is not accepted as desktop-thread-compatible dispatch evidence.
- On this Windows host, `app-server daemon` lifecycle commands are unsupported; stdio app-server works for protocol probing.
- Listed FD desktop threads appeared as `notLoaded` with `canAcceptDirectInput:null` when queried through a standalone stdio app-server. That is insufficient to send.
- The protocol explicitly documents `thread/resume` behavior: a running `threadId` is rejoined; path mismatch is a consistency check. This must be treated as a concurrency-sensitive operation, not a blind dispatch mechanism.

## Implementation

- `scripts/phase3-thread-dispatch.ts`
  - `readStatus(threadId)`
  - `readProgress(threadId, cursor)`
  - `previewDispatch(task, thread)` as `previewDispatch(threadId, status, dispatchId)`
  - `sendProbe(threadId, dispatchId)`
  - `waitForAck(dispatchId)` as `waitForAck(threadId, dispatchId)`
- `config/phase3-thread-registry.example.json`
  - redacted registry shape only.
- `.gitignore`
  - ignores local registry file names.
- `scripts/tests/phase3-thread-dispatch.test.ts`
  - protocol/state tests with a mock transport.

## Verification

Passed:

```text
npx vitest run scripts/tests/phase3-thread-dispatch.test.ts
7 tests passed
```

Passed:

```text
npx tsc --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --skipLibCheck --types node scripts/phase3-thread-dispatch.ts scripts/tests/phase3-thread-dispatch.test.ts
```

Passed with metadata-only output:

```text
npm run phase3:thread-dispatch -- protocol-probe --cwd D:\fd --limit 3
```

## Remaining Limitations

- No runtime acceptance, migration credit, gate, or promotion authority is granted or implied.
- Full verdict cannot advance to `DESKTOP_THREAD_DISPATCH_VERIFIED` until the user supplies one explicit idle experiment thread ID and the adapter observes `idle` plus direct-input capability before one send.
- If direct desktop-thread input remains unavailable after explicit thread registration, the fallback is `CLI_WORKER_ONLY_VERIFIED`: create dedicated CLI workers and dispatch only to those newly registered worker sessions. The cost is losing direct reuse of existing desktop chats and requiring worker lifecycle management outside the desktop session.

## Next Minimal Step

Register one disposable experiment thread ID in a local ignored registry file, run `probe` once, and record sanitized `turn/start` acceptance separately from matching `turn/completed` ACK.
