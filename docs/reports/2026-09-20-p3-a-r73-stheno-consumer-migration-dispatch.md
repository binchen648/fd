# P3-A R73 Stheno Consumer Migration Dispatch

Role: Codex A
Status: `READY`
Date: 2026-09-20

## Baseline

- Exact accepted-capability synchronization Base: `94710dc571cf7a474aa826572d518b89676dcf25`
- Accepted FB2-34 runtime Candidate: `99032d4458352ecdee26dd8964b46ce4e094c0f3`
- Canonical FB2-34 R evidence: `https://github.com/binchen648/fd/pull/378#issuecomment-5744013376`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Project formal migration accepted: `136/944`
- Project formal remaining: `808`
- This lineage authoring-material frozen overlap: `132/944`, duplicates `0`

This dispatch grants no migration credit. If the exact one-card S Candidate is independently accepted and A-synchronized, project formal migration accounting becomes `137/944`; S must not pre-credit it.

## Exact homogeneous migration family

Dispatch exactly one frozen identity to fresh S:

- `servant.stheno.skill.sc-stheno-2`

F1 full printed text SHA-256:

- `edc8e5b95f81153ebace50f23ed1e9a1342bd380891b07b35f74c1948eaac702`

F1 clause evidence from the frozen inventory:

1. `true-name-release` clause SHA-256 `34d0686e0a3e32928564917e173f901363e57039d02d16fb7d63a4003209ab4c`;
2. `goddess-smile-reward-distribution` clause SHA-256 `45fbb637d015849fc9403a5e28561b067a07b92a583e324a1175bbc300da79d6`;
3. `goddess-smile-win-reward` clause SHA-256 `d975b3ebb616a10292d326140d2d1fe5d510bb7b80092d57465c0637b0e13d72`.

F1 is authoritative for canonical identity and printed text. Locked Reference shared handler `core.structured-skill` is evidence only and must not become runtime routing.

## Static metadata

Locked Reference / legacy metadata supplies static card facts only:

- owner: `servant.stheno`;
- servant class: `Assassin`;
- legacy ID: `sc_stheno_2`;
- cost: `0`;
- basePower: `3`;
- legacy requirement: `8`;
- Reference cardFace type/attribute: the exact source values from locked `skillCards[10]`;
- true-name release marker/provenance from Reference may be retained as authoring metadata using the already accepted marker convention.

Use the accepted standalone servant-skill play envelope: action / `controller_play_card_window` and `skill_zone_mana_at_least: 8`. Do not invent a new play-timing capability from the Reference card's omitted `playTiming` field.

## Accepted structural normalization

A fresh post-R73 closure probe proved that copying the raw Reference object literally is not the intended migration representation: raw Reference `event_type_is` / `gain_victory_points` names and omitted playTiming are legacy/reference authoring shapes. The current accepted runtime already owns equivalent normalized structures.

The exact normalized S card must use three abilities only:

### 1. True-name release

Reuse the Reference passive true-name-release authoring metadata/marker shape. No new runtime mechanic is introduced.

### 2. Full reward distribution

Reuse exact accepted FB2-34 static passive envelope:

- `kind: passive`;
- one modifier only;
- `operation: replace`;
- `rule: combat_reward_distribution`;
- scope exactly `{ subject: "controller", whenControllerWins: true, mode: "full_reward_each" }`;
- no lifecycle/installation/extra scope payload;
- automatic execution.

### 3. Win reward

Normalize the Reference semantic `combat.resolved + event_player_won_combat + gain_victory_points(controller,1)` to already accepted current structures:

- `kind: forced_trigger`;
- activation `trigger: after_controller_wins_battle` and `requiresSourceState: active`;
- no extra conditions, targets, costs, modifiers, creates, lifecycle, limits, visibility;
- one effect exactly `adjust_victory_points` for `controller`, amount `1`;
- automatic execution.

This is a semantic normalization onto accepted Battle Trigger + Resource Numeric infrastructure, not a new B2 seam. A mechanical whole-card probe of this exact normalized shape against the post-FB2-34 loader produced `report=[]` and executable mode `automatic` for all three abilities.

## Authoring / product isolation

Expected minimal migration material:

- one new standalone archive `data/authoring/servants/servant.stheno.json`;
- one focused migration test;
- one S result report.

Do not modify:

- `packages/rules/src/**`;
- `data/packs/**`;
- `data/generated/**`;
- `data/phase3/**`;
- `apps/**`;
- taxonomy/KPI;
- any other consumer identity.

Do not merge or retarget any PR.

## Required S evidence

Fresh S must prove at minimum:

- exact one F1 identity, no second frozen identity;
- exact F1 full-text hash and three clause hashes;
- exact static owner/class/card-face metadata from Locked Reference;
- whole real archive loads with zero authoring issues and automatic mode;
- reward-distribution ability satisfies the accepted FB2-34 structural classifier after loader normalization;
- real tied-winner battle using the migrated definition gives full event/competition/location pool to each winner when Stheno's controller wins;
- losing/inactive/face-down source does not activate full-reward mode;
- real `after_controller_wins_battle` event gives exactly +1 VP through the migrated definition and is idempotent on replay;
- no reward on a non-winning controller event / source-inactive case;
- true-name metadata remains source-grounded and does not create identity routing;
- no identity/name/text/hash/Reference-handler branches in production runtime and zero `packages/rules/src/**` diff;
- no pack/generated product drift;
- line-local frozen authoring accounting expected `132/944 -> 133/944`, exactly one addition, zero removal, zero duplicate;
- project formal accounting stays `136/944` until fresh independent R returns `MIGRATION_ACCEPTED` and A syncs it;
- typecheck, focused test, rules regression, official CI, content validation, generated determinism, Locked Reference verify, client build, `git diff --check`, final cleanliness.

Historical `P3-FM09-RECOVERY` remains `MIGRATION_BLOCKED`.
