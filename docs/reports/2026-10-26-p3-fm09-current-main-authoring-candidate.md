# P3-FM09 current-main game-start skill provisioning authoring candidate

Status: `MIGRATION_CANDIDATE` only; no credit, A-sync, merge, or acceptance is implied.

- Exact Base: `07db64fe50f0ab305dc526e07801bf7bcf9ce0b2`
- Candidate: `365c2d8bd7fdac4714dbf5dc62db971053aeaf02`
- Exact ten source IDs: `master.bazett.skill.s1`, `master.caules.skill.s1`, `master.ciel.skill.s1a`, `master.fujino.skill.s1`, `master.shiki-nanaya.skill.s1`, `master.shiki-ryougi.skill.s1`, `master.shiki-ryougi.skill.s1a`, `master.shiki-tohno.skill.s1`, `master.shirou-emiya.skill.s2`, `master.zouken.skill.s2`.
- Provisioning targets: eleven frozen targets plus derived `card.derived.master.shirou-emiya.ganjiang-moye`; the derived target is excluded from the frozen 944 denominator.
- Scope: nine FM09 rules-only authoring archives, canonical `authoringMasterRuleFiles` pack wiring, and one focused authoring test. Runtime, generated content, coverage, task index, governance, and unrelated servants are untouched.

Verification: JSON parse and `git diff --check` pass. Vitest/full CI/typecheck/content/determinism checks could not run in this isolated worktree because the workspace has no installed `vitest` binary; run the requested suite from the dependency-equipped current-main worktree before review.
