# Golden Flow 2 Independent Review R2

- Date: 2026-09-14
- Reviewer worktree: `E:\Codex\FD\fd-r-gf2-r2`
- Candidate exact SHA: `7130adb460165874a24308ff03f5448a7169d931`
- Candidate base: `1f9e1e536ae251b61ec806359289256f8c44c977`
- Prior review: `5cb7eaffc5fcfbf28926765aac5ab58db32871eb`
- Final: `E2E_VERIFIED`
- Blocking findings: 0

## Scope of acceptance

This review accepts the named **Golden Flow 2 representative flow** for Combat + Power + Winner + VP through Gate A + Gate B + Gate C.

It does **not** claim that every power modifier, every battle mechanic, the full roster, or Phase 3 as a whole is verified. The acceptance is representative production-path evidence under the inheritance constraints already documented in `docs/plans/fd-golden-card-and-flow-acceptance-plan.md`.

## Candidate scope

Diff from the reviewed base contains only four added evidence/report files:

- `docs/reports/2026-09-14-golden-flow-2-evidence-repair.md`
- `packages/rules/tests/regression/golden-flow-2-combat-power-winner-vp.test.ts`
- `e2e/support/build-golden-flow-2-snapshot.ts`
- `e2e/fd-golden-flow-2-combat-power-winner-vp.spec.ts`

No production runtime file is changed by this candidate.

## Review of the prior blocker

The first review correctly blocked promotion because the historical result report named three Golden Flow 2 evidence files that were absent from the current tree and unreachable in repository history. The candidate restores reproducible named evidence, so that blocker is closed.

The first review also observed server/typecheck failures. R2 determined that this second finding was a reviewer-environment artifact: the first reviewer had a `node_modules` junction resolving `@fd/rules` to another worktree. In the fresh R2 worktree, local workspace links were installed and verified to resolve `@fd/rules` to `E:\Codex\FD\fd-r-gf2-r2\packages\rules`. With the normal composite workspace build prerequisites present, unchanged production server/typecheck evidence passes. Therefore the prior server/API failure is withdrawn and is not a candidate defect.

## Static evidence audit

### Pre-battle fixture integrity

The E2E snapshot builder does not call or precompute:

- `resolveBattlefield`
- `applyBattleScoring`
- `battleResults`
- `battleHistory`
- final winner VP

The browser test first observes:

- phase = `action`
- priority = `p5`
- `battleBreakdowns = []`
- projected revision present

The settlement is then initiated by the real browser end-action button.

### Real production chain

The browser test captures the outgoing websocket message and proves the main transition is:

`Browser End Action -> client:end_turn(expectedRevision) -> server revalidation -> MatchRoom.endClientTurn -> MatchSession.passPriority -> battle resolver -> scoring -> round_end -> projection`

The settled projection proves:

- Miyama battlefield result exists exactly once;
- p1 effective power 5 vs p2 effective power 4;
- p1 sole winner, margin 1;
- event VP pool 5;
- competition VP pool 2;
- p1 projected VP 7.

### Reconnect / replay safety

The browser reload receives the same settled projection and revision. Replaying the original stale `client:end_turn` command is rejected with `Stale command revision`. VP remains 7 and the battle breakdown count remains 1, proving no duplicate settlement.

The rules regression independently serializes/restores the settled MatchRoom and verifies a later end-turn attempt cannot score again.

## Independent verification

Fresh reviewer environment setup:

- `npm ci --ignore-scripts`
- verified `node_modules/@fd/rules` resolves to this reviewer worktree;
- clean install required composite build outputs for `@fd/contracts` and `@fd/content`, generated with `npx tsc -b packages/contracts packages/content` before tests.

Results:

- Golden Flow 2 + battle/core/MatchSession focused rules:
  - PASS: 5 files / 44 tests.
- Root typecheck:
  - PASS.
- Server websocket tests:
  - PASS: 1 file / 2 tests.
- Client engine bridge:
  - PASS: 1 file / 5 tests.
- Golden Flow 2 + remote sync Playwright, Chromium, repeat-each=5:
  - PASS: 10/10.
- `git diff --check`:
  - PASS.
- Reviewer worktree after verification:
  - clean.

## Gate decision

- Gate A: PASS for the representative battle/power/scoring components used by this flow.
- Gate B: PASS for the named production MatchRoom/MatchSession scenario together with existing tie/exclusion battle conformance evidence.
- Gate C: PASS for real browser -> websocket -> server revalidation -> production settlement -> projection -> reconnect -> stale-command rejection.

**Golden Flow 2 representative slice: `E2E_VERIFIED`.**

This acceptance may satisfy prerequisites that explicitly require an independently accepted Golden Flow 2 representative path. It does not authorize global Phase 3 PASS, roster migration PASS, or release readiness.
