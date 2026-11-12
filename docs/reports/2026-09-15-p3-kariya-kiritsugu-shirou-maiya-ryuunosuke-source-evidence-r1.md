# Phase 3 Source Evidence — Kariya / Kiritsugu / Shirou / Maiya / Ryuunosuke (S R1)

- Date: 2026-09-15
- Role: Codex S
- Base accepted R: `020095fd4ae9c848e5834e2bc886a18581f04d2b`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: 20 canonical master skill identities.

## Result

- Development-text / locked-Reference source replay: **20/20 PASS**.
- Source-grounded checkpoint candidate: **252 / 944 (26.69%)**.
- Remaining `SOURCE_EVIDENCE_REQUIRED`: **692**.
- Batch classification: **1 `READY_EXISTING_CONTRACT` / 12 `READY_GENERIC_EXTENSION` / 7 `SPECIAL_HANDLER_CANDIDATE`**.
- Global classification: **2 existing / 162 generic / 88 special / 692 source-evidence-required**.
- Source evidence overlays: **180 cards / 344 structured abilities**.
- Normalized structured abilities: **461**.
- Audit: **EXACT_AGREEMENT**, `gapCount=0`.
- `zeroSilentFallback=true`.

## Existing-contract promotion

Kiritsugu `master.kiritsugu.skill.s2` contains the exact routed ability `time-alter.action` and, after source grounding, safely inherits `CARD_ACTION_SEMANTICS_MINIMAL_PLAY`. This raises the full-roster `READY_EXISTING_CONTRACT` count from one to two.

## Reviewed-special boundary

Seven identities remain reviewed-special: Kariya Nemesis assignment/rules and Collapse random mandatory play; Kiritsugu deck-card transform and Origin Bullet fractional-mana scaling; Shirou first-elimination prevention; Ryuunosuke's selected-event battlefield penalty. Ordinary card zone, movement, resource, trigger, lifecycle, modifier, terrain, activation, and power semantics remain explicit generic dependencies.

## Verification

- `npm run typecheck`: **PASS**.
- Phase 3 focused suite: **6 files / 89 tests PASS**.
- Source replay: **20/20 PASS**.
- Generic identity branch additions: **NONE**.
- Production runtime diff under `packages/`, `apps/`, `src/`: **NONE**.
- Independent automation audit: **EXACT_AGREEMENT / gapCount=0**.
- Full CI, one worker: **84 files / 534 tests PASS**.
- `git diff --check`: **PASS**.

Verdict: **S_CANDIDATE_READY_FOR_FRESH_A**.
