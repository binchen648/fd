# P3-FB2-13 Alter Ego Transform Runtime Handoff - 2026-09-16

Role: Codex A
Status: `READY_FOR_B2`
Base: P3-R36 accepted lineage `e8bc73ede18c14d97158aa8677ae3498fa829935`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Reference handler: `core.alter-ego-transform`

## Why this is one legitimate handler family

After FM06, accepted canonical overlap is `91/944` and `853/944` identities remain outside accepted canonical authoring. A fresh scan found no remaining identical printed-text family of normal F4 size 10-40. The largest identical-text family is nine regular Alter Ego cards, but locked Reference maps exactly ten still-unmigrated identities to one shared handler, `core.alter-ego-transform`.

The tenth member is Sion's `他人格 EX`. It is not identical printed text and must not be described as such. It is eligible for the same runtime capability only because locked Reference dispatches it through the same structural transform handler, with data-level differences: fixed 3-mana ability cost, no source close, once-per-round use.

There is no Reference identity switch inside the transform core. The regular and EX variants differ only by structural parameters.

## Exact future FM07 evidence membership

These ten F1 identities are evidence membership only. B2 must not add or modify canonical authoring:

### EX variant

- `master.sion.skill.s12`
  - legacy ID `s12`
  - printed-text SHA `43c84de7cf6532ee6b561d8cfa35ddbdeac52850f6105684b23a82121636a892`
  - sole clause-source SHA is the same value
  - locked static metadata: `特殊`, printed cost `3`, base Power `3`, historical requirement `3`
  - F1 axis `REVERSE_EFFECT_RULE`
  - Phase-3 blocker `SPECIAL_EFFECT:reverse_effect_rule`

### Regular variant

All nine share printed-text SHA and sole clause-source SHA:

`b6c74ac37a50b671ded913dbc6ae6736f2057904fe4c02924d79f84971cebbdf`

- `servant.douman.skill.sc-douman-3` / `sc_douman_3`
- `servant.koyanskaya.skill.sc-koyanskaya-1` / `sc_koyanskaya_1`
- `servant.mechaeli.skill.sc-mechaeli-3` / `sc_mechaeli_3`
- `servant.meltryllis.skill.sc-meltryllis-3` / `sc_meltryllis_3`
- `servant.muramasa.skill.sc-muramasa-3` / `sc_muramasa_3`
- `servant.okita-alt.skill.sc-okita-alt-1` / `sc_okita_alt_1`
- `servant.passionlip.skill.sc-passionlip-1` / `sc_passionlip_1`
- `servant.sitonai.skill.sc-sitonai-3` / `sc_sitonai_3`
- `servant.taisui.skill.sc-taisui-1` / `sc_taisui_1`

Locked Reference static metadata is `cost 2 / base Power 3 / historical requirement 2` for all nine. Type label is `被动` for eight and `特殊` for Passionlip.

F1 normalization names the same printed rule differently for two rows (`ALTER_EGO_REVERSE_ATTRIBUTE_RULE` on Mecha Eli and `ATTRIBUTE_CHAIN_RULE + REVERSE_EFFECT_RULE` on Muramasa). B2 must not erase those evidence labels. The runtime acceptance is justified by the exact printed rule plus locked Reference's one shared handler: reverse a card that has an authored reversal effect; otherwise replace its current mutable attributes with any subset of 力量/迅捷/魔术.

## Locked Reference semantics

Reference `useAlterEgoTransform` establishes the exact target and state semantics:

1. source is a controller-owned active face-up skill card on the attack/board zone;
2. target is another controller-owned active face-up attack card;
3. target must have entered/joined the controller's attack this round;
4. if target definition has `hasReversalEffect=true`, the transform sets the physical card instance `reversed=true` and does not apply attribute overrides;
5. if target has no authored reversal effect, the controller chooses a unique subset of `力量`, `迅捷`, `魔术`, including the empty subset, and that set replaces the target's current attributes;
6. `revealsTrueNameOnReverse=true` reveals the target controller's servant when reversal is applied;
7. reversal / attribute overrides persist only until that physical card closes/leaves the board and are then cleared;
8. regular Alter Ego closes its source after successful transform;
9. Sion EX pays fixed 3 mana, does not close its source, and is once per round.

Reference `getCardInstanceAttributes` confirms that `attributeOverrides` replace the printed attribute set rather than adding to it. Reference reverse-aware handlers and rule modifiers read the physical card's `reversed` state, so the rebuilt runtime state must be observable by later authoring rather than a write-only marker.

## Current-engine event mapping

The rebuilt runtime already emits one trusted `on_card_played` event for every face-up card in a simultaneous play batch. Each event has:

- trusted server-generated stable event ID;
- `event.sourceCardId` equal to that exact just-played face-up card;
- `event.playerId` / `playedCards` from the authoritative play transaction.

FB2-13 must bind the transform target to `event.sourceCardId`. The client must never submit a card target ID for this handler. This is stricter and safer than the old payload while matching the printed `当你将一张牌放置入场时` trigger. The target must be revalidated as:

- not the Alter Ego source;
- same controller as the source;
- current `event.playerId` equals the source controller;
- event source appears face up in `event.playedCards`;
- current zone `attack_area`;
- current cardState active / face up;
- `playedRound === current round`.

A response must not open for another player's play, a face-down play, a support/field destination, stale prior-round cards, the source itself, or an event whose target identity no longer matches authority.

## Exact structural authoring contract

B2 may accept two identity-free structural variants only.

### Regular variant

- kind `optional_trigger`;
- phase `action`;
- trigger `on_card_played`;
- requires source state `active`;
- response window is optional / turn-order / decline-this-window;
- no mana cost and no explicit usage limit;
- transform the trusted triggering card;
- after successful transform, execute the already accepted `close_source_card` primitive on the source.

The source close is the natural use limiter. Decline performs neither transform nor close.

### EX variant

Same target/transform core, but:

- exact fixed controller `pay_mana 3` ability cost;
- source remains active after successful transform;
- exact limit `per_round / uses 1 / this_card`;
- no close-source effect.

The fixed cost must extend the already accepted fixed-controller-mana component only to this exact semantic route. FB2-13 does not broaden variable costs.

## Attribute choice interaction

No new transport command is allowed.

The existing `choose_target` command and `PendingDecision` string candidates are sufficient. For a triggering target **without** an authored reversal effect, open one narrow structured interaction whose candidates are exactly:

- `力量`
- `迅捷`
- `魔术`

with distinct selection count `0..3`. Empty selection is legal and means no mutable attributes.

For a target **with** `hasReversalEffect=true`, no attribute-choice interaction opens; successful response directly reverses the target.

The attribute interaction must be server-owned and must retain the trusted trigger event / target identity. On submission it must revalidate source, target, event provenance, current round, variant, and available mana before any mutation.

### Atomicity requirement

Generic `executeAbility` currently consumes costs/limits before effects. B2 must not reuse that order in a way that charges Sion before the attribute selection is committed.

For the no-reversal path:

1. resolving the response opens the non-cancellable structured attribute decision without paying mana, consuming the per-round use, closing source, or transforming target;
2. choosing attributes revalidates the frozen/trusted interaction state;
3. only then does one transaction perform the EX fixed 3-mana payment (when applicable), usage consumption (when applicable), target transform, and regular source close (when applicable).

For the authored-reversal path there is no second decision, so the same settlement happens atomically when the response is resolved.

A failed or stale settlement must mutate nothing.

## Generic card-instance transform state

FB2-13 is permitted to add generic instance-scoped runtime state, not identity-specific state:

- `reversed?: boolean`
- `attributeOverrides?: string[]`

These belong to the existing authoritative `abilityRuntime.cardState` for physical cards.

The implementation must provide one shared effective-attribute resolver:

- if `attributeOverrides` is defined, return that set;
- otherwise return printed `cardFace.attributes`.

Post-play runtime consumers that ask what attributes a physical card **currently has** must use this resolver, including target constraints / attribute-trigger checks and combat attack tags. Pre-play card classification, printed cost handling, and the play transaction's historical printed metadata remain definition-owned and must not be retroactively changed by a later transform.

The loader may recognize definition metadata:

- `cardFace.hasReversalEffect: true`
- `cardFace.revealsTrueNameOnReverse: true`

No printed-text parsing may infer those flags at runtime.

## Reverse-state observation

The new `reversed` state must not be write-only. FB2-13 may add the generic condition node `source_reversed` so future migrated reverse-side abilities can require the physical source's reverse state. Existing `not` composition is sufficient for the normal-side inverse; do not add identity-specific reverse checks.

The public/owner player view should expose `reversed` / `attributeOverrides` only as physical card state for cards whose current identity/state is already visible under existing projection rules. Do not reveal hidden card definitions through this state.

## Cleanup

Any existing runtime path that closes or moves a transformed physical card from board zones to a non-board zone must clear `reversed` and `attributeOverrides`. In particular:

- ordinary interpreter `moveCard`;
- resolution-dataflow `moveCardInstance`;
- accepted `close_source_card`.

Moving between board zones may retain the transform; leaving the board must not leak it into hand/deck/discard/skill/removed zones or a later replay.

## Fail-closed classifier boundary

The FB2-13 semantic classifier must recognize malformed near-matches and reject them before legacy fallback. At minimum reject:

- wrong phase/trigger/source-state;
- unsupported response-window shape;
- arbitrary client card targets;
- any mutable attribute outside the exact three-value domain;
- duplicate attribute selection;
- regular variant with mana cost / explicit per-round limit / missing close;
- EX variant with cost other than fixed controller 3 / missing once-per-round limit / added close;
- extra effects, creates, modifiers, lifecycle, bindings, arbitrary target selection, host directives, or identity/text fields.

The classifier may distinguish `regular` and `ex` structurally; it must never inspect the ten evidence IDs, owner names, skill names, or printed text.

## Required B2 verification

Focused tests must cover at least:

- exact regular and EX classifier acceptance plus malformed near-match fail-closed cases;
- trusted own face-up just-played target and all negative provenance cases;
- authored-reversal target sets `reversed=true`, no attribute override;
- `revealsTrueNameOnReverse` behavior;
- no-reversal target accepts all legal subset sizes, including empty, and replacement rather than additive attributes;
- effective attributes are observed by target constraint and combat tags;
- transform clears on close/non-board movement and does not leak after replay;
- regular variant closes source only after successful settlement;
- regular decline leaves source and target unchanged;
- EX pays exactly 3, stays active, once per round, decline pays/consumes nothing;
- insufficient EX mana exposes no usable response / fails atomically;
- no-reversal interaction pays/consumes/closes only after attribute choice, never before;
- replay/serialization retains a live transform and pending interaction safely;
- simultaneous play events bind to the exact event source, not another batch member;
- current accepted rules suites, deterministic generated-content hashes, standard full CI, identity/text audit, and diff check remain green.

## Scope / forbidden expansion

FB2-13 does **not** accept or implement:

- any of the ten canonical authoring cards;
- arbitrary card-copy/transform syntax;
- arbitrary attribute grant/removal systems beyond this exact replacement transform core;
- broad reverse-side skill packages;
- broad Trigger acceptance;
- arbitrary client-selected transform targets;
- character/card IDs in production runtime;
- printed-text parsing;
- changes to F1/taxonomy/KPI classification.

P3-FM07 remains blocked until B2 is independently accepted by P3-R37 and A synchronizes that acceptance. If accepted, the exact future migration batch is these ten `core.alter-ego-transform` identities; the accepted canonical overlap would move `91 -> 101 / 944` only after S migration and independent migration review.
