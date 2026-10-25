# P3-R FM09 dependency materialization review

Verdict: `MIGRATION_ACCEPTED` for the dependency materialization only. This grants no FM09 authoring acceptance, migration credit, A-sync, or merge.

## Exact lineage and scope

- Exact Base: `1afe10ff9c1c1a65a0c2b68c56c5607cb0c1c447`.
- Runtime/test/generated Candidate: `1a1c7afd1a5fe152f9913846336d957c7d615455`.
- Reviewed branch tip: `d1494a8ba371d30f5461fa39dea8b78c8018b7aa` on `codex/a-p3-fm09-dependency-materialization-20261026`. The two following commits edit only the author report; the last removes Markdown trailing spaces and corrects its CI result.
- Historical accepted sources: FB2-15 `23a666913a3050ad55d781e3f5b3a1518add4c3e`, FB2-16 `bc45b2032ec344d2c743d8b32e3a3d05aa8b67ca`, FB2-23 `1cfd6000f5627a282e2549d23e5a176ba983384f`.

The Base-to-Candidate code diff contains only the three dependency runtime families, their compiler/loader/types integration, corresponding tests, and the FB2-16 generated content update. The FB2-15 and FB2-16 helper files and all three new regression files have identical Git blob IDs to their historical accepted sources. The generated content patch is byte-for-byte the historical FB2-16 patch: only Maiya Support Shot becomes `attack / attack_area` and the two executable definition-hash fields change from `37551fd5...` to `55e53412...`. The generated fixture and evidence report do not change. No FM09 authoring, coverage/task-index/governance, identity routing, or unrelated runtime appears in the diff.

The merged interpreter, compiler, loader, interaction gateway, and types changes retain the accepted structural contracts: validated same-owner game-start skill deferral and idempotent provisioning; identity-free required-additional classification with regular-batch, staged-play, effect-play, and attack-quota separation; and server-owned same-battlefield private-hand selection with owner-only projection, revision and snapshot validation, optional return, and owner-deck shuffle. These integrations do not widen the historical accepted envelopes.

## Independent verification

| Check | Result |
| --- | --- |
| FB2-15/16/23 plus compiler focused run | 4 files, 65/65 tests passed |
| FM06/FM07/FM08 authoring compatibility | 3 files, 13/13 tests passed |
| Full `npm run test:ci` on the reviewed tip | 123 files, 774/774 tests passed on repeat |
| Full `npm run test:ci -- --maxWorkers=2` | 123 files, 774/774 tests passed |
| `match-session.test.ts` isolated | 26/26 tests passed |
| `npm run typecheck` | passed |
| `npm run content:validate` | 7 masters, 7 servants, 20 events, 0 blocking issues |
| `npm run verify:generated-content` | passed; content-library SHA-256 `552d78de1816ce1278effdaae5ac925e41e4273353ed6a25dab54343b9d8b869` |
| `git diff --check` from Exact Base to reviewed tip | passed |

The full CI suite includes FM05, FB2-14/13/12/11/02, and B23 compatibility regressions; FM06/FM07/FM08 authoring tests are excluded by `test:ci` and were run separately. The golden-card compiled-content pipeline passed 2/2 in the full suite. Its earlier definition-hash mismatch was a transient run before the generated content refresh; the checked-in artifact and fresh compiler now agree, so no golden assertion or runtime repair is needed.

One default-concurrency CI attempt on the reviewed tip timed out in the existing 5-second eleven-round `match-session` test (122/123 files, 773/774 tests); that same test passed isolated in 1.85 seconds, passed in the two-worker full suite, and a repeat of the unmodified default command passed 774/774. This is the previously observed concurrency-sensitive timeout, not a deterministic FM09 dependency failure.

The original code Candidate's author report had four Markdown trailing-space findings under `git diff --check`. The reviewed branch tip removes them without changing runtime, tests, or generated content. The final Base-to-tip diff check is clean.
