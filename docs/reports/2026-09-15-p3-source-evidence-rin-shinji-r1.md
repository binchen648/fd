# Phase 3 Full-Roster Source Evidence — Rin + Shinji R1

- Date: 2026-09-15
- Role: Codex S
- Base accepted checkpoint: `52683b70a04714b6439ee7afb785ab69fc981d11`
- Branch: `codex/s-p3-source-evidence-rin-shinji-r1`
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: source-evidence normalization for all five blocked Rin identities and all five blocked Shinji identities; no runtime implementation or migration acceptance

## Source evidence

All ten canonical identities are bound to the exact development-text snapshot in `Fate_Domination-开发版/data_masters.js`.

```text
source file SHA-256=c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825
records=10
sourceText mismatch=0
sourceText SHA mismatch=0
Reference printedText mismatch=0
Reference printedText SHA mismatch=0
```

The locked Reference and development text agree exactly for all ten records. No legacy handler behavior is used as semantic authority.

## Structured semantics

Rin is normalized into ordinary resource, lifecycle, card-zone, play, choice, and trigger dependencies wherever the printed text permits it.

- Gem Magic establishes ten Gem instances at game start and preserves the Climax repeat quota of at most three uses per option / nine total selections.
- Absolute Obedience preserves the mandatory first-round Command Seal use, the end-of-round Seal penalty if none was used, and the post-combat mana repayment when the round-one Seal granted mana.
- Gem exposes a branch choice between +1 mana, playing Yin-Qi Bullet from outside the game, and cycling 1–3 hand cards. Its once-per-game limit is explicitly scoped `per_gem_instance`, so ten physical Gems are not collapsed into one global use.
- Yin-Qi Bullet preserves its printed Magic/0-cost/1-power profile and removal from game after close.
- Kaleidosword preserves skill-zone setup, Magic-basic/Yin-Qi Bullet +2 power, the action that gains the total mana spent by all players this round, and post-combat source removal.

The outside-game Yin-Qi Bullet play is mapped structurally through `PLAY_CARD_BY_DEFINITION_FROM_OUTSIDE_GAME`, which exposes both generic Card Zone and Card Action Play dependencies without a Rin identity branch.

Shinji is normalized with ordinary dependencies separated from identity/servant replacement semantics.

- Absorb Mana: enter Miyama -> gain 1 mana.
- Useless Man: game start -> obtain Fake Attendant Book.
- Jester: lose combat -> lose one Command Seal.
- Fake Attendant Book: at the round end following the first complete Command Seal loss, either replace the Servant with a random unused Servant and restore three Seals when Sakura is present, or replace the Master with Sakura, reset mana, restore two Seals, and preserve VP when she is absent.
- Holy Grail Core: after round eight with Shakespeare as the current Servant, branch on whether Shakespeare was the first Servant; retain the Miyama +12 power and VP-drain rules for the first-Servant branch.

Only Fake Attendant Book remains reviewed-special, through `SERVANT_OWNERSHIP_RULE` and `MASTER_IDENTITY_RULE`. Resource reset/Command Seal dependencies remain explicit rather than hidden by the special replacement rule.

## Generated result

```text
totalIdentityCount=944
sourceEvidenceOverlayCount=94
sourceEvidenceOverlayAbilityCount=196
sourceGroundedCount=166
semanticBlockedCount=778
contractMappedCount=166
explicitBlockCount=778
READY_EXISTING_CONTRACT=0
READY_GENERIC_EXTENSION=109
SPECIAL_HANDLER_CANDIDATE=57
SOURCE_EVIDENCE_REQUIRED=778
zeroSilentFallback=true
capabilityCount=32
runtimeRequestCount=23
structuredAbilityCount=313
```

Delta from accepted Araya R2 checkpoint:

```text
source-grounded: +10
source-evidence blocked: -10
structured abilities: 292 -> 313 (+21)
generic extension candidates: 100 -> 109 (+9)
special handler candidates: 56 -> 57 (+1)
```

All ten identities retain zero inherited runtime acceptance contracts.

## Verification

```text
npm run typecheck                                                   PASS
Phase 3 full-roster/reference suite                                 6 files / 81 tests PASS
Rin/Shinji focused semantic/capability/decision suite               3 files / 52 tests PASS
independent development-source replay                               10 / 10 PASS
fresh independent full-roster audit                                 EXACT_AGREEMENT / gapCount=0
full `npm run test:ci`                                              84 files / 526 tests PASS
generic machinery Rin/Shinji identity-literal audit                 PASS / 0 identity literals
production-runtime diff under packages/, apps/, src/                NONE
git diff --check                                                    PASS before freeze
```

## Result

This slice is ready for independent A recomputation and fresh R review as an incremental F1 source-evidence checkpoint.

It does **not** promote F2/F3/F4, `READY_EXISTING_CONTRACT`, runtime implementation, migration acceptance, or full-roster closure. Candidate checkpoint is `166 grounded / 778 source-evidence blocked`; the formally accepted checkpoint remains `156 / 788` until independent R accepts this slice.
