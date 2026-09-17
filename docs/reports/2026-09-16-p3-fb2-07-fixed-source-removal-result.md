# P3-FB2-07 Fixed Controller Source-Card Removal Result

Date: 2026-09-16
Role: B2
Status: IMPLEMENTATION_COMPLETE_CANDIDATE
Base: `6fb7e2c529cc22599ba820d49de6cce8fea2e128`

## Implemented

- Extended the existing typed Resolution Data-flow `move_source_card` node from `skill` only to the narrow union `skill | removed_from_game`.
- Added identity-free `isFixedControllerSourceRemovalComponent` for canonical controller-owned source removal.
- Reused the authoritative card-zone mutation path: removed cards become public and inactive.
- Kept B15 `to=skill` semantics unchanged: source must still be active, face up, and in `field` or `attack_area`.
- Added no parent route. The component predicate is not used to admit abilities; all 12 F1 members remain dependent on their declared parent contracts.

## Fail-closed boundary

The typed primitive/component rejects unsupported destination, non-controller destination ownership, wrong source owner/controller, missing/already-removed source, and extra-semantic classifier siblings. A later typed failure rolls the removal back.

`return_card_by_definition`, Card Create, arbitrary source movement, selected-card movement, Trigger/Lifecycle/Target/Movement/Power/Special semantics, MatchSession, and F1 authoring are unchanged.

## Validation

- `npm.cmd run typecheck` — PASS.
- Focused: 4 files / 34 tests — PASS.
- Rules regression: 46 files / 274 tests — PASS.
- Deterministic generated content — PASS, hashes unchanged:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- Full CI: 113 files / 687 tests — PASS.
- Production representative identity audit — `IDENTITY_NONE`.
- Forbidden-file audit — `NONE`.
- `git diff --check` — PASS.

## Scope judgment

Exact F1 component alignment is 12 identities. Complete migration readiness added by FB2-07 is `0`; this result must not be reported as a 12-card F4 batch.
