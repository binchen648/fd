# B11 Environment Recovery And Reverification

Published: 2026-10-10. Epoch: FD-P3-2026-09-23-08.
Planner status: BLOCKED_ENVIRONMENT_AND_ACCEPTANCE, no runtime repair assigned.
This is an execution-environment continuation, not an acceptance or policy waiver.

## Registered Facts

Frozen review candidate: 525451986f372a2e8e24afbc675fb6f40526f416.
Implementation/tested SHA: 9a4f4c6ee2723eb7f546341f3c18a1f0a29c3bc1.
Packet SHA-256: E9F9CEAE529013BC74A1E73EDC0D55F995A1827FAFA8FF6E10D3486331CAC3DB.
Reported: focused 40/40; first CI 193 files / 1532 tests exit 0; second CI
1516 passed / 16 skipped with Git checkout ENOSPC, exit 1. External test
contention invalidated the requested quiet-window condition. Not a rule
assertion failure, but the second CI is still FAIL, not waived.

Planner independently observed C free bytes=0; D free bytes=54666096640.
Common Git directory is D:/fd/.git. No unrelated files were deleted and no
worker process was terminated. The Planner publication worktree was placed
on D because the former C checkout cannot safely accept writes at zero space.
Actual test environment must be observed again; this snapshot is not a lease.

## Owners And Parallelism

- A: execution preparation and consolidated receipt continuation, no code fix.
- RA/RB: may read/review exact 5254519 source and evidence in parallel. Defer
  heavy CI/browser repetition until they obtain their own serial test slot.
- Planner: requests a single machine-local heavy-test reservation from all
  active A/B/reviewer workers. No unseen chat is claimed paused or coordinated.
- B: no new runtime edits. I and C01: waiting/no dispatch.

Explicitly obtain acknowledgements that other FD full CI/browser workers will
not start during this window. Observe processes just before and during the
run; a point-in-time empty process list alone does not prove a quiet window.
Do not kill, suspend or cancel other workers. If an owner cannot acknowledge,
report WAITING_FOR_WINDOW. Read-only reviews and lightweight work may continue.

## Scoped A Execution Authorization

Create a fresh validation checkout on D of exact tested SHA 9a4f4c6. Do not
move/reset an existing C worktree or reuse its node_modules/dist. Preserve
candidate 5254519 and original packet/reviews byte-for-byte.
Use local process-only TMP/TEMP and npm cache on D. Use a D-based Playwright
browser cache for subsequent browser validation. Set variables before spawning
Node; confirm os.tmpdir() resolves to D and temporary Git checkouts use D.
Do not persist user-wide environment changes, junctions or redirects.

Preparation sketch, after creating a new uniquely named validation checkout:

```powershell
$env:TEMP = 'D:\fd-validation\b11-9a4f4c6\temp'
$env:TMP = $env:TEMP
$env:npm_config_cache = 'D:\fd-validation\b11-9a4f4c6\npm-cache'
$env:PLAYWRIGHT_BROWSERS_PATH = 'D:\fd-validation\b11-9a4f4c6\browsers'
```

Create only the explicitly selected D directories. Reserve disk headroom for
checkout, npm, browser assets and temporary clones; report measurements before
and after preparation. An initial operational budget of 10 GiB D headroom is
required before the heavy run; this is not proof of unlimited capacity. C must
not remain zero: request user-approved C cleanup or another healthy host if
system operations still require C. Do not discover-and-delete unknown C files,
worktrees, Git objects, caches, source assets or collaborator output.

When the environment and acknowledged quiet window are ready:

1. Run npm ci then typecheck, verify workspace exports, exact HEAD and clean
   tracked source. Record Node/npm version; local version mismatch with GitHub
   Node 20 remains an explicit compatibility observation, not CI equivalence.
2. Run focused evidence and historical/current producer validation first.
3. Run revised default npm run test:ci twice sequentially. Preserve the earlier
   pass/failure as a separate pair; these are new receipts at the same source.
4. Stop for ENOSPC, new worker contention, deterministic failure or RPC error.
   No repeat-until-green, skipping, timeouts, config or source edits authorized.
5. After both succeed, complete the previously unexecuted content/generated,
   component/server/browser checks. Record source-assets actual result as the
   retained Release blocker, not a successful overall gate.

## Output And Acceptance Boundary

A may append a new explicitly bound environment/revalidation continuation to
the two final-combination output paths previously authorized. Use a descendant
carrier of 5254519; test receipts bind actual 9a4f4c6 checkout and relevant
source/config equivalence to carrier. Do not change implementation, check
meaning, frozen reviews or original history. Publish one complete packet,
not an evidence sync per reviewer. Binding/test-input edits outside prior
authority require a separate scoped decision, not optimistic PASS fields.

Original seven B-path authorizations and two runtime overlaps remain open.
Planner must inspect their exact deltas and authority or explicitly register
prospective adoption for independent review; this environment task does not
authorize or accept them. RA scope consistency alone cannot close those gaps.
Final RA/RB reviews, remote required checks and promotion remain pending.
Ledger 111/944, all credit delta=0; 93 missing images and Global Gate C remain.

Next sync: environment/quiet-window readiness, consolidated revalidation
packet, or a single explicit user cleanup/host decision. No new Epoch or
additional runtime repair cycle is created by this environmental disposition.
