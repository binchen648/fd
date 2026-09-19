# P3-A R63 / FB2-29 Event Static Battle Metadata Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-19

## Accepted review input

- Fresh reviewer verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- Exact A dispatch Base: `19170290ff851527f69cc2a01d2d26eccde1820c`
- R62 rejected Candidate: `6a603ca0f5dfd1e702fc9e8c269534b05e919f77`
- Accepted Revision Candidate: `cd1b55e7143541605cc786745fafe053c5addf5a`
- PR: `#371` (`P3-FB2-29: compile event static battle metadata`)
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

R63 reports no blocking finding and independently closes R62's exact-type fail-closed blocker. Both content-loader and executable-compiler boundaries now reject non-string `attribute` / `condition` values, including single-element arrays and additional number/boolean/object/null/nested-array probes, without coercing malformed data into canonical enum values.

## A synchronization checks

A records the accepted capability only. The accepted Candidate is a direct child of the exact A dispatch Base. PR #371 remains open, non-draft, unmerged and unretargeted with exact base/head lineage. Locked Reference remains exact and clean.

Mechanical frozen accounting remains:

- denominator: `944 = 943 static + 1 dynamic`;
- authoring archives: `111`;
- authoring cards: `150`;
- unique authoring cards: `150`;
- frozen overlap: `127/944`;
- remaining: `817`;
- duplicate frozen IDs: `0`.

FB2-29 is generic infrastructure and earns zero frozen migration credit.

## Accepted capability envelope

The accepted FB2-29 extension adds one narrow rules-only event static battle-metadata authoring/compiler contract:

- optional nonempty `cardFace.battleModifiers` on an exact `event_rule_definition_archive` event card;
- each entry contains exactly `attribute`, `condition`, and `value`;
- canonical attributes: `strength | agility | magecraft | special | noble_phantasm`;
- generic conditions: `has_attribute | lacks_attribute | has_repeated_attribute`;
- `value` is a nonzero safe integer;
- `attribute` and `condition` must be actual scalar strings at both loader and compiler boundaries; no `String(...)` coercion;
- canonical attributes compile to existing runtime tags `力量 | 敏捷 | 魔术 | 特殊 | 宝具`;
- compiler derives authoritative modifier `sourceId` from the event definition ID;
- compiled modifiers enter the existing `eventCatalog.battleModifiers` surface and are consumed by accepted FB2-28 placement/combat/lifecycle behavior;
- no identity/name/printed-text/F1/Reference-handler runtime routing and no downstream consumer migration.

R62's coercion defect is not accepted history. Only Revision Candidate `cd1b55e...` is accepted by this synchronization.

## Fresh R63 validation accepted by A

R63 independently reports:

- R62 single-element-array reproductions rejected at both boundaries;
- extended non-string exact-type matrix rejected at both boundaries;
- valid five-attribute / three-condition path PASS;
- original malformed metadata matrix PASS;
- product/routing isolation PASS;
- frozen accounting PASS at `127/944`, zero additions/removals/duplicates;
- fresh dependency install and typecheck PASS;
- focused `3 files / 176 tests PASS`;
- rules `82 / 489 PASS`;
- official CI `142 / 1016 PASS`;
- eleven-round MatchSession about `2090 ms / 5000 ms`;
- content validate/compile `7 masters / 7 servants / 20 events / 0 blockers`;
- determinism, locked Reference, client build, coverage/audit, `git diff --check`, and final cleanliness PASS.

## Formal accounting after synchronization

Formal recovery-line accepted overlap remains **`127/944`**, with **`817`** remaining. Integrated `origin/main` accounting remains separate. Historical P3-FM09 remains `MIGRATION_BLOCKED`.

## Next coordinator action

Re-dispatch the exact previously blocked homogeneous four-card Lostbelt objective event-definition family (`master.kadoc.skill.s3`, `master.ophelia.skill.s5`, `master.ophelia.skill.s6`, `master.ophelia.skill.s7`) to fresh S. FB2-29 closes the only blocker found by the prior S preflight; the migration itself still requires a separate S Candidate, fresh independent review, and later A acceptance synchronization before any frozen credit is formal.
