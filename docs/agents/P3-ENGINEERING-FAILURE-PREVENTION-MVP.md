# FD ENGINEERING FAILURE PREVENTION MVP PLAN

Date: 2026-10-13. Planner / Process Controller.
Task: P3-ENGINEERING-FAILURE-PREVENTION-MVP.
Final status: FAILURE_PREVENTION_MVP_PARTIALLY_READY.

## 1. Current Control Identity

Repository: binchen648/fd. Fresh fetch confirms origin/main:
1d0e102c1ff43c272dc5ccfb2871eda48a5f52ce.
User snapshot 9a1689d2ec5b56b67d1483d2593b4ab809d6c15c is historical.
Main PHASE3-TASK-INDEX.md explicitly names FD-P3-2026-09-23-09 effective.
The Epoch09 document still contains its pre-publication pending wording; read
it as retained publication history in conjunction with the updated main index
and merged governance attestation, not a reason to create another Epoch.

B11 is no longer assumed to be at its original P0/P1 discovery state:
RB 4d5b76be9d5459cc0c40e50fae8513bc59cd5d21 records scoped security closure on
0f62210a2e007a15e28f945c546ccd00c345942a. It does not grant overall readiness.
Current Planner continuation is 6ea26f3b, temporal fixture finalization, based on
487ab81a8e3fabf75eea5a73cd3582b37cf65520. Fresh worker handoff remains required
for any newer implementation state. This task cannot interrupt that lane.

Ledger 111/944. All credit/denominator changes zero. No new Epoch. Gate C and
93 MISSING_IMAGE remain separately retained. No runtime changes in this task.

## 2. Candidate Failure Inventory

At most ten IDs; candidate selection is not proof of a failure.

| ID | Topic | Evidence inspected / next evidence | State |
| --- | --- | --- | --- |
| FD-SEC-001 | credential exposure/identity impersonation | cf179ca3 pinned RB artifact | SOURCE_VERIFIED_DRAFT |
| FD-REV-002 | revision bypass and atomic rejection | same artifact, separate actual WS observation | SOURCE_VERIFIED_DRAFT |
| FD-SHAPE-003 | malformed compiled containers | b22691ab PR474 exact technical FAILED | SOURCE_VERIFIED_DRAFT |
| FD-RESTORE-004 | legal nested pending restore | 7e65291a PR475 actual consumer FAILED | SOURCE_VERIFIED_DRAFT |
| FD-EVID-005 | unreproducible evidence tests | dbd430be RA artifact retains cfa6a925 failure | SOURCE_VERIFIED_DRAFT |
| FD-FIXTURE-006 | moving HEAD becomes producer fixture | 487ab81 source; 6ea26f3b Planner diagnostic | CANDIDATE; immutable failure/review binding needed |
| FD-SHA-007 | candidate/reviewer/head mismatch | integration-closure historical refs in 27dab1ad | CANDIDATE; exact terminal finding extraction needed |
| FD-FALLBACK-008 | legacy fallback hides semantic failure | search setup/dataflow reviews; no pinned failing source yet | CANDIDATE; UNKNOWN |
| FD-REVIEW-009 | relay mistaken for independent review | search historical PR reconciliation and PR inspector artifacts | CANDIDATE; UNKNOWN until pinned evidence |
| FD-WRITER-010 | writer/reservation conflict | B11 reservation record proves a boundary, not an actual conflict | CANDIDATE; failure occurrence UNKNOWN |

Result Binding and partial mutation remain search dimensions for K01; no extra
case ID is created until evidence supports it. Combine overlapping instances
under an existing invariant; never fabricate ten cases to reach a count.

## 3. Verified Failure Cases

Five source-backed case drafts are already created. catalog.json stores exact
source commit, path, raw Git SHA-256 and reviewed SHA. Planner read and hashed
these sources; no probes were rerun. Source verification is not independent
knowledge review, fresh runtime verification or current-main acceptance.
RA validates extraction once; existing historical runtime reviews are not
reopened. Root causes explicitly distinguish confirmed, hypothesis and unknown.
Each draft contains risk, domains, files, contracts, input/observation, failed
approach, invariants, negatives, command, test status and applicability.

Security/revision findings share one evidence artifact but separate contracts.
PR474/475 technical reviews are not formal GitHub approvals. Their source
limits and inherited defect boundaries are preserved.

## 4. Knowledge Base Structure

docs/engineering/lessons/:
- INDEX.md: domain/file/contract navigation and review state
- GUARDRAILS.md: source-bounded prevention summaries
- catalog.json: machine metadata/provenance; no acceptance authority
- cases/FD-*.md: five initial pinned source-backed drafts
- HISTORICAL-FAILURE-PREFLIGHT.md: matching/cache/output contract
- BATCH-TASK-TEMPLATE.md: task startup and independently judged batch matrix

No equivalent engineering failure catalog was found in inspected main and
Planner tree. Existing docs/spec/guardrail-policy.md is Window C content
approval; retain it as the owner of that contract. The new catalog references
existing canonical/agent/runtime authorities instead of replacing them.

## 5. Task-aware Preflight Design

Structured input: task ID, capability family, exact identities, semantic
contracts, changed files, domains, exact base and reservation reference.
Deterministic ranking: exact file +8, contract +6, domain +3, declared family
matching contract +2; risk then ID tie-break. Default three, maximum five.
Return overflow and split-scope alert when more apply. NO_MATCH is not LOW risk.

Check selected source bytes/commit/hash. Missing sources, invalid hashes or
missing metadata remain explicit. Output IDs, reasons, invariants, forbidden
patterns, tests/existence SHA/current-base status, missing coverage, risk,
knowledge review state and elapsed time. Cache by scope/knowledge/relevant
source-object digests, not every ordinary commit.

K02 implements a standalone CLI without editing package.json or B11 preflight.
Before then the agent performs the protocol at startup and records automation
unavailable. This is an MVP integration mechanism, not falsely advertised
automatic executable enforcement.

## 6. Regression Gap Matrix

| Case | Historical enforcing regression | Current-main status | Next action / owner |
| --- | --- | --- | --- |
| SEC-001 | EXISTS on 0f62210; match-server/match-room | NOT_VERIFIED for repaired semantics | A trace exact scoped test + RB proof; B no duplicate edit |
| REV-002 | EXISTS on 0f62210; match-server/Hub real negatives | NOT_VERIFIED for repaired semantics | A trace proof; await existing B11 integration |
| SHAPE-003 | MISSING at PR474 reviewed SHA; reviewer probe exists | later repair NOT_VERIFIED | A current-line check, then B authorized compiled-shape test task |
| RESTORE-004 | MISSING at PR475 reviewed SHA; real consumer probe exists | later repair/inclusion NOT_VERIFIED | A current-line check, then B authenticated nested-pause test task |
| EVID-005 | EXISTS at b5e6844; scoped tests | real assembly separately active | Reuse B11 finalization; do not start competing evidence repair |

Commands and exact test paths are in each case; EXISTS never means a command
was executed in this task. A reviewer probe exposing a defect is not itself
an enforcing test that makes the production defect fail CI.

K03 outputs test task cards first. It grants no runtime writes. For each gap
record target base, whether the mechanism exists there, original counterexample,
expected rejection/round-trip, preservation assertions, owner and reservation.
Never insert tests for a nonexistent old-stack mechanism into main blindly.

## 7. Worker Assignment

| Task | Owner | Reviewer | Deliverable / entry condition |
| --- | --- | --- | --- |
| P3-EFP-K01 | A / A-R evidence owner | RA / A-R Reviewer | READY: validate/enrich five drafts, triage other five, exact catalog and gap matrix |
| P3-EFP-K02 | A automation owner | RA in same knowledge/automation review | READY_FOR_READ_ONLY_PREPARE; implementation after K01 facts are validated |
| P3-EFP-K03 | Planner dispatch; B runtime test owner | RB | WAIT_B11_RELEASE_OR_EXPLICIT_NONCONFLICT_GRANT; ordered gap test task cards |
| P3-EFP-K04 | Planner selects; B implements batch; A metrics | existing RB/RA scoped review | WAIT_ACCEPTED_K01_K02_AND_AUTHORIZED_PILOT |

Planner owns task selection, matching rules, locks and completion state.
A owns facts/provenance/tooling, never runtime repair.
RA verifies evidence extraction and CLI behavior, not gameplay correctness.
B adds runtime regressions only under formal authorized task/reservation.
RB proves the new test catches the original defect and preserves invariants.
G/I enter only when existing promotion governance requires them; no new
knowledge-specific approval layer. K01/K02 can share one exact review packet.

## 8. Parallelization Plan

Now allowed: K01 document/evidence extraction, K02 read-only design, RA
read-only provenance checks, Inspector read-only current-base inclusion checks.
B11 implementation/review/promotion always has priority.

A finishes the active B11 write/handoff first if it is the same worker. Another
A context may perform isolated documentation-only K01. No context switching
is required mid-repair. Do not claim workers were dispatched across chats.

Wait: runtime tests, heavy regression runs, shared evidence/preflight changes
and pilot implementation. They require B11 domain release or an explicit
nonconflicting reservation and appropriate machine test window.

## 9. Runtime Conflict Check

Inspected reservation:
docs/agents/manifests/reservations/P3-E09-B11-TRANSPORT-SECURITY-REPAIR.json.
It records session-authority/server-transport, Codex B, status
GRANTED_PENDING_OWNER_BINDING and explicit release required. Its owner binding
is unfilled and its Epoch/main labels historical. No explicit release was found
in inspected B11 dispatch/checkpoint documents. This is not proof of live
cross-process exclusivity or absence of other writers. Treat domains as retained,
not FREE; fresh owner confirmation precedes any later runtime task.

6ea26f3b separately grants A scoped B11 temporal-fixture tooling paths. This
MVP does not release or share those paths. No B11 hot file is in this task.

Planner reserves only docs/engineering/lessons/** and this new MVP dispatch
document for knowledge work, subject to preserving any competing dirty edits.
Planner worktree was clean before edits. Root dirty files remain untouched.
No repository-wide scan or human acknowledgement is claimed for this reservation.

## 10. MVP Implementation Tasks

K01 authorized paths: docs/engineering/lessons/**. Read this task, catalog and
only selected pinned sources. Verify all five hashes, reviewed identities and
scope; followup triage can add at most five further cases with actual evidence.
Update status after immutable RA knowledge review without overwriting historical
verdicts. Return one carrier, complete source/gap table and remaining UNKNOWNs.
Do not run runtime suites or edit existing B11 output.

K02 proposed write scope: scripts/engineering/historical-failure-preflight.ts
and scripts/tests/engineering-failure-preflight.test.ts, plus knowledge docs.
Planner grants this isolated tooling scope after K01 review and confirmation of
no competing writer in those two new paths. Do not touch package/workflow/B11
preflight. Implement the protocol, explicit source errors, deterministic scoring,
bounded retrieval, cache keys and scope overflow. Unit tests use tiny isolated
Git/data fixtures, not actual B11 runtime or heavy historical worktrees.

K03 Planner priority: reuse existing security/revision enforcement first.
Then evaluate malformed privileged compiled containers and nested restore.
Do not automatically adopt technical review probes as accepted contracts.
If contract choice is unresolved, dispatch read-only contract clarification
before a test implementation. One compatible boundary per batch.

K04 choose one already-authorized nonsecurity capability with relevant verified
lessons, a free domain, existing accepted primitive, two or more compatible
identities when available, and no unresolved contract conflict. Avoid B11,
authentication, revision and mandatory security work. No actual pilot selected
until a fresh queue/base/reservation can prove eligibility.

## 11. Pilot Acceptance Criteria

K01: 1-10 source-backed independently checked cases; no unproved cause promoted
to fact; exact source/hash/identity; navigable index; bounded guardrails; test
status bound to SHA. Retaining fewer cases is acceptable.

K02: deterministic relevant 3-5 retrieval; absent/forged source fails visibly;
overflow shown; scope-change cache invalidation; no-match not invented LOW;
no runtime/test execution side effects; useful packet with automation timing.
Task startup loads the protocol without manual user copying.

K03: a runtime regression proves the original counterexample fails before the
repair and passes after on authorized sources, preserves legitimate controls,
and obtains scoped RB review. Already proved tests are reused, not rewritten.

K04: first-review PASS rate, repeated-failure rate, review rework cycles,
task-start-to-accepted-candidate duration, accepted contracts per batch and
preflight overhead recorded with source timestamps/verdicts. Missing historical
baseline is null. Compare similar risk/contract batches; no claimed 2-5x gain
or causal speedup from one uncontrolled sample. Show raw numerators/denominators.

Operational budget: one preflight per stable task scope; no extra approval for
a successful lookup. If overhead exceeds observed saved review time, reduce
retrieval/repeated steps and report the measured change. Do not remove necessary
runtime review merely to improve a throughput number.

## 12. Next Sync Trigger

K01 frozen carrier plus one RA knowledge verdict; or B11 finalization changes
the available lane/base, whichever first affects task readiness. Do not interrupt
legal B11 work for ordinary catalog commits. Update only task/dependency/lock
state; no automatic Epoch. K02 prepare can continue meanwhile.

## 13. Dispatch Status

FAILURE_PREVENTION_MVP_PARTIALLY_READY.

Knowledge tasks are executable now; five pinned case drafts and task template
exist. Independent knowledge review, CLI implementation, confirmed current-base
regression coverage and eligible pilot remain unfinished. Runtime test tasks
are waiting for original lane release or explicit nonconflicting authorization.
No runtime acceptance, Gate, promotion, credit or Phase3 completion is awarded.
