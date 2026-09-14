# Phase 3 Full-Roster Independent Review — Wodime Source Evidence R1

- Date: 2026-09-15
- Role: Codex R
- Scope: Wodime source-evidence intake review only; no candidate repair
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- S candidate: `fd0711d2a3215e27a17f57a9a20771417376f21c`
- A audit head: `17cb0c431843de3fa4ced11416ab21e473a2e672`
- S PR: `#54`
- A PR: `#55`
- Overall verdict: `INTAKE_NEEDS_REVISION`

## Fresh verification

The candidate is mechanically stable and the new development-text provenance lane is independently consistent:

```text
npm ci                                            PASS
npm run typecheck                                 PASS
Phase 3 Reference/full-roster suite               6 files / 57 tests PASS
fresh independent automation audit                EXACT_AGREEMENT / gapCount=0
locked Reference                                  CLEAN at b2f9fa15...
production diff under packages/ or apps/          NONE
```

The audit recomputes `110` source-grounded identities and `834` source-evidence-blocked identities. These counts are internally consistent, but F1 acceptance also requires the capability graph to expose the source-grounded semantic dependencies instead of hiding them inside opaque reviewed-special payload fields.

## Provenance judgment

The lower-priority `DEVELOPMENT_TEXT` authority is acceptable in principle for this batch. The candidate binds all eleven Wodime records to the allowlisted `Fate_Domination-开发版/data_masters.js` snapshot with whole-file SHA-256 `c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825`, exact locators, embedded sourceText hashes, and exact locked-Reference printed-text hashes. A independently validates malformed/mutated snapshots fail closed.

No blocker is raised against the provenance mechanism itself.

## Blocking findings

### F1-WODIME-001 — event-deck dependency is omitted from Lostbelt/event-card semantics

- Severity: blocking F1 capability-membership defect
- Affected examples: `master.wodime.skill.s4`, `s5`, and the event-card definitions `s6`–`s9`
- Mapper: `scripts/phase3-reference/map-phase3-capabilities.ts`

The source-grounded records explicitly manipulate or define event-deck/event-card behavior. `s4` resolves/removes/shuffles/replaces Atlantis events; `s5` draws, reveals, optionally replaces, and shuffles Olympus events. Yet their structural tokens `EVENT_CARD_RULE` and `LOSTBELT_EXPANSION` are classified only as reviewed-special and do not contribute `GENERIC_EVENT_DECK`.

For example, `s5` currently produces only:

```text
requiredCapabilities=[REVIEWED_SPECIAL_HANDLER]
```

although its printed rule directly draws/replaces/shuffles event cards.

Impact: later B/B2 dispatch can see only “special handler” and miss the existing Event Deck subsystem dependency. This repeats the same class of F1 defect previously caught in Chaos where source semantics existed but capability membership was incomplete.

Minimum repair: map the event-deck-bearing Lostbelt/event-card semantic family to `GENERIC_EVENT_DECK` in addition to `REVIEWED_SPECIAL_HANDLER`, add identity-free mapping regressions, regenerate FS04/FS05, and rerun A.

### F1-WODIME-002 — post-power conditional Defeat rules hide battle/trigger/condition dependencies

- Severity: blocking F1 semantic-axis / capability-membership defect
- Affected: `master.wodime.skill.s7`, `s8`, `s9`

The development source says these Olympus event rules resolve after power calculation and conditionally cause Defeat. R1 stores the timing and filters only as nested fields inside one opaque `event_card_rule` effect:

```text
timing=after_power_calculation
defeatFilter=...
```

The normalizer therefore emits no timing trigger, no condition axes, and no battle axis. Generated capability rows for `s7`–`s9` contain only:

```text
REVIEWED_SPECIAL_HANDLER
```

This omits the explicit battle-resolution dependency and filter predicates such as power below 21, zero command seals spent this round, or deployment during outpost.

For `s7`, the printed “Wodime's opponents here cannot ignore Defeat” rule is also embedded as `defeatImmunityOverride` inside the special effect, so no modifier/battle dependency is exposed.

Impact: the dependency graph is too weak to route or review the actual battle integration required by these source-grounded rules.

Minimum repair: expose the post-power resolution as an explicit combat/battle trigger (or equivalent canonical structural event), express each printed predicate through structured conditions, and represent the Defeat-immunity override through a rule modifier or another canonical modifier-bearing structure. Keep the event-card action reviewed-special; do not implement runtime behavior in S.

### F1-WODIME-003 — Astronomical Sphere compresses three independent printed restrictions into an opaque special payload

- Severity: blocking F1 dependency-shape defect
- Ability: `master.wodime.skill.s2`

The printed source independently states:

1. the card may be played in the combat phase when the current round was secretly recorded;
2. the usual 8-mana requirement is waived for this rule;
3. during power calculation Wodime's other attacks are ignored;
4. the card cannot enter play by any other method.

R1 records items 2–4 only inside `astronomical_sphere_rule`. The resulting axes expose `COMBAT` timing and the secret-round condition, but no battle axis and no modifier dependency. Its required capability list is only:

```text
CARD_ACTION_PLAY
GENERIC_CONDITION_EVALUATION
REVIEWED_SPECIAL_HANDLER
```

Impact: the capability graph hides the power-resolution and entry-legality dependencies that must be reviewed before any runtime dispatch.

Minimum repair: preserve the reviewed-special sphere rule while separately exposing the mana-requirement override, other-attack power-resolution rule, and exclusive-entry restriction through canonical rule-modifier/lifecycle or other structural fields that produce the relevant dependencies. Do not grant an existing runtime acceptance contract.

## Non-blocking observations

- All eleven Wodime identities correctly remain `SPECIAL_HANDLER_CANDIDATE`.
- All eleven inherit zero accepted current runtime contracts.
- The development-source snapshot mechanism is fail-closed and independently reproducible.
- `110 / 834` is a valid candidate arithmetic result but is not accepted as the next F1 checkpoint until the dependency defects above are repaired and re-reviewed.
- No production runtime code was changed by S or A.

## Checkpoint result

Existing accepted F0/F1 baseline through Bazett remains intact at `99 source-grounded / 845 source-evidence blocked`.

Wodime R1 result: `INTAKE_NEEDS_REVISION`.
