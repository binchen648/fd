# FD Phase 3 A111/A112 Statistics Freeze

- Freeze ID: `FD-P3-E04-STATISTICS-FREEZE-2026-09-28`
- Control Epoch: `FD-P3-2026-09-23-04`
- A111 frozen content commit: `b7f88c7197859e7203eada1dad4f4ac4e9f1d6fa`
- A112 frozen content commit: `79f5ebaaaa4f2a89ab8b953afbaa7c7c82e8b681`
- Frozen refs:
  - `codex/a-p3-e04-a111-frozen`
  - `codex/a-p3-e04-a112-frozen`
- Verification command: `npx tsx scripts/phase3-e04-freeze-verify.ts`

## Frozen Policy

The A111/A112 accounting, source matrix binding, gap classification, migration credit, and report claims are immutable. Further work must start as a new task from the A112 frozen ref and must not rewrite these artifacts or reinterpret their counts in place.

The freeze is evidence governance, not a promotion or acceptance claim. It does not mark Gate C as verified and does not add main coverage credit.

## Frozen Accounting

- accepted: `111`
- denominator: `944`
- remaining: `833`
- main coverage credit delta: `0`
- A112 `GENERATED_REGISTRY_MISSING`: `87`
- A112 `RUNTIME_CONTRACT_UNBOUND`: `49`
- A112 `TEST_EVIDENCE_UNBOUND`: `76`
- A112 `GATE_C_PENDING`: `111`
- A112 `LEGACY_ONLY`: `65`
- A112 `COMPILER_UNSUPPORTED`: `68`
- A112 `AUTHORING_GENERATION_DRIFT`: `0`
- A112 `REVIEW_ARTIFACT_MISSING`: `0`

The complete machine-readable binding is in `artifacts/phase3-e04-statistics-freeze.json`.
