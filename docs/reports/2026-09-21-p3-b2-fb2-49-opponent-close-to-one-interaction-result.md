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

## Revision after fourth fresh Reviewer finding

Fresh Reviewer evidence for rejected Candidate `bd019ef07fb2615d6457bc2bd0d4299926aa2bde` is canonical GitHub comment `5754617799` on PR #415: `https://github.com/binchen648/fd/pull/415#issuecomment-5754617799`. Verdict: `IMPLEMENTATION_NEEDS_REVISION`.

The prior queue/interaction candidate-list, constraints and owner-provenance shape guards were explicitly confirmed closed. The sole new P1 finding was that the FB2-49 settlement path still dereferenced server-owned `PendingDecision.target` / `PendingDecision.context` before proving their runtime shape, allowing forged null metadata to escape as raw `TypeError` instead of the rules rejection DTO.

Minimum correction in this revision:

- adds FB2-49-only exact runtime guards for the synthetic target and synthetic context before any target/context dereference;
- target must be the exact `frozen_non_residual_attack_to_keep` / `card_instance` / count `1..1` envelope, with no forged extra field;
- context must contain exactly `controllerId`, `sourceCardId`, `abilityId`, empty `variables` and empty `selections`, with no forged extra field;
- moves the shared interaction `abilityDefinition(...)` lookup after the FB2-49 branch so this transaction can reject malformed context before dereference without changing the other interaction paths;
- keeps controller-based qualification, frozen owner binding, candidate-list/constraint guards, compound authoring vocabulary and zero-credit accounting unchanged.

Focused adversarial coverage now includes null, array, malformed-internal and forged-extra-field variants for both FB2-49 target and context. Every case returns `ok:false`, throws no raw exception, and leaves caller state structure-equivalent.

Revision recertification:

- `npm.cmd run typecheck` — PASS;
- focused FB2-49 — **11/11 PASS**;
- Reviewer-named adjacent compatibility set — **8 files / 55 tests PASS**;
- official `npm.cmd run test:ci -- --maxWorkers=2` — **177 files / 1280 tests PASS**;
- content validation — **7 masters / 7 servants / 20 events / 0 blocking issues**;
- generated-content determinism — PASS with unchanged three hashes;
- exact Locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9` — PASS;
- client build — PASS with only existing Vite warnings;
- phase3 coverage — **127 archives / 169 cards / 281 abilities / 0 blocking issues**, `dualRuntime=0`;
- automation audit — `legacyResolveEffect=144`, `legacyExecuteAbility=3`, `notClassifiable=112`, `promotionFindings=20`;
- validation artifacts restored byte-for-byte to rejected Candidate `bd019ef...` Git blobs;
- `git diff --check` — PASS.

FB2-49 remains identity-free zero-credit B2 capability work. Formal migration remains **151/944**, with **793** remaining. No merge or retarget is authorized.

## Revision after fifth fresh Reviewer finding

Fresh Reviewer evidence for rejected Candidate `4a4357037e462ca8dc5d0e20cc731aca0dbde328` is canonical GitHub comment `5754684020` on PR #415: `https://github.com/binchen648/fd/pull/415#issuecomment-5754684020`. Verdict: `IMPLEMENTATION_NEEDS_REVISION`.

The prior target/context finding is closed. The new sole finding was that the FB2-49 serialized `pendingOpponentCloseToOne` queue container and tail entries were still trusted at settlement/transition time: a forged plain-object queue could reach `.shift()` and throw, while a valid head followed by a forged null tail could commit the current card closures as `ok:true` and silently skip the next mandatory opponent decision.

This revision is limited to FB2-49 queue integrity. It now:

- validates the queue container as an actual non-empty Array before settlement;
- validates every serialized queue entry as the exact FB2-49 entry shape, including distinct frozen ids and exact owner map;
- requires all queued entries to share the same initiating controller/source/ability/battlefield lineage, unique decision players, and stable increasing seat order;
- revalidates every queued opponent as active at the frozen battlefield with an exact current qualifying-card set and frozen owner provenance before any current card is closed;
- validates queue shape before next-decision staging, while preserving an empty Array as normal queue exhaustion;
- rejects a pre-existing non-array FB2-49 queue before activation can use `.length`/`.push()`;
- leaves the existing target/context, candidate-list, constraints, owner-provenance and control-based qualification guards unchanged.

Focused adversarial regression now covers the Reviewer reproductions `{ 0: validHead }` and `[validHead, null]`, plus a malformed tail and a structurally valid but battlefield-forged tail. Each case is non-throwing, returns `ok:false`, leaves caller state structure-equivalent, preserves the current opponent's cards, and does not skip the mandatory next opponent decision.

Revision recertification:

- `npm.cmd run typecheck` - PASS;
- focused FB2-49 - **12/12 PASS**;
- Reviewer-named adjacent compatibility set - **8 files / 56 tests PASS**;
- official `npm.cmd run test:ci -- --maxWorkers=2` - **177 files / 1281 tests PASS**;
- content validation - **7 masters / 7 servants / 20 events / 0 blocking issues**;
- generated-content determinism hashes unchanged;
- Locked Reference exact commit verification - PASS;
- client build - PASS (existing Vite warnings only);
- Phase 3 coverage/audit metrics unchanged and validation artifacts restored byte-for-byte to the rejected Candidate blobs.

Accounting remains unchanged: FB2-49 is zero-credit capability work, formal migration remains **151/944**, **793 remaining**. No consumer authoring, identity routing, product/generated/client scope, merge, or retarget is introduced by this revision.

## Revision after sixth fresh Reviewer finding

Fresh Reviewer evidence for rejected Candidate `cc4df99e06b6b1819a241b48ef5d0947de96f228` is canonical GitHub comment `5754747334` on PR #415: `https://github.com/binchen648/fd/pull/415#issuecomment-5754747334`. Verdict: `IMPLEMENTATION_NEEDS_REVISION`.

The sole new P1 finding was queue-completeness binding: the previous revision validated every surviving serialized queue entry but did not commit the originally frozen remaining eligible-opponent membership, so a forged valid truncation `[p2,p3] -> [p2]` could settle p2 and silently skip p3.

Minimum correction only:

- each frozen FB2-49 queue entry now carries `remainingDecisionPlayerIds`, created once from the complete seat-ordered eligible-opponent queue;
- the same suffix commitment is copied into the already-issued current `PendingDecision.interaction` metadata, providing an independent authoritative mirror of the current continuation;
- the head for a two-opponent queue therefore commits `['p2','p3']`, while the next queue entry commits `['p3']`;
- settlement requires three-way equality between interaction commitment, queue-head commitment and the actual remaining queue decision-player sequence before any card close, queue shift or next-decision staging;
- a structurally valid tail deletion/truncation therefore rejects through `RuleRejection`, returns `ok:false`, and leaves caller state structure-equivalent with no card mutation and no skipped mandatory decision;
- existing queue-container/tail-shape, owner-provenance, candidate-list, constraint, target/context and control-based qualification guards remain unchanged;
- scope remains identity-free FB2-49 capability work with zero migration credit.

Revision recertification:

- `npm.cmd run typecheck` — PASS;
- focused FB2-49 — **13/13 PASS**;
- Reviewer-named adjacent compatibility set — **8 files / 57 tests PASS**;
- official `npm.cmd run test:ci -- --maxWorkers=2` — **177 files / 1282 tests PASS**;
- `content:validate` — **7 masters / 7 servants / 20 events / 0 blocking issues**;
- generated-content determinism hashes unchanged;
- exact Locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9` — PASS;
- client build — PASS (existing Vite warnings only);
- Phase 3 coverage and automation-audit metrics unchanged;
- validation artifacts restored byte-for-byte to the rejected Candidate blobs.

Formal migration remains **151/944**, **793** remaining. FB2-49 remains zero-credit capability work.
## Revision after seventh fresh Reviewer finding

Fresh Reviewer evidence for rejected Candidate `9f713433ffc2c29a4430da2f4b073cfaecbc9f40` is canonical GitHub comment `5754832905` on PR #415: `https://github.com/binchen648/fd/pull/415#issuecomment-5754832905`. Verdict: `IMPLEMENTATION_NEEDS_REVISION`.

The prior queue-completeness finding is closed. This revision addresses only the newly identified forged synthetic continuation metadata gap:

- FB2-49 stages `PendingDecision.remainingEffects` as an exact empty array and settlement now requires the runtime value to remain an Array with length exactly zero before any card mutation, queue shift or decision consumption;
- malformed `remainingEffects` values (`null`, a non-array record, or a forged non-empty effect array) fail closed through `RuleRejection`, return `ok:false`, throw no raw exception, and preserve caller state structure-equivalent;
- all existing queue-completeness, target/context, candidate-list, constraint, owner-provenance and control-based qualification guards remain unchanged;
- no consumer identity routing or generic interaction behavior was added; FB2-49 remains zero-credit capability work.

Validation after this revision:

- `npm.cmd run typecheck` — PASS;
- focused FB2-49 — **14/14 PASS**;
- Reviewer-named adjacent compatibility set — **8 files / 58 tests PASS**;
- official `npm.cmd run test:ci -- --maxWorkers=2` — **177 files / 1283 tests PASS**;
- content validate — 7 masters / 7 servants / 20 events / 0 blocking issues;
- generated-content determinism — unchanged;
- Locked Reference exact verification — PASS at `b2f9fa15fba07c63530bbf4612b03b8b704755f9`;
- client build — PASS (existing Vite warnings only);
- coverage/audit metrics — unchanged; generated audit artifacts restored to their exact pre-revision Git blobs.

Formal migration remains **`151/944`**, **`793`** remaining.

## Revision after eighth fresh Reviewer finding

- canonical Reviewer evidence: https://github.com/binchen648/fd/pull/415#issuecomment-5754915759
- exact rejected Candidate: `d457533d8e224cb5f0f5e5530ce1858facbd97f7`.
- sole new P1: FB2-49 settlement validated nested synthetic metadata but did not reject unknown/extra keys on the enclosing `PendingDecision` root or `OpponentCloseToOneInteractionMetadata` root, allowing forged root metadata to commit settlement.
- correction stays FB2-49-local: exact key-set guards now bind both root envelopes before any source/queue/card settlement work; existing field-value, target/context, constraints, continuation, queue completeness and owner-provenance validation remains unchanged.
- focused regression forges one extra root key independently on the pending-decision envelope and interaction envelope; both cases prove no raw throw, `ok:false`, caller state structure-equivalent and no card closure/decision consumption.
- control-based qualification and identity-free capability scope remain unchanged; no consumer routing or generic vocabulary expansion was added.

Validation after the eighth finding correction:
- `npm.cmd run typecheck` — PASS;
- focused FB2-49 — **15/15 PASS**;
- Reviewer-named adjacent compatibility set — **8 files / 59 tests PASS**;
- official `npm.cmd run test:ci -- --maxWorkers=2` — **177 files / 1284 tests PASS**;
- content validation — **7 masters / 7 servants / 20 events / 0 blocking issues**;
- generated-content determinism hashes unchanged;
- Locked Reference exact verification PASS at `b2f9fa15fba07c63530bbf4612b03b8b704755f9`;
- client build PASS (existing Vite warnings only);
- phase3 coverage/audit metrics unchanged; generated audit artifacts restored to the exact pre-revision Git blobs.

Accounting remains unchanged: FB2-49 is zero-credit capability work; formal migration remains **151/944**, **793 remaining**.


## Revision after ninth fresh Reviewer finding

Fresh Reviewer evidence for rejected Candidate `0e716daa949c7c1d80dbca525622009e66b6d8d2` is canonical GitHub comment `5754993932` on PR #415: `https://github.com/binchen648/fd/pull/415#issuecomment-5754993932`. Verdict: `IMPLEMENTATION_NEEDS_REVISION`.

The sole new P1 finding was missing source runtime card-state provenance: both activation staging and settlement treated an absent `abilityRuntime.cardState[sourceId]` as acceptable because the old guard only rejected explicit `faceDown === true`.

Minimum correction only:

- FB2-49 activation now requires the source runtime card-state record to exist and proves face-up from that record before staging any opponent queue or decision;
- FB2-49 settlement independently re-requires the source runtime card-state record before accepting a frozen keep-one decision;
- a focused regression covers both missing state before activation and deletion after a valid decision is staged; the settlement case proves safe `ok:false`, no raw throw, caller state structure-equivalent, no card close, and no queue/decision consumption;
- all previously closed exact-envelope, continuation, queue-completeness, target/context, candidate-list, constraints, owner-provenance and control-based qualification behavior remains unchanged;
- no generic vocabulary, consumer routing, product/generated/client scope, merge, retarget, or migration credit is introduced.

Revision recertification:

- `npm.cmd run typecheck` — PASS;
- focused FB2-49 — **16/16 PASS**;
- Reviewer-named adjacent compatibility set — **8 files / 60 tests PASS**;
- official `npm.cmd run test:ci -- --maxWorkers=2` — **177 files / 1285 tests PASS**;
- `npm.cmd run content:validate` — **7 masters / 7 servants / 20 events / 0 blocking issues**;
- generated-content determinism PASS with unchanged hashes `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`, `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`, and `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`;
- exact Locked Reference verification PASS at `b2f9fa15fba07c63530bbf4612b03b8b704755f9`;
- client build PASS with only the existing Vite externalization/chunk-size warnings;
- `phase3:coverage` PASS: archives=127, cards=169, abilities=281, newRuntimeSemanticRouted=22, legacyExecuteAbility=3, legacyResolveEffect=144, dualRuntime=0, notClassifiable=112;
- `phase3:automation-audit` PASS: legacyResolveEffect=144, legacyExecuteAbility=3, notClassifiable=112, promotionFindings=20;
- write-producing validation artifacts were restored byte-for-byte from the exact rejected Candidate Git blobs after metrics were recorded.

Accounting remains unchanged: FB2-49 is zero-credit capability work; formal migration remains **151/944**, **793 remaining**.

## Revision after tenth fresh Reviewer review

Fresh Reviewer evidence for rejected Candidate `5a66696a4b9faece5cb2cc12dcc7b4ac0b2a2694` is canonical GitHub comment `5755765128` on PR #415: `https://github.com/binchen648/fd/pull/415#issuecomment-5755765128`. Verdict: `IMPLEMENTATION_NEEDS_REVISION`. This review intentionally continued after the first blocker and returned both independently confirmed P1 findings in the same exact review scope.

Both findings are corrected together in one revision:

1. **Malformed source runtime-state provenance**
   - FB2-49 no longer treats a truthy value as a valid `CardRuntimeState`; activation and settlement now require a plain runtime-state record with boolean `active`, boolean `faceDown`, and safe-integer `playedRound` before using source face-state provenance.
   - Truthy malformed primitives/containers and malformed required fields therefore fail closed instead of being interpreted as face-up.
   - focused regressions cover string, array, number, wrong-typed `faceDown`, and missing `playedRound` at activation and again after a valid decision was staged; settlement proves `ok:false`, no raw throw, caller state structure-equivalent, no card close, and no queue/decision consumption.

2. **Jointly forgeable serialized queue-completeness mirrors**
   - FB2-49 now records an independent server-owned `trustedOpponentCloseToOneCommitment` when the complete eligible-opponent sequence is frozen. It binds initiating controller, source, ability, battlefield, and the complete original decision-player sequence.
   - the commitment has its own exact-shape validation and is checked both before staging each synthetic decision and before settlement mutation; current serialized queue must be the exact remaining suffix of the original authoritative sequence.
   - the trusted commitment is not shortened as the serialized queue advances and is deleted only after the final mandatory opponent settles.
   - a focused regression coherently truncates `[p2,p3]` to `[p2]` and rewrites both the queue-head and interaction `remainingDecisionPlayerIds` mirrors to `['p2']`; the untouched authoritative commitment still requires `['p2','p3']`, so the forged transaction rejects mutation-free and p3 is not skipped.
   - additional focused regressions cover missing/null/extra-key/malformed trusted commitment state so the newly added authority itself fails closed.

All previously closed root-envelope, continuation, target/context, candidate-list, constraints, owner-provenance, queue-shape, close-forbid, replay and control-based qualification behavior remains unchanged. No generic authoring vocabulary, consumer identity routing, product/generated/client semantic scope, merge, retarget, or migration credit is introduced.

Exact implementation before this report-only evidence update: `46af34bb12dcf196e50ff74d2d81dc3fd0899708`. A separate fresh detached validation worktree at that exact SHA used its own `npm ci --ignore-scripts` dependency tree, so workspace/client validation did not resolve through an older worktree.

Revision recertification on exact implementation `46af34bb12dcf196e50ff74d2d81dc3fd0899708`:

- `npm.cmd run typecheck` — PASS;
- focused FB2-49 — **19/19 PASS**;
- Reviewer-named adjacent compatibility set — **8 files / 63 tests PASS**;
- official `npm.cmd run test:ci -- --maxWorkers=2` — **177 files / 1288 tests PASS**;
- `npm.cmd run content:validate` — **7 masters / 7 servants / 20 events / 0 blocking issues**;
- generated-content determinism PASS with unchanged hashes `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`, `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`, and `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`;
- exact Locked Reference verification PASS at `b2f9fa15fba07c63530bbf4612b03b8b704755f9`;
- client build PASS from the exact fresh validation worktree, with only the existing Vite externalization/chunk-size warnings;
- `phase3:coverage` PASS: archives=127, cards=169, abilities=281, newRuntimeSemanticRouted=22, legacyExecuteAbility=3, legacyResolveEffect=144, dualRuntime=0, notClassifiable=112, taxonomyWarnings=151;
- `phase3:automation-audit` PASS: legacyResolveEffect=144, legacyExecuteAbility=3, notClassifiable=112, promotionFindings=20;
- write-producing coverage/audit artifacts were restored byte-for-byte from the exact implementation Git blobs after metrics were recorded, and the detached validation worktree finished clean.

Accounting remains unchanged: FB2-49 is zero-credit capability work; formal migration remains **151/944**, **793 remaining**.

\n