# P3-FM08 current-main independent review

Decision: **MIGRATION_ACCEPTED** for the revised Candidate `acf837e5a30cd87e64eb1ad373d60edaa1da67ce` against exact Base `13a0ada07c50b77bc1efc178e08b4605512e8fb5` (`codex/s-p3-fm08-current-main-20261026`). This is Reviewer acceptance of the exact FM08 ten-ID authoring migration; A-sync, accounting credit, and merge remain separate actions.

## Revision check

The only change from the first Candidate `57835fbe007fc091893a52b935a81f1c48ee705c` is deletion of one extra blank line at the end of the Candidate report. The `data/authoring/masters` tree and FM08 focused test blob are byte-identical between the two Candidate commits. For the revised Candidate, `git diff --check 13a0ada07c50b77bc1efc178e08b4605512e8fb5 acf837e5a30cd87e64eb1ad373d60edaa1da67ce` exits 0 with no diagnostics.

Full CI, typecheck, content, and determinism checks below were run on the first Candidate; the revision changes only report whitespace, so those results apply to the identical code in the accepted Candidate. The five focused suites were also rerun after rebasing this review worktree onto the revised Candidate: 27/27 passed.

## Scope and contract review

- The Base-to-Candidate delta is exactly eight master authoring archives, `packages/rules/tests/fm08-game-start-rule-overrides-authoring.test.ts`, and the Candidate report. No runtime, coverage, generated, governance, pack manifest, or unrelated servant file changed.
- The ten authored IDs are exactly `master.bazett.skill.s1b`, `master.caules.skill.s1a`, `master.fiore.skill.s2`, `master.fiore.skill.s3`, `master.fiore.skill.s4`, `master.irisviel.skill.s1`, `master.peperoncino.skill.s1a`, `master.sieg.skill.s1`, `master.waver.skill.s1`, and `master.zouken.skill.s5`. Neither Leonardo nor Ophelia was included.
- All ten are canonical `master.<owner>.skill.<legacyId>` cards with one identity-free `forced_trigger` ability on `game_start`. The abilities have empty conditions, targets, costs, creates, and generic rule modifiers; each effect is a controller-scoped, exact FB2-14 `install_rule_override` shape. Fiore s4 installs the two accepted overrides.
- I compared the printed text, names, legacy IDs, and passive type labels to locked Reference commit `b2f9fa15fba07c63530bbf4612b03b8b704755f9`, and checked all ten full-text SHA-256 values and eleven clause SHA-256 values. The nine development-text rows match frozen F1 overlay source text at `59f145434695d29bdd17e4cb3adc887e84182377`; Bazett's frozen F1 overlay instead uses a source-evidence placeholder, while its Candidate text matches the Reference text and the overlay's `referencePrintedTextSha256`. Evidence records cite `P3-R39/FB2-14`.
- `master.irisviel.json` and `data/packs/fd-playtest-v1/pack.json` are unchanged. Canonical Irisviel s1 is isolated in `master.irisviel.fm08.json`, so the seven-master playtest pack continues to use its pre-existing Irisviel archive. The focused test loads the isolated archive directly; playtest content validation and generated hashes remain stable.

## Independent verification

| Check | Result |
| --- | --- |
| FM08 focused authoring | 5/5 pass |
| FB2-14 runtime | 10/10 pass |
| FM06 + FM07 + FM08 + FB2-14 combined | 23/23 pass |
| FM05 territory creation | 4/4 pass |
| `npm run test:ci -- --reporter=dot` | 120 files / 740 tests pass |
| `npm run typecheck` | pass |
| `npm run content:validate` | pass; 7 masters, 7 servants, 20 events, 0 blocking issues |
| `npm run verify:generated-content` | pass; unchanged three generated hashes |
| Revised Candidate Base-to-Candidate `git diff --check` | pass |

The first full-CI attempt ran concurrently with content and determinism checks and hit the existing five-second timeout in one `match-session.test.ts` case (119 files / 739 tests passed). A standalone full-CI rerun passed 120/740. Dependencies and workspace build output were prepared in the independent review worktree before these checks; they are not part of the Candidate delta.
