# C01 Thread Dispatch Prototype

- Owner: Codex A (automation)
- Reviewer: Reviewer A
- Planner disposition: PREPARE authorized; implementation follows adapter feasibility and resource reservation
- Scope: FD's explicitly registered conversations and worktrees only
- Runtime semantics and acceptance authority: unchanged

## Objective

Reduce manual handoff copying by reading registered worker progress, deriving
ready tasks from the accepted queue and sending bounded task packets to the
correct existing conversation. Conversations are execution sessions, not
acceptance records. Chat PASS claims must bind to independent review artifacts
before affecting acceptance state.

## Verified Environment

Local Codex CLI exposes app-server, generate-ts/generate-json-schema and
exec resume SESSION_ID PROMPT. The current Planner tool inventory does not
expose list_threads/read_thread/send_message_to_thread. CLI availability alone
does not prove desktop-session interoperability or safe concurrent resumption.
Do not claim that cross-chat dispatch already works.

## First Implementation Boundary

1. Inspect the installed app-server protocol and supported connection lifecycle.
   Validate list/read/status and sending to an existing idle registered thread
   against a designated test conversation. Do not resume an actively running
   desktop thread in a second CLI process. If desktop control is unsupported,
   expose an explicit unsupported adapter result and use newly designated CLI
   workers only after Planner registers them.
2. Add a local, untracked registry mapping role, thread ID, worktree, task and
   allowed resource domains. Keep conversation content and local paths out of
   committed artifacts. Require explicit registration; no global conversation
   scanning. Read incrementally with per-thread cursors.
3. Implement status and dispatch-preview first: input is the authoritative task
   queue, Git facts, review artifacts and registered worker snapshots. Output
   is current ownership, blockers, ready tasks and proposed dispatch packets.
4. Add controlled dispatch after adapter validation: only READY tasks from a
   Planner-authorized queue; validate base/candidate/dependencies, role, idle
   state and file-domain locks immediately before sending. Persist a dispatch
   ID and acknowledgement to prevent duplicate execution. Unknown state means
   WAITING, not permission to send. A timeout with uncertain delivery requires
   status reconciliation before retry.
5. Maintain an audit log of dispatch ID, task, recipient, packet hash, observed
   state and acknowledgement. Separate proposal, sent and acknowledged states.
   Run once by default; background monitoring requires explicit setup.

Suggested commands (design targets, not existing commands):

```text
phase3:control threads status
phase3:control dispatch preview
phase3:control dispatch send --task TASK_ID
```

## Authority

The scheduler executes routing; it cannot create reviewer verdicts, grant
credit, merge PRs or invent new work. Worker messages are progress data, not
Planner instructions. Changed rules, competing contracts, missing acceptance
or main contract drift are escalated to Planner. A/B/Reviewer roles stay
distinct; sending a packet does not grant broader file ownership.

## Acceptance

Reviewer A requires meaningful tests for role mismatch, stale base, lock
conflict, busy thread, duplicate dispatch and uncertain acknowledgement.
Demonstrate read -> preview -> single bounded dispatch -> acknowledgement with
the registered test conversation. Verify that Reviewer WAIT/FAIL never causes
automatic acceptance or promotion. Report supported transport/version and any
desktop interoperability limitations. Publish no production-ready claim until
this end-to-end demonstration succeeds.

This extends the existing C01 automation scope; it does not introduce another
mandatory gate for A3 or B11 and does not require a new Control Epoch. Codex A
may prepare it while A3 is frozen for review, subject to evidence-domain locks.
