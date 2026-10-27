# P3-R FB2-26 current-main compiler review

Verdict: **IMPLEMENTATION_NEEDS_REVISION**

Independent reviewer: GPT-6 Sol. Review checkout: `E:\Codex\FD\fb2-26-review-compiler-20261028`, created separately from the Builder checkout. Exact Base: `824afedfce8565848591b76ee42d60e666e70213`. Exact Candidate: `fcf33e017ccb57c326d3a2d009f5512e9673fe9d` on `codex/b2-p3-fb2-26-current-main-20261026`. The shorter Candidate SHA initially supplied in the handoff expanded to a different, nonexistent full SHA; the branch and local object agree on the SHA above.

## Contract and scope

I read the `P3-FB2-26-NONPLAYABLE-MASTER-RULE-ARCHIVE` task block from `origin/main:docs/agents/PHASE3-TASK-INDEX.md` and the Candidate report. The contract requires an identity-free explicit rules-only channel for mixed ordinary/outside-game master skills, zero playable master/presentation/deck/fallback output, and fail-closed malformed mixed shapes. This is a zero-credit infrastructure review.

The Base-to-Candidate diff has exactly five files: content loader, its test, executable compiler, its test, and the Candidate report. There is no production authoring, pack, generated-content, interpreter, or `MatchSession` change. `git diff --check Base Candidate` passes.

## Blocking finding: compiler accepts mixed playable master when archive type is absent or ordinary

`packages/rules/src/ability/executable-card-pack.ts`, `assertMasterRuleArchive` (near lines 119–145), protects unknown string discriminators and strict all-`master_skill` mixed shapes. It does not reject `archiveType` absent or `master_skill_card_archive` when an `outside_game` `master_skill` is mixed with an ordinary `master_deck_card` and the archive retains its deck/public presentation. The compiler is an independent entry point, so the content loader's normal-channel guard does not close this path.

Independent reproduction used `sourceInput()` from the existing executable compiler test suite, cloned the real `master.kayneth` rule archive, assigned a unique synthetic `master.*` id, unique card ids and matching owners, set its first `master_skill` to `initialPlacement: 'outside_game'`, and retained the ordinary card, deck, and public presentation. With either `archiveType` deleted or set to `master_skill_card_archive`, `compileExecutableCardPack(input)` returned successfully. Two temporary Vitest cases expecting a throw failed. A further temporary assertion test passed and confirmed the returned pack contained both `characters[syntheticId]` and `fallbackCommandSpells[syntheticId]`, while preserving the outside-game card. The temporary probes were removed; the reviewer branch contains only this report.

This violates the required fail-closed boundary and can turn malformed mixed master material into a playable master with a generated fallback command spell. The current Candidate test only covers an unknown string discriminator with this mixed playable shape; the missing and ordinary-discriminator cases remain uncovered. A revision should reject every non-exact mixed playable shape at the compiler boundary and add regression cases for both variants, while preserving complete, matching-owner historical FM09 records.

## Independent gates

| Check | Result |
| --- | --- |
| `npm ci --ignore-scripts` | Completed in the fresh checkout |
| `npm run typecheck` | PASS |
| Focused loader/compiler tests | PASS, 61/61 in the unchanged Candidate; its report says 62, but the actual checkout has 17 loader + 44 compiler tests |
| `npm run test:ci` | PASS, 125 files / 794 tests |
| `npm run content:validate` | PASS, 7 masters / 7 servants / 20 events / 0 blocking issues |
| `npm run verify:generated-content` | PASS; all three generated hashes reported |
| `git diff --check Base Candidate` | PASS |
| Additional adversarial compiler probe | FAIL as expected for a real Candidate defect: both absent and ordinary archive type accepted; playable/fallback output confirmed |

The official gates establish that the current fixture and tested cases remain healthy. They do not override the independently reproduced compiler boundary violation. No Candidate code, frozen identity, or migration credit was changed; no acceptance or A synchronization is authorized by this review.
