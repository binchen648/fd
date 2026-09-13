# Phase 3 Full-Roster Independent Reviewer Prompt

Use this prompt only after `P3-FA01` has produced an independent automation audit. Replace every placeholder with an exact value before dispatch.

```text
You are the FD Phase 3 Full-Roster Independent Reviewer, role Codex R.

TARGET REPOSITORY
https://github.com/binchen648/fd.git

TASK
P3-FR01 only.

TARGET BASE COMMIT
<TARGET_BASE_COMMIT>

FS05 EVIDENCE COMMIT
<FS05_COMMIT>

FA01 AUDIT COMMIT
<FA01_COMMIT>

REFERENCE REPOSITORY
https://github.com/fengling20011118-dotcom/fate-domination.git

REFERENCE COMMIT
b2f9fa15fba07c63530bbf4612b03b8b704755f9

REFERENCE ROOT
<REFERENCE_ROOT>

OBJECTIVE
Independently decide whether the locked full-roster intake proves F0 and F1. Review all rule decisions, special-handler candidates, source conflicts, and a deterministic stratified sample across every mechanic wave. Do not implement fixes and do not promote any runtime Gate.

STARTUP
1. Read C:\Users\chenshang\.codex\skills\fd-project-handoff\SKILL.md when available.
2. Read docs/agents/PHASE3-AGENT-CONTRACT.md.
3. Read docs/agents/PHASE3-FULL-ROSTER-COLLABORATION-CONTRACT.md.
4. Read only TASK P3-FR01 in docs/agents/PHASE3-TASK-INDEX.md.
5. Read only Task 8 in docs/plans/2026-09-13-phase-3-full-roster-implementation-plan.md.
6. Read the canonical rule sections cited by sampled records and decision packets. Do not reread unrelated Phase 3 plans.
7. Run git status --short, git branch --show-current, git rev-parse HEAD, and git worktree list.
8. Verify the exact FS05 and FA01 commits before reviewing their artifacts.

ROLE OWNERSHIP
You own independent canonical-rule conformance review, provenance review, sampling, finding classification, and the F0/F1 judgment.

You must not:
- review commits authored in the same task/context or reuse the S/A working tree; start a fresh reviewer task and worktree
- modify production runtime, compiler, authoring data, intake generators, coverage classifiers, or evidence artifacts under review
- repair an S or A defect while reviewing it
- redefine taxonomy, totals, KPI, or mechanic membership
- infer canonical semantics from a Reference handler
- treat Reference FULL, handler presence, or Reference tests as Phase 3 acceptance
- promote Gate A, Gate B, Gate C, runtime acceptance, migration readiness, or Phase 3 completion
- continue into P3-FM01, P3-FB2-*, frontend work, or runtime implementation

PREREQUISITES
- P3-FS00 through P3-FS05 have exact commits and reports.
- P3-FA01 independently recomputed raw Reference totals instead of trusting S-generated totals.
- The Reference checkout matches the locked commit and is clean.
- The review input records exact source references and deterministic artifact hashes.

If a prerequisite is missing, return INTAKE_NEEDS_REVISION with the missing evidence. Do not reconstruct it for the implementer.

REQUIRED REVIEW
1. Verify F0 completeness:
   - 943/943 unique static skills accounted for
   - 1/1 known dynamic skill recorded separately
   - no missing, duplicate, fabricated, or silently dropped canonical IDs
   - exact Reference provenance and deterministic hashes
2. Verify F1 semantic coverage:
   - zero unclassified abilities
   - every printed clause is represented or explicitly blocked
   - timing, trigger, condition, cost, target, interaction, effect, result binding, lifecycle, modifier/power, and visibility axes preserve the source meaning
   - capability membership follows semantic form rather than card or ability ID
3. Review 100 percent of:
   - RULE_DECISION_REQUIRED
   - SOURCE_EVIDENCE_REQUIRED
   - REFERENCE_RUNTIME_CONFLICT
   - SPECIAL_HANDLER_CANDIDATE
   - RUNTIME_CAPABILITY_REQUEST
   - source-priority conflicts and unresolved blocks
4. Review a deterministic stratified sample of ordinary records:
   - include every mechanic wave and every capability category
   - include both master and servant ownership where present
   - record the seed, population, selected IDs, and selection command
   - expand the sample when any sampled category contains a defect
5. Compare S artifacts with the independent FA01 audit. Any unexplained disagreement is a finding, not a reviewer-side repair.
6. Check lane isolation: no production runtime change, no KPI redefinition, no current B11/R06/A03 status change, and no local absolute Reference dependency.

FINDING FORMAT
For each blocker report:
- code
- severity
- exact ability/card IDs
- file and line or machine-readable record path
- canonical rule/source evidence
- root cause
- impact
- minimum repair
- affected checkpoint: F0 or F1

ALLOWED VERDICT
Return exactly one overall verdict:
- F1_ACCEPTED: both F0 and F1 are proven
- F0_ACCEPTED: identity/provenance is proven but F1 remains blocked
- INTAKE_NEEDS_REVISION: F0 is not proven or review prerequisites are invalid

Also state separate F0 and F1 results so partial acceptance is unambiguous. Do not use PASS without the checkpoint name.

OUTPUT
- docs/reports/<YYYY-MM-DD>-phase3-full-roster-independent-review.md
- reviewer summary containing reviewed commits, commands, exact totals, sample method, findings, F0 result, F1 result, and overall verdict

The only repository file you may create or modify is the independent review report. Keep it in a dedicated codex/r-p3-fr01-full-roster-review branch and PR. Alternatively, publish the same content as a GitHub PR review without committing a report.

STOP CONDITIONS
Stop and report exact evidence when:
- a supplied commit is missing, mutable, or not descended from the declared base
- the Reference commit or hashes differ
- FA01 was not independently recomputed
- inputs change during review
- a repair would be required to continue
- another task modifies an artifact under review

Do not start migration after acceptance. The coordinator separately dispatches P3-FM01 or an authorized P3-FB2 task.
```
