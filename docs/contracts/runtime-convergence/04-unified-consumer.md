# Unified Consumer Contract

Version: RC-v1 / 2026-11-05
Base: `e63cdeb2a065a9f87c24039d2b08bbe059513fed`
Task: FD-RC-20261105
Status: IMPLEMENTATION_CONTRACT; independent acceptance pending

Input: accepted typed effects and concrete current actor/target IDs. Output: actual authoritative movement, deployment, combat totals and resulting client projection using existing core consumers.
State: movement changes player location and releases previous terrain, without granting destination terrain automatically. Five master seals move only workshop -> allowed actual battlefield; invalid origin/target rejects without consuming seal.
RC-03 +2 contributes ONCE to aggregate battle power, independent of attack card count; do not add +2 to every attack card. RC-04 fee uses printed terrainBonuses[index], never index+1. Occupancy preserves empty holes. A battlefield is not capacity-limited by its terrain slots.
Errors: absent consumer, nonexistent field/slot or malformed identities reject atomically. Recovery: saved authoritative state retains concrete assignments and aggregate modifiers; no client reconstruction of effects.
Acceptance: two attacks still total +2; map [3,1] and payment 1 selects affordable +1; zero payment/no empty slot remains a legal battlefield deployment where rules allow.
