# Phase 3 Full-Roster Source Evidence — Bazett R3 Repair

- Date: 2026-09-15
- Role: Codex S
- Parent S candidate: `f439b3241bb5999e90fd7cf638b569081f2b148c`
- R1 rejection: `834a7b47c1d821a3f032f2f74177c9f9d28187ec`
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Source: `https://fatedomination.fandom.com/wiki/Bazett_Fraga_McRemitz` plus the Wiki Keywords rule for play/use semantics
- Scope: repair the three R1 F1 findings; no runtime implementation or Gate promotion
- Candidate status: `SOURCE_EVIDENCE_NORMALIZATION_CANDIDATE_R3`

## R1 findings repaired

### F1-BAZETT-001 — Day 3 entry-to-skill-zone

Day 3 now has an explicit source-grounded `enter_stage` transition to the skill zone before its Action ability that moves the source from skill to attack.

The transition is represented through the structural `cycle_state_transition` semantic family rather than a Bazett/card-ID classifier branch. Its separate printed clause remains distinguishable from the Action and 3-VP-on-win clauses.

### F1-BAZETT-002 — explicit Day Cycle / Awake binding

Lost in Time no longer compresses the day deck into an unbound numeric flag. It now records a structural cycle with exact canonical stage identities:

```text
Day 1 = master.bazett.skill.s1b
Day 2 = master.bazett.skill.s1c
Day 3 = master.bazett.skill.s5
Day 4 = master.bazett.skill.s1d
```

The source-grounded transitions explicitly represent:

- initialize with Day 1 active/in play;
- advance to the next Day at round end;
- schedule a return to Day 1 after a fight loss;
- Day 4 win -> Awaken and resolve `master.bazett.skill.s4`;
- Day 4 failure -> schedule Reset;
- Reset at next-round start -> Day 1 + 1 VP;
- Awake -> stop/disable Lost in Time, restore all Command Seals, and regain Fragarach.

`cycle_state_transition` is deliberately classified as `REVIEWED_SPECIAL_HANDLER`. S does not define a runtime implementation for it.

### F1-BAZETT-003 — Fragarach use trigger

Ultimate Counter now listens to the semantic event `card_or_ability.used`, retaining opponent, same-battlefield, Noble Phantasm, source-active, next-use, once-per-game and Defeat semantics.

This avoids the rejected R1 narrowing to `card.played`, consistent with the Wiki Keywords distinction between a card being played and an activated ability being used.

## Conservative capability routing

Bazett remains 10 source-grounded identities, but R3 intentionally routes the stateful Day Cycle slice more conservatively:

```text
Bazett generic-extension identities=4
Bazett reviewed-special identities=6
```

The six reviewed-special Bazett identities are:

- `master.bazett.skill.s1a` — Lost in Time cycle state
- `master.bazett.skill.s1d` — Day 4 awaken/reset transition
- `master.bazett.skill.s2` — Fragarach Defeat
- `master.bazett.skill.s3` — Reset transition
- `master.bazett.skill.s4` — Awake break-loop transition
- `master.bazett.skill.s5` — Day 3 cycle-entry transition

No current runtime acceptance is inherited for these special transitions.

## Burn-down

Identity burn-down remains unchanged from the R1 candidate:

```text
sourceGroundedCount=99
blockedCount=845
structuredAbilityCount=155
contractMappedCount=99
explicitBlockCount=845
READY_EXISTING_CONTRACT=0
READY_GENERIC_EXTENSION=86
SPECIAL_HANDLER_CANDIDATE=13
SOURCE_EVIDENCE_REQUIRED=845
runtimeRequestAffectedIdentityCount=99
```

Relative to the accepted Chaos baseline:

```text
+10 source-grounded identities
-10 source-evidence-blocked identities
+17 structured semantic abilities
+4 generic-extension identities
+6 reviewed-special identities
+0 accepted current contracts
+0 runtime changes
```

## Verification

```text
npm ci                                              PASS
npm run typecheck                                   PASS
FS03/FS04/FS05 regeneration                         PASS
Phase 3 Reference/full-roster S suites              5 files / 45 tests PASS
git diff --check                                    PASS
production paths under packages/ or apps/           NONE
```

Generated capability inspection confirms all five Day-Cycle identities carrying `cycle_state_transition` are `SPECIAL_HANDLER_CANDIDATE`, Fragarach remains special for Defeat, and Awake still declares both Card Zone and generic Resource dependencies without inheriting `RESOURCE_NUMERIC_CORE_DIRECT_ACTION`.

## Non-promotion

R3 does not promote F2, F3, F4, `READY_EXISTING_CONTRACT`, a runtime capability, migration acceptance, or full-roster closure. A must independently recompute the repaired artifacts and R must perform a fresh review before the proposed `99 / 845` burn-down becomes accepted.
