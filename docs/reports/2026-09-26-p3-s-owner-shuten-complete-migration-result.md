# P3-S owner-complete Shuten migration result

## Task / lineage

- Task: `P3-S-OWNER-SHUTEN-COMPLETE-MIGRATION`
- Branch: `codex/s-p3-owner-shuten-complete-migration`
- Exact Base: `0ea4c4d97225cab3931cdf13d8453b21116d760e`
- Base is the canonical Sherlock acceptance synchronization commit.
- Candidate: bound by the PR Phase 3 manifest / exact pushed HEAD containing this report.
- Workflow unit: formal one-owner complete migration; no fixed-50 expansion and no per-skill split.

## Exact frozen owner scope

This candidate migrates all three remaining `servant.shuten` frozen identities together:

1. `servant.shuten.skill.sc-shuten-1` — 放荡之宴
2. `servant.shuten.skill.sc-shuten-2` — 神便鬼毒酒
3. `servant.shuten.skill.sc-shuten-3` — 百花缭乱·我爱你

Formal accounting before review remains `123/944`; this candidate claims no credit before fresh independent `MIGRATION_ACCEPTED` plus A-sync/accounting. If accepted and synchronized, candidate credit is exactly `+3`, yielding `126/944` and `818` remaining.

## Source grounding

Frozen semantics were recovered from the Phase 3 frozen inventory and the existing confirmed Shuten source-evidence overrides, grounded to the locked reference metadata commit `b2f9fa15fba07c63530bbf4612b03b8b704755f9`. The development image `E:\Codex\FD\Fate_Domination-开发版\images\servants\酒吞童子.png` exists locally and is the source image used by the new authoring archive.

No production runtime route under `packages/rules/src` contains Shuten ids, Shuten names, `core.shuten-*`, or `SkillLib` routing.

## Implemented semantics

### sc-shuten-1 — 放荡之宴

- Preparation-phase action pays exactly 2 mana and selects one enabled battlefield.
- The source skill card is placed publicly at that battlefield with a trusted runtime battlefield binding until round end.
- While the source is live, every other player physically at that battlefield pays `+2` to playable cards in hand or skill zone; the controller and players elsewhere are unaffected.
- The battle-phase terminal event grants `+1 VP` to every active player physically at the source battlefield.
- Round end returns the source to its owner skill zone and clears the battlefield binding.
- The generic battlefield-source mechanic shapes are exact/fail-closed.

### sc-shuten-2 — 神便鬼毒酒

- The card is an exact required-additional-play card and cannot be played alone in a regular batch.
- The explicit printed exception bypasses the ordinary 8-mana skill-zone gate; the card still pays its printed cost.
- At battle start, while the card is active, every active face-up basic attack in the controller's current fight acquires a physical-card once-per-game play limit.
- Server-owned per-instance play counts include plays that happened before the dynamic limit was granted, so an already-used physical card cannot evade the newly acquired limit.
- Dynamic limit authority survives MatchSession serialization/restore.

### sc-shuten-3 — 百花缭乱·我爱你

- Playing the card performs the printed true-name reveal.
- During combat, once per round, the active card selects one active engaged opponent at the same battlefield.
- Removal count is `ceil(game-start deck cardinality / 4)`, using an immutable server-owned starting-deck snapshot captured before the first-round draw rather than the current deck size.
- That many cards are removed from the current deck top, bounded by cards actually remaining.
- If the target deck is empty after removal, the target receives the existing source-grounded defeat marker/event.
- Starting-deck authority and the new trusted runtime fields survive MatchSession serialization/restore; malformed restored references fail closed.

## Runtime / compiler work

- Added identity-free `battlefield-source-mechanics.ts` exact classifiers for battlefield placement, location-bound cost aura, combat basic-card once-per-game grant, location reward, round cleanup, and starting-deck fraction removal.
- Extended loader support only for those exact mechanic shapes; widened near-matches report `unsupported`.
- Added trusted runtime state for battlefield source binding, immutable starting deck sizes, physical play counts, and dynamically granted per-game limits.
- MatchSession restore validation authenticates the new map/list/card references and rejects forged bindings.
- Added Shuten authoring archive and playtest pack entry; compiled roster becomes 10 servants while keeping every starting deck at 12 cards.
- Existing seed-dependent MatchSession regressions were moved to a deterministic seed that still includes their intended servants after the roster expansion; the long 11-round smoke receives an explicit 10s timeout because the expanded production roster pushed that pre-existing smoke to the old 5s boundary.

## Verification

Actual final validation on the candidate worktree before commit:

- `tools\verify-toolchain.cmd` — `FD_TOOLCHAIN_OK`.
- Focused Shuten regression — `7/7 PASS`.
- Affected green chain (Shuten + executable pack + MatchSession + authoring interpreter + pack loader + compile CLI) — `6 files / 153 tests PASS`.
- Product-content non-asset cases — `3 PASS / 1 deliberately excluded source-asset existence case`.
- `npm run typecheck` — PASS.
- `npm run content:validate` — PASS: `7 masters, 10 servants, 20 events, 0 blocking issues`.
- `npm run content:compile` — PASS with the same summary.
- `npm run verify:generated-content` — PASS.
  - content library SHA-256: `68725e6b24c9ab83d082563e7d55b48a5d82c8473a73cd2af0df6f66234f33f5`
  - fixture SHA-256: `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence report SHA-256: `1ee2d108bdacee00c66bd15d9102632d09a90a084440c7b01d19cd9023d0c39b`
- `git diff --check` — PASS.
- Production identity-routing audit under `packages/rules/src` for `servant.shuten`, `sc-shuten`, `酒吞`, `core.shuten`, `SkillLib` — CLEAN.

## Environment-only source-asset baseline

Running the complete `packages/content/src/__tests__/fd-playtest-servants.test.ts` still produces exactly one known environment-only failure at `servant.artoriac.overview`: this fixed Work does not contain the historical `chm-extract` asset tree. The other three tests pass, and the Shuten development image exists at its declared local source path. This is the same documented fixed-environment baseline from the preceding owner migrations and is not introduced by Shuten semantics.

## Review state

Fresh independent R is required on the exact pushed Candidate. Until `MIGRATION_ACCEPTED` is canonically evidenced and A-sync/accounting is completed, strict formal/material accounting remains `123/944`.
