# P3-FB2-11 Trusted Round-Number Formula Metric Result

Date: 2026-09-16
Role: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Base A handoff: `c6f1ce1a0aa9c02df19b3eea94a4d013b8033321`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`

## Production change

FB2-11 adds exactly one trusted read-only formula metric:

`game.round_number`

Production delta is limited to two lines of behavior:

1. `packages/rules/src/ability/loader.ts`: add the exact metric name to the existing trusted server-metric allowlist.
2. `packages/rules/src/ability/interpreter.ts`: resolve it directly to authoritative `state.round.roundNumber`.

No formula operator was added. The formula-op set remains exactly `const / var / add / multiply / min / count_cards / gt / lte`. There is no subtraction operator, no string parser, no arbitrary state-path access, and no content identity/text routing.

## Exact Territory expression proof

The focused regression uses a renamed synthetic skill-card definition with:

`16 + (-2 * game.round_number)`

through the existing controlled AST. It proves exact Power values:

- round 1 -> 14;
- round 4 -> 8;
- round 7 -> 2;
- round 8 -> 0.

The metric is read from `state.round.roundNumber` even when priority seat, ability-runtime revision, and consecutive-play counters have unrelated values.

Near variable names `game.current_round`, `current_round`, and `game.round` remain loader-unsupported. `subtract` remains an unsupported formula op and string expressions remain rejected.

## Compatibility

- FB2-02 deployment-resource reward focused suite remains green, proving the accepted Territory reward dependency is unchanged.
- The new FB2-11 regression loads the real Drake archive and verifies the pre-existing movement-distance formula still computes 8 at distance 2.
- Running the complete Drake authoring file yields `24/25`; its only failure is the inherited local `original_card_image existsSync` evidence assertion. The same exact failure independently reproduces on the pre-FB2-11 R32 accepted lineage, so it is not a semantic regression. All 24 remaining Drake tests pass.

## Validation

- fresh dependency install: PASS;
- typecheck: PASS;
- FB2-11 + FB2-02 focused: `2 files / 12 tests PASS`;
- all rules regressions: `50 files / 297 tests PASS`;
- content validation: 7 masters / 7 servants / 20 events / 0 blocking issues;
- deterministic generated content: PASS with unchanged hashes:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`;
- standard full CI: `117 files / 710 tests PASS`;
- production identity/text audit: CLEAN;
- `formulaOps` set unchanged;
- `git diff --check`: PASS.

## Non-promotion

This candidate does not promote broad Formula/Power runtime, arbitrary server-state variables, new operators, string expressions, Territory authoring, FB2-02 scope, or any F1 taxonomy/KPI classification. It is only a trusted read-only server metric for the existing controlled AST evaluator.
