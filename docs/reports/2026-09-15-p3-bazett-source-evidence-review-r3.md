# Phase 3 Full-Roster Independent Review — Bazett Source Evidence R3

- Date: 2026-09-15
- Role: Codex R
- Scope: repaired Bazett source-evidence normalization review only; no runtime implementation or repair
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- S R3 candidate: `0dcc1f94297f2198f0f4152742c585032931390a`
- A R3 audit head: `3b55b10d5847e156031d2f22906c9b3c4d9dbe73`
- R1 rejection: `834a7b47c1d821a3f032f2f74177c9f9d28187ec`
- S R2 PR: `#48`
- R1 rejection PR: `#50`
- S R3 repair PR: `#51`
- A R3 audit PR: `#52`
- F0 result: `F0_ACCEPTED` (inherited baseline remains intact)
- F1 result: `F1_ACCEPTED`
- Overall verdict: `F1_ACCEPTED`

## Findings

No blocking finding remains in the repaired Bazett source-evidence candidate.

The three prior F1 semantic defects are independently verified closed. The repaired semantics remain structural and fail closed: the stateful Day Cycle family is routed to reviewed-special handling rather than inheriting unrelated runtime acceptance.

## R1 finding closure

### F1-BAZETT-001 — CLOSED

Day 3 now explicitly carries a source-grounded `cycle_state_transition` with `operation=enter_stage`, binding `master.bazett.skill.s5` to the skill-zone entry transition before its Action add-to-attack behavior.

The generated identity is `SPECIAL_HANDLER_CANDIDATE`; the transition is not silently treated as a generic card-zone or card-action primitive.

### F1-BAZETT-002 — CLOSED

Lost in Time now binds the Day Cycle to exact canonical stage identities rather than an unbound numeric flag:

```text
Day 1 = master.bazett.skill.s1b
Day 2 = master.bazett.skill.s1c
Day 3 = master.bazett.skill.s5
Day 4 = master.bazett.skill.s1d
```

Independent inspection confirmed structural transitions for initialization, round-end advance, loss-triggered reset scheduling, Day 4 awaken, Day 4 failure reset, next-round Reset, and Awake break-loop behavior.

The stateful identities remain reviewed-special and inherit no current acceptance contracts.

### F1-BAZETT-003 — CLOSED

Fragarach Ultimate Counter now listens to the semantic event `card_or_ability.used` rather than the rejected narrower `card.played` event.

The source-grounded record retains opponent, same-battlefield, Noble Phantasm, source-active, next-use / once-per-game, and Defeat semantics. Fragarach remains `SPECIAL_HANDLER_CANDIDATE` because the effect explicitly defeats another player.

## Additional semantic review

Independent reviewer inspection also confirmed:

- Day 2 removes the 8-mana requirement / once-per-game restriction for the relevant window but does not invent a waiver of Fragarach's printed cost.
- Flawless Defense contains only the source-supported Fragarach limit/persistence changes; no extra 3-mana basic-attack deactivation action is present.
- Awake restores all Command Seals using `adjust_command_seals { operation: restore_all }` and therefore declares `GENERIC_RESOURCE_NUMERIC`.
- `ADJUST_COMMAND_SEALS` is excluded from `RESOURCE_NUMERIC_CORE_DIRECT_ACTION` eligibility, preventing command-seal restoration from inheriting mana/VP direct-action acceptance.
- Awake also declares `GENERIC_CARD_ZONE` for Lost in Time removal / Fragarach return.
- No Bazett identity becomes `READY_EXISTING_CONTRACT`.

## Fresh reviewer verification

```text
exact S R3 candidate                             0dcc1f94297f2198f0f4152742c585032931390a
exact A R3 audit head                            3b55b10d5847e156031d2f22906c9b3c4d9dbe73
S R3 -> A R3 ancestry                            PASS
locked Reference commit                          b2f9fa15fba07c63530bbf4612b03b8b704755f9
locked Reference worktree                        CLEAN
production diff under packages/ or apps/         NONE
npm run typecheck                                 PASS
Phase 3 Reference/full-roster suite               6 files / 53 tests PASS
fresh independent automation audit                EXACT_AGREEMENT / gapCount=0
git diff --check                                  PASS
reviewer worktree before report                   CLEAN
```

The fresh independent audit recomputed:

```text
staticSkillCount=943
dynamicSkillCount=1
totalIdentityCount=944
programCount=943
authoringCardCount=72
authoringAbilityCount=117
sourceEvidenceOverlayCount=27
sourceEvidenceOverlayAbilityCount=38
sourceGroundedCount=99
semanticBlockedCount=845
contractMappedCount=99
explicitBlockCount=845
capabilityCount=32
blockedPacketCoverageCount=845
runtimeRequestCount=23
```

Classification is:

```text
READY_EXISTING_CONTRACT=0
READY_GENERIC_EXTENSION=86
SPECIAL_HANDLER_CANDIDATE=13
SOURCE_EVIDENCE_REQUIRED=845
```

Independent structural inspection of the six Bazett reviewed-special identities confirmed all six have empty `inheritedAcceptanceContracts`:

```text
master.bazett.skill.s1a  SPECIAL_HANDLER_CANDIDATE
master.bazett.skill.s1d  SPECIAL_HANDLER_CANDIDATE
master.bazett.skill.s2   SPECIAL_HANDLER_CANDIDATE
master.bazett.skill.s3   SPECIAL_HANDLER_CANDIDATE
master.bazett.skill.s4   SPECIAL_HANDLER_CANDIDATE
master.bazett.skill.s5   SPECIAL_HANDLER_CANDIDATE
```

## Accepted burn-down

Relative to the accepted Chaos baseline:

```text
source-grounded identities: 89 -> 99   (+10)
source-evidence blocked:     855 -> 845 (-10)
structured semantic abilities: 138 -> 155 (+17)
```

Bazett contributes four generic-extension identities and six reviewed-special identities. No runtime contract or Gate is accepted by this review.

## Lane isolation / non-promotion

No production runtime, server, client, compiler, or gameplay authoring migration is changed by this source-evidence refresh. This review does not promote F2, F3, F4, any runtime Gate, migration acceptance, or full-roster closure.

The result is limited to accepting the repaired ten-identity Bazett source-evidence normalization into the F1 full-roster intake. Further source-evidence batches and separately authorized reviewed-special/runtime work remain outstanding.
