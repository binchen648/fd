# B11 Integration Contract And Promotion Attestation Dispatch

Date: 2026-10-12. Owner: Planner. Active Epoch: FD-P3-2026-09-23-09.
State: I_ASSEMBLY_FROZEN_WAIT_A_RA_G_CONTINUATION.
Observed I assembly: da57179a3d7c8a9f407a4ea986ab834cdd0acf25,
branch codex/i-p3-e09-b11-final-promotion; inspected clean at this checkpoint.
Main: 1d0e102c1ff43c272dc5ccfb2871eda48a5f52ce.
Existing I PR-creation authority 76133b6d remains valid, subject to these gates.

## A: Integration-Compatible Evidence Contract

Task: P3-E09-B11-INTEGRATION-EVIDENCE-CONTRACT.
Owner: Codex A. Explicit tooling contract repair authority.
Use a separate clean branch/worktree from exact I assembly da57179a. Bind
existing carrier 086a86a, RA 2887520, RB 4d5b76b and effective main as distinct
inputs. I freezes its assembly while A writes; no concurrent overlapping writer.
Check real reservations/dirty work before writing; preserve competing work.

Authorized paths:

- scripts/phase3-preflight.ts
- scripts/tests/phase3-e09-b11-final-binding.test.ts
- scripts/tests/phase3-readiness-preflight.test.ts
- scripts/fixtures/phase3-e09-b11-integration-binding.json
- artifacts/phase3-e09-b11-integration-evidence-binding.json
- docs/reports/2026-10-12-p3-e09-b11-integration-evidence-binding.md

Goal: add a distinct integration binding mode that validates the accepted
candidate plus the exact current-main governance/control closure. Historical
candidate validation remains pinned to history, and current mode still rejects
unknown or tampered deltas. Do not merely add FD-P3-CONTROL-EPOCH-09.md to a
blanket whitelist. Bind all actual preserved control files by main SHA/blob/hash
and check identity against main. Bind technical artifacts by their exact source,
scope and hash. Require accepted candidate/main ancestry and dirty-provider
rejection. Newly added promotion evidence must have its own explicit authority,
immutable source and scope; a directory prefix does not authorize arbitrary files.

Keep original packet/reviews immutable; new integration evidence is separate.
Runtime/client/server/e2e/authoring must remain source-equivalent to accepted
technical inputs. Do not weaken required promotion policy schema or identity.
Pending governance and source-assets limitations must remain truthfully pending.
Historical diagnostic issues may remain in their original artifact; current
integration evaluation checks current exact proofs rather than rewriting them.

Test the real preserved Epoch 09 files as positives; add negatives for unknown
control files, tampered accepted main blobs, stale main/candidate, forged review
or adoption refs, runtime drift and dirty source. Run focused, typecheck and
one default CI on completed tooling implementation, preserving raw receipts.
Reuse accepted runtime/browser evidence through verified source equivalence;
no automatic runtime re-review/retest just for evidence changes.
Freeze one carrier; Reviewer A reviews the exact changed contract and resulting
integration binding. Return exact commit/path/hash/scope and remote ref.
Do not assign these validator edits to I or start another role-level PR.

## G: Policy-Compatible Bridge Attestation

Task: P3-E09-B11-PROMOTION-ATTESTATION-BRIDGE.
Read actual scripts/phase3-governance.ts on main and the final assembly before
producing evidence. Policy currently expects fd-phase3-review-attestation-v1
with taskId, reviewer, reviewThread, candidateSha and conclusion exactly matching
the promotion manifest. Preserve raw RA technical JSON; its schema and null
GitHub identity remain historical. G's new identity is the actual attestor,
not an invented identity for the old technical reviewer.

Authorized outputs:

- docs/reviews/phase3/P3-E09-B11-promotion-attestation.json
- docs/agents/manifests/governance/P3-E09-B11-PROMOTION-GOVERNANCE-INPUTS.json
- docs/reports/2026-10-12-p3-e09-b11-promotion-attestation.md

G can prepare refs/schema/identity verification in parallel with A/RA. Finalize
only after the new integration contract's exact RA verdict exists. Bind old
runtime RB, old final RA, new integration RA, effective package/room-ID authority,
main and source equivalence without broadening any scope or granting credit.
Verify actual authenticated GitHub login and publish a real attestation comment
on an existing appropriate repo PR (such as governance PR 558), with exact
accepted candidate SHA and source review refs/hashes. Record returned URL/id,
actual author and response; no future placeholder URL or fake APPROVED Review.
Existing user authorization for G governance publication covers this attestation.

If the chosen governance process needs the promotion PR's own thread, I may
create the single Draft PR under existing authorization once assembly is ready,
with pending fields accurately disclosed. G posts there; I updates manifest
after immutable G evidence exists. Draft check failure remains pending, not
acceptance. Prefer a valid existing PR thread when policy permits to avoid a
circular PR-before-attestation dependency. No policy waiver is authorized.

Ensure reviewedCandidateSha is the actually reviewed integration candidate;
attestation/source-review/synchronization commit relations must satisfy existing
ancestry policy. Exact new candidate is determined after A/RA, not guessed now.
If current policy cannot represent the validated composition, return one exact
incompatibility; do not fabricate a technical PASS for another SHA.

## I Resumption

I receives A's final accepted integration carrier and G's immutable policy
attestation. Preserve main and accepted lineage; integrate only scoped tooling
and governance continuation. Validate both evidence preflight and actual policy
locally, then create/update the same single promotion PR and run actual-head
required Node 20 checks. Keep manifest HEAD current after every added commit.
Return PR/head/checks for human approval; no merge is authorized here.

Next sync: one A/RA integration-contract verdict plus G bridge attestation.
The accepted runtime remains frozen; no A repeat-sync per G field is requested.
All credit deltas zero; 111/944, Gate C NOT_VERIFIED and 93 missing images retained.
