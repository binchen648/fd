# P3-TO-04 Independent Reviewer Checklist

- Implementer: Codex B, specification lane only
- Review owner: Codex R
- Date: 2026-09-14
- Implementer status: `SPEC_REVIEW_READY`
- Allowed reviewer outcomes: `SPEC_ACCEPTED`, `PLAN_NEEDS_REVISION`, `FAILED`
- Runtime/Gate effect: none

## 1. Scope Guard

- [ ] Review exact P3-TO-04 candidate commit.
- [ ] Changed files are limited to Lifecycle spec/map/matrix/checklist/scoped reports.
- [ ] No `packages/rules`, `apps`, `e2e`, authoring, generated content, taxonomy generator, KPI, or runtime classifier file changed.
- [ ] No lifecycle runtime migration or Gate A/B/C promotion is claimed.
- [ ] P3-B08 is not marked runtime-complete or runtime-ready solely by spec acceptance.

## 2. Inventory Reconciliation

- [ ] `explicitLifecycleAbilities=11`.
- [ ] Exactly 11 unique ability rows are present in the map.
- [ ] All source lifecycle-policy memberships match `artifacts/phase3-skill-coverage.json` exactly.
- [ ] Modifier-local lifecycle metadata outside the corrected ability-level axis does not increase the denominator.
- [ ] External Trigger/Interaction/Battle/Hidden/Special/effect dependencies remain visible blockers.

## 3. Source Identity And Transfer

- [ ] Source card instance, source ability, controller, and definition-at-install identity are explicit.
- [ ] `this_card` means authoritative card instance scope, not definition-wide scope.
- [ ] Same-definition replacement/new instance does not inherit usage automatically.
- [ ] Transform/replacement cannot silently adopt old state; transfer requires explicit reviewed policy.
- [ ] Display text/names/IDs are not used as generic lifecycle eligibility routing.

## 4. Usage Limits

- [ ] `uses` is positive finite integer and cadence/scope are explicit.
- [ ] Consumption boundary is explicit; no generic default is inferred.
- [ ] Prompt/decline/cancel/stale/failure does not consume unless a separately committed reviewed boundary requires it.
- [ ] `successful_effect_commit` and `successful_card_play_commit` counts roll back with failed transactions.
- [ ] Delayed `trigger_schedule_commit` semantics are explicit and do not retroactively roll back with a later distinct command failure.
- [ ] Per-round scope follows authoritative round identity and does not reset on reconnect.
- [ ] Per-game scope persists through ordinary zone moves/reconnect and does not reset each round.

## 5. Unique Trigger-Window Groups

- [ ] Claim key includes controller + semantic groupId + authoritative trigger-window ID.
- [ ] Prompt creation/decline/cancel/stale failure does not claim group.
- [ ] Successful trigger activation atomically claims group.
- [ ] Concurrent/stale second claim cannot also commit.
- [ ] Trigger owns window/order; Interaction owns choice; Lifecycle owns claim state.

## 6. Source Active / CLOSE Composition

- [ ] `while_card_active` revalidates source existence, active state, controller, ability/policy validity.
- [ ] `when_card_leaves_active_area` cleans lifecycle-owned state but does not itself move/close source.
- [ ] External source transition + mandatory lifecycle cleanup are atomic when one command owns both consequences.
- [ ] Cleanup failure rolls back the composed source transition.
- [ ] This boundary is sufficient for later B08 to compose `close_source_card` without Lifecycle owning CLOSE semantics.

## 7. Fixed Duration

- [ ] Positive round count required.
- [ ] Explicit boundary convention required; no implicit install-round default.
- [ ] Current `round_count=2` row remains runtime-blocked until exact timing is confirmed by its runtime/reviewer packet.
- [ ] `this_round` schema support does not enlarge the 11-row denominator.
- [ ] Duplicate round-boundary processing cannot expire twice.

## 8. Cleanup Destination And `remain_active`

- [ ] Movement-producing expiry requires explicit/accepted resolved cleanup destination before runtime admission.
- [ ] Lifecycle does not guess destination from name, ID, card type heuristic, current zone, or legacy handler.
- [ ] Expiry movement is executed by Card Zone/Card Action owner in an atomic composed transaction.
- [ ] `remain_active` means no automatic lifecycle-owned round cleanup movement.
- [ ] `remain_active` is not immunity from other accepted close/remove/transform rules.

## 9. Persistence / Reconnect / Idempotency

- [ ] Lifecycle/transition IDs are stable and server-owned.
- [ ] Reconnect does not reinstall, reset, reclaim, or re-expire state.
- [ ] Duplicate install/use/claim/expiry/source-cleanup/reset is rejected or idempotent.
- [ ] New legitimate later transitions are not suppressed by overly broad dedupe.
- [ ] Private state remains hidden according to external visibility owner.

## 10. Transaction / Failure

- [ ] Failing lifecycle dispatch preserves counters, claims, lifecycle records, cards, modifiers, external state, logs/history, and revision.
- [ ] Failed later command does not roll back earlier committed command.
- [ ] Mandatory external source transition + lifecycle cleanup commits or rolls back together.
- [ ] Failure does not append terminal lifecycle transition history.

## 11. External Ownership

- [ ] Trigger timing/order remains P3-TO-03.
- [ ] Interaction intent remains accepted P3-TO-05.
- [ ] Card movement/close/play remains Card Action/Card Zone.
- [ ] Battle/Scoring remains external.
- [ ] Hidden/Visibility remains external.
- [ ] Modifier/Power arithmetic remains external.
- [ ] Special subsystem consumers remain blocked.

## 12. Negative Acceptance Matrix

Reviewer samples at least one case from each negative class and confirms the contract requires fail-closed behavior without legacy/card-ID/text fallback.

## 13. B08 Dependency Decision

`SPEC_ACCEPTED` may satisfy only the Lifecycle-spec dependency for P3-B08.

Before B08 starts runtime work it must still have:

- exclusive runtime hot-file ownership;
- exact CLOSE representative scope/review packet;
- no broad Lifecycle runtime expansion;
- fresh focused tests and independent review.

## 14. Reviewer Decision

Record:

```text
Decision: SPEC_ACCEPTED | PLAN_NEEDS_REVISION | FAILED
Reviewed commit:
Blocking findings:
Non-blocking findings:
11 unique lifecycle abilities verified: yes/no
Policy memberships exact: yes/no
TO-03 accepted dependency verified: yes/no
TO-05 reachable accepted sync verified: yes/no
Runtime files changed: yes/no
Runtime or Gate promotion performed: no
B08 runtime authorized by this review alone: no
```