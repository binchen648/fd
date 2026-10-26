# P3-R FB2-26 current-main independent review, revision 2

Role: independent Codex R (GPT-6 Sol)
Verdict: `IMPLEMENTATION_NEEDS_REVISION`
Base: `824afedfce8565848591b76ee42d60e666e70213`
Candidate: `f509876f9dbe7286316241ec5d006bad55ba4ce8`
Independent checkout: `E:\Codex\FD\fb2-26-final-independent-review`

## Blocking finding

The content loader still permits a malformed mixed master archive to fall through into the playable-master path when it is registered through `authoringMasterFiles`. I independently cloned an existing master archive, gave its two master skills ordinary and `outside_game` placements, retained `publicInformation`, and set the near-match discriminator `master_rule_definition_archiv`. I added its path to a temporary copy of the real pack manifest's `authoringMasterFiles`. `loadPlaytestContentPack` returned successfully, with `master.synthetic-audit` in `loaded.masters` and a generated overview card. The later `compileExecutableCardPack` correctly rejected the same archive, but the dispatch contract explicitly requires wrong and near-match mixed shapes to fail closed at both the content-loader and executable-compiler boundaries, with no playable-master fallthrough. This loader-level escape therefore remains a blocker. The temporary fixture was outside the Candidate checkout and was removed after the reproduction.

The fix should make the content loader reject this shape before `convertAuthoringMaster` produces a master, while retaining the exact legacy FM09 `master_rule_definition_archive` records in the ordinary manifest channel. No identity-specific routing or change to the accepted explicit rules-only channel is warranted.

## Previously reported findings

- The compiler now rejects the two-card mixed shape with missing, `master_skill_card_archive`, or near-match `master_rule_definition_archiv` discriminator even when ordinary playable presentation fields remain. Independent direct-compiler probes all returned the expected discriminator error.
- The exact legacy FM09 Bazett archive still compiles when passed directly to the executable compiler. The production Base and Candidate have identical compiled counts and definition hash: 20 loaded authoring archives, 14 playable rules archives, 7 masters, 14 executable characters, 70 cards, 7 decks, 5 fallback command spells, hash `55e53412f43ec87365fe46070d5bd93aa943985d4b8121b08b5e9851eb012382`.
- A temporary manifest using the explicit `authoringMasterRuleFiles` channel loaded a valid synthetic mixed archive into executable rules without adding a playable master, character, or fallback command spell. Its ordinary source had `initialZone=skill`; its `outside_game` target had no `initialZone`.
- The Candidate no longer changes `packages/rules/src/ability/loader.ts` or `types.ts`. Base-to-Candidate changes are limited to the two assigned implementation files, two assigned tests, and the Candidate report. `git diff --check` passes.

## Independent checks

I installed dependencies in this separate checkout with `npm.cmd ci --ignore-scripts --no-audit --no-fund`, built `@fd/content`, and ran:

| Check | Result |
| --- | --- |
| `npm.cmd run typecheck` | PASS |
| Content-loader and executable-compiler focused tests | 55/55 PASS |
| `npm.cmd run test:ci` | 125 files, 788/788 PASS |
| `npm.cmd run content:validate` | 7 masters, 7 servants, 20 events, 0 blocking issues |
| `npm.cmd run verify:generated-content` | PASS; production generated hashes unchanged |
| Base-to-Candidate `git diff --check` | PASS |
| Client production build | FAIL on three unused-symbol diagnostics that also reproduce on the exact Base; no Candidate-specific build diagnostic |
| Production authoring, pack, generated, interpreter, MatchSession, F1, coverage, accounting diff | None |

The passing tests do not cover the loader-level near-match fallthrough demonstrated above. No A-sync, consumer migration, frozen credit, merge, or Candidate modification is supported by this verdict. Formal accounting remains `151/944` pending a corrected Candidate and fresh independent review.
