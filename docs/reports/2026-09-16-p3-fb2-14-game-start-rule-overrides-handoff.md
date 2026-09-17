# P3-FB2-14 Game-Start Persistent Rule Overrides — A Handoff

Date: 2026-09-16
Owner: Codex A
Status: `READY`
Base: R38-accepted FM07 lineage `f7666f48f7eb00baeadb63f24fb56fc39991f372`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Accepted canonical overlap at dispatch: `101/944`
Accepted material coverage: `90 archives / 123 cards / 222 abilities`, raw `22/3/127/0/70/124`

## Why this task exists

After FM07, `843/944` frozen identities remain outside accepted canonical authoring. Fresh grouping finds no identical-text family >=10 and no block-free generic-capability group >=10. The next useful reusable seam is the locked Reference `core.game-start-rule-flags` family.

That Reference handler has twelve block-free F1 rows, but A does **not** batch all twelve mechanically. The exact future FM08 batch is limited to ten self-contained persistent rules whose effects can be consumed immediately by generic rebuilt systems. Two rows are explicitly excluded:

- `master.leonardo.skill.s1a`: F1 freezes both `event_card_victory_points:add` **and** `event_card_mana:add`. Current event runtime has no single authoritative structured event-mana reward path, while locked Reference only consumes the VP half. FB2-14 must not claim a half implementation merely to preserve batch size.
- `master.ophelia.skill.s1a`: only changes total uses of a separate Delayed Mystic Eye skill that is not yet canonical. A write-only use-count flag is not an independently executable migration contract.

The tenth selected member is instead `master.fiore.skill.s4`, whose two printed rules are self-contained and have authoritative generic consumers in combat total-power and physical card-power calculation.

## Frozen future FM08 membership

All ten selected identities are F1 `CONTRACT_MAPPED`, `blockedBy=[]`, currently `0/10` canonical, and locked Reference handler `core.game-start-rule-flags`.

| ID | Frozen source SHA | Persistent rule semantics |
|---|---|---|
| `master.bazett.skill.s1b` | `9847f0953309d542a783f1553153ccbf2bf08a3c008674caadd067ef2b9e7071` | logical first-day total combat Power -2 |
| `master.caules.skill.s1a` | `16dc09cc37b8a95665d4fb5301e6048b0be422af19b9836d3fff07d9ef7e3c32` | each non-climax Situation mana grant capped at 1 |
| `master.fiore.skill.s2` | `e9646624a773a5a21ca08c3d63e072da56126dad075d4842d44faac9a95ec6e9` | controller cannot move in own Action or Combat phase |
| `master.fiore.skill.s3` | `01a78c3d1650a32f187bf1b292e15807727370e11928021d7b91e7125ce3c2ac` | total positive mana gain per round capped at 2 regular / 4 climax |
| `master.fiore.skill.s4` | `b750f78e112432917ec6c612124040ca6f3c9f9a538943c2daeaea78e536364c` | -2 total combat Power if another battle participant has lower VP; if Situation forbids Noble Phantasm, controller master-skill card Power is final-locked at 0 |
| `master.irisviel.skill.s1` | `d880afd3807b56ddd0ae4c2ad35829fc7991428aee15438515ade2ade66bf9fd` | command spells use Advance/outpost timing instead of Action timing |
| `master.peperoncino.skill.s1a` | `24da87d334a23689f9ef2d6607cd74ec0e9bfde162a49835f7e453afcd282cb2` | viewer may inspect opponents’ discard piles |
| `master.sieg.skill.s1` | `215e0d96a9ee5e00825eb43ceda139f008e0047c9b0195e733f96eaf89d0c089` | at controller mana >=11, regular attack-card allowance +1 |
| `master.waver.skill.s1` | `c4004b02a61eb2cefa01526f174f4fb7815644f4267735020b2507177797058f` | viewer may inspect face-down event placements |
| `master.zouken.skill.s5` | `1bfe9fda4911dd95b0e6ef1462140b1d7e20cdacdd03df524fae374509bc668f` | Situation-origin Noble Phantasm play forbids do not apply to controller |

Explicit non-members despite the same Reference setup handler:

- `master.leonardo.skill.s1a` — excluded for incomplete event-mana infrastructure as above;
- `master.ophelia.skill.s1a` — excluded because its only consumer is a separate not-yet-canonical skill;
- every blocked `core.game-start-rule-flags` row — excluded;
- Wodime / game-start-add-skill / arbitrary special handlers — excluded.

## Exact authoring/runtime contract

FB2-14 owns **one** identity-free setup contract: a forced `game_start` ability installs one or more typed, whitelisted, controller-scoped persistent rule overrides. It is not an arbitrary key/value flag bag.

Canonical structural envelope:

```text
kind = forced_trigger
activation.trigger = game_start
conditions = []
targets = []
cost = []
creates = []
responseWindow = {}
limit = {}
visibility = {}
execution.mode = automatic
effects = one-or-more install_rule_override(controller, exact whitelisted rule schema)
```

A classifier must fail closed on wrong kind/trigger, target/cost/create/response, arbitrary rule names, extra semantic fields, invalid types/ranges, identity-dependent selectors, or text-driven routing.

Whitelisted rule schemas for this contract only:

1. `first_logical_day_total_power_adjustment(value=-2)`
2. `non_climax_situation_mana_gain_cap(value=1)`
3. `lock_controller_movement_in_own_action_and_combat(enabled=true)`
4. `round_total_mana_gain_cap(regular=2, climax=4)`
5. `total_power_adjustment_if_other_battle_participant_lower_vp(value=-2)`
6. `controller_master_skill_power_lock_if_situation_forbids(attribute=宝具, value=0)`
7. `command_spell_phase_override(phase=advance)`
8. `view_opponent_discard(enabled=true)`
9. `extra_attack_play_allowance_if_mana_at_least(threshold=11, amount=1)`
10. `view_face_down_events(enabled=true)`
11. `ignore_situation_play_forbid_attribute(attribute=宝具)`

Fiore s4 legitimately installs schemas 5 and 6 from the same forced setup ability. No other selected row installs more than one logical rule except the composite regular/climax values in schema 4.

## State authority

Extend existing `RuleOverrideState`; do **not** introduce a parallel `playerFlags` dictionary.

RuleOverride state must be typed per player and serializable/replay-safe. Dynamic per-round counters (for mana gained this round) belong in an authoritative runtime ledger, not inside immutable authoring text and not in a character-keyed table.

`processAbilityEvent(..., type=game_start)` is the existing setup authority and MatchSession already emits it. Same event replay remains idempotent through the existing processed-event authority.

## Consumer requirements

### Combat Power

- Bazett-shaped rule: participant total Power gets -2 only on logical day 1. Default logical day is the real round number. If a future independently accepted Time Loop contract supplies a logical-day override, the consumer must be capable of reading that generic override rather than hardcoding a character ID.
- Fiore s4 lower-VP rule: if any other non-eliminated participant in that same battle has lower VP than controller, apply -2 to controller total Power.
- Fiore s4 Situation rule: when the active Situation forbids `宝具`, controller-owned `master_skill` physical card Power is **final** 0; later additive/set modifiers may not raise it. The lock is about card Power, not total-player Power.

### Situation mana

- Caules-shaped cap applies only to each printed non-climax Situation mana grant. It must not cap deployment rewards, ability gains, event gains, or set-mana effects.
- Climax Situation grants are unaffected by this rule.

### Round total mana gain cap

Fiore s3 requires one shared positive-mana grant authority/ledger:

- regular round total accepted gain <=2;
- climax round total accepted gain <=4;
- count only successful positive mana gains;
- payment/loss and `set_mana` are not gains;
- explicit future unpreventable restoration remains outside the cap unless separately accepted;
- absolute storage caps and existing gain blockers still apply;
- reset/rotate ledger at authoritative round transition;
- if requested gain exceeds remaining budget, apply only the remaining legal amount and preserve deterministic reporting of requested/applied/overflow values.

Do not implement this by character checks at each mana write site. Centralize the rule in a shared grant authority and route current real gain paths through it.

### Movement

The movement lock is controller-scoped and applies during the controller’s own Action and Combat phases. It must affect normal movement and ordinary card-effect movement that respects card movement restrictions, while retaining any separately accepted explicit “ignore card movement restrictions” authority. It must not lock Preparation/Advance movement by implication.

### Command spell timing

Irisviel-shaped override changes generated command-spell phase actions from Action to current canonical `advance` (Reference `outpost`). It replaces the normal Action window; it does not create a second legal timing. Command-spell effects, seal costs, and other legality remain unchanged.

### Extra attack allowance

At controller mana >=11, add exactly one to the existing regular attack-card allowance. Do not change mana costs or reinterpret non-attack support plays. Dropping below threshold removes the extra allowance prospectively; already resolved plays are not retroactively undone.

### Situation Noble Phantasm waiver

Only `modeState.cardPlayForbids` originating from `sourceType=situation` and matching attribute `宝具` are waived. Event-, skill-, or other-source forbids remain effective.

### Visibility / privacy

- Ordinary viewers must **not** receive definition IDs for `hidden_until_trigger` event placements. The current MatchSession zone projection exposes those IDs and FB2-14 must correct that generic privacy boundary as part of Waver’s accepted visibility consumer.
- A controller with `view_face_down_events` receives real IDs for hidden event placements.
- A controller with `view_opponent_discard` receives opponents’ discard card IDs through an explicit viewer-scoped projection. Ordinary viewers continue to receive only their own discard pile; no hand/deck/private-zone visibility is broadened.
- Server authoritative state is unchanged by projection privileges.

## Explicit exclusions

FB2-14 does **not** accept:

- arbitrary string player flags;
- arbitrary game-start modifiers;
- Leonardo event reward semantics;
- Ophelia Delayed Mystic Eye use-count semantics;
- Fiore Transcend state machine or enhanced temporary skill creation;
- broad Visibility;
- broad Modifier or Lifecycle;
- broad Command Spell timing customization;
- Wodime Lostbelt subsystem;
- identity/name/text routing;
- authoring migration.

## Required B2 evidence

Focused tests must prove at minimum:

1. exact classifier positives for all eleven whitelisted semantic schemas and negatives for unknown/wrong-valued rules;
2. one renamed synthetic setup source proving identity-independence;
3. game-start installs controller-scoped overrides and duplicate event replay is idempotent;
4. Bazett logical-day and Fiore lower-VP total-Power effects;
5. Fiore card-Power final lock at 0 only under Situation Noble Phantasm forbid;
6. Caules non-climax Situation mana cap without affecting climax/other mana gains;
7. Fiore 2/4 round gain budget across multiple independent gain sources, overflow, round reset, set/pay exclusion;
8. movement lock windows and explicit bypass preservation;
9. Irisviel advance-only command-spell timing;
10. Sieg threshold crossing and attack allowance;
11. Zouken waiver only for Situation-origin `宝具` forbid;
12. default hidden-event projection does not leak IDs; Waver privilege reveals only those event IDs;
13. Peperoncino privilege exposes opponent discard but not hand/deck/private state;
14. serialize/restore or replay evidence proving overrides/ledgers stay authoritative;
15. production identity/text search = 0 and authoring diff = 0.

Run typecheck, focused/high-risk regressions, rules regression/core, content validation, deterministic generated-content verification, standard full CI, coverage, and diff check. Runtime-only coverage must not manufacture FM08 migration credit.

## Reviewer / migration gate

R39 must independently review the exact B2 candidate and may not implement fixes. Only after R39 `GATE_A_B_CANDIDATE_ACCEPTED` plus fresh A synchronization may FM08 become READY.

Future FM08 exact selected batch is the ten IDs in this handoff. It starts at `0/10` canonical on accepted overlap `101/944`. No `111/944` accepted credit may be taken until S migration, A material synchronization, and independent migration review all succeed.
