# P3-S owner-complete Siegfried migration result

## Task / lineage

- Task: `P3-S-OWNER-SIEGFRIED-COMPLETE-MIGRATION`
- Branch: `codex/s-p3-owner-siegfried-complete-migration`
- Exact Base: `3412aac11f14d9e8012e4aa8c4761fccbf58e581`
- Base is the accepted Shuten A-sync/accounting commit.
- Workflow unit: one formal owner-complete batch; no fixed-50 expansion and no per-skill split.
- Strict formal accounting before review: `126/944`; no Siegfried credit is claimed before fresh independent R + A-sync/accounting.

## Exact frozen owner scope

All three current-main remaining frozen Siegfried identities are migrated together:

1. `servant.siegfried.skill.sc-siegfried-1` — 隐身衣
2. `servant.siegfried.skill.sc-siegfried-2` — 恶龙之血铠
3. `servant.siegfried.skill.sc-siegfried-3` — 幻想大剑·天魔失坠

The frozen inventory denominator remains `944`. If and only if this exact owner Candidate is later `MIGRATION_ACCEPTED` and synchronized, exactly three identities become eligible and strict accounting becomes `129/944` with `815` remaining.

## Source recertification

The three frozen texts were mechanically re-read from `data/phase3/full-roster-ability-inventory.json`, whose source chain points to locked Reference commit `b2f9fa15fba07c63530bbf4612b03b8b704755f9`, `FD全卡图鉴V2.0.chm -> 从者/剑士/英文版/齐格飞.htm`, and development image `Fate_Domination-开发版/images/servants/齐格飞.png`.

The locked Reference was also mechanically inspected at the exact commit:

- sc-siegfried-1 confirmed override: action phase, active-card requirement, `card.played` + `round.ended`, historical `core.siegfried-invisibility-cloak` FULL route.
- sc-siegfried-2 generated structured override: cost 3, mana requirement 8, base power 9, true-name release on play, opponent movement onto controller battlefield closes source while revealed/engaged.
- sc-siegfried-3 confirmed override: action phase, active-card requirement, hand reveal power bonus `minBasePower=4 / perCard=2 / max=6`, FULL route.

Historical handler identities are evidence only. Production runtime remains identity-free.

## Implemented semantics

### sc-siegfried-1 — 隐身衣

- Each successful physical play loses VP equal to that physical card's current game play ordinal: first play loses 1, second loses 2, etc.; VP floors at zero.
- Action-phase activation hides the controller servant true name through round end and restores the pre-activation reveal state at round end.
- During the effect, abilities controlled by another player at the same location do not affect the protected controller. The implementation is a generic rule modifier rather than Siegfried/card-name routing.
- Focused coverage includes explicit player-target filtering and an untargeted same-location opponent mass-discard path, plus hidden->hidden and revealed->temporary-hidden->restored name states.

### sc-siegfried-2 — 恶龙之血铠

- Printed 8-mana skill-zone requirement, cost 3, base power 9 and Noble-Phantasm attribute are preserved.
- Playing the card reveals the servant package.
- Once revealed and at a battlefield, an opponent movement event into the controller's battlefield closes the active source; movement elsewhere does not.
- Existing generic trusted location-event relation and event-location-equals-controller conditions are reused rather than introducing an identity handler.

### sc-siegfried-3 — 幻想大剑·天魔失坠

- Printed 8-mana skill-zone requirement, cost 7, base power 9, Strength/Noble-Phantasm attributes and true-name release are preserved.
- The action reveals the controller's current hand for the produced projection revision.
- Each current hand card with printed/base power at least 4 contributes +2 combat total power, capped at +6, through the current round only.
- The power bonus is a generic owner-self combat-total modifier and is removed by round transition.

## Generic runtime / content work

- Added `owner-self-mechanics.ts` for exact/fail-closed play-count VP loss, temporary servant concealment and reveal-hand round-power mechanics.
- Added `player-ability-immunity.ts` for the exact same-location other-player ability-effect immunity modifier.
- Integrated the immunity into explicit player target projection and existing same-location opponent/mass effect seams; existing non-Siegfried semantics are still data-driven.
- Added generic combat-total power adjustment consumption in the combat resolver.
- Loader admits only exact bounded new mechanic/rule shapes; widened/extra-field near matches are unsupported.
- Added Siegfried authoring archive and registered it in `fd-playtest-v1`; generated production roster becomes 11 servants with zero blocking content issues.
- Existing seed/cardinality-sensitive tests touched by the 11-servant product roster were updated only where mechanically affected.

## Final candidate validation before commit

Toolchain:

- `tools\verify-toolchain.cmd` => `FD_TOOLCHAIN_OK`.

Focused/affected chain:

- Siegfried owner-complete regression: `8/8 PASS`.
- executable-card-pack: `50/50 PASS`.
- MatchSession: `33/33 PASS` when run in the focused/affected chain.
- authoring interpreter: `38/38 PASS`.
- combat resolver: `10/10 PASS`.
- playtest pack loader: `21/21 PASS`.
- compile-playtest-content-pack CLI: `4/4 PASS`.
- aggregate focused/affected run: `7 files / 164 tests PASS`.
- `npm run typecheck`: PASS.
- `npm run content:validate`: PASS — `7 masters, 11 servants, 20 events, 0 blocking issues`.
- `npm run content:compile`: PASS — same summary.
- `npm run verify:generated-content`: PASS.
  - content library: `95033ed3dcc75a47c3cc83c626cd8e53ce0a01c186466c0b91d66b33c1b1b58e`
  - fixture: `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence report: `69a2059bbbb60ee60e01982f0c49dfb82701739379121c2acc0b9db3211d0c12`
- `git diff --check`: PASS.
- Production identity-routing audit under `packages/rules/src`: `servant.siegfried=0`, `sc-siegfried=0`, `齐格飞=0`, Siegfried card-name literals = 0, `SkillLib=0`.
- Declared Siegfried development image exists mechanically at `E:\Codex\FD\Fate_Domination-开发版\images\servants\齐格飞.png`.

## Known fixed-environment / historical test baselines

`npm run test:source-assets` still reports the same 93 missing historical `chm-extract/...` image paths already present before this owner; the Siegfried development image is not among those missing paths. The product-display servant test likewise has the existing `servant.artoriac.overview` missing historical image failure while its other three checks pass.

A supplementary broad `npm run test:ci` was also run. It is not currently green on this current-main line: `1026 PASS / 17 FAIL`. The failures include historical/debug suites outside this owner scope (for example the ignored-style `.fd-shiki-runtime-debug.test.ts`), stale hard-coded historical migration/roster fixtures (for example the old Astolfo `112/944` assertion and seven-servant fixture), M50-02 legacy replay expectations, and timeout/seed-sensitive broad MatchSession regressions. None of those failing test files is changed by this owner batch, while the task-required focused/affected Siegfried/runtime/session/content chain above is green. These failures are recorded rather than silently claimed green or rewritten outside the owner task.

## Review boundary

This report freezes implementation evidence only. It does not self-award migration credit. Fresh independent R must review the exact pushed Candidate. Until exact-Candidate `MIGRATION_ACCEPTED` and subsequent A-sync/accounting, strict formal accounting remains `126/944`.


## Fresh R1 revision closure

Canonical Coordinator bounded relay for the completed fresh R1 attempt: https://github.com/binchen648/fd/pull/460#issuecomment-5847738666

R1 verdict on predecessor `def3c80f889f66c4fc942a83fe264449a138d441`: `MIGRATION_NEEDS_REVISION`. Both blocking findings are closed in the successor revision carried by this branch:

- Combat-total bonus: `player.combatTotalPower` modifiers are excluded from per-card `calculateCardPower()` and consumed exactly once by `deriveBattleParticipantsFromState()` through the generic player-total adjustment. Focused regression now uses two simultaneous active authored 9-power cards plus three qualifying hand cards and proves 18 -> 24, not 30.
- Temporary concealment: the shared true-name reveal path now honors the active generic temporary-concealment marker, so a same-round true-name release cannot reveal the servant early. Focused regression proves revealed baseline -> cloak hidden -> same-round Armor true-name release remains hidden -> round-end restores the revealed baseline.

Successor validation after both fixes:

- Siegfried focused regression: `9/9 PASS`.
- Affected serial run: `7 files / 165 tests PASS` (combat resolver, Siegfried regression, playtest pack loader, authoring interpreter, compile-playtest-content-pack, executable-card-pack, MatchSession).
- A prior parallel affected run had one compile CLI test exceed the 5s per-test timeout under contention; the same test passed `4/4` isolated and the full affected set passed `165/165` serially.
- `npm run typecheck`: PASS.
- `npm run content:validate`: PASS — `7 masters, 11 servants, 20 events, 0 blocking issues`.
- `npm run content:compile`: PASS — same summary.
- `npm run verify:generated-content`: PASS with the same deterministic hashes recorded above.
- `git diff --check`: PASS.
- Production identity-routing audit under `packages/rules/src`: Siegfried identity/card-name/Chinese-text/SkillLib hits remain zero.

No migration credit is claimed by this report; exact successor Candidate must receive fresh independent R and subsequent A-sync/accounting.

## Successor R2 closure — typed servant reveal path

Reviewed predecessor: `83c55fe676a7cd024056b955a34befac28228c14`.

Fresh R reported one remaining exact-scope blocker: the interpreter reveal path respected temporary concealment, but `resolution-dataflow.ts::revealServantPackage()` still revealed the servant package during the same-round cloak window.

Closure in this successor:

- Added one generic shared predicate, `servantRevealSuppressedByTemporaryConcealment(state, playerId)`, in owner-self mechanics.
- The ordinary interpreter reveal path and typed `reveal_servant_package` dataflow now consume the same temporary-concealment gate.
- When concealment is active, typed reveal returns `no_op`, leaves `revealedServants` unchanged, and emits no `servant_package_revealed` event.
- Round-end behavior is unchanged: the captured pre-cloak reveal baseline is restored exactly once after the concealment marker expires.
- New focused regression covers revealed baseline -> cloak -> typed servant-package reveal -> still hidden/no reveal event -> round_end -> baseline revealed again.

Successor verification before freeze:

- focused Siegfried regression: `10/10 PASS`.
- direct typed reveal/battle-loss/dataflow regression set: `3 files / 33 tests PASS`.
- final affected serial chain including combat resolver, Siegfried, pack loader, authoring interpreter, compile CLI, executable pack, MatchSession, resolution dataflow, and battle-loss reveal: `9 files / 189 tests PASS`.
- `npm run typecheck`: PASS.
- `npm run content:validate`: PASS — `7 masters, 11 servants, 20 events, 0 blocking issues`.
- `npm run content:compile`: PASS — same summary.
- `npm run verify:generated-content`: PASS; deterministic hashes remain `95033ed3dcc75a47c3cc83c626cd8e53ce0a01c186466c0b91d66b33c1b1b58e` / `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057` / `69a2059bbbb60ee60e01982f0c49dfb82701739379121c2acc0b9db3211d0c12`.
- `git diff --check`: PASS.
- production identity-routing audit under `packages/rules/src`: Siegfried IDs/names/Chinese card names/SkillLib all `0` hits.

Formal accounting remains `126/944` until this successor receives fresh independent `MIGRATION_ACCEPTED` and A-sync/accounting.
