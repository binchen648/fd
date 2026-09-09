# P3-A01 Phase 3 Coverage And Evidence Automation Result

- Document Role: RESULT REPORT
- Status: IMPLEMENTATION_COMPLETE_CANDIDATE
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
| Blocking compile issues | 0 |
| New runtime semantic routed consumers | 9 |
| Legacy executeAbility consumers | 3 |
| Legacy resolveEffect consumers | 58 |
| Dual runtime consumers | 0 |
| Pilot allowlist entries | 0 |
| Not classifiable | 22 |
| Taxonomy drift warnings | 79 |

Compiled pack identity:

- pack: `fd-playtest-v1@1`
- definitionHash: `f140e032bf241825577c0b78c6c3fa08f7a7f49bd7046feaa5deadabb13f5baa`

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

## Tests

Fresh targeted automation tests:

```powershell
npx vitest run scripts/tests/phase3-coverage.test.ts
```

Result: 6/6 PASS.

## Hot Runtime Files

This P3-A01 slice intentionally does not modify hot runtime files. The working tree may still contain pre-existing uncommitted runtime edits from earlier slices; they are outside this automation slice and are not part of this result report.

## Known Limitations

- Runtime routing classification is conservative and static. Unknown paths are preserved as `NOT_CLASSIFIABLE`.
- Card-specific handler detection is static literal scanning only; it is evidence for reviewer attention, not a complete call graph.
- Gate A/B/C evidence is not promoted by this task. Reviewer packet generation only packages evidence for later review.
