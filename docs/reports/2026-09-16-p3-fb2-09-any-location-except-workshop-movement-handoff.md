# P3-FB2-09 Any-Location-Except-Workshop Movement Handoff

Date: 2026-09-16
Role: A
Status: READY
Base lineage: `6d015d5bacd8cffcaf0df9827fb3e36bfa817c31`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`

## Why this is the next slice

After FM01 acceptance, a fresh frozen-F1/current-authoring scan found 237 remaining block-free contract-mapped identities. The largest exact single-capability group is 12 servant skills requiring only `GENERIC_MOVEMENT`. All 12 have the same semantic axes (`ACTION`, `MOVE_PLAYER`), same printed text hash, and the same source overlay movement rule. This creates an honest 12-member F4 batch once one narrow Movement runtime contract is independently accepted.

## Exact evidence family

All 12 selected identities have:
- top-level `blockedBy=[]`;
- Phase 3 `blockedBy=[]`;
- required capabilities exactly `[GENERIC_MOVEMENT]`;
- mechanic family exactly `[MOVEMENT]`;
- classification route `READY_GENERIC_EXTENSION`;
- axes: timing `ACTION`, effect `MOVE_PLAYER`, all other axes empty;
- source overlay activation phase `action`;
- source overlay effect exactly controller movement with `destinationRule=any_location_except_workshop`;
- printed-text SHA-256 `5d3fd4e656083f54831c208f2e7b3c9a4ffd5977776e3a3b5214c868596ca1c0`.

Exact IDs are the 12 listed in P3-FB2-09 in the Task Index.

## Existing runtime to reuse

The interpreter already provides:
- location target candidate generation for `any_enabled_location`;
- `not_location_kind: workshop` mapped to exclusion of `magic_workshop`;
- enabled-location, occupancy, and locked-battlefield filtering;
- effect movement provenance through movement distance and battlefield counters;
- movement log emission;
- `after_controller_enters_location` production.

However `move_player` is not registered in Resolution Data-flow. FB2-09 must not accept the slice by merely falling back to the legacy effect switch.

## Required implementation contract

Add only the narrow typed path:

1. Resolution Data-flow
   - add `move_player` to the typed result/node/registry/coercion/validation surfaces;
   - the typed node references one already-declared location target id;
   - use a trusted hook for the authoritative movement side effects that live in the interpreter runtime;
   - result envelope should identify controller, from/to locations, moved status/count as appropriate, and emitted event ids without exposing client authority.

2. Identity-free route classifier
   - phase action / action / controller action window / active source;
   - one location target with count exactly 1..1;
   - target constraints exactly `any_enabled_location` plus `not_location_kind: workshop`;
   - one `move_player` effect whose `to` equals that target id;
   - empty conditions/cost/creates/ruleModifiers/lifecycle; no response `opens`; no unrelated limit;
   - do not recognize other movement shapes.

3. Fail closed
   - a structurally recognizable movement-action envelope that mutates destination rule, target cardinality/type, scope, cost, condition, effect count, source state, or workshop exclusion must not fall through to legacy execution.

4. Behavioral tests
   - correct legal candidate set from a normal enabled location;
   - excludes current location and Magic Workshop;
   - respects closed locations, occupancy limits, and movement lock;
   - selecting a legal destination moves exactly the controller;
   - movement counters and log/event provenance are preserved;
   - malformed near-match fails closed mutation-free;
   - unrelated existing movement abilities (for example one-step arrow movement) are not absorbed by this contract.

## Explicit non-scope

No acceptance is granted for broad Movement, forced/third-party movement, arrow/range movement, reverse movement, movement costs, movement conditions, multiple movement effects, deployment, location replacement, or generic Target Selection. No F1 authoring migration occurs in B2.

## Downstream gate

If B2 is green, R27 reviews the exact candidate. Only after R27 acceptance may A recompute the 12 frozen identities. If still exact and dependency-complete, FM02 can be dispatched at batch size 12.
