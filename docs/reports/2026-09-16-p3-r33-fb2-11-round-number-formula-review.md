# P3-R33 FB2-11 Trusted Round-Number Formula Metric Review

Date: 2026-09-16
Role: R
Candidate: `5383c37c8362341b8a581624b8ad1d77ddce3567`
Candidate base / A handoff: `c6f1ce1a0aa9c02df19b3eea94a4d013b8033321`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Verdict: `GATE_A_B_CANDIDATE_ACCEPTED`

## Findings

No blocking findings.

## Candidate scope judgment

The production delta is exactly two narrow changes:

- loader trusted-server-metric allowlist adds `game.round_number`;
- formula evaluator resolves that exact metric to authoritative `state.round.roundNumber`.

The formula operator set remains unchanged: `const / var / add / multiply / min / count_cards / gt / lte`. No subtraction op, string formula parser, arbitrary state path, character/card/ability identity, printed-text routing, or authoring migration was added.

## Runtime semantic judgment

Independent focused evidence confirms:

- exact `game.round_number` is loader-accepted;
- `game.current_round`, `current_round`, and `game.round` remain unsupported;
- the Territory expression `16 + (-2 * game.round_number)` computes exactly 14 / 8 / 2 / 0 at rounds 1 / 4 / 7 / 8;
- the value comes directly from authoritative round state and is unaffected by priority seat, ability-runtime revision, or consecutive-play counters;
- `subtract` remains unsupported and string expressions remain rejected;
- existing real Drake movement-distance formula behavior remains unchanged;
- FB2-02 deployment-resource reward remains unchanged and green.

## Prospective FM05 family reconciliation

Reviewer independently reconstructed the exact Territory Creation family from frozen F1 and locked Reference:

- exact members: `10`;
- canonical authoring currently present: `0/10`;
- full-text SHA is unique across all ten: `295a5b531db5d1031cbbb89dc677e76737b7d3b3c7ca70af59405cc84bd98c58`;
- clause-source hash signature is identical 10/10:
  - `a65ce56a69bba9214eba95ab30154209228bcd28f7fec21f6317c8a70f421847`;
  - `2137380f5f57233a98494f45a9d12a848f3d1cf710101c60462c523ea3f1624f`;
- Reference handler is uniformly `core.territory-creation`;
- Reference static metadata has one signature: `typeLabel=魔术`, `cost=0`, historical `requirement=0`, historical static `basePower=2`;
- F1 split is exactly `5` block-free Resource rows and `5` rows retaining `SPECIAL_EFFECT:territory_construction_scaling_rule`.

Because text, clause hashes, handler, and static metadata are identical, the 5+5 split is evidence-classification drift rather than a semantic family split. The complete printed two-clause card is dependency-complete under accepted FB2-02 deployment reward plus accepted FB2-11 round-number formula metric.

Historical Reference `basePower=2` is not promoted as the actual dynamic Power rule; frozen F1's explicit X formula remains semantic authority and the historical number must be retained only as metadata in future authoring.

## Independent validation

- fresh dependency install: PASS;
- typecheck: PASS;
- FB2-11 + FB2-02 focused: `2 files / 12 tests PASS`;
- all rules regressions: `50 files / 297 tests PASS`;
- content validation: `0` blockers;
- deterministic generated-content hashes unchanged:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`;
- standard full CI: `117 files / 710 tests PASS`;
- production identity/text audit: CLEAN;
- `formulaOps` unchanged;
- candidate diff check: PASS.

The complete Drake authoring suite's inherited local original-card-image existence assertion is not a blocker: the same exact single failure reproduces on the pre-FB2-11 accepted R32 lineage, while the remaining Drake 24/24 tests pass. FB2-11 separately proves the real Drake movement-distance formula remains correct.

## Final judgment

`GATE_A_B_CANDIDATE_ACCEPTED`.

A may synchronize this exact metric and the exact ten-member Territory Creation family reconciliation. Broad Formula/Power runtime, arbitrary server metrics, other special families, and migration itself remain unaccepted until their own gates.
