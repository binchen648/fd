# Altera S3 scoped Candidate

- Date: 2026-10-22
- Target repository: `https://github.com/binchen648/fd`
- Exact base: `e1f995bba356433519b6c823cbeffe53d48cffb0`
- FORMAL decision commit: `f312db011c5dab4d603c35ce99d92bef42ff53f1`
- Independent GPT-6 Sol review commit: `35c9c275294ef2a3730dcbf48957a785416c5033`
- Candidate branch: `codex/p3-altera-s3-candidate`
- Owner: `servant.altera` / 阿蒂拉
- Owner status: **BLOCKED; not owner-complete**

## Scope delivered

This Candidate adds a separately loaded, metadata-only scoped archive for the
three Altera S3 identity-free shapes already accepted by the FORMAL decision
and independent review:

1. B18/R12: `after_battle_result_determined` optional controller response
   for the highest-cost Noble Phantasm played this round, typed VP `+1`.
2. B19/R13: the independent sibling response with the same condition plus
   highest-cost Noble Phantasm cost `>=4`, typed VP `+1`.
3. FB2-10/R29: active combat action setting engaged opponent Magic attack
   `attack.currentPower` to `0` on the same battlefield for `this_round`.

The metadata archive preserves the exact three-line S3 text, all three clause
SHA-256 values, the frozen inventory digest, F1 source commit
`59f145434695d29bdd17e4cb3adc887e84182377`, and locked static/reference
metadata commit `b2f9fa15fba07c63530bbf4612b03b8b704755f9`. The existing
`data/authoring/servants/servant.altera.json` and FM03 runtime contract remain
unchanged; no Altera-specific handler or guessed semantics were added.

S1 and S2 remain explicitly `SOURCE_EVIDENCE_REQUIRED`,
`SEMANTIC_SOURCE_REQUIRED`, and `EXPLICIT_BLOCK`. The owner remains blocked;
the metadata archive sets `automaticExecution: false` for all three records,
and Altera is not added to the playable roster, executable archives, or pack
servant registration.

## Evidence and generated surfaces

The pack manifest registers `servant.altera` only under
`metadataArchiveFiles` and records the independent review commit and the
three accepted S3 clause hashes. Generated library and evidence surfaces now
contain the Altera metadata source map/evidence while executable
`rules.cards` remains free of Altera entries.

| Artifact | SHA-256 |
| --- | --- |
| `data/authoring/metadata/servant.altera.json` | `E759D189E015B6283367E54CD5093A9C15DB98C997BA8681E009BA648344239C` |
| `data/generated/fd-playtest-v1.content-library.json` | `96DE621A269F521E5B942CEE1B59C8F7905807116B5DE06BD7C629C7F63C24CC` |
| `data/generated/fd-playtest-v1.evidence-report.json` | `8603C3583E499E17281F1186E42A1034F2ECAF21CAA82439BE554E645DCCA5B9` |
| `data/packs/fd-playtest-v1/pack.json` | `D6EE7C8E94A2CF62464A9C2228BD04D75533E830B48F98A02AACB26F1F0A4AEA` |

## Verification

- `npm run typecheck` — PASS
- `npm run content:validate` — PASS (`8 masters, 8 servants, 20 events, 0 blocking issues`)
- `npm run verify:generated-content` — PASS
- Focused metadata, Albion compatibility, FM03 authoring, B18, B19, and
  FB2-10 tests — PASS (`29/29`)
- `git diff --check` — PASS

No frozen inventory was rewritten, no playable roster was expanded, and no PR
was merged by this Candidate.
