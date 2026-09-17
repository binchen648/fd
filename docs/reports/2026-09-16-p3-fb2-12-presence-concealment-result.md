# P3-FB2-12 Presence Concealment Pre-Scoring Response — B2 Result

Date: 2026-09-16
Owner: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Base / A handoff: `f1bd75e958753ca48d8d08a9a37bb8901abbeadc`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Implemented contract

FB2-12 adds only the identity-free optional Presence Concealment strict-second response required by the A handoff.

- Backend freezes authoritative participant Power for a battlefield and emits trusted `after_battle_power_calculated` before BattleResult construction/scoring.
- Only the exact structural optional-trigger shape may open `post_power_response`.
- Eligibility is evaluated exclusively from the trusted event snapshot: 3+ participants; controller below the highest opponent tier; no non-highest opponent above controller Power.
- The controller may resolve or decline. Decline does not consume the once-per-round use.
- Resolution derives every highest-Power opponent from the same frozen snapshot; no client target selection exists.
- Resolution stages a one-shot battle-local pending defeat request. It does not mutate PlayerState and does not create a generic defeat API.
- Battle settlement validates the frozen snapshot again, checks existing Basic Luck loss-ignore semantics per target, consumes successful targets into the existing winner-exclusion path, and calls the existing BattleResult/scoring implementation.
- Successful highest-Power defeat therefore promotes the next eligible tier through the normal result builder; ignored targets remain eligible.
- Matching pending markers are consumed after that battle and cannot leak to another battlefield/round.
- The trusted power event is replay-stable through deterministic event identity. While a response is pending there is no BattleResult, so scoring cannot run early.

The pre-existing in-progress implementation in this B2 worktree was preserved. The missing trusted event producer and pre-scoring barrier were completed without discarding that work.

## Production files

- `packages/rules/src/ability/types.ts`
  - trusted event snapshot field and one-shot pending defeat evidence type.
- `packages/rules/src/ability/loader.ts`
  - exact trusted trigger/condition/effect vocabulary only.
- `packages/rules/src/ability/interpreter.ts`
  - identity-free strict-second classifier, eligibility, response routing, and one-shot staging.
- `packages/rules/src/core/combat-resolver.ts`
  - trusted post-power/pre-scoring barrier, frozen-snapshot validation, Basic Luck handling, winner recomputation through the existing result builder, and marker consumption.
- `packages/rules/src/schema/game.ts`
  - optional battle-local `presenceConcealmentDefeatedPlayerIds` evidence on BattleResultState.

No authoring archive, F1 artifact, taxonomy input, MatchSession implementation, scoring resolver, formula DSL, or unrelated skill handler was changed.

## Focused evidence

`packages/rules/tests/regression/fb2-presence-concealment-pre-scoring.test.ts` — `10 / 10 PASS`.

The suite proves:

1. exact shape classification is identity-free and near variants fail closed;
2. `[5,10,10]` pauses before BattleResult/scoring and exposes an optional response;
3. decline preserves the original tied highest winners and does not consume the once-per-round use;
4. resolve defeats/excludes both highest opponents and promotes the strict-second controller through the existing BattleResult builder;
5. Basic Luck ignores Presence defeat for that target and keeps it winner-eligible;
6. 2-player, intermediate `[5,10,7]`, and controller-highest cases do not open a response;
7. equal strict-second peers are legal and highest targets are derived without client selection;
8. existing scoring consumes the recomputed BattleResult rather than a second scoring path;
9. multiple eligible responders queue in turn order; duplicate highest-target requests are deterministic/idempotent;
10. changed Power between response and settlement fails closed, and consumed markers do not leak to another battlefield.

High-risk compatibility set: `8 files / 101 tests PASS`, including core combat, winner conformance, B18/B19/B21 post-scoring triggers, complex skills, and MatchSession `26/26`.

## Full validation

- `npm.cmd run typecheck`: PASS.
- rules regression + core: `64 files / 378 tests PASS`.
- `npm.cmd run content:validate`: `7 masters, 7 servants, 20 events, 0 blocking issues`.
- `npm.cmd run verify:generated-content`: PASS with unchanged hashes:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- standard `npm.cmd run test:ci`: `118 files / 720 tests PASS`.
- `git diff --check`: PASS.

A raw `vitest run packages/rules` additionally reaches historical source-asset authoring checks that require local CHM/card-image paths absent from this workstation; those asset-existence assertions fail independently of FB2-12. All runtime behavior in those files remains green, and the repository's standard `test:ci` intentionally excludes those source-asset-only tests and passes `720/720`.

## Coverage / determinism

Fresh `phase3:coverage` remains exactly at the FM05 accepted semantic baseline:

- archives `69`
- cards `101`
- abilities `200`
- `newRuntimeSemanticRouted=22`
- `legacyExecuteAbility=3`
- `legacyResolveEffect=127`
- `dualRuntime=0`
- `notClassifiable=48`
- `taxonomyWarnings=124`
- compiled definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`
- blocking issues `0`

The generated artifact differs only by `generatedAt` and static interpreter source line numbers caused by this runtime insertion. It is intentionally not part of the B2 candidate commit.

## Scope / safety audit

- exact twelve future FM06 IDs in production diff: `0`;
- Chinese skill text / `气息遮断` / `刺杀` in production diff: `0`;
- authoring changes: `0`;
- F1 inventory/evidence/taxonomy changes: `0`;
- broad exported post-result Presence rewrite API: `0`;
- Sion Presence Concealment EX routing/promotion: `0`;
- client-supplied Power authority: `0`;
- independent second scoring engine: `0`.

## Reviewer handoff

R35 must independently verify the exact candidate SHA and must not implement fixes. Particular attention should be paid to trusted-event timing, optional-response semantics, frozen snapshot replay, Basic Luck, multiple responders, once-per-round use, marker cleanup, existing Return Silence behavior, and whether the exact twelve-member FM06 family is dependency-complete after this contract.