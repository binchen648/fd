# Albion FORMAL minimum contract decision

- Date: 2026-10-22
- Decision lane: FORMAL Builder (GPT-5.6 Luna), prepared for independent GPT-6 Sol review
- Target repository: `https://github.com/binchen648/fd`
- Exact base: `19ac14d5c3c69e0dbbcb2da2fddb8319a7391f03`
- Prior readiness report: `cfd0e2cf686070eeda8995472b89c0b130908b8c`
- Owner: `servant.albion` / 阿尔比恩之骸
- Decision: **`METADATA_ONLY_ACCEPTED`; all unresolved mechanics remain `BLOCKED`; no runtime authorization**

This is a formal minimum contract decision, not runtime code and not a frozen
inventory migration. It accepts only canonical identity/printed-source
metadata plus an explicit `HOST_ADJUDICATED` capability boundary. It does not
promote the unversioned development script, Reference handler names, or legacy
behavior to source authority. It does not clear the owner for automatic
execution, Candidate credit, or PR acceptance.

## 1. Exact evidence boundary

Frozen inventory:
`data/phase3/full-roster-ability-inventory.json`, SHA-256
`FF0424802F9989FB134C336A87CFDAC0961E44250B01D1B6968D562006662BC4`.

The three frozen identities and clause hashes are:

| Canonical identity | Frozen status | Clause SHA-256 |
| --- | --- | --- |
| `servant.albion.skill.sc-albion-1` | `SOURCE_GROUNDED` / `CONTRACT_MAPPED`, current route `none` | `76ce5c6080e5fa7b1cd6642ff87133617f91a07a00020721f56df4366ceba1ab`; `679fed0d35a87156418c6a298693e00215da2b793ca03b03712f43c5b316915f` |
| `servant.albion.skill.sc-albion-2` | `SOURCE_GROUNDED` / `CONTRACT_MAPPED`, current route `none` | `7cf0bf703fad6229c071b8598c684111a5e16965050226fe1825e3451ba08258` |
| `servant.albion.skill.sc-albion-3` | `BLOCKED` / `SOURCE_EVIDENCE_REQUIRED`, `SEMANTIC_SOURCE_REQUIRED` | `4bd77425bde34cec725d4b43f8a1987b7cd0ecf74c5a175cf64a16d588e89677` |

The exact baseline has no `data/authoring/servants/servant.albion.json`, no
Albion entry in `data/packs/fd-playtest-v1/pack.json`, no generated Albion
servant/card file, and no Albion-specific target-runtime test. The frozen
S1/S2 locators point to absent `src/content/authoring/cards.json`; the frozen
S3 locator points to absent `src/content/generated/legacy-content.json` in
this checkout. These absences prevent source re-verification in the current
working tree, so this decision does not rewrite the frozen source status.

An external corroborating file exists at
`E:\Codex\FD\Fate_Domination-开发版\batch_lancer_rider.js:42`, SHA-256
`4123B4E5F01A099EB7E0BB04A3AAF5366BDCD6AA6F4EB02D6DD498B6B65A7F0F`.
Its image candidate `images\servants\阿尔比恩之骸.png` has SHA-256
`37BB48048CBB1D07CC984F362A0C657EBBA3FF2F3EC4510FC9798EE8A9032371`.
The external tree has no Git provenance. It is therefore corroboration only,
not a source authority, and cannot clear S3 or authorize a semantic mapping.

## 2. Decision labels

| Label | Meaning in this decision |
| --- | --- |
| `METADATA_ONLY_ACCEPTED` | The identity, printed text, source locator/hash fields, and explicit capability boundary may be represented in a canonical archive/pack metadata record. No effect is automatically executable. |
| `HOST_ADJUDICATED` | The content may be displayed/preserved and routed to an explicit host-ruling affordance/proxy-consent path. It must not be silently accepted or rejected by the rules engine. |
| `PARTIAL_SOURCE_BOUND` | A clause is textually bounded enough to record as a source-bound unresolved intent, but its effect semantics are not accepted. |
| `BLOCKED` | Missing source or missing formal semantic fields prevent both automatic execution and owner-complete migration credit. |
| `REJECTED_BOUNDARY` | Any implementation that fills a missing field by legacy behavior, handler name, unversioned script, or an engine default is rejected. |

`HOST_ADJUDICATED` follows the existing playtest meaning: preserve the
reviewed card and request host ruling; there is no automatic timeout or
implicit proxy decision. It is not equivalent to `FULL`, `PARTIAL`, or an
accepted Phase-3 runtime contract.

## 3. Minimum scope accepted

The following metadata-only contract is accepted for future canonical archive
or pack registration, subject to the missing FORMAL fields in Section 6:

1. Preserve the three canonical IDs, three legacy IDs, owner ID/name, printed
   names, exact frozen printed text, and the clause SHA-256 values above.
2. Preserve source references as provenance fields only. The historical
   `legacy-content.json` path and the external development-tree path may be
   listed as corroborating references; neither is an accepted executable
   source on this decision.
3. Set owner/card capability to `HOST_ADJUDICATED`, with a reason that names
   the unresolved mechanics and says “no automatic runtime execution”.
4. Preserve card/skill display metadata only when it is supplied by a future
   source-bound archive or FORMAL evidence packet. This decision does not
   import card cost, requirement, power, deck, or type values from the
   unversioned script.
5. The archive/pack record may expose a host-ruling interaction, but it may
   not emit a typed game mutation, install an ongoing effect, schedule a
   resource loss, select a target, or alter battle power automatically.

This is the only accepted scope. It is intentionally narrower than a generic
shared capability membership and does not create
`inheritedAcceptanceContracts` or `partialAcceptanceContracts` for any Albion
identity.

## 4. Explicitly retained blocks

### S1 — 未能回归于星的龙

The printed clauses may be retained as `PARTIAL_SOURCE_BOUND` metadata:

- `starfall-enter-scouting`: the text names an optional add-to-attack branch
  after entering scouting and names gains of 4 mana, 2 victory points,
  movement to a non-scouting location, and an 8-mana loss at combat-phase end.
- `starfall-combat-end-mana-loss`: the text names the combat-phase-end loss
  associated with that branch.

No runtime semantic contract is accepted for the trigger provenance, movement
choice, source-card lifetime, transaction ordering, resource lower bound,
combat identity, or replay/restore cleanup. In particular, this decision does
not authorize a choice window, movement mutation, `gain_mana`, victory-point
mutation, scheduled loss, or card-zone mutation. All S1 effects remain
`HOST_ADJUDICATED`/`BLOCKED` for automatic execution.

### S2 — 炎之灾厄

The text may be retained as `PARTIAL_SOURCE_BOUND` metadata:

- `<每局游戏限一次>` is preserved literally as printed text.
- The text names a first-move-per-round condition and a power increase equal
  to movement distance that lasts until game end.

No runtime semantic contract is accepted for what movement events qualify, how
distance is calculated, whether the source must be active in an attack, the
once-per-game ledger, persistent modifier ownership, source close/re-entry,
or restore/replay. No player flag, power modifier, event trigger, or lifetime
state may be installed automatically. S2 remains `HOST_ADJUDICATED`/`BLOCKED`.

### S3 — 无人知晓的无垢搏动

No semantic sub-clause is accepted. The frozen inventory remains
`SOURCE_EVIDENCE_REQUIRED` + `SEMANTIC_SOURCE_REQUIRED` with
`mappingStatus=EXPLICIT_BLOCK`. The external script text is not promoted to a
source contract. The entire Dragon Heart timing, matching attack comparison,
opponent cardinality, victory-point loss, lower bound, battle-result binding,
and restore/idempotency behavior remains `BLOCKED`.

## 5. Explicit rejection boundaries

The following are rejected by this decision and must not appear in an Albion
implementation or pack metadata as accepted semantics:

1. Copying `core.structured-skill` or `core.dragon-heart` from the observed
   Reference route into target runtime.
2. Treating `batch_lancer_rider.js` or its image as versioned authority,
   regardless of matching text or hash.
3. Filling S1/S2 missing axes with generic trigger, movement, resource,
   modifier, power, card-zone, or lifecycle defaults.
4. Registering an Albion card as `FULL` or `PARTIAL` merely because its frozen
   inventory row is `SOURCE_GROUNDED`.
5. Installing a host-ruling fallback that silently mutates authoritative game
   state, guesses target IDs, or times out into a default ruling.
6. Counting metadata registration as runtime migration credit or as evidence
   that a GPT-6 Sol reviewer has accepted the mechanics.

## 6. Required FORMAL fields before any stronger decision

The minimum metadata decision can be recorded now, but the following fields
are still required before the owner can leave source-contract blocking or any
automatic implementation can begin:

| Required field | Why it is missing | Required decision/evidence |
| --- | --- | --- |
| `decisionId`, decision authority, reviewer and exact review commit | No Albion formal source packet exists | FORMAL decision packet with independent review identity |
| Canonical source path and verifiable source/image hashes | Frozen locators point to absent files; external script is unversioned | Source-aligned archive or repository-committed evidence packet |
| S1 trigger, target, ordering, resource and battle identity schema | Printed text does not define runtime provenance/rollback | Explicit source-bound semantic contract and restore tests/spec |
| S2 movement qualification, distance, once-per-game and persistent modifier schema | Printed text does not define engine events or state ownership | Explicit lifecycle/modifier contract and restore tests/spec |
| S3 normalized abilities and battle-result comparison schema | Frozen row is explicitly `SEMANTIC_SOURCE_REQUIRED` | Accepted source packet plus clause-to-axis normalization |
| Canonical archive/pack path and capability record | No Albion authoring or pack file exists | FORMAL-approved archive/pack metadata with `HOST_ADJUDICATED` reason |
| Host-ruling command/consent boundary | Existing host ruling is a capability label, not an Albion registration | Explicit no-auto-mutation command contract and projection/consent evidence |

Until these fields are supplied, no inventory regeneration or capability
inheritance is legal. The only status allowed by this decision is metadata
preservation with explicit host adjudication.

## 7. Handoff and verification

This commit adds only this decision document. It does not modify runtime,
authoring data, pack manifests, generated content, tests, or frozen inventory.
The worktree remains suitable for independent GPT-6 Sol read-only review.

The prior baseline checks remain valid: typecheck PASS, content validation
PASS, Phase-3 inventory/semantic/capability tests 26/26 PASS, and diff check
PASS. Those checks do not constitute Albion behavior acceptance.

Independent reviewer should verify the exact base, inventory SHA, clause SHAs,
absence of Albion target files, and the non-authority treatment of the
unversioned external script before deciding whether this minimum metadata
scope is acceptable.
