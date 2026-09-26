# P3-B2 FB2-47 Controller-Defeated VP Reward Result

Role: Codex B2
Status: `IMPLEMENTED_PENDING_FRESH_R`
Date: 2026-09-21

## Exact task lineage

- Task: `P3-FB2-47-CONTROLLER-DEFEATED-VP-REWARD`
- Branch: `codex/b2-p3-fb2-47-controller-defeated-vp-reward`
- Exact A dispatch Base: `199bd63c98c94b0f5d32c40110bafe9583f29d52`
- A dispatch branch: `codex/a-p3-fb2-47-controller-defeated-vp-dispatch`
- A dispatch report: `docs/reports/2026-09-21-p3-a-fb2-47-controller-defeated-vp-reward-dispatch.md`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Formal migration accounting before/after this capability Candidate: **`149/944`**, **`795` remaining**
- Material frozen authoring overlap before/after this capability Candidate: **`144/944`**, duplicates **`0`**

FB2-47 is zero-credit identity-free runtime capability work. This Candidate adds no frozen consumer identity.

## Fresh R revision closure

The first exact Candidate `e4dd39b7afc5a5801ff4e2c855fdedf611895e8a` received formal fresh-R `IMPLEMENTATION_NEEDS_REVISION` evidence at `https://github.com/binchen648/fd/pull/411#issuecomment-5753258686` for one P1 provenance gap: root trust used only `processedEvents` membership, so a later standalone defeated event could reuse an already processed `resultId`, substitute contradictory winners/losers, and receive the reward.

This revision closes only that finding:

- the first server-processed `after_battle_result_determined` payload for an exact `resultId` is frozen into a server-owned immutable runtime snapshot;
- a derived `after_controller_defeated` fact must match that frozen root's phase, battle, result, battlefield, participant order, winner order and loser order exactly in addition to the existing structural checks;
- the snapshot is first-seen only and root replay cannot overwrite it;
- the exact reviewer sequence is now a focused regression: authoritative root `[winner=p1, loser=p2]`, followed by contradictory same-result `defeat:p1` carrying `[winner=p2, loser=p1]`, fails closed with no VP mutation.

The released trigger envelope, defeat-before-loss ordering, suppression semantics, fixed reward semantics and zero-credit accounting are unchanged.

## Implemented capability

The Candidate implements only the released **authoritative controller-defeated fact -> fixed controller VP reward** seam.

### Exact authoring gateway

A new dedicated classifier in `packages/rules/src/ability/controller-defeated-vp-reward.ts` admits exactly one shape:

- `kind: forced_trigger`;
- activation exactly `{ trigger: "after_controller_defeated" }`;
- exactly one condition `{ type: "event_player_is_controller" }`;
- no targets;
- exactly one existing resource effect `{ type: "adjust_victory_points", player: "controller", amount: <positive safe integer> }`;
- no cost / creates / rule modifiers;
- empty lifecycle / response-window / limit / visibility authoring containers;
- automatic execution;
- markers absent or exactly empty;
- no extra top-level or nested semantic payload.

`isControllerDefeatedVpRewardCandidate(...)` scans the raw ability before normalization so an `after_controller_defeated` token embedded in a malformed ability still reaches the dedicated fail-closed gateway. Adding the trigger token to loader vocabulary therefore does not make arbitrary conditions/effects executable.

The amount is fixed numeric data only. Zero, negative, fractional, unsafe, string, null, formula/object and extra-key effect forms fail closed.

### Trusted server defeat fact

The selected typed event is `after_controller_defeated`.

It is derived only inside the trusted `after_battle_result_determined` server transaction. For every actual unsuppressed frozen loser, the runtime derives one event with stable identity:

`<resultId>:defeat:<playerId>`

The trusted-fact validator requires:

- battle phase and current round provenance;
- exact `battlePhaseResolutionId`, `battleId`, `resultId`, enabled battlefield and stable battle ordinal;
- the root `resultId` already present in the server `processedEvents` ledger and an immutable first-seen server snapshot exists for that exact root;
- dense unique known participant / winner / loser ids;
- the controller is a participant and frozen loser and not a winner;
- no winner/loser overlap;
- exact derived event id and controller player id;
- participant, winner and loser arrays exactly equal the frozen first-seen root snapshot.

A standalone forged defeated event therefore cannot execute the reward even if its visible fields imitate a battle result or reuse an already processed root `resultId` with substituted outcome arrays. Invalid event provenance is mutation-free.

The producer consumes the already frozen post-scoring loser list. It does not recompute defeat from Power, current VP, location, logs or mutable board occupancy. `battleResultLoserIds(...)` already removes authoritative `lossEffectSuppressedPlayerIds`, so Basic Luck / battle-loss suppression does not generate a false defeat fact.

### Required event ordering

For one trusted battle result the runtime now processes:

1. one `after_controller_defeated` fact for each actual loser;
2. winner/victory derived facts;
3. one `after_controller_loses_battle` fact for each actual loser.

The defeat fact therefore settles before the same controller's FB2-46 loss transaction. This preserves the frozen Nobunaga ordering case: starting at 0 VP, the synthetic pair resolves `+3`, then `-2`, then the same-result winner receives `+2` because actual VP loss is positive.

### Reward settlement

An accepted source receiving its own trusted defeated fact:

- validates the exact compiled whole-ability shape again at runtime;
- validates trusted defeat provenance;
- applies the fixed positive VP reward once;
- emits normal `victory_points_adjusted` runtime evidence with source card, ability, trigger event and battle/result provenance;
- honors the existing global effect-prevention boundary;
- rejects unsafe current/resulting VP state;
- is idempotent through the existing processed-event ledger.

No response window or player choice is introduced.

## Real settlement coverage

Focused tests verify the same fact route from the currently accepted battle semantics:

- ordinary unsuppressed battle loss -> defeated fact -> fixed reward;
- active Basic Luck / authoritative loss suppression -> no defeated fact and no reward;
- accepted FB2-45 pre-battle defeat -> excluded actual loser -> same defeated fact;
- accepted Presence Concealment frozen-Power defeat -> actual excluded losers -> same defeated fact;
- multiple actual losers each receive only their own controller-bound reward;
- winners and nonparticipants do not receive a defeat fact.

The Candidate does not add a generic persistent defeated-state subsystem and does not claim speculative non-battle defeat producers. Future non-battle defeat capabilities must explicitly wire their successful authoritative defeat into this typed fact before claiming that coverage.

## Explicit non-expansion evidence

The Candidate does **not** add:

- client-supplied or arbitrary `player.defeated` event routing;
- generic `event_type_is` parsing;
- persistent player defeated state, revival/reset or elimination semantics;
- generic defeat-player execution;
- arbitrary VP scopes/formulas;
- changes to FB2-45 target/settlement semantics;
- changes to FB2-46 VP-loss/winner-reward semantics;
- consumer authoring or product/generated registration;
- Nobunaga/Ozymandias/card-id/name/Chinese-text production routing.

Production identity-text audit over the changed `packages/rules/src/**` diff is clean.

## Validation evidence

All formal/current gates used for this Candidate are green:

- dependency bootstrap: `npm ci --ignore-scripts --offline` -> **239 packages**, **0 vulnerabilities**;
- `npm run typecheck` -> **PASS**;
- focused FB2-47 + FB2-46 + FB2-45 + Presence compatibility -> **5 files / 48 tests PASS**;
  - FB2-47 focused suite -> **12/12 PASS**;
- official repository CI gate: `npm run test:ci -- --maxWorkers=2` -> **173 files / 1243 tests PASS**;
- `npm run content:validate` -> **7 masters / 7 servants / 20 events / 0 blocking issues**;
- `npm run verify:generated-content` -> **PASS**, hashes unchanged:
  - content library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence report `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`;
- `npm run phase3:reference:verify -- --reference-root E:\\Codex\\FD\\fd-reference --expected-commit b2f9fa15fba07c63530bbf4612b03b8b704755f9` -> **PASS**;
- client production build -> **PASS**; only the existing Vite `node:crypto` browser-externalization and `>500 kB` chunk warnings remain;
- `npm run phase3:coverage` -> **PASS**:
  - `archives=125`, `cards=167`, `abilities=278`;
  - `compiledCards=76`, `compiledCharacters=14`, `blockingIssues=0`;
  - `newRuntimeSemanticRouted=22`, `dualRuntime=0`;
- coverage artifact was restored byte-for-byte to the Base/HEAD blob after validation and is not part of this Candidate;
- `git diff --check` -> **PASS**.

A deliberately broader raw `vitest run packages/rules/tests` diagnostic was not used as an acceptance gate: it includes authoring suites that the repository's formal `test:ci` intentionally excludes because they depend on unavailable legacy `D:/fd/chm-extract` evidence paths / stale absolute archive-count assertions, plus a parallel 5-second smoke timeout. The formal `test:ci` command ran the repository-defined supported gate and passed completely, including `match-session`.

## Candidate scope

Authorized implementation scope is exactly:

1. `docs/reports/2026-09-21-p3-b2-fb2-47-controller-defeated-vp-reward-result.md`
2. `packages/rules/src/ability/controller-defeated-vp-reward.ts`
3. `packages/rules/src/ability/interpreter.ts`
4. `packages/rules/src/ability/loader.ts`
5. `packages/rules/src/ability/types.ts`
6. `packages/rules/src/index.ts`
7. `packages/rules/tests/fb2-47-controller-defeated-vp-reward.test.ts`

`packages/rules/src/ability/types.ts` is added only to type the narrow server-owned frozen-root snapshot required to close the exact reviewer P1; it does not add generic event authoring or a defeat subsystem.

No `data/authoring/**`, pack/product/generated output, client production source, Task Index or coverage artifact is modified by this B2 Candidate.

## Next formal step

This Candidate is **not accepted capability state** until a fresh independent R reviews the exact Base/Candidate pair and returns terminal formal evidence, followed by A synchronization if the current repo contract still requires it.

FB2-47 earns zero migration credit. Formal migration remains **`149/944`**, **`795` remaining**.

After exact fresh R acceptance and mechanical A synchronization, the coordinator must freshly reconstruct the complete `servant.nobunaga.skill.sc-nobunaga-3` card. Singleton S is permitted only if both frozen clauses, their ordering, static metadata and full runtime behavior are mechanically zero-gap on that synchronized runtime.
