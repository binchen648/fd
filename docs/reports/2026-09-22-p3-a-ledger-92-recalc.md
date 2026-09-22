# P3-A Ledger 92 Recalculation

Role: Codex A
Task: `P3-A-LEDGER-92-RECALC`
Status: `AUTOMATION_BASELINE_CANDIDATE`
BaseCommit: `4b52b3166ed2ba0efaa4569ee95c6513fd26ab2f`
Date: 2026-09-22

## Result

The machine-readable ledger is `artifacts/phase3-ledger-92.json`. It contains exactly 92 unique ability rows. Every row contains:

- `archiveId`, `cardId`, `abilityId`, and a stable compound `abilityKey`;
- exact source path, JSON pointer, printed clause, and printed-clause SHA-256;
- runtime owner classification and semantic route;
- exact and ambiguous test references;
- Gate A/B/C fields;
- R and BaseCommit/main-presence fields;
- missing contract, next owner, and routing reason.

The generator and validator are `scripts/phase3-ledger-92.ts`. `--validate` performs a fresh recalculation and fails when the manifest denominator, source fingerprint, required fields, identity set, or any generated row differs.

## Recalculable denominator

The denominator is not copied from the old normalization report. It is recalculated from `data/packs/fd-playtest-v1/pack.json`:

- included: `authoringMasterFiles`, `authoringServantFiles`;
- excluded: `authoringMasterSupportFiles`;
- archives: 14;
- cards: 46;
- abilities: 92;
- duplicate ability keys: 0.

All selected authoring files and `scripts/phase3-coverage.ts` must remain unchanged from the required BaseCommit. The generator fails closed if those BaseCommit inputs drift.

Source fingerprint:

`5d3dd258817228f9bf9536ca7821fd8590259b2b6b21bd6de691ba5bd44d8e3d`

## Runtime route inventory

| Route | Count | Interpretation |
|---|---:|---|
| `NEW_RUNTIME_SEMANTIC_ROUTED` | 12 | Semantic classifier finds a new-runtime route. This is not R or Gate acceptance. |
| `LEGACY_RESOLVE_EFFECT` | 49 | Transitional legacy effect owner remains. |
| `LEGACY_EXECUTE_ABILITY` | 3 | Transitional legacy execute-ability owner remains. |
| `NOT_CLASSIFIABLE` | 28 | Exact runtime contract or classifier coverage is missing. |
| **Total** | **92** | Exact denominator. |

Next-owner routing is therefore:

- R: 12 semantic-routed candidates requiring independently bound evidence;
- B: 80 legacy or unclassified abilities requiring runtime-owner/contract work.

This routing is scheduling input, not promotion.

## Evidence policy

The ledger deliberately does not treat any of the following as acceptance:

- loader `automatic` mode;
- `FULL` or similar capability labels;
- a report's own claim;
- the existence of a test reference;
- a semantic-route classifier result.

All 92 rows therefore retain Gate A/B/C status `NOT_VERIFIED`, even when candidate references exist. All R fields remain `NOT_MACHINE_VERIFIED` because the required BaseCommit has no structured exact-ability verdict registry that can be safely joined to these rows. Report references are discoverability inputs only.

Current discovery counts:

- exact identity test references: 92;
- Gate A reference candidates: 92;
- Gate B reference candidates: 92;
- Gate C browser reference candidates: 12;
- machine-verified R verdicts: 0;
- script-promoted Gate A/B/C rows: 0/0/0.

The first three counts must not be read as passed Gates. The broad regression suite references many exact card identities, but file-level references alone cannot prove scenario boundaries or independent acceptance.

## Verification

Commands run from the isolated BaseCommit worktree:

```text
npx tsx scripts/phase3-ledger-92.ts
npx tsx scripts/phase3-ledger-92.ts --validate
npm run typecheck
npx vitest run scripts/tests/phase3-ledger-92.test.ts scripts/tests/phase3-coverage.test.ts
```

Results:

- ledger generation: PASS, 92 abilities;
- fresh source recalculation: PASS;
- TypeScript project typecheck: PASS;
- A automation tests: PASS, 2 files / 24 tests;
- stale fingerprint and modified-row negative checks: PASS.

## Scope

No `packages/rules/src/**`, runtime test, authoring JSON, pack manifest, generated content, client, server, primitive, compiler, or runtime semantic file changed.

## Next action

Use the ledger as the restored Phase 3 scheduling baseline:

1. R may review the 12 semantic-routed rows and bind exact Gate evidence through a structured verdict source.
2. B should not take all 80 remaining rows as one batch. Select one exact missing contract from the 28 unclassified rows or one coherent legacy-owner family, then report the affected ledger identities and before/after route counts.
3. A reruns this ledger after accepted B integration and synchronizes only mechanically changed rows.

No Phase 3, Gate, roster-wide migration, or release promotion is claimed by this task.
