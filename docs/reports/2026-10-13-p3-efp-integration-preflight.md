# P3-EFP-I01 Current-main Integration Preflight

Date: 2026-10-13 (Asia/Shanghai). Owner: Codex I. Epoch09 unchanged.
State: VALIDATION_COMPLETE_WAIT_INTEGRATION_REVIEW_AND_GOVERNANCE_DISPOSITION.
This is scoped assembly/validation, not a Promotion PR or runtime acceptance.

## Exact Inputs And Assembly

- Main/base: 219d47c8dcc2b8118f2d3f6b37f51ce465e737cb.
- Tested assembly: 1ac1cd4c171d01a21e09e83fcc93df5d842e1b15.
- Branch: codex/i-p3-efp-i01-integration.
- K01 candidate: ccbdf647a545e08f09a8067c8f2c4659f849889a.
- K01 RA: 2470f00902bd650bc3122f518b18333afed323f3; artifact docs/reviews/phase3/P3-EFP-K01-ccbdf647-reviewer-a.json; SHA-256 da0f45fded94f1dc941a3a6b7a91da586d2de36b0188ec8f3662fcbaf9b98687.
- K02 candidate: 36de92a0536d7bc06a47f61c8484a51f4e981dfc.
- K02 RA: d1a8276fd2ed1181ca281b27e840cb022d9079e6; artifact docs/reviews/phase3/P3-EFP-K02-36de92a-reviewer-a.json; SHA-256 bbb1da984109b4d75ab17076cce53fe6a02dd64d5ec2e0d31fa9d463ce4a56bb.
- Planner dispatch: 163f8e8469e81bf998f22884e9e529d5792fabe0:docs/agents/P3-EFP-K02-ACCEPTANCE-AND-INTEGRATION.md. Authority/path/hash are bound in the packet.

Before writes, I built the literal 20-path/blob/hash table: 16 frozen lessons
files, the standalone CLI, its test, and both exact RA JSON artifacts. All
20 imported blobs match the reviewed K02 tree. The table is included in
artifacts/phase3-efp-integration-preflight.json. Historical Planner ancestry was
not merged or cherry-picked. Neither reviewed candidate is an ancestor of this
new current-main materialization; exact blob reuse is not an ancestry claim.

Nine retained trees/files match base exactly: packages, apps, data, e2e,
.github, package.json, package-lock.json, docs/agents and the policy script.
Current-main B11, runtime, authoring, workflows and package configuration are
unchanged. No K03 moving-directory output is imported. This evidence packet
and this report are the only additions after the tested assembly.

## Actual Execution

Preparation: npm ci exit0, then npm run typecheck exit0.
Focused: npx vitest run scripts/tests/engineering-failure-preflight.test.ts,
1 file / 22 tests PASS, 44.09s.
Default full CI: npm run test:ci, 195 files / 1629 tests PASS, 240.37s,
zero failures/skips; no extra CLI scheduling override, retry or timeout change.
Diff check PASS. Each execution binds the exact tested assembly SHA and raw
stdout/stderr byte lengths/digests in the packet and external receipt index.
No browser suite or separate runtime task was run.

Before starting, the process snapshot showed no visible active heavy test or
typecheck batch. Own preparation/focused/full CI ran sequentially. This is not
global ownership, other-worker acknowledgement or quiet-window certification.
Read-only remote auditing and CLI retrieval did not launch runtime regressions.

Real catalog CLI at exact current base returned CHECKED, selecting FD-EVID-005
and FD-FIXTURE-006. First valid invocation cacheHit=false; repeat cacheHit=true.
The same task lookup with a remote-only object-directory override also returned
CHECKED. Commands are retrieved, not executed. Static file presence and
currentBaseCoverage=NOT_VERIFIED remain separate from semantic acceptance.
Initial temporary task metadata contained a colon in reservationReference;
two attempts failed INPUT_INCOMPLETE. Correcting only that metadata produced
the successful results; the original failed receipts are retained, not PASS.

## Remote-only Availability

Fresh git clone --mirror from GitHub, no local alternates. Audit checked 73
structured commit/path references and 29 commit identities; expected hashes
verified for available sources. Ordinary documented absent baseline paths are
recorded separately as absence probes, not missing published source artifacts.
K01/K02 source/review refs and imported blobs are remotely available.

Four required pinned source/probe paths cannot be obtained:

- b22691ab5311cd31f60eb91d573416fea3c7cf98:docs/reviews/2026-10-10-pr-474-review.md
- b22691ab5311cd31f60eb91d573416fea3c7cf98:docs/reviews/probes/review-474-independent.mjs
- 7e65291a4fa10170e249bc492617ef337caf7f8a:docs/reviews/2026-10-10-pr-475-review.md
- 7e65291a4fa10170e249bc492617ef337caf7f8a:docs/reviews/probes/review-475-independent.mjs

Three missing commit identities:

- b22691ab5311cd31f60eb91d573416fea3c7cf98
- 7e65291a4fa10170e249bc492617ef337caf7f8a
- 3310fe2cb307ac00891facbe3a192b7b481c2d63

All three exact fetch attempts independently returned upload-pack: not our ref.
This is remote unavailability of pinned historical dependencies, not a rewrite
or revocation of scoped K01 extraction. Successful selected-case retrieval does
not certify the whole catalog remotely self-contained. Complete hashes,
errors and documented absence probes are in the packet; full audit/logs are
under D:/fd-validation/efp-i01. No missing proof was fabricated or silently
replaced, and no unrelated historic branch was published by I.

## Policy Conflict And Next Owner

Promotion PR is explicitly NOT_AUTHORIZED by this dispatch. The existing policy
requires reviewed candidate ancestry into synchronization and an immutable
fd-phase3-review-attestation-v1 with real github identity/PR review thread.
K01/K02 materialized blobs do not supply ancestry. Their knowledge/tooling RA
schemas and local Reviewer A attribution do not supply policy identity. I did
not construct a fabricated manifest, waive policy or open an invalid PR.

Return one packet to Reviewer A for current-main integration delta/equivalence
and execution review. G/Planner must resolve the remote publication gaps and
applicable exact integration candidate/topology/identity binding. Planner then
decides one automation promotion PR authorization; no extra role-level PR chain
or source rewrite is implied. If source blobs need changes, return to Codex A
and fresh scoped review, not Integration runtime repair.

Runtime semantic delta NONE. Ledger111/944; coverage/migration/denominator
credit delta0. Gate C and long-term stability NOT_VERIFIED. 93 MISSING_IMAGE
remains Release blocking, not re-audited. No Phase3/full-roster/release claims.
No PR, merge, human approval or post-merge synchronization claimed.

Final Status: PROMOTION_BLOCKED_GOVERNANCE.
