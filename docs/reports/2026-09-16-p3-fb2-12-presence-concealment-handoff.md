# P3-FB2-12 Presence Concealment Post-Power Assassination Handoff - 2026-09-16

Owner: Codex A
Status: READY
Base / accepted migration lineage: R34 `0470cc2f7b8124fb1247695a13bcb34e80b26703`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Why this is next

Fresh post-FM05 scan leaves `865 / 944` frozen F1 identities absent from canonical authoring. The largest remaining identical-text family at normal F4 size is exactly twelve Presence Concealment cards; the next repeated family is Alter Ego at nine and therefore below the normal F4 minimum.

All twelve Presence rows are top-level `CONTRACT_MAPPED` with inventory `blockedBy=[]`, share Reference handler `core.presence-concealment`, and normalize to the single semantic axis `PRESENCE_CONCEALMENT_ASSASSINATION_RULE`. The runtime-dispatch layer still carries `phase3.blockedBy=[SPECIAL_EFFECT:presence_concealment_assassination_rule]`, which is exactly the gap assigned to FB2-12. Current canonical authoring contains `0/12`.

Frozen F1 source text SHA for all twelve is:

`29b3f6c71d8bc5eb6f004d930e5b753f44ee766fb2e47ea6b9f0d89f5fa9643f`

The F1 source-evidence overlay does not separately materialize per-line clause hashes, but the frozen F1 inventory does preserve the mechanically split clause sources. All twelve members share the same four clause SHAs, in printed order: `ee2d737d979d2141319a55ff72d275847a90be89e5173c3f5030e2083d4dc4cb`, `1e518f04fe63700d7a456ca83de546eb681dd9993f483be7598e5bdac7830b25`, `0484d7c0b9f4cef66623fdfe67831240d883b04f3203f2acc7e2d6151c2a8217`, `1f105508aace520b9a8b6703d50633c174f754856c10c4040b05570cfca0b871`. Review must lock both the complete source-text SHA and these inventory clause-source SHAs.

## Locked Reference semantics

Reference implements Presence Concealment as an optional combat response after authoritative Power is frozen and before combat settlement/scoring:

- combat step: `post-power-response`;
- source Presence card must be active and face up;
- at least three physical combat participants;
- controller must be below the highest opponent Power tier;
- no non-highest opponent may have Power strictly above the controller; equivalently the controller is in the strict second Power tier, ties at the controller's tier are allowed;
- on use, every opponent in the highest Power tier receives the [defeat] effect;
- all highest-tier ties are affected, with no target choice;
- response is optional and may be declined;
- usage is once per round and is consumed only when used;
- responder order follows turn order;
- the Power snapshot is frozen; responses do not recalculate card Power;
- players successfully affected by [defeat] are excluded before winner selection, so winner/VP/military settlement must use the post-response eligible set;
- [defeat] is not player elimination.

Reference uses its authoritative `applyDefeatEffect` boundary. Defeat-ignore effects may cause an attempted target to remain undefeated and therefore still eligible to win.

## Current-runtime gap

Current product runtime resolves each battlefield into a `BattleResultState`, then immediately runs `applyBattleScoring`, and only afterward emits `after_battle_result_determined` events. That post-scoring gateway is semantically too late for Presence Concealment because Presence can change the winner before rewards and military settlement.

Current runtime already provides the pieces that FB2-12 must reuse:

- authoritative frozen `participantBreakdowns[].effectivePower` in each battle result;
- one canonical winner/reward/military implementation in `core/combat-resolver.ts`;
- generic trusted backend events with stable ids;
- response windows, decline/resolve commands, per-round usage, active-source checks, processed-event dedupe, and priority-seat turn ordering;
- battle phase re-entry stops while response windows are pending;
- current Basic Luck battle-loss-ignore authority via `ignoresBattleLossEffects`.

The old `packages/rules/src/phases/battle-phase.ts` statusEffects-based path is not imported by the current product runtime and must not be revived.

## Exact FB2-12 contract

Implement exactly one identity-free Presence Concealment semantic and the minimum pre-scoring bridge needed for it.

### Trusted pre-scoring event

After authoritative battlefield Power breakdowns are frozen, but before any `applyBattleScoring`, produce one stable backend-only event per resolved battlefield. It must carry only trusted facts needed by this semantic: battle/result identity, battlefield, ordered physical participant ids, and their frozen effective Powers. Client commands must not be able to fabricate or override these facts.

The event must be processed/deduped before scoring. If it opens a response window, battle phase remains pending and no VP/military scoring or post-scoring battle-result event may occur until the window queue is exhausted.

### Exact authoring shape

B2 may add the minimum trigger/condition/effect vocabulary necessary to express this one semantic, but the accepted classifier must be structural and narrow. A renamed card/ability with the exact structure must classify; a frozen F1 identity with a different structure must not.

The semantic must encode exactly:

- optional combat response to the trusted post-Power/pre-scoring event;
- source state active;
- no player/card/location target selection;
- condition: source controller is a physical participant, participant count >=3, controller is strict second Power tier under the frozen snapshot;
- effect: apply battle-local defeat to every highest-Power opponent derived from the same frozen snapshot;
- once per round;
- no extra costs, creates, lifecycle, modifiers, arbitrary formulas, or host directives.

Malformed same-family near-matches must fail closed before generic fallback.

### Defeat and recomputation boundary

Do not add a global PlayerState `defeated` flag and do not use elimination. The current product does not model ordinary battle defeat through a persistent player-state boolean.

Record only the exact battle-local successful Presence defeat facts needed to settle the current `BattleResultState`. Reuse/refactor the existing combat-result calculation so the result is rebuilt from the already frozen `participantBreakdowns`; do not recalculate attack/card Power and do not create a second winner/reward calculator.

After a successful response:

- derive every highest-Power opponent from the frozen snapshot;
- for each target, apply the current authoritative defeat-ignore rule at that battlefield; an ignored [defeat] does not remove that player from winner eligibility;
- successfully defeated targets become ineligible for winner selection for this battle;
- recompute `winnerPlayerIds`, tie state, margin, VP reward/adjustments, military adjustments, and battle-loss suppression using the same existing combat-resolver rules and the unchanged frozen breakdowns;
- subsequent post-scoring events must be generated only from the final recomputed battle result;
- repeated/replayed backend event ids and repeated response commands must not double-apply or double-score.

If multiple controllers are eligible from the same frozen snapshot, preserve current turn-order response-window sequencing. A prior response may already have defeated some derived targets; later identical applications must be deterministic/idempotent rather than recomputing Power.

## Exact future FM06 evidence membership

These are evidence membership only. B2 must not migrate authoring:

- `servant.corday.skill.sc-corday-1`
- `servant.danzou.skill.sc-danzou-3`
- `servant.hassan.skill.sc-hassan-1`
- `servant.hassanhf.skill.sc-hassanhf-3`
- `servant.hassanser.skill.sc-hassanser-1`
- `servant.izou.skill.sc-izou-3`
- `servant.jekyll.skill.sc-jekyll-3`
- `servant.kama.skill.sc-kama-3`
- `servant.kiritsugu.skill.sc-kiritsugu-1`
- `servant.kotarou.skill.sc-kotarou-1`
- `servant.semiramis.skill.sc-semiramis-1`
- `servant.stheno.skill.sc-stheno-1`

Locked Reference card metadata is uniform for all twelve selected skill cards: type `迅捷`, cost `3`, historical requirement `3`, base Power `4`. Owner metadata must remain source-defined; notably `servant.kiritsugu` has Reference owner class `Master`, while the other selected owners are Assassin.

Future migration must use the final canonical skill-zone 8-mana rule; Reference requirement 3 remains historical evidence metadata, consistent with prior F4 skill migrations.

## Required B2 evidence

Focused regression must prove at least:

1. renamed-id exact classifier positive plus fail-closed near-matches for timing/window/source-state/participant threshold/strict-second condition/effect/limit and extra semantics;
2. trusted pre-scoring event opens no response with 0-2 participants, controller at top tier, or an intermediate non-highest opponent above the controller;
3. exact positive with controller strict second and at least three participants;
4. all tied highest opponents are derived automatically, no target choice;
5. decline leaves the original battle result/scoring outcome unchanged and does not consume once-per-round usage;
6. resolve excludes successfully defeated highest targets before scoring and recomputes winner/VP/military from frozen breakdowns;
7. Basic Luck/accepted defeat-ignore on a highest target leaves that target winner-eligible;
8. response order follows current turn order when more than one controller is eligible;
9. no scoring/post-scoring event occurs while a pre-scoring response remains pending;
10. stable event replay and command replay cannot double-apply or double-score;
11. existing battle-result Trigger Gateway, B18/B19, B21, Magic Resistance, Return Silence, Basic Luck, battle winner conformance, and MatchSession paths remain green;
12. typecheck, all rules regressions, full root CI, deterministic generated-content verification, identity/text audit, and diff check.

## Explicit non-promotion

FB2-12 does not accept broad Trigger Gateway, generic post-Power hooks, generic defeat/elimination effects, generic Target Selection, arbitrary battle-result rewriting, a persistent defeated PlayerState, a second combat calculator, printed-text routing, identity routing, Presence variants outside the exact twelve-card family, or any FM06 authoring migration.

Completion status allowed:

- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`
