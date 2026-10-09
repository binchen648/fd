# P3-C01 Thread Dispatch Feasibility

Date: 2026-10-09
Owner: Codex A / Automation Engineer
Task: P3-C01-THREAD-DISPATCH-FEASIBILITY

## Verdict

BLOCKED for full desktop-thread dispatch verification.

The installed app-server protocol supports thread listing, thread reading, incremental item listing, turn start, and turn completion notifications. Metadata listing and metadata reading of the user-designated experiment thread succeeded through `codex app-server --stdio`. The designated thread returned `notLoaded` with `canAcceptDirectInput:null`; idle state could not be confirmed, so no probe was sent.

## Environment

- Original workspace: redacted FD checkout.
- Original workspace status before work: dirty, with pre-existing tracked and untracked changes.
- Worktree: isolated checkout; machine path redacted.
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
- `thread/read` with `includeTurns:false` succeeded for the user-designated experiment thread; no conversation body was requested.
- Adapter tests verify refusal for unregistered threads, running/unknown status, duplicate dispatch IDs, ACK mismatch, and cursor-based progress reads.

Protocol shows support, not end-to-end verified:

- `thread/items/list` exists and supports cursors.
- `thread/resume` exists and can rejoin a running thread by `threadId`, but this is a concurrency risk if used incorrectly.
- `turn/start` exists and is the likely send primitive for a loaded/direct-input-capable thread.
- `turn/completed` and `thread/status/changed` notifications exist and can distinguish transport acceptance from turn completion.

Not verified in this run:

- Confirming an existing desktop thread is `idle` with `canAcceptDirectInput=true`.
- Sending the C01 probe to a desktop thread.
- Receiving a matching `ACK:<dispatchId>`.

## Probe Evidence

After the user supplied an experiment link, exactly one metadata-only `thread/read` was performed against that designated target. The result below prevented dispatch. No `turn/start` was called, no dispatchId was sent, and no ACK was obtained.

```json
{"initialized":true,"status":{"ok":true,"value":{"kind":"unknown","reason":"status is notLoaded","canAcceptDirectInput":null}}}
```

Sanitized protocol-list evidence:

```json
{
  "initialized": true,
  "listedThreads": 3,
  "cwd": "<FD_CHECKOUT>",
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
8 tests passed
```

Passed:

```text
npx tsc --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --skipLibCheck --types node scripts/phase3-thread-dispatch.ts scripts/tests/phase3-thread-dispatch.test.ts
```

Passed with metadata-only output:

```text
npm run phase3:thread-dispatch -- protocol-probe --cwd <FD_CHECKOUT> --limit 3
```

## Remaining Limitations

- No runtime acceptance, migration credit, gate, or promotion authority is granted or implied.
- Full verdict cannot advance to `DESKTOP_THREAD_DISPATCH_VERIFIED` until a live desktop connection exposes authoritative `idle` status and `canAcceptDirectInput:true` for the designated target. A standalone server's local state does not establish that the desktop is idle.
- A dedicated CLI worker is an alternative to investigate, not a verified verdict in this run. It requires separate worker lifecycle management and does not reuse existing desktop execution. No worker was started.

## Next Minimal Step

Find a supported connection to the live desktop host that exposes the designated target's execution state and direct-input capability. Keep dispatch disabled while state remains unknown. If no such connection is available, separately authorize a dedicated CLI worker experiment.

## Desktop Connection Investigation

Read-only follow-up on 2026-10-09:

- Installed Windows package version: `OpenAI.Codex 26.1002.7124.0`.
- Desktop-bundled executable reports `codex-cli 0.162.0-alpha.2`; the first PATH command is the npm wrapper reporting `0.147.0`. These versions must not be treated as interchangeable.
- Process parent metadata identifies the desktop host as `ChatGPT.exe` with Codex children. Process command lines were not read.
- `Get-NetTCPConnection -State Listen` found no listeners owned by the observed Codex processes or their desktop parent. This is a point-in-time TCP observation; it does not exclude Unix sockets, named pipes, other processes, or outbound relay connections.
- Bundled `app-server proxy --help` documents a Unix-domain control socket and `--sock` override.
- Bundled `app-server daemon version` attempted the default control socket and failed with Windows socket error `10050`. The socket's machine path is redacted. This differs from the older PATH executable's Windows lifecycle rejection.
- A bounded five-second client attempt using the bundled executable with `app-server proxy` failed before `initialize` succeeded. No thread method or turn-start request was sent through that proxy, and the client closed afterward.

Sanitized proxy evidence:

```json
{"mode":"desktop-bundled-default-proxy","initialized":false,"result":"CONNECTION_FAILED"}
```

Reproduction uses the installed executable path locally, without committing it:

```text
<DESKTOP_CODEX_EXE> --version
<DESKTOP_CODEX_EXE> app-server proxy --help
<DESKTOP_CODEX_EXE> app-server daemon version
```

The bounded client used `AppServerJsonRpcTransport(<DESKTOP_CODEX_EXE>, ['app-server', 'proxy'])`, attempted `initialize`, and closed after failure or a five-second deadline. It did not start a separate execution of the target session.

Official documentation checked:

- [App Server](https://learn.chatgpt.com/docs/app-server): documents stdio, experimental WebSocket, Unix socket, and disabled transports. It states that `thread/read` does not load a thread into memory. These protocol capabilities do not establish an external endpoint for this running desktop installation.
- [Settings](https://learn.chatgpt.com/docs/reference/settings) and [Remote connections](https://learn.chatgpt.com/docs/remote-connections): the reviewed pages did not establish an external scripting API for existing Windows desktop chats. Remote connections describe account/device pairing and a relay; that product workflow is not proof of an app-server endpoint available to this client.

Verdict remains `BLOCKED`, rather than a claim of universal desktop incompatibility. Named-pipe connectivity and alternative configured endpoints remain unknown; no private storage, process handles, IPC payloads, or UI automation were inspected. No probe was sent and no CLI worker was started.
