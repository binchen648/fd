# P3-A FB2-26 Saber / Magic Resistance / Noble Bloom migration candidate

Date: 2026-10-28 (Asia/Hong_Kong)
Status: `MIGRATION_CANDIDATE` (builder output; no merge or accounting credit)

## Exact base and scope

- Canonical repository: `https://github.com/binchen648/fd.git`
- Runtime-prerequisite Candidate: `5ba58e48899a10797ddac54c01340121ab2c17a1`
- Parent: `c14b7977539c5750064ce9151bd7413a505641bd`
- F1 inventory: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

Exactly these ten F1 IDs were added, one minimal servant authoring archive per
owner, with no unrelated servant, handler, inventory, accounting, or runtime
source changes:

`servant.altera.skill.sc-altera-3`, `servant.arthur.skill.sc-arthur-3`,
`servant.bedivere.skill.sc-bedivere-1`, `servant.charlemagne.skill.sc-charlemagne-3`,
`servant.gawain.skill.sc-gawain-3`, `servant.mordred.skill.sc-mordred-3`,
`servant.musashi.skill.sc-musashi-3`, `servant.lakshmibai.skill.sc-lakshmibai-3`,
`servant.saitou.skill.sc-saitou-1`, and `servant.saber.skill.sc-saber-1`.

## Frozen source partitions

The seven `batch_saber_archer.js` cards preserve first-clause
`1cef15482dd584d9d18b4e9016476b7bffb31cb0331efd38b4025a26611c84c2`,
second-clause `f0631437ce658c07be75426fc0394d6f32c6fafc10805bcb359ff17d4de97f85`,
and third-clause `bd7530459d6ccd00217d1192b06509e322d48bafd44f037c383470ecbba55229`.
Lakshmibai and Saitou preserve the same first two hashes and
`dcaf950c99dfaf589dac80e3e1d6c0d65e6d97020e1943f499fcb1e204610158` for the
third clause. Saber preserves `bab4b24653f4b6af35b87c7be8dc062c4a11d8d3d772ba1252310615102b9045`
and `8375256a1b87eeb7f39aa2dd40980fd8a6b7f3f9c24604dd318a37bc5616ddd4`.

The authoring modifier retains each printed spelling (`魔术`, `魔法`, or
`魔法/魔术`); the accepted runtime canonicalizes all three to `magic`.

## Runtime shape

Every card has the locked `特殊`, cost 3, base power 3 metadata and final
8-mana skill-zone requirement. Each card has exactly three abilities:

1. optional post-battle Noble Bloom, highest-cost Noble Phantasm this round,
   controller Victory Point `+1`;
2. an independent optional post-battle cost-≥4 sibling, controller VP `+1`;
3. active-source combat Magic Resistance using the accepted
   `combat_power_modifier` route, same-battlefield engaged opponent attack
   cards, canonical `magic`, and `this_round` lifecycle.

## Validation

- Focused ten-ID authoring/runtime suite: **6/6 passed**, including all three
  source-wording partitions and typed independent VP responses.
- `npm run typecheck`: **passed**.
- `npm run content:validate`: **passed** (13 masters, 7 servants, 20 events,
  0 blocking issues). The ten minimal archives remain authoring consumers and
  are intentionally not added to the executable playtest manifest, whose
  loader requires complete three-skill servant archives.
- `npm run verify:generated-content`: **passed**; checked-in generated hashes
  remain deterministic (`content f7644a34d410d79d0e62b30a996ec0e829d3e4442d069529d8f3acdf1811394a`,
  `fixture fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`,
  `evidence 2d17e10d560d0a0fda231a5d169ee9c1fd706f47599efc296348773318d79bd4`).
- `npm run verify:playtest-v1`: **passed**.
- `git diff --check`: **passed**.
- Full `npm run test:ci`: **807/811 passed; 4 failed**. The failures are the
  existing Artoria Caster residual-power/lifecycle assertions at
  `packages/rules/tests/authoring-interpreter.test.ts:95,215`,
  `packages/rules/tests/regression/complex-skills-regression.test.ts:517`,
  and `packages/rules/tests/regression/golden-card-content-pipeline.test.ts:101`.
  The exact parent `c14b7977539c5750064ce9151bd7413a505641bd` reproduced the
  same four failures at **806/810**, so no new failure is attributable to this
  migration.

No `MIGRATION_ACCEPTED` verdict or formal accounting change is claimed by this
builder output.
