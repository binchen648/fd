# P3-B Goetia Owner Readiness Complete Gap Set

Date: 2026-10-08
Task: `P3-B-GOETIA-OWNER-READINESS-CAPABILITY`
Branch: `codex/b-p3-goetia-owner-readiness-complete-gap-set`
Exact Base: `d93845a5b4bb8be08a540d96759bdb754756765b`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Classification: zero-credit owner-local readiness / capability closure

## Frozen owner scope

Goetia / 盖提亚 has exactly three frozen identities:

- `master.goetia.skill.ascension` — 冠位时间神殿
- `master.goetia.skill.s1` — 集体意识
- `master.goetia.skill.s2` — 魔神柱

At exact Base, no canonical Goetia authoring consumer is materialized and this readiness transaction contains no `data/authoring/**`, `data/packs/**`, or `data/phase3/**` delta. Therefore readiness remains permanently zero migration credit and strict accounting stays `267/944`, remaining `677`.

## Locked Reference capability gap

The locked Reference requires one linked physical auxiliary-suite authority that can safely support, without owner-name routing:

- game-start creation of exactly seven linked physical auxiliary attacks and replacement of ordinary Command Seals with zero;
- round-end upkeep: skip after a battle win or an accepted member effect, otherwise remove one active auxiliary; eliminate the controller if none remains;
- Baal-style append-only group behavior, same-batch cost reduction, and immutable printed Power;
- Phenex action: remove another active member and gain six mana;
- Forneus combat action: close another controlled active card, shuffle the source, play one legal hand card with normal cost, then permit that card's Action ability in combat;
- Flauros preparation/outpost action: shuffle source and grant +5 total Power for the round;
- Zepar loss response: shuffle source, gain 2 VP, and skip that round's upkeep removal;
- Raum battle-end return at recon/scouting plus Action discard from hand/field to move to any enabled location;
- Barbatos Command-Seal substitution at 4 mana per Seal operation and exact Action-phase round play exceptions;
- ascension activation into the attack area, residual persistence, +4 Power on newly played non-immutable suite members, and preparation/outpost 1-mana discard-hand/draw-three;
- authenticated pending-decision, round-power, combat-action-grant, and ascension state provenance across restore.

## Implemented identity-free authority

`packages/rules/src/ability/linked-auxiliary-suite-capability.ts` adds one exact privileged semantic family:
`linked_auxiliary_suite`.

Accepted operations:
- `setup`
- `mark_win`
- `round_end_upkeep`
- `append_cost_rule`
- `power_immutable`
- `remove_other_for_mana`
- `shuffle_close_play`
- `shuffle_round_power`
- `loss_reward`
- `battle_end_return`
- `discard_move`
- `seal_mana_substitution`
- `round_play_exceptions`
- `ascension_activate`
- `ascension_play_power`
- `ascension_redraw`

Runtime integration is identity-free across loader gating, interpreter resolution, required-additional-play classification, Power calculation, Command-Seal resource substitution, round play exceptions, private pending decisions, round-power provenance, combat Action grants, MatchSession restore, and public exports.

The loader continues to fail closed:
- `linked_auxiliary_suite` is recognized as a privileged effect only through the exact whole-ability gateway;
- its internal `op` is not treated as a generic formula operator;
- only the explicitly required structural fields are admitted by the generic mechanic scanner;
- malformed or near-shaped abilities remain blocked by `isAcceptedLinkedAuxiliarySuiteAbility`.

## Readiness findings closed during implementation

Two real readiness defects were found while mechanically comparing the dirty implementation to the locked Reference:

1. `round_play_exceptions` was initially grouped with preparation/outpost operations. The Reference Barbatos effect is an **Action-phase** ability. The accepted validator now requires exactly `action + controller_action_window`; Flauros and ascension redraw remain exactly preparation/outpost.
2. Response operations `loss_reward` and `battle_end_return` require exact `responseWindow.opens`, but the initial generic response-window gate rejected any `opens` field. The gate now admits only `opens/order/passBehavior`, while each response op still requires its exact trigger/open pair.

Focused regression explicitly rejects the former wrong shapes.

## Verification

Focused Goetia readiness:
- `p3-goetia-owner-readiness-complete-gap-set.test.ts`: `4/4 PASS`
- exact op matrix/gateway boundaries;
- seven-member initialization, zero Seals, Baal/Barbatos authority, ascension +4, forged restore rejection;
- Phenex remove-for-mana and Action-phase Barbatos exception;
- battle-win upkeep skip and no-member elimination.

Selected affected regressions: `113/113 PASS` across seven files:
- Goetia readiness: `4/4`
- required additional play: `8/8`
- Ruler/Command-Seal subsystem: `13/13`
- master ascension unlock: `5/5`
- complex skills: `38/38`
- MatchSession gameplay regressions: `11/11`
- MatchSession: `34/34`

Other gates:
- `npm run typecheck`: PASS
- `npm run content:validate`: PASS — `24 masters / 19 servants / 20 events / 0 blocking issues`
- `npm run verify:generated-content`: PASS
  - content `a2fae3521b495f0e577a0cef558ef3f4c6c134156c13013e627db76f518f07e9`
  - fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`
  - evidence `a6f47f6b2ed85aa82a7322dcecefcb890db86a2b265854aff5ae379cf03cda88`
- `git diff --check`: PASS
- external Phase-3 coverage:
  - `archives=128 cards=295 abilities=517 compiledCards=233 compiledCharacters=43 blockingIssues=0`
  - `newRuntimeSemanticRouted=22 legacyExecuteAbility=3 legacyResolveEffect=165 dualRuntime=0 pilotAllowlist=0 notClassifiable=327 taxonomyWarnings=338`
- external automation audit:
  - `legacyResolveEffect=165 legacyExecuteAbility=3 notClassifiable=327 promotionFindings=20`
- external scratch directory:
  - `E:\Codex\FD\.fd-runner-review-evidence\formal-goetia-readiness-d93845a5-nonce112e95c077f815ee099968484eaeba3f`

No readiness check is represented as migration credit. No Goetia consumer definition or pack registration is introduced.

## Formal gate

Freeze one zero-credit readiness Candidate from exact Base `d93845a5b4bb8be08a540d96759bdb754756765b`, push one PR, obtain one fresh exact Base/Candidate independent readiness review, then perform zero-credit acceptance synchronization.

Only after readiness acceptance may FORMAL build one owner-complete Goetia consumer Candidate containing all three frozen identities together.

Strict accounting:
- before readiness: `267/944`, remaining `677`;
- readiness acceptance: still `267/944`, remaining `677`;
- maximum later lawful Goetia owner increment after fresh `MIGRATION_ACCEPTED` + A-sync: exactly `+3`, yielding `270/944`, remaining `674`.
