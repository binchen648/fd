# P3-A Amakusa S1 metadata-only acceptance synchronization and accounting

Date: 2026-10-22
Repository: [binchen648/fd](https://github.com/binchen648/fd)
Status: `SYNCHRONIZED — S1 METADATA-ONLY; ZERO MIGRATION CREDIT`

## Exact transaction input

- Owner: `servant.amakusa` / 天草四郎时贞
- Accepted scope: exactly `servant.amakusa.skill.sc-amakusa-1` (`sc_amakusa_1`), metadata-only
- Candidate PR: [#672](https://github.com/binchen648/fd/pull/672)
- Candidate branch: `codex/amakusa-s1-candidate`
- Exact Candidate head: `58f902d7585a1f0592c6d740fd94549bb403cf36`
- Exact Base: `0e0e0977caf96b179912250bcd486dccadfbff14`
- FORMAL/A decision: `8a93e10223bd0ed16b04b7fb8b46ab27cfaee08d`
- Independent contract review: `053bcb8537d1861cd5c81721c4760529ca87f145`, `CONTRACT_ACCEPTED_FOR_METADATA_ONLY`
- Independent Reviewer report commit: `7a5c82c4621e7b41a53361cd61d04cd86d153343`
- Independent Reviewer report: `E:\\Codex\\FD\\amakusa-s1-review\\docs\\reports\\2026-10-22-p3-r-amakusa-s1-metadata-only-migration-review.md`
- Independent Reviewer verdict: `MIGRATION_ACCEPTED`, strictly for the S1 metadata-only boundary
- A-sync branch: `codex/a-p3-amakusa-s1-acceptance-sync`

This A-sync records the independent acceptance evidence for the exact
Candidate above. It does not modify Candidate PR #672 or its branch, source
or runtime code, frozen inventory, generated executable artifacts, tests,
assets, or playable content. It does not merge or retarget any PR.

## Accepted boundary: S1 metadata only

The synchronized record is limited to the source-bound printed identity and
metadata for `servant.amakusa.skill.sc-amakusa-1`:

- Legacy ID: `sc_amakusa_1`
- Printed name: `双腕·零次集束`
- Clause SHA-256: `40ca176f770bc55f453580c51729752eebcab51af6377ac7ca893764bb7027af`
- Source packet: `b2f9fa15fba07c63530bbf4612b03b8b704755f9:src/content/authoring/cards.json`
- S1 source-file SHA-256: `bdaf76fc082d2c9152918dcda2a8700aa155c4b65cb596c7e9b28be8f264b803`

S1 remains `metadataOnly: true`, `automaticExecution: false`, and
`HOST_ADJUDICATED`. No event-deck, card-zone, power, reveal, usage-limit,
lifecycle, restore, replay, handler, interpreter, activation, target, effect,
or rule-modifier semantics are accepted or installed by this synchronization.
The metadata record is provenance-only and is not an executable card or a
playable-servant registration.

## Retained S2/S3 blocks and owner status

The owner remains **`BLOCKED`** and is not owner-complete. S2 and S3 are
retained only as non-executable frozen metadata, each explicitly carrying all
of the following boundaries:

- `SOURCE_EVIDENCE_REQUIRED`
- `SEMANTIC_SOURCE_REQUIRED`
- `EXPLICIT_BLOCK`

No S2/S3 source evidence, semantic contract, capability, handler, combat or
card-zone behavior, command-seal behavior, usage-limit behavior, lifecycle,
visibility, restore, or replay semantics are inherited from S1. No S2/S3
runtime or playable acceptance is implied.

## Provenance mismatch retained

The frozen inventory remains untouched at SHA-256
`FF0424802F9989FB134C336A87CFDAC0961E44250B01D1B6968D562006662BC4`.
Its `provenance.inputDigests` value for
`src/content/authoring/cards.json` is
`5a38c668211b196a74e65dffba096b8ba650b495f90d5f11d733e98aecad1211`, while
the independently computed historical raw Git-file SHA-256 is
`bdaf76fc082d2c9152918dcda2a8700aa155c4b65cb596c7e9b28be8f264b803`.
The Candidate and this A-sync preserve both values as
`MISMATCH_RETAINED`; this transaction does not resolve, normalize, or rewrite
the frozen provenance discrepancy.

## Independent evidence synchronized

The fresh independent Reviewer verified the exact repository, PR, Base,
Candidate head, and lineage, then reported:

- `npm ci --ignore-scripts --no-audit --no-fund`: PASS;
- `npm run typecheck`: PASS;
- `npm run content:validate` and `npm run content:compile`: PASS;
- `npm run verify:generated-content`: PASS;
- five focused Vitest suites: **17/17 PASS**;
- `npm run verify:playtest-v1`: PASS;
- exact Base-to-Candidate `git diff --check`: PASS.

The Reviewer also independently confirmed that generated output contains only
non-executable Amakusa provenance metadata: no Amakusa `rules.cards`, no
playable roster entry, and no executable or runtime mutation. The pack adds
Amakusa only through `metadataArchiveFiles`; runtime source and frozen
inventory are unchanged.

## Formal accounting

This is a governance/documentation synchronization of an S1 metadata-only
acceptance, not a runtime migration acceptance or frozen-inventory promotion.
Metadata registration and provenance preservation do not create migration
credit.

- Runtime/frozen migration credit delta: **`0`**.
- Accepted migration frontier: **unchanged** by this transaction.
- No owner-complete, executable, playable, runtime, helper, shared-fixture,
  or metadata credit is added.
- Amakusa remains **blocked**, non-executable, and non-playable.

The Reviewer `MIGRATION_ACCEPTED` verdict is therefore accepted only for the
exact S1 metadata-only Candidate at `58f902d…`; it must not be read as
acceptance of S1 runtime semantics, S2/S3 clearance, owner completion,
playable promotion, or authorization to merge.

## Next legal gate

Future work may reference this exact A-sync commit for S1 metadata provenance
only. S2 and S3 require independent source evidence and semantic contracts
before any stronger decision. Any runtime or playable claim requires a new
exact Candidate, independent review, and a new A-sync/accounting transaction;
no credit may be added without that evidence.
