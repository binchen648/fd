# P3-TO-16 Special Subsystem Isolation And Deletion Contract

- Track: Special Isolation / planning
- Date: 2026-09-14
- Status: `PLANNING_REVIEW_READY`
- Runtime authorization: `NONE`
- Current authoritative strict denominator: `17 abilities / 12 cards`

## 1. Purpose

Keep domain-specific mechanics from contaminating core primitive factories while providing a concrete path for typed extraction, dedicated subsystem ownership, and eventual legacy deletion.

TO-16 does not implement runtime behavior and does not promote any Gate. It defines classification, quarantine and deletion evidence only.

## 2. Authority And Denominator

Acceptance denominator is the current generated semantic-axis `specialSubsystems = SPECIAL_SUBSYSTEM` set:

```text
abilities=17
cards=12
runtimeRoute LEGACY_RESOLVE_EFFECT=17
```

The older `18 abilities / 13 cards` planning prose is stale. The corrected semantic-axis matrix introduced at `ce17801` already used 17, and the current generated coverage artifact independently reports 17.

The conservative `30 special-like` scan is not an acceptance denominator.

## 3. Core Isolation Rule

A strict special ability may not inherit acceptance from a core primitive merely because part of its effect uses Resource, Card Zone, Movement, Visibility, Trigger, Lifecycle, Interaction, Battle or Modifier operations.

A special row can leave quarantine only when its **entire semantic envelope** is covered by accepted typed owners, including side effects, state persistence, projection/reconnect, rollback and external gateway composition.

## 4. New Runtime Admission Rules

Any future special implementation must:

1. route by typed semantic shape, never character/card name;
2. never parse translated text at runtime;
3. never use `record_master_directive` as a catch-all semantic interpreter;
4. use stable source/event/transaction identity;
5. use deterministic server RNG where randomness is actually required;
6. model persistent state in typed server-owned structures rather than untyped `modeState` string bags when that state is authoritative;
7. compose with accepted Trigger/Lifecycle/Interaction/Card Zone/Battle/Hidden/Modifier owners rather than reimplement them;
8. fail closed on malformed/unsupported state with no legacy retry after semantic admission;
9. preserve transaction rollback and prior-command boundaries;
10. include independent review before any taxonomy/quarantine change.

## 5. `record_master_directive` Freeze

`record_master_directive` is frozen for new semantics.

It is not eligible as a new core primitive because its current ten consumers represent several unrelated rule families. A migration must replace each directive with one or more typed contracts owned by the proper subsystem.

The generic target is:

```text
string directive
  -> reviewed semantic contract(s)
  -> typed compiler validation
  -> typed runtime state/effect/result
  -> independent Gate review
  -> A-owned taxonomy reclassification
  -> legacy directive consumer deletion
```

No migration may replace one directive string with another string enum while retaining substring interpretation elsewhere.

## 6. Quarantine Exit Criteria

For one ability or semantic cluster to leave `STRICT_SPECIAL_QUARANTINED`, all items below are required:

- authoritative source/rules evidence resolved;
- exact semantic cluster and denominator recorded;
- all required external gateways independently accepted;
- typed compiler/schema rejects malformed near-matches;
- typed runtime has no card/ability-name branch;
- persistent state and result/continuation contracts are explicit;
- hidden/projection/reconnect semantics proven where applicable;
- deterministic RNG/provenance proven where applicable;
- failing transaction preserves authoritative state;
- no semantic admission falls back to legacy;
- focused negative tests cover stale, duplicate, malformed and unsupported cases;
- representative Gate B and Gate C evidence when runtime/projection changes require them;
- independent reviewer acceptance;
- A-owned coverage/taxonomy lane explicitly removes or changes the `SPECIAL_SUBSYSTEM` classification.

Until the final A-owned reclassification, the row remains in the strict special denominator even if an implementation candidate exists.

## 7. Legacy Handler Deletion Criteria

A case/branch/helper in `extended-effects.ts` or another legacy owner is `DELETION_READY_CANDIDATE` only when:

1. every reachable authoring consumer is enumerated;
2. every consumer has an independently accepted typed replacement or is intentionally removed from supported authoring;
3. fresh coverage reports zero legacy consumers for that exact semantic contract;
4. no generic fallback can still reach the branch;
5. full-text search finds no direct caller that bypasses the typed owner;
6. save/restore/reconnect compatibility does not require the old state shape;
7. generated definitions contain no old effect tag unless a compatibility migration is explicitly retained;
8. focused tests prove unknown old tags fail closed rather than silently no-op;
9. full rule tests and required E2E are green against the accepted baseline;
10. independent reviewer approves deletion.

Deleting the entire `extended-effects.ts` file is **not** a valid target while it contains mixed generic shims and special subsystem logic.

## 8. Dedicated Subsystems Versus Core Extraction

Prefer **core/composed extraction** when behavior is generic and reusable after external-owner composition, e.g. typed deck replacement or match-deck swap.

Prefer a **dedicated subsystem** when the behavior changes game identity/state topology, e.g. master/servant replacement or a multi-stage named state machine. Dedicated does not mean card-hardcoded; it still requires a reusable typed contract.

## 9. Review Checklist

A reviewer must independently verify:

- current strict denominator is regenerated as 17 abilities / 12 cards;
- all 17 rows appear exactly once in the inventory;
- cluster counts sum to 17;
- 17/17 are currently `LEGACY_RESOLVE_EFFECT` in the baseline artifact;
- old 18/13 prose is labeled stale rather than silently treated as current;
- 30 special-like heuristic is not used as an acceptance denominator;
- directive protocol is quarantined, not promoted wholesale;
- no proposed exit/deletion criterion allows card-name routing or translated-text parsing;
- deterministic RNG requirement covers random special-like legacy paths;
- `modeState`/substring directive protocols cannot qualify as final typed ownership;
- external Trigger/Lifecycle/Interaction/Battle/Hidden/Card Zone/Modifier ownership remains separate;
- deletion requires zero reachable consumers plus independent review;
- no runtime, authoring, tests or Gate status were modified by TO-16.

## 10. Completion Claim

`PLANNING_REVIEW_READY`

No runtime authorization and no Gate promotion.
