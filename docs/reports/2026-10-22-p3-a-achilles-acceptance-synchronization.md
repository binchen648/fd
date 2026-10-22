# P3-A Achilles owner acceptance synchronization and accounting

Date: 2026-10-22
Repository: [binchen648/fd](https://github.com/binchen648/fd)
Status: `SYNCHRONIZED — APPROVED SCOPED SUBSET ONLY`

## Exact accepted input

- Owner: `servant.achilles` / 阿喀琉斯
- Frozen skills: exactly the three owner-local skills listed below
- Candidate PR: [#666](https://github.com/binchen648/fd/pull/666)
- Candidate branch: `codex/achilles-owner-complete`
- Exact Candidate head: `2120716e583f8cc935534b8cb12f46b1fa04f144`
- Exact synchronization Base: `5fb0147a9b89f0d181b872a95059f853dbed8eec`
- Candidate report: `docs/reports/2026-10-22-p3-b-achilles-scoped-candidate.md`
- A-sync branch: `codex/a-p3-achilles-acceptance-sync`

The Candidate was reviewed in a separate fresh checkout. This A-sync does not
modify the Candidate, its Builder branch, frozen inventory, authoring source,
runtime code, tests, assets, or PR #666, and it does not merge any PR.

## Frozen skill scope

| Exact identity | Name | Accepted result |
| --- | --- | --- |
| `servant.achilles.skill.sc-achilles-1` | 勇者的不凋花 | source-bound scoped runtime subset accepted |
| `servant.achilles.skill.sc-achilles-2` | 包围苍天的小世界 | source-bound scoped runtime subset accepted |
| `servant.achilles.skill.sc-achilles-3` | 驰骋天际星之枪尖 | source-bound scoped runtime subset accepted |

This is a synchronization of the accepted Candidate evidence for these three
skills. It is not a claim that the frozen inventory has been promoted from its
existing blocked/source-required state, nor is it full Achilles semantic closure.

## Independent Reviewer evidence

- Independent Reviewer: GPT-6 Sol, separate Reviewer checkout
- Reviewer report: `C:\Users\24429\.codex\worktrees\achilles-fifth-reviewer\docs\reports\2026-10-22-p3-b-achilles-fifth-independent-review.md`
- Reviewer report commit: `973338b9a91c77714753a3cfeeca8efe68cffa6d`
- Verdict: `MIGRATION_ACCEPTED`
- Verdict scope: only the approved source-bound scoped subset; not full Achilles
  semantic or frozen-inventory release

The Reviewer verified that the Candidate's cumulative battle-history identity
is consistent across the receipt, combat resolver, game-loop, MatchSession,
serialization, restore, and replay paths. The focused Achilles/production run
reported `59 passed` across four files; typecheck, content validation,
generated-content verification, playtest verification, and diff checks passed.
The Reviewer also confirmed that forged/self-consistent `:999` identities are
rejected before ledger/revision mutation and that no frozen inventory path was
changed in the Candidate diff.

## Synchronization result and explicit limits

The A-owned record is synchronized to the exact Candidate and Base above. The
accepted scoped behavior includes S1's authoritative loss-trigger and
battle-local receipt boundary, S2's immediate discard and atomic 3-mana
hide-name branch, and S3's exact-one-player-pair receipt boundary.

The following remain explicitly blocked and are not accepted, released, or
silently inferred by this A-sync:

- S2 branch 2 (`forbid_skills`), including its duration/prohibition lifecycle;
- S3 battlefield movement/deployment lock, duration, and persistent lock or
  immunity behavior;
- NPC participant, movement/deployment, duration, and external-effect semantics;
- no-hand fallback, unselected-card inference, and ambiguous card
  classification paths;
- full external CHM/source-asset closure and full Achilles semantic closure.

No legacy handler, `Math.random()` path, diagnostic log, retained receipt, or
historical fixture is treated as additional authorization. The external source
asset limitation and the pre-existing full-suite baseline failures remain
unchanged and are not relabeled as Candidate acceptance.

## Accounting

This A-sync records the accepted scoped Candidate evidence only. It adds **no
new migration credit** (`credit delta: 0`) and does not alter frozen inventory
accounting. The three skills remain eligible for future formal owner-complete
accounting only after the governing source/semantic contracts, blocked limits,
and required integration gates are separately completed and accepted.

No merge, retarget, inventory regeneration, or credit promotion is performed
by this synchronization.

## Next legal handoff

Downstream work may reference this exact A-sync commit for the approved scoped
runtime subset. Any work claiming full owner completion must first obtain the
required formal source/semantic acceptance and independently close the S2
branch-2, S3 lock/immunity, NPC, source-asset, and restore/replay boundaries.
