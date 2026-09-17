# P3-TO-15 Modifier / Power r1 Repair

- Base candidate: `bfdc259abce6088277acd73dc50de5530e07e386`
- Independent review: `c3801e4d225165cf92a93ed18d4a1008f2ada8f9`
- Repair scope: specification/docs only
- Runtime authorization: none

## Blocker 1 — Closed

Canonical scope/value payloads are no longer `unknown`.

The contract now requires compiler-normalized:

- typed subject/object references;
- typed modifier constraints;
- typed applicability predicates, including choice-bound conditions;
- finite literal or compiled numeric-expression values with declared authoritative input policies.

Unsupported payloads fail before runtime storage.

## Blocker 2 — Closed

Authoritative Power Trace and viewer projection are now separate layers.

The server trace always retains full provenance. Each line carries `projectionPolicyId`; the accepted Hidden/Projection owner derives viewer-specific trace output. The projected form can expose full source details, source-redacted detail, or further-redacted detail without mutating/deleting the authoritative record.

## Retained Boundaries

- 25 modifier / 18-card semantic-axis denominator unchanged.
- 18/16 POWER set remains planning-risk only.
- no runtime changes;
- no Gate promotion;
- Artoria/Tomoe remain reference evidence only.

Status: `SPEC_REVIEW_READY` pending fresh independent review.
