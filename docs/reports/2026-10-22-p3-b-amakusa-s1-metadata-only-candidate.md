# Amakusa S1 metadata-only Candidate

- Date: 2026-10-22
- Target repository: `https://github.com/binchen648/fd`
- Exact base: `0e0e0977caf96b179912250bcd486dccadfbff14`
  (`codex/a-p3-altera-s3-acceptance-sync`, PR #671 lineage)
- FORMAL/A decision: `8a93e10223bd0ed16b04b7fb8b46ab27cfaee08d`
- Independent GPT-6 Sol review: `053bcb8537d1861cd5c81721c4760529ca87f145`
- Candidate branch: `codex/amakusa-s1-candidate`
- Owner: `servant.amakusa` / 天草四郎时贞
- Owner status: **BLOCKED; not owner-complete**

This Candidate adds only a separately loaded metadata archive. It does not add
an Amakusa executable card, runtime handler, playable servant, frozen
inventory change, or migration credit. S2 and S3 remain explicitly
`SOURCE_EVIDENCE_REQUIRED` / `SEMANTIC_SOURCE_REQUIRED` /
`EXPLICIT_BLOCK`.

## S1 metadata-only boundary

The archive records the exact frozen identity and text:

- Canonical ID: `servant.amakusa.skill.sc-amakusa-1`
- Legacy ID: `sc_amakusa_1`
- Printed name: `双腕·零次集束`
- Printed text: `【真名解放】<每局游戏限一次>X=以此牌效果移除的事件牌的印刷战果数总和的2倍。\n打出时：将所有正面向上的事件牌移除游戏。`
- Frozen clause SHA-256: `40ca176f770bc55f453580c51729752eebcab51af6377ac7ca893764bb7027af`
- Source commit/path: `b2f9fa15fba07c63530bbf4612b03b8b704755f9:src/content/authoring/cards.json`
- Historical raw source-file SHA-256:
  `bdaf76fc082d2c9152918dcda2a8700aa155c4b65cb596c7e9b28be8f264b803`
- Reviewer-accepted commit: `053bcb8537d1861cd5c81721c4760529ca87f145`

The S1 record is explicitly `automaticExecution=false`, `metadataOnly=true`,
and `capabilityStatus=HOST_ADJUDICATED`. It contains no `abilities`,
`effects`, `targets`, `activation`, or `ruleModifiers` nodes and is excluded
from executable `rules.cards`.

## Provenance warning retained

The frozen inventory remains untouched at SHA-256
`FF0424802F9989FB134C336A87CFDAC0961E44250B01D1B6968D562006662BC4`. Its
`provenance.inputDigests` value for `src/content/authoring/cards.json` is
`5a38c668211b196a74e65dffba096b8ba650b495f90d5f11d733e98aecad1211`, which
differs from the historical raw source-file SHA above. The Candidate records
this as `MISMATCH_RETAINED`; it does not resolve, normalize, or rewrite the
frozen provenance discrepancy.

## S2/S3 retained blocks

The archive carries S2 and S3 only as non-executable blocked metadata, with
their frozen IDs and clause hashes:

| Skill | Status | Clause SHA-256 |
| --- | --- | --- |
| `servant.amakusa.skill.sc-amakusa-2` / `sc_amakusa_2` | `SOURCE_EVIDENCE_REQUIRED` + `SEMANTIC_SOURCE_REQUIRED` + `EXPLICIT_BLOCK` | `411ddb188143b434b3ec6c53fd24d4602ea09064430cd8443355dfa53e4a66f5` |
| `servant.amakusa.skill.sc-amakusa-3` / `sc_amakusa_3` | `SOURCE_EVIDENCE_REQUIRED` + `SEMANTIC_SOURCE_REQUIRED` + `EXPLICIT_BLOCK` | `8340a2b1e14bdf601bebf9f0a5a1dbb67c326c0bafbc596d689110ea3cc51137` |

No S2/S3 semantics, handler, capability, or runtime route is inherited from
the S1 metadata record.

## Evidence artifacts

| Artifact | SHA-256 |
| --- | --- |
| `data/authoring/metadata/servant.amakusa.json` | `2290105BFC00FD3B43D334BDD5F73C24FF9D16A7D329B489B601EABCCF4C78AF` |
| `data/packs/fd-playtest-v1/pack.json` | `D6D2E37CC5EF566C506FDC7E45DB859F3150516747281885A22FDD1255CA853D` |
| `data/generated/fd-playtest-v1.content-library.json` | `03A0ED9086496B7E211485D2C87525219CE8B53889A538651F6B97CFAFA15287` |
| `data/generated/fd-playtest-v1.evidence-report.json` | `22465F34598A7FD2BD9D2D50EE62E50DDEDAA6802D6FC052FC521AD384FC2498` |

The pack registers `servant.amakusa` only under `metadataArchiveFiles`.
Generated metadata contains the archive and source map; executable cards and
playable servant roster contain no Amakusa IDs.

## Verification

- `npm install --ignore-scripts --no-audit --no-fund` — PASS.
- `npx vitest run packages/content/src/__tests__/amakusa-s1-metadata-only.test.ts` — PASS, 4/4.
- `npm run content:validate` — PASS (`8 masters, 8 servants, 20 events, 0 blocking issues`).
- `npm run content:compile` — PASS; generated metadata/evidence regenerated.
- `git diff --check` — PASS.

No frozen inventory, runtime source, executable pack route, or owner-complete
accounting was changed. This Candidate is ready for the requested PR and must
remain unmerged pending normal review gates.
