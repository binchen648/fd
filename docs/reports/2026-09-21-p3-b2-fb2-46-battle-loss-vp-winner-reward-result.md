# P3-B2 FB2-46 Battle-Loss VP Winner Reward Result

Role: Codex B2
Status: `CANDIDATE_READY_FOR_FRESH_R`
Date: 2026-09-21

## Exact dispatch input

- Task: `P3-FB2-46-BATTLE-LOSS-VP-WINNER-REWARD`
- Exact A dispatch Base: `4a31e42c0a4b1c687badba8161503313d6606e75`
- A dispatch branch: `codex/a-p3-fb2-46-battle-loss-vp-winner-reward-dispatch`
- B2 branch: `codex/b2-p3-fb2-46-battle-loss-vp-winner-reward`
- Formal migration before/after this capability Candidate: **`149/944`**
- Formal remaining: **`795`**
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

FB2-46 is identity-free capability work and earns zero migration credit. No consumer authoring is materialized by this Candidate.

## Fresh independent review cycle 1

- Reviewed Candidate: `2c4d46f8a3df3ffdc9e48f992308ae5c7ecdfb49`
- Canonical reviewer evidence: `https://github.com/binchen648/fd/pull/410#issuecomment-5752950621`
- Terminal verdict: `IMPLEMENTATION_NEEDS_REVISION`
- Unique blocking finding: raw `markers` was present in the FB2-46 top-level allowlist but not validated by the exact authoring classifier, so malformed scalar markers could normalize away and `['真名解放']` could be interpreted by loader post-processing after bypassing `battleLossVpWinnerReward.gateway`.
- Minimal revision applied on the same PR/branch: the classifier now accepts `markers` only when absent or an exact empty array; malformed/nonempty marker payloads are rejected by the existing explicit FB2-46 gateway. Focused regressions cover both `markers: 'bad-scalar'` and `markers: ['真名解放']`, while explicitly proving `markers: []` remains accepted.
- No loader/runtime-settlement semantics were widened or otherwise changed by this revision.

## Implemented bounded contract

FB2-46 adds exactly one dedicated executable transaction effect:

```json
{
  "type": "battle_loss_vp_then_reward_winners",
  "lossAmount": 2,
  "winnerRewardAmount": 2
}
```

The whole parent ability is admitted only when it is the exact fail-closed envelope released by A:

- `kind: forced_trigger`;
- activation contains only `trigger: after_controller_loses_battle`;
- exactly one condition, `event_player_is_controller`;
- no targets, cost, creates, or rule modifiers;
- exactly one dedicated FB2-46 effect;
- `lossAmount` and `winnerRewardAmount` are positive safe integers;
- top-level `markers` is absent or an exact empty array only;
- empty lifecycle, responseWindow, limit and visibility in authoring form;
- automatic execution;
- malformed object/scalar containers do not normalize to empty acceptance.

The dedicated candidate detector walks the full raw ability. The historical raw tokens `lose_victory_points`, `thenIfAnyLost`, and `event_combat_winners` are deliberately treated only as candidate markers and are rejected through `battleLossVpWinnerReward.gateway`; they are not exposed as new generic executable vocabulary.

## Authoritative runtime settlement

`packages/rules/src/ability/battle-loss-vp-winner-reward.ts` validates server-owned per-battle loss facts before any mutation:

- battle phase and current round are authoritative;
- event type is `after_controller_loses_battle` and `event.playerId === controllerId`;
- exact phase id `battle-phase:<round>`;
- exact positive-ordinal battle id under the event battlefield;
- result id is exactly `${battleId}:result`;
- derived loss-event id is exactly `${resultId}:lose:${controllerId}`;
- participants, winners, and losers are dense unique known player ids;
- winners are nonempty and disjoint from losers;
- controller is a participant and loser, never a winner;
- every participant is represented by the frozen winners/losers set.

Settlement uses only the frozen `event.battleResult`, never live location, current Power, global battle history or winner recomputation:

1. snapshot controller VP;
2. deduct `min(lossAmount, currentVP)` with floor zero;
3. compute actual VP loss;
4. emit authoritative controller VP adjustment evidence with trigger and battle provenance;
5. if actual loss is zero, reward nobody;
6. if actual loss is positive, reward each frozen same-result winner exactly `winnerRewardAmount` once;
7. reward amount is fixed rather than proportional to actual loss: VP `1 -> 0` still pays each winner `+2` for the frozen `2/2` shape;
8. shared/tied winners each receive the fixed reward once;
9. invalid event facts or unsafe VP state fail before commit through the existing cloned `processAbilityEvent` transaction boundary;
10. the existing processed-event boundary makes repeat processing idempotent;
11. the existing `preventEffects` barrier prevents both sides of the transaction.

VP evidence reuses the existing typed runtime event convention and includes `sourceCardId`, `abilityId`, `triggerEventId`, `battlePhaseResolutionId`, `battleId`, `battlefieldId`, `resultId`, requested delta, actual delta and before/after values. Zero actual loss is normalized to numeric `0`, never JavaScript `-0`.

## Scope

Production changes are intentionally narrow:

1. `packages/rules/src/ability/battle-loss-vp-winner-reward.ts` — dedicated classifier, amount extraction and trusted battle-loss provenance validation;
2. `packages/rules/src/ability/loader.ts` — dedicated effect token/mechanic-key admission plus exact whole-ability gateway;
3. `packages/rules/src/ability/interpreter.ts` — compiled fail-closed gates and atomic transaction settlement;
4. `packages/rules/src/index.ts` — public rule-package export;
5. `packages/rules/tests/fb2-46-battle-loss-vp-winner-reward.test.ts` — focused contract/provenance/regression coverage;
6. this result report.

No new schema/runtime ledger or executable-pack route was required. No `data/authoring/**`, `data/packs/**`, generated product output, client production code or coverage artifact is part of the Candidate. Production rules code contains no Nobunaga/master/servant/name/Chinese identity routing.

## Focused evidence

The dedicated FB2-46 suite proves:

- exact authoring and compiled classifier admission;
- exact amount extraction;
- fail-closed gateway behavior for wrong trigger, extra condition/effect/key, malformed/nonempty `markers` (including scalar and `真名解放`), malformed target/cost/create/modifier/lifecycle/response/limit/visibility containers, nonpositive/noninteger/non-number amounts, historical raw `lose_victory_points` / `thenIfAnyLost` / `event_combat_winners`, and the dedicated token hidden in a forbidden container; explicit empty `markers: []` remains accepted;
- normal `5 -> 3` loser deduction and same-result winner `+2`;
- unrelated player receives no reward;
- `1 -> 0` still rewards the fixed `+2`;
- `0 -> 0` rewards nobody and logs an actual delta of `0`;
- multiple frozen winners each receive the reward once;
- another losing participant never receives the reward;
- trusted provenance rejects wrong event type/player/phase, missing or malformed battle/result/battlefield ids, duplicate or incomplete participants, empty/duplicate/out-of-participant winners, winner/loser overlap, controller not losing, controller also winning, and malformed derived loss-event id;
- malformed trusted provenance fails atomically;
- processing the same authoritative root battle-result event twice is idempotent;
- the existing effect-prevention barrier pays neither side.

Focused compatibility run also covers existing battle-loss resource, unpreventable VP, shared-victory VP, optional battle-result VP and FB2-34 combat-reward behavior.

## Validation

Fresh B2 worktree dependencies were installed with `npm.cmd ci --ignore-scripts --offline` (239 packages, 0 vulnerabilities).

Validation on the final implementation before Candidate commit:

- `npm.cmd run typecheck` — PASS.
- FB2-46 + current-round battle provenance + related VP/battle focused compatibility — PASS, **7 files / 50 tests**; FB2-46 itself **9/9**.
- rules `src/__tests__ + core + regression + FB2-34 + FB2-45 + FB2-46` strong suite — PASS, **85 files / 522 tests**.
- `npm.cmd run test:ci -- --maxWorkers=2` — PASS, **172 files / 1231 tests**.
- `npm.cmd run content:validate` — PASS, **7 masters / 7 servants / 20 events / 0 blocking issues**.
- `npm.cmd run verify:generated-content` — PASS with unchanged hashes:
  - library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- `npm.cmd run phase3:reference:verify -- --reference-root E:\\Codex\\FD\\fd-reference` — PASS at exact Locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- `npm.cmd run build --workspace @fd/client` — PASS; only existing Vite browser-externalization/chunk-size warnings.
- `npm.cmd run phase3:coverage` — PASS: **125 archives / 167 cards / 278 abilities / 0 blocking issues**, `newRuntimeSemanticRouted=22`, `dualRuntime=0`; generated `artifacts/phase3-skill-coverage.json` was restored from HEAD because it is validation output outside B2 scope.
- forbidden production scope audit — PASS: no authoring/product/generated/client/artifact delta.
- runtime identity-literal audit — PASS: no added Nobunaga/servant/master/name routing in `packages/rules/src`.
- `git diff --check` — PASS.

## Next gate

This Candidate claims only FB2-46 capability acceptance, not consumer migration and not migration credit. Formal migration remains **`149/944`**, with **`795`** remaining.

After exact fresh independent R returns `IMPLEMENTATION_ACCEPTED_CANDIDATE` and A synchronizes this capability, A must freshly reconstruct the complete `servant.nobunaga.skill.sc-nobunaga-3` card against that synchronized runtime. FB2-46 does **not** authorize or imply `player.defeated` semantics; if that or any other whole-card gap remains, record the residual blocker and continue migration-credit-first probing. Dispatch singleton S only if the entire Nobunaga card is mechanically zero-gap.
