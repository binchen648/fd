# Phase 3 Full-Roster Source Evidence — Chaos Scrambled Seals R1

- Date: 2026-09-15
- Role: Codex S
- Base accepted checkpoint: `52683b70a04714b6439ee7afb785ab69fc981d11`
- Branch: `codex/s-p3-source-evidence-chaos-s17-r1`
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: source-evidence normalization for `master.chaos.skill.s17` only; no runtime implementation or migration acceptance

## Source evidence

The original Chaos source-evidence intake left `master.chaos.skill.s17` blocked because the permitted Fate/Domination Wiki page did not supply the complete four-option Scrambled Seals text. The developer-version source now supplies the full card text, and that text exactly matches the locked Reference printed text.

```text
source document=Fate_Domination-开发版/data_masters.js
locator=m_chaos.skills[s17]#line=96
source file SHA-256=c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825
source/reference text SHA-256=789bd74e9c49c2089eec74f3a7cf0a8c42ce0a15577252004d2f0704dd18d596
sourceText mismatch=0
Reference printedText mismatch=0
```

This evidence is lower-priority than original English card text, but it is an allowed development-text source under the project source order and is hash/locator locked. The earlier incomplete Wiki evidence is not used to invent the missing options.

## Structured semantics

Scrambled Seals is normalized as one once-per-game Action choice envelope plus one passive Beast-cost reminder.

The Action choice has exactly four options:

1. Reuse The 666 / Beast King's Nest Outpost effect once during Action. This remains reviewed-special through structural `ABILITY_REUSE_RULE` rather than pretending an existing runtime contract can safely call another phase action.
2. Gain 2 mana. The structured effect does **not** add a second explicit Beast draw. Normal The 666 mana-gain triggering is preserved, so this option produces the printed parenthetical Beast draw without double-drawing.
3. If the controller wins this round, gain 2 VP. The reward is explicitly scoped to `this_round` so it cannot remain pending across rounds when no combat occurs.
4. Move to one adjacent location.

The card's `<每局游戏限一次>` limit is attached directly to the four-option Action ability rather than modeled as a disconnected passive.

The parenthetical Beast-cost reminder is represented as a rule modifier: Beasts have no mana payment and their printed cost is the number of Beasts that must be discarded. It is not treated as a second action or draw effect.

## Generic capability mapping

`ABILITY_REUSE_RULE` is added to the structural reviewed-special effect set. A synthetic identity-free regression verifies that any structured ability reuse receives `REVIEWED_SPECIAL_HANDLER`; there is no Chaos/s17 identity branch in the generic mapper or normalizer.

The generated s17 dependency graph exposes ordinary needs separately:

```text
GENERIC_BATTLE_INTEGRATION
GENERIC_CONDITION_EVALUATION
GENERIC_LIFECYCLE_POLICY
GENERIC_MODIFIER
GENERIC_MOVEMENT
GENERIC_PENDING_INTERACTION
GENERIC_RESOURCE_NUMERIC
GENERIC_RESULT_BINDING
GENERIC_STATUS_STATE
GENERIC_TARGET_SELECTION
GENERIC_TRIGGER_GATEWAY
REVIEWED_SPECIAL_HANDLER
```

Its classification remains:

```text
classificationRoute=SPECIAL_HANDLER_CANDIDATE
blockedBy=[SPECIAL_EFFECT:ability_reuse_rule]
inheritedAcceptanceContracts=[]
```

## Generated result

```text
totalIdentityCount=944
sourceEvidenceOverlayCount=85
sourceEvidenceOverlayAbilityCount=177
sourceGroundedCount=157
semanticBlockedCount=787
contractMappedCount=157
explicitBlockCount=787
READY_EXISTING_CONTRACT=0
READY_GENERIC_EXTENSION=100
SPECIAL_HANDLER_CANDIDATE=57
SOURCE_EVIDENCE_REQUIRED=787
structuredAbilityCount=294
zeroSilentFallback=true
capabilityCount=32
runtimeRequestCount=23
runtimeRequestAffectedIdentityCount=157
```

Delta from the accepted `156 / 788` checkpoint:

```text
source-grounded: +1
source-evidence blocked: -1
```

The Chaos group is now source-grounded `18 / 18`.

## Verification

```text
npm run typecheck                                                   PASS
Phase 3 full-roster/reference suite                                6 files / 80 tests PASS
focused semantic/capability/decision suite                         3 files / 51 tests PASS
independent development-source replay                              1 / 1 PASS
fresh independent automation audit                                 EXACT_AGREEMENT / gapCount=0
full npm run test:ci                                               84 files / 525 tests PASS
generic machinery identity-literal audit                           PASS / 0 Chaos-s17 literals
candidate production-runtime diff vs accepted Araya R2             NONE
git diff --check                                                   PASS before freeze
```

## Result

This slice is ready for independent A recomputation and R review as an incremental F1 source-evidence checkpoint.

It does **not** promote F2/F3/F4, `READY_EXISTING_CONTRACT`, runtime implementation, migration acceptance, or full-roster closure. `master.chaos.skill.s17` remains reviewed-special implementation work, and 787 identities remain explicitly source-evidence blocked.
