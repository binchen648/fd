# Phase 3 Full-Roster Source Evidence — Ophelia R1

- Date: 2026-09-15
- Role: Codex S
- Base accepted S lineage: `fc2d7845e513af0aa0cd61f95bb96e1d51d4bcd5`
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Source authority: lower-priority development text snapshot (`DEVELOPMENT_TEXT`)
- Source document: `Fate_Domination-开发版/data_masters.js`
- Source file SHA-256: `c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825`
- Scope: source normalization/capability membership only; no runtime implementation or Gate promotion
- Candidate status: `SOURCE_EVIDENCE_NORMALIZATION_CANDIDATE`

## Ophelia evidence slice

Ten canonical identities are newly source-grounded:

- `master.ophelia.skill.ascension`
- `master.ophelia.skill.s1`
- `master.ophelia.skill.s1a`
- `master.ophelia.skill.s1b`
- `master.ophelia.skill.s2`
- `master.ophelia.skill.s3`
- `master.ophelia.skill.s4`
- `master.ophelia.skill.s5`
- `master.ophelia.skill.s6`
- `master.ophelia.skill.s7`

The 10 identities contain 16 structured semantic abilities.

All ten records remain bound to the existing accepted development-text evidence authority using the exact source-file SHA, exact locator, embedded sourceText SHA, and exact locked-Reference printed-text SHA.

Direct S-side reread of development lines 326 through 335 reports:

```text
Ophelia evidence cards=10
whole-file SHA mismatch=0
locator/sourceText mismatch=0
sourceText SHA mismatch=0
```

## Semantic preservation

The batch preserves the following source distinctions structurally:

- Cryptic owner: Nordic Lostbelt ownership plus expansion after an Ophelia battle win.
- Mystic Eye: the shared two-use game limit on Delaying Mystic Eye.
- Childhood Trauma: controller total power -10 specifically on round seven.
- Delaying Mystic Eye: Action phase, 2 mana cost, two uses per game, and a battle-power rule preventing opponents at Ophelia's battlefield from having attack power increased by other cards.
- Nordic Lostbelt: draw/reveal two events, optional outside-game Nordic replacement of one, reshuffle, and synchronized expansion.
- Peace Day: Nordic event metadata, removal at combat end, and exclusion from future expansion.
- Surtr/Valkyrie/Skadi domains: Nordic event metadata plus explicit battlefield-scoped attribute power modifiers.
- Ragnarok: source-card setup into the skill zone; on a battle win at combat end, remove event cards at that battlefield from the game, exclude them from future expansion, bind removed-event count, and permanently add +3 source-card power per removed event.

The Ragnarök parenthetical is represented by generic `MOVE_SOURCE_CARD`; the mapper therefore gains an identity-free `MOVE_SOURCE_CARD -> GENERIC_CARD_ZONE` membership rule.

The Delaying Mystic Eye power prohibition is exposed through both a structural `COMBAT_POWER_LOCK` effect and a combat rule modifier so the capability graph declares Battle Integration, Power, Modifier, Cost Payment, and Lifecycle rather than hiding the power dependency.

## Classification

The ten identities divide conservatively as follows:

```text
READY_GENERIC_EXTENSION=3
  master.ophelia.skill.s1a
  master.ophelia.skill.s1b
  master.ophelia.skill.s2

SPECIAL_HANDLER_CANDIDATE=7
  master.ophelia.skill.s1
  master.ophelia.skill.s3
  master.ophelia.skill.s4
  master.ophelia.skill.s5
  master.ophelia.skill.s6
  master.ophelia.skill.s7
  master.ophelia.skill.ascension
```

All ten inherit zero current runtime acceptance contracts. No identity is promoted to `READY_EXISTING_CONTRACT`.

## Burn-down

Before Ophelia (accepted Wodime checkpoint):

```text
sourceGroundedCount=110
blockedCount=834
structuredAbilityCount=175
READY_GENERIC_EXTENSION=86
SPECIAL_HANDLER_CANDIDATE=24
```

After Ophelia candidate:

```text
sourceGroundedCount=120
blockedCount=824
structuredAbilityCount=191
contractMappedCount=120
explicitBlockCount=824
READY_EXISTING_CONTRACT=0
READY_GENERIC_EXTENSION=89
SPECIAL_HANDLER_CANDIDATE=31
SOURCE_EVIDENCE_REQUIRED=824
runtimeRequestAffectedIdentityCount=120
```

Delta:

```text
+10 source-grounded identities
-10 source-evidence-blocked identities
+16 structured semantic abilities
+3 generic-extension identities
+7 reviewed-special identities
+0 accepted current contracts
+0 runtime changes
```

## Verification

```text
npm run typecheck                                    PASS
FS03/FS04/FS05 regeneration                          PASS
focused semantic/capability/decision tests           3 files / 32 tests PASS
Phase 3 Reference/full-roster S suite                6 files / 59 tests PASS
development source file/locator comparison           10 / 10 PASS, 0 mismatch
git diff --check                                     PASS
production paths under packages/ or apps/            NONE
mapper Ophelia identity literals                     NONE
```

## Non-promotion

This batch does not promote F2, F3, F4, `READY_EXISTING_CONTRACT`, any runtime handler, migration acceptance, or full-roster closure. A must independently recompute the candidate and R must independently review the semantic/capability shape before `120 grounded / 824 blocked` becomes an accepted F1 checkpoint.
