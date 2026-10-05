# Phase 3 Full-Roster Source Evidence — Bazett R2

- Date: 2026-09-15
- Role: Codex S
- Base accepted S lineage: `22e29dfc6e794ee94884c5a3874e404f3953af7f`
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- External canonical evidence: Fate/Domination Wiki, `https://fatedomination.fandom.com/wiki/Bazett_Fraga_McRemitz`
- Scope: source normalization/capability membership only; no runtime implementation or Gate promotion
- Candidate status: `SOURCE_EVIDENCE_NORMALIZATION_CANDIDATE`

## Bazett evidence slice

Ten canonical identities are newly source-grounded:

- `master.bazett.skill.ascension`
- `master.bazett.skill.s1`
- `master.bazett.skill.s1a`
- `master.bazett.skill.s1b`
- `master.bazett.skill.s1c`
- `master.bazett.skill.s1d`
- `master.bazett.skill.s2`
- `master.bazett.skill.s3`
- `master.bazett.skill.s4`
- `master.bazett.skill.s5`

The source meaning is preserved without importing Reference handlers or runtime behavior.

Important reviewed distinctions:

- Day 2 removes Fragarach's once-per-game restriction for the round and removes the 8-mana play requirement for that round. It does **not** remove or waive the card's printed cost.
- Day 3 adds itself to attack and grants 3 VP on a fight win.
- Day 4 awakens after a fight win, otherwise resets at round end.
- Awake stops Lost in Time, restores all Command Seals, and regains Fragarach.
- Fragarach remains a reviewed-special candidate because Ultimate Counter explicitly defeats the opponent who uses a Noble Phantasm on Bazett's battlefield.
- Flawless Defense only changes Fragarach's once-per-game/persistence semantics; no extra 3-mana deactivation action is invented.

## Capability boundary repair

The generic resource family now includes the structured effect `ADJUST_COMMAND_SEALS`, so Awake declares `GENERIC_RESOURCE_NUMERIC`.

The already accepted `RESOURCE_NUMERIC_CORE_DIRECT_ACTION` contract remains restricted to mana/VP numeric mutations. `ADJUST_COMMAND_SEALS` is deliberately excluded from that direct-action contract, so restoring all Command Seals cannot silently inherit unrelated mana/VP runtime acceptance.

The mapping is structural and identity-free.

## Burn-down

Before Bazett:

```text
sourceGroundedCount=89
blockedCount=855
structuredAbilityCount=138
contractMappedCount=89
explicitBlockCount=855
READY_GENERIC_EXTENSION=82
SPECIAL_HANDLER_CANDIDATE=7
SOURCE_EVIDENCE_REQUIRED=855
runtimeRequestAffectedIdentityCount=89
```

After Bazett:

```text
sourceGroundedCount=99
blockedCount=845
structuredAbilityCount=154
contractMappedCount=99
explicitBlockCount=845
READY_EXISTING_CONTRACT=0
READY_GENERIC_EXTENSION=91
SPECIAL_HANDLER_CANDIDATE=8
SOURCE_EVIDENCE_REQUIRED=845
runtimeRequestAffectedIdentityCount=99
```

Delta:

```text
+10 source-grounded identities
-10 source-evidence-blocked identities
+16 structured semantic abilities
+9 generic-extension candidates
+1 reviewed-special candidate
+0 accepted current contracts
+0 runtime changes
```

## Verification

```text
npm ci                                              PASS
npm run typecheck                                   PASS
FS03/FS04/FS05 regeneration                         PASS
Phase 3 Reference/full-roster S suites              5 files / 45 tests PASS
independent Bazett overlay ID/SHA/domain check       PASS
git diff --check                                    PASS
production paths under packages/ or apps/           NONE
```

Independent data verification additionally confirmed:

```text
Bazett overlay count=10
Bazett unique canonical IDs=10
Reference text SHA mismatches=0
invalid/non-Fandom URLs=0
Day 2 card_play_cost modifier present=false
Flawless Defense structured abilities=1
Awake restore_all Command Seals effect present=true
```

## Non-promotion

This batch does not promote F2, F3, F4, `READY_EXISTING_CONTRACT`, runtime acceptance, migration acceptance, or full-roster closure. A separate A-owned audit and independent R review are required before the 10-ID burn-down may be treated as accepted evidence.
