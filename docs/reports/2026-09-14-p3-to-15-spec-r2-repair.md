# P3-TO-15 Modifier / Power r2 Repair

- Base: `048e64f1ab25f174a983e96a3f3b58b2a2e7a245`
- Review finding: `946da025553041287cc2a4fe090e235e9940ddac`
- Scope: docs/spec only
- Runtime authorization: none

## Blocker Closed

The canonical modifier contract is now discriminated by semantic axis:

- `RuleModifierContract` directly owns its reviewed `operation + ruleKey` plus typed scope/value/priority;
- `EffectModifierContract` owns a typed `effectPolicyId` and may emit zero or more `ModifierContribution` records;
- each contribution validates its own modifier/power semantics;
- non-modifier side effects remain with their existing typed owners and preserve the effect sequence/transaction boundary.

This prevents `create_status`, reversal, movement+power branch, discard+set-power, or terrain+VP abilities from being collapsed into a fake single rule operation merely because the ability carries `EFFECT_MODIFIER` on the semantic axis.

Denominators and Power Trace/projection repairs remain unchanged.

Status: `SPEC_REVIEW_READY` pending fresh independent review.
