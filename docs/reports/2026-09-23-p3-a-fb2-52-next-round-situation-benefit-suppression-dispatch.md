# P3-A FB2-52 Next-Round Situation Benefit Suppression Dispatch

Role: Codex A
Status: `DISPATCHED`
Date: 2026-09-23

## Exact baseline

- Exact synchronized baseline: `aa89a7c2bf831a7f52e09a02632cfdb5675eefb8` (`P3-A-R106-FB2-51-ACCEPTANCE-SYNC`).
- Formal migration accepted: **`153/944`**.
- Formal remaining: **`791`**.
- Current frozen material authoring overlap: **`148/944`**.
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.

FB2-51 is accepted and A-synchronized. A therefore freshly reconstructed the complete next Ciel seam instead of assuming S1b readiness from the trigger capability alone.

## Fresh complete-card overlay

`master.ciel.skill.s1b` now has accepted runtime coverage for its trigger and effect chain: authoritative `player.victory-points.changed`, accepted FB2-31 opponent relation, accepted FB2-51 literal crossing-7 condition, and accepted FB2-30 controller master-skill definition-return. However the frozen effect returns/creates `master.ciel.skill.s3`, and that target definition is still absent from canonical authoring.

Locked Reference `src/content/authoring/cards.json / skillCards[39]` defines `master.ciel.skill.s3` as a once-per-game combat action with cost 3 / base power 7 / magecraft attribute. Its ability is structurally:

- source must be active and at a battlefield;
- it applies to same-battlefield opponents who do **not** control an active face-up Luck attack (`card.cardluck`, canonically mapped by the accepted compiler alias to runtime `basic.luck`);
- at least one such opponent must exist;
- on resolution, each currently qualifying opponent is marked for `current_round + 1`;
- during exactly that marked round, that player gains no mana from the situation and receives no situation power bonus;
- the suppression is otherwise inert and does not affect event/location/skill power, or generic/deployment/event mana.

Current runtime already supports combat phase actions, `source_active`, `at_battlefield`, stable same-battlefield player relationships, per-game use tracking, and the fixed `card.cardluck -> basic.luck` canonical mapping. Fresh source/runtime probes found no accepted typed route for the remaining compound semantics: the exact no-Luck opponent predicate/count, the server-owned next-round marker, or consumption of that marker at the two authoritative situation-benefit production paths.

Therefore `master.ciel.skill.s1b` is **not** S-ready on this baseline. The minimum next capability is the bounded identity-free whole-family below; do not author either Ciel card in B2.

## Exact FB2-52 capability contract

Implement one bounded identity-free whole-ability family for **next-round situation benefit suppression**. The accepted shape must be limited to:

1. an automatic combat `phase_action` using the ordinary controller combat action window, with exact source conditions `source_active` then `at_battlefield`;
2. exact qualifying players are active opponents at the controller's same battlefield who do not currently control an active, face-up `basic.luck` card in runtime `attack_area` (the frozen authoring alias is `card.cardluck`); controller and players at other locations never qualify;
3. activation is legal only when at least one qualifying opponent exists;
4. resolution recomputes/revalidates the qualifying set and records each qualifying player's suppression round as exactly `current authoritative round + 1` in a narrow server-owned runtime map;
5. the marker affects only the exact player and only while `markerRound === state.round.roundNumber`; current-round benefits remain unchanged and later rounds automatically become inert by round comparison;
6. when the marked player would receive mana from a situation through the authoritative `grantMana(..., { source: 'situation' })` path, the requested situation grant resolves to zero. Generic, deployment and event mana remain unaffected;
7. when combat power is assembled for the marked player, situation-source breakdowns are omitted. Event, location, skill and other non-situation modifiers remain unaffected;
8. the whole family may express exactly the two frozen logical suppressions (`situation_mana_gain` and `situation_power_bonus`) and the exact next-round marker semantics required above, but runtime execution must use the narrow server-owned map rather than a generic arbitrary player-flag engine;
9. malformed/widened authoring, wrong card definition, wrong zone/face/active predicate, arbitrary marker key/offset, arbitrary rule, arbitrary target scope, extra effects/modifiers, or misplaced reserved vocabulary must fail closed at loader/compiled admission;
10. no qualifying opponent, stale source/location state, or malformed state must fail/no-op transactionally as appropriate without partial marker mutation.

## Forbidden widening

FB2-52 must not:

- author `master.ciel.skill.s3`, `master.ciel.skill.s1b`, or branch on Ciel/card names/printed text in production runtime;
- expose a generic player-flag API, arbitrary numeric flag keys, arbitrary round offsets, arbitrary card-definition predicates, arbitrary target-count engine, arbitrary situation-rule suppressor, or generic modifier-forbid engine;
- suppress event/location/skill power or non-situation mana;
- change the accepted `card.cardluck -> basic.luck` canonical alias globally beyond what is required to consume that already-existing mapping;
- modify generated product/client content, merge/retarget stacked PRs, or claim migration credit.

## Authorized B2 scope

B2 may touch only the minimum rules/compiler/runtime surfaces required by this exact family, focused tests, and one result report. Prefer a dedicated classifier/helper and a narrow runtime field such as `situationBenefitsSuppressedRoundByPlayer`. Production integration may touch the loader, interpreter, `grantMana` situation path, situation combat breakdown path, ability types/index exports, and focused tests. Do not widen scope without a mechanically demonstrated exact blocker.

## Required focused evidence

At minimum prove:

- raw + compiled exact whole-envelope admission and malformed/near-match/wrong-position rejection;
- no qualifier means activation is not legal and causes no marker mutation;
- one and multiple qualifying same-battlefield opponents are marked for exactly next round;
- an active face-up `basic.luck` in `attack_area` excludes that opponent, while face-down/inactive/wrong-zone Luck does not;
- controller and other-location players are never marked;
- marking does not suppress current-round situation benefits;
- exactly next round, authoritative situation mana is zero for marked players while generic/deployment/event mana remains available;
- exactly next round, situation power breakdowns are omitted while event/location/skill power is unaffected;
- the following round restores both benefits automatically;
- malformed/widened key/offset/rule/predicate/scope fails closed before state mutation;
- typecheck, affected focused compatibility, repo-required gates for the touched production surfaces, and `git diff --check`.

## Accounting and next step

FB2-52 is identity-free capability infrastructure and earns **zero migration credit**. Formal migration remains **`153/944`**, **`791`** remaining, and frozen material overlap remains **`148/944`** throughout B2 implementation/review and A synchronization.

After exact fresh R acceptance and A synchronization, A must first freshly reconstruct and dispatch `master.ciel.skill.s3` as its own singleton S only if the whole target card is then mechanically zero-gap. Only after the target definition is formally available may A freshly reconstruct `master.ciel.skill.s1b` and dispatch it if complete-card readiness is proven. Do not bundle both consumer identities into this B2 task.
