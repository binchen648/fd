# P3-FB2-11 Current-Main Round-Number Formula Candidate

Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Exact Base: `1d0500390081620e94cd21d56ac83b4eafc51057`
Branch: `codex/b2-p3-fb2-11-current-main-20261025`

## Scope

This candidate adds exactly one identity-free, read-only formula metric:
`game.round_number -> state.round.roundNumber`. The loader allowlist now admits
that exact variable and the evaluator reads only the authoritative round field.
No subtraction or other formula operator, string expression, arbitrary state
path, identity/text routing, or F1 authoring was added. FM03/FM04 material is
not included.

Changed files are limited to:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/loader.ts`
- `packages/rules/tests/regression/fb2-round-number-formula.test.ts`
- this report

## Evidence

- Focused FB2-11 + FB2-02: `2 files / 13 tests PASS`.
- Rules regression suite: `49 files / 293 tests PASS`.
- Standard full CI (`npm run test:ci`): `116 files / 706 tests PASS`.
- Typecheck (`npm run typecheck`): PASS.
- Generated-content determinism (`npm run verify:generated-content`): PASS.
  Hashes remained:
  `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`,
  `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`,
  `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- Focused tests cover near-variable fail-closed loading, authoritative values
  at rounds 1/4/7/8, non-inference from unrelated counters, existing formula
  compatibility, rejection of subtraction/string expressions, and rejection
  of a malformed operator-plus-round-variable node before evaluation.

The malformed `var: game.round_number` plus `op: subtract` shape is now
rejected consistently by the loader and evaluator. The canonical metric is
accepted only as a standalone `{ var: 'game.round_number' }` node, preventing
the variable branch from bypassing operator validation.

The first focused attempt before dependency setup exited nonzero because the
fresh worktree had no installed `vitest`/built workspace packages. After
`npm ci` and the successful root typecheck, the focused and compatibility
runs above passed. This environment receipt is recorded rather than treated
as a product failure.

## Review boundary

This is a fresh Candidate from the current-main FB2-10 A-sync Base. Historical
FB2-11 review evidence is semantic reference only and is not claimed as
current-main review. No migration credit, acceptance, merge, or successor
promotion is claimed.
