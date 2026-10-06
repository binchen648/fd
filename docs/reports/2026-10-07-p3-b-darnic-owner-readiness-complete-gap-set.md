# P3-B Darnic Owner Readiness Complete Gap Set

Date: 2026-10-07
Task: `P3-B-DARNIC-OWNER-READINESS-CAPABILITY`
Branch: `codex/b-p3-darnic-owner-readiness-complete-gap-set`
Exact Base: `765e88d8390ef6671faa4f9511b10853df8fd99e`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Classification: zero-credit complete-owner readiness

## Frozen owner scope / accounting

The frozen `master.darnic` scope is exactly three identities:

- `master.darnic.skill.ascension` — 老相识
- `master.darnic.skill.s1` — 领地
- `master.darnic.skill.s1a` — 噬魂者

Strict formal accounting after accepted Dan migration is `250/944`, remaining `694`. Canonical `data/authoring/masters/master.darnic.json` remains absent (`0/3`); this readiness transaction adds no Darnic consumer authoring and grants no migration credit.

Locked Reference confirms 达尼克·普雷斯通, initial mana `4`, plus the exact owner-local behavior summarized below.

## Complete owner-local readiness gap set

### 领地 — unclaimed printed battlefield terrain

Adds an identity-free `unclaimed_battlefield_terrain_bonus` passive semantic.

For the controller's current battlefield, every printed terrain slot that is not currently occupied contributes its printed terrain value to the controller in addition to any ordinary assigned terrain. Occupancy is derived from authoritative terrain assignment/slot state and accepted multi-presence deployment reservations. The bonus participates in the same terrain multiplier path used by ordinary terrain, so existing accepted terrain doubling composes without owner identity routing.

Combat participant projection and deployment-bonus queries consume the same generic authority. No Darnic/card-name branch is introduced.

### 老相识 / 焦土作战 — opponent terrain upkeep

Adds an identity-free `same_battlefield_opponent_terrain_upkeep` passive semantic with exact `victoryPointCost=2`.

At the start of an active opponent's action turn, if that opponent shares the provider controller's battlefield and currently owns an assigned printed terrain slot:

- with at least 2 VP, exactly 2 VP are paid and the terrain is retained;
- with fewer than 2 VP, the opponent's terrain assignment is released instead;
- retained players' explicit printed terrain slots are preserved when another assignment is removed;
- settlement is idempotent for a player/round and the idempotence marker survives structured-clone/restore-style state persistence.

The first action priority is settled on the authoritative phase transition; later action priorities are settled when MatchSession advances to the next active seat.

### 老相识 / 空中支援 — accepted terrain doubling reuse

No new effect family is created. The existing accepted `double_controller_terrain_this_round` semantic remains authoritative.

Readiness closes the activation-surface gap by allowing the already accepted zero-cost source-owned Master skill form to activate from the controller's skill zone while preserving the existing active field/attack-area route and the existing one-mana skill-zone route. This is identity-free and is covered together with prior Vlad/Chaos terrain-doubling regressions.

### 噬魂者 — existing generic resource/response route

No new runtime effect is required.

A synthetic exact route proves the existing generic primitives support:

- optional `after_controller_wins_battle` response -> `set_mana` to exactly `4`;
- forced `round_end` with negated `controller_mana_at_least 3` (therefore mana <=2) -> `adjust_victory_points -2`.

## Verification

- Darnic complete-owner readiness regression: `8/8 PASS`.
- Final affected run with explicit `--testTimeout=20000`: `134/134 PASS` across 9 files:
  - Darnic readiness `8/8`
  - Chaos readiness `14/14`
  - Vlad terrain/fortification readiness `13/13`
  - Alice multi-presence readiness `10/10`
  - Dan readiness `9/9`
  - terrain deployment metric `7/7`
  - battle winner conformance `1/1`
  - authoring interpreter `38/38`
  - MatchSession `34/34`
- A prior default-timeout parallel stress rerun transiently timed out one pre-existing Vlad MatchSession test; isolated rerun passed `1/1`, and the final affected run above passed all `134/134`. No assertion failure remained.
- `npm run typecheck`: PASS.
- `npm run content:validate`: PASS — `20 masters / 19 servants / 20 events / 0 blocking issues`.
- `npm run verify:generated-content`: PASS with unchanged consumer output:
  - content `9420505094583be3e088947ec62a2aa158bc0a06e0839f4401ff8005c88bdf12`
  - fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`
  - evidence `7e0a0758d26d733e7c99db979daa81afe8c7fe16a707b7a633a4af6f0af5e395`
- Phase-3 coverage remains `archives=125`, `cards=278`, `abilities=482`, `compiledCards=209`, `compiledCharacters=39`, `blockingIssues=0`, `newRuntimeSemanticRouted=22`, `dualRuntime=0`.
- Automation audit: `legacyResolveEffect=160`, `legacyExecuteAbility=3`, `notClassifiable=297`, `promotionFindings=20`.
- `data/authoring/**` delta: EMPTY.
- Production identity/text audit for `master.darnic`, 达尼克·普雷斯通, 领地, 噬魂者, 老相识, 焦土作战, 空中支援, and `core.darnic-`: CLEAN.
- Development image `E:\Codex\FD\Fate_Domination-开发版\images\masters\达尼克·普雷斯通.png`: PRESENT.
- `npm run test:source-assets`: exactly `93` historical missing `chm-extract/图包` assets; `darnicHits=0`.
- `git diff --check`: PASS.

An extra exploratory Alice owner-complete suite exposed only its historical static-pack-tail assertion (it still expects Alice to be the final master immediately after Akiha); Alice runtime semantics were green and the dedicated affected Alice readiness suite passed `10/10`. This stale historical assertion is unrelated to the Darnic Candidate.

## Gate

This Candidate remains permanently zero-credit. No Darnic consumer archive is materialized here.

One fresh independent exact Base/Candidate implementation review must return `IMPLEMENTATION_ACCEPTED_CANDIDATE` before FORMAL may perform the zero-credit readiness A-sync/rescan and release `P3-S-OWNER-DARNIC-COMPLETE-MIGRATION`.
