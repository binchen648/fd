# P3-S Owner-Complete Tamamo Migration Result

Date: 2026-09-29
Base: `9b138e98ecc10492d93cc3bebbe0066484ee0c37`
Branch: `codex/s-p3-owner-tamamo-complete-migration`
Owner root: `servant.tamamo`
Classification: formal owner-complete migration
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Strict formal accounting before review/A-sync: `146/944`, remaining `798`

## Accepted prerequisite

Readiness PR #481 successor Candidate `472d7d7cb6ed16a0d526ff91a68de0e1fe12d3da` received fresh-R `IMPLEMENTATION_ACCEPTED_CANDIDATE`; canonical same-attempt relay is `https://github.com/binchen648/fd/pull/481#issuecomment-5882572670`. Zero-credit A-sync `9b138e98ecc10492d93cc3bebbe0066484ee0c37` rescanned the complete owner and found no additional currently discoverable source-grounded readiness blocker.

## Formal owner archive

`data/authoring/servants/servant.tamamo.json` materializes the complete frozen owner set in one archive:

1. `servant.tamamo.skill.sc-tamamo-1` — 水天日光天照八野镇石;
2. `servant.tamamo.skill.sc-tamamo-2` — 荼枳尼天法;
3. `servant.tamamo.skill.sc-tamamo-3` — 水天日光天照八野镇石.

F1 clause hashes and locked-Reference static metadata are recorded on each card. Card metadata is:

- sc1: `魔术/宝具`, attributes `魔术/宝具`, printed cost 1, base Power 1, final skill-zone threshold 8;
- sc2: `魔术`, printed cost 0, base Power 4, authoritative requirement 0;
- sc3: `魔术`, printed cost 3, base Power 6, legacy requirement 3 retained as evidence while final skill-zone threshold is 8.

The archive consumes only the accepted PR #481 generic readiness family:

- sc1 `倾注`: `play_all_sealed_attacks` with ordinary aggregate card costs, per-card 1-mana reseal or controller-discard disposition after battle;
- sc2 `变化`: current-round replacement of `card.cardpreparation` + `card.cardluck` attributes with `魔术`;
- sc2 `广日照`: effective Magic attacks are protected against other-player deactivation/close and Power reduction while self-originating negative modifiers remain effective;
- sc3 `超然`: combat arm followed by after-battle selection/sealing of one qualifying same-location active basic Magic/Luck/Preparation attack under the sc3 physical host.

The two true-name abilities use the accepted exact reveal-on-use semantic. The shared seal key is authoring data only; production runtime remains identity-free.

## Verification

Focused formal regression: `6/6 PASS`. It proves exact frozen card metadata and accepted shapes, final skill-zone gates, real sc2 attribute replacement and production Power-reducer protection, real sc3 physical sealing, real sc1 Cascade cost/reseal lifecycle, MatchSession provenance round-trip, and production identity audit.

Directly affected green verification: `11 files / 262 tests PASS`, covering formal Tamamo, Tamamo readiness, authoring interpreter, executable pack, MatchSession, card-close, FB2-49 close interaction, Stheno Divine Core readiness, Suzuka readiness, Taisui location-marker readiness, and complex-skills production regressions.

Static gates:

- `FD_TOOLCHAIN_OK`;
- `npm run typecheck` PASS;
- `npm run content:validate` PASS — `7 masters / 12 servants / 20 events / 0 blocking issues`;
- `npm run content:compile` PASS with the same result;
- `npm run verify:generated-content` PASS:
  - content library `b2c446488a28c5036ac36557e09b563b54b11018d5396233a53f37ffdbff6923`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence report `f4ae33de4dc2832766064bdf46e277d9559398d4d34b45d7d05a0eb76744cd14`;
- locked Reference clean/exact at `b2f9fa15fba07c63530bbf4612b03b8b704755f9`;
- `git diff --check` PASS;
- formal `packages/rules/src/**` delta from Base is EMPTY.

No Tamamo/card-name/printed-text runtime parser, Reference identity-handler route, or `SkillLib` fallback is introduced by the formal consumer migration.

## Accounting boundary

This Candidate claims no credit before fresh R and A-sync. Strict accounting remains `146/944`, remaining `798`.

If exact Candidate receives `MIGRATION_ACCEPTED`, one subsequent A-sync/accounting transaction may add exactly the three frozen Tamamo identities and move accounting to **`149/944`**, remaining **`795`**.
