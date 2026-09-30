# P3-E04-S00-A2 当前 Candidate Evidence Sync

- Document Role: `COVERAGE_SYNC`
- Owner: Codex A
- Control Epoch: `FD-P3-2026-09-23-04`
- Task: `P3-E04-S00-A2`
- Candidate: `30be3b74258c817ede1cb857ace947505b62d8ed`
- Source main: `4b8eeeeb4edea07e2f5b6ad608534d78b5d61a27`
- Sync status: `REVIEWER_ACCEPTED_CANDIDATE`
- Machine artifact: `artifacts/phase3-e04-s00-a2-current-candidate-sync.json`
- Machine artifact SHA-256: `4122DE1A2161C0E1620F96F972C85AD67FA8C7C641F826EAE60594DC23CDDE31`

## Exact candidate boundary

`30be3b7` is a new candidate whose direct parent is `5edd7b6e781e2fc81ca18112e900528d8109ea54`. It is a descendant of the current main ancestor `4b8eee...` and its worktree is clean.

The previous machine-readable Reviewer artifact remains bound to candidate `34a4369...`:

- path: `artifacts/reviewer-evidence/2026-09-27-setup-create-to-skill-current-main-review.json`
- SHA-256: `9b272aa8fc59a642145b261225fa78231760e28cc487917c582b4c52b0124952`

That artifact is not reused for `30be3b7`. It remains historical evidence only.

The current exact Reviewer B artifact is now bound:

- reviewer identity: `Codex Reviewer B`
- review commit: `73733de713e0deb833241417a04f061faf3ce8a3`
- review commit parent: `30be3b74258c817ede1cb857ace947505b62d8ed`
- artifact: `artifacts/reviewer-evidence/2026-09-29-p3-e04-s00-a2-reviewer-b.json`
- artifact SHA-256: `FD988E5544AF230D148FE9CD94E218293D54BFFB05BCFA3AE7C09B3970D66C67`

The current review artifact explicitly does not grant Gate A/B/C promotion, main promotion, or Release Gate completion.

The exact-bound legacy state is `CLOSED_EXACT_ARTIFACT_BOUND`. It is validated by the A-owned consistency check and must not be combined with any `NOT_EXACT_ARTIFACT_BOUND` or `CLAIMED_CLOSED_NOT_EXACT_ARTIFACT_BOUND` state.

Consistency verification:

- validator: `npx tsx scripts/phase3-e04-s00-a2-current-candidate-sync.ts` — PASS
- regression test: `npx vitest run scripts/tests/phase3-e04-s00-a2-current-candidate-sync.test.ts` — `1 file / 3 tests PASS`
- typecheck: `npm run typecheck` — PASS
- `git diff --check` — PASS

## Scoped evidence

Only these three authorized consumers are in scope:

- `military.has-support-shot`
- `astronomical-science.has-chaldeas`
- `useless-person.setup`

The supplied review reports that the previous three blockers are closed: cooperative duplicate creation is rejected as `duplicate_created_card`; non-`master_skill` sources are rejected as `invalid_setup_source`; and hand sources are rejected as `invalid_setup_source`. It also reports focused tests, typecheck, client build, full CI, and 3/3 independent fail-closed probes passing.

Those results are now bound to the exact current candidate. They support `REVIEWER_ACCEPTED_CANDIDATE` only; they do not promote Gate A/B/C.

## Accounting

The current global consumer counts remain unchanged:

| counter | before | after | delta |
|---|---:|---:|---:|
| `NEW_RUNTIME_SEMANTIC_ROUTED` | 12 | 12 | 0 |
| `LEGACY_RESOLVE_EFFECT` | 49 | 49 | 0 |
| `LEGACY_EXECUTE_ABILITY` | 3 | 3 | 0 |
| `NOT_CLASSIFIABLE` | 28 | 28 | 0 |
| total abilities | 92 | 92 | 0 |

`mainCoverageCreditDelta=0`, `mainDenominatorDelta=0`, `migrationCreditDelta=0`, and `promotedOnMain=false`.

## Gate boundary

Gate A and Gate B are recorded as `REVIEWER_EVIDENCE_BOUND_CANDIDATE` with `promotionStatus=NOT_PROMOTED`, matching Reviewer B's explicit non-claims. Gate C remains `NOT_VERIFIED`.

## Governance boundary

The current review artifact is exact-bound, but GitHub-bound Governance Owner attestation remains missing. Promotion is therefore blocked even though Reviewer B's exact review verdict is `PASS`.

## Next owner

Reviewer A should review this current-candidate A sync. Governance Owner must separately provide the GitHub-bound attestation before promotion preparation can proceed.

This sync does not claim Gate A/B/C acceptance, `PROMOTED_ON_MAIN`, Phase 3 completion, Full Roster completion, or Release Gate completion.
