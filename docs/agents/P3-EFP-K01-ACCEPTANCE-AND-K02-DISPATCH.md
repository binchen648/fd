# K01 Acceptance Registration And K02 Dispatch

Date: 2026-10-13. Planner. Epoch: FD-P3-2026-09-23-09.
Tasks: P3-EFP-K01 / P3-EFP-K02. No new Epoch.

## Registered K01 Verdict

Reviewed candidate: ccbdf647a545e08f09a8067c8f2c4659f849889a.
Reviewer A commit: 2470f00902bd650bc3122f518b18333afed323f3.
Artifact: docs/reviews/phase3/P3-EFP-K01-ccbdf647-reviewer-a.json.
SHA-256: DA0F45FDED94F1DC941A3A6B7A91DA586D2DE36B0188EC8F3662FCBAF9B98687.
Planner independently verified exact Git bytes and direct parent binding.
Verdict registered: PASS for EXACT_K01_HISTORICAL_SOURCE_EXTRACTION_PROVENANCE_AND_REGRESSION_GAP_DOCUMENTATION_ONLY.

Six source-backed case extractions accepted; four UNKNOWN candidates retained.
No new-main conformance, runtime acceptance, Gate, credit or promotion follows.
Do not overwrite the frozen catalog's PENDING fields to imply it predicted its
future review. K02 consumes the immutable external K01 review reference.

## Current Control And Independent Reservation

Observed current main: 219d47c8dcc2b8118f2d3f6b37f51ce465e737cb.
Epoch09 remains current; B11 post-merge lifecycle is separate.

Reservation: docs/agents/manifests/reservations/P3-EFP-K02-TOOLING.json.
Granted to Codex A for this task, pending actual branch/worktree/base binding.
It excludes B11 preflight, runtime, package/workflow and historical fixes.
Do not interrupt an active B11 handoff or use its heavy-test window.

Before source edits A reports branch/worktree/exact base and accepts this grant.
Fresh conflict requires preserving competing work and a specific report.

## K02 Executable Dispatch

Start clean from the exact K01 Reviewer A commit above, preserving candidate
and reviewer ancestry. This is an automation candidate based on accepted
knowledge, not a claim to be based on current main. Use current-main comparison
only when explicitly requested later by I. No whole Planner branch replay.

Read only this task, reservation, accepted K01 catalog/audit, the pinned review,
HISTORICAL-FAILURE-PREFLIGHT.md and relevant local tooling conventions.
Read case documents only when needed to implement structured outputs.

Authorized paths:
- scripts/engineering/historical-failure-preflight.ts
- scripts/tests/engineering-failure-preflight.test.ts
- docs/engineering/lessons/K02-HANDOFF.md
- docs/engineering/lessons/K02-EXECUTION.json
- docs/engineering/lessons/HISTORICAL-FAILURE-PREFLIGHT.md
- docs/engineering/lessons/BATCH-TASK-TEMPLATE.md
- docs/engineering/lessons/INDEX.md

Implement a standalone CLI callable through node --import tsx. No package alias
or B11 preflight change. Follow the existing preflight matching/cache contract.
Validate structured task metadata and consume external K01 exact review scope
so accepted extraction and current-base test coverage remain separate.

Return ranked IDs/reasons, invariants, forbidden patterns, regression paths/
commands, pinned test existence/current-base uncertainty, missing coverage,
historical risk, unknown/overflow, source availability and elapsed time.
Use safe repository-relative paths. Missing source, hash drift, malformed task,
or review mismatch must produce truthful controlled errors. No-match is not LOW.
Use default three/max five, retaining overflow and critical-risk visibility.

Use the actual accepted catalog fields, including qualified testStatus values
and producer-source-vs-independent-review relationships. Do not hard-code a
five-case expectation or relabel all six historical cases as current-main PASS.
Synthetic unit fixtures are only parser/matching/integrity tests. Never publish
their proof as a historical case or GitHub attestation.

Cache only stable task/knowledge/relevant-source keys. Scope, knowledge or
relevant source changes invalidate it; ordinary report edits do not alone.
The CLI must not run regressions, acquire runtime locks, send tasks or award
acceptance. Batch template starts it automatically once available; no repeated
user copying or extra approval for a successful retrieval.

## Verification And Handoff

Lightweight tests must cover scoring/ties, bounds/overflow, no-match, malformed
input, missing source, tampered hash, exact review mismatch, cache reuse and
invalidation, truthful UNKNOWN/MISSING/NOT_VERIFIED and no runtime side effects.
Use tiny isolated Git fixtures, not shared moving HEAD or full historical clones.
Run the targeted new suite and appropriate TypeScript verification. A heavyweight
full CI is not authorized by this task; existing promotion checks remain later.

Freeze one implementation/carrier with command/exit/SHA/hash evidence in the two
authorized K02 outputs. Cite this dispatch and reservation externally to avoid
self-referential hashes. Keep all historical K01 artifacts/cases unchanged.
No role-level PR. Claimed result is AUTOMATION_BASELINE_CANDIDATE, pending RA.

Reviewer A verifies this exact tooling candidate, selected source bindings,
negative cases and startup integration in one review. It does not rerun historical
runtime reviews. G/I only participate under existing promotion policy when this
automation slice is later scheduled for integration.

## Next Sync

A frozen K02 candidate plus Reviewer A scoped verdict; then Planner decides
automation integration and eligibility of K03/K04. Historical runtime regressions
still require their own task and domain lock. Credit remains zero; ledger 111/944.
