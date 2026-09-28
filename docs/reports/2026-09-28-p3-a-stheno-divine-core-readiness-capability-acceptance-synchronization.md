# P3-A Stheno Divine Core Readiness Capability Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-28

## Accepted input

- PR: `#472`
- Exact Base: `e3c61d74be6b02b186875e31191e416fc364e179`
- Reviewed predecessors: `31e607db8be27d505d808d380cee22a0a92769a5`, `dfa48bf26697a717fa6e8101a5a44e489b5e6552`, `54baf0b188114c2fe9f690a339a71a0a620379a1`
- Exact accepted successor Candidate: `5d7ec79524b577dcd729ae7bc93d905343bd3e1f`
- Candidate implementation evidence: `https://github.com/binchen648/fd/pull/472#issuecomment-5867009475`
- Canonical accepted same-attempt evidence: `https://github.com/binchen648/fd/pull/472#issuecomment-5867235240`
- Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- ReviewJobKey: `pr472:5d7ec79524b577dcd729ae7bc93d905343bd3e1f`
- Exact-Candidate Phase 3 Pre-Review Gate: `36402342635` — `SUCCESS`

The completed Reviewer result returned `IMPLEMENTATION_ACCEPTED_CANDIDATE` for the exact Candidate but carried a stale evidenceRef pointing to predecessor comment `#5866671116`. Mechanical GitHub verification proved that old URL is the `54baf0b...` `IMPLEMENTATION_NEEDS_REVISION` relay. No second review was performed. Coordinator therefore published one bounded evidence-reference correction for the same completed review attempt and mechanically read it back as comment `#5867235240`.

## Accepted bounded capability

This transaction accepts only the zero-credit identity-free Divine Core readiness family needed by Stheno sc3:

- exact active-source combat whole-ability gateway;
- one owned Luck discard;
- deterministic engaged-opponent order;
- optional close of at most one eligible non-per-game attack per opponent;
- effective-cost refund and draw-one provenance;
- optional turn-order immediate play of the exact drawn card;
- bounded current-round combat Action permission;
- authenticated transaction/continuation/completed-play provenance across persistence and root replacement;
- exact round-boundary retirement of completed provenance, temporary permission, and server authority.

The final accepted Candidate carries focused `15/15 PASS`, current affected `7 files / 105 tests PASS`, typecheck/content validate/content compile/generated determinism/diff-check PASS, empty `data/authoring/**` delta, clean production Stheno/SkillLib identity audit, and exact gate `36402342635 SUCCESS`.

## Mandatory A-rescan of the complete Stheno owner

The helper report `E:\Codex\FD\binchen648_fd\.fd-helper-reports\latest.md` was read only as auxiliary prework. It grants no verdict and no migration credit. Its sc2 concern was independently rechecked against the locked Reference and exact accepted runtime before this synchronization.

Stheno frozen owner scope remains exactly three identities:

1. `servant.stheno.skill.sc-stheno-1` — historical FM06 Presence Concealment acceptance; preservation only, no duplicate credit.
2. `servant.stheno.skill.sc-stheno-2` — Goddess's Smile.
3. `servant.stheno.skill.sc-stheno-3` — Divine Core readiness now accepted by PR #472; still no migration credit until formal consumer migration.

### sc2 mechanical gap confirmation

Locked Reference at exact commit `b2f9fa15fba07c63530bbf4612b03b8b704755f9` encodes a dedicated passive rule modifier for sc2:

- `operation = replace`
- `rule = combat_reward_distribution`
- `scope.subject = controller`
- `scope.whenControllerWins = true`
- `scope.mode = full_reward_each`

Reference combat settlement calls `shouldEachCombatWinnerReceiveFullReward(...)` before reward division. When enabled, each winner receives the full reward pool rather than `ceil(pool / winnerCount)`, and the same full-reward switch applies to event and location reward components. The separate sc2 `+1 VP` on Stheno battle win is a different clause.

Exact accepted current runtime supports the separate win/+1 branch through generic `after_controller_wins_battle`, `event_player_won_combat`, and `adjust_victory_points`. It does **not** support the reward-distribution replacement:

- production contains no `combat_reward_distribution`, `full_reward_each`, or equivalent accepted settlement helper;
- loader ruleModifier operation allowlist does not admit `replace`;
- loader rule allowlist does not admit `combat_reward_distribution`;
- `combat-resolver.ts` computes split per-winner event/competition/location rewards before post-result ability events;
- a fixed post-scoring VP adjustment is not semantically equivalent to replacing reward splitting across variable reward pools;
- current ability formula vocabulary exposes no accepted generic contract that can reconstruct the complete authoritative split after settlement.

Therefore the earlier pre-review assumption that sc2 needed no privileged generic seam is superseded by this accepted-runtime A-rescan.

## Accounting and continuation

This A-sync grants zero migration credit. Strict formal accounting remains **`139/944`**, remaining **`805`**.

The same owner remains active. Direct Stheno owner-complete formal migration is not yet authorized because one source-grounded owner-local runtime gap remains.

Next task: `P3-B-STHENO-FULL-REWARD-EACH-READINESS-CAPABILITY`.

That task must close the exact identity-free `combat_reward_distribution/full_reward_each` semantic in one bounded readiness batch. After fresh independent `IMPLEMENTATION_ACCEPTED_CANDIDATE` plus A-sync/rescan, and only if no further Stheno readiness gap remains, execution returns to one formal owner-complete Stheno migration containing sc1 + sc2 + sc3 together. No owner advance is permitted before that sequence completes.
