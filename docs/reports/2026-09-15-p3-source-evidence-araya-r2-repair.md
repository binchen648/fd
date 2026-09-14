# Phase 3 Full-Roster Source Evidence — Araya R2 Visibility Repair

- Date: 2026-09-15
- Role: Codex S
- Parent S R1: `8b3a91215775f89daa036430589457fc3299ccc9`
- R1 rejection: `473eb77b2bd973b96449303ebadd69c3ca0e7595`
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: structural F1 dependency repair only; no new source identities, runtime implementation, or migration

## ARAYA-001 closure

R1 correctly found that the Araya ascension source requires opponents to play a face-down attack during regular play, but semantic normalization only derived face-state visibility from structured effects. The `card_play_requirement` rule modifier therefore carried `face: down` without producing a `FACE_DOWN` visibility axis or `GENERIC_VISIBILITY` capability dependency.

R2 fixes this structurally in the generic rule-modifier path:

```text
ruleModifier.face=down -> FACE_DOWN
ruleModifier.face=up   -> FACE_UP
```

No Araya identity/card name branch is introduced.

The regenerated Araya ascension now declares:

```text
classificationRoute=SPECIAL_HANDLER_CANDIDATE
inheritedAcceptanceContracts=[]
visibility=[FACE_DOWN]
requiredCapabilities includes:
  CARD_ACTION_PLAY
  GENERIC_CONDITION_EVALUATION
  GENERIC_MODIFIER
  GENERIC_MOVEMENT
  GENERIC_VISIBILITY
  REVIEWED_SPECIAL_HANDLER
```

It remains blocked only by the bespoke location classification rule (`SPECIAL_EFFECT:location_token_rule`); no runtime acceptance is fabricated.

## Counts

The repair changes dependency membership only. Source-evidence population and classification counts remain unchanged:

```text
totalIdentityCount=944
sourceEvidenceOverlayCount=84
sourceEvidenceOverlayAbilityCount=175
sourceGroundedCount=156
semanticBlockedCount=788
contractMappedCount=156
explicitBlockCount=788
READY_EXISTING_CONTRACT=0
READY_GENERIC_EXTENSION=100
SPECIAL_HANDLER_CANDIDATE=56
SOURCE_EVIDENCE_REQUIRED=788
runtimeRequestCount=23
```

## Verification

```text
source replay                                    2 / 2 PASS
npm run typecheck                                PASS
Phase 3 full-roster/reference suite              6 files / 79 tests PASS
fresh independent automation audit               EXACT_AGREEMENT / gapCount=0
full npm run test:ci                             84 files / 524 tests PASS
generic identity-literal audit                   PASS / 0 Araya literals
production runtime diff                          NONE
git diff --check                                 PASS before freeze
```

The new generic regression verifies both `face=down -> FACE_DOWN` and `face=up -> FACE_UP` for rule modifiers. The Araya generated regression verifies `GENERIC_VISIBILITY` is present after FS03/FS04 regeneration.

## Non-promotion

This repair does not promote F2/F3/F4, `READY_EXISTING_CONTRACT`, runtime implementation, migration acceptance, or full-roster closure. It only closes the R1 F1 capability-dependency gap for the already source-grounded Araya slice.
