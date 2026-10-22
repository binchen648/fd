# Amor metadata-only Candidate report

## Candidate decision

This Candidate is derived directly from exact A-sync base
`e4c729b6e84beaf47f49e8f0c4dcb3823c9e1282` in the strict
`https://github.com/binchen648/fd` repository. It contains exactly three
`servant.amor` skill metadata records and no runtime, executable, playable, pack,
or roster mutation.

Independent GPT-6 Sol review commit:
`e84878661fca9c82dca4e6ab9988facd629aa6f1` (`CONTRACT_ACCEPTED_FOR_METADATA_ONLY`).
Owner credit is `0`.

Candidate artifact: `docs/phase3/amor-metadata-candidate.json`.

## Accepted metadata scope

Each record contains only:

- canonical ID and legacy ID;
- exact printed text and text SHA-256;
- frozen clause SHA-256 values;
- the two historical source references (CHM and development-image locator);
- source commit/path/blob SHA/file SHA provenance;
- an explicit `host_adjudicatedRules: provenance-only; not executable` marker.

The records are:

| Canonical ID | Legacy ID | Clause count |
| --- | --- | ---: |
| `servant.amor.skill.sc-amor-1` | `sc_amor_1` | 1 |
| `servant.amor.skill.sc-amor-2` | `sc_amor_2` | 2 |
| `servant.amor.skill.sc-amor-3` | `sc_amor_3` | 2 |

The source provenance is historical commit
`b2f9fa15fba07c63530bbf4612b03b8b704755f9`, path `docs/partial-current.json`,
Git blob SHA-1 `b9d970e5da815d056bf54162133e3cf2d9807c9`, file SHA-256
`c8d217b07d5633b5d84b1f3bbbc615b24eff55f2789eedd60bfb422e9418b0fe`.

## Warning correction

The candidate preserves all host/frozen clause mismatch warnings. It corrects the
reviewer-identified `sc-amor-1` third host warning digest to end in `25af5`:

The previous truncated value ending in `...c25af` is not used; the candidate value is
`3a7fbd40256119c4515e3eb81ffe5296f6d1f45a102ece28873c1aa437c25af5`.

The out-of-scope frozen `referenceRepository` warning and source-file identity
mismatch warning remain visible. No frozen inventory value is rewritten.

## Non-scope / hard gates

- No `src/`, handler, interpreter, executable rule, or runtime state changes.
- No `data/packs`, playable roster, generated content, or authoring-card changes.
- No implementation claim for S1, S2, or S3.
- `host_adjudicated` is provenance only and must not be treated as an accepted
  executable contract.

## Checks

The focused checks for this metadata-only Candidate are recorded below and are
repeatable from the Candidate worktree:

1. JSON parse/schema check: pass; `candidateStatus=CANDIDATE_METADATA_ONLY`,
   `skills=3`, `ownerCredit=0`.
2. Frozen-boundary check: pass; base commit is exact and no frozen inventory file
   is changed.
3. Scope check: pass; all mutation flags are false and no runtime/pack/roster path
   is present in the Candidate diff.
4. SHA check: pass; all three text hashes and five frozen clause hashes match the
   accepted packet; corrected `sc-amor-1` warning ends in `25af5`.
5. Typecheck: pass (`npm run typecheck`).
6. Content validation: pass (`npm run content:validate`; 8 masters, 8 servants,
   20 events, 0 blocking issues).
7. Generated-content determinism: pass (`npm run verify:generated-content`).
8. Static Phase 3 governance: pass with the temporary stacked role-B manifest
   (`npm run phase3:ci-gate -- --manifest ... --verify-git-ancestry`).
9. Diff hygiene: pass (`git diff --check base..candidate`).

The checks above did not modify runtime or generated-content surfaces. The static
gate manifest was temporary and is intentionally not part of the Candidate.
