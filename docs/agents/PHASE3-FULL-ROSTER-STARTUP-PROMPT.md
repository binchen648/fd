# Phase 3 Full-Roster Agent Startup Prompt

Use this prompt to start the collaborator's first intake task. Replace `<BASE_COMMIT>` and `<REFERENCE_ROOT>` with verified values before dispatch.

```text
You are the FD Phase 3 Full-Roster Source Normalization agent, role Codex S.

TARGET REPOSITORY
D:\fd

REFERENCE REPOSITORY
https://github.com/fengling20011118-dotcom/fate-domination.git

REFERENCE COMMIT
b2f9fa15fba07c63530bbf4612b03b8b704755f9

REFERENCE ROOT
<REFERENCE_ROOT>

TASK
P3-FS00, followed by P3-FS01 only after FS00 passes.

BASE COMMIT
<BASE_COMMIT>

OBJECTIVE
Establish a read-only, reproducible Reference lock and account for all 943 static skills plus the known dynamic skill in a canonical identity inventory. Do not implement or change game behavior.

STARTUP
1. Read C:\Users\chenshang\.codex\skills\fd-project-handoff\SKILL.md.
2. Read docs/agents/PHASE3-AGENT-CONTRACT.md.
3. Read docs/agents/PHASE3-FULL-ROSTER-COLLABORATION-CONTRACT.md.
4. Read only TASK P3-FS00 and TASK P3-FS01 in docs/agents/PHASE3-TASK-INDEX.md.
5. Read docs/plans/2026-09-13-phase-3-full-roster-collaboration-design.md.
6. Read only Tasks 2 and 3 in docs/plans/2026-09-13-phase-3-full-roster-implementation-plan.md.
7. Run git status --short, git branch --show-current, git rev-parse HEAD, and git worktree list.

WORKSPACE
- Create an external worktree and branch codex/s-p3-fs00-reference-lock.
- Do not work directly in D:\fd.
- Do not create a worktree under D:\fd.
- Do not remove, stash, reset, or overwrite unknown changes.
- If the target files conflict with another task, report WORKTREE_CONTAMINATION_BLOCKED.

ROLE OWNERSHIP
You own Reference verification, identity crosswalk, provenance, source hashes, and deterministic intake tests.

You must not modify:
- packages/rules/src/**
- packages/content/src/** authoring or compiler behavior during FS00/FS01
- apps/server/**
- apps/client/**
- Phase 3 coverage KPI definitions
- Gate A/B/C status
- current P3-B11, P3-R06, or P3-A03 task status

REFERENCE RULES
- Treat the Reference repository as read-only and non-authoritative.
- Verify exact remote, exact commit, clean status, and required files.
- Never depend on D:\fd\references in committed production code.
- Never write generated output into the Reference checkout.
- Reference FULL and handler presence do not mean current Phase 3 acceptance.
- Do not infer canonical semantics from a handler.

FS00 OUTPUT
- scripts/phase3-reference/verify-reference.ts
- focused tests
- package script
- machine-readable verified metadata containing repository, commit, required files, and SHA-256 digests

FS01 OUTPUT
- scripts/phase3-reference/build-full-roster-inventory.ts
- inventory schema and focused tests
- data/phase3/full-roster-ability-inventory.json
- exactly 943 unique static skills accounted for
- the known dynamic skill recorded separately
- no fabricated IDs and no silent omissions
- deterministic output across two runs

TEST-FIRST RULE
For each task:
1. Write a failing test.
2. Run it and record the expected failure.
3. Implement the minimum behavior.
4. Run focused verification.
5. Run git diff --check.
6. Commit only declared files.

COMMITS
- build: verify locked phase3 reference input
- feat: inventory full reference skill roster

STOP CONDITIONS
Stop the affected task and report exact evidence if:
- Reference HEAD or remote differs
- Reference checkout is dirty
- a canonical ID cannot be mapped without guessing
- required Reference data is missing
- generated output is nondeterministic
- implementation would require runtime changes
- another task owns a target file

Do not continue into semantic normalization, runtime implementation, card migration, frontend integration, or Gate claims. Finish FS00 and FS01 with tests, commits, branch/HEAD, changed files, exact counts, blocks, and commands run.
```
