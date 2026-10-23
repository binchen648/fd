# P3-B21 current-main independent Reviewer

Date: 2026-10-24
Exact Base: `c6e514a4da8c51e16f506bdef51eb981af613290`
Exact Candidate: `61207ac78b705243b1269b25167092f28fcb53bd`
Reviewer branch: `codex/r-p3-b21-current-main-20261023`
Verdict: **MIGRATION_ACCEPTED**

## Reviewed scope

Only Tomoe `sc-tomoe-1.penalty-on-defeat` was reviewed. The forced `after_controller_loses_battle` trigger applies one typed controller VP adjustment of `-5`. Its sole prevention modifier explicitly ignores `effect_prevention` for `this_effect` at `explicit_exception` priority. The classifier is structural and rejects wrong activation, effect, response, visibility, and modifier shapes without an ability-ID route or legacy fallback. It retains no optional response semantics.

The collector requires the controller in both the battle participant list and authoritative loser list. Missing provenance does not trigger the penalty. Production settlement occurs after the phase-wide post-scoring barrier. Prevention cannot suppress the effect, VP floors at zero with an actual typed delta, and replay/reconnect/stale commands cannot apply it twice. Related B13-B20 behavior remains valid.

## Independent verification

- Fresh separate Reviewer worktree: `npm ci`, `npm run typecheck`, and `git diff --check` passed.
- Focused B21 plus B13-B20, Tomoe authoring, and complex regression selection: 11 files / 137 tests passed.
- Chromium Gate C: 1/1 passed for barrier settlement, reconnect persistence, and stale replay rejection.
- `golden-card-content-pipeline.test.ts`: 2/2 passed. `npm run verify:generated-content`: exit 0. The versioned content library now matches the loader's compiled definition hash.
- Full Base `npm run test:ci -- --reporter=dot`: exit 1, 8 failed / 1,516 passed / 114 skipped.
- Full Candidate, same environment and command after typecheck: exit 1, 8 failed / 1,517 passed / 114 skipped. The failures are the same historical Phase-3 provenance Git-path/blob failures. The extra passing test is new B21 provenance coverage. The full suite is **not green**.

This accepts only the B21 slice. No A-sync, merge, or migration-credit change was performed.
