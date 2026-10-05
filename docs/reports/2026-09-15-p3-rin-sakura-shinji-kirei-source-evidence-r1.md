# Phase 3 Source Evidence — Rin / Sakura / Shinji / Kirei (S R1)

- Date: 2026-09-15
- Role: Codex S
- Base accepted R: `d33e58cd6b292dd9e6a92f472a24a63e4b54fce2`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: 19 canonical master skill identities across Rin, Sakura, Shinji, and Kirei.

## Result

- Development-text / locked-Reference source replay: **19/19 PASS**.
- Source-grounded checkpoint candidate: **232 / 944 (24.58%)**.
- Remaining `SOURCE_EVIDENCE_REQUIRED`: **712**.
- Batch classification: **13 `READY_GENERIC_EXTENSION` / 6 `SPECIAL_HANDLER_CANDIDATE`**.
- Global classification: **1 existing / 150 generic / 81 special / 712 source-evidence-required**.
- Source evidence overlays: **160 cards / 309 structured abilities**.
- Normalized structured abilities: **426**.
- Full-roster audit: **EXACT_AGREEMENT**, `gapCount=0`.
- `zeroSilentFallback=true`.

## Reviewed-special boundaries

The six reviewed-special identities are limited to mechanics that cross ordinary generic subsystem boundaries:

- Rin `s1` Gem Magic: initializes and governs the bespoke ten-Gem resource / climax option-repeat rule.
- Rin `s3` Gem: spends the bespoke Gem resource while binding one of three action branches.
- Sakura `s4` Corrupted Holy Grail: infinite mana with gain/loss suppression.
- Shinji `s4` Book of False Attendant: first-zero-seal end-round Master/Servant roster replacement.
- Shinji ascension Holy Grail Core: first-Servant ownership/history branch involving Shakespeare.
- Kirei ascension Protector of Evil: Supervisor true-name-release defeat action.

Ordinary Command Seal adjustment, mana/VP arithmetic, card-zone movement, activation, movement, visibility, trigger, condition, lifecycle, power, and modifier dependencies remain explicit generic capabilities.

## Guardrails

- No new Rin/Sakura/Shinji/Kirei identity literal branch in generic normalizer/capability machinery.
- No production runtime diff under `packages/`, `apps/`, or `src/` from the accepted base.
- Reference handlers were used only as behavior cross-checks; development text remains the bound source evidence.
- No F2/F3/F4 acceptance or runtime migration is claimed by this S lane.
- `CARD_ACTION_ACTIVATE` now has four grounded users: Illya `s2`, Sakura `s1`, Sakura `s2`, and Shinji `s2`.

## Verification

- `npm run typecheck`: **PASS**.
- Phase 3 focused suite: **6 files / 87 tests PASS**.
- Source replay: **19/19 PASS**.
- Independent automation audit: **EXACT_AGREEMENT / gapCount=0**.
- Full CI under one worker: **84 files / 532 tests PASS**.
- `git diff --check`: **PASS**.

Verdict: **S_CANDIDATE_READY_FOR_FRESH_A**.
