# Phase 3 Full-Roster Source Evidence — Araya Souren R1

- Date: 2026-09-15
- Role: Codex S
- Base accepted checkpoint: `254104eefd7ad5451e5928ac67141b9c04213c42`
- Branch: `codex/s-p3-source-evidence-araya-r1`
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: source-evidence normalization for `master.araya.skill.s1` and `master.araya.skill.ascension`; `master.araya.skill.s1a` was already source-grounded by locked Reference V2 authoring

## Source evidence

Both newly grounded identities are bound to the exact development-text snapshot in `Fate_Domination-开发版/data_masters.js`.

```text
source file SHA-256=c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825
new records=2
sourceText mismatch=0
sourceText SHA mismatch=0
Reference printedText mismatch=0
Reference printedText SHA mismatch=0
```

The permitted English Fate/Domination Wiki Araya Souren ruling was used only as supporting scope evidence. It confirms that Paradox Spiral makes the 5+ Death Complex location count as Magical Workshop only for Araya Souren, not as a global location conversion. Development text remains the authority for the structured record.

## Structured semantics

`master.araya.skill.s1` / Death Complex:

- triggers when the controller deploys at a location that would normally grant the controller terrain;
- replaces that normal deployment terrain gain with a location-bound +1 terrain increment;
- the increment is persistent for the rest of the game, applies while the controller is at that battlefield, and is capped at 5;
- remains reviewed-special through `TERRAIN_POSITION_ADJUSTMENT` while exposing trigger, condition, and lifecycle dependencies.

`master.araya.skill.ascension` / Paradox Spiral:

- while the controller is at a location where Death Complex grants at least 5 terrain, that location is treated as Magical Workshop for the controller only;
- while the controller is in Magical Workshop, opponents at the controller's location cannot leave it;
- while the controller is in Magical Workshop, opponents' regular play must include at least one face-down attack;
- the workshop classification remains reviewed-special through `LOCATION_TOKEN_RULE`;
- movement and card-play requirements are exposed separately through generic movement/modifier and Card Action dependencies.

Generic capability mapping was extended structurally so `card_play_requirement` participates in `CARD_ACTION_PLAY`, alongside existing play mode/permission modifiers. No Araya identity literal was added to generic machinery.

## Generated result

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
zeroSilentFallback=true
capabilityCount=32
runtimeRequestCount=23
structuredAbilityCount=292
```

Delta from the accepted 154 / 790 checkpoint:

```text
source-grounded: +2
source-evidence blocked: -2
structured abilities: 288 -> 292
special candidates: 54 -> 56
```

The full Araya group is now source-grounded 3 / 3:

```text
master.araya.skill.s1         SPECIAL_HANDLER_CANDIDATE
master.araya.skill.s1a        READY_GENERIC_EXTENSION
master.araya.skill.ascension  SPECIAL_HANDLER_CANDIDATE
```

All three retain zero inherited acceptance contracts.

## Verification

```text
npm run typecheck                                                   PASS
Phase 3 full-roster/reference focused suite                         6 files / 78 tests PASS
independent development-source replay                               2 / 2 PASS
full Araya group source-grounded probe                              3 / 3 PASS
independent full-roster automation audit                            EXACT_AGREEMENT / gapCount=0
final npm run test:ci                                               84 files / 523 tests PASS
generic machinery identity-literal audit                            PASS / 0 Araya identity literals
production-runtime diff under packages/, apps/, src/                NONE
git diff --check                                                    PASS before freeze
```

## Result

This slice is ready for independent A recomputation and R review as an incremental F1 source-evidence checkpoint.

It does **not** promote F2/F3/F4, runtime Gate status, migration acceptance, or `READY_EXISTING_CONTRACT`. The two newly grounded Araya identities remain reviewed-special implementation work, and 788 identities remain explicitly source-evidence blocked.
