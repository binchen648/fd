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
## Revision after second fresh Reviewer finding

Fresh Reviewer evidence for rejected Candidate `807440a9d35b351d82d060deb4f273ea7f70a183` is GitHub comment `5754455947` on PR #415. Verdict: `IMPLEMENTATION_NEEDS_REVISION`.

The exact finding was limited to malformed/forged frozen-owner metadata escaping the rules rejection protocol as a raw `TypeError`: `qualifyingCardOwners` was correctly frozen and semantically revalidated, but the validator called `Object.keys(...)` before proving the runtime value was a record. The minimum correction therefore keeps the existing control-based qualification and owner-provenance semantics unchanged while hardening only the FB2-49 owner-map validation boundary.

The revision now:

- treats both queue and interaction `qualifyingCardOwners` values as untrusted runtime shape at settlement;
- rejects absent, null, array, non-record, wrong-key-count, missing-key, empty/non-string owner values before any indexing/equality operation;
- compares queue and interaction owner maps only after both pass exact structural validation;
- compares live card ownership against the structurally validated frozen interaction map;
- preserves qualification by `controllerPlayerId` and does **not** require `ownerPlayerId === decisionPlayerId`;
- routes malformed provenance through the existing `RuleRejection` path so `dispatchAbilityCommand` returns `ok:false` without throwing or committing mutation.

Focused regression now covers deleted/null interaction owner maps plus null/array queue owner maps and proves `ok:false`, no throw, and structure-equivalent caller state.

Revision recertification after this correction:

- `npm.cmd run typecheck` — PASS.
- focused FB2-49 — **9/9 PASS**.
- Reviewer-named adjacent compatibility set — **8 files / 53 tests PASS**.
- official `npm.cmd run test:ci -- --maxWorkers=2` — **177 files / 1278 tests PASS**.
- `npm.cmd run content:validate` — PASS, **7 masters / 7 servants / 20 events / 0 blocking issues**.
- `npm.cmd run verify:generated-content` — PASS; hashes remain `866a5b...`, `fb6938...`, `b1bb89...`.
- exact Locked Reference verification at `b2f9fa15fba07c63530bbf4612b03b8b704755f9` — PASS.
- `npm.cmd run build --workspace @fd/client` — PASS; only existing Vite warnings.
- `phase3:coverage` — PASS at **127 archives / 169 cards / 281 abilities / 0 blocking issues**, `newRuntimeSemanticRouted=22`, `dualRuntime=0`, `pilotAllowlist=0`, `notClassifiable=112`, `taxonomyWarnings=151`.
- `phase3:automation-audit` — PASS at `legacyResolveEffect=144`, `legacyExecuteAbility=3`, `notClassifiable=112`, `promotionFindings=20`.
- coverage/audit artifacts restored byte-for-byte to the exact rejected-Candidate Git blobs after validation.
- formal migration remains **151/944**, **793 remaining**; FB2-49 remains zero-credit.

## Revision after third fresh Reviewer finding

Fresh Reviewer evidence for rejected Candidate `002c81c65bad1f9a2be9767614b6dfe90a7d7535` is GitHub comment `5754548446` on PR #415. Verdict: `IMPLEMENTATION_NEEDS_REVISION`.

The sole finding was another FB2-49-owned runtime-shape hole: queue / interaction `qualifyingCardIds` and interaction `constraints` could be null or malformed and be dereferenced before shape validation, allowing raw `TypeError` to escape the public transactional command boundary instead of returning the safe `RuleRejection -> { ok:false }` DTO. The previous owner-provenance semantic and owner-map shape blockers remain closed.

Minimum correction only:

- added an FB2-49-specific frozen-card-id-list guard requiring an array of at least two non-empty distinct string ids before any equality, length, iteration, set or indexing use in settlement;
- queue and interaction frozen id lists must both pass that guard and match exactly before owner-map comparison or live provenance checks;
- added an exact FB2-49 constraint-record guard before any constraint field dereference; it requires exactly `kind/targetKind/min/max/distinct` with values `target/card/1/1/true`;
- existing owner-map helpers now accept unknown id-list input and reject safely if that list is malformed;
- control-based qualification is unchanged: qualification still uses `controllerPlayerId === decisionPlayerId`; owner identity is not used as a qualification restriction;
- no authoring vocabulary, consumer content, Astolfo identity routing, pack/generated/client scope or migration accounting changed.

Focused regression now additionally proves safe DTO rejection with structure-equivalent caller state for malformed/null interaction and queue `qualifyingCardIds` plus null/array/wrong-shape interaction `constraints`.

Revision recertification after this correction:

- `npm.cmd run typecheck` — PASS.
- focused FB2-49 — **10/10 PASS**.
- Reviewer-named adjacent compatibility set — **8 files / 54 tests PASS**.
- official `npm.cmd run test:ci -- --maxWorkers=2` — **177 files / 1279 tests PASS**.
- `npm.cmd run content:validate` — PASS, **7 masters / 7 servants / 20 events / 0 blocking issues**.
- generated-content determinism — PASS with unchanged hashes `866a5b...`, `fb6938...`, `b1bb89...`.
- exact Locked Reference verification at `b2f9fa15fba07c63530bbf4612b03b8b704755f9` — PASS.
- client build — PASS; only pre-existing Vite warnings.
- Phase 3 coverage — PASS: **127 archives / 169 cards / 281 abilities / 0 blocking**, `dualRuntime=0`; metrics otherwise unchanged.
- automation audit — PASS; `legacyResolveEffect=144`, `legacyExecuteAbility=3`, `notClassifiable=112`, `promotionFindings=20`.
- validation artifacts restored byte-for-byte to Candidate `002c81c...` blobs after validation.
- `git diff --check` — PASS.

FB2-49 remains **zero migration credit**. Formal migration remains **151/944**, with **793** remaining. No merge or retarget is authorized.
