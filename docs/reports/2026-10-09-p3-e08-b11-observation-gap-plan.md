# B11 Required Observation Gap Plan

Epoch: FD-P3-2026-09-23-08

Status: PROPOSED_OWNER_HANDOFF_NOT_DISPATCHED; readiness FAIL_NO_WAIVER.

Tooling Reviewer A PASS applies only to two blocker repairs at 32eb054f49e2413d2f9891d6edbd665d7eb3c154.
Review commit: 75ce895c91f8af2ddd25b3c4fbb546bf107d3007; review SHA-256: C409D84F52720146E42F4DFB919DB30417FB1B8A96EAE7543863F97A472B1FE4.

Artifact: artifacts/phase3-e08-b11-observation-gap-plan.json
Artifact SHA-256: 71389413FC176132A8649F0637897F4E72A3FFBA8FEA1E7B2B20960C8EDB4693

## Recomputed Gaps

34 missing fields across 10 fixtures and 2 canonical consumers, not 34 cards.

| Field | Observations | Owner | Smallest task |
| --- | --- | --- | --- |
| runtime.routeCandidate | 4 | Codex B | B11_CONVERSION_STRUCTURAL_CLASSIFICATION_API |
| inventory.routeCandidate | 10 | Codex A | B11_INVENTORY_OBSERVATION_API |
| inventory.exactEligible | 10 | Codex A | B11_INVENTORY_OBSERVATION_API |
| coverage.exactEligible | 10 | Codex A | B11_COVERAGE_DIAGNOSTIC_EXACT_ELIGIBILITY |

Inventory rows are two fields in one task, not two runtime slices. Compiler observations are present; no compiler repair is proposed.

## Owner Boundaries

### runtime.routeCandidate

Expose the existing shared structural ownership classifier as a read-only API; preserve routing/primitive behavior. If ownership semantics must change, stop and request a separately scoped runtime contract.

Required reviewer: Reviewer B.

### inventory.routeCandidate

Provide independently executable authoring inventory observations for B11; explicitly separate structural ownership and exact graph eligibility. Do not alias runtime/coverage values or copy an unrelated Card Zone CLI.

Required reviewer: Reviewer A tooling; Reviewer B semantic expectations.

### inventory.exactEligible

Use the same narrow inventory task with a separate exactEligible result; report skipped shape/reason and raw normalized inputs. No KPI/taxonomy changes.

Required reviewer: Reviewer A tooling; Reviewer B semantic expectations.

### coverage.exactEligible

Add an independently reviewable diagnostic-only eligibility observation alongside the unchanged coverage taxonomy. Preserve raw runtimeRoute and counters; do not reinterpret NEW_RUNTIME as eligibility or substitute another owner observation.

Required reviewer: Reviewer A tooling; Reviewer B semantic expectations.

## Fixture Review Input

Reviewer B must independently review scripts/fixtures/phase3-b11-parity-fixtures.json at b5ef0626c5f373658c7b0ef0208f5cfda91f1a6e, digest 0757970801F81178069CA7DF4423985180130C220D486871FFAFE137C0929A46.

Candidate: 9eaa0e0c417486adf7b0449e3d32fb90b7d362f9
Adapter: 9695d7107645f9972ebef7ab6c78a4ef14b015da
Premise SHA-256: FA537BA6646A9FBE14DE7511BC51423F1F910281A41BB5EDBA0CBECAEB446530
Expected review schema: fd-p3-parity-expectation-review-v1.

This plan does not impersonate Reviewer B, change expectations, or dispatch a runtime writer lock. The runtime ownership API requirement is a proposed B task; semantic changes require separate authorization.

## Dependency Order

1. Reviewer B fixture expectation review and B read-only structural API task may proceed in parallel
2. A inventory and coverage diagnostic tasks consume independently reviewed meanings, without changing taxonomy
3. Freeze owner implementations and bind the new execution closure and fixture premise
4. Reviewer A reviews tool changes; bind exact execution receipts and fresh owner reviews
5. A reruns preflight/parity; readiness remains FAIL until all required observations and dependencies are satisfied

No runtime defect was established. Source/API inspection confirms the existing Conversion structural helper is private, inventory CLI is a different contract, and coverage taxonomy is broader than exact graph validity. A may supply read-only diagnostic APIs under explicit reviewed meanings; it must not copy runtime outputs into inventory/coverage or change KPI to make agreement green.

Main/migration/denominator delta: 0. All legacy runtime owners unchanged. Global Gate C and historical 93 image blockers remain unverified. No promotion permitted.
