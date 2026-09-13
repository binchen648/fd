# P3-TO-15 Modifier / Power Specification Result

- Status: `SPEC_REVIEW_READY`
- Scope: docs/specification only
- Modifier denominator: `25 abilities / 18 cards` (current semantic axis)
- Modifier breakdown: `16 RULE_MODIFIER + 9 EFFECT_MODIFIER`
- Power-risk planning set: `18 abilities / 16 cards`
- Lifecycle dependency: accepted P3-TO-04
- Runtime authorization: none
- Gate promotion: none

## Key correction

Old planning/mechanic-family documents list `MODIFIER=24/17`. Current semantic-axis evidence is `25/18`; the exact added/missed row is Ereshkigal `sc-ereshkigal-3.blooming-netherworld`, whose authored else branch creates a `power_bonus` modifier.

The historical `POWER=18/16` set remains a useful planning risk inventory, but current semantic-axis output has no standalone POWER axis, so TO-15 does not invent a new generated POWER denominator.

## Contract outcome

The specification defines typed modifier source, scope, operation/rule/layer, priority, lifecycle linkage, deterministic Power Trace, projection/reconnect, idempotency and transaction rollback. It explicitly separates rule-legality modifiers from numeric power modifiers and ends at resolved participant power + trace for later Battle Result consumption.

Stop at `SPEC_REVIEW_READY`; independent review required.
