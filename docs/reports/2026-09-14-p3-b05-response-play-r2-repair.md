# P3-B05 Response Play R2 Repair

- Document Role: AGENT_IMPLEMENTATION_REPORT
- Owner: Codex B
- Task: P3-B05
- Base Candidate: `d03cde2f24b569222b3bd39b57f60dee610c7aa5`
- Review Finding: `b2e8db355266bfa9ff988d0a46f3c07b1af29c44`
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`

## Review blocker repaired

Fresh R05 found that the typed Volumen `play_source_card` path could bypass shared card-play forbid rules. A response action remained available and successfully played Volumen even when `modeState.cardPlayForbids` forbade one of its printed attributes.

The repair does not add any card or ability identity branch. It makes effect-driven source-card play reuse the shared card-play legality/execution path:

- response eligibility now reuses shared play legality while intentionally ignoring only the normal card timing and regular attack quota that the response card text overrides;
- typed `play_source_card` executes through `playBatch(..., 'effect')`;
- shared play forbids, play requirements, card play limits, printed card cost, card-state updates, counters, and play-trigger processing are therefore inherited instead of reimplemented;
- fixed response mana availability includes both the ability cost and any printed face-up card play cost;
- server dispatch continues to revalidate source-in-hand and current mana before accepting a stale response action.

## Added regression proofs

`packages/rules/tests/regression/card-action-play-source-response.test.ts` now includes persistent coverage for:

1. a response action captured while legal becoming illegal after controller mana falls below the fixed cost; no mana/card/event/revision/window commit occurs;
2. a response action captured while legal becoming illegal after a shared attribute play-forbid appears; no mana/card/event/revision/window commit occurs.

## Verification

- `npm run typecheck`: PASS.
- focused B05/B04/data-flow/executable-pack/complex regressions: 5 files, **87/87 PASS**.
- Volumen browser/WS/reconnect/stale-command Playwright: **1/1 PASS**.
- repeat Playwright stability run: **5/5 PASS**.
- `git diff --check`: PASS.

Full-suite environment result:

- `npm run test:ci`: **487 passed / 5 failed / 492 total**.
- The five failures are the same inherited environment/baseline classes already observed before this repair: missing CHM/image evidence, the historical absolute `D:\\fd\\data\\manifests\\sample-cards.json` path (two tests), and the pre-existing generated-content definition-hash mismatch.
- No B05 focused/runtime regression failed.

Content compile environment result:

- `npm run content:compile` is blocked by **93 MISSING_IMAGE** evidence entries in this clean worktree. This is the same external evidence-path condition and is not introduced by the B05 runtime diff.

## Scope boundary

This repair changes only shared play legality needed by the exact B05 response-play contract and B05 focused regression tests. It does not modify coverage KPI/taxonomy artifacts, roster migration, ADD_TO_ATTACK, ACTIVATE, CLOSE, CREATE_AND_ACTIVATE, or unrelated runtime families.

Independent R05 re-review is still required before acceptance.
