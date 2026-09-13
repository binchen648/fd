# P3-TO-15 Independent Reviewer Checklist

## Denominators
- [ ] current semantic-axis modifier rows regenerate to 25 abilities / 18 cards;
- [ ] `RULE_MODIFIER=16`, `EFFECT_MODIFIER=9`;
- [ ] old modifier family 24 differs by exactly Ereshkigal `blooming-netherworld`;
- [ ] current authoring proves that row contains `create_modifier(power_bonus)`;
- [ ] POWER planning set is 18 abilities / 16 cards and all rows still exist;
- [ ] POWER 18 is not mislabeled as a current generated semantic-axis denominator.

## Source / lifecycle
- [ ] stable card-instance + ability source identity;
- [ ] controller/provenance and causation identity;
- [ ] TO-04 source-validity/duration refs for persistent/source-bound modifiers;
- [ ] no hard-coded active zones or implicit transform adoption.

## Semantics / priority
- [ ] modifier axis and rule/effect distinction preserved;
- [ ] operation + rule/layer pair validated;
- [ ] typed server-derived scope/constraints;
- [ ] semantic priority precedes technical tie-break;
- [ ] no card ID, source-file order or object iteration decides meaningful order.

## Power trace
- [ ] canonical layers preserve printed/base/current/terrain/aggregate/total/final distinctions;
- [ ] each trace line has source, layer, operation, input and output;
- [ ] terrain/situation/event/skill provenance remains distinct;
- [ ] complex tests cannot pass on final number alone;
- [ ] Battle Result consumes resolved power/trace rather than owning a second calculation path.

## Failure / reconnect
- [ ] install/remove/update idempotency;
- [ ] stale replay and reconnect do not duplicate modifiers;
- [ ] required composed mutations roll back atomically;
- [ ] private projection redacts without destroying authoritative server provenance.

## Boundaries
- [ ] Artoria/Tomoe are reference evidence only;
- [ ] TO-14 Battle Result not promoted;
- [ ] no runtime, authoring, tests, coverage classifier or Gate status changed;
- [ ] acceptance only authorizes later runtime planning subject to exclusive hot-file ownership.

Decision: `SPEC_ACCEPTED` or `PLAN_NEEDS_REVISION`.

## r1 Review Addendum

- [ ] `ModifierScopeRef` has no `unknown[]`; subject/object/constraints are closed normalized refs or accepted policy IDs.
- [ ] applicability/choice conditions are represented separately from scope and fail closed when unsupported.
- [ ] modifier values are finite literals or compiler-normalized numeric-expression references with declared authoritative input policies; no arbitrary `unknown` payload survives admission.
- [ ] authoritative `PowerTraceLine` always retains full provenance and uses a projection-policy reference rather than being internally `redacted`.
- [ ] viewer projection is derived and can distinguish public, controller/authorized-only, and redacted outcomes without mutating authoritative trace.
- [ ] `redaction='details'` projected trace is structurally unable to leak source/input/operand/output fields; redaction is enforced by the type shape, not prose alone.
