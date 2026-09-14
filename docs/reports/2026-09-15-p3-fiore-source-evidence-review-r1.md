# Phase 3 Full-Roster Independent Review — Fiore Source Evidence R1

- Date: 2026-09-15
- Role: Codex R
- Scope: Fiore source-evidence intake review only; no candidate repair
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- S candidate: `23bdad59e8cf08dd301816559ccdda493bded281`
- A audit head: `fb7362c603e940c165c576614988d50bfe39d7ea`
- S PR: `#63`
- A PR: `#64`
- Overall verdict: `INTAKE_NEEDS_REVISION`

## Fresh reviewer verification

The candidate is mechanically stable and provenance-complete:

```text
npm run typecheck                                 PASS
Phase 3 Reference/full-roster suite               6 files / 63 tests PASS
fresh independent automation audit                EXACT_AGREEMENT / gapCount=0
independent development-source replay             9 / 9 PASS
sourceGroundedCount                               129
semanticBlockedCount                              815
sourceEvidenceOverlayCount                        57
sourceEvidenceOverlayAbilityCount                 93
production diff under packages/ or apps/          NONE
```

The accepted baseline remains the Ophelia checkpoint (`120 / 824`) until the F1 finding below is repaired and independently re-reviewed.

## Blocking finding

### F1-FIORE-001 — Determination hides its printed target-selection and Transcend-entry timing

- Severity: blocking F1 semantic/dependency-shape defect
- Ability: `master.fiore.skill.s6` (`Determination` / `决意`)
- Printed development source: `此牌超越时，选择一名战果高于你的对手。若你于本回合战胜了他，获得2点战果。`

The first structured subability currently models the printed choice with:

```text
effect.type=choose_player
payloadKey=targetPlayerId
```

However the Phase 3 normalizer's canonical selection vocabulary recognizes `choose_players` (plural, with min/max counts) and does not recognize `choose_player`. The generated normalized axes for s6 therefore contain no target-selection or interaction axis for the printed mandatory choice.

Consequently s6's generated dependency graph omits the generic target/pending-interaction dependency needed to choose exactly one higher-VP opponent. The identity remains reviewed-special because of `cycle_state_transition`, so the omission does not accidentally make it migration-ready, but F1 dependency membership is still incomplete.

The same subability also represents `此牌超越时` only indirectly through `cycle_state_transition.operation=bind_target_on_enter`. It does not carry an explicit `cycle_state.entered` trigger plus source-definition binding like the Transcend-entry setup already used for Fiore s5/s7. This hides the exact timing at which the printed choice must occur.

Minimum repair:

1. represent the choice through the canonical single-choice form, e.g. `choose_players` with `minCount=1`, `maxCount=1`, an opponent/higher-VP filter and a result binding;
2. explicitly bind the choice to the s6 Transcend-entry event (`cycle_state.entered` + exact source definition or equivalent canonical structural trigger);
3. keep the pair-state transition reviewed-special;
4. regenerate FS03/FS04/FS05 and add focused regressions proving target/interaction/trigger dependencies are present without inheriting any runtime acceptance contract.

## Reviewed non-blockers

### Fiore s5/s7 “must be additional-play” is not an ADD_TO_ATTACK acceptance defect

Reviewer compared the candidate with the already reviewed Card Action lane. Existing `append_only_rule` semantics are explicitly excluded from the accepted `CARD_ACTION_ADD_TO_ATTACK` Gate C as `out_of_scope:append_only_rule_marker`; that contract certifies actual attachment/add-to-attack execution, not the passive rule marker that constrains how a card may be played.

Therefore the Fiore s5/s7 `card_play_mode / require_additional_play` rule modifier is not required to inherit `CARD_ACTION_ADD_TO_ATTACK`, and zero inherited contracts is the correct conservative result. No blocker is raised for this point.

### Other Fiore identities

- s2 exposes movement prohibition through Modifier + Movement dependencies.
- s3 exposes the normal/climax mana-gain cap through Modifier + Resource Numeric.
- s4 exposes its combat condition and power locking through Battle/Condition/Modifier/Power.
- s5 remains reviewed-special for terrain-position adjustment while separately exposing source-card, cost, movement and trigger dependencies.
- s7 remains generic-extension only, with zero inherited contracts, for its source-card setup/additional-play/cost/skill-power rule.
- s1, s1a and ascension remain reviewed-special Transcend-state semantics.

No additional blocking dependency defect was found in those rows during R1 review.

## Provenance judgment

Development source replay independently decoded the JavaScript `desc` strings at Fiore lines 218–226 and compared them against the stored snapshots:

```text
Fiore records=9
whole-file SHA mismatch=0
locator/sourceText mismatch=0
sourceText SHA mismatch=0
```

The source authority mechanism itself is accepted for this candidate.

## Checkpoint result

- Existing accepted F0/F1 baseline through Ophelia remains intact.
- Accepted source-grounded checkpoint remains `120 / 944`.
- Accepted source-evidence-blocked count remains `824 / 944`.
- Fiore candidate arithmetic `129 / 815` is internally consistent but **not accepted yet**.
- Fiore R1 verdict: `INTAKE_NEEDS_REVISION`.

No production fix was made by reviewer R.
