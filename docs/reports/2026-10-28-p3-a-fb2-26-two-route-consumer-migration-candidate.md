# P3-A FB2-26 Two-Route Consumer Migration Candidate

Date: 2026-10-28 (Asia/Hong_Kong)
Role: Builder
Status: `MIGRATION_COMPLETE_CANDIDATE`

Exact Base: `a4a4d24ca666c7b727f7e37e761a13f7887e5803`
Dispatch authorization: `E:\Codex\FD\fb2-26-dispatch-authorization\2026-10-28-p3-a-fb2-26-two-route-dispatch.md`
Route evidence: `E:\Codex\FD\fb2-26-route-review-evidence\review.md`

## Exact migration set

Exactly these two authorized F1 identities were attached to their existing
current canonical cards. They remain separate contracts; no other identity was
included.

1. `master.irisviel.skill.s2` → `master.irisviel.skill.conversion-magic` /
   `conversion-magic.preparation` under `P3-TO-09/CARD_ZONE_CORE_DIRECT_ACTION`.
2. `master.kiritsugu.skill.s2` → `master.kiritsugu.skill.time-alter` /
   `time-alter.action` under `P3-TO-10/CARD_ACTION_SEMANTICS_MINIMAL_PLAY`.

The canonical card IDs, ability IDs, effects, and route boundaries are
unchanged. The F1 text receipts are preserved as SHA-256 metadata:

- Irisviel: `75fa71628bf0f1ce128eb156a6b7bd1d3e49bf1e155e3e11978d342190548304`.
- Kiritsugu: `37250362ba119e621015b05c59c6694b319f15900647522fb8c5400ea8290df0`.

Current authoring/product clauses retain their explicit timing prefixes
(`前哨阶段：` and `行动阶段：`). The candidate records this as semantic
normalization and explicitly does not claim byte/hash identity with F1.

## Files and accounting delta against Base

Added:

- `packages/rules/tests/fb2-26-two-route-consumer-migration.test.ts` — focused
  exact-two identity, hash, normalization, classifier, and duplicate guard.
- `docs/reports/2026-10-28-p3-a-fb2-26-two-route-consumer-migration-candidate.md`
  — this candidate receipt.

Modified:

- `data/authoring/masters/master.irisviel.json` — `s2` alias/legacy mapping,
  explicit owner mapping, F1 receipt, route contract, and prefix normalization.
- `data/authoring/masters/master.kiritsugu.json` — same bounded metadata for
  the authorized `s2` route.

Generated artifacts were regenerated with `npm run content:compile`; the
checked-in `data/generated/fd-playtest-v1.content-library.json`, fixture, and
evidence report were byte-identical and therefore have no diff.

Canonical identity delta: `+0 / -0 / duplicate 0`.
F1 accounting delta: exactly `+2` authorized IDs, no removals and no
duplicates. Formal accounting remains `154/944 FULL` until independent review
and A synchronization.

## Validation

- Focused route and candidate suites: **10 passed**.
- `npm run typecheck`: **passed**.
- `npm run test:ci`: **126 files / 806 tests passed**.
- `npm run content:validate`: **passed** (13 masters, 7 servants, 20 events,
  0 blocking issues).
- `npm run verify:generated-content`: **passed**; deterministic hashes:
  `f7644a34d410d79d0e62b30a996ec0e829d3e4442d069529d8f3acdf1811394a`,
  `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`,
  `2d17e10d560d0a0fda231a5d169ee9c1fd706f47599efc296348773318d79bd4`.
- `npm run verify:playtest-v1`: **passed** (0 private-view leaks).
- `git diff --check`: **passed**.

The full `npm test -- --run` command is not clean on this exact Base because
the checkout lacks the pre-existing CHM/source assets and contains baseline
expectations for a seven-master fixture while the Base pack compiles 13
masters. It reported 23 unrelated failures; the focused route tests and full
CI suite above pass.

## Source evidence caveat

The immutable legacy JSON blob is not present in the Base. This candidate uses
the frozen F1 identity/hash receipt and the independently accepted route
review, without inventing a blob or a new provenance hash. If the next gate
requires direct immutable-blob inspection, the missing blob/source commit must
be supplied before acceptance.

This is a Builder candidate only. It does not merge, claim credit, alter the
formal count, or declare `MIGRATION_ACCEPTED`.
