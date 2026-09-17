# P3-TO-11 Trigger Runtime r1 Repair

- Date: 2026-09-14
- Task: P3-TO-11
- Role: Codex B repair
- Parent Candidate: `17d96b0057b79883769f9bd266d1f0cfefddbd5d`
- Triggering Review: `366e582e4286664b5e00abae6d28be488533b0dc` / `IMPLEMENTATION_NEEDS_REVISION`
- Branch: `codex/b-p3-to11-trigger-runtime-r1`
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`

## Blocking Finding Repaired

The independent reviewer found that the initial TO11 candidate unintentionally removed the existing public root-package export `collectTriggeredAbilities` by changing it from an exported function to a private function.

This repair is compatibility-only:

1. restores `export function collectTriggeredAbilities(...)`;
2. adds a durable `package-exports.test.ts` assertion that the root export remains a function.

No TO11 semantic classifier, trigger discovery predicate, event producer, typed resource primitive, authoring data, generated content, or MatchSession behavior changed relative to the parent candidate.

## Diff Boundary

Relative to `17d96b0057b79883769f9bd266d1f0cfefddbd5d`, the repair changes only:

- `packages/rules/src/ability/interpreter.ts` — restore one `export` keyword;
- `packages/rules/tests/regression/package-exports.test.ts` — import/assert the existing public symbol.

## Verification

- `git diff --check`: PASS.
- `npm.cmd run typecheck`: PASS.
- root API probe: `collectTriggeredAbilities=function`.
- focused suite including package export, TO11 trigger-resource, Resource Numeric, Resolution Data-flow, movement, MatchSession, complex skills, and golden compiled content:
  - **8 files / 95 tests PASS**.
- full root `npm.cmd test`:
  - **95 files total**;
  - **85 passed / 10 failed**;
  - **582 tests total**;
  - **562 passed / 20 failed**;
  - all 20 failures remain the inherited local CHM/original-image asset absence class.

## Scope / Gate Claim

This repair does not self-promote Gate A/B/C. The exact repaired candidate must be independently re-reviewed. Ereshkigal remains intentionally skipped from the typed TO11 slice as `SOURCE_BATTLEFIELD_ANCHOR_REQUIRED`; this repair does not change that residual legacy behavior.
