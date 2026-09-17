# P3-R34 FM05 Territory Creation Migration Review - 2026-09-16

Role: Codex R
Verdict: `MIGRATION_ACCEPTED`
Reviewed A-synchronized lineage: `5f3e3810e6cc16fbdb03d83c38b8b9087a6587d7`
S candidate: `3e66365a03c12b4a1d683bdae5e9350acad80455`
S base / accepted FB2-11 synchronization: `fd17ba227182e5e9a14d093390bbfb3a47af1c39`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference metadata: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Findings

No blocking finding.

## Independent static reconciliation

R34 independently recomputed the exact batch rather than relying on S/A reports:

- exact Territory Creation family reviewed: `10/10`;
- frozen F1 denominator: `944`;
- canonical authoring overlap: `69/944 -> 79/944`;
- exact newly added frozen IDs: `10`;
- unauthorized additions: `0`;
- removals: `0`;
- runtime hot-file diff from the FM05 handoff lineage: `0`;
- `git diff --check`: PASS.

All ten selected cards preserve the frozen full-text SHA:

`295a5b531db5d1031cbbb89dc677e76737b7d3b3c7ca70af59405cc84bd98c58`

and the exact two clause hashes:

- `a65ce56a69bba9214eba95ab30154209228bcd28f7fec21f6317c8a70f421847`
- `2137380f5f57233a98494f45a9d12a848f3d1cf710101c60462c523ea3f1624f`

Locked owner/static metadata also matches Reference for all ten. Lady Avalon remains `Pretender`; Semiramis remains `Assassin`; the other eight selected owners are `Caster`. Skill-name wording does not rewrite owner class.

## Structural contract review

Every selected card uses exactly the accepted decomposition:

1. controlled card Power AST `add(16, multiply(-2, game.round_number))`, using the R33-accepted read-only round metric with no formula-op expansion or string parsing;
2. exact FB2-02 deployment reward: forced `after_player_deployed_to_battlefield` at `magic_workshop`, controller `+1 mana` and `+2 VP`.

Historical Reference `basePower=2` and `requirement=0` remain evidence metadata only; final skill-zone play uses the canonical 8-mana rule.

## Independent dynamic evidence

R34 ran all required validation from a fresh reviewer worktree:

- typecheck: PASS;
- FM05 + FB2-11 + FB2-02 focused: `17/17 PASS`;
- rules regression/core: `63 files / 368 tests PASS`;
- content validation: `7 masters / 7 servants / 20 events / 0 blocking issues`;
- deterministic generated-content hashes unchanged:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`;
- standard full CI: `117 files / 710 tests PASS`.

The real migrated archive regression proves authoritative Power values `14 / 8 / 2 / 0` at rounds `1 / 4 / 7 / 8`, plus exact Magic Workshop deployment reward and wrong-location/other-player negatives.

## Coverage integrity

Fresh reviewer coverage reproduces A material coverage:

- archives `69`;
- cards `101`;
- abilities `200`;
- raw `new=22 / legacyExecute=3 / legacyResolve=127 / dual=0 / notClassifiable=48 / taxonomyWarnings=124`;
- compiled definition hash unchanged at `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`;
- compiled cards `70`, characters `14`, blocking issues `0`.

Fresh reviewer artifact equals the A-committed material artifact exactly except `generatedAt`. Reviewer-generated timestamp drift remains unstaged.

## Gate judgment

`MIGRATION_ACCEPTED`.

This acceptance is limited to the exact FM05 ten-card Territory Creation family and the already independently accepted FB2-11 + FB2-02 contracts. It does not promote broad formula language, broad Trigger/Power semantics, reporter taxonomy changes, or unrelated Special handlers.
