# Phase 3 Full-Roster Source Evidence — Wodime R1

- Date: 2026-09-15
- Role: Codex S
- Base accepted S lineage: `0dcc1f94297f2198f0f4152742c585032931390a`
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Source authority: lower-priority development text snapshot (`DEVELOPMENT_TEXT`)
- Source document: `Fate_Domination-开发版/data_masters.js`
- Source file SHA-256: `c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825`
- Scope: source normalization/capability membership only; no runtime implementation or Gate promotion
- Candidate status: `SOURCE_EVIDENCE_NORMALIZATION_CANDIDATE`

## Development-text evidence lane

The existing external overlay path previously accepted only the Fate/Domination Wiki. This batch adds a second, lower-priority fail-closed evidence authority for the user's development-edition source text.

A `DEVELOPMENT_TEXT` record is accepted only when it carries:

- an allowlisted source document (`Fate_Domination-开发版/data_masters.js` or `data_servants.js`);
- a stable locator;
- a 64-character whole-source-file SHA-256;
- the exact snapshotted source text;
- a SHA-256 of that source text that recomputes exactly;
- the existing exact locked-Reference printed-text SHA binding.

This does not modify the locked Reference and does not treat Reference handlers/runtime behavior as canonical rules.

## Wodime evidence slice

Eleven canonical identities are newly source-grounded:

- `master.wodime.skill.ascension`
- `master.wodime.skill.s1`
- `master.wodime.skill.s1a`
- `master.wodime.skill.s2`
- `master.wodime.skill.s3`
- `master.wodime.skill.s4`
- `master.wodime.skill.s5`
- `master.wodime.skill.s6`
- `master.wodime.skill.s7`
- `master.wodime.skill.s8`
- `master.wodime.skill.s9`

The 11 identities contain 16 structured semantic abilities.

Independent local source verification reread the development file at the committed locators (`data_masters.js` lines 358 through 368) and found:

```text
whole-file SHA mismatch=0
sourceText mismatch=0
sourceText SHA mismatch=0
locator mismatch=0
Wodime evidence cards=11
```

## Conservative semantic routing

Wodime is intentionally not presented as generic migration-ready behavior. Five structural semantic families are declared reviewed-special:

- `LOSTBELT_EXPANSION`
- `SECRET_ROUND_BINDING`
- `ASTRONOMICAL_SPHERE_RULE`
- `LOCATION_TOKEN_RULE`
- `EVENT_CARD_RULE`

All 11 Wodime identities therefore route to `SPECIAL_HANDLER_CANDIDATE` and inherit zero current runtime acceptance contracts.

Important preserved distinctions include:

- Cryptic Leader owns both Atlantis and Olympus, expands Atlantis at game start, and spends 5 God's Legacy to expand Olympus during the Action phase.
- Astronomical Science secretly records two rounds and creates Human Order Guarantee Sphere in the skill zone.
- Human Order Guarantee Sphere can enter through the recorded-round rule, ignores the 8-mana requirement for that rule, ignores Wodime's other attacks during power resolution, and cannot enter through other methods.
- God's Legacy persists after Wodime is eliminated, moves with players according to terrain position, is collected by a unique winner, and has separate 3X-for-power / 4X-for-mana spend rules.
- Atlantis reveal/expansion and Olympus replacement/expansion stay explicit event-deck special semantics.
- Hephaestus Terminal, Zeus's Thunder, Aphrodite's Thoughts, and Demeter's Bounty preserve their event-card quantities, VP values, resource/Defeat conditions, and post-power-calculation predicates.
- Grand Order records one additional secret round after a battle win and remains optional.

No character-ID runtime route is added. These tokens exist only in the offline semantic/capability intake and deliberately request reviewed-special handling.

## Burn-down

Before Wodime (accepted Bazett evidence state):

```text
sourceGroundedCount=99
blockedCount=845
structuredAbilityCount=155
contractMappedCount=99
explicitBlockCount=845
READY_GENERIC_EXTENSION=86
SPECIAL_HANDLER_CANDIDATE=13
SOURCE_EVIDENCE_REQUIRED=845
runtimeRequestAffectedIdentityCount=99
```

After Wodime:

```text
sourceGroundedCount=110
blockedCount=834
structuredAbilityCount=171
contractMappedCount=110
explicitBlockCount=834
READY_EXISTING_CONTRACT=0
READY_GENERIC_EXTENSION=86
SPECIAL_HANDLER_CANDIDATE=24
SOURCE_EVIDENCE_REQUIRED=834
runtimeRequestAffectedIdentityCount=110
```

Delta:

```text
+11 source-grounded identities
-11 source-evidence-blocked identities
+16 structured semantic abilities
+0 generic-extension identities
+11 reviewed-special identities
+0 accepted current contracts
+0 runtime changes
```

## Verification

```text
npm ci                                               PASS
npm run typecheck                                    PASS
FS03/FS04/FS05 regeneration                          PASS
Phase 3 semantics/capability/decision focused        3 files / 28 tests PASS
Phase 3 Reference/full-roster S suite                6 files / 55 tests PASS
independent development-file SHA/locator comparison  PASS (11/11, 0 mismatch)
git diff --check                                     PASS
production paths under packages/ or apps/            NONE
locked Reference worktree                            CLEAN
```

## Non-promotion

This batch does not promote F2, F3, F4, `READY_EXISTING_CONTRACT`, any runtime capability, migration acceptance, or full-roster closure. A separate A-owned audit must independently understand and verify the new `DEVELOPMENT_TEXT` evidence authority, followed by fresh R review, before the proposed `110 / 834` burn-down is accepted.
