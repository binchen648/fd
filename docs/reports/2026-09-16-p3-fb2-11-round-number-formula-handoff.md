# P3-FB2-11 Trusted Round-Number Formula Metric Handoff

Date: 2026-09-16
Owner: Codex A
Status: `READY`
Base: R32 / FM04 accepted lineage `57e147a9ed369cb52494ee68886103045739cdb3`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Why this capability is next

Fresh post-FM04 frozen-F1 scan reports canonical overlap `69 / 944`, leaving `875` identities absent. The next exact-text family at the normal F4 minimum is ten Caster-class Territory Creation cards with SHA:

`295a5b531db5d1031cbbb89dc677e76737b7d3b3c7ca70af59405cc84bd98c58`

All ten print exactly:

`X为16-（当前回合数×2）\n残留：当你部署于魔术工房时，获得1点魔力和2点战果。`

The deployment reward is already representable by the independently accepted FB2-02 structural contract. Current Power formula infrastructure already supports controlled numeric ASTs and `add` / `multiply`, but it has no trusted current-round server metric. Therefore the only runtime gap for the exact ten-card family is a read-only formula variable for the authoritative game round number.

## Exact FB2-11 capability

Add one trusted formula metric:

`game.round_number`

Required semantics:

- `evaluateFormula({ var: "game.round_number" }, state, ...)` returns exactly `state.round.roundNumber`;
- the authoring loader recognizes exactly this variable as a trusted server metric;
- it is read-only and has no mutation/effect side effects;
- it may participate only through the existing controlled formula AST mechanism;
- no new formula operator is added;
- no string formula parsing is added;
- no subtraction operator is added: Territory Creation is represented by existing operators as `add(16, multiply(-2, game.round_number))`;
- existing AST budget, finite-value checks, deterministic calculation lines, and fail-closed behavior remain unchanged;
- no character/card/ability identity or printed-text routing.

Expected Territory Creation card-face expression after later S migration:

```json
{
  "printedExpression": "X",
  "formula": {
    "op": "add",
    "args": [
      16,
      { "op": "multiply", "args": [-2, { "var": "game.round_number" }] }
    ]
  }
}
```

FB2-11 must not author or migrate these cards.

## Exact prospective FM05 evidence family

- `servant.anastasia.skill.sc-anastasia-1`
- `servant.andersen.skill.sc-andersen-1`
- `servant.avicebron.skill.sc-avicebron-3`
- `servant.kinggil.skill.sc-kinggil-1`
- `servant.ladyavalon.skill.sc-ladyavalon-3`
- `servant.maxwell.skill.sc-maxwell-1`
- `servant.mephisto.skill.sc-mephisto-1`
- `servant.mozart.skill.sc-mozart-3`
- `servant.semiramis.skill.sc-semiramis-2`
- `servant.shakespeare.skill.sc-shakespeare-1`

All ten are currently absent from canonical authoring, have the exact same frozen printed text and two clause hashes, and use Reference handler `core.territory-creation`.

F1 currently splits this identical family incorrectly by recognized clause: five rows are block-free `GENERIC_RESOURCE_NUMERIC`, while five rows retain only `SPECIAL_EFFECT:territory_construction_scaling_rule`. This handoff does not rewrite frozen F1. R33 must independently reconcile the complete printed family and may authorize downstream FM05 only if both clauses are fully covered by FB2-02 + FB2-11.

## Locked static metadata for all ten

Reference metadata is uniform:

- `typeLabel=魔术`;
- `cost=0`;
- historical `requirement=0`;
- historical static `basePower=2`;
- activation historically marked residual;
- same printed text as frozen F1.

For future S authoring, historical `basePower=2` is evidence metadata only and must not override the explicit F1 dynamic X formula. Final skill-zone use threshold remains rule 9.4 / 8 mana.

## Already accepted sibling dependency

FB2-02/R19 accepts the exact deployment reward structure needed by Territory Creation:

- forced trigger `after_player_deployed_to_battlefield`;
- non-empty data-driven `activation.eventLocationId`;
- trusted event player equals source controller and location matches;
- exactly one or two fixed positive controller `adjust_mana` / `adjust_victory_points` effects;
- no ordinary movement trigger inheritance;
- identity-free structural routing.

Future Territory authoring is expected to use `eventLocationId=magic_workshop`, controller mana `+1`, controller VP `+2`. FB2-11 must not alter FB2-02.

## Required B2 evidence

At minimum:

- loader accepts a renamed synthetic card using `game.round_number` in a controlled `cardFace.basePower` AST;
- evaluator returns authoritative round number, not priority seat, replay revision, or a cached counter;
- exact Territory expression computes round 1 -> 14, round 4 -> 8, round 7 -> 2, round 8 -> 0;
- deterministic calculation-line output is preserved;
- unknown near variables such as `game.current_round`, `current_round`, and `game.round` remain unsupported/fail closed;
- existing Drake movement-distance formula still computes unchanged;
- FB2-02 deployment-resource classifier/regression remains green;
- no formula op set expansion and no text/identity routing;
- typecheck, all rules regressions, full root CI, generated-content determinism, diff check.

## May touch

- `packages/rules/src/ability/loader.ts` only for the trusted metric allowlist;
- `packages/rules/src/ability/interpreter.ts` only for the read-only metric evaluator;
- focused regression test(s);
- B2 result report.

## Must not promote/touch

- broad arbitrary state-path variables;
- new formula operators or string expressions;
- resource/deployment runtime;
- broad Power/Modifier runtime;
- F1 inventory/taxonomy/KPI;
- any Territory Creation authoring archive;
- unrelated current authoring or product content.

Completion status allowed:
- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`
