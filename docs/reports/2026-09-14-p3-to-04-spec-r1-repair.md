# P3-TO-04 Lifecycle Gateway Spec r1 Repair

- Task: `P3-TO-04`
- Repair owner: Codex B, specification lane only
- Base candidate: `bd7c79cc22cc3e00765521abbc24b01c63dfba1f`
- Failed review evidence: `306d56397b27d2fa8e8b6736efc47e93ca0f88a8`
- Status: `SPEC_REVIEW_READY`
- Runtime authorization: `NONE`

## Blocker 1 Repair — Fixed-Duration Scheduler Boundary

The original candidate could represent whether the install round counted but had no normative field for the authoritative scheduler point where expiry occurs.

r1 adds `ResolvedExpiryBoundary`:

```text
kind=accepted_round_scheduler_boundary
owner=round_controller
boundaryPolicyId=<reviewed semantic boundary>
orderingPolicyId=<reviewed ordering policy>
```

`round_count` and `this_round` now require `expiresOn`. Fixed duration admission requires both:

- counting convention; and
- resolved scheduler boundary/order policy.

The expiry transition is causally linked to the authoritative boundary event/transition identity. Duplicate delivery cannot expire twice. Phase polling, source-file order, and card-specific placement are forbidden substitutes.

The current Artoria Caster `rounds=2` row remains runtime-blocked until both counting and scheduler-boundary semantics are independently confirmed.

## Blocker 2 Repair — Source Validity / Active Area

The original `while_card_active` type said only that the source must be active, leaving the generic runtime without a normalized source-state policy.

r1 adds `ResolvedSourceValidityPolicy`:

```text
kind=accepted_source_state_policy
owner=card_zone_source_state
policyId=<reviewed semantic source-state policy>
```

Every `while_card_active` policy now requires `sourceValidity` before runtime admission. Lifecycle consumes the accepted Card Zone/source-state result and does not hard-code `field`, `attack_area`, or other zones.

The ability map, negative acceptance matrix, and reviewer checklist now make this dependency explicit.

## Reverification

- source lifecycle rows: 11;
- mapped rows: 11;
- unique abilities: 11;
- missing / extra / membership mismatch: 0 / 0 / 0;
- negative cases added for missing source-validity policy, zone hard-coding, missing scheduler boundary/order, and phase-polling/card-specific expiry;
- `git diff --check`: PASS;
- repair scope: documentation only;
- no runtime, tests, authoring, generated content, artifacts, taxonomy, KPI, or Gate changes.

## Next Step

Fresh Codex R review of exact r1 commit. No runtime or Gate status is promoted by this repair.