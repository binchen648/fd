# Phase 3 Full-Roster Independent Review — Kadoc + Hinako R2

- Date: 2026-09-15
- Role: Codex R
- Scope: Kadoc + Hinako source-evidence intake review only; no candidate repair
- S candidate: `a1df532858c6bc38e7767d4d718bc3973462ff5a`
- A audit head: `4b4d92517238611ae10017889ecdd50d1bbb3cdb`
- S PR: `#69`
- A PR: `#70`
- Overall verdict: `INTAKE_NEEDS_REVISION`

## Fresh reviewer verification

```text
npm run typecheck                              PASS
Phase 3 Reference/full-roster suite            6 files / 65 tests PASS
fresh independent automation audit             EXACT_AGREEMENT / gapCount=0
independent development-source replay          13 / 13 PASS
sourceGroundedCount                            142
semanticBlockedCount                           802
sourceEvidenceOverlayCount                     70
sourceEvidenceOverlayAbilityCount              133
normalizer/mapper Kadoc/Hinako identity branch NONE
```

Mechanical/provenance agreement is not sufficient to accept the semantic dependency shape. The accepted checkpoint remains Fiore `129 / 815` until the findings below are repaired and freshly re-reviewed.

## Blocking findings

### KH-001 — Qin off-board VP adds an unsupported once-per-round restriction

`master.hinako.skill.s3` says only: `战力结算时，若你不位于任何地点，获得2点战果。`

The candidate adds:

```text
limit.scope=npc:qin_shi_huang
limit.period=round
limit.maxUses=1
```

No such limit exists in the locked development text. This changes repeated-combat semantics and must be removed unless an authoritative higher-priority rule source explicitly supplies it.

### KH-002 — China conditional player bonuses are hidden from normalized condition axes

Cloud Walk / Sun Walk / Water Walk encode their per-player printed predicates inside `combat_power_bonus.conditions`. The normalizer currently skips nested effect `conditions`, so s4's generated condition axis exposes only the unrelated Storm Capital battlefield condition.

The three printed predicates therefore disappear from F1 semantic-axis evidence. Repair must structurally surface nested effect conditions (generically, not through a Hinako identity branch) while preserving reviewed-special event semantics.

### KH-003 — China attack prohibitions omit Card Action Play dependency

Tranquility / Deep Dive / Erudition use structural `rule=card_play_permission, operation=prohibit`, but the mapper currently grants `CARD_ACTION_PLAY` only for `card_play_mode`. Therefore s4's generated capability set omits the Card Action Play dependency for explicit printed play prohibitions.

Repair must map structural play-permission rules to Card Action Play generically, with regression coverage and zero inherited acceptance contracts.

### KH-004 — Rapid Expansion permits voluntary empty selection despite “if unable” fallback

`master.kadoc.skill.ascension` says to place one Russia event card from outside the game, and gain 5 VP only `若你无法做到`.

The candidate models selection as `choose_events minCount=0 maxCount=1`, which permits choosing zero even when an eligible event exists. That would allow the fallback to be selected voluntarily rather than only when the required placement is impossible.

Repair must represent exactly-one selection when an eligible event exists, while keeping the no-eligible fallback explicit and reviewed-special.

## Reviewed non-blockers

- Hinako Blood Curse now correctly separates the card-level once-per-game play restriction from its combat-phase power effect.
- `card_play_mode=allow_additional_play` correctly exposes `CARD_ACTION_PLAY` after the S structural mapper change.
- Storm Capital cleanup is explicitly bound to `combat.ending` and source battlefield provenance.
- China event copy counts are not invented where the printed source states no quantity.
- NPC, servant-ownership, Lostbelt, event-card and transform semantics remain conservative reviewed-special rows with zero inherited runtime contracts.
- Kadoc Frozen Soil, Survival of the Fittest and Emperor's Edict expose their ordinary Trigger/Battle/Movement/Resource dependencies outside special event metadata.

## Provenance judgment

```text
Kadoc + Hinako records=13
whole-file SHA mismatch=0
locator/sourceText mismatch=0
sourceText SHA mismatch=0
Reference printedText mismatch=0
Reference printedText SHA mismatch=0
```

Source binding is accepted; the rejection is semantic/dependency-shape only.

## Checkpoint result

- Accepted checkpoint remains `129 grounded / 815 source-evidence blocked`.
- Candidate arithmetic `142 / 802` is internally consistent but not accepted yet.
- R2 verdict: `INTAKE_NEEDS_REVISION`.
- Reviewer made no candidate production/semantic fix.
