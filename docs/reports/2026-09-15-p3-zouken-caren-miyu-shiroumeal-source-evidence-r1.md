# Phase 3 Source Evidence — Zouken / Caren / Miyu / Shirou Meal (S R1)

- Date: 2026-09-15
- Role: Codex S
- Base accepted R: `fbb72fa4bdf3fb8779bb8987f27da7a21c2678f8`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: 18 canonical master skill identities across Zouken, Caren, Miyu, and Shirou (Today's Menu).

## Result

- Development-text / locked-Reference source replay: **18/18 PASS**.
- Source-grounded checkpoint candidate: **270 / 944**.
- Remaining `SOURCE_EVIDENCE_REQUIRED`: **674**.
- Batch classification: **9 `READY_GENERIC_EXTENSION` / 9 `SPECIAL_HANDLER_CANDIDATE`**.
- Global classification: **2 existing / 171 generic / 97 special / 674 source-evidence-required**.
- Source evidence overlays: **198 cards / 375 structured abilities**.
- Full-roster structured abilities: **492**.
- Full-roster audit: **EXACT_AGREEMENT**, `gapCount=0`.
- `zeroSilentFallback=true`.

## Reviewed-special boundaries

The reviewed-special identities are limited to mechanics that cross ordinary generic subsystem boundaries:

- Zouken `s3`: X is bound across the action into a same-round combat-win VP reward.
- Caren `s2`: reactive replacement of an opponent's VP gain, then prevented VP -> Caren mana loss -> actual mana lost -> Caren VP.
- Caren `s3`: a chosen opponent receives a round movement/power bind and losing that fight removes the source card.
- Miyu `s1`: replacement Servant setup plus three-unused-Servant skill draft and name/class aliases.
- Miyu `s2`: exchange with a setup-bound Servant deck or outside-game Install card.
- Miyu `s3`: the six Install/Dream Summon package and its shared per-round/per-game limits.
- Shirou Meal `s1`, `s2`, ascension: typed Food resource acquisition, spending patterns, play prerequisite, and attribute-linked basic power.

All ordinary mana, VP, Command Seal, movement, card-zone, draw/discard, trigger, condition, modifier, power, and lifecycle semantics remain explicit generic dependencies.

## Guardrails

- No new master identity literal branch in generic machinery.
- Only mechanic-level special tokens were added: `REACTIVE_RESOURCE_RULE`, `BOUND_OPPONENT_RULE`, `ROSTER_SKILL_DRAFT_RULE`, `DREAM_SUMMON_RULE`, `FOOD_RESOURCE_RULE`.
- No production runtime diff from the accepted base.
- No F3 runtime migration is claimed by this S lane.

## Verification

- `npm run typecheck`: PASS.
- Phase 3 focused suite: **6 files / 91 tests PASS**.
- Full CI, single worker: **84 files / 536 tests PASS**.
- Source replay: **18/18 PASS**.
- `git diff --check`: PASS.

Verdict: **S_CANDIDATE_READY_FOR_FRESH_A**.
