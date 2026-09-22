# P3-A FM05 Territory Variant Extension Dispatch

Role: Codex A
Status: `S_DISPATCH_READY`
Base: `3b2d6bc6ac2eb6bfc7058a238d140995d0711e77`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Accepted contracts: P3-R33/FB2-11 round-number formula + P3-R19/FB2-02 Magic Workshop deployment reward + P3-R34/FM05 Territory Creation migration precedent.

## Current accounting

- recovery-line accepted: `113/944`;
- remaining: `831/944`;
- integrated main accepted: `111/944`;
- this dispatch itself takes zero migration credit.

## Delta-refresh result

A recomputed the exact F1 accepted-vs-missing semantic signature partition over all 944 identities using:

- Reference handler;
- normalized semantic axes;
- required capabilities;
- mechanic families;
- current exact canonical authoring presence from `cards[].id` only.

Exactly one mixed semantic-signature group exists across the full 944 inventory: accepted Territory Creation members plus two missing typography variants.

Exact missing batch:

1. `servant.gilles.skill.sc-gilles-2`
2. `servant.medea.skill.sc-medea-2`

Both are F1 `SPECIAL_HANDLER_CANDIDATE` only because their first printed formula clause uses spaced ASCII punctuation (`X为16 - (当前回合数 × 2)`) rather than the typography used by part of the already accepted FM05 family. Their complete semantic signature matches five R34-accepted Territory Creation members exactly: same `core.territory-creation` Reference handler, `REVIEWED_SPECIAL_HANDLER`, `SPECIAL_SUBSYSTEM`, and the same normalized `TERRITORY_CONSTRUCTION_SCALING_RULE` semantic axis. The second clause SHA is exactly the accepted deployment-reward SHA `2137380f...`.

Locked Reference independently gives both owners class `Caster` and identical skill static metadata: `typeLabel=魔术`, `cost=0`, historical `requirement=0`, historical `basePower=2`.

The authoring representation is therefore already fully covered by the accepted FM05 decomposition:

- printed text/source evidence preserved byte-for-byte for each identity;
- dynamic card Power uses controlled AST `add(16, multiply(-2, game.round_number))` with `printedExpression=X`;
- final skill-zone threshold is 8 mana under Final Rules 9.4;
- forced `after_player_deployed_to_battlefield` at `magic_workshop` grants controller +1 mana then +2 VP;
- no runtime/compiler/source change is authorized.

## S exact scope

S may materialize exactly the two IDs above as minimal servant skill archives and add only focused migration tests/report required to prove:

- exact 2-ID membership;
- exact F1 printed text and clause hashes;
- exact locked Reference owner/static metadata;
- exact structural equivalence to accepted FM05 authoring except identity/source text typography;
- round 1/4/7/8 Power = 14/8/2/0 on a real new representative;
- Magic Workshop controller deployment = +1 mana/+2 VP exactly once;
- wrong location and other-player deployment negatives;
- no runtime hot-file changes;
- frozen material accounting `113/944 -> 115/944`, zero removals/duplicates/unauthorized additions.

If any runtime change is required, S must stop with a blocker instead of widening scope.

After S commits/pushes and opens the stacked PR, stop for fresh independent R. Only R acceptance followed by A synchronization may record `115/944` accepted.
