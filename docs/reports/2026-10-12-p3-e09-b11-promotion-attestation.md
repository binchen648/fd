# B11 Promotion Attestation Preparation

Date: 2026-10-12. Task: P3-E09-B11-PROMOTION-ATTESTATION-BRIDGE.
G actual attestor: github:binchen648, verified via gh api user.
Status: PREPARED_WAIT_EXACT_INTEGRATION_RA.

## Verified Inputs

Planner dispatch and effective package/room-ID decisions, old runtime RB,
old final RA and original package proposal are pinned by full commit/path/hash
in the companion governance inputs. Main is 1d0e102c1ff43c272dc5ccfb2871eda48a5f52ce.
Observed I assembly is da57179a3d7c8a9f407a4ea986ab834cdd0acf25; main and old final RA are ancestors.
Nine observed runtime/config objects match scoped RB runtime 0f62210.
This is baseline equivalence, not acceptance of an unfinished integration
contract or of later tooling deltas. Candidate is deliberately NOT assigned.

Original final RA remains at 28875202695d43e580ddd637f1721e3a1dddbc8a,
with unchanged schema, scope and missing GitHub attestation fields.
G is the new actual publisher, not the old RA reviewer identity.
No new integration RA artifact/verdict was found in fetched refs at this
preparation checkpoint. Old RA REVIEW_ACCEPTED cannot be reused for that gate.

## Actual Policy Format

Current main scripts/phase3-governance.ts expects
fd-phase3-review-attestation-v1 and exact equality of taskId, reviewer,
reviewThread, candidateSha and conclusion with promotion manifest fields.
Bridge taskId must be P3-E09-I-B11-FINAL-PROMOTION, not G's preparation ID.
Reviewer must be the actual GitHub publisher, github:binchen648.
Evidence path: docs/reviews/phase3/P3-E09-B11-promotion-attestation.json.
Use lowercase SHA-256 digest of immutable artifact at review.sha.

The policy permits an issuecomment URL on existing PR 558. G will publish
there only after new integration RA accepts an exact candidate, then read
back actual URL, numeric id, author, body and response. No future URL,
fake APPROVED Review, role impersonation or premature acceptance is created.
The final bridge JSON is intentionally absent in preparation; null pending
inputs in the non-policy governance file are not a valid promotion attestation.

## Finalization And I Handoff

Bind actual new integration RA commit/path/hash/verdict/candidate, preserve
old RA and RB bytes and scopes, bind effective adoption authorities and final
source equivalence, then publish the real GitHub statement. Create separate
policy JSON and record actual response/provenance in the governance inputs.
The bridge commit/hash is reported externally to avoid self-reference.
Only an actual accepted integration candidate may populate candidateSha.
If policy cannot represent that candidate/composition, return one exact
incompatibility instead of claiming another SHA received technical PASS.

For I manifest: bridge review.sha must differ from base/head/candidate/sync;
candidate must be ancestor of synchronization, synchronization ancestor of
head, with distinct candidate/sync/head. Preserve exact reviewed lineage.
Use real reviewThread, immutable evidencePath/hash and actual reviewer.
I validates current policy with --verify-git-ancestry on final assembled source.
A may finish its one frozen contract packet; no per-G-field repeat sync needed.
No runtime/policy/old review mutation or separate stacked PR is authorized here.
New promotion HEAD needs its own Node 20 checks and human approval;
PR 558's checks and merge do not authorize runtime merge.

Credit/migration/denominator delta 0, ledger 111/944; Gate C NOT_VERIFIED;
93 missing-image Release blocker retained; no overall/Release acceptance.
Next dependency: actual immutable new integration RA verdict, not another
identity-template-only review loop.
