# EFP I01/K03 Registration And Next Dispatch

Date: 2026-10-13. Planner. Epoch09. Main219d47c8 remains current.

## Registered Scoped Verdicts

I01 carrier:1d95b2306b6b3b7aa30c39041b33dad892872657.
RA:dd9a869de718bc1cf23cf5a9826149becc3cb659.
Artifact:docs/reviews/phase3/P3-EFP-I01-1d95b230-reviewer-a.json.
SHA256:5C8638CC04DBBD1F2EC84283B04007D96719F882E3E61FE2FD2D70DE0B9A0CF5.
PASS only for exact20-blob materialization and recorded execution evidence.
Promotion identity/topology remains blocked.

K03 selection:e86e9b19d5af4cfa0ca160377ec1e09d13336744.
RA:f129797b68c70b9dd85d2ffcc88d9bcfb5c19f83.
Artifact:docs/reviews/phase3/P3-EFP-K03-A-e86e9b19-reviewer-a.json.
SHA256:F13DBEF05A03F0E2D1A260AE3E83EA1F216D98B7A84B2FC53F9720E5AB35587D.
PASS only for static gap extraction/applicability/minimum-slice proposal.
Planner verified both artifact hashes, direct parents and bound packet/report
hashes. No dynamic runtime test or acceptance is implied.

## Evidence Publication Completed

Planner published exact existing commits without changing bytes/verdicts:
- refs/heads/codex/efp-historical-review-sources -> 7e65291a4fa10170e249bc492617ef337caf7f8a
- refs/heads/codex/ra-p3-efp-i01-review -> dd9a869de718bc1cf23cf5a9826149becc3cb659

b22691ab and3310fe2c are ancestors of7e65291a, covering the three reported
missing historical commits. Fresh remote-only Git verified the four missing
paths, PR472 report and I01 review byte-for-byte against local Git. These refs
publish evidence only, no old-stack merge or source adoption. Retain them while
catalog references depend on them. G still rechecks complete closure at freeze.

## P3-EFP-G01: Integration Topology And Identity

Owner:G. READY; may run in parallel with B below.
Read I01 exact RA artifact, packet and current promotion policy. Bind real
github identity/attestation and exact current integration carrier plus K01/K02
and I01 review scopes. Do not represent original K01/K02 candidate commits as
ancestors of a blob-materialized carrier; independently verified equality is
the reuse evidence, and I01 exact review is the current integration review.

Determine whether existing policy accepts that chain using current assembly
review as reviewedCandidateSha. If yes, produce the exact policy-compatible
manifest/input proposal. If not, return one minimal concrete contract-change
proposal with negative cases; do not merge old Planner ancestry or weaken
checks. No self-invented approval or implicit governance override.

Authorized outputs:
docs/agents/manifests/governance/P3-EFP-I01-GOVERNANCE-INPUTS.json
docs/reports/2026-10-13-p3-efp-i01-governance-inputs.md
Use isolated branch, record exact main/base, preserve candidate/source/reviews.
No policy implementation/package/workflow edit is authorized.

I waits for GOVERNANCE_INPUT_COMPLETE and explicit Planner PR authorization,
then performs final actual-HEAD preflights and opens one promotion PR. I01
source changes require fresh review; copying each governance field back through
A is unnecessary. Main eligibility/checks remain separately required.

## P3-EFP-K03-B: Minimum Current-main Regression Slice

Owner:B. Reviewer:RB. READY after reservation binding.
Selected contract:CURRENT_MAIN_STATIC_REWARD_COMPILED_ENVELOPE_GUARD.
Failure:FD-SHAPE-003. Base:219d47c8dcc2b8118f2d3f6b37f51ce465e737cb.
Reservation:docs/agents/manifests/reservations/P3-EFP-K03-B-STATIC-REWARD-GUARD.json.
No authoring migration or new consumer identity. Use existing FB2-34 fixtures
and current Stheno controls; do not import historical PR474/475 runtime.
Read exact accepted K03 selection and relevant FD-SHAPE case, then startup
K02 preflight from its reviewed tooling ref; it need not already be merged.

1. Bind actual branch/worktree/base and reservation; recheck current main and
   active loader ownership. This two-path grant is predicate-scoped, not global
   loader ownership. A conflicting loader writer requires coordination.
2. Add four nonempty-array negatives for activation/lifecycle/limit/visibility
   through the compiled predicate and authoritative reward path. Record baseline
   red with exact input/SHA/output before modifying runtime. Predicate rejection
   and ordinary reward behavior must be directly asserted.
3. If red confirms the proposal, add only four localized container guards;
   preserve absent optional fields and canonical loader-compiled objects.
   No global node/nodes helper change, resolver edit or numeric formula change.
   If no red or contract ambiguity occurs, return that result, not invented defect.
4. Preserve ordinary/full tied pools, losing/inactive/face-down providers, sole
   winner, duplicate modifiers and Remote Operation positives. Use current
   expected ordinary2/3 vs full4/6, not historical PR474 full5.
5. Focused: npx vitest run packages/rules/tests/fb2-34-combat-reward-distribution.test.ts packages/rules/tests/stheno-consumer-migration.test.ts --maxWorkers=2
   Run typecheck/diff-check. In a noncompeting validation window run default
   full CI before final freeze. Keep command/SHA/exit/raw bytes/hash receipts.
6. Freeze one implementation/carrier packet in the authorized outputs. RB proves
   the same new tests catch the unfixed baseline and pass repaired code while
   valid progression remains. No role PR, Gate, credit or promotion claim.

Required prevention evidence: unchanged new tests FAIL on the unfixed baseline
and PASS after the guard; a synthetically malformed modifier does not require
rollback of otherwise legitimate battle progression. Do not write findings
as raw-loader/client exploit; current scope is defensive compiled admission.

## Deferred Work And Pilot

FD-RESTORE-004 waits: historical sc3 and named transaction absent on main.
SEC001/REV002 reuse B11 accepted negatives; no duplicate fixes.
K04 still waits for an eligible approved Batch and measured baseline.
K03 red/green can demonstrate one guard catches recurrence, but does not prove
batch throughput gains or complete the entire prevention system.

Record task-start/first-review/rework and preflight timing during K03 for later
comparison. No invented timing, speedup or accepted-contract count.
A need not repeat already accepted I01/K03 extraction; it supports one final
evidence handoff only if the actual candidate requires it.

Next sync:G01 immutable input packet or B current red/frozen candidate plus RB
verdict. Source review/knowledge claims remain scoped. Ledger111/944, credit0;
Gate C,93 missing images and long-term stability retained. No new Epoch.
