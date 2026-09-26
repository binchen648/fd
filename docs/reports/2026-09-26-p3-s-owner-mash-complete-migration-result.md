# P3-S Owner-Complete Mash Migration Result

Role: Codex S
Status: `MIGRATION_CANDIDATE_READY_FOR_FRESH_R`
Date: 2026-09-26
Task: `P3-S-OWNER-MASH-COMPLETE-MIGRATION`

## Exact input

- Exact Base: `24ce42298ca41b142356424c0ed60ed5b9ca9bc7` (`P3-A Current-Main Outside-Game Owned Servant-Skill Acceptance Synchronization`).
- Owner root: `servant.mash`.
- Frozen denominator before this candidate: `944`.
- Formal/material before review: `112/944`; remaining `832`.
- This is the first formal owner-complete batch under the user's superseding F4 workflow. There is no fixed-50 requirement.

## Exact owner scope

This Candidate migrates all four remaining frozen Mash identities and no Mash identity is intentionally omitted:

- `servant.mash.skill.sc-mash-1` — 已然遥远的理想之城
- `servant.mash.skill.sc-mash-2` — 雪花之壁
- `servant.mash.skill.sc-mash-3` — 奥特瑙斯
- `servant.mash.skill.sc-mash-4` — 守护 (outside-game frozen catalogue identity)

The physical two-copy Guard card is authored as `card.x-guard` in Mash's 12-card servant deck. It is runtime support for the accepted `sc-mash-4` semantics; it is not an additional frozen migration-credit identity.

## Source-grounded semantics

The implementation follows the frozen FULL confirmed overrides/source-evidence chain referenced by the task block.

### sc-mash-1 — 已然遥远的理想之城

- Action-phase true-name-release skill.
- Select one player.
- At Mash's current battlefield, the selected player's terrain advantage is increased by `+2`, then doubled.
- The bounded terrain override is stored by player/location/current round and is consumed by the generic combat terrain calculation.

### sc-mash-2 — 雪花之壁

- Combat-window effect against opponents fighting at the same battlefield.
- Each qualifying active attack receives `-3` power while Mash's servant package is hidden, or `-4` after true-name release.
- A player currently borrowing Mash's active linked Guard is excluded.

### sc-mash-3 — 奥特瑙斯

While Mash's owner has no Command Seals:

- servant true-name reveal is suppressed/hidden;
- Lord Camelot use is unavailable through the exact command-seal condition;
- lending Guard is unavailable through the same generic condition;
- Guard base power is doubled.

The runtime lookup is owner-generic: it derives the servant skill namespace from the player's current `servantCardId` and inspects authored mechanics. It does not route on `servant.mash`, card names, printed text, or Chinese text.

### sc-mash-4 / card.x-guard — 守护

- The frozen `sc-mash-4` identity remains exact owner-matching `initialPlacement: "outside_game"`, reusing accepted PR #456 capability authority; it receives no executable `initialZone`.
- Mash's physical Guard is a two-copy authored servant-deck card.
- Guard may be lent to one opponent while allowed by the command-seal rule.
- If borrower and Mash participate at the same battlefield, both ignore battle-loss effects and both effective combat powers become the larger of the two values.
- If the borrower fights without Mash, Guard closes before that battle.
- At battle-phase settlement, borrowed Guard returns to Mash; if Mash lost a battle it returns to hand, otherwise it closes to discard.
- With no Command Seals, its authored base power is doubled.

## Generic runtime / content changes

- Added a strict generic linked-owner combat rule validator/runtime (`linked-owner-combat.ts`).
- Added generic round-scoped terrain-advantage override support (`terrain-advantage-override.ts`).
- Extended loader/interpreter only for exact bounded shapes required by the four Mash semantics, with malformed/extra-field near matches fail-closed.
- Integrated linked-owner loss immunity/power sharing/owner-presence handling into generic combat settlement and battle cleanup.
- Extended servant archive/product compilation so an archive may retain three normal in-game servant skills plus explicit outside-game catalogue skill identities, while preserving the previously accepted three-total-skill FB2-18 case.
- Extended servant deck mapping to accept archive-authored `servant_deck_card` named entries such as `card.x-guard`.
- Added Mash to `fd-playtest-v1` and regenerated deterministic content/evidence outputs.

## Focused and affected validation

Toolchain preflight:

- `..\tools\verify-toolchain.cmd` -> `FD_TOOLCHAIN_OK`.

Focused owner regression:

- `packages/rules/tests/regression/p3-owner-mash-complete-migration.test.ts`: `6/6 PASS`.
- Covers all four frozen identities plus physical Guard semantics and one malformed extra-field fail-closed probe.

Affected chain (first pass):

- Mash owner regression
- FB2-18 explicit outside-game placement
- battle-loss servant reveal
- battle winner conformance
- playtest pack loader
- compile-playtest-content-pack CLI
- result: `6 files / 52 tests PASS`.

Additional combat/session/compiler chain:

- core combat resolver
- game-loop action/action-play/battle-cleanup/round-start
- golden combat-power/winner/VP flow
- ability interaction projection
- authoring interpreter
- executable card-pack compiler
- FB2-33 event combat outcome
- final re-run after updating the legitimate new pack cardinalities: `10 files / 135 tests PASS`.

Build/content checks:

- `npm run typecheck`: `PASS`.
- `git diff --check`: `PASS`.
- `npm run content:validate`: `PASS` — `7 masters, 8 servants, 20 events, 0 blocking issues`.
- `npm run content:compile`: `PASS` — same summary.
- `npm run verify:generated-content`: `PASS`.
- generated hashes after Mash registration:
  - content library: `9fc2efa25076c0cc95bd0bd02dd6499330398586db8fd6cc96521a6c343d96e7`
  - fixture: `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence report: `7596f87cf0f1f93eb9c1230af52405bf1365727416da946a117ea4a281f92133`

Production identity-routing audit under `packages/rules/src` (tests excluded):

- `servant.mash`: `0`
- `sc-mash`: `0`
- `玛修`: `0`
- Mash skill-name Chinese routing strings: `0`
- `SkillLib`: `0`

Result: `CLEAN`.

## Existing source-asset baseline limitation

`npm run test:source-assets` was also attempted. It reaches Mash registration, but this fixed Work does not contain the historical `chm-extract/` asset tree used by the previously registered characters/events, so it reports 93 pre-existing `MISSING_IMAGE` issues for those older source paths. The Mash development-image paths themselves were mechanically checked under `E:\Codex\FD\Fate_Domination-开发版` and were not among those missing-image findings.

For the same environmental reason, the product-display source-evidence test's filesystem existence assertion fails first on the pre-existing `servant.artoriac.overview` `chm-extract/...` path. Its structural/product checks for the now-eight servant roster, twelve-card decks/three in-game skills, and zero blocking validation issues pass. No historical source-evidence check is weakened and no fake source asset is created.

## Accounting / review boundary

This Candidate is a **formal owner migration**, but this report does not award credit before independent review.

- Before fresh R: formal/material remains `112/944`.
- On exact-Candidate `MIGRATION_ACCEPTED` plus A-sync/accounting, exactly these four Mash frozen identities are eligible to move the counter to `116/944`.
- `card.x-guard` and generic runtime capability work are zero-credit support surfaces.
- Do not select or implement the next owner until this exact owner Candidate is accepted and synchronized/accounted.

The exact Candidate SHA is frozen by the commit containing this report and must be mechanically recorded in the PR/handoff evidence before fresh R.

## R1 revision after fresh independent review

Canonical predecessor review evidence: https://github.com/binchen648/fd/pull/457#issuecomment-5845070537

Predecessor exact Candidate: `cd3e3abf7c1b0625484eda9910d29bf24cc8958c`. Fresh independent R returned `MIGRATION_NEEDS_REVISION` with four exact-scope findings. The successor revision closes all four together before a new fresh R:

1. **Snowflake Wall transient power lifecycle** — its physical-card attack modifier now carries explicit `until_leaves_active_area` lifecycle plus originating round. Power calculation ignores stale-round instances, and ordinary card cleanup removes only explicitly transient power modifiers. Regression covers same-card next-round reuse plus discard/cleanup/replay.
2. **Lord Camelot terrain composition** — the Mash effect now stores the structural transform `(base + 2) * 2` instead of a final absolute terrain value. The shared combat resolver applies that transform before the existing generic terrain multiplier pipeline, so active `basic.preparation` remains live. Interaction regression proves Miyama base 3 becomes 20 when both Lord Camelot and Preparation apply: `((3 + 2) * 2) * 2`.
3. **Cross-owner servant deck fail-closed** — executable deck mapping now requires canonical `servant_deck_card.ownerId` to equal the current servant archive id. A foreign Artoria servant-deck card injected into Mash's deck is rejected by the compiler.
4. **Guard owner-only lending projection** — the lending ability now includes the already-accepted generic direct `source_owned` condition, so the physical owner can project/activate lending while a borrower cannot see a re-lend legal action. Resolver ownership checks remain as a second boundary.

### Successor validation before fresh R

- focused five-file set: `5 files / 79 tests PASS`
  - Mash owner regression: `8/8 PASS`
  - executable-card-pack: `50/50 PASS`
  - match-session regressions: `7/7 PASS`
  - core combat resolver: `10/10 PASS`
  - compile-playtest-content-pack: `4/4 PASS`
- broader affected chain: `14 files / 176 tests PASS`
- `npm run content:validate`: `PASS — 7 masters, 8 servants, 20 events, 0 blocking issues`
- `npm run content:compile`: `PASS`
- `npm run verify:generated-content`: `PASS`
- `npm run typecheck`: `PASS`
- `git diff --check`: `PASS`
- successor generated hashes:
  - content library: `dc44eb2af01de1a4c9a1d4876735e4c5e1f4939a17ffd99043d2ed2cd66288f0`
  - fixture: `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence report: `7596f87cf0f1f93eb9c1230af52405bf1365727416da946a117ea4a281f92133`

Accounting remains unchanged before successor review: current-main formal/material `112/944`; no Mash credit is awarded until the successor exact Candidate receives `MIGRATION_ACCEPTED` and A synchronization/accounting. Historical frontier progress remains separate evidence/replay history.

The exact successor Candidate SHA is frozen by the revision commit containing this section and is recorded in the PR/handoff evidence after commit.
## R2 revision after successor fresh R

Canonical successor review evidence: https://github.com/binchen648/fd/pull/457#issuecomment-5845430482

Reviewed predecessor: `ab5f88c191d0383bd57b44d876f2389ace121a4f`. The fresh blocked-retry review returned `MIGRATION_NEEDS_REVISION` with two exact-scope findings. This revision closes both together without changing the four-skill owner scope:

1. **Real MatchSession Guard settlement** — `MatchSession.resolveBattlePhase()` now applies `settleLinkedOwnerCardsAfterBattles(...)` after all battlefield results are collected and before `applyBattleScoring(...)` consumes `battleResults`. Two real-session regressions cover owner-loss -> Mash hand and ordinary battle end -> Mash discard.
2. **Roster-stable MatchSession fixtures** — affected tests no longer assume Kintoki/Artoria Caster occupy fixed p5/p6 seats after Mash expands the production roster. They locate the intended servant through `session.pairings`; the recon continuation additionally places its named source card in a stable hand fixture instead of depending on shuffled initial deck position.

### R2 validation before fresh R

- `packages/rules/tests/match-session.test.ts`: `32/32 PASS` (including the two new real Guard settlement regressions and the three roster-stable tests).
- successor affected chain: `17 files / 221 tests PASS`.
- Mash owner regression remains `8/8 PASS`.
- executable-card-pack remains `50/50 PASS`.
- `npm run typecheck`: PASS.
- `npm run content:validate`: PASS — `7 masters, 8 servants, 20 events, 0 blocking issues`.
- `npm run content:compile`: PASS.
- `npm run verify:generated-content`: PASS.
- `git diff --check`: PASS.
- production identity-routing audit remains CLEAN for `servant.mash`, `sc-mash`, Mash/Guard Chinese-name routing and `SkillLib`.

Accounting remains unchanged before this successor is independently accepted: current-main formal/material `112/944`; exactly four Mash frozen identities are still the only candidate credit. Historical frontier progress remains separate replay/evidence history.
