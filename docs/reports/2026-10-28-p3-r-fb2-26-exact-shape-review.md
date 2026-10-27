# P3 FB2-26 exact-shape independent review

Verdict: **IMPLEMENTATION_NEEDS_REVISION**.

## Identity and scope

- Base: `824afedfce8565848591b76ee42d60e666e70213`.
- Candidate actually checked out: `470846b48d821c9c7648b7c406725c0c1dff5c2a` on `codex/b2-p3-fb2-26-current-main-20261026`.
- The handoff named `470846b4e5c9c44dcc4da5d77f2cc90f3ca88a4d`; that object is absent locally and is not the branch HEAD. All findings here are against the actual branch HEAD above.
- Independent reviewer checkout: `codex/r-p3-fb2-26-exact-review-20261028`; Candidate branch and frozen source unchanged.
- Read the Phase 3 agent/full-roster contracts and the `P3-FB2-26-NONPLAYABLE-MASTER-RULE-ARCHIVE` task block. Base-to-Candidate diff contains only the content loader, executable compiler, their two test files, and the candidate report. `git diff --check` passes.

## Blocking finding: compiler accepts a near discriminator and creates a playable master

`packages/rules/src/ability/executable-card-pack.ts:115-119` rejects a non-exact discriminator only when `hasMasterRuleArchiveShape` is true. That detector requires every card to be `master_skill`. A malformed mixed archive with an `outside_game` master skill plus an ordinary deck card misses the detector, then enters normal playable compilation.

Independent executable probe against the actual pack source:

```js
const input = compileLoadedPlaytestPack(
  loadPlaytestContentPack(resolve('data/packs/fd-playtest-v1/pack.json'), { workspaceRoot: resolve('.') }),
).library;
const archive = input.rules.archives.find((value) => value.id === 'master.kayneth');
archive.archiveType = 'master_rule_definition_archiv';
archive.cards[0].initialPlacement = 'outside_game';
const output = compileExecutableCardPack(input);
// observed: playable character exists; outside_game skill exists with no initialZone
```

Observed output: `ACCEPTED true outside_game undefined`. The compiler makes `master.kayneth` a playable character. The loader has an `hasOutsideGameCard` rejection for this shape, but the compiler can be called on a compiled rules source directly, so the required two-sided fail-closed boundary is incomplete. Add a compiler-side negative case for any non-exact master archive containing an `outside_game` card, including a non-`master_skill` card, before `loadAuthoringJson` or character generation. Cover this exact probe in the focused compiler tests.

The exact-discriminator legacy exception at `packages/content/src/playtest-pack-loader.ts:247-249` and compiler lines `109-113` is also broader than the task's “legal old FM09 playable shape” language: it accepts any mixed same-owner archive with *either* `deck` or `publicInformation`, regardless of whether it is one of the historical FM09 shapes. Tighten that exception or document and test the intended compatibility rule while fixing the blocking case.

## Independent verification

| Check | Result |
| --- | --- |
| `npm ci --no-audit --no-fund` | Pass |
| `npm run typecheck` | Pass |
| Focused loader/compiler tests | 60/60 pass |
| `npm run test:ci` | 793/793 pass, 125 files |
| `npm run content:validate` | Pass; 7 masters, 7 servants, 20 events, zero blocking issues |
| `npm run verify:generated-content` | Pass |
| `npm run phase3:coverage` | Pass; 86 archives, 129 cards, 191 abilities, zero blocking issues |
| `npm run phase3:automation-audit` | Completed; 20 promotion findings in the existing audit output |
| `npm run build --workspace @fd/client` | Fails on three unused declarations already present at Base; not attributed to this Candidate |
| `npx vitest run packages/rules/tests` | 651 pass, 18 fail. Failures require unavailable fixed `D:/fd/chm-extract` source files; CI suite excludes those authoring tests. |
| Locked Reference `npm test` | Pass: 1874/1874 JavaScript tests and 3/3 TypeScript tests, exit 0 |
| Base-to-Candidate `git diff --check` | Pass |

Locked Reference checkout verified clean at `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`.

No migration credit, acceptance sync, merge, or Candidate modification is justified by this review.
