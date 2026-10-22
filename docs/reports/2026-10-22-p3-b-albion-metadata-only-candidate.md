# Albion metadata-only Candidate report

- Date: 2026-10-22
- Target repository: `https://github.com/binchen648/fd`
- Exact base: `19ac14d5c3c69e0dbbcb2da2fddb8319a7391f03`
- Builder branch: `codex/p3-albion-owner-complete`
- Accepted FORMAL review commit: `52490d1120eddb81077d8b6d524edeb9df31a305`
- Contract status: `CONTRACT_ACCEPTED_FOR_METADATA_ONLY`
- Candidate status: metadata-only Candidate; not runtime-complete and not merge-ready

## Scope delivered

This Candidate adds a separately loaded canonical metadata archive for
`servant.albion`. It preserves the three canonical skill IDs, legacy IDs,
names, exact printed text, frozen inventory SHA-256, clause SHA-256 values,
and source provenance boundaries. The archive is registered through
`metadataArchiveFiles`, not `authoringServantFiles`; Albion therefore does
not enter the playable servant roster, generated cards, or executable rule
archives.

Every archive/card capability is `HOST_ADJUDICATED` and every card sets
`automaticExecution: false`. S1 and S2 are `PARTIAL_SOURCE_BOUND` metadata;
their trigger, movement, resource, modifier, lifecycle, ordering, and replay
mechanics remain unresolved. S3 remains
`SOURCE_EVIDENCE_REQUIRED` + `SEMANTIC_SOURCE_REQUIRED` with
`mappingStatus=EXPLICIT_BLOCK`. No handler, trigger, target, resource,
battle, card-zone, or modifier runtime node was added.

The unversioned development-tree script and image are recorded only as
`external_*_corroboration_only` references with `NO_GIT_PROVENANCE`; neither
is source authority.

## Loader and generated evidence

The content loader now reads and validates `fd-card-metadata-v1` archives,
emits a separate `library.metadata` archive/sourceMap surface, and includes
metadata archive summaries in the evidence report. The compile bridge merges
the metadata sourceMap into generated rules sourceMap for provenance lookup
only; it does not merge metadata cards into executable card definitions.

Checked-in artifact SHA-256 values:

| Artifact | SHA-256 |
| --- | --- |
| `data/authoring/metadata/servant.albion.json` | `6D6BA37259013FA79B0433C45F494513CDB07178336875116B8FA52A9078E4DC` |
| `data/generated/fd-playtest-v1.content-library.json` | `B5527D19AEB8AFFF6812ACE8AD19EDC29F7CF74FD7ECEEAEFDAF1A498B1919D4` |
| `data/generated/fd-playtest-v1.evidence-report.json` | `5AAE65CE42DCBB393E307F50586E2C7BF53137C82B0C758D4953610527CE898A` |
| `data/packs/fd-playtest-v1/pack.json` | `A99F36106BEBC187826D3E5151E6B28D5C55A39A41BE213685E21405AAA60D7E` |

The generated library contains three Albion metadata sourceMap entries and
no Albion keys in executable `rules.cards`; the generated evidence report
contains one metadata archive summary with the same three IDs.

## Verification

- `npm run typecheck` — PASS
- `npm run content:validate` — PASS (`8 masters, 8 servants, 20 events, 0 blocking issues`)
- `npm run verify:generated-content` — PASS
- `npx vitest run packages/content/src/__tests__/albion-metadata-only.test.ts packages/content/src/__tests__/playtest-pack-loader.test.ts` — PASS (`25/25`)
- `npx vitest run scripts/tests/phase3-full-roster-inventory.test.ts scripts/tests/phase3-full-roster-semantics.test.ts scripts/tests/phase3-full-roster-capabilities.test.ts` — PASS (`26/26`)
- `git diff --check` — PASS

## Review boundary

No PR has been created and no push has been performed yet. The Candidate is
ready for independent GPT-6 Sol review of the metadata-only boundary. A
future reviewer must confirm that metadata registration is not treated as
runtime migration credit and that the accepted FORMAL review commit remains
the authority for this narrow scope.
