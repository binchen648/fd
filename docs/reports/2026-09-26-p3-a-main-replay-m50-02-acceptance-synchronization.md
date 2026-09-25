# P3-A Current-Main M50-02 Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-26

## Exact accepted input

- Task: `P3-B-MAIN-REPLAY-M50-02-OPPONENT-CLOSE-ONE-NON-RESIDUAL`
- Implementation Base: `67a8d150efd20d7b84c08fab59d9b403a9543087`
- Accepted Candidate: `8e3570d753a42683d3d69751a51900f5daeaefee`
- PR: `#450`
- Canonical fresh-R evidence: `https://github.com/binchen648/fd/pull/450#issuecomment-5838215993`
- Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`

## Synchronization result

Fresh independent R accepted the exact revised Candidate. The synchronized capability is limited to identity-free `opponent_close_one_non_residual`. The accepted successor revalidates pending-answer source validity through current-main `isActiveCardSource(state, sourceId)`, so a source that leaves `field` / `attack_area` fails closed before settlement. The dedicated regression proves `attack_area -> skill` rejection without target mutation.

No Scathach authoring, M50-02 historical 50-card batch, unrelated M50 vocabulary, generated/client/pack production, governance change, identity routing, merge, or retarget is synchronized.

## Accounting

This capability is zero-credit infrastructure. Formal/material remains `112/944`, remaining `832`, duplicate frozen IDs unchanged.

## Next gate — exact-50 F4

All generic capabilities identified by the Scathach S2 decomposition are now accepted/synchronized on the current-main lineage. Do not dispatch Scathach S2 as a singleton. Compose the next non-tail F4 S migration batch at exactly 50 frozen identities, using Scathach S2 as one eligible member and filling the remaining 49 slots only with mechanically isolated compatible identities whose current-main runtime prerequisites and historical source/evidence are already exact. Any identity with a missing generic capability must stay out of the batch and cause a separate zero-credit B dispatch, not runtime widening inside S.
