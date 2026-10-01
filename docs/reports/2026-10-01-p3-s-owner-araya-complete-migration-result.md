# P3-S Owner Araya complete migration result

Date: 2026-10-01

## Scope

Task: `P3-S-OWNER-ARAYA-COMPLETE-MIGRATION`

Exact formal Base: `fd13c70c8df32d8ce64d4f6b32282a1f2f16cf66`

Frozen owner scope, materialized atomically in this Candidate:
- `master.araya.skill.ascension` — 矛盾螺旋
- `master.araya.skill.s1` — 三重结界
- `master.araya.skill.s1a` — 起源：静止

Base canonical coverage was 0/3. Candidate canonical coverage is 3/3. No partial credit is permitted.

## Accepted capability consumption

- `s1` consumes the accepted persistent per-location terrain replacement authority from PR #518.
- `ascension` consumes the accepted effective Workshop / same-location restriction authority from PR #519 and binds it specifically to `master.araya.skill.s1` / `araya.s1.terrain`.
- `s1a` consumes the accepted battle-end active-basic recycle + printed-cost-x2 mana authority from PR #520.
- No Araya/card-name/printed-text/legacy-handler routing was added to `packages/rules/src/**`.

## Canonical behavior proved

1. Triple Boundary replaces printed terrain with persistent +1 layers on authoritative qualifying deployments, per location, cap 5.
2. At 5 bound layers, canonical Paradox Spiral grants only its controller effective Workshop identity and enforces same-actual-location opponent movement / face-down standard-attack restrictions.
3. Removing the canonical ascension source immediately disables Paradox Spiral derived authority.
4. Canonical Origin Stillness offers only controller-owned active face-up basic attacks after battle end, shuffles the chosen exact physical back to deck, and grants mana equal to its printed cost x2.
5. Regression explicitly uses a printed-cost 3 basic attack with `paidManaOnPlay=0` and proves +6 mana, preventing substitution of paid-cost semantics.

## Verification

- Araya formal owner-complete regression: 6/6 PASS.
- Araya readiness predecessors: 21/21 PASS.
- Combined Araya focused: 27/27 PASS.
- authoring-interpreter: 38/38 PASS.
- executable-card-pack: 50/50 PASS.
- MatchSession: 33/33 PASS.
- MatchSession gameplay regressions: 11/11 PASS.
- Directly affected shared aggregate: 132/132 PASS.
- Explicit focused + shared aggregate: 159/159 PASS.
- typecheck: PASS.
- content validate/compile: 12 masters, 19 servants, 20 events, 0 blocking issues.
- generated determinism: PASS.
- Phase 3 coverage command: PASS; compiledCards=146, compiledCharacters=31, blockingIssues=0.
- Phase 3 automation audit command: PASS.
- FD_TOOLCHAIN_OK.
- git diff --check: PASS.
- Initial owner Candidate production runtime delta: EMPTY. Successor shared runtime delta is limited to the identity-free linked-role restore-provenance repair required by the predecessor MatchSession regression; Araya authoring semantics are unchanged.

## Accounting

This Candidate itself does not change formal accounting. Strict accounting remains 194/944, remaining 750 until exact fresh independent `MIGRATION_ACCEPTED` evidence is A-synced. If accepted, this owner contributes exactly +3 migration credit.
## Predecessor review finding closure

Predecessor Candidate `b93f73422a0be273a8c8fdae6c743c5b9313e34b` received `MIGRATION_NEEDS_REVISION`; canonical evidence: `https://github.com/binchen648/fd/pull/521#issuecomment-5927224944`.

Two Candidate-induced shared MatchSession regressions were reproduced and closed without changing any of the three Araya canonical skill definitions:

1. The Kayneth Pride deployment test no longer assumes that fixed seed `20260904` must contain `master.kayneth` after the canonical master roster grows. It deterministically searches the bounded pairing seed space for a real pairing containing Kayneth, then runs the unchanged Pride behavior assertion.
2. The expanded roster exposed a linked-role restore provenance bug: a legitimate game-start initializer could later be played from `skill` to `field`, while the restore validator incorrectly required that initializer provider to remain in `skill`. Restore now accepts the same owned/controlled accepted initializer definition after that legitimate zone transition, while other linked-role providers remain subject to their existing live-zone checks. A dedicated regression proves this legitimate state restores.
3. The MatchSession authentication regression now first asserts that the untampered durable snapshot restores, then preserves the existing assertion that tampering `maxActionsPerPlayer` reaches and reports the deferred-runtime-authority rejection rather than being masked by an unrelated container rejection.

Successor verification after closure:
- predecessor reviewer reproductions: 2/2 PASS;
- MatchSession: 33/33 PASS;
- Araya formal + readiness focused: 27/27 PASS;
- linked-role core regression: 11/11 PASS;
- directly affected shared aggregate: 132/132 PASS;
- typecheck: PASS;
- git diff --check: PASS.
## Successor-2 fixed-seed fixture stabilization

The exact fresh-Reviewer relay for Candidate `618d1d57e2b04da33d303a1cbd3f4049f37ac2ef` was truncated in the user-visible handoff after stating that both predecessor P1 findings were CLOSED. No omitted Reviewer wording is inferred or fabricated here.

Coordinator full-suite reproduction on the exact Candidate mechanically isolated one additional Candidate-induced roster-sensitive regression:
- `packages/rules/tests/regression/card-action-play.test.ts` hard-coded seed `20260909` and then required `master.kiritsugu`.
- With the exact formal Base roster (11 masters), that seed contains Kiritsugu; after adding Araya as the 12th canonical master, the same seed no longer contains Kiritsugu.
- The three Time Alter behavior tests therefore crashed before reaching their assertions.

The fixture now uses a bounded deterministic search for a legal seven-player pairing containing `master.kiritsugu`, following the same roster-stable pattern already used for other targeted character regressions. No Time Alter semantic assertion was removed or weakened.

Reverification after this fixture stabilization:
- Time Alter direct-action regression: 4/4 PASS.
- Araya formal + readiness focused: 27/27 PASS.
- MatchSession: 33/33 PASS.
- Amakusa linked-role restore regression: 11/11 PASS.
- Directly affected shared aggregate: 132/132 PASS.
- typecheck: PASS.
- git diff --check: PASS.

This follow-up does not change Araya canonical authoring or migration accounting. Accounting remains 194/944, remaining 750 until an exact fresh independent `MIGRATION_ACCEPTED` verdict is A-synced.