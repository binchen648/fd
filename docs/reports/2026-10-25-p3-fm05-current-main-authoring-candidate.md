# P3-FM05 current-main authoring candidate

Status: `MIGRATION_CANDIDATE` only. This receipt is not Reviewer acceptance, credit, merge, or A-sync.

## Lineage and scope

- Exact materialized current-main Base: `c2df64f2cee72652a610ac5aec4f478fafbbc1f3` (started from A-sync `d5c7f7140b84aa7efe045a3730c9eddd0d0ce296`).
- Branch: `codex/s-p3-fm05-current-main-materialized-20261025`.
- The Base explicitly contains only the accepted FB2-02 and FB2-11 runtime/test deltas documented in `2026-10-25-p3-fm05-current-main-dependency-materialization.md`; historical FM03/FM04 drift is excluded.
- Scope is authoring-only: the ten canonical servant archives, one focused migration test, and this report.
- No runtime, coverage, generated artifact, unrelated servant, or governance file was changed.

## Contract receipt

The ten IDs are Anastasia, Andersen, Avicebron, King Gilgamesh, Lady Avalon, Maxwell, Mephistopheles, Mozart, Semiramis, and Shakespeare. Each preserves the F1 full printed text/source hashes and static metadata, final skill-zone requirement 8 mana, the `game.round_number` continuous formula, and the deployment reward (`+1` controller mana and `+2` controller VP at `magic_workshop`). The accepted semantic references are FB2-11 for the round metric and FB2-02 for the deployment reward; no identity routing or runtime change is introduced.

## Verification receipt

The focused test checks exact ten-ID membership, class/card IDs, full-text and clause hashes, static metadata, formula/reward shape, canonical loader compatibility with `report=[]`, shared contract references, and authoritative `calculateCardPower` values round 1/4/7/8 = 14/8/2/0. The focused suite passed 5/5 tests. `npm run typecheck` passed; `npm run content:validate` passed with 7 masters, 7 servants, 20 events, and 0 blocking issues; `npm run verify:generated-content` passed with unchanged hashes; the focused FM05/FB2-02/FB2-11 compatibility run passed 20/20 tests. `npm run test:ci` passed 117 files / 713 tests. The full `npm test -- --run` run was 120/130 files and 798/818 tests, with 20 failures caused by the repository's unavailable external CHM/source-image assets, identical to the materialized Base and not caused by FM05.

This candidate does not claim skill acceptance, migration credit, merge, or Reviewer approval. Formal accounting remains the A-owned next step after independent review.
