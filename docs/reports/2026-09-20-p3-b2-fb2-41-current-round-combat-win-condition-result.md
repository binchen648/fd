# P3-B2 FB2-41 Current-Round Combat-Win Absence Condition Result

Role: Codex B2
Status: `CANDIDATE_READY`
Date: 2026-09-20

## Dispatch binding

- Exact A dispatch Base: `5b5d32284efe9c4a6b9f6a169fb268e8cb1aba27`
- Dispatch report: `docs/reports/2026-09-20-p3-a-fb2-41-current-round-combat-win-condition-dispatch.md`
- Formal migration accounting at Base: `143/944`; remaining `801`.
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- Frozen F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`.

FB2-41 is identity-free runtime capability work and earns zero migration credit.

## Implemented capability

Implemented the exact narrow structural seam for:

```json
{ "type": "player_flag_number_not_current_round", "key": "combatWinRound" }
```

The implementation does not expose generic player flags. It adds only a server-owned last-combat-win-round ledger keyed by player and the exact current-round absence condition.

### Authoritative win recording

`recordCurrentRoundCombatWinsFromBattleResult` accepts only current-round authoritative battle-result provenance:

- runtime exists and the authoritative phase is `battle`;
- event type is exact `after_battle_result_determined`;
- `battlePhaseResolutionId` is exact `battle-phase:<currentRound>`;
- `event.id`, `battleId`, and `resultId` are internally consistent;
- battlefield is a currently enabled, non-closed battle-reward location;
- battle ordinal is a positive safe integer;
- participant / winner / loser arrays are dense, unique, known-player ids;
- winners and losers are disjoint subsets of the authoritative participant set; participant-only entries are permitted because the production game loop intentionally omits loss-effect-suppressed losers from `battleResult.loserIds`.

Only after all validation succeeds does the runtime write `abilityRuntime.combatWinRoundByPlayer[winnerId] = currentRound`. Shared/tied winners are all recorded. Losers and nonparticipants are not recorded. Invalid/stale envelopes return fail-closed without creating or mutating the win-round ledger.

### Round-end condition

`currentRoundCombatWinAbsent` evaluates only when:

- runtime exists;
- the current authoritative phase is `round_end`;
- the event is exact type `round_end`;
- the controller exists;
- current round and any recorded ledger value are safe positive, non-future integers.

The condition is true exactly when the controller's recorded last combat-win round is not the current round. A prior-round win therefore does not suppress the current round-end absence check. Corrupt/future ledger state fails closed.

### Integration

- Loader admits either the already accepted exact FB2-38 `combatLossRound` condition or the new exact FB2-41 `combatWinRound` condition, preserving FB2-38 diagnostics and rejecting other keys/widened shapes.
- Interpreter routes the exact win condition to the new evaluator and records winners when processing authoritative battle-result events.
- `AbilityRuntime` adds only optional `combatWinRoundByPlayer?: Record<PlayerId, number>`; no generic arbitrary flag map is introduced.
- Public rules exports expose the narrow FB2-41 helpers for focused mechanical testing.

## Scope / identity audit

Base-to-working-tree scope is limited to:

- `packages/rules/src/ability/current-round-combat-win-condition.ts` (new);
- `packages/rules/src/ability/interpreter.ts`;
- `packages/rules/src/ability/loader.ts`;
- `packages/rules/src/ability/types.ts`;
- `packages/rules/src/index.ts`;
- `packages/rules/tests/fb2-41-current-round-combat-win-condition.test.ts` (new);
- this result report.

No `data/authoring/**`, product pack/generated content, content package, or client production file changes exist. Production forbidden-token audit is clean for Nero identity/name/skill ids/printed text, F1 hash, and Locked Reference hash. The structural token `combatWinRound` appears only as the exact dispatched generic condition/ledger key.

Branch-local frozen-roster accounting remains exactly:

- frozen identities: `944` (`943 static + 1 dynamic`);
- unique authoring card ids: `161`;
- frozen overlap: `138/944`;
- frozen duplicate ids: `0`.

Therefore FB2-41 adds **zero** migration credit. Formal project migration remains **`143/944`**, with **`801`** remaining.

## Validation

Environment protocol was followed. This fresh worktree had no `node_modules`, so installation used only:

- `npm.cmd ci --ignore-scripts --offline` — PASS, 239 packages, 0 vulnerabilities.

Validation on the Candidate working tree:

- `npm.cmd run typecheck` — PASS.
- FB2-41 + existing FB2-38 focused — PASS, **2 files / 22 tests** (`10 + 12`).
- rules `src/__tests__ + core + regression + focused` — PASS, **84 files / 516 tests**.
- `npm.cmd run test:ci -- --maxWorkers=2` — PASS, **161 files / 1132 tests**.
- `npm.cmd run content:validate` — PASS, **7 masters / 7 servants / 20 events / 0 blocking issues**.
- `npm.cmd run verify:generated-content` — PASS with stable hashes:
  - library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- `npm.cmd run phase3:reference:verify -- --reference-root E:\Codex\FD\fd-reference` — PASS at exact Locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- `npm.cmd run build --workspace @fd/client` — PASS; only existing Vite browser-externalization/chunk-size warnings.
- `git diff --check` — PASS.
- production identity-hardcode audit — CLEAN.
- authoring/product/client scope audit — CLEAN.
- frozen overlap audit — `138/944`, duplicates `0`.

## Revision after fresh R finding

Fresh independent R reviewed exact Candidate 60d937e3b1a2b2bda4fb0a61cbbbf4d8326d2337 and returned IMPLEMENTATION_NEEDS_REVISION at canonical evidence https://github.com/binchen648/fd/pull/392#issuecomment-5747755871.

The single blocking finding was that production game-loop intentionally removes lossEffectSuppressedPlayerIds from attleResult.loserIds while retaining them in attleParticipantIds; the first Candidate's exact-union check therefore rejected a legitimate authoritative battle-result envelope and failed to record the real winner.

The minimal revision only:

- removes the invalid exact-union requirement while preserving dense/unique/known participant validation, winner/loser membership validation, and winner/loser disjointness;
- adds one focused regression that sends a battle result with lossEffectSuppressedPlayerIds: ['p2'] through the real stepGameLoop producer/queue path and verifies winner p1 is recorded for the current round;
- updates this report to reflect the corrected producer semantics and rerun validation counts.

No consumer authoring, second capability, generic flag interpreter, merge/retarget, or migration credit is introduced by the revision.
## Reviewer handoff

The exact committed Candidate must receive a fresh independent read-only R review against its exact Base. Accepted formal verdict for this B2 is `IMPLEMENTATION_ACCEPTED_CANDIDATE`; revision verdict is `IMPLEMENTATION_NEEDS_REVISION`.

Do not merge or retarget. Do not credit any frozen identity. On fresh R acceptance, A synchronizes FB2-41 with zero migration credit and immediately re-overlays the intended closure target `servant.nero.skill.sc-nero-1`; only a mechanically zero-issue whole card may then be dispatched as S.
