# P3-A03 B11 Current-Main Result Binding Evidence Sync

- Owner: `Codex A`
- Control Epoch: `FD-P3-2026-09-23-06`
- Task: `P3-A03-B11-CURRENT-MAIN-RESULT-BINDING-SYNC`
- Status: `REVIEWER_ACCEPTED_CANDIDATE`

## Exact lineage and review

- Current main: `4b8eeeeb4edea07e2f5b6ad608534d78b5d61a27`
- Candidate: `13ab77128fe0d50a3db2a3ff3e66f7893354a6d0`
- Candidate branch: `codex/b-p3-b11-result-binding-production-bridge-current-main`
- Reviewer B commit: `5235ea55eb74dabf6a7dcdcf77db8827f6cf0547`
- Reviewer B: `github:binchen648`
- Reviewer B thread: `https://github.com/binchen648/fd/pull/542#issuecomment-6029576390`
- Reviewer B comment ID: `6029576390`
- Reviewer B attestation Control Epoch: `FD-P3-2026-09-23-06`
- Review artifact: `docs/reviews/phase3/P3-B11-RESULT_BINDING_PRODUCTION_BRIDGE-review.json`
- Review artifact SHA-256: `069F3CFD1E41429BE0AF08D33E065802ED82609A87B812393484AF03C974403E`
- Candidate is an ancestor of the Reviewer B commit: `YES`
- Reviewer B commit direct parent: `f649ce869fd6b44780debd762e225256c4f2a40e` (the prior exact-candidate review attestation)
- Reviewer B commit directly inherits Candidate: `NO`
- Candidate descends from current main: `YES`

## Authorized scope

Only these abilities are synchronized:

- `conversion-magic.preparation`
- `sc-kintoki-3.golden-eater`

Reviewer B recorded scoped Gate A/B/C PASS evidence, semantic identity-free routing, fail-closed behavior, rollback, reconnect, stale replay rejection, and closed legacy fallback. This remains scoped candidate evidence and does not promote global Gates.

## Recomputed current-main coverage

The baseline was generated from `origin/main@4b8eee...`; the candidate artifact was generated from Candidate `13ab771...`.

| Metric | Current main | Candidate | Delta |
|---|---:|---:|---:|
| `newRuntimeSemanticRouted` | 22 | 23 | +1 |
| `legacyResolveEffect` | 144 | 144 | 0 |
| `legacyExecuteAbility` | 3 | 3 | 0 |
| `dualRuntime` | 0 | 0 | 0 |
| `notClassifiable` | 112 | 111 | -1 |

Coverage artifacts are bound by path, source fingerprint, and SHA-256 in the machine-readable sync artifact:

- Baseline: `artifacts/phase3-p3-b11-current-main-baseline-coverage.json`
- Candidate: `artifacts/phase3-skill-coverage.json`
- A sync artifact: `artifacts/phase3-p3-b11-current-main-result-binding-sync.json`

Identity-specific route transition:

- `conversion-magic.preparation`: `NEW_RUNTIME_SEMANTIC_ROUTED → NEW_RUNTIME_SEMANTIC_ROUTED`
- `sc-kintoki-3.golden-eater`: `NOT_CLASSIFIABLE → NEW_RUNTIME_SEMANTIC_ROUTED`

## Accounting boundary

- Main coverage credit delta: `0`
- Main denominator delta: `0`
- Migration credit delta: `0`
- `promotedOnMain=false`
- Governance attestation: `PENDING`

The sync does not claim Phase 3 completion, Full Roster completion, Release Gate, or global Gate promotion.
