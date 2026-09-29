# P3-S Owner-Complete Tesla Migration Result

Date: 2026-09-29
Base: `f2aaf28bc1f967c6b1197424b9647321e85d7703`
Branch: `codex/s-p3-owner-tesla-complete-migration`
Owner root: `servant.tesla`
Classification: formal owner-complete migration
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Strict formal accounting before review/A-sync: `151/944`, remaining `793`

## Accepted prerequisite

Readiness PR #485 exact Candidate `e55c6727889f2c96c9ece71a1490b4edae58788d` received fresh-R `IMPLEMENTATION_ACCEPTED_CANDIDATE`; canonical same-attempt bounded relay is `https://github.com/binchen648/fd/pull/485#issuecomment-5888328096`. Zero-credit A-sync `f2aaf28bc1f967c6b1197424b9647321e85d7703` rescanned the complete Tesla owner and found no additional currently discoverable readiness gap.

## Formal owner archive

`data/authoring/servants/servant.tesla.json` materializes the complete frozen owner set in one archive:

1. `servant.tesla.skill.sc-tesla-1` — 雷电之手;
2. `servant.tesla.skill.sc-tesla-2` — 人类神话·雷电降临;
3. `servant.tesla.skill.sc-tesla-3` — 人类神话·雷电降临.

F1 clause hashes and locked-Reference static metadata are recorded on each card. Static metadata is:

- sc1: `特殊`, printed cost `6`, base Power `0`, legacy requirement `6`; final skill-zone threshold `8` is authoritative under final rules 9.4;
- sc2: `宝具`, printed cost `0`, base Power `3`, final/legacy threshold `8`;
- sc3: `魔术/宝具`, printed cost `5`, base Power `12`, final/legacy threshold `8`.

The archive consumes only the accepted PR #485 generic mana-transaction readiness family:

- sc1 residual spend reward: another active same-location player spending at least 2 mana grants the controller 2 mana;
- sc1 storage overflow: each genuine storage-cap overflow adds +5 current-round total Power and arms source-bound canonical battle-terminal close;
- sc2 overload passive: a same-battlefield opponent suffering genuine storage overflow is defeated subject to generic other-player ability immunity and battle-loss immunity;
- sc2 on-play: lose all remaining controller mana and add exactly that amount to current-round total Power without treating the loss as a spend;
- sc3 on-play: all active same-location opponents gain 2 mana through normal `grantMana`;
- sc3 combat: the same +2 grant is mandatory, automatically scheduled through the accepted combat window/decision progression, once per round/source, and still composes with normal storage-overflow reactions.

sc2/sc3 true-name release is authored as a separate canonical `declaration_reveal` ability. This deliberately keeps the privileged mana-transaction ability bodies at the exact accepted whole-ability shapes while preserving `【真名解放】` on declaration. No privileged runtime gateway is widened to carry unrelated visibility fields.

## Verification

Focused formal regression: `7/7 PASS`. It proves exact frozen owner/card metadata and printed-text hashes, final 8-mana skill-zone gates and printed costs, exact accepted privileged shapes, real sc1 spend/overflow/terminal-close behavior, real sc2 overflow defeat and lose-all-mana Power conversion with true-name reveal, real sc3 on-play plus mandatory once-per-round combat grants with true-name reveal, MatchSession overflow-marker restore, and production identity audit.

Directly affected green verification: `8 files / 156 tests PASS`, covering formal Tesla, Tesla readiness, authoring interpreter, executable card pack, full MatchSession, movement, card action play, and game-loop action play.

Static gates:

- `FD_TOOLCHAIN_OK`;
- `npm run typecheck` PASS;
- `npm run content:validate` PASS — `7 masters / 12 servants / 20 events / 0 blocking issues`;
- `npm run content:compile` PASS with the same result;
- `npm run verify:generated-content` PASS with deterministic hashes unchanged:
  - content library `b2c446488a28c5036ac36557e09b563b54b11018d5396233a53f37ffdbff6923`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence report `f4ae33de4dc2832766064bdf46e277d9559398d4d34b45d7d05a0eb76744cd14`;
- locked Reference clean/exact at `b2f9fa15fba07c63530bbf4612b03b8b704755f9`;
- `git diff --check` PASS;
- formal `packages/rules/src/**` delta from Base is EMPTY.

No Tesla/card-name/printed-text runtime parser, Reference identity-handler route, legacy `core.tesla-*` handler, or `SkillLib` fallback is introduced by this formal consumer migration.

## Accounting boundary

This Candidate claims no credit before fresh R and A-sync. Strict accounting remains `151/944`, remaining `793`.

All three frozen Tesla identities are new canonical authoring identities with no current/historical Tesla archive predecessor. If the exact formal Candidate receives `MIGRATION_ACCEPTED`, one subsequent A-sync/accounting transaction may add exactly `+3` and move accounting to **`154/944`**, remaining **`790`**.
