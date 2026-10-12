# B11 Single Runtime Promotion PR Authorization

Published: 2026-10-12. Issuer: Planner / Process Controller.
Task: P3-E09-I-B11-FINAL-PROMOTION. Owner: Codex I / Integration Owner.
Control Epoch: FD-P3-2026-09-23-09, verified effective on main.
Status: AUTHORIZED_CREATE_SINGLE_RUNTIME_PROMOTION_PR.
User explicitly authorized I to create the unique runtime promotion PR.
This authorizes assembly, verification, push and PR creation, not approval/merge.

## Current Exact Inputs

- Required main base: 1d0e102c1ff43c272dc5ccfb2871eda48a5f52ce.
- Governance PR 558: merged at that SHA, head ac2663c526535923f510358f12b2926db16dddf6.
- Runtime reviewed candidate: 0f62210a2e007a15e28f945c546ccd00c345942a.
- Scoped RB review: 4d5b76be9d5459cc0c40e50fae8513bc59cd5d21.
- RB artifact: docs/reviews/phase3/P3-E09-B11-TRANSPORT-SECURITY-REPAIR-0f62210-reviewer-b.json.
- RB SHA-256: 6FE0EAD378E31149B3271E137FDB99ACAC161F2894E3FAD21FC0A14986E96DB4.
- A implementation: 485b216cd4c440d3ff253248c46b62e226ee223e.
- A final carrier: 086a86a24f5cf0991b3743ceb28b34a767252070.
- Unified packet SHA-256: 6E1CB9EEBBB9F8A71C0CB65C562F15E29D003EE1A56D309580D7F74560E12E36.
- Final RA commit: 28875202695d43e580ddd637f1721e3a1dddbc8a.
- RA artifact: docs/reviews/phase3/P3-E09-B11-086a86a-final-contract-reviewer-a.json.
- RA SHA-256: C4A19526A09845214F1C4D2B3B25CC933E75532B8CD7DD8B30C719AB241E7FFE.
- G package proposal: be34ec166dcb5ac40c659645a85a3182f7135a92:
  docs/agents/manifests/governance/P3-E09-B11-PACKAGE-RESERVATION-DISPOSITION.json.

## Planner Effective Package Disposition

To implement the user-authorized promotion within its existing bounded scope,
Planner approves G's exact prospective package adoption now. This is effective
Planner authority from this publication, supplementing the preserved proposal;
do not overwrite PROPOSED_NOT_EFFECTIVE in the historical G source.
Historical ORIGINAL_WRITER_RESERVATION_PROOF_NOT_ESTABLISHED remains true.
The disclosed missing historical ownership proof does not block consideration
of only these existing script changes under this prospective disposition.

Exact transitions:

1. 9eaa0e0c417486adf7b0449e3d32fb90b7d362f9 ->
   9a7122176dcc82827c27d2cf593c59633737eafe:
   add phase3:preflight = tsx scripts/phase3-preflight.ts and
   phase3:contract-parity = tsx scripts/phase3-contract-parity.ts.
2. 11c1985dc4c72151bbf16298292bf4b7fa29fcab ->
   f4cdad92f129d26a75aac207ecedc991d40a653c:
   append --maxWorkers=2 to the existing test:ci command only.

Final package.json blob: 0f311821628a0a60cb37d752a259e6d688f7a6e9.
Final SHA-256: 6FFED5CF04F2F5FD13538E7EF86E5C59D2F50B5DB2401C9424264E50204A1658.
I verifies the JSON delta, final blob/hash, prior exact sources and G evidence.
No dependencies, existing exclusions, retry/timeout, lockfile, workflow,
additional script keys, whole-branch adoption or new package writes are included.
Epoch 09 remains current; this disposition completes its existing integration
prerequisite rather than activating Epoch 10 or changing canonical rules.

## Assembly Topology And Scope

Create one clean integration branch/worktree from exact required main. Merge
the final RA lineage (2887520) while preserving reviewed candidate ancestry,
so reviewed candidate -> synchronization -> promotion lineage can satisfy
the repository's actual ancestry policy. Do not substitute cherry-picked blobs
and then claim candidate ancestry; do not bypass ancestry checks.

Keep current-main governance/control files and the Epoch 09 task-index pointer.
Older incoming control text is historical, not an instruction to roll main
back. Resolve only mechanical governance/evidence conflicts with explicit blob
provenance. Runtime/content/tooling blobs must remain the accepted final source.
If a conflict changes reviewed behavior or evidence contracts, return its exact
paths and proposed resolution for scoped review before publishing that change.

Main and final candidate currently share merge-base 9a1689d2. Comparing their
tip trees includes 95 paths and historical evidence, including apparent deletion
of main's Epoch 09 files; those deletions must not appear in the assembled tree.
I must audit the actual final main-to-promotion diff and bind every source,
authoring/generated, tooling and evidence path to its accepted B11 dependency
or explicit prospective authority. Count/clean merge alone is insufficient.
Do not absorb unrelated historical runtime deltas or other skills by ancestry.

Allow addition of this effective authorization and G's package proposal/report
as immutable provenance, plus the repository-required integration manifest,
exact attestation and assembly receipt/report. Use existing schema/path patterns.
No policy implementation change, broad allowlist or runtime fix is authorized.
If mechanical governance needs an additional artifact, G may prepare it in the
same promotion packet; no separate role-stage PR is required merely to restate
this approval. Do not replace any RA/RB artifact or invent a GitHub identity.

## Verification And PR

Verify exact refs/hashes, RA direct-parent relation, runtime source equivalence,
final package blob, main ancestry and governance drift. Run preparation and
applicable integration checks on the actual assembled source: npm ci, typecheck,
default CI, content validation, generated determinism, build and policy using
the repository's required commands. Preserve command receipts and exits.
Reusing the accepted scoped browser evidence requires equivalent source objects;
actual new source changes require appropriately fresh review/validation.

Create exactly one PR targeting main for this B11 Slice. Explain the concrete
result-binding/transport fixes, accepted evidence-contract repair and scoped
package changes, with exact review provenance and known limitations. Include
the required promotion manifest and GitHub-bound governance evidence through
the existing policy. Actual PR HEAD must pass Node 20 build/test/policy checks.
Old local PASS and PR 558's green checks do not satisfy the new PR checks.

Before creating a duplicate, inspect open I promotion PRs for this Slice. If
one already exists, update that one and keep a single final PR. Return branch,
base, synchronization SHA, promotion HEAD, PR URL, checks and any blocker.
No human approval, merge or deploy is authorized by this dispatch.

## Accounting And Next Sync

Accepted scopes remain limited to RA/RB's explicit verdicts. Ledger 111/944;
migration/coverage/denominator credit delta 0; Gate C NOT_VERIFIED.
Current routing snapshot 23/144/3/0/111 is a measured classification, not
additional migration credit. 93 MISSING_IMAGE remains Release blocking.
No Phase 3 completion or Release readiness is granted.

Next sync: I's exact single promotion PR handoff and actual required checks.
After human merge, record actual merge/main SHA and perform applicable
post-merge ancestry/source/coverage verification before declaring this Slice
closed or releasing the source reservation. A/B need not repeat sync merely
for this authority publication.
