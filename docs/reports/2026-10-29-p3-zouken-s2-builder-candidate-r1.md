# P3 Zouken s2 Builder Candidate r1

## Scope

- Base pure-code Candidate: `19ce83f071aac8e91c835f8c21be1e3f3516428c`
- Scope: `master.zouken.skill.s2` (`五百年的活尸`) only; no A-sync, credit, merge, or acceptance claim.
- Canonical source: `Fate_Domination-开发版/data_masters.js`, `line=19#record=m_zouken.s2`.
- Canonical printed text: `你是大圣杯的【创造者】并怀揣【五百年的执念】。`
- Canonical text SHA-256: `8b8f4b24424a8600807fd42c0965fad94bd6f9dcdc9917efe10f1bff8b17f3e3`.

## Implementation

- Added s2 authoring/evidence and generated content records.
- Added an explicit atomic game-start provisioning marker to the existing shape-based provisioning primitive. The s2 source must provision exactly two canonical next skills in owner archive order (`s3` then `s4`); the targets are deferred from initial placement and generated in one transactional resolution.
- Added preflight rejection for wrong source/owner, target order, missing/inert/foreign/duplicate/partial targets, non-game-start envelopes, and forged provenance before event/revision mutation.
- Added serialized-runtime provenance validation requiring generated target card metadata and exactly matching `card_created` evidence for every provisioned target.
- Added real seven-player MatchSession, replay/idempotence, serialize/restore, and forged envelope regression coverage.

## Verification

Passing commands:

- `npm exec -- vitest run packages/rules/tests/regression/p3-zouken-s2-undead-provisioning.test.ts packages/rules/tests/regression/fb2-game-start-skill-provisioning.test.ts` — 21/21.
- `npm exec -- vitest run packages/rules/tests/regression/p3-zouken-s1-mana-bootstrap.test.ts packages/rules/tests/regression/p3-zouken-s3-creator.test.ts packages/rules/tests/regression/p3-zouken-s4-pseudo-vampire.test.ts packages/rules/tests/match-session.test.ts` — 48/48.
- `npm run typecheck`.
- `npm run content:validate` — 14 masters, 7 servants, 20 events, 0 blocking issues.
- `npm run verify:generated-content` — deterministic hashes: content library `e462a9e0f2096a7378b020e213e4aca3a77447753c17b5457f6a98e48a9003d9`, fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`, evidence `b5221adc8b37c5eaa12228bfc7508100f715ad28447676ca51c5b178fa5bb452`.
- `git diff --check`.

The broader pre-existing content display/authoring suite still reports unrelated baseline assertions about the existing master inventory/image paths; those assertions were not changed as part of this Candidate.

## Candidate

- Candidate commit: reported in the Builder handoff; this line intentionally avoids a self-referential hash.
- Parent: `19ce83f071aac8e91c835f8c21be1e3f3516428c`
- Worktree: `E:\Codex\FD\zouken-s2-builder-19ce83f`
- Branch: `codex/b-p3-zouken-s2-builder-r1`
