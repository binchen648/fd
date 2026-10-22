# Anastasia SC1 A-sync / accounting

- Date: 2026-10-22
- Role: A synchronization/accounting
- Strict repository: `https://github.com/binchen648/fd.git`
- Exact A-sync base: `5e2b9317238f10de7f7a838f8b57df2773687a7a`
- Candidate: `7131438d59e203bad1a4a9df53c14c8df2def4dc`
- Candidate PR: [#676](https://github.com/binchen648/fd/pull/676)
- Formal source-bound decision: `e38fd3f`
- Independent Candidate Reviewer: `c188bc548518a23ae98e4998cd64c9e7ee658700`
- Verdict: `MIGRATION_ACCEPTED` — SC1 scoped subset only
- Credit delta: `0`

## Accounted scope

This A-sync records acceptance of exactly `servant.anastasia.skill.sc-anastasia-1` (`sc_anastasia_1`) under the previously accepted FM05 Territory Creation envelope:

- the two frozen clauses and their exact source/full-text/clause SHA evidence;
- R33/FB2-11's existing `game.round_number` formula `add(16, multiply(-2, game.round_number))`;
- R19/FB2-02's forced `after_player_deployed_to_battlefield` reward at `magic_workshop`, source-controller scope, `+1 mana` and `+2 VP`;
- R34's accepted exact ten-card FM05 Territory Creation migration family, with SC1 as one member.

This is accounting/documentation only. It adds no runtime, executable, playable, handler, authoring, pack, generated-content, roster, restore/replay, or frozen-inventory mutation.

## Preserved blocks and limits

- `servant.anastasia.skill.sc-anastasia-2` remains `SOURCE_EVIDENCE_REQUIRED` / `SEMANTIC_SOURCE_REQUIRED` / `EXPLICIT_BLOCK`.
- `servant.anastasia.skill.sc-anastasia-3` remains `SOURCE_EVIDENCE_REQUIRED` / `SEMANTIC_SOURCE_REQUIRED` / `EXPLICIT_BLOCK`.
- `servant.anastasia` remains owner-blocked; SC1 does not unlock the owner.
- `ownerCredit=0`; this A-sync grants no migration credit.
- Frozen inventory conflict (`currentRoute=none`, empty inherited/partial contracts, `mappingStatus=EXPLICIT_BLOCK`, `hasAuthoringCard=false`) is retained for a separate accounting reconciliation and is not rewritten here.
- No automatic implementation or owner-level acceptance is implied.

## Validation and reviewer limitation

- A-sync scope/base/Candidate/reviewer identifiers: recorded exactly as above.
- A-sync report is docs-only; runtime and frozen-inventory paths are untouched.
- `git diff --check`: PASS.
- Dynamic checks were **not rerun in the isolated Candidate Reviewer checkout** for this A-sync. The accounting relies on the previously cited FM05/R33/FB2-02/R34 evidence and the independent Candidate Reviewer verdict; no new dynamic result is claimed.
- No push or merge was performed.
