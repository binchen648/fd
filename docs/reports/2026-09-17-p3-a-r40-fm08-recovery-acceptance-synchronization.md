# P3-A R40 / FM08 Recovery Acceptance Synchronization

Date: 2026-09-17
Role: Codex A
Status: `SYNCHRONIZED`

## Accepted recovery lineage

- FB2-14 r2 candidate: `3879203870bb05ad9619c03c60c69ed9e1941080`
- Fresh R39 blocker report: `68b173d480df7a7b0e83cdc403e73616c3216b2f`
- FB2-14 r3 recovery candidate: `0831d9fea7c0ffedde634333f27564ea3c1dc65a`
- Fresh R39 acceptance report: `45e1cc6ff25fe6da838b8d7fca382d0504275aa7`
- FB2-14 recovery A synchronization: `ff2742e51d46ee862071abffe4e23a61652dbdc1`
- FM08 S recovery candidate: `81ccb7e7e5d0f2cf5ad7da1eda3279c20a604c1a`
- FM08 A material synchronization: `bf496c772bda7eb9899fcfa51d825929951012b7`
- Fresh R40 recovery review report commit: `8ed6b85f80f9b8a2069f523bb53fb58c7935f22d`
- Fresh R40 Codex thread: `01a0ae49-2abe-7690-b3c7-71e6be1f8cc5`

The old #341-#345 acceptance chain is not used as acceptance provenance for this recovery.

## R40 result synchronized

Fresh process-separated R40 returns `MIGRATION_ACCEPTED` for the exact ten-member FM08 recovery migration.

R40 independently verifies:

- exact recovery lineage and additive S scope;
- exactly ten authorized `core.game-start-rule-flags` identities and the Leonardo/Ophelia exclusions;
- frozen F1 hashes and locked Reference static metadata;
- all ten real authoring abilities load blocker-free and install only the accepted FB2-14 rule overrides;
- canonical Irisviel s1 remains isolated from the pre-existing playtest Irisviel archive;
- material overlap is `111/944`, not `112/944`, because the sole dynamic Tiamat identity remains absent;
- duplicate frozen IDs `0` and remaining unmaterialized denominator `833/944`;
- typecheck PASS, focused `16/16`, rules/core `396/396`, content validation 0 blockers, determinism PASS, full CI `738/738`;
- fresh coverage `98 archives / 133 cards / 232 abilities`, raw `22/3/127/0/80/124`, compiled product unchanged;
- production runtime/taxonomy/KPI drift `0` for FM08.

The reviewer also records that its first parallel test attempt raced TypeScript build output and produced transient package-resolution errors; after build completion, all affected suites were rerun sequentially and passed. This is not treated as a source failure.

## Accepted overlap

Before fresh R40 recovery acceptance:

- local recovery-line accepted overlap: `101/944`;
- candidate material overlap: `111/944`.

After fresh R40 `MIGRATION_ACCEPTED`:

- local recovery-line accepted overlap: `111/944` (`11.76%`);
- remaining outside accepted canonical authoring: `833/944`;
- net accepted increase: `+10`;
- unauthorized additions/removals: `0`.

This restores the same numeric overlap previously claimed by the invalid #342-#345 chain, but now on a different, traceable recovery lineage. The old acceptance claims remain superseded rather than retroactively validated.

## Repository and reviewer-governance boundary

At this synchronization base, `origin/main...8ed6b85` is `33` commits main-only and `219` commits recovery-line-only, with merge-base `fba31b5a725e6c0b8ba54793be8b6726bfc31040`.

Therefore `BASELINE_REBASE_REQUIRED` remains active. `111/944` is a local recovery-line acceptance state, not current-main acceptance. No document may state or imply that these commits are merged into `origin/main` until an explicit integration/rebase/merge path succeeds.

The fresh R40 used a separate worktree and fresh Codex process/thread, which establishes local process separation. It still does not prove a distinct GitHub account or human reviewer identity and does not replace missing GitHub review/status evidence. That governance limitation remains open.

## Next work

FM09 may resume only from this corrected post-R40 recovery synchronization lineage.

Any FM09/Ciel work created earlier from the invalid pre-recovery `111/944` chain is not reused as acceptance provenance. Useful implementation ideas or byte-equivalent material may be reconstructed, but a new S candidate must be based on the corrected recovery lineage and must receive fresh A/R gates before taking further migration credit.
