# P3-FM06 Presence Concealment Migration - 2026-09-16

Role: Codex S
Status: `MIGRATION_COMPLETE_CANDIDATE`
Base / accepted FB2-12 synchronization: `35aa5ef063fe6d8c6c611f70f0696bf111a80657`
Accepted runtime review: P3-R35 `ee3367b1ea17e6db9d98b1ae42d769fae6122d5e`
FB2-12 candidate: `4c97449de07b1e7a859d8ef43b60e34069541830`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference metadata: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Exact migration batch

FM06 migrates exactly these twelve frozen identities and no others:

- `servant.corday.skill.sc-corday-1`
- `servant.danzou.skill.sc-danzou-3`
- `servant.hassan.skill.sc-hassan-1`
- `servant.hassanhf.skill.sc-hassanhf-3`
- `servant.hassanser.skill.sc-hassanser-1`
- `servant.izou.skill.sc-izou-3`
- `servant.jekyll.skill.sc-jekyll-3`
- `servant.kama.skill.sc-kama-3`
- `servant.kiritsugu.skill.sc-kiritsugu-1`
- `servant.kotarou.skill.sc-kotarou-1`
- `servant.semiramis.skill.sc-semiramis-1`
- `servant.stheno.skill.sc-stheno-1`

Independent pre-commit reconciliation against frozen F1 reports canonical overlap `79/944 -> 91/944`, exactly 12 additions and 0 removals. Sion Presence Concealment EX is absent from the migrated authoring set.

## Frozen source and Reference preservation

All twelve cards preserve the same frozen F1 full-text SHA:

`29b3f6c71d8bc5eb6f004d930e5b753f44ee766fb2e47ea6b9f0d89f5fa9643f`

and the same four F1 inventory clause-source SHAs, in printed order:

- `ee2d737d979d2141319a55ff72d275847a90be89e5173c3f5030e2083d4dc4cb`
- `1e518f04fe63700d7a456ca83de546eb681dd9993f483be7598e5bdac7830b25`
- `0484d7c0b9f4cef66623fdfe67831240d883b04f3203f2acc7e2d6151c2a8217`
- `1f105508aace520b9a8b6703d50633c174f754856c10c4040b05570cfca0b871`

All twelve preserve Reference handler `core.presence-concealment`, exact legacy IDs, and locked static card metadata: type `迅捷`, printed cost `3`, base Power `4`, historical requirement `3`.

Owner class is preserved from locked Reference rather than inferred from skill wording: `servant.kiritsugu` remains class `Master`; the other eleven selected owners are `Assassin`.

Historical requirement 3 remains evidence metadata only. Canonical authoring uses the already-established final skill-zone rule `skill_zone_mana_at_least = 8`; the printed card cost remains 3 and is paid normally once that gate is met.

## Accepted structural authoring

Each migrated card uses only the P3-R35 / FB2-12 accepted identity-free semantic:

- optional combat trigger `after_battle_power_calculated`;
- source must be active and face up;
- condition `controller_strict_second_battle_power`;
- no target selection;
- effect `defeat_highest_power_opponents`;
- response window `post_power_response`, turn order, decline allowed;
- once per round, one use, this-card scope;
- no additional costs, creates, lifecycle state, modifiers, host directives, formula expansion, or unrelated trigger semantics.

No runtime production file is changed by FM06.

## Existing archive preservation

Eleven selected owners required a new minimal servant archive. Semiramis already had the accepted FM05 Territory Creation skill in `servant.semiramis.json`; FM06 appends Presence Concealment to that archive instead of replacing it.

A machine comparison of `servant.semiramis.skill.sc-semiramis-2` against the exact A-sync base proves the entire existing FM05 card object is byte-semantically unchanged (`JSON object equality = true`). Only the archive-level source-policy note was generalized to describe per-card accepted contracts, plus the new FM06 card was added.

The older FM05 regression had one archive-container assertion that required every FM05 owner archive to contain exactly one card. Because Semiramis now legitimately accumulates a second independently accepted card, that assertion was narrowed to require exactly one occurrence of the specific FM05 card ID. All FM05 semantic assertions remain unchanged and green.

## Validation

- fresh dependency install: PASS;
- typecheck: PASS;
- FM06 + FB2-12 + FM05 focused: `3 files / 20 tests PASS`;
- rules regression/core plus FM05/FM06 authoring: `66 files / 388 tests PASS`;
- content validation: `7 masters / 7 servants / 20 events / 0 blocking issues`;
- deterministic generated-content hashes unchanged:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`;
- standard full CI: `118 files / 720 tests PASS`;
- runtime production diff from the accepted A-sync base: `0`;
- `git diff --check`: PASS.

The real migrated Corday regression executes `[5, 10, 10]` through the accepted pre-scoring response: the response is offered before BattleResult creation, both highest opponents are battle-locally defeated, and the controller becomes the final winner through the existing BattleResult/scoring path.

## Material coverage burn-down

Fresh S coverage after materializing FM06 reports:

- archives `69 -> 80` (`+11`, because Semiramis reused an existing archive);
- cards `101 -> 113` (`+12`);
- abilities `200 -> 212` (`+12`);
- raw routing `new=22 / legacyExecute=3 / legacyResolve=127 / dual=0 / notClassifiable=60 / taxonomyWarnings=124`;
- compiled definition hash unchanged at `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`;
- compiled cards `70`, characters `14`, blocking issues `0`.

`notClassifiable` rises `48 -> 60` because the twelve newly materialized authoring abilities are now visible to the legacy coverage taxonomy; this is not a runtime fallback promotion and does not alter the accepted FB2-12 semantic route. The generated coverage artifact contains real material changes and is intentionally left unstaged for the downstream A material synchronization, following the prior FM migration workflow.

## Candidate boundary

`MIGRATION_COMPLETE_CANDIDATE`.

This candidate claims only the exact twelve-member Presence Concealment migration under accepted FB2-12. It does not promote Sion EX, broad Trigger, generic defeat, broad Target Selection, global player defeat/elimination, or any other Special handler.
