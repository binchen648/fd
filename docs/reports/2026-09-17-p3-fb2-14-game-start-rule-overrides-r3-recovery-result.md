# P3-FB2-14 Game-Start Rule Overrides — B2 r3 Recovery Result

Date: 2026-09-17
Owner: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Base / R39 blocker report: `68b173d480df7a7b0e83cdc403e73616c3216b2f`
Blocked r2 target: `3879203870bb05ad9619c03c60c69ed9e1941080`
R39 recovery review: `docs/reports/2026-09-17-p3-r39-fb2-14-r2-recovery-review.md`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Strict accepted canonical overlap: `101/944`

## Repair scope

This recovery candidate fixes only the P1 raw `execution` fail-closed blocker recorded by the fresh R39 recovery review. It does not alter the eleven accepted RuleOverride schemas, game-start ordering, mana ledger semantics, consumer behavior, authoring data, Reference material, or any future FM08 identity routing.

For automatic abilities containing `install_rule_override`, the loader now validates the complete raw execution envelope before normalization:

- unknown execution keys are rejected;
- simultaneous `hostOps` and `allowedOperations` declarations are rejected, even when both arrays are empty;
- if either authority field is declared, it must be an empty array;
- nonempty, malformed, or hidden authority therefore emits an unsupported loader report before normalization can erase provenance.

The existing semantic classifier still requires normalized `execution.mode = automatic` and `allowedOperations = []`. Loader failures convert the normalized execution mode to `unsupported`, so rejected raw metadata cannot later pass `isGameStartRuleOverrideSemantic`.

## Regression evidence

The focused FB2-14 regression now proves all of the following raw cases fail closed:

1. unknown execution authority metadata;
2. simultaneous `hostOps=[]` plus `allowedOperations=['adjust-mana']`;
3. simultaneous `hostOps=[]` plus `allowedOperations=[]`;
4. isolated nonempty `hostOps`;
5. isolated nonempty `allowedOperations`.

It also preserves legal absence and either isolated empty authority field as accepted shapes.

## Validation

- `npm.cmd run typecheck`: PASS.
- `npm.cmd run content:validate`: PASS, `7 masters, 7 servants, 20 events, 0 blocking issues`.
- `npm.cmd run verify:generated-content`: PASS.
  - content: `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`
  - fixture: `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence: `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- Focused FB2-14 + MatchSession: `37/37` PASS across 2 files.
- Rules regression/core: `396/396` PASS across 66 files.
- Standard full CI: `738/738` PASS across 120 files.
- `git diff --check`: PASS.
- Future FM08 production identity scan in `packages/rules/src`: `0` matches.

## Scope / credit

This candidate changes exactly the loader fail-closed boundary, its focused regression coverage, and this result report. It performs no FM08 authoring migration and claims no migration acceptance.

Strict accepted canonical overlap therefore remains `101/944`.

A new fresh R39 must independently review the exact recovery candidate before Codex A may synchronize FB2-14 acceptance or unblock FM08. The prior r1 acceptance chain and the blocked r2 review cannot substitute for that gate.
