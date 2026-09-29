# P3-A Teach Owner Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-29

## Accepted input

- PR: `#484`
- Exact Base: `8c89f948db0edcaa8042df578410ba17a8f298b4`
- Exact accepted Candidate: `59049a2edb41ba2aeb34dd0ddfc42d230823b338`
- Canonical fresh-R evidence: `https://github.com/binchen648/fd/pull/484#issuecomment-5884435718`
- Verdict: `MIGRATION_ACCEPTED`
- ReviewJobKey: `pr484:59049a2edb41ba2aeb34dd0ddfc42d230823b338`
- Exact-Candidate Phase 3 Gate: `36524389340` — `SUCCESS`

The fresh independent Reviewer completed the exact-Candidate review. Reviewer-side GitHub publication returned explicit 403, so the Coordinator published one bounded same-attempt relay. No second review is used for this synchronization.

## Accepted owner-complete scope

The accepted formal transaction contains the complete frozen Teach owner set together:

1. `servant.teach.skill.sc-teach-1` — newly creditable;
2. `servant.teach.skill.sc-teach-2` — newly creditable;
3. `servant.teach.skill.sc-teach-3` — historical FM01 preservation-only, no duplicate credit.

The formal Candidate adds only canonical authoring, task/report evidence, and formal regression coverage. `packages/rules/src/**` production runtime delta from Base is empty. It restores no legacy `core.teach-*` handler, no Teach/card-name/printed-text runtime routing, and no `SkillLib` fallback.

## Review closure

Fresh R confirmed exact Base/Candidate lineage, fixed clean Reviewer, exact PR scope, locked Reference commit `b2f9fa15fba07c63530bbf4612b03b8b704755f9`, exact three-skill owner scope, and the credit boundary. Independent checks passed: focused owner-complete `6/6`, directly affected `13 files / 269 tests`, typecheck, content validate/compile, generated determinism, and `git diff --check`.

sc1 consumes only the accepted `battle_competition_reward_plunder` readiness semantic. sc2 consumes only the accepted `play_recorded_removed_card` readiness semantic. sc3 was independently rechecked as semantically preserved from exact Base (`SC3_SEMANTIC_PRESERVED=true`, normalized serialized length `2345 -> 2345`). No exact-scope/shared-diff blocker remained.

## Accounting

Strict formal accounting before this transaction was `149/944`, remaining `795`.

This A-sync grants exactly two new migration credits:

- sc1: `+1`;
- sc2: `+1`;
- sc3: `+0` preservation-only.

Strict formal accounting is now **`151/944`**, remaining **`793`**. Teach readiness remains permanently zero-credit. No historical sc3 credit is duplicated.

## Mechanical next owner

Stable first-occurrence owner ordering in `data/phase3/full-roster-ability-inventory.json` contains `251` owners. Teach is zero-based index `241`; the next owner is zero-based index `242`: `servant.tesla`.

Tesla frozen owner scope is exactly:

1. `servant.tesla.skill.sc-tesla-1`;
2. `servant.tesla.skill.sc-tesla-2`;
3. `servant.tesla.skill.sc-tesla-3`.

At this synchronization point all three inventory rows still show `currentRoute=none`; sc1/sc2 reference `specific_handler`, sc3 reference `shared_handler`, and all three remain `EXPLICIT_BLOCK / SEMANTIC_SOURCE_REQUIRED` in the legacy frozen inventory metadata. These fields are preflight inputs only, not authorization to infer behavior from Reference handlers.

Owner-readiness-first remains mandatory. FORMAL must perform one full Tesla preflight across all three frozen skills against accepted F1/source evidence, locked Reference static evidence, current generic seams and historical accepted migration evidence before authoring any Tesla consumer. Any bounded readiness gap must be closed as one compatible zero-credit owner batch before one Tesla owner-complete formal migration.

The HELPER report read immediately before advancing was Epoch 10 and still described the already-accepted Teach readiness state. It was treated strictly as stale read-only auxiliary evidence; no verdict, scope, or credit was taken from it.
