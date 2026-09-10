# P3-A01 Phase 3 Coverage And Evidence Automation Result

- Document Role: RESULT REPORT
- Status: AUTOMATION_BASELINE_CANDIDATE
- Date: 2026-09-09
- Scope: coverage/evidence automation only
- Acceptance Status: This report does not promote Phase 3, Gate A/B/C, SCENARIO_VERIFIED, E2E_VERIFIED, or Release status.

## New Commands

```powershell
npm run phase3:coverage
npm run phase3:review-packet -- --task P3-A01
```

## Machine Artifacts

- `artifacts/phase3-skill-coverage.json`
- `artifacts/phase3-review-packet-p3-a01.json`

The coverage artifact records source fingerprint, authoring totals, compiled definition identity, semantic-axis counts, runtime-routing counts, legacy metrics, primitive coverage, taxonomy drift protections, and unclassified items.

## Coverage Baseline

Fresh `npm run phase3:coverage` output:

| Metric | Count |
|---|---:|
| Authoring archives | 14 |
| Cards | 46 |
| Abilities | 92 |
| Compiled cards | 70 |
| Compiled characters | 14 |
| Blocking compile issues | 93 |
| New runtime semantic routed consumers | 8 |
| Legacy executeAbility consumers | 3 |
| Legacy resolveEffect consumers | 53 |
| Dual runtime consumers | 0 |
| Pilot allowlist entries | 0 |
| Not classifiable | 28 |
| Taxonomy drift warnings | 79 |

Compiled pack identity:

- pack: `fd-playtest-v1@1`
- definitionHash: `1bccc97dd813d9b48208ff6223db40f11a995ca123a513e78e7e444d9bdafe2f`

Current worktree note:

- `phase3:coverage` is functioning and records compiled-content blockers instead of hiding them.
- The 93 blocking issues are `MISSING_IMAGE` issues caused by absent `chm-extract` source assets in this worktree; they block Release Gate/content validation, not P3-A01 automation behavior.

## Taxonomy Drift Protections

Implemented guardrails:

- `phase_action` is reported as Ability Kind / timing, not Domain Event Trigger.
- `passive` is reported as Ability Kind, not Lifecycle Policy.
- `on_card_played` is a Domain Event Trigger, but not an Interaction unless the ability requires extra player input.
- Target references do not imply strict PendingInteraction without declared `targets`.
- Unknown primitive/runtime route remains `NOT_CLASSIFIABLE` and is emitted in `unclassifiedItems`.

## Legacy Metrics

The current automation reports before/after counters for:

- legacy executeAbility consumers;
- legacy resolveEffect consumers;
- dual runtime consumers;
- pilot allowlist entries;
- unsupported / not-classifiable nodes.

These are KPI-style routing metrics. They do not use raw ability count as a burn-down success metric.

## Reviewer Packet Boundaries

The generated packet now explicitly records:

- `claimedAcceptance: AUTOMATION_BASELINE_CANDIDATE`
- `hotRuntimeFilesTouched` computed from the reviewed git diff range
- known limitations
- areas not verified

This prevents the automation packet from being misread as a runtime, Gate A/B/C, or Release promotion.

Current reviewed diff scope:

- Default scope: `origin/main...HEAD`
- Result: `hotRuntimeFilesTouched.status: YES`
- Files reported by the packet include hot runtime files already present in the target branch history: `packages/rules/src/ability/executable-card-pack.ts`, `packages/rules/src/ability/interpreter.ts`, `packages/rules/src/ability/resolution-dataflow.ts`, `packages/rules/src/ability/types.ts`, and `packages/rules/src/match-session.ts`.
- This P3-A01 repair patch itself does not modify those runtime files; the packet now exposes the branch-level risk instead of clearing it.

## Tests

Fresh targeted automation tests:

```powershell
npx vitest run scripts/tests/phase3-coverage.test.ts
```

Result: 11/11 PASS.

Current hardening rerun:

```powershell
npx vitest run scripts/tests/phase3-coverage.test.ts
npm run typecheck
npm run phase3:coverage
npm run phase3:review-packet -- --task P3-A01
npm run content:validate
npm run test:ci
```

Result:

- taxonomy / artifact / packet tests: 11/11 PASS
- typecheck: PASS
- coverage command: PASS, with current content blockers reported
- review packet command: PASS
- content validate: FAIL, 93 `MISSING_IMAGE` blocking issues
- test:ci: FAIL, 3 files failed due to missing image assets and compiled-pack hash drift in the current worktree

## Hot Runtime Files

This P3-A01 repair patch intentionally does not modify hot runtime files.

The generated review packet now reports hot runtime files from the target branch diff scope instead of hard-coding `NO`, so branch-level runtime-touch risk remains visible to reviewers.

## Known Limitations

- Runtime routing classification is conservative and static. Unknown paths are preserved as `NOT_CLASSIFIABLE`.
- Unknown primitives remain `NOT_CLASSIFIABLE` even when they use data-flow syntax such as `bind`, `resultVar`, or `binding_field`.
- `phase3:review-packet` regenerates coverage from current authoring inputs instead of trusting an existing `artifacts/phase3-skill-coverage.json`.
- Card-specific handler detection is static literal scanning only; it is evidence for reviewer attention, not a complete call graph.
- Gate A/B/C evidence is not promoted by this task. Reviewer packet generation only packages evidence for later review.

## Known Failures

- Current worktree source-image assets under `chm-extract` are absent, producing 93 `MISSING_IMAGE` content blockers.
- `packages/rules/tests/regression/golden-card-content-pipeline.test.ts` fails because the freshly compiled definition hash is `1bccc97dd813d9b48208ff6223db40f11a995ca123a513e78e7e444d9bdafe2f`, while the checked-in expected hash is `f140e032bf241825577c0b78c6c3fa08f7a7f49bd7046feaa5deadabb13f5baa`.
- These failures block Release Gate / full regression acceptance, but they are outside the P3-A01 automation-only implementation scope.
