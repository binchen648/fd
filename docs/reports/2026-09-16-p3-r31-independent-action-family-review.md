# P3-R31 Independent Action Special-Family Review - 2026-09-16

Role: Codex R
Verdict: SPECIAL_FAMILY_ACCEPTED
Review base: A reconciliation `ad780661935635045228cba750b93a9d9c3f8d8a`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Findings

No blocking finding.

## Exact family judgment

R independently proves the exact Archer Independent Action family contains eleven and only eleven members under the locked Reference family list. All eleven F1 and Reference source texts have SHA-256 `792fe5ed9a320b58e58103d05aaf9ae27755c5940c159bf47733f04d36da7bc5`, and all eleven preserve one static signature: `typeLabel=特殊`, `cost=0`, `basePower=6`, historical `requirement=0`.

Gilgamesh is explicitly present in the same Reference `independentActionSkillIds` array and uses the same `core.independent-action` handler. No identity-specific Gil execution branch or additional printed mechanic exists. The F1 blocker spelling `gil_independent_action_rule` therefore does not denote a different semantic family.

Current canonical authoring contains exactly one family member, Tomoe; the other ten are absent. Independent Action EX is excluded.

## Printed-clause completeness

The canonical Tomoe card has exactly two abilities. Their printed clauses concatenate exactly to the frozen full card text:

1. first-half turn-order conditioned action-phase controller VP +3;
2. post-loss controller VP -5 with the explicit unpreventable exception.

No frozen printed clause is omitted or supplied by an unreviewed handler.

## Existing runtime acceptance

No new runtime implementation is required.

- TO08 current-lineage Resource Numeric independently accepts the real Tomoe `sc-tomoe-1.independent-action` path. The route is semantic/identity-free; the common condition evaluator enforces `controller_seat_in_first_half` before typed +3 VP settlement.
- B21 / R15 independently accepts the exact forced `after_controller_loses_battle` controller VP -5 sibling with `ignore / effect_prevention / this_effect / explicit_exception`, post-scoring loser provenance, floor behavior, typed evidence, exactly-once handling, and fail-closed near-matches.

Fresh R31 verification:

- reconciliation candidate changed only Task Index + A evidence report; runtime/F1/authoring diff = `0`;
- `git diff --check`: PASS;
- `npm.cmd run typecheck`: PASS;
- TO08 direct Resource + B21 unpreventable-loss regressions: `10/10 PASS`;
- independent F1/Reference/static/canonical programmatic reconciliation: PASS.

## Special blocker judgment

For this exact eleven-member family only, the historical F1 `SPECIAL_EFFECT:independent_action_rule` blocker, and Gil's differently named but semantically identical `SPECIAL_EFFECT:gil_independent_action_rule`, are fully discharged by the accepted TO08 + B21 runtime composition represented by canonical Tomoe.

This does not accept broad Reviewed Special Handler behavior, Independent Action EX, generic unpreventable results, arbitrary post-loss rewards, or unrelated Resource Numeric effects.

## Downstream permission

A may freshly reconcile this exact accepted lineage and dispatch P3-FM04 at exact batch size 11: Tomoe remains the unchanged pre-existing canonical representative and S may add only the ten missing exact siblings.
