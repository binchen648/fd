# P3-A Altera S3 scoped metadata acceptance synchronization and accounting

Date: 2026-10-22
Repository: [binchen648/fd](https://github.com/binchen648/fd)
Status: `SYNCHRONIZED — S3 SCOPED METADATA-ONLY; ZERO MIGRATION CREDIT`

## Exact transaction input

- Owner: `servant.altera` / 阿蒂拉
- Frozen owner scope: exactly `sc-altera-1`, `sc-altera-2`, and `sc-altera-3`
- Candidate PR: [#670](https://github.com/binchen648/fd/pull/670)
- Candidate branch: `codex/p3-altera-s3-candidate`
- Exact Candidate head: `f5837212b9df2ba3cac47d137c496db6e7e115ad`
- Exact Base: `e1f995bba356433519b6c823cbeffe53d48cffb0`
- FORMAL decision commit: `f312db011c5dab4d603c35ce99d92bef42ff53f1`
- Independent contract review: `35c9c275294ef2a3730dcbf48957a785416c5033` (`CONTRACT_ACCEPTED_FOR_SCOPED_SUBSET`)
- Independent Reviewer report commit: `30362c788502444aa8599ad24609afbc8b7908d3`
- Independent Reviewer report: `E:\Codex\FD\altera-s3-review\docs\reports\2026-10-22-p3-r-altera-s3-scoped-candidate-review.md`
- Independent Reviewer verdict: `MIGRATION_ACCEPTED`, strictly for this S3-scoped metadata boundary
- A-sync branch: `codex/a-p3-altera-s3-acceptance-sync`

This A-sync synchronizes the independent acceptance evidence for the exact
Candidate above. It does not modify Candidate PR #670 or its branch, source or
runtime code, authoring semantics, frozen inventory, generated executable
artifacts, tests, or assets. It does not merge or retarget any PR.

## Accepted boundary: only three existing FM03 identity-free shapes

The accepted Altera scope is only the three already-existing, independently
reviewed FM03 identity-free shapes carried by S3 (`servant.altera.skill.sc-altera-3`):

1. **B18/R12 — `noble-bloom`:** an independent
   `after_battle_result_determined` response when the controller played the
   highest-cost Noble Phantasm in that battle this round, granting typed
   controller victory points `+1`.
2. **B19/R13 — `noble-bloom-extra-vp`:** an independent response with the same
   highest-cost Noble Phantasm condition plus
   `highest_cost_noble_phantasm_cost_at_least(4)`, granting typed controller
   victory points `+1`.
3. **FB2-10/R29 — `magic-resistance`:** an active-source combat action in the
   controller's combat-action window, setting `attack.currentPower` to `0` for
   engaged opponent-controlled attacks on the same battlefield with attribute
   `魔术`, for `this_round`.

These are narrow structural contracts, not a general Altera capability grant.
No other trigger, target, modifier, power, lifecycle, card-zone, event-deck,
resource, ordering, replay, or restore behavior is synchronized. No handler
name, historical route, unversioned script, image, or engine default is
promoted to source authority.

## Frozen scope and retained blocks

The frozen inventory remains
`data/phase3/full-roster-ability-inventory.json`, SHA-256
`FF0424802F9989FB134C336A87CFDAC0961E44250B01D1B6968D562006662BC4`.
The Candidate and Reviewer preserve the exact Altera identities, legacy IDs,
printed text, source-text hashes, and provenance for all three frozen rows.
The Candidate does not rewrite the frozen inventory.

S1 (`servant.altera.skill.sc-altera-1`) and S2
(`servant.altera.skill.sc-altera-2`) remain
`SOURCE_EVIDENCE_REQUIRED`, `SEMANTIC_SOURCE_REQUIRED`, and
`EXPLICIT_BLOCK`. Their trigger, card-zone, event-deck, resource, modifier,
power, timing/order, lifecycle, source-binding, replay, and restore semantics
are not accepted and no capability is inherited from S3.

S3 (`servant.altera.skill.sc-altera-3`) is only `PARTIAL_SOURCE_BOUND` with
`CONTRACT_MAPPED` for the three shapes listed above and remains blocked by
`OWNER_BLOCKED_S1_S2`. Its metadata record sets `automaticExecution: false`.
The owner status remains `BLOCKED`.

## Metadata-only and non-playable result

The Candidate registers Altera only through `metadataArchiveFiles` and scoped
contract provenance. It does not add Altera to `authoringServantFiles`, the
playable servant roster, or generated executable `rules.cards`/
`rules.archives`. Generated metadata/source-map/evidence records are
provenance-only; they install no handler, trigger, target, modifier, card-zone
mutation, or other runtime behavior. Accordingly:

- Altera is **not executable**.
- Altera is **not playable** and is not in the playable roster.
- S1/S2 remain blocked; the owner is not owner-complete.
- No runtime or frozen-inventory promotion is implied by this A-sync.

## Independent evidence synchronized

The fresh independent Reviewer checked the exact Candidate/Base lineage and
reported:

- `npm run typecheck`: PASS;
- `npm run content:validate`: PASS (`8 masters, 8 servants, 20 events, 0 blocking issues`);
- `npm run verify:generated-content`: PASS;
- focused Altera/Albion metadata, FM03 authoring, B18, B19, and FB2-10
  regressions: **29/29 PASS** across six files;
- independent parsed-data, identity/text/hash, route, and non-execution checks:
  PASS;
- `git diff --check` for the exact Candidate lineage: PASS.

The synchronized evidence is therefore bounded to the Candidate's metadata
record and the existing three FM03 identity-free S3 contracts. It is not
evidence for S1/S2 execution, owner completion, playable registration, or a
broader Altera migration.

## Formal accounting

This is a governance/documentation synchronization of a scoped metadata
acceptance, not a runtime migration acceptance and not a frozen-inventory
promotion. Metadata registration and preservation of previously accepted FM03
shapes do not create migration credit.

- Runtime/frozen migration credit delta: **`0`**.
- Accepted migration frontier: **unchanged** by this transaction.
- No owner-complete, playable, runtime, helper, shared-fixture, or metadata
  credit is added.
- S1/S2 remain blocked, and Altera remains non-executable/non-playable.

The Reviewer `MIGRATION_ACCEPTED` verdict is consequently accepted only for
the exact S3-scoped metadata Candidate at `f5837212...`; it must not be read as
owner-complete acceptance, S1/S2 clearance, playable/executable promotion, or
authorization to merge.

## Next legal gate

Future work may reference this exact A-sync commit for the three S3 FM03
identity-free contracts and their metadata provenance only. S1 and S2 require
source-aligned evidence and separately reviewed semantic contracts. Any
stronger Altera decision requires a new exact Candidate, independent review,
and a new A-sync/accounting transaction; no credit may be added without that
evidence.
