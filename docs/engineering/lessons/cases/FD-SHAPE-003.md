# FD-SHAPE-003: Malformed compiled optional containers become absent fields

Status: SOURCE_VERIFIED_DRAFT; independent knowledge review pending.
This records historical evidence; it grants no current runtime acceptance.

## Identity

- Failure ID: FD-SHAPE-003
- Risk: HIGH
- Runtime domains: ability-runtime, battle-reward
- Files: `packages/rules/src/ability/combat-reward-distribution.ts`
- Semantic contracts: COMPILED_ENVELOPE_FAIL_CLOSED, FULL_REWARD_EACH

## Evidence

- Source task/PR: P3-B-STHENO-FULL-REWARD-EACH-READINESS-CAPABILITY / PR474
- Reviewed exact SHA: 4dd8eca5746d63d72c7906716cb7118e2569872a
- Reviewer verdict: FAILED (technical only)
- Source commit: b22691ab5311cd31f60eb91d573416fea3c7cf98
- Artifact: docs/reviews/2026-10-10-pr-474-review.md
- Raw Git SHA-256: f588a8b7062e7d57739e1f02b24bf7d939e06a8f203a5542ab374ba7f2f93adc
- Input and observed result: Replacing activation, lifecycle, limit or visibility with a nonempty array in a trusted compiled fixture still enabled full rewards: baseVpPerWinner 5 instead of ordinary 3.

Planner read the source and independently hashed its raw Git bytes. Planner
has not rerun the probe or substituted its own technical verdict. Verify the
artifact at the pinned commit, not a moving file path.

## Root Cause

CONFIRMED in reviewer source inspection/probe: non-record containers were normalized to an empty object before whole-ability validation.

## Failed Approach

CONFIRMED: raw-loader negatives and valid-passive positives did not cover malformed compiled provider fields. This evidence does not establish an unsigned snapshot or client exploit.

## Prevention

- Required invariant: Absent optional fields and malformed present fields remain distinguishable at privileged runtime gateways.
- Forbidden pattern: Converting malformed supplied objects/arrays to an empty default before semantic validation.
- Required negative test: Each of four malformed compiled containers must disable/reject the privileged gateway while minimal valid absent-field passive remains supported.
- Test paths: `packages/rules/tests/fb2-34-combat-reward-distribution.test.ts`, `docs/reviews/probes/review-474-independent.mjs`
- Historical test status: MISSING; scope is 4dd8eca5746d63d72c7906716cb7118e2569872a.
- Relevant command: `npx vitest run packages/rules/tests/fb2-34-combat-reward-distribution.test.ts --maxWorkers=2`
- Current-main coverage: NOT_VERIFIED. At reviewed SHA the reviewer probe reproduced acceptance; an enforcing regression rejecting all four shapes is not proved. Inspect latest authorized line before scheduling repair; the independent probe is evidence, not a current-main gate.

## Applicability

Load for a task changing the listed files, contracts or runtime domains. Match
by task metadata rather than card names alone. Excluded: Unrelated numeric primitives with no compiled envelope/provider authority.
No live runtime edit or heavy test run is authorized by this case. Original
contracts, review scopes and writer reservations govern actual work.
