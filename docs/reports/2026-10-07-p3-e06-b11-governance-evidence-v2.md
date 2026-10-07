# P3-E06 B11 Governance Evidence V2

- Owner: `Codex G`
- Control Epoch: `FD-P3-2026-09-23-06`
- Task: `P3-E06-B11-G-GOVERNANCE-EVIDENCE-V2`
- Runtime task: `P3-B11-RESULT_BINDING_PRODUCTION_BRIDGE`
- Status: `GOVERNANCE_EVIDENCE_PREPARED`

## Purpose

This package records the refreshed B11 evidence chain without promoting a Git
artifact into a GitHub approval. It supersedes the old G package as the evidence
input for future governance work, but it does not rewrite or delete the old
artifact.

## Evidence lineage

```text
evidence baseline main 4b8eeeeb4edea07e2f5b6ad608534d78b5d61a27
  -> Candidate 13ab77128fe0d50a3db2a3ff3e66f7893354a6d0
  -> Reviewer B 5235ea55eb74dabf6a7dcdcf77db8827f6cf0547
  -> A sync v2 1c59c46545f4bf0d8afe593940bee57faa33e580
  -> Reviewer A Git evidence 708abf73f1510fa4b8b95ec8ad6b339fb8d32c4e
```

All four role refs are fetchable. The ordered ancestry passes, and no runtime or
authoring file changes after Candidate `13ab771...`.

## Review classification

Reviewer B's exact-SHA PASS is bound to GitHub issue comment
`6029576390` on PR #542 and to the committed Reviewer B artifact. The GitHub
object is an issue comment, not an `APPROVED` pull-request review.

Reviewer A's commit `708abf7...` contains a read-only PASS artifact for exact A
sync `1c59c46...`. It is classified only as a `GIT_EVIDENCE_ARTIFACT`:

- it is not represented as an independent GitHub account;
- it is not represented as a GitHub `APPROVED` review;
- it does not itself satisfy any future rule that explicitly requires those
  properties.

Epoch 06 currently does not require a distinct GitHub account. If a later
governance rule requires a distinct-account GitHub `APPROVED` review, that
proof must be supplied separately and bound to the then-current exact SHA.

## Artifact binding

| Evidence | SHA-256 |
|---|---|
| Reviewer B artifact | `069F3CFD1E41429BE0AF08D33E065802ED82609A87B812393484AF03C974403E` |
| A sync v2 artifact | `F22369454B070C95048CEA63CEA27AC8E960D44F48F861892C8AF5BAE33EC581` |
| Baseline coverage | `547371581D8C1EE8DB02D5727A7EE4A1574FCFEC56C460565EA2F995313B00D9` |
| Candidate coverage | `F617B406C4E7B7B9AE8928ACB47E6B9B4067CF1034589398636063D630C7419C` |
| Reviewer A Git artifact | `9C4FEC1DAB68CD99CEE9F07113C6ED0C6269D31F53B5996D87EDB303D328A7B2` |

## Fresh verification

- remote refs: `PASS`
- ordered evidence ancestry: `PASS`
- five artifact SHA-256 bindings: `PASS`
- Reviewer B GitHub comment binding: `PASS`
- post-Candidate runtime/authoring delta: `NONE`
- focused B11 and A-sync tests: `PASS`, 3 files / 30 tests
- full CI: `PASS`, 182 files / 1382 tests
- typecheck: `PASS`
- standard content validation: `PASS`, 0 blocking issues

## Current-main drift

Current `origin/main` is now
`a7751c3fa51895fd3a401721b1e926b90e016862`, following the merge of PR
#536. It and the B11 evidence HEAD are not ancestors of one another; their
merge-base is old main `4b8eeeeb...`.

Therefore this package does not certify compatibility with current main. B11
must be rebuilt or integrated onto `a7751c3...`, followed by fresh exact-SHA
review and A synchronization, before governance can authorize promotion.

## Non-claims and accounting

- Main coverage credit delta: `0`
- Main denominator delta: `0`
- Migration credit delta: `0`
- `promotedOnMain=false`
- Global Gate A/B/C: `NOT_CLAIMED`
- Main promotion: `NOT_CLAIMED`
- Phase 3, Full Roster, Release Gate, and Release Ready: `NOT_CLAIMED`

## Disposition

`GOVERNANCE_EVIDENCE_PREPARED`

`CURRENT_MAIN_REVALIDATION_REQUIRED`

This evidence package does not authorize Codex I or a promotion PR. The next
owner must first produce a current-main B11 candidate and repeat the review and
evidence synchronization chain.
