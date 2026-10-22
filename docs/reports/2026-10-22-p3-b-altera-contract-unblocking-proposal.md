# Altera source-bound contract / FORMAL decision proposal

- Date: 2026-10-22
- Proposal status: **UNACCEPTED — FORMAL/A decision required**
- Target repository: `https://github.com/binchen648/fd`
- Exact base: `e1f995bba356433519b6c823cbeffe53d48cffb0`
- Owner scope: `servant.altera` (`sc-altera-1`, `sc-altera-2`, `sc-altera-3`)
- Authority boundary: proposal only; it does not alter the frozen inventory,
  register a pack card, or authorize runtime code

This proposal separates the two genuinely blocked Altera cards from the
existing narrow S3 FM03 contract. It does not infer semantics from a handler
name, a legacy adapter, or an unversioned external tree. It records no new
runtime behavior.

## 1. Evidence boundary and exact identities

The frozen inventory is
`data/phase3/full-roster-ability-inventory.json`, SHA-256
`FF0424802F9989FB134C336A87CFDAC0961E44250B01D1B6968D562006662BC4`.
The frozen rows are all `BLOCKED` / `SEMANTIC_SOURCE_REQUIRED` with
`currentRoute=none`, empty inherited/partial contract lists, and the three
Reference observations recorded in the readiness report. Their clause hashes
are not rewritten here; see the companion preflight for the exact text and
all source SHA-256 values.

The repository already contains
`data/authoring/servants/servant.altera.json` from FM03. Its source policy
records F1 commit `59f145434695d29bdd17e4cb3adc887e84182377` and reference
metadata commit `b2f9fa15fba07c63530bbf4612b03b8b704755f9`; those are evidence
fields from the archive, not a reason to use another remote repository. The
archive is accepted here only as checked-in evidence for S3's exact three
ability shapes and printed source hash.

## 2. S1 — 军神之剑·泪之星 (`sc_altera_1`)

### Source-bound candidate contract (not accepted)

The frozen clause names a card that cannot be played normally; after the round
in which it was placed, when its controller fights at that location, it is
added to the attack and true-name released during combat, then removed after
combat and the location draws `文明废墟` in place of its normal event for the
rest of the game.

FORMAL must decide, from source-aligned evidence:

1. the authoritative trigger and whether “the round after placement” is a
   round gate, an event sequence gate, or both;
2. source-card/controller/location/battle identity and the exact add-to-attack
   and true-name-release ordering;
3. whether the source card must remain in the attack through combat end and
   whether removal is atomic with event-deck replacement;
4. whether `文明废墟` is a typed event definition, a location-local deck
   override, or a replacement draw operation, and how an exhausted/invalid
   deck settles;
5. replay/restore identity, duplicate-trigger idempotency, and cleanup if the
   location or source card leaves play before combat end.

No `CARD_ZONE`, `TRIGGER`, `LIFECYCLE`, `EVENT_DECK`, `SPECIAL_SUBSYSTEM`, or
`REVEALS_TRUE_NAME` capability is inherited merely because the catalog lists
those families elsewhere. No S1 implementation is authorized.

## 3. S2 — 军神之剑 (`sc_altera_2`)

### Source-bound candidate contract (not accepted)

The frozen text has three clauses: reduce Altera skill-card mana by the
highest positive victory-point count of an event on the controller's
battlefield; during action, prevent the controller's attack from being closed
or having its power reduced by other abilities; during combat, place S1 at the
controller's location.

FORMAL must decide, from source-aligned evidence:

1. the authoritative event-card set, “positive victory points” selection and
   tie-break, recalculation timing, and whether the reduction is a current
   play-cost modifier or a persistent card state;
2. the attack identity and ordering for the close/power-reduction immunity,
   including interaction with already-installed modifiers and cleanup;
3. whether S1 placement is an automatic combat action, a selectable action,
   or a source-card creation/return operation, and how source identity binds;
4. whether the S2 source must remain active and where the effect lives when
   the servant, skill card, or battlefield changes;
5. serialized restore, replay, duplicate-event handling, and failure rollback
   for all three clauses.

No `RESOURCE_NUMERIC`, `MODIFIER`, `POWER`, `CARD_ZONE`, `TRIGGER`, or
`LIFECYCLE` capability is inherited from the S3 test or from the observed
`core.altera-photon-ray` handler. No S2 implementation is authorized.

## 4. S3 — 对魔力（saber class） (`sc_altera_3`)

### Existing narrow contract evidence

The checked-in archive and FM03 focused tests show the exact accepted
identity-free shapes already reviewed by B18/R12, B19/R13, and FB2-10/R29:

1. `sc-altera-3.noble-bloom`: combat
   `after_battle_result_determined` response; controller played the
   highest-cost Noble Phantasm in the battle this round; typed controller VP
   `+1`.
2. `sc-altera-3.noble-bloom-extra-vp`: the same independent response plus
   `highest_cost_noble_phantasm_cost_at_least(4)`; typed controller VP `+1`.
3. `sc-altera-3.magic-resistance`: active-source combat action in the
   controller combat-action window; one `combat_power_modifier` setting
   `attack.currentPower=0` for engaged opponent attack cards on the same
   battlefield with attribute `魔术`, duration `this_round`.

The Altera focused test exercises both runtime sides: same-battlefield and
attribute filtering for Magic Resistance, and two independent post-result
VP responses at Noble Phantasm cost 4+. The accepted references are
structural and identity-free; they must not be expanded to other Altera
skills or to broad Power/Modifier/optional-trigger semantics.

### Proposed FORMAL reconciliation decision

FORMAL may accept the following narrow accounting decision, subject to an
independent GPT-6 Sol review:

- mark only S3's three FM03 abilities as `CONTRACT_MAPPED` against the exact
  B18/R12, B19/R13, and FB2-10/R29 contracts;
- preserve the exact S3 printed text, clause hashes, source-text hash, static
  metadata, and source provenance;
- record the FM03 evidence as a prior accepted contract synchronization, not
  as a new owner-wide migration or a grant of S1/S2 capability inheritance;
- keep S1 and S2 `SOURCE_EVIDENCE_REQUIRED` /
  `SEMANTIC_SOURCE_REQUIRED` and keep the owner blocked;
- keep Altera out of `authoringServantFiles`, playable generated cards, and
  owner-complete migration accounting until a separate pack decision is made.

This proposal does not itself perform that reconciliation. The current exact
A-sync branch is Albion-only, and the frozen inventory is immutable input for
this pass.

## 5. Explicit rejection boundaries

The following are rejected:

1. Copying `core.altera-teardrop-photon-ray` or `core.altera-photon-ray` from
   Reference into target runtime.
2. Treating the historical inventory's unrelated repository pointer as a
   target source or switching the remote away from `binchen648/fd`.
3. Filling S1/S2 trigger, card-zone, event-deck, resource, modifier, power,
   timing, or lifecycle fields from an engine default or from S3.
4. Treating the existing S3 archive/test as proof that all three Altera cards
   are in the playable pack or that frozen inventory accounting is current.
5. Broadening B18/B19/R29 to accept arbitrary Altera abilities or changing
   their structural identity-free classifier.
6. Counting a future metadata-only record as runtime migration credit or as
   independent reviewer acceptance of unresolved S1/S2 semantics.

## 6. Required gates and handoff

1. FORMAL/A verifies the S3 archive against the exact frozen source text and
   hashes and decides whether to synchronize only the narrow S3 contract.
2. FORMAL obtains source-aligned evidence for S1/S2 and binds the unresolved
   trigger, zone, event-deck, resource, modifier, lifecycle, ordering, and
   restore fields above.
3. A governing sync regenerates the frozen inventory/audits only after the
   decision; this Builder must not rewrite them.
4. Only then may a Builder add any Candidate archive/pack/generated evidence
   or implementation. Any resulting Candidate must be handed to an
   independent GPT-6 Sol reviewer with exact base and Candidate SHAs.

Until these gates close, the owner remains blocked. The only immediately
supportable result is the narrow S3 contract proposal; no runtime code or
playable registration is authorized.
