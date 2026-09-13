# P3-TO-12 Repair Dependency — Card Zone Active Source-State Policy

- Date: 2026-09-14
- Owner: Codex B, Card Zone repair subtask
- Status: `POLICY_IMPLEMENTATION_CANDIDATE`
- Base: `c1facfb7c203ed6078c61613d92386cfe81a83cc`
- Authorization: independent TO12 review finding `5c2496be9473a890b5bf8f241579ad5678269606`
- Consumer: later TO12 lifecycle r1 only after independent acceptance

## Purpose

Resolve the external source-validity dependency required by the independently accepted TO-04 Lifecycle Gateway without allowing Lifecycle to define active Card Zone semantics itself.

This subtask does **not** install lifecycle state, modify SC3 authoring, migrate a lifecycle row, or promote a Gate. It defines one Card Zone/source-state policy for later consumption only if independently accepted.

## Canonical rule basis

`docs/rules/FD-Game-Rules-Final.md`:

- 11.1: a card is activated by entering the attack area face-up or by an effect explicitly activating it;
- 11.3 residual semantics: residual cards remain active across rounds until closed;
- 11.4 closing: an activated skill card returns face-up to the skill area; closing ends its active source state;
- product runtime already represents active board cards in `field` or `attack_area` with authoritative `abilityRuntime.cardState[instanceId].active` and face-down state.

## Policy

```text
policyId=fd.card-zone.active-card-source.v1
owner=card_zone_source_state
```

Input identity is server-owned:

- source card instance id;
- source ability id;
- controller id;
- definition id captured at install.

Validity requires all of:

1. the exact source instance still exists;
2. controller identity is unchanged;
3. definition identity is unchanged;
4. source ability still exists on that definition;
5. source is in Card Zone's active board areas (`field` or `attack_area`);
6. authoritative active bit is true;
7. source is not face-down.

Unknown policy IDs return `supported=false`; consumers must fail closed rather than guess another policy.

## Non-goals

- no lifecycle install/cleanup/transition storage;
- no Card Action movement/close implementation;
- no Trigger/Interaction/Battle/Hidden/Modifier semantics;
- no character/card/ability ID eligibility branch;
- no runtime text parsing;
- no authoring or generated-content changes;
- no claim that TO09 direct Card Zone runtime is accepted.

## Acceptance requirement

This policy may be named `accepted_source_state_policy` by a consumer only **after** a fresh independent reviewer accepts this exact policy candidate. TO12 r1 must cite the accepted candidate/reviewer SHAs.
