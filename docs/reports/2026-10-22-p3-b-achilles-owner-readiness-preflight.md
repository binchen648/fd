# P3-B Achilles owner readiness preflight

- Date: 2026-10-22
- Lane: FORMAL Builder (GPT-5.6 Luna)
- Base: `5fb0147a9b89f0d181b872a95059f853dbed8eec` (`codex/a-p3-abigail-s1-acceptance-sync`)
- Worktree: `C:\Users\24429\.codex\worktrees\achilles-owner-complete`
- Owner: `servant.achilles` / 阿喀琉斯
- Decision: **BLOCKED — `SOURCE_EVIDENCE_REQUIRED` / `SEMANTIC_SOURCE_REQUIRED`; no Candidate implementation**

This is a read-only readiness preflight. The frozen inventory, semantic matrix,
capability catalog, and source archive were inspected mechanically from the
exact A-sync baseline. No frozen inventory, pack registration, runtime code, or
acceptance accounting was changed.

## Exact frozen scope

The owner-local scope is exactly three static skills:

| Exact identity | Name | Reference route | Frozen current route | Frozen decision |
| --- | --- | --- | --- | --- |
| `servant.achilles.skill.sc-achilles-1` | 勇者的不凋花 | `shared_handler` / `core.achilles-package` | `legacy` | `SOURCE_EVIDENCE_REQUIRED` |
| `servant.achilles.skill.sc-achilles-2` | 包围苍天的小世界 | `shared_handler` / `core.achilles-package` | `legacy` | `SOURCE_EVIDENCE_REQUIRED` |
| `servant.achilles.skill.sc-achilles-3` | 驰骋天际星之枪尖 | `shared_handler` / `core.achilles-package` | `legacy` | `SOURCE_EVIDENCE_REQUIRED` |

Frozen inventory input:
`data/phase3/full-roster-ability-inventory.json`, SHA-256
`FF0424802F9989FB134C336A87CFDAC0961E44250B01D1B6968D562006662BC4`, last
updated at `3329328762420000b8f6960c34b771b4e556ddf7`. The corresponding
semantic matrix and capability catalog were not edited.

All three entries mechanically report:

```text
semanticNormalization.status = BLOCKED
semanticNormalization.source = null
semanticNormalization.abilities = []
semanticNormalization.blocks = ["SEMANTIC_SOURCE_REQUIRED"]
phase3.classificationRoute = SOURCE_EVIDENCE_REQUIRED
phase3.mappingStatus = EXPLICIT_BLOCK
phase3.currentRoute = legacy
phase3.inheritedAcceptanceContracts = []
phase3.partialAcceptanceContracts = []
```

The `core.achilles-package` value is recorded only as an observed Reference
route. It is not an accepted target-runtime semantic contract.

## Source contract

`data/authoring/servants/servant.achilles.json` exists and is referenced by the
playtest pack. Its SHA-256 is
`0F781712C035CC4C8078DA74349C988751790D4B941EC53FD6CEF787359EFB7C`. It
contains the three exact card IDs, four-card CHM image order, printed clauses,
and the following source status for every card:

```text
printedTextStatus = reviewed_against_original_image
cardFaceStatus = reviewed_against_original_image
rulesMappingStatus = interpreter_slice_tested
implementationStatus = complete
failureMode = disabled_until_shared_mechanics_exist
```

This archive is useful source evidence but does not clear the frozen semantic
contract: its original evidence paths point to `D:/fd/chm-extract/...`, which
is not present in this clean checkout, and it has no accepted Phase-3 evidence
packet that binds the three cards into the frozen semantic inventory. The
repository's copied runtime assets exist under
`apps/client/public/assets/fd/real/chm-used/servants/servant-achilles/`, but
they do not make the missing original-image paths or semantic normalization
contract valid. The generated evidence report records all five Achilles source
image paths as unverified in this checkout.

Legacy clause hashes are discovery evidence only:

- S1: `a908c6e9...` and `9ccec6e2...`
- S2: `37e7aeaa...`, `72f4bc34...`, `4c22f403...`, `b6992b71...`
- S3: `c3cf7217...`

They cannot replace source-aligned authoring and an accepted semantic packet.

## Semantic and runtime contract check

The three cards require distinct shared mechanics that are not represented by
an accepted target route:

1. S1 needs an authoritative post-battle-loss trigger that reveals the servant
   package, plus a hidden-name combat action that randomly discards each
   engaged opponent and sets non-Luck/non-Agility opponents' power to zero.
2. S2 needs an action-phase three-way choice: random discard, a same-battlefield
   skill-card prohibition, or an atomic three-mana hide-name effect through
   round end.
3. S3 needs exact-one-opponent legality, current-battlefield enter/leave
   locking, and scoped terrain plus external servant/NPC effect immunity.

The target checkout has generic interpreter primitives and historical test
fixtures, but no accepted `core.achilles-package` implementation or owner
restore contract. The historical Achilles adapter checkpoint explicitly records
all four abilities as unsupported and says these shared mechanisms must be
implemented before formal entry. Copying the old Reference/legacy route would
violate the owner-complete contract.

## Restore contract check

Generic ability-runtime restore validation exists for pending decisions and
ongoing effects, but no Achilles-specific source-bound ledger/provenance,
lock/immunity cleanup, hidden-name lifecycle, random-discard settlement, or
post-battle trigger restore contract is accepted in the frozen matrix. With no
accepted owner route, there is no legal way to prove replay/restore safety for
all three skills. No restore implementation was added.

## Read-only verification evidence

- `npm test -- --run packages/rules/tests/achilles-authoring.test.ts`: executed
  after dependency installation; 5/6 tests passed. The one failure is the
  source-evidence assertion because the archive's external original-image path
  does not exist in this checkout. The loader/safety assertions still report
  the complex Achilles abilities as unsupported and keep them fail-closed.
- `npm run typecheck`: PASS (exit 0).
- `git diff --check`: PASS (exit 0).
- `git status --porcelain`: clean; dependency build output is ignored.

No Candidate commit, Candidate PR, A-sync, merge, inventory regeneration, or
migration credit was created.

## Required next legal action

1. FORMAL must obtain or accept a source-aligned Achilles evidence packet with
   verifiable original-image paths/hashes and explicit clause-to-semantic
   mappings; then regenerate the frozen inventory/audit under its governing
   authority.
2. FORMAL must define and accept target-runtime contracts for the loss trigger,
   multi-branch choice, skill prohibition, battlefield lock, terrain immunity,
   external-effect immunity, and their serialized cleanup/replay boundaries.
3. Only after all three frozen entries leave `SEMANTIC_SOURCE_REQUIRED` and
   the restore contract is accepted may a Builder implement the owner-complete
   Candidate with focused tests and full gates.
