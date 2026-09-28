# P3-B-SUZUKA-OWNER-READINESS-CAPABILITY Result

Date: 2026-09-29
Base: `f47b3354e9dfe5c9b4777d2fbd40dd9e06f2a1a3`
Branch: `codex/b-p3-suzuka-owner-readiness-capability`
Classification: bounded owner-readiness capability, permanently zero-credit
Current strict formal accounting: `141/944`, remaining `803`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Owner preflight boundary

The full frozen-F1 Suzuka owner set is exactly:
- `servant.suzuka.skill.sc-suzuka-1`
- `servant.suzuka.skill.sc-suzuka-2`
- `servant.suzuka.skill.sc-suzuka-3`

At Base all three have no canonical authoring consumer, no inherited/partial accepted current contract, and `currentRoute=none`; frozen F1 records the legacy Reference route only as `core.suzuka-package`. This candidate does not restore that identity-routed handler. The complete currently discoverable owner gap set is closed together in one bounded generic readiness transaction.

Frozen source evidence rechecked from the F1 inventory:
- sc1 clauses SHA-256 `4b8d5212b8752f6f94cde34c192e9695706bed44b7b26535918c1dbcf89b114b` and `5812363da1d8e24af66a3d477a66b1b9bcb47a45a7ed729a2ffacb7bc67550c6`;
- sc2 true-name marker SHA-256 `34d0686e0a3e32928564917e173f901363e57039d02d16fb7d63a4003209ab4c` and action clause SHA-256 `041d3904d44fdb704890d346c75143240c6e4dc2c26e017daab11c2aea1b8473`;
- sc3 clause SHA-256 `a55a092d54ce61769a8236c78ac50bd0a9558de44007b2b726718efb7a5ab13d`.

## Generic readiness implementation

A new identity-free exact whole-ability gateway in `packages/rules/src/ability/deck-recycle-replay-growth-capability.ts` accepts only four narrow semantic shapes:

1. automatic empty-deck recycle: owner may keep at most three eligible discard cards out of the recycle, then gains one named structured counter;
2. Advance action: spend exactly one named counter to ignore battle-loss effects for the current round;
3. Action replay: choose counter spend `0..2`, play up to `3+X` exact basic attacks from controller discard while paying their ordinary card costs, and return only those physical cards to deck at the authoritative battle-terminal event before one deterministic shuffle;
4. physical-card replay growth: after each legal play, that exact physical card has +1 effective future play cost per prior play for the game; reveal/discard at most the top three deck cards without draw/recycle substitution; printed/base Power exactly 4 grants current-round Power equal to the post-increment effective current play cost.

The loader fails closed on near matches and widened shapes. Shared runtime consumes these semantics without owner/card names, printed-text parsing, legacy handler lookup, or `SkillLib` fallback.

Persistence/authority boundaries added in the same scope:
- pending recycle, counter-spend, and discard-replay decisions carry exact owner-only interaction metadata and are revalidated against live source ability, controller, counter, candidates, revision, and continuation identity after restore;
- exact replayed-card battle-return markers and physical-card round Power markers are schema-validated and source-provenance validated by MatchSession restore;
- physical play counts remain the existing authoritative per-instance persisted counter used for permanent cost growth;
- current-round battle-loss ignore state is player-scoped and inert on later rounds.

## Behavioral evidence

Focused readiness regression: `8/8 PASS`.

The focused suite proves:
- exact gateway acceptance plus fail-closed near-match mutations for all four shapes;
- default old automatic discard recycle remains unchanged without an eligible provider;
- automatic recycle stages an owner-only keep decision, prevents keep-all infinite recycle during a pending draw, gains exactly one counter, and resumes the original draw continuation;
- counter spending is authoritative and the battle resolver reports real loss-effect suppression only in the originating round;
- X=2 replay can select five exact discard basics, pays their ordinary aggregate card costs, marks only played instances, and returns only those instances to deck at battle terminal;
- physical cost growth is per-instance across replays, first play pays the pre-growth cost, future effective cost grows by play count, and the current play's Power bonus uses the post-increment effective cost;
- top-three matching uses printed/base Power, not modified combat Power;
- legitimate live pending/marker states round-trip through trusted MatchSession restore while forged pending candidate provenance is rejected;
- changed production runtime contains no `servant.suzuka`, `sc-suzuka`, printed owner name, `core.suzuka-package`, or `SkillLib` route.

Directly affected serial verification: `7 files / 169 tests PASS`:
- Suzuka readiness `8/8`;
- authoring-interpreter `38/38`;
- Stheno Divine Core readiness `15/15`;
- executable-card-pack `50/50`;
- MatchSession `33/33`;
- resolution-dataflow `15/15`;
- combat-resolver `10/10`.

Static gates:
- `FD_TOOLCHAIN_OK`;
- `npm run typecheck` PASS;
- `npm run content:validate` PASS: `7 masters / 12 servants / 20 events / 0 blocking issues`;
- `npm run content:compile` PASS with the same summary;
- `npm run verify:generated-content` PASS with deterministic hashes unchanged:
  - content library `b2c446488a28c5036ac36557e09b563b54b11018d5396233a53f37ffdbff6923`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence report `f4ae33de4dc2832766064bdf46e277d9559398d4d34b45d7d05a0eb76744cd14`;
- `data/authoring/**` delta EMPTY;
- production identity audit CLEAN;
- `git diff --check` PASS.

## Accounting / next step

This readiness candidate grants no migration credit. Strict formal accounting remains `141/944`, remaining `803`.

If fresh independent R returns `IMPLEMENTATION_ACCEPTED_CANDIDATE`, A must synchronize/rescan this exact capability candidate and immediately return to the same owner. Then FORMAL may create one owner-complete Suzuka migration containing all three frozen skills in one formal Candidate/PR/fresh R/A-sync sequence. No owner advance is allowed before that owner-complete closure.

Allowed verdicts:
- `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`