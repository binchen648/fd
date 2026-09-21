# P3-A Global Readiness Automation

Status: `AUTOMATION_BASELINE_CANDIDATE`
Owner: Codex A
Branch: `codex/a-p3-global-remaining-skill-replan`
Source governance baseline: `8b63d3cdd2ae068810805c650dca6903874e825d`
Accepted automation dependency: P3-A01 Candidate `2c59d0623b8c2d3ee0de0f6fbd95692556316bbd`

## Scope

This slice adds evidence-only readiness automation. It changes no rules runtime, authoring card semantics, compiled pack, generated product, client, or server behavior. It does not dispatch a new B2 or S task while FB2-49 owns the active runtime chain.

## Baseline correction

The prior planning scan recursively matched nested IDs and reported material `151/944`. The production collector reads only top-level canonical authoring archive `cards[]` entries and finds:

- frozen denominator: `944`;
- current-checkout material: `146`;
- current-checkout material missing: `798`;
- formal accepted ledger: `151`;
- formal remaining: `793`;
- explicit formal/material branch drift: `5`.

This drift is visible evidence state, not migration credit. The compiler neither repeats `+1` credit nor assumes which stacked branches provide those five identities.

## Current queue

- `MIGRATED_CONFIRMED`: `146`
- `SOURCE_EVIDENCE_REQUIRED`: `743`
- `SPECIAL_HANDLER_REVIEW`: `5`
- `COMPLETE_CARD_PROBE_REQUIRED`: `49`
- `ACTIVE_TASK_RESERVED`: `1` (`servant.astolfo.skill.sc-astolfo-1`)
- `S_READY_NOW`: `0`
- `ONE_SHARED_GAP`: `0`

FM09 remains metadata only: `2/11` present, `9/11` missing. No FM09 completion batch is authorized.

## Fail-closed controls

- exact inventory, authoring, identity-set, source and decision fingerprints;
- unknown/duplicate frozen identity rejection;
- stale decision rejection;
- exact accepted migration and capability evidence schemas;
- duplicate migration credit rejection;
- complete-card proof required for `S_READY_NOW`;
- all non-missing capability and transitive dependencies required for `ONE_SHARED_GAP`;
- active reservation override;
- singleton dispatch default with a narrow documented same-owner exception;
- explicit FM09 bulk, Fujino co-bundle and Ryougi cross-card inheritance rejection.
- invalid Git review diff bases fail before packet creation and cannot produce a false `hotRuntimeFilesTouched=NO` result.

The accepted A01 behavior was ported onto this branch rather than copying A01's generated artifact. Fresh branch-local coverage reports definition hash `7f5f8b8aa6f0abbe060b611189d4c104481486aa50435f4b73a8be7c7890bde1`, `0` blocking issues, `22` semantic-routed consumers, `144` legacy `resolveEffect` consumers, and `0` dual consumers.

## Commands

- `npm run phase3:global-readiness -- --validate-only`
- `npm run phase3:global-readiness`
- `npx vitest run scripts/tests/phase3-global-readiness.test.ts scripts/tests/phase3-full-roster-audit.test.ts scripts/tests/phase3-coverage.test.ts`
- `npm run phase3:coverage`
- `npm run phase3:automation-audit`
- `npm run typecheck`
- `git diff --check`

Exact final outcomes are recorded in the review handoff. Generated queue evidence is `artifacts/phase3-global-readiness.json`.

## Acceptance boundary

Claimed status is only `AUTOMATION_BASELINE_CANDIDATE`. No queue row is independently promoted by this implementation, no Gate A/B/C state changes, and no Phase or Release Gate claim is made.
