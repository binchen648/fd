# P3-FM08 current-main game-start rule-flags authoring candidate

Status: `MIGRATION_CANDIDATE` only. This report is not Reviewer acceptance, credit, merge, or A-sync.

## Lineage and scope

- Exact Base: `13a0ada07c50b77bc1efc178e08b4605512e8fb5`.
- Changes are authoring-only: eight master archives, one focused migration test, and this report. Shared runtime, coverage, generated artifacts, task index, governance, and unrelated servants are untouched.
- The pre-existing playtest archive `master.irisviel.json` is untouched; canonical FM08 Irisviel s1 is isolated in `master.irisviel.fm08.json`.

## Exact ten-ID contract

`master.bazett.skill.s1b`, `master.caules.skill.s1a`, `master.fiore.skill.s2`, `master.fiore.skill.s3`, `master.fiore.skill.s4`, `master.irisviel.skill.s1`, `master.peperoncino.skill.s1a`, `master.sieg.skill.s1`, `master.waver.skill.s1`, and `master.zouken.skill.s5`.

Excluded same-handler rows: `master.leonardo.skill.s1a` and `master.ophelia.skill.s1a`. No dynamic identity or blocked row is included.

Each selected card is a canonical identity-free `game_start` forced trigger with no conditions, targets, costs, creates, or generic rule modifiers, and installs only a typed controller-scoped FB2-14 RuleOverride. Fiore s4 installs its two accepted overrides. The archives preserve frozen F1 source text hashes and locked Reference static metadata; all evidence records accepted contract `P3-R39/FB2-14`.

## Verification receipt

- FM08 focused authoring: 5/5 passed.
- FB2-14 runtime regression: 10/10 passed.
- FM07/FM06 focused authoring and FB2-14 combined focused: 23/23 passed (FM07 4/4, FM06 4/4, FM08 5/5, FB2-14 10/10).
- FM05 territory-creation regression: 4/4 passed.
- Full CI: 120 files / 740 tests passed.
- `npm run typecheck`: passed.
- `npm run content:validate`: passed, 0 blocking issues.
- `npm run verify:generated-content`: passed with unchanged hashes.
- `git diff --check`: passed.
