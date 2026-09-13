# P3-TO-15 Modifier Source And Power Trace Contract

- Owner: Codex B, specification lane only
- Date: 2026-09-14
- Status: `SPEC_REVIEW_READY`
- Runtime authorization: `NONE`
- Gate promotion: none
- Lifecycle dependency: P3-TO-04 spec `b46cfa4439c27112d14066e2239e7524f5a1e137`, review `d1e13d84b31bcbb57a6326ce9ea803fa877c651c`, `SPEC_ACCEPTED`
- Reference evidence only: Artoria Caster modifier/lifecycle candidate and Tomoe power repair; neither is promoted by TO-15.

## 1. Purpose

Define one typed source/target/layer/trace envelope for rule modifiers and power-facing effects without creating another shared mutable owner.

TO-15 separates two concepts:

1. **Modifier source contract** — authoritative identity, applicability, priority, lifetime, and effect/rule ownership.
2. **Power trace contract** — deterministic ordered calculation evidence from printed/base power through card/terrain/aggregate/total/final layers.

It does not implement either contract.

## 2. Corrected Denominators

```text
strict current modifier semantic-axis = 25 abilities / 18 cards
legacy planning power-risk set       = 18 abilities / 16 cards
```

The old `24 modifier / 17 cards` figure is incomplete. The missing row is Ereshkigal `sc-ereshkigal-3.blooming-netherworld`; current semantic-axis evidence classifies it as `EFFECT_MODIFIER`, and current authoring contains `create_modifier { type: power_bonus, target: controller, amount: 6 }`.

The 18 POWER rows remain useful as a planning risk set, but the current semantic-axis schema does not expose POWER as a standalone generated axis. TO-15 therefore must not relabel 18 as a strict generated denominator.

## 3. Ownership Boundaries

Modifier/Power owns:

- normalized modifier identity and immutable source provenance;
- typed operation/rule/layer/scope representation;
- deterministic applicability and priority ordering;
- power calculation trace records;
- handoff from Lifecycle source-validity/duration decisions;
- handoff to Battle as a resolved participant power value plus trace.

Modifier/Power does **not** own:

- source card active/closed/moved validity — Lifecycle + Card Zone;
- trigger scheduling — Trigger Gateway;
- player choice — Interaction Template;
- card movement/close — Card Action/Card Zone;
- terrain assignment or location topology — map/battlefield owner;
- hidden reveal/projection — Hidden/Projection owner;
- winner/defeat/VP settlement — Battle/Scoring envelope;
- special identity/state machines — Special subsystem.

## 4. Canonical Modifier Concepts

The declarations below are normative concepts, not an implementation instruction for this task.

```ts
type ModifierAxis = 'rule_modifier' | 'effect_modifier';

type ModifierOperation = 'ignore' | 'forbid' | 'set' | 'add' | 'multiply';

type PowerLayer =
  | 'attack_printed'
  | 'attack_base_set'
  | 'attack_current_modifier'
  | 'terrain_base'
  | 'terrain_add'
  | 'terrain_multiply'
  | 'terrain_set'
  | 'aggregate'
  | 'total_add_subtract'
  | 'final_set';

interface ModifierSourceRef {
  sourceCardInstanceId: string;
  sourceAbilityId: string;
  sourceDefinitionIdAtInstall: string;
  controllerPlayerId: string;
  installedRevision: number;
  lifecycleRef?: string;
  causationId: string;
}

type ModifierSubjectRef =
  | { kind: 'controller' }
  | { kind: 'all_players' }
  | { kind: 'opponents_at_same_battlefield' }
  | { kind: 'engaged_opponents_same_battlefield' }
  | { kind: 'duel_pair' }
  | { kind: 'accepted_subject_policy'; policyId: string };

type ModifierObjectRef =
  | { kind: 'source_card' }
  | { kind: 'this_card' }
  | { kind: 'attack_card' }
  | { kind: 'this_effect' }
  | { kind: 'accepted_object_policy'; policyId: string };

type ModifierConstraint =
  | { kind: 'has_attribute'; attribute: string }
  | { kind: 'not_modifier_source_card' }
  | { kind: 'accepted_constraint_policy'; policyId: string };

type ModifierApplicability =
  | { kind: 'choice_equals'; choiceRef: string; expectedValue: string }
  | { kind: 'accepted_condition_policy'; policyId: string };

type ModifierValue =
  | { kind: 'literal'; value: number }
  | {
      kind: 'compiled_numeric_expression';
      expressionId: string;
      declaredInputPolicyIds: string[];
    };

interface ModifierScopeRef {
  subject?: ModifierSubjectRef;
  object?: ModifierObjectRef;
  locationPolicyId?: string;
  constraints: ModifierConstraint[];
}

interface ModifierContract {
  modifierId: string;
  source: ModifierSourceRef;
  axis: ModifierAxis;
  operation: ModifierOperation;
  ruleKey: string;
  scope: ModifierScopeRef;
  applicability: ModifierApplicability[];
  value?: ModifierValue;
  priorityPolicyId: string;
  layer?: PowerLayer;
  sourceValidityPolicyId?: string;
  durationPolicyId?: string;
}

interface PowerTraceLine {
  traceLineId: string;
  sourceType: 'card' | 'skill' | 'situation' | 'event' | 'location' | 'terrain' | 'rule';
  sourceId: string;
  modifierId?: string;
  layer: PowerLayer;
  operation: 'set' | 'add' | 'subtract' | 'multiply' | 'ignore';
  inputValue: number;
  operand?: number;
  outputValue: number;
  causationId: string;
  projectionPolicyId: string;
}

interface PowerTrace {
  participantPlayerId: string;
  battlefieldId: string;
  attackCardIds: string[];
  lines: PowerTraceLine[];
  finalPower: number;
  calculationRevision: number;
}

type ProjectedPowerTraceLine =
  | {
      traceLineId: string;
      layer: PowerLayer;
      operation: PowerTraceLine['operation'];
      inputValue: number;
      operand?: number;
      outputValue: number;
      source: {
        sourceType: PowerTraceLine['sourceType'];
        sourceId: string;
        modifierId?: string;
      };
      redaction: 'none';
    }
  | {
      traceLineId: string;
      layer: PowerLayer;
      operation: PowerTraceLine['operation'];
      inputValue: number;
      operand?: number;
      outputValue: number;
      redaction: 'source_identity';
    }
  | {
      traceLineId: string;
      layer: PowerLayer;
      redaction: 'details';
    }
```

The schema may be implemented differently later, but every accepted implementation must preserve these identities and semantic distinctions.

## 5. Modifier Admission

A modifier may enter the authoritative store only when:

- source card instance and source ability are authoritative and validated;
- the authored semantic shape maps to a reviewed rule/effect contract;
- operation and `ruleKey` are supported as a pair;
- target/scope and applicability predicates are compiler-normalized to the closed typed unions above or to an independently accepted policy reference;
- unknown subject/object/constraint/applicability shapes fail admission before a modifier reaches runtime storage;
- priority is explicit or supplied by an accepted default policy ID;
- source-validity and duration refs are supplied when persistence depends on source/lifecycle;
- modifier values are either finite literals or compiler-validated numeric-expression references with declared authoritative input policies; arbitrary object payloads are forbidden;
- the same authoritative install transition cannot duplicate the modifier.

Unknown operation/rule/scope/priority/layer combinations fail closed. A recognized modifier shape never falls back to translated text, card-name routing, `modeState` interpretation, or a legacy handler after admission.

## 6. Rule Modifiers Versus Effect Modifiers

The current strict axis contains:

```text
RULE_MODIFIER=16
EFFECT_MODIFIER=9
```

### Rule modifiers

These change legality, immunity, prevention, or a named calculation rule. Current authored operations actually observed are:

```text
ignore
forbid
set
add
```

A rule modifier must preserve its `ruleKey`; two modifiers with the same numeric-looking outcome are not interchangeable when they modify different rules.

### Effect modifiers

These are effect-driven state changes such as power bonus, terrain multiplier, status creation, reversal of situation/event modifiers, or opponent-power reduction/set.

Effect modifiers must be normalized to typed state/result contracts before they participate in Power. A legacy extended-effect tag alone is not a final modifier contract.

## 7. Source Identity And Lifecycle

Modifier source identity is stable card-instance + ability identity, not display name.

Persistent modifiers consume the accepted P3-TO-04 source-validity and duration contracts:

- source validity is supplied by an accepted Card Zone/source-state policy;
- duration/expiry/reset ownership remains Lifecycle;
- Modifier/Power must not hard-code `field`, `attack_area`, or card-type cleanup rules;
- source invalidation and mandatory modifier teardown participate in the same composed transaction when the modifier must disappear with the source;
- transform/replacement cannot silently adopt an old modifier unless an explicit reviewed transfer contract exists.

## 8. Priority And Deterministic Ordering

Order can change game results, especially for `set`, `add`, `multiply`, `ignore`, and explicit exceptions.

Therefore:

- authored/accepted priority policy is authoritative;
- semantic priority must be resolved before technical tie-breaking;
- card ID, ability ID, source-file order, map/object iteration and lexical sort must not decide game semantics;
- exact ties may use a stable technical order only when reviewer evidence proves the tie cannot change the result;
- if two applicable modifiers have materially ambiguous order, that runtime slice remains blocked.

The current interpreter's partial sort around `explicit_exception` is reference evidence only and does not define the complete canonical priority system.

## 9. Canonical Power Layers

The accepted rules/conformance evidence requires traceable layers equivalent to:

```text
attack printed
attack base set
attack/card current modifiers
terrain base
terrain add
terrain multiply
terrain set
aggregate attacks
power/total add or subtract
final set
FINAL POWER
```

Every layer-changing operation must emit enough trace to reconstruct input -> operation -> output.

The current runtime's storage order (`card.powerModifiers`, ongoing `ruleModifiers`, battle situation/event/location/skill/terrain breakdowns) is implementation evidence, not a normative replacement for this canonical layer order.

## 10. Trace Requirements

A valid power calculation exposes, at minimum:

- participant identity and battlefield;
- contributing attack identities, subject to projection rules;
- each applied source and semantic modifier identity;
- canonical layer;
- operation;
- pre-operation value;
- operand/value;
- post-operation value;
- ignored/suppressed sources where the rules require auditable exclusion;
- final power.

A complex power test that only checks `finalPower` is insufficient.

The authoritative server trace is never internally redacted: it retains the real source identity, modifier identity, causation, inputs, and outputs needed to reconstruct the result. Each line carries a stable `projectionPolicyId` owned by the accepted Hidden/Projection layer. Viewer-specific projection derives a `ProjectedPowerTraceLine` and may expose full source identity to an authorized/controller viewer, redact only source identity, or redact additional details as the policy requires. Projection must never mutate or replace the authoritative trace record.

## 11. Terrain / Situation / Event Polarity

Terrain, situation and event contributions are distinct sources even if they are all numeric.

- terrain base/add/multiply/set remain separate layers;
- situation and event modifiers retain source provenance;
- reversal/negation effects operate on typed source classes, not string labels;
- exemptions are typed rules with source/controller scope;
- a terrain multiplier is not modeled as arbitrary mutation of a total-power number;
- absent/corrupt terrain assignment or source classification fails closed when required by the effect.

## 12. Rule-Legality Modifiers

Not all 25 modifiers affect numeric power. Examples include play-requirement exceptions, effect-prevention immunity, skill-card prohibitions, battlefield movement locks, and situation restrictions.

These use the same source/priority/lifecycle envelope but do **not** enter Power Trace unless they actually change power calculation or suppress a power source.

This separation is why the modifier denominator and power-risk set must not be conflated.

## 13. Power-Formula Inputs

Dynamic values such as consecutive-play rounds, discard counts, activation round, actual terrain state, or other formulas must use typed authoritative inputs.

Forbidden inputs include:

- translated-text parsing;
- display labels;
- card/ability ID branches used as a substitute for semantic shape;
- arbitrary `modeState` keys with no reviewed owner;
- client-provided formula variables not declared by the authored contract.

Formula evaluation must reject non-finite values and unsupported operators.

## 14. Installation / Update / Removal Idempotency

Each authoritative modifier transition has a stable transition/causation identity.

- duplicate install from the same command/event is rejected or idempotent;
- stale replay cannot install twice;
- reconnect cannot reinstall;
- expiry/source-close cannot remove twice;
- a new legal later activation receives a new transition identity;
- dedupe is not based merely on matching source/ability IDs across different legal uses.

## 15. Transaction Semantics

A command that installs/removes/updates a modifier and performs required external mutations commits atomically when those mutations belong to one command.

Failure preserves, unless an earlier command was separately committed:

- modifier store;
- lifecycle state;
- card zones/control/visibility;
- resources;
- terrain/location/battle state;
- power trace/history;
- pending Trigger/Interaction state;
- revision and logs.

A later command failure does not roll back an earlier successfully committed modifier installation.

## 16. Projection And Reconnect

Authoritative modifier state and power trace survive server serialization/reconnect.

Projection must:

- derive viewer output from the immutable authoritative trace plus its accepted `projectionPolicyId`;
- preserve public final power and permitted source trace;
- support public, controller/authorized-only, and redacted source-detail outcomes without deleting authoritative server provenance;
- redact hidden source/card identity where required;
- never expose private formulas/candidates solely because a modifier exists;
- restore the same modifier identity after reconnect;
- not increment revision merely because state is projected/restored;
- reject stale commands that would duplicate modifier installation or power mutation.

## 17. Battle Envelope Handoff

Modifier/Power ends at an authoritative participant power + trace.

Battle Result owns:

- winner/tie selection;
- defeated exclusion;
- margin;
- scoring/VP;
- battle-result event feed.

TO-15 does not promote P3-TO-14. It only defines the power-side input contract that a later Battle Result envelope consumes.

## 18. Current Evidence Boundary

Artoria Caster and Tomoe reports are useful reference evidence:

- Artoria shows source identity, ongoing duration, +2 power and projected battle trace;
- Tomoe shows a terrain predicate and -5 total-power source trace.

Both remain implementer/transitional evidence. TO-15 specification acceptance must not convert either into independent runtime acceptance or a family-wide Gate promotion.

## 19. Fail-Closed Requirements

Reject without semantic fallback:

- missing/stale source card or ability;
- unsupported operation/rule pair;
- missing priority where ordering can change outcome;
- invalid scope/constraint;
- unsupported or ambiguous Power layer;
- non-finite formula/value;
- persistent modifier without required source-validity/lifecycle ref;
- duplicate transition identity;
- stale replay;
- hidden source exposure to unauthorized viewer;
- reversed/ignored source class that cannot be typed;
- malformed trace where final value cannot be reconstructed;
- legacy string/directive/modeState interpretation after typed semantic admission.

## 20. Runtime Admission After Spec Acceptance

A later runtime slice still requires:

- exclusive hot-file ownership;
- exact semantic subset and before/after legacy metrics;
- compiler/schema negatives;
- source/priority/lifecycle tests;
- canonical power trace assertions when power-facing;
- reconnect/stale tests when persisted/projected;
- independent reviewer acceptance.

No runtime is authorized by TO-15 itself.
