# B11 Temporal Fixture Finalization

Date: 2026-10-13. Owner: Planner. Epoch: FD-P3-2026-09-23-09.
Task: P3-E09-B11-TEMPORAL-FIXTURE-FINALIZATION.
State: A_IMPLEMENTATION_AUTHORIZED; I_WAITING_FOR_FINAL_ASSEMBLY_CHECKS.

## Decision And Baseline

This is the single consolidated continuation of the integration closure repair,
stability authorization bd0dabe8 and preflight supplement 4ecae8e9. No new Epoch
or macro plan is introduced. Those historical authorizations remain preserved.

Inspected source: 487ab81a8e3fabf75eea5a73cd3582b37cf65520.
Both final-binding and readiness tests create PRODUCER fixtures from the running
HEAD. A later RA/G assembly therefore imports real review files without their
references. Strict rejection is correct; the fixture lifecycle is incorrect.
This inspection did not execute tests and does not award a technical verdict.

A continues from that exact source in a clean worktree. If its remote ref has
changed, register the exact new SHA and full delta before proceeding; do not
silently substitute a new baseline. Preserve existing work and scoped runtime
acceptance. B has no new runtime assignment from this diagnostic.

## Complete A Write Scope

- scripts/tests/phase3-e09-b11-final-binding.test.ts
- scripts/tests/phase3-readiness-preflight.test.ts
- scripts/tests/phase3-contract-parity.test.ts
- scripts/phase3-preflight.ts
- scripts/fixtures/phase3-e09-b11-integration-binding.json
- artifacts/phase3-e09-b11-integration-evidence-binding.json
- docs/reports/2026-10-12-p3-e09-b11-integration-evidence-binding.md

This grants a scoped tooling reservation for these paths to Codex A for this
task. Existing other reservations remain unchanged. If another writer has an
active reservation or uncommitted edits in these paths, preserve them and report
the exact conflict; this authorization does not override a competing writer.

Changes to preflight are permitted only where necessary to implement explicit
temporal inputs and exact authorization consumption. Bind this authorization
by full commit/path/hash using the existing contract, including any new delta
relative to the inspected source. No directory/glob/general Planner whitelist.

## Implementation Contract

1. Build isolated test repositories from a named, immutable pre-review fixture
   SHA verified to contain the required historical objects. Record its full SHA
   and source objects. Never use the running HEAD as the producer fixture base.
   No automatic search for an apparently usable ancestor. The historical fixture
   is test data; execute the repaired validator imported from the tested checkout.
2. Create an explicit synthetic candidate -> RA -> G -> synchronization -> final
   HEAD chain in that isolated repository. Each stage uses exact commit/path/hash
   inputs. Synthetic proofs stay test-only and are never GitHub attestations.
3. PRODUCER always uses its explicit frozen pre-review inputs. ASSEMBLED always
   uses explicit candidate, RA, G, synchronization and actual final HEAD inputs.
   Do not infer a stage from discovered files or from absence of a reference.
4. Run the same unit suites from producer and post-review checkouts. Both must
   use deterministic isolated fixtures instead of inheriting outer HEAD files.
   Separately validate the real assembly with its actual immutable references.
5. Keep producer rejection of unbound RA, and assembled rejection of missing,
   forged, stale or unrelated references, unknown files and runtime drift. Keep
   all existing hash/ancestry, exact-path and rejected-artifact assertions.

No new timeout/concurrency/retry/skip adjustment, workflow/package changes,
runtime/client/server/authoring edits, policy weakening or historical rewrite.
Existing approved stability changes remain. No fourth consumer or KPI change.

## One Delivery, Two Execution Stages

A first freezes an implementation commit, then validates that exact checkout.
Preparation follows npm ci -> npm run typecheck -> tests, with full command
receipts (tested SHA, exit code, timestamps, stdout/stderr bytes and hashes).

On the pre-review checkout execute:

- focused: npx vitest run scripts/tests/phase3-e09-b11-final-binding.test.ts scripts/tests/phase3-readiness-preflight.test.ts scripts/tests/phase3-contract-parity.test.ts --maxWorkers=2
- default: npm run test:ci
- git diff --check
- producer preflight with explicit PRODUCER inputs

A also constructs a test-only post-RA/post-G assembly and runs the same focused
and default CI commands there. Record synthetic refs and source equivalence.
Both stages must pass before A returns one IMPLEMENTATION_COMPLETE_CANDIDATE
carrier and one unified packet. Report all failures together; do not submit a
partially verified claim as ready. Use existing authorized packet/report outputs
for receipts; no new output-path approval loop is required for embedded logs.

Synthetic assembly CI tests fixture portability. It does not replace validation
of the real RA/G assembly. Avoid self-reference: execution receipts bind the
implementation SHA; the later carrier preserves checked source blobs. New RA/G
references remain external inputs, not promises embedded in an earlier packet.

## RA, G And I Completion

RA independently reviews the exact A carrier, lifecycle boundaries, source
equivalence, negative cases and raw two-stage receipts. RA verifies that the
focused suites reproduce on a post-review checkout. Persist one immutable
review with exact commit/path/hash/scope. No role-level PR or extra A sync merely
to copy a later reviewer/G SHA into frozen producer evidence.

G binds the new accepted A carrier and RA artifact under current policy, retaining
historical proofs. I then creates one real assembly with explicit RA/G references
and preserved main ancestry, and records its actual HEAD and source equivalence.

Before opening the unique promotion PR, I runs on this actual real assembly:
preparation, the focused command above, default CI, integration evidence preflight,
ancestry/policy preflight and diff-check. This actual-stage execution is mandatory;
A's synthetic proof or old PASS cannot substitute for it. I does not edit code or
validators. Exact source blobs must match the reviewed repair. Unexpected failure
returns a complete blocker packet to the responsible owner, not a path exception.

No new A/RA cycle is needed solely because valid external RA/G files are added.
If code changes after review, fresh review is required. GitHub required checks
and human approval remain mandatory before merge.

## Completion And Accounting

This repair is complete only when fixture lifecycle review passes and actual
post-RA/post-G assembly focused/default CI and both preflights pass. Opening or
merging the PR is a separate integration state. Planner registers each scoped
verdict without substituting its own acceptance.

All credit deltas remain zero; ledger stays 111/944. Gate C, long-term stability
and 93 MISSING_IMAGE remain separately recorded. This bounded plan closes known
lifecycle gaps; it cannot promise absence of an independent future defect.
