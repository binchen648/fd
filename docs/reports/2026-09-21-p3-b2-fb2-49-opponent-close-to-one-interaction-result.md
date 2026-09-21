# P3-B2 FB2-49 Opponent Close-To-One Interaction Result

Role: Codex B2
Status: `CANDIDATE_READY_FOR_FRESH_R`
Date: 2026-09-21

## Exact dispatch input

- Task: `P3-FB2-49-OPPONENT-CLOSE-TO-ONE-INTERACTION`
- Exact A dispatch Base: `822b5f9dfd05a64a5707fcb945b8b85eff2238e6`
- A dispatch branch: `codex/a-p3-fb2-49-opponent-close-to-one-dispatch`
- B2 branch: `codex/b2-p3-fb2-49-opponent-close-to-one-interaction`
- R101 synchronized migration baseline: `b208ac5571c29f28b623f6462438649d9b151b54`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Formal project migration remains **`151/944`**, remaining **`793`**.
- Branch-local frozen authoring overlap remains **`146/944`**, duplicates `0`.

FB2-49 is identity-free zero-credit runtime infrastructure. No consumer migration or formal credit is claimed by this Candidate.

## Released capability

The Candidate adds one bounded compound effect token:

`opponent_close_non_residual_to_one`

It is admitted only by the exact whole-ability gateway released by A:

- `kind: phase_action`;
- activation exactly combat / `controller_combat_action_window`;
- conditions exactly ordered `source_owned`, then `at_battlefield`;
- no targets, cost, creates, rule modifiers, lifecycle or limit;
- exactly one compound effect with no configurable payload;
- visibility either empty or exact servant-package true-name reveal on use declaration;
- authoring response window empty; compiled response window only the loader default turn-order/pass-behavior envelope;
- automatic execution only.

The historical Reference spellings `choose_each_player_cards`, `choose-each-player-cards`, `close_matching_cards_except_selected`, and `close-matching-cards-except-selected` are deliberately recognized only as FB2-49 candidate vocabulary so malformed/generic authoring fails closed. They are **not** added to loader `supportedTypes` and have no generic execution route.

## Runtime transaction

On an exact accepted phase activation, the server:

1. verifies the initiating controller is active at an enabled battlefield and the source remains controller-owned/controlled and face-up;
2. enumerates active same-battlefield opponents in stable seat order, excluding controller, remote players and eliminated players;
3. freezes each opponent's qualifying cards as only cards currently controlled by that opponent, in `attack_area`, active, face-up and structurally non-residual;
4. uses the same structural residual classification already used by MatchSession round cleanup: a card is residual when its compiled definition contains a `kind: residual` ability whose cleanup is not explicit `discard_at_round_end` / `close_at_round_end`;
5. skips an opponent with fewer than two qualifying cards;
6. serializes a server-owned, owner-only, non-cancellable exactly-one “keep” decision for every eligible opponent without overwriting another pending decision;
7. revalidates the complete queue head, source/controller/player battlefield relation, frozen candidate set, metadata revision/continuation and exact current qualifying set before accepting a choice;
8. keeps the selected card and closes every other card in that opponent's frozen qualifying set atomically;
9. returns closed skill cards to their owner skill zone, while ordinary non-skill attack cards remain in attack area face-down/inactive for normal round cleanup, matching the Locked Reference base close semantics;
10. shifts the queue and stages the next opponent only after successful settlement.

FB2-42 live `card_close` forbids are checked before any close mutation. If any would-be closed card is protected, the entire decision rejects atomically through the existing cloned dispatch transaction; no partial close is committed.

Duplicate/stale decisions, wrong player, empty/multiple/duplicate/outsider selections, source ownership drift, battlefield drift, card controller/zone/active/face/residual drift, queue/metadata corruption or revision drift reject without mutating caller state.

## Identity and scope boundary

Production source contains no Astolfo id, legacy id, name, Chinese printed text or other consumer identity routing.

No `data/authoring/**`, product pack, generated product, client production or frozen inventory material is changed. Mechanical recount after all gates remains:

- frozen denominator: `944`;
- authoring unique ids: `169`;
- frozen authoring overlap: **`146/944`**;
- duplicate frozen ids: `0`;
- `servant.astolfo.skill.sc-astolfo-1` authoring count: `0`.

The intended Candidate scope is exactly:

1. `packages/rules/src/ability/opponent-close-to-one.ts` — exact compound classifier/gateway;
2. `packages/rules/src/ability/interpreter.ts` — queue staging, revalidation and settlement;
3. `packages/rules/src/ability/loader.ts` — opaque compound token + exact gateway;
4. `packages/rules/src/ability/types.ts` — server-owned pending/interaction metadata;
5. `packages/rules/src/index.ts` — public rules export;
6. `packages/rules/tests/fb2-49-opponent-close-to-one-interaction.test.ts` — focused regression;
7. this result report.

No Task Index modification belongs in the B2 Candidate because A already dispatched the formal task.

## Focused evidence

`packages/rules/tests/fb2-49-opponent-close-to-one-interaction.test.ts` proves:

- exact raw and compiled whole-ability acceptance plus near-form and historical generic gateway rejection;
- zero/one qualifying card produces no decision/no mutation; eliminated opponents are excluded;
- one opponent can keep exactly one while all other qualifying cards close;
- residual, face-down, inactive, wrong-zone, wrong-controller and remote-player cards are excluded and remain untouched;
- ordinary attack close and skill-card close use their correct physical resting semantics;
- multiple eligible opponents serialize by seat and only the current decision player sees/owns the private decision;
- replaying a completed decision cannot close more cards;
- wrong player, empty, duplicate, multiple and outsider selections fail mutation-free;
- battlefield/source/card/controller/metadata/revision drift fails mutation-free;
- a live FB2-42 close-forbid causes an atomic failure with no partial close.

Focused FB2-49 suite: **8/8 PASS**.

Compatibility suite covering FB2-49, FB2-42, interaction projection, match-room/hub, same-battlefield private interaction, card-action close and battle cleanup: **8 files / 52 tests PASS**.

## Validation / B2 recertification

`package-lock.json` is identical to the already bootstrapped environment, so the worktree reuses existing `node_modules` through a local junction; no dependency mutation was required.

Final pre-Candidate gates:

- `npm.cmd run typecheck` — PASS.
- focused FB2-49 — **8/8 PASS**.
- focused/adjacent compatibility — **8 files / 52 tests PASS**.
- official `npm.cmd run test:ci -- --maxWorkers=2` — **177 files / 1277 tests PASS**.
- `npm.cmd run content:validate` — PASS, **7 masters / 7 servants / 20 events / 0 blocking issues**.
- `npm.cmd run verify:generated-content` — PASS with unchanged hashes:
  - library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- exact Locked Reference verification at `b2f9fa15fba07c63530bbf4612b03b8b704755f9` — PASS.
- `npm.cmd run build --workspace @fd/client` — PASS; only existing Vite browser-externalization/chunk-size warnings.
- `npm.cmd run phase3:coverage` — PASS: **127 archives / 169 cards / 281 abilities / 0 blocking issues**, `newRuntimeSemanticRouted=22`, `dualRuntime=0`, `pilotAllowlist=0`, `notClassifiable=112`, `taxonomyWarnings=151`.
- `npm.cmd run phase3:automation-audit` — PASS: `legacyResolveEffect=144`, `legacyExecuteAbility=3`, `notClassifiable=112`, `promotionFindings=20`.
- validation artifacts `artifacts/phase3-skill-coverage.json` and `artifacts/phase3-a02-automation-audit.json` were restored byte-for-byte to their exact Base Git blobs after validation.
- post-gate material recount remains **`146/944`**, target Astolfo count `0`, duplicates `0`.
- `git diff --check` — PASS.

## Reviewer revision — frozen qualifying-card owner provenance

Fresh independent R on PR `#415`, Candidate `80509744f868aafda06e4d5731fe12b2edf79163`, returned `IMPLEMENTATION_NEEDS_REVISION` at `https://github.com/binchen648/fd/pull/415#issuecomment-5754379961`. The sole finding was that the frozen keep-one transaction bound qualifying card ids but not each card's `ownerPlayerId`, so an owner-only drift could survive the existing controller/zone/active/face/residual revalidation.

The minimum correction is limited to FB2-49 provenance state and its focused regression:

- queue creation now freezes `qualifyingCardOwners: instanceId -> ownerPlayerId` alongside the already-frozen qualifying ids;
- the same owner snapshot is copied into the server-owned interaction metadata and exact queue/metadata equality is required at settlement;
- before accepting the keep choice, every frozen qualifying instance — both the selected keep card and every would-be closed card — must still have the exact frozen owner;
- qualification remains control-based (`controllerPlayerId === decisionPlayerId`); ownership is **not** narrowed to `ownerPlayerId === decisionPlayerId`;
- the new regression changes only one frozen qualifying card's owner while controller, zone, active, face and residual state remain valid, then proves rejection is mutation-free.

Revision recertification:

- `npm.cmd run typecheck` — PASS.
- focused FB2-49 — **8/8 PASS**.
- Reviewer-requested adjacent set — **8 files / 52 tests PASS**.
- official `npm.cmd run test:ci -- --maxWorkers=2` — **177 files / 1277 tests PASS**.
- content validation — **7 masters / 7 servants / 20 events / 0 blocking issues**.
- generated-content hashes unchanged (`866a5b...`, `fb6938...`, `b1bb89...`).
- exact Locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9` — PASS.
- client build — PASS with only the existing Vite warnings.
- coverage/audit remain unchanged: `127/169/281`, `newRuntimeSemanticRouted=22`, `dualRuntime=0`, `notClassifiable=112`, `legacyResolveEffect=144`, `legacyExecuteAbility=3`, `promotionFindings=20`.
- validation artifacts restored byte-for-byte to the pre-revision Candidate blobs.
- formal migration remains **151/944**, **793** remaining; FB2-49 remains zero-credit.

## Next gate

This is only a B2 implementation Candidate. Fresh independent R must review the exact A dispatch Base and exact B2 Candidate before any capability acceptance synchronization.

If and only if fresh R returns formal `IMPLEMENTATION_ACCEPTED_CANDIDATE` for the exact Candidate and A synchronizes that capability acceptance, the coordinator must freshly reconstruct complete `servant.astolfo.skill.sc-astolfo-1` against the synchronized runtime. Singleton S is permitted only if the full card — F1/static metadata, combat phase action, true-name reveal, source ownership/battlefield conditions, exact per-opponent keep-one transaction, card close semantics and play lifecycle — is mechanically zero-gap.

FB2-49 earns **zero migration credit**. Formal migration remains **`151/944`**, with **`793`** remaining. No merge or retarget is authorized.
