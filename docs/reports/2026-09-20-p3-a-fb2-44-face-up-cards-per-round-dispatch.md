# P3-A FB2-44 Face-Up Cards Per Round Dispatch

Role: Codex A
Status: `DISPATCHED`
Date: 2026-09-20
Task: `P3-FB2-44-FACE-UP-CARDS-PER-ROUND`
Branch: `codex/b2-p3-fb2-44-face-up-cards-per-round`
Base: `7cc689dba18779619efde79e9367e5dd55f05f4f`

## Why this B2 seam is formally next

R91 synchronized exact fresh-R `MIGRATION_ACCEPTED` for Siegfried s2 and advanced formal project migration to **`146/944`**, **`798`** remaining. A then re-probed current-baseline unmigrated `CONTRACT_MAPPED` whole cards rather than trusting historical F1 readiness labels.

The nearest defensible singleton is `servant.leonidas.skill.sc-leonidas-1`. Its controller-movement close half is already expressible by accepted authoritative movement events, exact controller event-player relation, active-source state, and `close_source_card`. Its remaining whole-card gap is exactly the identity-free static modifier represented by Locked Reference as:

- ability kind `residual`, automatic execution;
- ability lifecycle `while_active`;
- one modifier `type=card_play_rule_override`;
- `operation=set`;
- `rule=face_up_cards_per_round`;
- scope exactly `subject=players_at_source_battlefield`;
- value exactly integer `1`;
- modifier lifecycle exactly `while_active`;
- priority exactly `tier=card_text`, `specificity=specific`;
- conflict policy exactly `host_required`.

No current task/report/open PR/branch dispatches FB2-44 or this exact face-up-play-limit seam. Historical Leonidas source-evidence branches are not current Phase-3 dispatches. PR #397 is not a current formal task and is not part of this Base.

## B2 implementation scope

Implement one narrow, identity-free server-owned semantic for the exact envelope above:

1. Loader/classifier accepts only the exact modifier/ability shape and rejects near-misses or extra semantic fields.
2. While at least one accepted active source is controlled by a player at a battlefield, every active player at that exact source battlefield may play at most **one face-up card per round**.
3. Face-down plays neither consume nor are rejected by this face-up allowance.
4. Actual completed face-up plays are counted server-side per player and reset with the round.
5. Regular play, staged/batched play confirmation, and trusted effect-play routes that use the authoritative play gateway must not bypass the cap; multi-card face-up batches exceeding remaining allowance fail atomically before mutation/cost.
6. A source that is inactive/closed, or whose controller is not at a battlefield, supplies no cap. A player at another location is unaffected. Moving away or closing the source releases the live static cap immediately.
7. No character/card identity may appear in runtime selection logic. The runtime must discover the rule structurally from loaded definitions plus active source state and current locations.
8. Preserve existing attack limits, mana/timing behavior, hidden-card handling, other rule modifiers, and all unrelated play paths.

A helper/classifier may be added following existing exact fail-closed selector patterns. A dedicated face-up play counter may be added to `RoundPlayCounters`; do not reinterpret the existing all-card `cardsPlayedByPlayer` counter.

## Required tests

Focused tests must prove at minimum:

- exact loader envelope accepted; wrong value/scope/lifecycle/type/priority/conflict policy and extra keys fail closed;
- same-battlefield controller and opponent each have independent one-face-up-per-round allowance;
- a second face-up card is not a legal action and is rejected by authoritative play after the first completes;
- face-down cards do not consume the allowance;
- a player elsewhere is unaffected;
- inactive/closed source and non-battlefield source controller do not impose the cap;
- round advance resets face-up allowance;
- multi-face-up batch over allowance is rejected atomically;
- trusted effect play cannot bypass the cap;
- no identity-specific route is introduced.

Run focused tests plus the standard strong rules subset, official CI, content validation, generated determinism, exact Locked Reference verification, client build, and `git diff --check`.

## Forbidden / accounting

- Do not add a Leonidas authoring archive or any other frozen identity in this B2 task.
- Do not add product/generated registration.
- Do not broaden this into generic arbitrary card-play limits, arbitrary values, arbitrary locations, arbitrary selector combinations, or a general conflict engine.
- Do not merge or retarget.
- This B2 task is **zero migration credit**. Formal project migration remains **`146/944`**, **`798`** remaining.

## After fresh R

Only exact fresh reviewer terminal evidence for the produced Candidate may synchronize this B2 acceptance. If accepted, A must immediately re-overlay the complete `servant.leonidas.skill.sc-leonidas-1` card against the then-current accepted runtime and dispatch singleton S only if that whole card is mechanically zero-gap. If revision is required, repair only the exact reviewer finding.
