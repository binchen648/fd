# P3-B Akasha owner-readiness seven-player Master-pool follow-up

Date: 2026-10-01
Task: `P3-B-AKASHA-OWNER-READINESS-SEVEN-PLAYER-MASTER-POOL`
Classification: bounded identity-free readiness/capability follow-up; permanently zero migration credit
Exact Base: `b2b224f17c1fb6cd835654d7b80ce54bd6d0b05c`
Strict accounting: `173/944`, remaining `771`

## Discovery

Akasha formal owner-complete materialization successfully increased the playable Master content surface from seven to eight. The shared `MatchSession.buildInitialState()` implementation then exposed a hidden seven-master assumption: it seeded/shuffled all playable Masters and mapped every Master to a `pN` pairing while the canonical session state creates exactly seven active seats.

With eight playable Masters the eighth pairing targeted `p8`; no such active player exists, so session construction failed before normal gameplay. This is a generic MatchSession pool-size capability gap, not an Akasha-specific rule and not a seed-only test drift.

The partially materialized Akasha formal work was preserved locally at `4e35b7d4cf35f76e8e71caff47b648e3c7c10e50`. It was not pushed, no PR was created, and it is not a formal Candidate.

## Identity-free closure

`buildSevenPlayerCharacterPairings()` now owns the shared selection boundary:

- requires at least seven playable Masters and seven playable Servants;
- seeded-shuffles copies of each caller pool;
- selects exactly the first seven from each shuffled pool;
- returns exactly `p1..p7` / seats `1..7`;
- never mutates caller arrays;
- deterministic for the same seed;
- fails closed if either pool cannot fill all seven seats.

`MatchSession.buildInitialState()` consumes this helper and creates the same exact seven active seats. No owner identity, Akasha identity, card name, printed text, or legacy handler is part of the selection logic.

## Verification

- focused seven-player pool regression: `3/3 PASS`;
- MatchSession: `33/33 PASS`;
- MatchSession restore regressions: `11/11 PASS`;
- complex shared regressions: `38/38 PASS`;
- executable-card-pack: `50/50 PASS`;
- playtest-pack-loader: `21/21 PASS`;
- affected aggregate: **`156/156 PASS`**;
- `FD_TOOLCHAIN_OK`;
- typecheck PASS;
- content validate/compile PASS: `7 masters / 19 servants / 20 events / 0 blocking issues`;
- generated determinism PASS, unchanged:
  - content-library `eea4a067812644adb41989b3519fceddd0b11ba5985856e3f0fd525ffb713d52`
  - fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`
  - evidence-report `fe7a7388fda1eaa0fcab6b80dbb08104cabc2e27ccc0285be535045267cfb6f2`
- `data/authoring/**` delta EMPTY;
- production Akasha identity audit CLEAN;
- `git diff --check` PASS.

## Boundary / next step

This readiness task grants zero migration credit. Formal accounting remains `173/944`, remaining `771`. `P3-S-OWNER-AKASHA-COMPLETE-MIGRATION` stays blocked until this exact readiness Candidate receives fresh independent acceptance and FORMAL performs the required A-sync/full-owner rescan.
