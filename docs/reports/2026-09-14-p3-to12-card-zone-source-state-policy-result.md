# P3-TO-12 Repair Dependency — Card Zone Source-State Policy Result

- Date: 2026-09-14
- Owner: Codex B / Card Zone repair subtask
- Status: `POLICY_IMPLEMENTATION_CANDIDATE`
- Base: `c1facfb7c203ed6078c61613d92386cfe81a83cc`
- Branch: `codex/b-p3-to12-source-state-policy`
- Authorization: R-confirmed TO12 blocker `5c2496be9473a890b5bf8f241579ad5678269606`

## Scope

This candidate defines only `fd.card-zone.active-card-source.v1` and its tests/contract. It does not modify Lifecycle runtime, authoring, generated content, MatchSession, combat, coverage, or Gate status.

The policy binds validity to the exact authoritative source instance plus controller, definition, source ability, active board area, active bit, and face-down state. Unknown policy IDs return `supported=false` and do not fall back.

## Canonical basis

The policy is derived from `docs/rules/FD-Game-Rules-Final.md` 11.1 activation, 11.3 residual, and 11.4 close semantics. In the current runtime model, active board cards occupy `field` or `attack_area`; a valid source must additionally have the server-owned active bit and must not be face-down.

## Verification

- `npm.cmd run typecheck`: PASS
- focused:
  - `packages/rules/tests/core/card-source-state.test.ts`
  - `packages/rules/tests/core/game-loop-action-play.test.ts`
  - `packages/rules/tests/regression/package-exports.test.ts`
  - **3 files / 16 tests PASS**
- exact source instance replacement: rejected
- controller change: rejected
- definition/transform change: rejected
- source ability removal: rejected
- skill/off-active-area source: rejected
- inactive or face-down source: rejected
- unknown policy ID: `supported=false`
- no character/card/ability ID eligibility branch
- no printed-text parsing
- `git diff --check`: PASS

## Acceptance boundary

This candidate is not yet an `accepted_source_state_policy`. A fresh independent review must accept the exact candidate before TO12 Lifecycle r1 may label or consume it as accepted.
