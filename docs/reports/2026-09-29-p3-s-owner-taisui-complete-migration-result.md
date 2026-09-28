# P3-S-OWNER-TAISUI-COMPLETE-MIGRATION Result

Date: 2026-09-29
Base: `75df6b701feb5d614184ba235517b67eea283260`
Branch: `codex/s-p3-owner-taisui-complete-migration`
Owner root: `servant.taisui`
Classification: formal owner-complete migration
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Strict formal before fresh R: `144/944`, remaining `800`

## Accepted readiness prerequisite

Taisui's complete currently discoverable owner-readiness gap set was closed by PR #478, exact Candidate `3f6bc546406aa7efc7d5229cd3255109db218026`, fresh-R verdict `IMPLEMENTATION_ACCEPTED_CANDIDATE`, canonical same-attempt bounded relay `https://github.com/binchen648/fd/pull/478#issuecomment-5878360467`, then zero-credit A-sync `75df6b701feb5d614184ba235517b67eea283260`.

No additional readiness seam was introduced by this formal migration. `packages/rules/src/**` delta from Base is EMPTY.

## Formal owner scope

The frozen F1 owner set is exactly three identities:

- `servant.taisui.skill.sc-taisui-1` — 他人格（Alter Ego Class） — historical FM07 preservation-only;
- `servant.taisui.skill.sc-taisui-2` — 凶神 — newly creditable;
- `servant.taisui.skill.sc-taisui-3` — 太岁头上动土 — newly creditable.

The existing sc1 card object is preserved exactly from Base; its JSON object SHA-256 remains `a7fdd47c7d30259afd960a26b1534d2c9e11d30c4262c3fe2040a5059bd2f9ed`. The canonical archive now contains preserved sc1 plus sc2 + sc3. Frozen material overlap moves mechanically `145 -> 147`; exact additions are sc2 + sc3; removals `0`; duplicate frozen identities `0`. Material overlap is evidence only, not the formal ledger.

Frozen F1 text/static evidence retained by the new consumers:

- sc2 line hashes `6b1fbe27ab7f374dc56612465d96fb69ac183570df371373d015a9797a08aa60` and `85933ff0f392ea96e36ecdecf30cd78e142b047e32c21cc38a4154c5a76bf73b`; combined printed-text SHA-256 `b1f695d9bbad243bac35ccecf3112ec8c47af6c3ec4235a97725dcb1499fc95e`; type `魔术`, printed cost `2`, base Power `5`, final Rule 9.4 skill-zone gate `8`;
- sc3 line hashes `94b297fdf742361d2a1d4b9e17a08b4dec7f66143f3d48708105f52bef6032d6` and `2437c4a50471993774a4b78bc07e279a6f718a2c72f4fc5b71ba20a40600fe1e`; combined printed-text SHA-256 `82fd31ad1aae9fd200fdff14e6430df94a3d283195f71bc47d097aa69e2ca0a5`; type `魔术/宝具`, printed cost `7`, base Power `11`, final Rule 9.4 skill-zone gate `8`.

Legacy Reference handlers `core.taisui-calamity` / `core.taisui-awaken` remain evidence only and are not restored.

## Real owner behavior verification

Focused owner-complete regression: `6/6 PASS`.

It verifies:
- exact owner/card order, sc1 preservation hash, frozen F1 text hashes, static metadata, final 8-mana gates, and only the accepted PR #478 generic location-marker seams;
- real sc3 normal Outpost placement of the authoritative marker at the controller location;
- real sc2 passive opponent-departure follow using exact previous-location provenance, with controller movement excluded by the accepted gateway;
- real sc2 normal combat branch gives exactly +3 terrain advantage at the marker and nowhere else;
- real sc2 reversed combat branch only away from the marker and transfers at most one VP from each active marker-location opponent, clamped by current VP;
- real sc3 reversed Action unique midpoint convergence, coherent controller+marker movement, true-name reveal, and ordinary defeatable Defeat while honoring existing current-round defeat-ignore semantics;
- trusted MatchSession marker restore and no Taisui/card-name/printed-text/legacy-handler/`SkillLib` route in production runtime.

Directly affected serial verification: `10 files / 171 tests PASS`:
- owner-complete Taisui `6/6`;
- Taisui readiness `10/10`;
- authoring-interpreter `38/38`;
- executable-card-pack `50/50`;
- MatchSession `33/33`;
- movement `3/3`;
- game-loop action `2/2`;
- combat-resolver `10/10`;
- owner-complete Suzuka `6/6`;
- Ruler seal subsystem `13/13`.

Static gates:
- `FD_TOOLCHAIN_OK`;
- `npm run typecheck` PASS;
- `npm run content:validate` PASS — `7 masters / 12 servants / 20 events / 0 blocking issues`;
- `npm run content:compile` PASS with same summary;
- `npm run verify:generated-content` PASS with deterministic hashes unchanged:
  - content library `b2c446488a28c5036ac36557e09b563b54b11018d5396233a53f37ffdbff6923`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence report `f4ae33de4dc2832766064bdf46e277d9559398d4d34b45d7d05a0eb76744cd14`;
- `git diff --check` PASS before Candidate freeze;
- `packages/rules/src/**` delta EMPTY.

## Project-wide test boundary

The unfiltered Candidate full probe reports `19 failed / 166 passed files` and `38 failed / 1311 passed tests`. Exact Base A/B at `75df6b701feb5d614184ba235517b67eea283260` reports `18 failed / 165 passed files` and `33 failed / 1305 passed tests` and reproduces every stable tracked failure family seen on Candidate:

- stale/current-line historical count assertions and playtest-count expectations;
- legacy authoring/source-image/CHM path dependencies that are absent in this environment;
- `seven-servant-decks` historical Sherlock projection debt;
- M50-02 opponent-close historical debt;
- resource-numeric and golden-card historical product-content debt;
- the same MatchSession and complex-skills five-second full-run timing failures.

The only additional Candidate-worktree full-probe failure file is local ignored `packages/rules/tests/.fd-shiki-runtime-debug.test.ts`, contributing `5` failures; it is not tracked Candidate content and is absent from the clean Base Helper checkout.

The stale Astolfo material-count assertion proves the intended formal delta mechanically: exact Base has `145` frozen material identities while Candidate has `147`, exactly Taisui sc2 + sc3.

The two full-run timeout files were immediately re-run serially on Candidate and pass `70/70` total (`match-session 33/33`, `complex-skills 37/37`). No Candidate-caused exact-scope regression was found.

## Accounting boundary

Before fresh R and A-sync, strict formal accounting remains `144/944`, remaining `800`.

This Candidate claims exactly two newly creditable frozen identities: sc2 + sc3. sc1 remains preservation-only and cannot be credited again. No credit is granted by implementation alone.

Only after exact-Candidate `MIGRATION_ACCEPTED` plus A-sync/accounting may the strict ledger move:

- `144 + 2 = 146`;
- accepted synchronized target: `146/944`;
- remaining: `798`.

Allowed verdicts:
- `MIGRATION_ACCEPTED`
- `MIGRATION_NEEDS_REVISION`
- `MIGRATION_BLOCKED`
