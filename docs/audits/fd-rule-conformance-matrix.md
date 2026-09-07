# FD Rule Conformance Matrix

- Date: 2026-09-07
- Acceptance baseline: `docs/plans/fd-rules-conformance-and-acceptance.md`
- Canonical rules: `docs/rules/FD-Game-Rules-Final.md`
- Runtime inventory source: `docs/audits/fd-flow-runtime-inventory.md`
- Git baseline last verified 2026-09-07: `D:\fd` is a Git worktree on `main` at short HEAD `1dc6196`.

## Status Vocabulary

Only these statuses are valid in this matrix:

`IMPLEMENTED_UNVERIFIED`, `COMPONENT_VERIFIED`, `SCENARIO_VERIFIED`, `E2E_VERIFIED`, `FAILED`, `BLOCKED`, `NOT_VERIFIED`.

Implementation metadata such as `FULL`, `PARTIAL`, `HOST_ADJUDICATED`, `automatic`, `supported`, `complete`, or `Production Ready` is not an acceptance status.

## Document Roles

| Document | Role | Boundary |
|---|---|---|
| `docs/rules/FD-Game-Rules-Final.md` | WHAT: canonical gameplay requirements | Does not define proof, implementation phase status, or release readiness. |
| `docs/plans/fd-rules-conformance-and-acceptance.md` | HOW TO PROVE: Rule/Card/Flow acceptance baseline | Does not change gameplay rules. |
| `docs/plans/fd-card-engine-stabilization-plan.md` | HOW TO MIGRATE: stabilization implementation plan | Must reference the acceptance baseline instead of redefining rule truth. |

## Current Governance Answers

| Question | Current answer |
|---|---|
| How is "implementation complete" currently defined? | Inconsistently. `docs/spec/engine-capability-matrix.md`, content metadata, and reports use `FULL`, `PARTIAL`, `HOST_ADJUDICATED`, `automatic`, `unsupported`, `complete`, and `Production Ready`. `docs/audits/fd-card-runtime-architecture-audit.md` already warns that parse/handler coverage is not behavioral proof. |
| Who can announce PASS? | The new acceptance baseline requires an independent Reviewer. Older reports sometimes self-report `PASS`; those are test or slice outcomes, not final acceptance. |
| Do green tests automatically mean complete? | No. Existing `verify:stabilization` aggregates test suites, but it has no Rule ID coverage matrix and cannot by itself imply release readiness. |
| Is there Rule -> Test mapping? | Partial and informal. Tests exist for phase, movement, play, combat, scoring, projection, replay, and complex skills, but they are not mapped to canonical Rule IDs. |
| Is there a Card Acceptance Contract? | Yes as a baseline in `fd-rules-conformance-and-acceptance.md`; legacy card reports do not consistently apply it. |
| Is there a Flow Acceptance Contract? | Yes as a baseline in `fd-rules-conformance-and-acceptance.md`; existing flow tests are not yet organized as Golden Flow contracts. |
| Are Golden Card / Golden Flow definitions present? | Golden Card candidates exist in `docs/audits/fd-card-runtime-architecture-audit.md`; Golden Flow contracts were not formalized before this integration. |
| Is there a Reviewer Gate? | Yes in the new acceptance baseline; old scripts do not enforce independent review. |
| Are there conflicting old completion definitions? | Yes: `FULL`, `automatic`, `complete`, `supported`, `Production Ready`, and report-local `PASS` claims conflict when used as final acceptance. |

## Runtime Owner Map

| Rule Area | Runtime Owner | Entry Point | Call Path | Owner Risk |
|---|---|---|---|---|
| Global flow | `packages/rules/src/core/phase-machine.ts::getNextPhase`, `packages/rules/src/core/game-loop.ts::stepGameLoop`, `packages/rules/src/match-session.ts::advanceAutomatedFlow` | `stepGameLoop`, `MatchSession.dispatchPlayerAction` | test/sim -> `stepGameLoop`; production room -> `MatchRoom.dispatchCommand` -> `MatchSession.dispatchPlayerCommand` | `MULTIPLE_RUNTIME_OWNERS`; `SECONDARY_RUNTIME_PATH` |
| Player order | `phase-machine.ts::getEligibleActionSeats`, `match-session.ts` priority orchestration | `getEligibleActionSeats`, `projectToClientState` | state priority -> legal actions/projection | `MULTIPLE_RUNTIME_OWNERS` |
| Action ability windows | `ability/interpreter.ts::getLegalActions`, `dispatchAbilityCommand`, `processEvent` | `MatchSession.getPlayerView`, `dispatchPlayerAction` | room/server/client -> MatchSession -> ability interpreter | Legacy mutation path retained |
| Normal move | `ability/interpreter.ts` plus `core/movement.ts::movePlayer` | `dispatchAbilityCommand`, `movePlayer` | formal ability command or seeded game-loop action | `MULTIPLE_RUNTIME_OWNERS`; `SECONDARY_RUNTIME_PATH` |
| Normal play batch | `ability/interpreter.ts::playBatch`, `getLegalActions`, `playAbilityCardBatch`; `core/card-play.ts` legacy pair play | `dispatchAbilityCommand`, `playAbilityCardBatch`, `playServantCardPair` | MatchSession -> interpreter; seeded/core tests -> card-play/game-loop | `SECONDARY_RUNTIME_PATH` |
| Passive / trigger | `ability/interpreter.ts::processEvent`, `collectTriggeredAbilities` | `processAbilityEvent`, `advanceAbilityPhase`, combat resolver events | committed events -> scan abilities -> response/effect execution | Open string event bus; no closed registry |
| Unique / once limits | `ability/interpreter.ts::abilityLimitReached`, `perGamePlayLimit` | `getLegalActions`, `dispatchAbilityCommand` | legal action query and dispatch revalidation | Implemented but key semantics vary by card/ability |
| Residual / lifecycle | `ability/interpreter.ts::installOngoing`, `cleanupOngoing`; `match-session.ts` cleanup logic; `extended-effects.ts` ad hoc state | `executeAbility`, `advanceAbilityPhase`, `advanceAutomatedFlow` | ability resolution -> ongoingEffects/card zones/modeState | `MULTIPLE_RUNTIME_OWNERS`; lifecycle fragmented |
| Defeat | `combat-resolver.ts::cannotWinBattleThisRound`; `ability/interpreter.ts` active status checks | `resolveBattlefield`, `getLegalActions` | battle resolver excludes winners; legality checks status | Partial; canonical VP-timeline defeat expiry not fully proven |
| Power layers | `ability/interpreter.ts::calculateCardPower`, `combat-resolver.ts::buildParticipantBreakdown`, event/situation modifier helpers | `resolveBattlefield` | card power + terrain + modifiers -> participant breakdown | `MULTIPLE_RUNTIME_OWNERS`; source/lifecycle fragmentation |
| Battle winner | `combat-resolver.ts::resolveBattlefield`, `buildBattleResult` | `resolveBattlefield` | MatchSession battle auto-flow -> combat resolver -> ability events | Canonical `winnerPlayerIds` now exists; legacy `winnerPlayerId` remains as compatibility/display field |
| VP / scoring | `combat-resolver.ts::buildDefaultVpAdjustments`, `scoring-resolver.ts::applyBattleScoring` | `resolveBattlefield`, `applyBattleScoring` | battle result -> scoring pass -> player VP/reasons | `MULTIPLE_RUNTIME_OWNERS`; some canonical round 8/9/10 VP elimination not proven |
| Round cleanup | `match-session.ts::advanceAutomatedFlow`, `ability/interpreter.ts::cleanupOngoing`, `core/game-loop.ts::runCleanupPhase` | `advanceAbilityPhase`, `stepGameLoop` | phase advance -> cleanup/scoring/discard | `MULTIPLE_RUNTIME_OWNERS`; `SECONDARY_RUNTIME_PATH` |
| Hidden information | `ability/interpreter.ts::projectAbilityState`, `match-session.ts::projectToClientState`, `projection/player-match-view.ts::projectPlayerMatchView` | player projection APIs | state -> player/spectator view | `MULTIPLE_RUNTIME_OWNERS`; projection paths differ |
| Projection | `MatchSession.projectToClientState`, `projectAbilityState`, `projectPlayerMatchView`, client `engine-bridge.ts` | room/server projections and local client fixtures | server -> websocket -> client; local fixture bridge | `MULTIPLE_RUNTIME_OWNERS`; `SECONDARY_RUNTIME_PATH` |
| Reconnect | `match-room.ts::reconnect`, `match-room-hub.ts::reconnect`, `apps/server/src/match-server.ts` websocket path | websocket connect with reconnect token | browser/server -> hub -> room -> projection | Transport verified narrowly; active-flow restore not proven |
| Effect result binding | `ability/resolution-dataflow.ts::validateResolutionDataFlow`, `executeResolution`; compiler integration in `ability/executable-card-pack.ts` | `compileExecutableCardPack`, `executeResolution` | content compile -> data-flow validator; synthetic runtime -> primitive registry | Infrastructure only; production interpreter not migrated |

## Rule Conformance Matrix

Rule IDs marked `CANDIDATE` are stable core requirements derived from `FD-Game-Rules-Final.md`; the canonical rules file does not yet define a full `FD-*` ID system.

## Coverage Denominator

The status counts include rules not yet represented as full matrix rows. This prevents `NOT_VERIFIED = 0` from meaning only "no mapped row is unverified."

- Canonical candidate rule units: 63
- Matrix-covered rule units: 19
- Not yet mapped rule units: 44
- Coverage: 19 / 63

Current status counts across the full denominator:

| Status | Count |
|---|---:|
| `E2E_VERIFIED` | 0 |
| `SCENARIO_VERIFIED` | 2 |
| `COMPONENT_VERIFIED` | 13 |
| `IMPLEMENTED_UNVERIFIED` | 4 |
| `FAILED` | 0 |
| `BLOCKED` | 0 |
| `NOT_VERIFIED` | 44 |

These 63 units are candidate acceptance units derived from stable canonical rule sections and current runtime surface. They are not a substitute for adding formal IDs to `FD-Game-Rules-Final.md`.

| Area | Candidate Units | Matrix-Covered | Not Yet Mapped |
|---|---:|---:|---:|
| Flow / phase / round structure | 12 | 1 | 11 |
| Player order / simultaneous order | 4 | 1 | 3 |
| Ability windows / decisions / costs | 7 | 1 | 6 |
| Movement | 4 | 1 | 3 |
| Normal play / play batch | 5 | 1 | 4 |
| Passive / trigger / unique | 5 | 2 | 3 |
| Residual / close / lifecycle | 7 | 3 | 4 |
| Defeat | 3 | 1 | 2 |
| Power / battle / VP | 8 | 3 | 5 |
| Hidden information / projection / reconnect / true name | 6 | 4 | 2 |
| Effect result binding | 2 | 1 | 1 |
| **Total** | **63** | **19** | **44** |

### Not Yet Mapped Rule IDs

| Rule ID | Reason Not Yet Mapped |
|---|---|
| FD-FLOW-002-CANDIDATE | Setup/start-player contract not yet traced to runtime owner and evidence. |
| FD-FLOW-003-CANDIDATE | Preparation mana and command setup require separate Gate A/B mapping. |
| FD-FLOW-004-CANDIDATE | Advance situation draw/application needs positive, negative, and replay evidence. |
| FD-FLOW-005-CANDIDATE | Action turn boundary and handoff between players is only indirectly covered. |
| FD-FLOW-006-CANDIDATE | Battle declaration selection and skipped battlefields need a dedicated contract. |
| FD-FLOW-007-CANDIDATE | Cleanup scoring order needs one ordered event-trace contract. |
| FD-FLOW-008-CANDIDATE | Round-end threshold/final transition needs canonical Gate B/E2E evidence. |
| FD-FLOW-009-CANDIDATE | Direction vote and first-player rotation are not mapped. |
| FD-FLOW-010-CANDIDATE | Optional/disabled location and Moon Holy Grail threshold behavior need mapping. |
| FD-FLOW-011-CANDIDATE | Event placement, discard, and recycle flow is not mapped as a rule. |
| FD-FLOW-012-CANDIDATE | Phase-transition event trace and causation identity are not mapped. |
| FD-ORDER-002-CANDIDATE | Simultaneous/tied ordering semantics are not separated from general order tests. |
| FD-ORDER-003-CANDIDATE | Response-window player order needs its own proof contract. |
| FD-ORDER-004-CANDIDATE | Eliminated-player skip across projections and reconnect is not mapped. |
| FD-ABILITY-002-CANDIDATE | Wrong-phase fail-closed behavior is tested in fragments, not mapped as a rule. |
| FD-ABILITY-003-CANDIDATE | Source active/closed legality is not mapped across play, trigger, and projection. |
| FD-ABILITY-004-CANDIDATE | Cost/target atomicity needs a cross-primitive rule row. |
| FD-ABILITY-005-CANDIDATE | Pending-decision transaction segmentation is not mapped. |
| FD-ABILITY-006-CANDIDATE | Optional response pass/decline behavior is not mapped across all window kinds. |
| FD-ABILITY-007-CANDIDATE | Unsupported/host-adjudicated capability status is metadata, not acceptance evidence. |
| FD-MOVE-002-CANDIDATE | Occupancy and capacity rules need dedicated positive/negative evidence. |
| FD-MOVE-003-CANDIDATE | Redeploy movement semantics are not mapped. |
| FD-MOVE-004-CANDIDATE | Move-enter trigger interactions are not mapped. |
| FD-PLAY-002-CANDIDATE | Exact two-card simultaneous batch proof is not mapped to a full scenario. |
| FD-PLAY-003-CANDIDATE | Face-down play cost/effect/damage rules need a standalone contract. |
| FD-PLAY-004-CANDIDATE | Extra play and add-to-attack effects are not mapped. |
| FD-PLAY-005-CANDIDATE | Insufficient hand and pass-while-playable negatives are not mapped. |
| FD-PASSIVE-002-CANDIDATE | Hidden passive reveal timing lacks Gate B/C mapping. |
| FD-PASSIVE-003-CANDIDATE | Forced-vs-optional trigger ordering is not mapped. |
| FD-TRIGGER-001-CANDIDATE | Trigger de-duplication/idempotency is not mapped as a rule. |
| FD-RESIDUAL-002-CANDIDATE | Residual attack contribution across later rounds is not mapped separately. |
| FD-RESIDUAL-003-CANDIDATE | Source-close protection for residual effects is not mapped. |
| FD-CLOSE-002-CANDIDATE | Skill/non-skill/temporary close destinations are not mapped as one contract. |
| FD-LIFECYCLE-001-CANDIDATE | Duration expiry by phase/round/source state is not mapped. |
| FD-DEFEAT-002-CANDIDATE | Defeated players may still use legal abilities; play-vs-ability split needs mapping. |
| FD-DEFEAT-003-CANDIDATE | Defeat expiry and VP-timing semantics are not mapped. |
| FD-POWER-002-CANDIDATE | Source closed -> modifier removed is not mapped across stores. |
| FD-POWER-003-CANDIDATE | Full canonical power layer order needs an event trace. |
| FD-BATTLE-002-CANDIDATE | Military result for ties, ignored losses, and excluded players is not mapped. |
| FD-VP-002-CANDIDATE | Round 8/9/10 VP and final scoring thresholds are not mapped. |
| FD-VP-003-CANDIDATE | Personal rewards, non-sole winner rewards, and reward source audit need mapping. |
| FD-HIDDEN-002-CANDIDATE | Servant identity and true-name projection matrix is not mapped end to end. |
| FD-RECONNECT-002-CANDIDATE | Reconnect during active pending flow is not mapped. |
| FD-RESULT-BINDING-002-CANDIDATE | Real-card result binding migration is not mapped beyond infrastructure. |

| Rule ID | Canonical Requirement | Runtime Owner | Runtime Entry Point | Positive Evidence | Negative Evidence | Integration Evidence | Scenario Evidence | E2E Evidence | Current Status | Known Gaps |
|---|---|---|---|---|---|---|---|---|---|---|
| FD-FLOW-001-CANDIDATE | Round order is preparation -> advance -> action -> battle -> scoring -> round end -> elimination/final -> player order rotation. | Flow Engine / MatchSession | `stepGameLoop`; `advanceAbilityPhase`; `MatchSession.advanceAutomatedFlow` | `packages/rules/tests/core/phase-machine.test.ts`; replay timeline tests | eliminated players excluded in phase-machine tests | `packages/rules/tests/regression/replay.test.ts` | seeded scenarios cover limited phase chain | Playwright clickflow touches current UI, not full canonical round | `COMPONENT_VERIFIED` | No Golden Flow complete action phase; no 11-round canonical run; multiple owners. |
| FD-ORDER-001-CANDIDATE | Current first player and direction determine per-phase player order; eliminated players are skipped. | Phase Machine / MatchSession | `getEligibleActionSeats`; `projectToClientState` | phase-machine eligible seat tests | eliminated seat negative tests | MatchSession priority projection tests | complex regressions use priority seat | none proving order across browsers | `COMPONENT_VERIFIED` | Direction vote/rotation not proven; no browser order contract. |
| FD-ABILITY-001-CANDIDATE | Action phase abilities may be used before move, after move, and after play; phase abilities require correct phase and source activation unless passive. | Ability Interpreter | `getLegalActions`; `dispatchAbilityCommand`; `canActivate` | authoring interpreter phase tests; complex skill regressions | wrong-phase rejection in attack-play classifier tests | MatchSession dispatch tests | complex-skill regression matrix exists but is not yet a Rule ID Gate B contract | browser clickflow dispatches selected actions only | `COMPONENT_VERIFIED` | Not all real cards migrated; no Gate C for binding-driven abilities; Gate B contract still missing. |
| FD-MOVE-001-CANDIDATE | Normal move is once per action turn, forward along arrows, pays total path cost, cannot move while engaged; effect move has separate semantics. | Movement Runtime / Ability Interpreter | `movePlayer`; `getReachableLocationsAlongArrows`; `dispatchAbilityCommand` | `packages/rules/tests/core/movement.test.ts` | engaged normal move blocked; unreachable destinations rejected in authoring tests | MatchSession regressions for dash/recon | Drake/Ereshkigal complex movement scenarios exist but are not yet Golden Flow evidence | no complete browser move/reconnect contract | `COMPONENT_VERIFIED` | `core/movement.ts` and interpreter both implement movement; capacity/redeploy combinations incomplete. |
| FD-PLAY-001-CANDIDATE | Normal play is a simultaneous batch, usually exactly two attacks; insufficient cards play all legal cards; no voluntary pass while playable. | PlayBatch Runtime | `playBatch`; `playAbilityCardBatch`; `getLegalActions` | attack-play classifier; game-loop action-play tests | third attack rejected; wrong phase/insufficient mana aligned | Phase 2 golden-card content pipeline | complex skill play regressions exist but are not yet Golden Flow evidence | browser local action dispatches one real card action, not full batch contract | `COMPONENT_VERIFIED` | seeded core still has older `core/card-play.ts`; no browser two-card batch with negative cases. |
| FD-PASSIVE-001-CANDIDATE | Passive and forced trigger effects apply when conditions are met, including hidden passive reveal when actually affecting game. | Trigger Engine / Projection | `processEvent`; `collectTriggeredAbilities`; `projectAbilityState` | ability interaction projection; authoring interpreter trigger tests | hidden redaction tests; unsupported action not offered | complex skill forced/optional trigger regressions | Caster/Kayneth/Shinji/Olga tests exist but are not yet Rule ID Gate B contracts | no browser hidden-passive chain | `COMPONENT_VERIFIED` | Event bus is open string; no canonical trigger ordering registry; hidden passive full Gate C absent. |
| FD-UNIQUE-001-CANDIDATE | `唯一` means only one same rule text applies or one active choice window for matching optional effects. | Ability Interpreter | `collectTriggeredAbilities`; response window handling | Caster pilgrim unique tests | replay/decline/reopen tests | complex-skill regression | Caster pilgrim scenario exists but is not yet Golden Flow evidence | no browser multi-response unique window | `COMPONENT_VERIFIED` | Rule text equivalence and cross-copy identity not globally specified. |
| FD-RESIDUAL-001-CANDIDATE | Residual attacks remain across rounds until closed and count as added attacks each round; lifecycle and cleanup must be explicit. | Lifecycle / Ability Interpreter / MatchSession | `installOngoing`; `cleanupOngoing`; cleanup flow | authoring interpreter residual tests; golden-card pipeline | source-close/round cleanup partial tests | complex skill residual tests | Artoria Caster/Ereshkigal/Tomoe scenarios exist but are not yet full lifecycle Gate B evidence | none complete with browser cleanup/reconnect | `COMPONENT_VERIFIED` | Multiple cleanup owners; ad hoc `modeState` and card `powerModifiers`. |
| FD-CLOSE-001-CANDIDATE | Closing attacks returns skill cards to skill zone, discards non-skills, dissolves temporary attacks, and respects residual once-per-game removal. | Lifecycle / MatchSession | `cleanupOngoing`; `advanceAutomatedFlow` | limited golden-card pipeline close assertion | no comprehensive close negatives | isolated MatchSession cleanup behavior | partial card scenarios | none | `IMPLEMENTED_UNVERIFIED` | Missing matrix for skill/non-skill/temporary/residual/source protection. |
| FD-DEFEAT-001-CANDIDATE | Defeated players cannot play cards, can use legal abilities, cannot win, are ignored in winner selection, expire at round end. | Combat Resolver / Ability Interpreter | `cannotWinBattleThisRound`; `getLegalActions` | Tomoe and Achilles complex tests mention defeat | no broad defeat x play/ability negatives | battle resolver winner exclusion partial | complex skill tests | none | `IMPLEMENTED_UNVERIFIED` | Canonical defeat semantics not mapped to a dedicated status/lifecycle owner. |
| FD-POWER-001-CANDIDATE | Power calculation follows canonical layers: base set, current modifiers, terrain add/multiply/set, total add/subtract, final set. | Power Engine / Combat Resolver | `calculateCardPower`; `resolveBattlefield` | combat resolver breakdown; MatchTable power display test | invalid modifier throws in interpreter | complex skill modifier source logs | Tomoe terrain/rain and event/situation logs exist but not as full canonical layer Gate B | UI displays server terms only, not proving browser settlement | `COMPONENT_VERIFIED` | No full canonical layer trace; multiple modifier stores. |
| FD-BATTLE-001-CANDIDATE | Battlefield winner is highest eligible power; tied highest players are all winners; defeated players are ignored; solo player can win non-competition battle. | Battle Resolver | `resolveBattlefield`; `deriveBattleParticipantsFromState` | `packages/rules/tests/core/combat-resolver.test.ts` tied highest winner regression | hidden cards ignored; servants skills ignored as attacks | MatchSession battle auto-flow calls resolver; ability event now receives `winnerPlayerIds` | `packages/rules/tests/regression/battle-winner-conformance.test.ts` covers tied eligible winners with a defeated high-power participant through resolver/event/scoring; complex skill battle regressions remain supporting evidence | no browser combat Golden Flow | `SCENARIO_VERIFIED` | Gate C still missing; legacy `winnerPlayerId` remains as compatibility display field; direct `controller_loses_battle` condition remains a legacy-risk branch if used outside derived loss events. |
| FD-VP-001-CANDIDATE | Battle VP pool equals event VP plus competition VP if opponent exists; tied winners receive ceil split; personal rewards are separate; recon grants 2 VP. | Battle Resolver / Scoring Resolver | `buildDefaultVpAdjustments`; `applyBattleScoring` | scoring source separation test; tied winner scoring regression; recon reward tests | no-overmerge source regression | MatchSession battle -> scoring flow | `packages/rules/tests/regression/battle-winner-conformance.test.ts` covers battle VP plus `competition_vp` split and Artoria Caster personal non-sole-winner VP trigger in the same resolved battle | no browser scoring Golden Flow | `SCENARIO_VERIFIED` | Gate C still missing for browser scoring, projection, replay/reconnect in a real server flow. |
| FD-ROUND-CLEANUP-001-CANDIDATE | Round end order removes masters, discards situation/events, preserves residual, closes attacks, discards face-down, runs end effects, expires statuses, then elimination/final. | MatchSession / GameLoop / Ability Interpreter | `advanceAutomatedFlow`; `runCleanupPhase`; `cleanupOngoing` | limited cleanup tests | no full ordered negative cases | replay timeline includes cleanup snapshots | partial complex scenarios | none | `IMPLEMENTED_UNVERIFIED` | Cleanup order not proven end to end; owner split. |
| FD-HIDDEN-001-CANDIDATE | Hidden hands, decks, face-down cards, servant identities, and hidden Shinto events remain private until a rule reveals them. | Projection Layer | `projectAbilityState`; `projectToClientState`; `projectPlayerMatchView` | projection tests; content verification private leak checks | opponent/spectator redaction assertions | server websocket projection test | hidden event replay scenario exists but not across all projection owners | remote sync checks private hands, not full hidden card abilities | `COMPONENT_VERIFIED` | Multiple projection APIs; no hidden passive/true-name browser gate. |
| FD-TRUENAME-001-CANDIDATE | True Name release reveals servant overview and skills on use of True Name release card/ability; pure passive does not trigger it. | Ability Interpreter / Projection | `reveal`; `resolveEffect`; `processEvent` | authoring and complex true-name tests | passive/non-use negative not complete | MatchSession with real authoring cards | Kintoki/Artoria/Drake/Ereshkigal scenarios exist but no full projection contract | no browser true-name reveal gate | `COMPONENT_VERIFIED` | Projection and event trace not fully linked. |
| FD-PROJECTION-001-CANDIDATE | Player-specific view must expose only authorized information and only server-supplied available actions. | Projection / MatchSession / MatchRoom | `projectToClientState`; `projectAbilityState`; `MatchRoom.getProjection` | projection and client tests | non-priority actions hidden; private identity redacted | websocket server test | remote sync scenario exists but is transport-focused | Playwright remote seat/start only | `COMPONENT_VERIFIED` | Local fixture/client bridge can synthesize display/actions; no stale command/reconnect active decision Gate C. |
| FD-RECONNECT-001-CANDIDATE | Reconnect restores viewer identity, safe projection, active player, pending interaction, revision, and does not leak authority state. | WebSocket Runtime / MatchRoom | `MatchRoom.reconnect`; `MatchRoomHub.reconnect`; `createMatchServer` | websocket test reconnects P2 and checks viewer | invalid replay restore permission negative | room projection after reconnect | none for active flow | Playwright remote sync covers room start, not active pending flow | `COMPONENT_VERIFIED` | No reconnect during pending decision, response window, cleanup, or Golden Flow. |
| FD-RESULT-BINDING-001-CANDIDATE | Effect result binding must use actual structured primitive results and fail closed for invalid references. | Resolution Data-flow / Executable Compiler | `validateResolutionDataFlow`; `executeResolution`; `compileExecutableCardPack` | resolution-dataflow tests; compiler fixtures | unknown/future/duplicate/invalid/wrong/unsafe branch tests | executable pack compiler tests | synthetic chained-effect scenario | none with real card/browser | `COMPONENT_VERIFIED` | Infrastructure only; production MatchSession interpreter still old mutation path. |

## Existing Test -> Acceptance Evidence

| Test / Command | Supports | Gate | Does Not Prove |
|---|---|---|---|
| `packages/rules/tests/core/phase-machine.test.ts` | phase graph, eliminated seat exclusion | Gate A | MatchSession/browser flow, full round cleanup, reconnect |
| `packages/rules/tests/core/movement.test.ts` | normal/effect movement basics and engaged rejection | Gate A | action-window sequencing, capacity edge cases, trigger on enter |
| `packages/rules/tests/core/game-loop-action*.test.ts` | seeded move/play actions, basic card-play constraints | Gate A | production MatchSession legality, real card abilities, browser interaction |
| `packages/rules/tests/regression/attack-play-classifier-regression.test.ts` | two-card batch, third-card rejection, diagnostics/dispatch alignment, rollback classifier | Gate A/B | formal browser two-card batch, all shortage/pass rules, no legacy bypass |
| `packages/rules/tests/regression/battle-winner-conformance.test.ts` | FD-BATTLE-001 and FD-VP-001 tied eligible winners, defeated high-power exclusion, event trace, VP source split, scoring consumption, and real Artoria Caster non-sole-winner trigger | Gate B | browser UI, websocket projection, reconnect, all battle modifiers |
| `packages/rules/tests/regression/golden-card-content-pipeline.test.ts` | compiled content hash and several real-card MatchSession effects/lifecycle | Gate B partial | all Golden Cards, Projection Gate C, reconnect, full card contracts |
| `packages/rules/tests/regression/complex-skills-regression.test.ts` | broad real-card regression matrix | Gate B partial | independent Rule ID closure, browser Gate C, secondary path absence |
| `packages/rules/tests/regression/resolution-dataflow.test.ts` | Phase 3A synthetic result binding, fail-closed validator, rollback | Gate A | production interpreter migration, real card binding scenario, browser path |
| `packages/rules/tests/projection/player-match-view.test.ts` | owner/opponent/spectator projection redaction and basic action offer visibility | Gate A | MatchSession projection equivalence, websocket, reconnect during pending decision |
| `apps/server/src/match-server.test.ts` | websocket room sync, private-hand separation, reconnect viewer identity, unauthorized replay restore rejection | Gate A/C partial for transport | active flow reconnect, pending interaction restore, complex card projection |
| `e2e/fd-match-clickflow.spec.ts` | browser can click payment/target/response/directive/replay widgets and one real local action | Gate C partial UI transport | full canonical flow, real complex card, reconnect, scoring/cleanup |
| `e2e/fd-remote-sync.spec.ts` | two browser pages can select seats/start room | Gate C partial transport | in-match commands, hidden ability windows, replay/active reconnect |
| `npm run verify:stabilization` | aggregate regression gate is green when all configured suites pass | Regression evidence | release readiness, Rule ID coverage, Golden Flow completion |

## Evidence Gap Register

### P0 Evidence Gaps

| Gap | Affected Rules | Reason |
|---|---|---|
| Multiple runtime owners remain for flow, movement, play, cleanup, projection. | FD-FLOW-001, FD-MOVE-001, FD-PLAY-001, FD-ROUND-CLEANUP-001, FD-PROJECTION-001 | Secondary path can bypass the intended owner. |
| Production ability interpreter remains separate from Phase 3A `executeResolution`. | FD-RESULT-BINDING-001, FD-ABILITY-001 | Real cards can still resolve through legacy void mutation semantics. |
| Hidden information has multiple projection APIs and client fixtures. | FD-HIDDEN-001, FD-PROJECTION-001 | A safe projection in one API does not prove another path. |

### P1 Evidence Gaps

| Gap | Affected Rules | Reason |
|---|---|---|
| Battle winner Gate C is still missing after the Gate B scenario fix. | FD-BATTLE-001, FD-VP-001 | Resolver, scoring, ability event, and event trace now have Gate B evidence, but no Golden Flow browser/reconnect evidence. |
| Golden Flow 1 complete action phase is not formalized. | FD-FLOW-001, FD-ABILITY-001, FD-MOVE-001, FD-PLAY-001 | Current tests cover fragments, not the required window sequence. |
| Reconnect during active pending decision is untested. | FD-RECONNECT-001, FD-PROJECTION-001 | Existing reconnect only checks viewer identity after room start. |
| Modifier/source-closed lifecycle is fragmented. | FD-POWER-001, FD-RESIDUAL-001, FD-CLOSE-001 | `ongoingEffects`, `modeState`, and card-level `powerModifiers` coexist. |
| Defeat x play/ability contract lacks direct negative coverage. | FD-DEFEAT-001 | Canonical says cannot play but may use legal abilities; no dedicated matrix. |
| Round cleanup canonical order lacks a single event trace. | FD-ROUND-CLEANUP-001 | Existing cleanup tests do not prove ordered sequence with residual, temporary, statuses, and elimination. |
| Card Acceptance Contract is not attached to each promoted card. | All card-driven rules | Existing reports list ability behavior but not Gate A/B/C evidence per card. |

### P2 Evidence Gaps

| Gap | Affected Rules | Reason |
|---|---|---|
| Rule IDs are candidate IDs, not embedded in Canonical Rules. | All matrix rows | Current rulebook uses section numbers; formal Rule ID governance is needed. |
| Browser tests cover Chromium only. | FD-PROJECTION-001, FD-RECONNECT-001 | Other browser engines not checked. |
| Event trace IDs/causation IDs are not universal. | Trigger, cleanup, scoring | Replay exists but not all production events are typed domain events. |
| Package/content status fields remain useful as display metadata but can be misread. | Card acceptance | Needs migration guide and lint/check later. |

## Release Gate Baseline

Release readiness now requires:

1. Canonical Rules stable.
2. Runtime Owner known for every required Rule ID.
3. No unauthorized `SECONDARY_RUNTIME_PATH`.
4. Required Gate A evidence.
5. Required Gate B evidence.
6. Required Golden Gate C evidence.
7. Projection and reconnect evidence.
8. Regression suite green.
9. No open P0/P1 rule mismatch.

All tests green is necessary regression evidence, but it is not sufficient for Release Ready.
