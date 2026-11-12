# Phase 3 Full-Roster Source Evidence — Wodime R2 Repair

- Date: 2026-09-15
- Role: Codex S
- Parent S candidate: `fd0711d2a3215e27a17f57a9a20771417376f21c`
- R1 rejection: `1cd054a36958980d7eb62e813e10ef5973791e16`
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: repair F1 dependency/semantic exposure only; no runtime implementation or Gate promotion
- Candidate status: `SOURCE_EVIDENCE_NORMALIZATION_CANDIDATE_R2`

## R1 findings repaired

### F1-WODIME-001 — Event Deck dependency

`EVENT_CARD_RULE` and `LOSTBELT_EXPANSION` now contribute `GENERIC_EVENT_DECK` while remaining reviewed-special. The mapping is structural and identity-free.

Consequently Atlantis/Olympus event operations and the Olympus event definitions declare the existing Event Deck subsystem dependency without inheriting any runtime acceptance contract.

### F1-WODIME-002 — post-power Defeat dependency shape

The three Olympus post-power rules are no longer opaque event-card payloads.

- Zeus's Thunder now has separate event metadata, a Defeat-immunity rule modifier, and an explicit `combat.power-calculated` trigger with power-threshold condition and Defeat effect.
- Aphrodite's Thoughts now has separate event metadata and an explicit post-power combat trigger with same-battlefield, Wodime-opponent and zero-command-seals-spent conditions.
- Demeter's Bounty now has separate event metadata and an explicit post-power combat trigger with same-battlefield, Wodime-opponent and outpost-deployment conditions.

Generated rows for `s7`–`s9` now declare `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_EVENT_DECK`, `GENERIC_TRIGGER_GATEWAY`, and `REVIEWED_SPECIAL_HANDLER`; `s7` additionally declares `GENERIC_MODIFIER`.

### F1-WODIME-003 — Astronomical Sphere restrictions

Human Order Guarantee Sphere remains reviewed-special, but the three independent printed restrictions are separately exposed as rule modifiers:

- `card_play_mana_requirement / ignore_below_threshold / threshold=8`;
- `combat_power_resolution / ignore_other_controller_attacks`;
- `card_entry_method / restrict_to_this_ability`.

Its structured kind is passive in the combat phase, preserving the source's passive/combat wording. Its generated dependencies now include `CARD_ACTION_PLAY`, `GENERIC_BATTLE_INTEGRATION`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_MODIFIER`, and `REVIEWED_SPECIAL_HANDLER`, with zero inherited acceptance contracts.

## Additional source preservation

Olympus expansion explicitly records that the two drawn event cards are revealed before optional replacement (`revealDrawnEvents=true`). The development-text provenance records and hashes are unchanged from R1.

## Burn-down / classification

The repair changes semantic detail and dependencies, not identity classification totals:

```text
sourceGroundedCount=110
blockedCount=834
structuredAbilityCount=175
contractMappedCount=110
explicitBlockCount=834
READY_EXISTING_CONTRACT=0
READY_GENERIC_EXTENSION=86
SPECIAL_HANDLER_CANDIDATE=24
SOURCE_EVIDENCE_REQUIRED=834
runtimeRequestAffectedIdentityCount=110
```

Relative to R1, structured abilities increase from `171` to `175` because the Olympus event metadata and post-power effects are represented separately. All eleven Wodime identities remain `SPECIAL_HANDLER_CANDIDATE` and all inherit zero current runtime acceptance contracts.

## Verification

```text
npm run typecheck                                    PASS
FS03/FS04/FS05 regeneration                          PASS
focused semantic/capability/decision tests           3 files / 29 tests PASS
Phase 3 Reference/full-roster S suite                6 files / 56 tests PASS
development source file/locator comparison           11 / 11 PASS, 0 mismatch
git diff --check                                     PASS
production paths under packages/ or apps/            NONE
```

## Non-promotion

R2 does not promote F2, F3, F4, `READY_EXISTING_CONTRACT`, a runtime handler, migration acceptance, or full-roster closure. A must independently recompute the repaired artifacts and R must re-review the three closed findings before `110 / 834` becomes an accepted F1 checkpoint.
