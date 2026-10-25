# P3-FM06 current-main Presence Concealment authoring candidate

Status: `MIGRATION_CANDIDATE` only. This report is not Reviewer acceptance, credit, merge, or A-sync.

## Lineage and scope

- Exact Base: `284731d8e24f30cf1d1794dd951f735cc2a98b4b`.
- Branch: `codex/s-p3-fm06-current-main-20261025`.
- The Base contains accepted FB2-02, FB2-11, and FB2-12 runtime/test dependencies. No historical FM06 branch or Candidate was cherry-picked.
- Changes are authoring-only: twelve servant archives, one focused migration test, and this report. Runtime, coverage, generated artifacts, task index, governance, and unrelated servants are untouched.

## Exact migration set

`servant.corday.skill.sc-corday-1`, `servant.danzou.skill.sc-danzou-3`, `servant.hassan.skill.sc-hassan-1`, `servant.hassanhf.skill.sc-hassanhf-3`, `servant.hassanser.skill.sc-hassanser-1`, `servant.izou.skill.sc-izou-3`, `servant.jekyll.skill.sc-jekyll-3`, `servant.kama.skill.sc-kama-3`, `servant.kiritsugu.skill.sc-kiritsugu-1`, `servant.kotarou.skill.sc-kotarou-1`, `servant.semiramis.skill.sc-semiramis-1`, `servant.stheno.skill.sc-stheno-1`.

All twelve preserve frozen full-text SHA `29b3f6c71d8bc5eb6f004d930e5b753f44ee766fb2e47ea6b9f0d89f5fa9643f`, the four F1 clause-source SHA values, handler `core.presence-concealment`, Swift/cost 3/base Power 4/reference requirement 3, and final skill-zone gate 8. Kiritsugu remains Reference class Master; the other eleven owners remain Assassin. Semiramis retains its accepted FM05 Territory Creation card unchanged and adds only Presence Concealment skill 1. Sion EX is excluded.

## Accepted structural contract

Each ability is the identity-free accepted FB2-12 shape: optional combat trigger `after_battle_power_calculated`, active source, `controller_strict_second_battle_power`, no targets/cost/creates/modifiers/lifecycle, `defeat_highest_power_opponents`, `post_power_response` in turn order with decline, per-round one-use this-card limit, and automatic execution. No identity/name/text routing or runtime fallback is introduced.

## Verification receipt

- FM06 authoring focused: 4/4.
- FB2-02 focused: 9/9.
- FB2-11 focused: 7/7.
- FB2-12 runtime focused: 10/10.
- Combined focused: 30/30.
- `npm run typecheck`: passed.
- `npm run content:validate`: passed, 7 masters / 7 servants / 20 events / 0 blocking issues.
- `npm run verify:generated-content`: passed with unchanged hashes:
  - `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`
  - `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- `git diff --check`: passed.

This Candidate makes no acceptance or migration-credit claim; it is ready for independent Reviewer review on the exact current-main Base.
