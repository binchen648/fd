# P3-FB2-13 current-main materialization independent review

Verdict: **MIGRATION_ACCEPTED** for runtime dependency materialization only. This does not accept FM07 authoring or grant migration credit.

## Exact lineage and scope

- Current-main Base: `d54fb52b2d2ff711f4e0ef24b1028884fc26511a`.
- Materialized Candidate: `2b858317c75cd078a2bd8decf0dae3d536f45eff` (`codex/a-p3-fb2-13-current-main-materialized-20261025`).
- Historical accepted FB2-13 delta: `61d9f0c92e0af7598e237b71fb90ad83c13c88c1` to `18f2733eb0551f368e78a5f67ad9a32b96193d5b`; independent historical acceptance: `dc96afa3253dcf86a13e13ea29c8b99fb895df49`.
- Reviewed in separate Candidate and exact-Base Reviewer worktrees. Each of the ten authorized runtime/test files has precisely the same added and removed source lines as the historical accepted delta, compared file by file. The only other changed file is the new materialization report. There is no FM07 authoring, coverage, generated content, task-index, governance, or unrelated servant delta.

## Semantic and compatibility findings

- The runtime introduces only the identity-free Alter Ego transform variants. The trusted just-played own face-up attack card supplies the physical target; the client chooses only a subset of the three mutable attributes. Reversal uses authored reversal metadata, while ordinary transforms set instance-scoped effective attributes without changing printed definitions.
- Regular settlement closes the source; EX uses the existing fixed controller mana component for three mana and records once-per-round use after successful resolution. The server-owned pending interaction revalidates source, event, target, revision, candidates, and variant before settlement. Invalid provenance, stale target, insufficient mana, and decline leave no transform/payment/usage mutation.
- Transient transform state is cleared on board departure through typed movement, legacy close, round cleanup, and combat removal. Effective attributes feed existing constraints and combat tags. B23 Return Silence changes only by invoking this shared transform-state cleanup on its existing direct removal path; its behavior remains covered by the focused compatibility test.
- The current strict FB2-02 deployment, FB2-11 round-formula alias, FB2-12 Presence Concealment, FM05, and FM06 paths remain intact. No identity/name/text route was added.

## Independent verification

- `npm ci` in both Reviewer worktrees: passed.
- Candidate `npm run typecheck`: passed.
- Combined focused matrix: FB2-13 7/7, FB2-02 9/9, FB2-11 7/7, FB2-12 10/10, FM05 4/4, FM06 4/4, B23 9/9; 50/50 total.
- Sequential exact-Base/Candidate `npm run test:ci`: Base 118 files, 723/723; Candidate 119 files, 730/730. Both have zero failed or skipped tests.
- `npm run content:validate`: 7 masters, 7 servants, 20 events, zero blocking issues. `npm run verify:generated-content`: passed with unchanged content, fixture, and evidence hashes. `git diff Base..Candidate --check`: passed.

No A-sync, merge, FM07 authoring, or migration credit was performed by the Reviewer.
