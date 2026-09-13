# P3-TO-03 Trigger Gateway Negative Acceptance Matrix

- Owner: Codex B, specification lane only
- Status: `SPEC_REVIEW_READY`
- Runtime authorization: `NONE`
- Purpose: define fail-closed cases that a later Trigger Gateway runtime must prove before any Gate or migration claim.

## Negative Cases

| # | Case | Required result | Mutation allowed | Legacy fallback allowed |
|---:|---|---|---|---|
| 1 | unknown domain event type | reject admission | none | no |
| 2 | missing `eventId` | reject admission | none | no |
| 3 | duplicate live `eventId` with conflicting payload | reject as corrupt/duplicate | none | no |
| 4 | duplicate delivery of identical already-accepted event | idempotent no duplicate scheduling | none beyond original committed result | no |
| 5 | missing required causation identity | reject admission | none | no |
| 6 | event payload uses display name/index instead of stable entity ID | reject admission | none | no |
| 7 | client attempts to create authoritative domain event | reject command | none | no |
| 8 | client supplies/overwrites trigger candidate set | ignore/reject client authority | none | no |
| 9 | client supplies processed-trigger state | reject | none | no |
| 10 | trigger source card instance missing | invalidate/reject trigger | none in failing dispatch | no |
| 11 | source ability missing from current source definition | invalidate/reject trigger | none | no |
| 12 | controller/source ownership no longer valid | invalidate/reject trigger | none | no |
| 13 | source-active/location/battle requirement stale at settlement | reject after revalidation | none | no |
| 14 | same `(eventId, sourceCardInstanceId, sourceAbilityId)` scheduled twice | reject/no-op duplicate | none beyond first committed path | no |
| 15 | processed trigger replayed after reconnect | reject replay | none | no |
| 16 | optional trigger answered by wrong player | reject unauthorized interaction | none | no |
| 17 | optional trigger uses stale `expectedRevision` | reject stale | none | no |
| 18 | optional trigger reconnect creates a second interaction ID | reject/retain original identity | none | no |
| 19 | disconnect is treated as implicit decline/accept | forbidden | none | no |
| 20 | forced trigger is exposed as client-declinable | reject unsupported policy | none | no |
| 21 | optional trigger is auto-accepted without Interaction Template settlement | forbidden | none | no |
| 22 | simultaneous triggers have no reviewed semantic order | remain blocked; do not guess | none | no |
| 23 | ordering depends only on object/map iteration | reject design/runtime candidate | none | no |
| 24 | card/ability lexical sort changes a material game outcome without reviewed rule | remain blocked | none | no |
| 25 | nested event reuses parent event ID | reject duplicate/corrupt causation | none | no |
| 26 | nested/reentrant event lacks causation link | reject admission | none | no |
| 27 | corrupt continuation reference | `resolution_failed` or equivalent | none in failing dispatch | no |
| 28 | recognized trigger shape has unsupported external dependency but runtime claims support | reject route | none | no |
| 29 | Lifecycle cleanup is performed by Trigger Gateway | reject design boundary | none | no |
| 30 | Battle result is recomputed by Trigger Gateway | reject design boundary | none | no |
| 31 | hidden payload is projected to unauthorized viewer | reject projection; no leak | none | no |
| 32 | source/card translated text is parsed at runtime to decide eligibility | reject design/runtime candidate | none | no |
| 33 | card or ability ID is used as generic gateway eligibility branch | reject design/runtime candidate | none | no |
| 34 | failed effect settlement marks trigger processed | rollback processed mark with dispatch | none | no |
| 35 | failed optional second command rolls back an earlier committed command | forbidden cross-command rollback | earlier commit remains | no |
| 36 | terminal trigger is rescheduled by retry logic | reject/no-op | none | no |
| 37 | phase timing/continuous hook not in strict 13-type inventory is coerced into domain event | reject classification | none | no |

## Preservation Set For Failing Dispatches

Unless the enclosing accepted transaction contract explicitly commits an earlier command, a rejected trigger dispatch preserves:

- mana, VP, command seals, and resource totals;
- card zones, ownership/control, visibility, active/closed state;
- battle participants/results, movement, location, phase, and priority;
- pending interactions and live trigger queue;
- processed-trigger history;
- events and logs;
- revision.

## Reviewer Use

Independent review should sample at least one negative case from each class:

1. identity/admission;
2. duplicate/replay;
3. source revalidation;
4. optional Interaction handoff;
5. simultaneous ordering;
6. reentrancy/causation;
7. external-owner boundary;
8. legacy-bypass / card-ID fallback.

This matrix is specification evidence only. It does not claim that current runtime already implements these failures.