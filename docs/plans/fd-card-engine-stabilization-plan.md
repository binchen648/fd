# FD Card Engine Stabilization Plan

- Document Role: ACTIVE_PLAN
- Status: ACTIVE / BODY_INCOMPLETE
- Implementation Status: MAINLINE_DEFINED_BY_ACCEPTANCE_REFERENCE_ONLY
- Acceptance Status: No stabilization phase may be promoted without independent Gate A/B/C review.
- Parent: none
- Depends On: `docs/rules/FD-Game-Rules-Final.md`; `docs/plans/fd-rules-conformance-and-acceptance.md`; current audit facts in `docs/audits/`
- Consumed By: all card/runtime implementers
- Supersedes: older undocumented stabilization sequencing, if recovered later
- Last Verified: 2026-09-07

> Integration note, 2026-09-07: the original stabilization plan body is not present in this workspace. This file records the required Acceptance Reference so future stabilization phases do not redefine rule truth or release readiness locally.

## Acceptance Reference

Acceptance for every stabilization phase is governed by `docs/plans/fd-rules-conformance-and-acceptance.md`.

Document responsibilities:

| Document | Responsibility |
|---|---|
| `docs/rules/FD-Game-Rules-Final.md` | WHAT: canonical gameplay rules. |
| `docs/plans/fd-rules-conformance-and-acceptance.md` | HOW TO PROVE: Gate A, Gate B, Gate C, Reviewer workflow, release gate. |
| `docs/plans/fd-card-engine-stabilization-plan.md` | HOW TO MIGRATE / IMPLEMENT: stabilization sequencing only. |

Stabilization work may only declare `IMPLEMENTATION_COMPLETE_CANDIDATE`. Independent review is required before any phase, card cohort, flow, or release target is marked `COMPONENT_VERIFIED`, `SCENARIO_VERIFIED`, or `E2E_VERIFIED`.

Phase-specific examples:

- Primitive registry work must satisfy relevant Gate A component conformance, not merely prove that a registry exists.
- Real card migration must satisfy Gate B scenario conformance for the selected Golden Card or rule combination.
- Frontend/runtime work must satisfy Gate C using the real client, server command, state mutation, event/projection path, and reconnect where relevant.
- Green regression tests are required evidence, but never sufficient by themselves for Release Ready.

Open governance gap:

- Recover or reintroduce the full historical stabilization plan body if it exists outside this workspace, then keep this Acceptance Reference section without weakening the baseline above.
