# A3 Post-Merge Synchronization

- Task: `P3-E08-RP-00-A3-POST-MERGE-SYNCHRONIZATION`
- Source task: `P3-E08-RP-00-A3-RECONCILIATION`
- Epoch: `FD-P3-2026-09-23-08`
- Observation date: 2026-10-09 (Asia/Shanghai)
- Owner: Codex A
- Sync status: `READY_FOR_REVIEW`; synchronization review NOT_STARTED.
- Branch: `codex/a-p3-e08-a3-post-merge-sync`
- Verification implementation: `38d4cea770ff447700ffbfffc5f62acc98c4475e`
- Final carrier SHA is returned externally, not embedded in itself.

## Immutable merge facts

PR #545 is MERGED:
https://github.com/binchen648/fd/pull/545

- Previous main: `fefcf4f7f5bd66ed7693889fb99391e6e7321016`
- Observed main / merge: `9a1689d2ec5b56b67d1483d2593b4ab809d6c15c`
- Promotion HEAD: `e89b5bf8050c49ac46107932add61fbae785b286`
- Merged at: 2026-10-09T01:14:16Z (09:14:16 Asia/Shanghai)
- Reviewed complete A3 carrier: `1423b92f95e85eabfbe762583fd331e20226f180`
- A3 test-budget implementation: `513c390b8f2061a9638052bf9fa0264b457baf4f`
- Reviewer A commit: `f186e2e9063b5a5d950d7fd5bcdca17f77957690`
- Integration synchronization: `47d1cac90af079cd21838a9d8379bc266e8f546a`

The merge's two actual parents are previous main and promotion HEAD.
Implementation, reviewed carrier, review commit and integration synchronization
are verified ancestors of the merge. These facts bind a historical commit;
the record/test never requires moving origin/main to remain equal forever.

A3 evidence-contract/authorized local-test-budget slice status is
PROMOTED_ON_MAIN. This is not a new card/ability migration. Original A3 recount,
report, historical failures, prior observed-main anchors and review artifacts
are left untouched; their old READY_FOR_REVIEW fields remain historical.

## Exact Reviewer evidence

Reviewer: `github:binchen648`; verdict PASS; reviewed SHA `1423b92...`.
Artifact: `docs/reviews/phase3/P3-E08-RP-00-A3-overall-reviewer-a.json`.
SHA-256: `5BED0941BAC37F7AAFD67DED13C60322733D5A0040BD5203BBDF2C69FB3B87D5`.
Thread: https://github.com/binchen648/fd/pull/545#issuecomment-6072127687

The review commit's direct parent is the reviewed carrier. Its parsed identity,
epoch, task, candidate, implementation, thread and verdict are checked, not
inferred from a self-reported boolean. Raw reviewer bytes from the review commit
and merge snapshot match. All three bound evidence hashes match the merge.

## GitHub promotion-head checks

Commit check-runs API was queried for exact HEAD `e89b5bf...`.
Build and test concluded SUCCESS. Policy's latest completed attempt concluded
SUCCESS at 01:10:39Z. Earlier policy FAILURE at 01:09:50Z and CANCELLED at
01:09:29Z remain in machine evidence; they are not silently erased.
The selection rule is latest completed check per required name.

These checks bind the promotion HEAD only. They are not a claim that fresh
checks or a complete runtime suite were executed on the merge commit.

## Recount and zero credit

Read-only classifier audit on merge source:
127 archives / 169 cards / 281 abilities, fingerprint
`7239686f1a799c82029d383962a6674363eb1eb20b6ba399ed988f466e0a2fd0`.

| Counter | Previous main | Merge main | Delta |
| --- | ---: | ---: | ---: |
| new runtime semantic routed | 22 | 22 | 0 |
| legacy resolveEffect | 144 | 144 | 0 |
| legacy executeAbility | 3 | 3 | 0 |
| dual | 0 | 0 | 0 |
| not classifiable | 112 | 112 | 0 |

Authoring, pack, content source, runtime source and classifier Git objects match
before and after merge. Fresh classifier output plus identical input objects
establish the unchanged counts. Coverage artifact is not regenerated or edited.

Exactly three consumers remain on SETUP_CARD_CREATION_MINIMAL:CREATE_TO_SKILL:
- master.maiya.skill.military::military.has-support-shot
- master.olga-marie.skill.astronomical-science::astronomical-science.has-chaldeas
- master.shinji.skill.useless-person::useless-person.setup

Retained canonical accounting: 111/944, remaining 833.
This sync does not re-enumerate or re-award that identity list.
Coverage credit delta=0; migration credit delta=0; denominator delta=0;
runtime promotion delta=0. No new ability promotion is granted.

## Fresh post-merge verification

On verification implementation `38d4cea770ff447700ffbfffc5f62acc98c4475e`:
- npm ci: exit 0; 239 packages; audit reports 12 dependency vulnerabilities.
- Focused synchronization + original recount: exit 0, 2 files / 6 tests, 7.68s.
- npm run typecheck: exit 0.
- Read-only classifier audit: exit 0; counts and exact three keys match.
- git diff --check: exit 0; repeated on final carrier.

The new sync test checks immutable merge lineage, frozen hashes, review identity,
input trees, credit and latest check selection. Negative cases reject nonzero
credit, wrong reviewed SHA/hash and a later failed check. Frozen bindings use
Git blobs from the observed merge, not a moving runtime tree.
The existing recount test additionally recompiled the executable pack and
independently compared the complete current coverage object.

The complete runtime suite was NOT rerun post-merge. The independent
184 files / 1412 tests and focused 41/41 results remain attributed to Reviewer
A's reviewed carrier, not this synchronization.

## Evidence and retained gates

Artifact: `artifacts/phase3-e08-a3-post-merge-sync.json`
SHA-256: `23E52C4B1167B108AADE6872F722F07B34FF346A01B61657DD112B4819A7DD78`

Gate C remains NOT_VERIFIED. 93 MISSING_IMAGE blockers are retained historical
evidence, not freshly reaudited. Release Gate remains BLOCKED. Long-term CI
stability remains NOT_VERIFIED. No runtime/authoring/taxonomy/workflow edit,
global Gate upgrade, Phase 3 completion, new PR or merge is performed here.

Next: Reviewer A exact-SHA review of this post-merge synchronization, then
Planner records closure and resumes the Phase 3 product/runtime work.
