# P3-A FB2-42 Controlled Card-Close Forbid Dispatch

Role: Codex A
Status: `DISPATCHED`
Date: 2026-09-20

## Baseline

- Exact formal migration Base: `8cbd313373ce4e683d0454f10bdcb82116093724` (R87 Nero s1 migration acceptance synchronization).
- Formal migration accepted: `144/944`.
- Formal remaining: `800`.
- F1 evidence commit: `59f145434695d29bdd17e4cb3adc887e84182377`.
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.

FB2-42 is identity-free B2 capability work only and earns zero frozen migration credit.

## Migration-credit-first readiness proof

A targeted current-baseline whole-card re-probe found no `S_READY_NOW` before opening FB2-42.

1. Nero s1 was the sole consumer newly closed by accepted FB2-40 + FB2-41; it is now freshly R-accepted and A-synchronized at formal `144/944`. Its S migration added no production runtime capability.
2. Akasha s1 remains blocked by unsupported copy semantics plus `until_condition_met` lifecycle.
3. Arc s1 remains blocked by unsupported `event_skill_id_is` / usage reset and a referenced definition dependency; Ciel s1b remains blocked by its exact VP-threshold crossing condition and target-definition dependency.
4. Atalanta s1, Kuzuki s2, Siegfried s2, Gorgon s2, Edison s2, Mozart s1/s2, Nobunaga s3, Ozymandias s2, Spartacus s2 and other stale `READY_GENERIC_EXTENSION` spot probes each retain concrete unsupported modifier/event/metric/selection/lifecycle contracts. Historical labels are not treated as current readiness proof.
5. Darius s2 was re-probed more deeply because it is a known low-gap row. Locked Reference requires, for the current round, controlled undead cards to gain +1 card power and be unable to close. Its +1 clause is already expressible without runtime changes by the accepted generic `card.currentPower` path: a temporary mechanical probe using one exact `has_card_id` constraint per normalized definition id loaded with `report=[]` and changed only the matching controlled card powers from 2 to 3 for the round. Therefore the old direct-Reference `card_power` spelling is not a remaining semantic gap.
6. The only remaining whole-card Darius s2 gap is exact close prevention for those controller-owned definition-selected cards. Current loader does not admit `card_close`, and current close resolution does not consult a card-close forbid modifier.

The current ready queue is therefore zero and the frozen scheduler permits one narrow zero-credit seam.

## Nearest closure target

Intended closure target after acceptance is `servant.darius.skill.sc-darius-2` (`巴比伦之门`). This B2 must not encode that identity in production.

Dispatch only a bounded this-round card-close forbid rule. The contract is deliberately narrower than a generic card action prohibition system:

1. Admit a rule modifier only when:
   - `operation === "forbid"`;
   - `rule === "card_close"`;
   - scope applies to the modifier controller's own card;
   - scope contains exactly one existing structural definition-id equality constraint (`has_card_id` + non-empty `cardId`);
   - modifier lifecycle is exactly `{ duration: "this_round" }`;
   - the parent automatic ability installs the same `this_round` lifecycle through the existing ongoing-effect machinery.
2. A card-close attempt is forbidden only while that accepted modifier is live, for a card controlled by the modifier controller whose definition id equals that modifier's exact structural selector.
3. The forbid must apply to server-owned `close_source_card` resolution before any active/zone/visibility mutation or emitted close event. A prevented close is a fail-closed/no-mutation rejection, not a partial close.
4. Round expiry restores ordinary close behavior. Unrelated players, definitions, modifier rules, operations, selectors, and durations are unaffected.
5. Multiple normalized definition ids may be represented by multiple independently exact modifiers; do not add an arbitrary list-selector engine in FB2-42.
6. Do not add Darius/undead identity strings, printed text, hashes, aliases, consumer routing, power semantics, create-card semantics, or any other close exception in production.

## Forbidden scope

- no consumer `data/authoring/**` migration;
- no `card_power` rule or new power evaluator;
- no `card_close` list/wildcard/attribute/relationship selectors;
- no permanent or while-active close immunity;
- no generic card-action prohibition DSL;
- no changes to unrelated close semantics, product/generated content, client production files, merge, or retarget;
- no migration credit.

## Required validation

Fresh B2 must prove at minimum:

- loader accepts only the exact bounded `card_close` forbid modifier shape and rejects near forms: wrong operation/rule, missing/multiple selector constraints, empty selector, unsupported scope/controller, non-`this_round` lifecycle, widened fields;
- an exact live modifier prevents a matching controller-owned active face-up source from closing with no mutation and no close event;
- a different definition, different controller, expired round, or no modifier closes normally;
- repeated/stacked unrelated modifiers do not broaden the match;
- existing `close_source_card` behavior and existing `card.currentPower` semantics remain unchanged;
- production hardcode audit is clean and no consumer ids/names/hashes appear in production additions;
- typecheck, focused tests, rules src/core/regression, official CI, content validation, generated determinism, exact Locked Reference verification, client build, `git diff --check`, and final cleanliness all pass;
- formal migration remains `144/944`, remaining `800`.

After fresh independent R returns `IMPLEMENTATION_ACCEPTED_CANDIDATE` and A synchronizes FB2-42, immediately normalize/re-overlay the complete Darius s2 card. Dispatch singleton S only if that whole card is then mechanically zero-gap; otherwise do not credit it.