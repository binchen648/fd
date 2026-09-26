# P3-A FM09 Remaining-10 Dependency Planning

Date: 2026-09-18
Role: Codex A
Status: `SYNCHRONIZED`
Base: exact post-R47 acceptance synchronization `ee0c4a6d7bd771d7ca54c3ffc662225499c86c61`
Recovery-line accepted overlap at planning: `112/944` (`11.86%`)
Integrated-main accepted overlap: `111/944`

## Purpose

Freshly reassess the ten still-absent frozen FM09 provisioning targets after R47 accepted `master.ciel.skill.s2`. Historical downstream order is not acceptance authority. Select only the narrowest next generic prerequisite or direct single-target migration supported by the current accepted runtime.

Remaining exact targets:

1. `master.bazett.skill.s2`
2. `master.caules-yggdmillennia.skill.s2`
3. `master.caules-yggdmillennia.skill.s3`
4. `master.fujino.skill.s3`
5. `master.shiki-nanaya.skill.s2`
6. `master.shiki-ryougi.skill.s2`
7. `master.shiki-ryougi.skill.s3`
8. `master.shiki-tohno.skill.s2`
9. `master.zouken.skill.s3`
10. `master.zouken.skill.s4`

## Fresh current-lineage comparison

### Bazett s2

F1 requires a once-per-game reaction to the next same-battlefield player's Noble Phantasm use and defeats that event player. Current `event_played_card_has_attribute` is controller-owned-card scoped, while the available defeat effect is a specialized highest-power-opponents contract. At least opponent/event-player scope plus an exact target defeat path are missing. Not a direct migration.

### Caules s2

The battlefield deployment/activate-card half has accepted ingredients, but the workshop half still requires an exact deployment-to-non-battlefield trigger and a turn-scoped player defeat-ignore state. At least two generic gaps remain. Not narrowest.

### Caules s3

Required-additional play is accepted, but the card still needs persistent per-game unused-attribute declaration state and declared-attribute-filtered power-zero semantics. Existing `set_opponent_power_to_zero` is not that generic contract. Not narrowest.

### Fujino s3

Required-additional play is accepted, but the effect activates frozen `master.fujino.skill.s2`, which remains absent. Migrating s3 alone would create an unresolved transitive frozen dependency; absorbing s2 would violate exact single-target scope. Not next.

### Nanaya Shiki s2

Requires round-9/11 exact timing, injury-based VP formula, per-game captured-player memory, cross-player private deck-top inspection/discard/reorder, and related replacement cards. Broad multi-gap target.

### Ryougi Shiki s2

Required-additional play is accepted, but the card still needs paired-card play-cost coupling with s3 plus hidden deck-bottom printed-Power comparison and two-card discard settlement. Multi-gap.

### Ryougi Shiki s3

F1 is compact: required-additional play plus one action-phase interaction: inspect the hand of one player at the same battlefield and optionally shuffle one card back into its owner's deck.

FB2-16 already closes required-additional play. Current runtime already has player targets, hand zones, card movement, deterministic deck shuffle, PendingDecision continuation, MatchSession serialization, and owner-only interaction projection. The isolated missing contract is dynamic cross-player private hand inspection/selection:

- first bind one active player at the same battlefield as the controller;
- then snapshot that selected player's hand for the ability controller only;
- optionally select `0..1` hand card;
- if one is selected, return it to its owner's deck and shuffle that owner's deck;
- keep the inspected card identities invisible to unrelated observers;
- fail closed on stale/forged interaction state.

The F1 text says “一名与你位于同一战场的玩家” rather than “对手”, so the generic seam must not invent a `not_controller` requirement. It must implement the literal same-battlefield player scope and remain identity-free.

### Tohno Shiki s2

Requires VP play cost plus random engaged-opponent discard reveal and a cross-owner basic-card exchange involving hand/control zones. Multiple new interaction/resource semantics.

### Zouken s3

Requires command-seal replacement semantics in both gain and spend directions, variable X mana-to-power conversion, and a delayed same-round win reward. Multi-gap.

### Zouken s4

Current runtime already has `round_end`, `manaGainedThisRound`, movement, and battle-result data, but the exact card still requires a controlled current-round-mana-gained condition, selection of a loser from a won battle, up-to-3 cross-player mana drain/transfer, solo/recon fallback branching, and the movement action. This is more than one isolated prerequisite.

## Selected next dependency

Dispatch **P3-FB2-23-RECOVERY**: an identity-free same-battlefield private hand inspection / optional return-one-to-owner-deck interaction seam.

This is narrower than the other nine targets' outstanding dependencies and directly isolates the only missing non-append-only runtime contract for `master.shiki-ryougi.skill.s3`. FB2-23 itself adds no frozen identity and earns zero migration credit.

## Non-goals

FB2-23 must not:

- add `master.shiki-ryougi.skill.s3` or any production authoring/generated content;
- special-case Ryougi, card IDs, names, printed text, or Reference handlers;
- broaden generic visibility of other players' hands;
- expose inspected hand identities to observers;
- add arbitrary cross-player card movement or arbitrary target-owner expressions outside the exact seam;
- change MatchSession source, play-batch rules, required-additional semantics, taxonomy/KPI/F1/Reference, or any frozen migration accounting;
- start FM09/FM10 or merge/retarget stacked PRs.

Accepted recovery-line overlap remains `112/944`; integrated main remains `111/944`.
