# P3-A Tristan Owner Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-30

## Accepted input

- PR: `#492`
- Exact Base: `d577b1ebca780ec0332440901486320e7bc04e58`
- Exact accepted Candidate: `aad7adad30aa30e3a8545733dca1d04b69ed867c`
- Canonical Coordinator bounded relay: `https://github.com/binchen648/fd/pull/492#issuecomment-5904895847`
- Verdict: `MIGRATION_ACCEPTED`
- ReviewJobKey: `pr492:aad7adad30aa30e3a8545733dca1d04b69ed867c`
- Exact-Candidate Phase 3 Pre-Review Gate: run `36672454283` — `SUCCESS`

The fresh independent Reviewer completed the exact-Candidate owner-complete migration review. Reviewer-side GitHub publication returned explicit HTTP 403, so FORMAL published one bounded same-attempt relay carrying the exact Base/Candidate/verdict. This synchronization consumes that already-completed review and does not perform a second review.

## Accepted owner-complete scope

The accepted formal transaction contains the complete frozen Tristan owner set together:

1. `servant.tristan.skill.sc-tristan-1` — newly creditable;
2. `servant.tristan.skill.sc-tristan-2` — newly creditable;
3. `servant.tristan.skill.sc-tristan-3` — preservation-only / already accounted by accepted FM04/R32 migration.

The accepted Candidate materializes the complete Tristan archive, preserves sc3 without duplicate credit, adds the locked-reference twelve-card starting deck and canonical pack entry, consumes the accepted generic sc1/sc2 readiness families, and closes one identity-free MatchSession terrain-authority durability seam exposed by roster expansion. The shared durability closure adds no migration identity or credit.

## Mechanical closure

FORMAL independently revalidated before synchronization:

- PR #492 remains exact Base `d577b1ebca780ec0332440901486320e7bc04e58` / head `aad7adad30aa30e3a8545733dca1d04b69ed867c` on `codex/s-p3-owner-tristan-complete-migration`;
- exact Candidate Phase 3 Pre-Review Gate run `36672454283` is `SUCCESS`;
- fixed Reviewer reviewed exact Candidate and remained clean;
- locked Reference remains `b2f9fa15fba07c63530bbf4612b03b8b704755f9`;
- canonical relay comment `5904895847` exists on PR #492 and carries exact Base/Candidate/verdict plus `sameAttempt=true` and explicit Coordinator bounded-relay wording;
- accepted readiness prerequisite remains PR #490 Candidate `5fb8f59539c17bc868e00d628d50ee5f05bf9812` with canonical acceptance evidence `https://github.com/binchen648/fd/pull/490#issuecomment-5903982665`;
- no duplicate exact-Candidate review is used.

Accepted-Candidate verification remains green: Tristan formal owner-complete `5/5 PASS`; Tristan readiness `11/11 PASS`; complex skills `38/38 PASS`; MatchSession `33/33 PASS`; generic MatchSession regressions `11/11 PASS`; playtest pack loader `21/21 PASS`; affected aggregate `119/119 PASS`; `FD_TOOLCHAIN_OK`; typecheck PASS; content validate/compile PASS at `7 masters / 14 servants / 20 events / 0 blocking issues`; generated-content determinism PASS; production identity audit CLEAN; and `git diff --check` PASS.

## Accounting

Strict formal accounting before this transaction was `157/944`, remaining `787`.

This A-sync grants exactly two new migration credits:

- sc1: `+1`;
- sc2: `+1`;
- sc3: `+0` preservation-only / already accounted.

Strict formal accounting is now **`159/944`**, remaining **`785`**. Tristan readiness remains permanently zero-credit. The generic MatchSession durability closure receives no migration credit.

## Mechanical next owner

Stable first-occurrence frozen owner ordering in `data/phase3/full-roster-ability-inventory.json` places `servant.ushiwakamaru` immediately after `servant.tristan` (Tristan index `245`, Ushiwakamaru index `246` of `251` owners).

Frozen Ushiwakamaru owner scope is exactly:

1. `servant.ushiwakamaru.skill.sc-ushiwakamaru-1`;
2. `servant.ushiwakamaru.skill.sc-ushiwakamaru-2`;
3. `servant.ushiwakamaru.skill.sc-ushiwakamaru-3`.

Owner-readiness-first remains mandatory. FORMAL must mechanically inspect all three frozen Ushiwakamaru skills together against accepted F1/source evidence, locked Reference static evidence, current generic runtime seams, current canonical authoring, and historical accepted migration evidence before creating any formal consumer Candidate. Any compatible missing generic seams must be closed as one bounded zero-credit owner-readiness batch; no Ushiwakamaru credit is claimed by this Tristan synchronization.

The HELPER report read immediately before synchronization was stale Epoch 3 material still targeting Tristan readiness PR #490. It was treated strictly as read-only auxiliary evidence and contributed no verdict, scope, or credit.