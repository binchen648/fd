# P3-B Araya Owner Readiness — Effective Workshop Restrictions Result

## Scope

- Task: `P3-B-ARAYA-OWNER-READINESS-EFFECTIVE-WORKSHOP-RESTRICTIONS`
- Exact Base: `6cbff7387a0b778a9b824fb101070853fb4f7293`
- Classification: bounded zero-credit identity-free readiness capability
- Dependency: accepted persistent-terrain readiness from PR #518
- Formal accounting remains `194/944`, remaining `750`.

## Implemented generic closure

- Exact passive whole-ability gateway: `effective_location_same_location_restrictions`.
- Authoring must bind `persistentTerrainProviderDefinitionId` + `persistentTerrainProviderAbilityId` explicitly.
- Virtual `workshop` identity is derived only while the live source remains in the controller skill zone and the bound persistent-terrain authority reaches at least 5 at the controller's actual location.
- Actual `magic_workshop` also satisfies the effective-workshop condition while the source is live.
- Same-actual-location opponents do not inherit virtual workshop identity.
- Same-location opponents cannot leave through the shared movement layer unless a trusted caller explicitly uses the existing card-restriction bypass.
- Standard attack confirmation is withheld until at least one staged attack is face down.
- Source removal immediately disables virtual location, movement lock, and face-down requirement.
- No extra persistent runtime record is created; authority is derived from current physical source + accepted ability + validated persistent-terrain provenance.

## Verification

- effective-workshop/restrictions focused: `8/8 PASS`
- persistent-terrain predecessor focused: `7/7 PASS`
- Araya readiness focused: `15/15 PASS`
- authoring-interpreter: `38/38 PASS`
- executable-card-pack: `50/50 PASS`
- MatchSession: `33/33 PASS`
- MatchSession regressions: `11/11 PASS`
- directly affected shared aggregate: `132/132 PASS`
- explicit focused + shared aggregate: `147/147 PASS`
- typecheck: PASS
- `FD_TOOLCHAIN_OK`
- content validate: `11 masters, 19 servants, 20 events, 0 blocking issues`
- generated determinism: PASS
- `data/authoring/**` delta: EMPTY
- `git diff --check`: PASS

## Boundary

No Araya canonical consumer materialization is part of this Candidate. No migration credit is granted. Parent Araya readiness must remain open until this exact Candidate is fresh-R accepted and FORMAL performs a full-owner A-sync/rescan.