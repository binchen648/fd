# P3 FB2-26 independent review — cross-owner and rules-only archive boundary

## Identity and scope

- Role: independent R reviewer, separate clean worktree; no Candidate edits or merge.
- Base: `824afedfce8565848591b76ee42d60e666e70213`.
- Candidate: `dfc434aa1f119184bb69b20d4521e710bc7c9fb4`.
- Builder branch: `codex/b2-p3-fb2-26-current-main-20261026`.
- Reviewed the Phase 3 agent contract, full roster collaboration contract, authoritative `P3-FB2-26-NONPLAYABLE-MASTER-RULE-ARCHIVE` task block on `origin/main`, and the FB2-26 dispatch report.
- Base-to-Candidate diff contains exactly five files: the FB2-26 Candidate report, content loader and its tests, executable rules compiler and its tests. `git diff --check` passed.

## Verdict: IMPLEMENTATION_NEEDS_REVISION

The exact rule discriminator on the normal master manifest path accepts an invalid archive and then silently drops it from the executable source stream. This violates the required fail-closed behavior at the loader boundary and loses authored rule content without an error.

### Reproduction (independent temporary workspace)

Create a minimal pack manifest with `authoringMasterFiles: ["data/authoring/masters/master.test.json"]` and no explicit `authoringMasterRuleFiles`. The referenced archive has:

```json
{
  "schemaVersion": "fd-card-authoring-v1",
  "archiveType": "master_rule_definition_archive",
  "id": "master.test",
  "name": "Test Master",
  "sources": [],
  "cards": [{
    "id": "master.test.skill.one",
    "name": "One",
    "cardType": "master_skill",
    "owner": { "type": "master", "id": "master.test" },
    "printedText": "行动阶段：获得1点魔力。",
    "cardFace": { "cost": 0, "basePower": 0 },
    "playTiming": { "phase": "action" },
    "abilities": [],
    "evidence": []
  }]
}
```

It has the **exact** discriminator but only one ordinary card, no `outside_game` card, and no playable presentation. It is neither a valid legacy FM09 mixed archive nor a valid explicit rules-only archive. The isolated `loadPlaytestContentPack` call nevertheless returned normally. Observed values: `authoringArchives=1`, `authoringNormalArchives=0`, and `compileLoadedPlaytestPack(loaded).library.rules.archives=0`. The temporary probe and workspace were removed after execution.

At `packages/content/src/playtest-pack-loader.ts:241`, `assertNormalMasterArchive` validates the exact discriminator only when `deck` or `publicInformation` exists. Without those fields, and without `outside_game`, the function returns normally. At line 582, `authoringNormalArchives` excludes every archive with the exact discriminator. Consequently the archive does not reach either the normal stream or the explicit rules stream. The direct compiler would reject this malformed shape if it received it, but the loader drops it before that boundary.

**Required fix:** On the normal master path, treat every exact-discriminator archive as one of two cases: a strictly validated legal legacy FM09 shape with its required playable metadata, or an error directing the source to the explicit rule manifest channel. Never silently filter a malformed exact-discriminator source. Add a loader regression that proves this one-card ordinary shape throws, plus an assertion that every accepted manifest archive survives into its intended compiled rules stream.

## Checks performed

| Check | Result |
| --- | --- |
| `npm ci --no-audit --no-fund` | Passed |
| `npm run build --workspace @fd/content` | Passed; needed to expose the workspace package entry for Vitest |
| `npm run typecheck` | Passed |
| Focused loader + executable pack Vitest | 59/59 passed |
| `npm run test:ci` | 792/792 passed, 125 files |
| `npm run content:validate` | Passed: 7 masters, 7 servants, 20 events, 0 blocking issues |
| `npm run verify:generated-content` | Passed; generated artifact hashes reported |
| Base-to-Candidate `git diff --check` | Passed |
| Adversarial malformed exact-discriminator loader probe | **Failed closedness requirement**: loader accepted and archive vanished from rules |

The existing focused tests verify cross-owner rejection for a valid-looking mixed shape, approximate discriminator rejection, and a synthetic explicit rules-only archive compiled through the rules compiler. They do not cover the malformed exact-discriminator/no-presentation normal-loader path above. The green test results therefore do not resolve this finding.

No migration credit or A-sync is authorized by this report. Candidate and frozen source remain unchanged. A corrected Candidate needs a fresh independent review.
