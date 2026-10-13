# P3-EFP-K03-A: Current-Main Regression Gap Selection

Owner: Codex A. Epoch: FD-P3-2026-09-23-09.
Observed main: `219d47c8dcc2b8118f2d3f6b37f51ce465e737cb`.
Branch: `codex/a-p3-efp-k03-gap-selection`.
Worktree: `D:/fd-validation/a-efp-k03`.
Scope: read-only triage; only this report and its JSON packet may change.

## Result

| Case | Current-main fact | Decision |
| --- | --- | --- |
| SHAPE-003 | Reward mechanism exists under FB2-34's loader predicate, not the old gateway. Four optional object fields still pass through `node(array) -> {}`; current near-match test corrupts scope, not these fields. | One minimal runtime-owner proposal, dynamic red reproduction still required. |
| RESTORE-004 | Historical Stheno sc3 and `pendingBattleCloseDrawPlayTransaction` are absent. Main has sc1/sc2 and different authenticated continuation tests. | Dependency/contract clarification; do not transplant the old stack or repair MatchSession by name. |
| SEC-001 | Accepted B11 repair and concrete credential/HTTP/WS/reconnect negatives are on main. | Reuse; no duplicate security repair. |
| REV-002 | Hub and real WS tests cover omitted/invalid/stale revision for dispatch and end_turn, preserving state/projection/version/broadcasts. | Reuse; no duplicate revision repair. |

**RUNTIME_SEMANTIC_GAP, static evidence only:** the current
`isAcceptedStaticCombatRewardDistributionAbility` checks empty normalized
objects for activation/lifecycle/limit/visibility; `node` discards supplied
non-record containers. This is a defensive compiled admission gap, not a new
claim of a reachable client/raw-loader/snapshot exploit. No current runtime
experiment or gameplay rejection has been executed in this task.

Existing FB2-34 acceptance is independently bound to candidate
`99032d4458352ecdee26dd8964b46ce4e094c0f3` and
[canonical review](https://github.com/binchen648/fd/pull/378#issuecomment-5744013376).
It does not transfer historical accounting or prove the missing negatives.
The older PR474/475 candidates are on a different lineage; their tests,
technical failures and actual sc3 consumer cannot be copied as current-main PASS.

## Only Proposed Slice

`CURRENT_MAIN_STATIC_REWARD_COMPILED_ENVELOPE_GUARD` — proposed, not dispatched.

Owner B, technical review RB. Expected files: the localized predicate in
`packages/rules/src/ability/loader.ts`,
`packages/rules/tests/fb2-34-combat-reward-distribution.test.ts`, and one narrow
B result report. No combat-resolver edit is currently needed: it already calls
the current predicate with form `compiled`.

1. Add four nonempty-array corruption negatives through the current predicate
   and authoritative reward path; record red BEFORE changing admission.
2. Add only scoped object-container guards, if the fresh red reproduction
   confirms the static finding. Do not alter global `node`/`nodes` helpers.
3. Preserve missing optional-field and loader-canonical compiled positives,
   normal/full shared VP pool behavior, losing/inactive/face-down source,
   sole winner, duplicate modifier and Remote Operation controls.
4. Record green, typecheck, source/diff binding and fresh RB verdict under a
   new Planner reservation; a heavy compatibility/CI run requires its own window.

Current fixture numerics are ordinary `vpReward=2/baseVpPerWinner=3` versus
full `4/6`, with competition `1/2` and location `3/6` per tied winner. Historical
PR474 full `5` is not the current test's expected number. Valid battle
progression is not a rejected command: classify invalid modifiers fail-closed
without requiring all legitimate battle state changes to disappear.

Proposed focused command, **not run here**:

```text
npx vitest run packages/rules/tests/fb2-34-combat-reward-distribution.test.ts packages/rules/tests/stheno-consumer-migration.test.ts --maxWorkers=2
```

Before dispatch Planner must confirm current base, exact file/domain ownership
and no competing loader writer. B11 release does not automatically grant this
successor task. If absent-field compatibility or the current contract is
ambiguous, clarify it first; do not broaden the family or port old machinery.

## Evidence Boundaries

The JSON packet contains raw CLI/Git observations, exact source blobs/hashes,
selectors, historical reviewed-candidate/main ancestry and the external K01/K02
review identities. K02 runs from its accepted frozen checkout; its working-tree
object observations are **that checkout**, not current-main proof. Current-main
facts are separately read from the pinned main Git objects and clean checkout.

Static test existence is not fresh semantic execution. Historical RB closure
and post-merge review remain separately attributed. No runtime tests, npm
installation, typecheck, full CI or browser tests were started here. Only
read-only tooling/provenance validation runs. Scoped search found no four-field
guard/negative on this current owner, not an exhaustive repository-wide absence
of every later repair.

Two authorized documentation paths only; no B11/runtime/authoring edits, no
automatic B dispatch, no role PR, no acceptance/Gate/credit change. Ledger
111/944, Gate C NOT_VERIFIED and 93 missing-image gates remain unchanged.
Next: Reviewer A/Planner review this selection and decide the named B task.

## Frozen Packet

Planner authority: 163f8e8469e81bf998f22884e9e529d5792fabe0.
Packet: docs/engineering/lessons/K03-CURRENT-MAIN-GAP-SELECTION.json.
Packet SHA-256: 45934DF6D2959284643CFE26D99FA4B63BC7A603C8F74B506624E1A3234683FA.
Source bytes, review hashes, false old-candidate ancestry results and the exact
K02 CLI receipt are included. Four relevant cases, four UNKNOWN candidates
retained; no current regression executed. Pure admission function equals the
accepted FB2-34 function text: true.

Final remote-main recheck matched the immutable observed main; staged diff-check
and source/raw-receipt hash audit passed. These are provenance checks, not runtime tests.
