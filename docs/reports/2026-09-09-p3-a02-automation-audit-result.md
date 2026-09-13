# P3-A02 Legacy Owner And Promotion Evidence Automation Result

- Phase: Phase 3 / Codex A automation
- Task: `P3-A02`
- Claimed Acceptance: `AUTOMATION_BASELINE_CANDIDATE`
- Promotion: this report does not promote Gate A/B/C, Phase 3, or Release status.

## Scope

This slice establishes automation for:

- legacy owner grouping;
- mechanism coverage trend baseline;
- promotion evidence report/spec consistency checks;
- machine-readable P3-A02 packet.

It does not modify runtime semantics, primitive behavior, semantic routing, `MatchSession`, card-specific behavior, or Gate status.

## Outputs

Command:

```text
npm run phase3:automation-audit
```

Machine-readable artifact:

```text
artifacts/phase3-a02-automation-audit.json
```

## Current Baseline

Fresh output:

```text
PHASE_3_A02_AUTOMATION_AUDIT
legacyResolveEffect=53
legacyExecuteAbility=3
notClassifiable=28
promotionFindings=14
artifact=artifacts\phase3-a02-automation-audit.json
```

Top static owner groups from the generated packet:

| Owner | Route | Count |
|---|---|---:|
| `unclassified:runtime_route_unknown` | `NOT_CLASSIFIABLE` | 19 |
| `primitive:reveal_information` | `LEGACY_RESOLVE_EFFECT` | 11 |
| `primitive:adjust_victory_points` | `LEGACY_RESOLVE_EFFECT` | 6 |
| `primitive:record_master_directive` | `LEGACY_RESOLVE_EFFECT` | 6 |
| `primitive:adjust_command_seals` | `LEGACY_RESOLVE_EFFECT` | 5 |
| `ability_kind:OPTIONAL_TRIGGER` | `LEGACY_EXECUTE_ABILITY` | 3 |
| `primitive:create_card` | `LEGACY_RESOLVE_EFFECT` | 3 |
| `primitive:adjust_mana` | `LEGACY_RESOLVE_EFFECT` | 2 |
| `primitive:move_card` | `LEGACY_RESOLVE_EFFECT` | 2 |

## Promotion Evidence Findings

The first run intentionally reports blocking documentation/spec consistency findings where reports reference Gate C spec files that are not present in this A checkout. These are evidence governance findings, not runtime semantic fixes.

Blocking examples now include reports for:

- scoped PLAY;
- scoped PLAY source response;
- scoped ADD_TO_ATTACK;
- scoped ACTIVATE;
- scoped CLOSE;
- Artoria Caster modifier/lifecycle;
- Time Alter and Conversion Magic Gate C result reports;
- Phase 3A core primitive partial Gate C evidence.

These findings should block evidence promotion in this branch until the referenced specs exist in the reviewed checkout or the reports are scoped to the branch that contains them.

## Verification

Fresh commands:

```text
npx vitest run scripts/tests/phase3-coverage.test.ts
PASS: 1 file, 15 tests
```

```text
npm run phase3:automation-audit
PASS: artifact generated, promotionFindings=14
```

## Known Legacy Paths Intentionally Retained

- `legacyResolveEffect=53`
- `legacyExecuteAbility=3`
- `notClassifiable=28`

P3-A02 reports these paths; it does not migrate them.

## Areas Not Verified

- Runtime call graph ownership beyond static coverage.
- Gate A/B/C semantic correctness.
- Full CI / Release readiness.
- Whether missing E2E spec references are absent from all branches or only absent from this A checkout.

## Next Step

Codex B should continue P3-B04 runtime work using the P3-B04 handoff. Codex A should use this P3-A02 packet after B finishes to check scope drift, legacy burn-down deltas, and promotion evidence consistency.
