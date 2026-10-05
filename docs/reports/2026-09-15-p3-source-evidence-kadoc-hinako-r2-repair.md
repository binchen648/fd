# Phase 3 Full-Roster Source Evidence — Kadoc + Hinako R2 Repair

- Date: 2026-09-15
- Role: Codex S
- Parent S candidate: `a1df532858c6bc38e7767d4d718bc3973462ff5a`
- R2 reviewer rejection: `6697dbef9ff3694637233ebe26aa90e7986abb4e`
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: close KH-001 through KH-004 only; no runtime implementation or Gate promotion
- Candidate status: `SOURCE_EVIDENCE_NORMALIZATION_CANDIDATE_R2`

## Blocker closure

### KH-001 — unsupported Qin once-per-round limit

Removed the candidate-authored round limit from `hinako.qin.off-board-vp`. The printed clause now has no lifecycle limit beyond its explicit `combat.power-calculated` trigger and NPC-location predicate.

Generated `master.hinako.skill.s3` now has no lifecycle axis and does not request `GENERIC_LIFECYCLE_POLICY` solely from the removed assumption.

### KH-002 — hidden China conditional bonus predicates

The semantic normalizer now generically collects `condition` / `conditions` nested inside effect records. No Kadoc, Hinako, Qin, card, or ability identity branch was added.

`master.hinako.skill.s4` now exposes:

```text
PLAYER_FACE_UP_ATTACKS_PLAYED_THIS_ROUND_EQUALS
PLAYER_USED_DECLARATION_REVEAL_THIS_ROUND
PLAYER_ALL_ATTACKS_PRINTED_POWER_EVEN
```

alongside the existing source-battlefield condition.

### KH-003 — missing Card Action Play dependency

The capability mapper now generically treats both `card_play_mode` and `card_play_permission` rule modifiers as Card Action Play semantics.

`master.hinako.skill.s4` therefore now includes `CARD_ACTION_PLAY` for the printed Strength/Agility/Magic attack prohibitions while remaining `SPECIAL_HANDLER_CANDIDATE` for China Lostbelt/event behavior.

### KH-004 — Rapid Expansion voluntary empty-selection shape

`kadoc.rapid-expansion.action` now records:

```text
choose_events
minCount=1
maxCount=1
requiredWhenEligible=true
fallbackWhenNoEligible=true
```

The 5-VP fallback remains in the reviewed-special event operation and is semantically available only when no eligible Russia event can be placed, rather than as a voluntary zero-card choice.

## Candidate totals

The repair changes dependency shape only; population counts remain:

```text
sourceGroundedCount=142
semanticBlockedCount=802
structuredAbilityCount=250
contractMappedCount=142
explicitBlockCount=802
READY_EXISTING_CONTRACT=0
READY_GENERIC_EXTENSION=96
SPECIAL_HANDLER_CANDIDATE=46
SOURCE_EVIDENCE_REQUIRED=802
```

No Kadoc/Hinako identity inherits an accepted runtime contract.

## Verification

```text
FS03 / FS04 / FS05 regeneration                      PASS
npm run typecheck                                    PASS
Phase 3 Reference/full-roster suite                  6 files / 65 tests PASS
nested effect-condition structural regression        PASS
card_play_permission -> Card Action Play regression  PASS
Kadoc/Hinako R2 focused regression                   PASS
normalizer/mapper identity literal audit             PASS (none)
git diff --check                                     PASS
```

## Non-promotion

This repair does not implement Kadoc or Hinako runtime behavior and does not promote F2, F3, F4, `READY_EXISTING_CONTRACT`, migration acceptance, or full-roster closure. A must independently recompute the repaired candidate and fresh R must close KH-001 through KH-004 before `142 / 802` becomes an accepted F1 checkpoint.
