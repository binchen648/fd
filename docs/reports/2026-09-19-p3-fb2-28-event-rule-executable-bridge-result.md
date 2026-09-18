# P3-FB2-28 Event Rule Executable Bridge Result

Role: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Date: 2026-09-19

## Baseline

- Exact A dispatch Base: `4bee0f529f213ca0a5fb72f718dcc9d3113ff508`
- Branch: `codex/b2-p3-fb2-28-event-rule-bridge`
- Authoritative F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Formal recovery overlap at dispatch: `127/944` (`13.45%`), `817` remaining.

This is B2 runtime capability work only. It earns zero frozen migration credit and does not authorize any downstream consumer migration before fresh independent R acceptance and later A capability synchronization.

## Implemented capability

FB2-28 adds one identity-free event-card rules boundary without importing Reference runtime behavior or routing by canonical identity, name, printed text, Reference handler, F1 hash, owner identity, or downstream Lostbelt identity.

### Rules-only event definitions

- Adds optional manifest channel `authoringEventRuleFiles`.
- Adds exact discriminator `event_rule_definition_archive`.
- Event-rule archives compile into a separate executable `eventRules` map and do not create player cards, characters, decks, fallback command spells, masters, servants, event-set product entries, or ordinary event product cards.
- Missing/wrong/near-match discriminators, mixed/non-event cards, player initial placement, deck/public-information surfaces, malformed event metadata, missing event triggers/controllers, and unsupported event-controller declarations fail closed at both content and executable compiler boundaries.
- Event-rule metadata participates in executable definition hashing.

### Generic event lifecycle

- Adds authoritative rules-visible event zones: event deck, event discard, rules-only outside-game, and battlefield placements.
- Adds deterministic structural `event_card` target selection by event zone, metadata tag, and event-set membership.
- Adds transactional multi-event movement through `move_event_card` and source-event movement through `move_source_event`.
- Selections use revisioned server-owned tokens; stale tokens fail closed after any successful event-zone mutation.
- Invalid destination/batch validation completes before mutation.
- Battlefield placement restores/preserves event ID, location, visibility, printed VP, static battle modifiers, and location-scoped event play forbids from authoritative catalog metadata.
- A discarded event returning to the battlefield reuses its saved authoritative battlefield `locationId` when no explicit destination override is supplied; an explicit valid `locationId` still takes precedence.
- Existing ordinary static events remain selectable without inventing executable rule ownership or a player-card instance.

### Event placement executable source

- Executable event placements receive a server-owned stable `ruleInstanceId` only when an executable event definition exists.
- Optional `ruleControllerPlayerId` is explicit placement state, never inferred from card ID/name/text.
- Neutral event rules can use trusted `event_player` only for the current authoritative event; no persistent owner/controller is invented.
- Every executable event-rule ability requires an explicit trigger plus a structural controller source at authoring/compiler acceptance; placement-controller rules additionally require an explicit valid placement controller at runtime.
- Generic source-location predicates support event-location and combat-at-source-battlefield checks.
- Event triggers flow through the existing trusted event gateway and inherit processed-event replay idempotency.
- Current FB2-28 event-source execution intentionally stays narrow: automatic trigger/rule abilities with no target/cost/create/lifecycle/rule-modifier envelope. Unsupported shapes fail closed rather than silently broadening runtime authority.

## R60 revision closure

Fresh R60 returned `IMPLEMENTATION_NEEDS_REVISION` against rejected Candidate `360c561be219aa8c488f0b826c2647e32ec5bd5b` for one semantic gap: battlefield -> discard preserved the authoritative battlefield location, but discard -> battlefield required callers to redundantly supply `options.locationId` instead of restoring the saved location.

The revision is intentionally blocker-only:

- battlefield destination validation now resolves each selected event's destination as `explicit override -> saved candidate/placement location -> reject`;
- every resolved destination is validated before any source mutation, preserving transactional batch behavior;
- events from deck/outside-game that have no saved battlefield location still require an explicit destination and do not guess one;
- the R60 reproduction is now a production regression: hidden event at `miyama_town` moves battlefield -> discard -> battlefield with no location override and restores location, visibility, VP, and battle modifiers;
- the same regression confirms an explicit valid `shinto` override still wins over the saved location.

No other FB2-28 runtime contract or product surface was widened by the revision.

## Product isolation

There is no Candidate diff under:

- `data/authoring/**`
- `data/packs/**`
- `data/generated/**`
- `data/phase3/**`
- `apps/**`

Existing playtest product output remains deterministic and unchanged. No downstream Hisui/Kadoc/Kiara/Ophelia/Wodime consumer is authored or credited in this B2 task.

## Validation

Final B2 validation:

- `npm ci --offline`: PASS, 239 packages, 0 vulnerabilities.
- `npm run typecheck`: PASS.
- focused content/compiler/runtime FB2-28 suite: **`3 files / 157 tests PASS`**.
- official `npm run test:ci`: **`141 files / 991 tests PASS`**.
- rules `src + core + regression`: **`81 files / 488 tests PASS`**.
- final eleven-round MatchSession gate: approximately **4029 ms**, within the unchanged 5000 ms timeout.
- `npm run content:validate`: PASS, `7 masters / 7 servants / 20 events / 0 blocking issues`.
- `npm run content:compile`: PASS with the same product counts.
- `npm run verify:generated-content`: PASS with unchanged hashes:
  - library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- locked Reference verification: PASS at exact `b2f9fa15fba07c63530bbf4612b03b8b704755f9`, clean.
- client production build: PASS; existing Vite `node:crypto` browser-externalization warning only.
- Phase 3 coverage matches the exact R59 accepted baseline: `111 archives / 150 cards / 255 abilities`, compiled `76 / 14 / 0`, routing `22/3/135/0/95/137`.
- automation audit matches the exact R59 accepted baseline: `135/3/95/20`.
- `git diff --check`: PASS.
- identity/F1/Reference-handler routing grep over changed production sources: no match.

A separate exploratory old-event representative run produced `107/108`: all MatchSession/content-bridge/combat/complex-event behavior passed; the only failure was the existing Drake authoring evidence test requiring three absolute external image files under `D:/fd/chm-extract/...`, which are absent in this environment. Base-to-Candidate diff for Drake authoring and that test is empty. This is not an FB2-28 runtime regression and the official CI gate is green.

## Frozen accounting

Mechanical F1/Base/Candidate comparison:

- denominator: `944`;
- Base authoring cards: `150`;
- Base frozen overlap: `127/944`;
- Candidate authoring cards: `150`;
- Candidate frozen overlap: `127/944`;
- frozen additions: `[]`;
- frozen removals: `[]`;
- duplicate frozen canonical IDs: `[]`.

Therefore FB2-28 earns **zero frozen migration credit**. Formal recovery accepted remains **`127/944`**, with **`817`** remaining.

The twelve single-gap rows named in the A dispatch remain only a capability unlock-yield upper bound. A must recompute dependency completeness after fresh independent R acceptance and A synchronization; this Candidate does not claim that all twelve are migration-ready.

Historical P3-FM09 remains `MIGRATION_BLOCKED`. No FM10 is started or unblocked. Existing stacked PRs are not merged or retargeted.

## Candidate file scope

Production/runtime/compiler/type changes are limited to:

1. `packages/content/src/playtest-pack-loader.ts`
2. `packages/rules/src/ability/executable-card-pack.ts`
3. `packages/rules/src/ability/event-rule.ts`
4. `packages/rules/src/ability/interpreter.ts`
5. `packages/rules/src/ability/loader.ts`
6. `packages/rules/src/ability/types.ts`
7. `packages/rules/src/schema/game.ts`
8. `packages/rules/src/index.ts`

Focused tests are limited to:

9. `packages/content/src/__tests__/playtest-pack-loader.test.ts`
10. `packages/rules/tests/executable-card-pack.test.ts`
11. `packages/rules/tests/regression/fb2-event-rule-executable-bridge.test.ts`

Plus this B2 result report only.

## Next process step

Open one B2 PR against the exact A dispatch branch, then use a fresh ChatGPT conversation and fresh R worktree for independent review. Until R returns `IMPLEMENTATION_ACCEPTED_CANDIDATE` and A later synchronizes that capability acceptance, formal status remains `127/944` with zero FB2-28 migration credit.