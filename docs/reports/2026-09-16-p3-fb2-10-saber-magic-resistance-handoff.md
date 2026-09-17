# P3-FB2-10 Saber Magic Resistance Runtime Handoff — 2026-09-16

Owner: Codex A
Status: READY
Base / accepted migration lineage: R28 `09ddfaee5ea54226d232c85d80db32a7b04b186e`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Why this is next

Fresh post-FM02 scan of the frozen 944-ID inventory against current canonical authoring reports:

- canonical F1 authoring overlap: `49 / 944`;
- remaining absent: `895 / 944`;
- remaining block-free `READY_GENERIC_EXTENSION`: `225`;
- exact semantic groups at size >=10: one group, size `10`;
- required capabilities on that group: `GENERIC_POWER + GENERIC_RESOURCE_NUMERIC`;
- Reference handler for all ten: `core.saber-magic-resistance`.

The ten rows all normalize to three operations:

1. `GAIN_VP`: if the controller played the highest tracked Noble Phantasm attack this round, gain 1 VP;
2. `GAIN_VP`: if that highest tracked Noble Phantasm cost is >=4, gain one additional VP;
3. `SET_OPPONENT_ATTRIBUTE_POWER`: same-battlefield engaged opponent Magic-attribute attack Power becomes 0.

The first two operations are not new gaps. P3-B18/R12 and P3-B19/R13 independently accepted the exact two optional post-result typed VP semantics. Therefore FB2-10 must not create another Resource or Trigger route. The only missing acceptance dependency is the third Power operation.

## Existing infrastructure and authorization boundary

Current runtime already has the necessary lower-level pieces:

- phase actions are exposed once per round through the generic `usedAbilities` ownership;
- `installOngoing` installs and de-duplicates rule modifiers, and `this_round` expires at the round boundary;
- `calculateCardPower` applies active ongoing modifiers, supports `operation=set`, same-battlefield opponent controller scope, attack-card object scope, attribute constraints, and calculation-line provenance;
- current canonical Artoria Alter authoring contains the exact structured Magic Resistance modifier and historical regression coverage demonstrates intended evaluation.

However, P3-TO-15 is still specification-only and explicitly records `Runtime authorization: none`. Historical execution through the generic/legacy ongoing path is not an accepted broad Power contract. FB2-10 therefore adds only a narrow structural classifier/accepted route plus a same-family fail-closed guard. No new Power primitive is expected.

## Exact FB2-10 semantic

Accept only an `AuthoringAbility` with all of the following:

- `kind=phase_action`;
- `activation.phase=combat`;
- `activation.opens=controller_combat_action_window`;
- `activation.requiresSourceState=active`;
- zero conditions, targets, costs, effects, creates;
- empty response window, limit, visibility, and top-level lifecycle;
- exactly one rule modifier with:
  - `type=combat_power_modifier`;
  - `operation=set`;
  - `rule=attack.currentPower`;
  - `value=0`;
  - scope `controller=engaged_opponents_same_battlefield`;
  - scope `object=attack_card`;
  - exactly one constraint `{ type: has_attribute, attribute: 魔术 }`;
  - modifier lifecycle `{ duration: this_round }`;
- no extra modifier fields that broaden target/control/value/lifecycle semantics.

The classifier must be identity-free. A renamed ability/card with this exact structure must classify; a frozen F1 ID with the wrong structure must not.

## Required behavior

1. Exact shape becomes a dedicated accepted route before the generic `resolveEffect/installOngoing` fallback.
2. Malformed same-family Power candidates fail closed before generic modifier installation.
3. Source must be active and the phase must be combat.
4. Existing phase-action usage state must expose the action at most once per round.
5. On activation, a same-battlefield opponent Magic attack computes to exactly 0 Power.
6. Controller-owned attacks, non-Magic opponent attacks, and opponent Magic attacks outside the same battlefield remain unchanged.
7. The modifier expires at the normal next-round boundary.
8. Power trace/calculation lines remain deterministic and show the modifier application.
9. B18/B19 post-result optional VP routes remain unchanged and green.
10. No character/card/ability identity or printed-text routing.

## Exact future FM03 evidence membership

These ten F1 identities are evidence membership only for B2. B2 must not migrate them:

- `servant.altera.skill.sc-altera-3`
- `servant.arthur.skill.sc-arthur-3`
- `servant.bedivere.skill.sc-bedivere-1`
- `servant.charlemagne.skill.sc-charlemagne-3`
- `servant.gawain.skill.sc-gawain-3`
- `servant.lakshmibai.skill.sc-lakshmibai-3`
- `servant.mordred.skill.sc-mordred-3`
- `servant.musashi.skill.sc-musashi-3`
- `servant.saber.skill.sc-saber-1`
- `servant.saitou.skill.sc-saitou-1`

All ten are absent from canonical authoring at this handoff, block-free, and `READY_GENERIC_EXTENSION`. Their frozen overlays all contain the same normalized three-operation set.

## B2 test floor

Focused regression must prove at least:

- exact classifier positive after ability-ID rename;
- negatives for wrong kind/phase/window/source-state/modifier type/operation/rule/controller scope/object/constraint attribute/value/duration and any extra effect/modifier;
- combat legal action only while active; one activation per round;
- same-battlefield opponent Magic Power -> 0 with calculation trace;
- own/non-Magic/other-battlefield negatives;
- next-round expiry;
- malformed same-family direct execution rejects atomically before generic fallback;
- B18 and B19 regressions remain green.

Then run typecheck, all rules regressions, full root CI, deterministic generated-content verification, identity/text audit, and diff check.

## Explicit non-promotion

FB2-10 does not accept broad TO15, generic Power set/add, arbitrary opponent scopes, target selection, attribute replacement, third-party Power changes, persistent/while-active Power lifecycle, or any F1 migration. FM03 remains blocked until R29 acceptance plus fresh A dependency reconciliation.
