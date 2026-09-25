# P3-A Current-Main M50-02 Acceptance Synchronization

Date: 2026-09-26
Status: `SYNCHRONIZED`

## Accepted input

- PR: `#450`
- Base: `67a8d150efd20d7b84c08fab59d9b403a9543087`
- Accepted Candidate: `8e3570d753a42683d3d69751a51900f5daeaefee`
- Canonical fresh-R evidence: `https://github.com/binchen648/fd/pull/450#issuecomment-5838514469`
- Candidate tree: `93204636ad8b419ecb906c07d15e6fb90bb7b2a8`

Fresh R confirmed the predecessor source-zone stale-state finding is closed: selected-one answer-time source validity now uses canonical `isActiveCardSource`, and the focused source move `attack_area -> skill` fails closed without mutating the target. Focused M50-02 is `7/7`; affected chain is `9 files / 144 tests`; typecheck and Base-to-Candidate diff check pass; `data/authoring/**` remains empty.

## Synchronization boundary

Synchronize only the zero-credit identity-free `opponent_close_one_non_residual` capability. No Scathach consumer authoring, historical M50-02 50-card batch, unrelated M50 vocabulary, generated/client/pack changes, identity routing, merge, or retarget is synchronized here.

Formal/material accounting remains `112/944`, remaining `832`.

## Next F4 cadence ruling

The latest user ruling supersedes the repository's older 10-40 / one-card cadence for subsequent non-tail F4 migrations: the next migration batch must contain exactly 50 frozen identities. Compatible mechanically isolated subgroups may be combined to reach 50; a smaller subgroup does not authorize a smaller non-tail S batch.

A must therefore run a mechanical current-main readiness scan and freeze exact-50 membership before S. Historical M50 batch membership may be used as evidence input only where each identity independently satisfies current-main accepted dependencies; it is not wholesale migration authority.
