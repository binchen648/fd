# Phase 3 Full-Roster Source Evidence — Kadoc + Hinako R1

- Date: 2026-09-15
- Role: Codex S
- Parent accepted S lineage: `855b047d860d4ba58f3d7e5d8964b87447ff2d24` (Fiore R2)
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Development source: `Fate_Domination-开发版/data_masters.js`
- Scope: 13 source-evidence identities: Kadoc 7 + Hinako 6
- Candidate status: `SOURCE_EVIDENCE_NORMALIZATION_CANDIDATE_R1`

## Source binding

All 13 records were generated only after exact equality checks between the locked Reference printed text and the development-text locator. The development source file is hash-bound by:

```text
sourceFileSha256=c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825
Reference/development mismatches=0
Kadoc records=7
Hinako records=6
Total=13
```

## Semantic normalization

The slice explicitly separates ordinary dependencies from reviewed-special subsystems.

Kadoc covers Russia Lostbelt expansion/event rules, round-end VP loss, deployment/entry mana loss, movement lock, battle-result VP penalties, and the Rapid Expansion ascension action.

Hinako covers Blood Curse card creation/return, card-level once-per-game play restriction, additional-play semantics, combat attack-power modification, Qin NPC state, China Lostbelt/event rules, explicit Storm Capital combat-end cleanup, servant-ownership transition, and temporary card transformation.

Important normalization safeguards in this candidate:

- `<每局游戏限一次>` on `master.hinako.skill.s2` is represented as a card-level `when_play_requirements_checked` limit, not as a use limit on the combat power ability.
- `card_play_mode` structurally maps to `CARD_ACTION_PLAY`; no Hinako identity branch was added.
- Hinako s2 combat power reduction exposes Battle Integration structurally through `combat_card_power`.
- China event records do not invent a `copyCount` absent from the printed source.
- Storm Capital removal is an explicit `combat.ending` trigger rather than a hidden passive payload.
- NPC semantics and servant-ownership semantics are kept reviewed-special.
- No candidate identity inherits an accepted runtime contract.

## Burn-down

Relative to the accepted Fiore checkpoint:

```text
sourceGroundedCount:       129 -> 142 (+13)
semanticBlockedCount:      815 -> 802 (-13)
structuredAbilityCount:    210 -> 250 (+40)
contractMappedCount:       129 -> 142 (+13)
explicitBlockCount:        815 -> 802 (-13)
READY_EXISTING_CONTRACT:     0 ->   0
READY_GENERIC_EXTENSION:    93 ->  96 (+3)
SPECIAL_HANDLER_CANDIDATE:  36 ->  46 (+10)
SOURCE_EVIDENCE_REQUIRED:  815 -> 802 (-13)
```

The 13-ID batch therefore resolves source-evidence blocking only. It does not grant runtime acceptance.

## Verification

```text
FS03 / FS04 / FS05 regeneration                      PASS
npm run typecheck                                    PASS
Phase 3 Reference/full-roster suite                  6 files / 63 tests PASS
Kadoc + Hinako semantic regression                   PASS
card_play_mode structural mapper regression          PASS
git diff --check                                     PASS
production paths under packages/, apps/, src/        NONE
```

## Non-promotion

This S candidate does not promote F2, F3, F4, `READY_EXISTING_CONTRACT`, runtime implementation, migration acceptance, or full-roster closure. A must independently recompute the artifacts and R must independently review this source/semantic/capability intake before `142 grounded / 802 source-evidence blocked` becomes an accepted checkpoint.
