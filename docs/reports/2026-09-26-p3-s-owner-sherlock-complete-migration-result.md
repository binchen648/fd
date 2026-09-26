# P3-S Owner-Complete Sherlock Migration Result

Role: Codex S
Status: `MIGRATION_CANDIDATE_READY_FOR_FRESH_R`
Date: 2026-09-26
Task: `P3-S-OWNER-SHERLOCK-COMPLETE-MIGRATION`

## Exact input

- Exact Base: `83d3f6dcc9476390aa8bc11d1dc5b5e15f077a63` (`P3-A Owner-Complete Mash Acceptance Synchronization`).
- Owner root: `servant.sherlock`.
- Current-main strict formal/material before fresh R: `116/944`; remaining `828`.
- Historical frontier remains separate evidence: formal `219/944`, material `265/944`.
- Formal unit is one owner complete; there is no fixed-50 requirement.

## Exact owner scope

This Candidate migrates all seven remaining frozen Sherlock identities together:

1. `servant.sherlock.skill.sc-sherlock-1` — 这是常识，我亲爱的朋友啊
2. `servant.sherlock.skill.sc-sherlock-2` — 空屋历险
3. `servant.sherlock.skill.sc-sherlock-3` — 逆推法
4. `servant.sherlock.skill.sc-sherlock-4` — 逆推法：力量
5. `servant.sherlock.skill.sc-sherlock-5` — 逆推法：迅捷
6. `servant.sherlock.skill.sc-sherlock-6` — 逆推法：魔术
7. `servant.sherlock.skill.sc-sherlock-7` — 逆推法：特殊

All seven frozen inventory rows are FULL/confirmed-override source grounded. The common source chain is `FD全卡图鉴V2.0.chm` (`从者/裁定者/英文版/夏洛克·福尔摩斯.htm`) plus the development image source. Historical handler routes are evidence only; production runtime remains generic/data-driven.

## Implemented semantics

### sc-sherlock-1 — 这是常识，我亲爱的朋友啊

- Combat-phase true-name-release action.
- Selects one active opponent at the same location.
- Reveals that opponent's hand plus face-down attack cards only to Sherlock's controller.
- If any revealed card matches Sherlock's current deduction-record attribute, the record resolves, Sherlock gains 1 VP, the opponent is marked unable to win that battle/round, and Sherlock may optionally choose a new deduction record.

### sc-sherlock-2 — 空屋历险

- Dynamic play cost is `max(0, active player count - current round)` and the actual paid amount is recorded as the card's paid mana on play.
- While active, deployment to `magic_workshop` grants 1 mana through trusted deployment-event context.
- During the advance phase, Memory Palace performs one mandatory deduction-record choice when no record is currently held.

### sc-sherlock-3 — 逆推法

- Sherlock owns at most one server-side deduction record at a time.
- When another player plays a matching face-up basic attack, the trusted event resolves the record, grants Sherlock 1 VP, and optionally opens a new record choice.
- Face-down and non-basic plays do not satisfy the ordinary Retroduction trigger.
- An unresolved record at round end is discarded and Sherlock loses 3 VP, floored at zero.

### sc-sherlock-4..7 — exact deduction-record markers

- Four exact outside-game servant-skill definitions encode Strength / Agility / Magic / Special deduction attributes.
- They reuse the accepted PR #456 owner-matching outside-game servant-skill representation seam.
- Marker validation is strict/fail-closed; widened/extra marker shapes are rejected.
- The runtime derives the exact four record definitions from the current player's `servantCardId` namespace; there is no Sherlock/card-name/printed-text routing.

## Generic runtime / persistence changes

- Added strict generic `deduction-record.ts` marker/condition/effect validation.
- Added bounded generic dynamic play-cost support for exact `active_player_count_minus_round` formula.
- Added server-owned deduction-record state and battle-defeat round marker to `AbilityRuntime`.
- Added owner-private deduction choice continuation with exact restore/reference validation.
- Added trusted reveal-event fields for owner-private revealed card ids/definitions.
- Added the battle-defeat marker to generic battle winner eligibility.
- MatchSession restore validates deduction records against the restored player's current servant namespace and exact outside-game definition.
- Deployment ability events are emitted for all deployed locations; authoring conditions decide whether the event is relevant (e.g. exact `magic_workshop`).
- Registered Sherlock in `fd-playtest-v1` and regenerated deterministic content/evidence outputs.
- Updated roster-cardinality/session fixture assumptions affected by the ninth production servant; Achilles regression now mechanically locates `servant.achilles` instead of assuming a fixed player seat.

## Verification

Toolchain:

- `..\tools\verify-toolchain.cmd` -> `FD_TOOLCHAIN_OK`.

Focused Sherlock owner regression:

- `packages/rules/tests/regression/p3-owner-sherlock-complete-migration.test.ts`: `7/7 PASS`.
- Covers all 7 frozen identities, exact four outside-game record definitions, malformed marker fail-closed, dynamic paid cost, Memory Palace choice, Retroduction trusted-event trigger/expiry, and Elementary private reveal/defeat/re-record behavior.

Affected chain final run:

- 10 files / `183/183 PASS`:
  - Sherlock owner regression
  - executable card pack
  - MatchSession
  - core combat resolver
  - authoring interpreter
  - FB2-18 outside-game placement
  - battle winner conformance
  - battle-loss servant reveal
  - playtest pack loader
  - compile-playtest-content-pack CLI

Build/content checks:

- `npm run typecheck`: PASS.
- `git diff --check`: PASS.
- `npm run content:validate`: PASS — `7 masters, 9 servants, 20 events, 0 blocking issues`.
- `npm run content:compile`: PASS — same summary.
- `npm run verify:generated-content`: PASS.
- generated hashes:
  - content library: `78e3d463ba8214615ffb1d6679096c5f4e6567466a1bc06470c275e23729ff43`
  - fixture: `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence report: `d71c4cd8699c8eaed24cf0eb63916b5201d90a0489a76d692185dbc3c58762a2`

Production identity-routing audit under `packages/rules/src` (tests excluded):

- `servant.sherlock`: 0
- `sc-sherlock`: 0
- `夏洛克`: 0
- Sherlock skill-name Chinese routing strings: 0
- `SkillLib`: 0

Result: CLEAN.

Development source asset paths for Sherlock overview and `sc_sherlock_1/2/3` were mechanically present under `E:\Codex\FD\Fate_Domination-开发版`.

## Existing source-asset baseline limitation

`npm run test:source-assets` was attempted. The fixed Work still lacks the historical `chm-extract/` image tree, so the command reports the pre-existing missing-image baseline for older registered servants/masters/events. Sherlock is not listed among the missing-image findings; its development image paths are present. This environmental baseline is unchanged and no historical validator is weakened.

The product-display source-evidence test similarly reaches the existing `servant.artoriac.overview` missing `chm-extract/...` filesystem assertion; its roster/pack/content structural checks otherwise pass. This is not attributed to the Sherlock Candidate.

## Accounting / review boundary

No migration credit is awarded by this implementation report.

- Before fresh R: current-main strict formal/material remains `116/944`.
- On exact-Candidate `MIGRATION_ACCEPTED` plus A-sync/accounting, exactly these 7 Sherlock identities are eligible to move current-main strict accounting to `123/944`, remaining `821`.
- Runtime primitives and generated/support surfaces are zero-credit support.
- Do not move to the next owner until this exact owner Candidate is accepted and synchronized/accounted.

The exact Candidate SHA is frozen by the commit containing this report and must be mechanically recorded in PR/handoff evidence before fresh R.
