# P3-R FB2-26 Current-Main Independent Review

Date: 2026-10-28  
Role: independent Reviewer (GPT-6 Sol)  
Verdict: **IMPLEMENTATION_NEEDS_REVISION**  
Credit: zero frozen skill migration credit

## Exact review object and authority

- Repository: `binchen648/fd`.
- Base: `824afedfce8565848591b76ee42d60e666e70213`.
- Candidate: `526a808105b607e094b1ed7408569a1f3bacb123`.
- Candidate branch: `codex/b2-p3-fb2-26-current-main-20261026`.
- Independent detached review checkout: `E:\Codex\FD\fb2-26-review-20261028`.
- Read `docs/agents/PHASE3-AGENT-CONTRACT.md`, `docs/agents/PHASE3-FULL-ROSTER-COLLABORATION-CONTRACT.md`, the authoritative `TASK P3-FB2-26-NONPLAYABLE-MASTER-RULE-ARCHIVE` block in `origin/main:docs/agents/PHASE3-TASK-INDEX.md`, and `origin/main:docs/reports/2026-09-18-p3-a-fb2-26-nonplayable-master-rule-archive-dispatch.md`.

The dispatch requires a double fail-closed boundary. A malformed mixed archive must not pass through the normal master path into a playable Master or overview. This is required at the loader before `convertAuthoringMaster`, as well as at the executable compiler. The exact historical FM09 discriminator with playable presentation remains compatible. The explicit rules-only channel must preserve executable source and target definitions without a playable character, fallback command spell, deck, overview, or fixture seat.

## Blocking finding: malformed mixed archive enters the playable loader path

`packages/content/src/playtest-pack-loader.ts` makes `assertNormalMasterArchive` return whenever `hasMasterRuleArchiveShape` is false. That shape predicate requires **every** card to be `master_skill` with either absent or exact `outside_game` placement. A malformed rule-like archive with one ordinary `master_skill` and one `outside_game` **command_spell** therefore escapes the guard. With a near-match discriminator `master_rule_definition_archiv` and no deck or public information, `loadPlaytestContentPack` calls `convertAuthoringMaster` and emits a playable Master plus its overview card. The same candidate later fails in `compileExecutableCardPack`, but this does not satisfy the required loader boundary.

Independent temporary probe, created only in the Reviewer checkout and removed after execution:

```text
Manifest: authoringMasterFiles = ["master.json"]
Archive: id = "master.probe", archiveType = "master_rule_definition_archiv"
         no deck, no publicInformation
Cards:   master.probe.skill.1 = ordinary master_skill
         master.probe.skill.2 = command_spell with initialPlacement = "outside_game"
Actual:  loadPlaytestContentPack returns loaded.masters = ["master.probe"]
         and converts the archive to its playable overview/card surface
Expected: loader rejects before convertAuthoringMaster
Probe:   1 failed assertion; output `LOADER_PLAYABLE=master.probe`
```

The executable compiler did reject this case with `Outside-game initial placement requires an owned master_skill`; the failure is specifically the earlier content-loader boundary. The existing new loader regression covers a well-shaped two-`master_skill` mixed archive with an approximate discriminator; it does not cover malformed mixed card types that make the exact-shape predicate false.

Required correction: reject malformed rule-like archive intent on the normal manifest channel before any playable conversion, without rejecting ordinary valid playable masters or the exact legacy FM09 presentation case. Add a focused loader regression for this shape and equivalent missing/wrong discriminator cases. Keep the explicit rules-only channel strict.

## Independent verification

| Check | Result |
| --- | --- |
| Exact Candidate diff and allowed scope | Five paths: two source files, their two tests, one candidate report; no production authoring/pack/generated/interpreter/MatchSession changes |
| Fresh `npm ci --prefer-offline --no-audit --no-fund` | Passed |
| `npm run typecheck` | Passed |
| Focused loader and executable tests | 2 files, 56/56 passed |
| `npm run test:ci` | 125 files, 789/789 passed |
| `npm run content:validate` | Passed; 7 masters, 7 servants, 20 events, zero blocking issues |
| `npm run verify:generated-content` | Passed; output hashes stable |
| `git diff --check` Base to Candidate | Passed |
| Independent explicit-manifest rules-only probe | Passed: definitions compile, ordinary initial skill stays in skill zone, outside-game card has no initial zone, no playable character or fallback |
| Independent malformed-normal-manifest probe | **Failed**: loader produced a playable Master before compiler rejection |

The explicit rules-only channel itself works in the tested end-to-end manifest probe. The defect is restricted to malformed mixed archives on the normal-master registration path. This report does not change Candidate code or claim acceptance. The FB2-26 capability remains zero credit pending a corrected Candidate, fresh independent review, and later A synchronization.
