# P3-B Alice Owner Readiness Presence-Context Result

Date: 2026-10-01
Task: `P3-B-ALICE-OWNER-READINESS-PRESENCE-CONTEXT`
Role: FORMAL readiness / zero-credit
Exact Base: `165cbb738c03eb1df382ca8eaabcda64656c5c9b`
Accounting boundary: `186/944`, remaining `758`; this task grants zero migration credit.

## Frozen source gap closed

The frozen Alice source requires two remaining generic capabilities after accepted multi-presence core #510:

1. while separated, a controller must choose exactly one physical presence location for its own ability whose printed description contains `交战`, `地点`, `战斗`, or `战场`, and the ability must not trigger twice;
2. movement of either Alice physical presence must mirror the other by the same legal direction/distance when the counterpart can move and is not engaged.

This Candidate closes those gaps generically. It does not add Alice consumer authoring or identity routing.

## Runtime closure

- Adds server-owned `multi_presence_location_context_v1` pending interaction.
- Classification derives from trusted compiled `AuthoringAbility.printedClause` using the exact frozen source keywords, not owner/card identity.
- The first decision candidates are reconstructed from live server-owned presence authority.
- The selected location is stored only in the transaction `EffectContext.resolutionLocationId` and is revalidated against source ability, controller, live provider, candidate locations, revision and continuation identity.
- The original ability resumes exactly once after the choice; privileged multi-presence abilities themselves are excluded from restaging.
- Conditions, mandatory target availability, same-location player targeting, battlefield/opponent discovery, terrain/location-kind checks, and movement origins consume the selected transaction location.
- Legal-action preflight evaluates possible presence contexts so an ability does not disappear merely because the primary physical presence fails a battlefield/location condition that the extra presence satisfies. Target/condition preflight is bound to the same candidate context rather than stitching two locations together.
- Generic controller movement routes through a physical-presence mover: selecting primary preserves the existing primary-to-extra event path; selecting the extra presence moves the authoritative extra record and mirrors the primary only when legal and unengaged.
- Occupancy/enabled-location/movement/provider checks remain fail-closed.

## Restore / authority

- MatchSession restore accepts the new interaction only with exact metadata/constraint shape.
- Generic pending-decision restore revalidates live source/controller/provider/candidate/revision/continuation authority.
- Optional `resolutionLocationId` must be a string and is never trusted without live runtime revalidation.
- A forged candidate-location set is rejected by the canonical restore validator in focused regression.

## Verification

- Alice readiness focused: `10/10 PASS`.
- Directly affected/shared regression aggregate: `185/185 PASS` across Alice readiness, combat resolver, map engine, resolution dataflow, executable card pack, playtest pack loader, MatchSession and authoring interpreter.
- `FD_TOOLCHAIN_OK`.
- `npm run typecheck`: PASS.
- content validate/compile: `9 masters / 19 servants / 20 events / 0 blocking issues`.
- generated-content determinism: PASS, unchanged hashes:
  - content library: `7d3972f7df836b16af8ab37dbe373eaa3a6e4ecde5bcb238cee53a7b852db53d`
  - fixture: `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`
  - evidence report: `e05fd6874e44104611a6900d1723d59d6275f9b9305b4f9464825fdba69ef902`
- `data/authoring/**` Base-to-WIP delta: EMPTY.
- production identity audit for Alice names/IDs: CLEAN.
- `git diff --check`: PASS.

## Governance

This is the second Alice readiness subtask, not a formal migration. The parent `P3-B-ALICE-OWNER-READINESS-CAPABILITY` remains `WAIT_READINESS_SUBTASKS` until this exact Candidate is fresh-reviewed and FORMAL performs zero-credit A-sync/full-owner rescan. Only after that rescan may one Alice owner-complete formal consumer Candidate for all three frozen identities be created.

## Reviewer revision closure

Fresh review of predecessor Candidate `bba1e169e36093ecc6b9f1c0886b5130c6475d09` returned `IMPLEMENTATION_NEEDS_REVISION` with canonical bounded relay:
`https://github.com/binchen648/fd/pull/511#issuecomment-5923842640`.

Blocking P1: the staged `multi_presence_location_context_v1` decision exposed every authoritative presence location even when only a subset satisfied the same ability activation requirements that made the ability legal. This allowed a battlefield-gated ability to become legal because the phantom satisfied the condition, then resume from the primary non-battlefield location.

Closure in the successor Candidate:
- one shared `eligibleMultiPresenceResolutionContexts(...)` derives live physical-location contexts that satisfy the same location-sensitive activation requirements;
- `canActivate`, staged presence candidates, restore-live validation, and continuation authority all consume that shared result;
- decision metadata/candidates are therefore the exact eligible subset, not the full presence-authority set;
- if live eligibility changes while the decision is pending, canonical pending-decision validation fails closed;
- focused regression now proves the concrete review case: with primary at `magic_workshop` and phantom at battlefield `miyama_town`, the decision offers only `miyama_town`; choosing `magic_workshop` is rejected with no mana change, while choosing `miyama_town` resolves exactly once.

Revision verification: Alice focused `10/10 PASS`; directly affected/shared `185/185 PASS`; typecheck PASS; `git diff --check` PASS. Accounting remains `186/944`, remaining `758`; zero migration credit.
