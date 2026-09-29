# P3-B Tamamo Owner-Readiness Capability Result

Date: 2026-09-29
Base: `93b5536c8a4a02d79fe9b525e450e2883056cdad`
Branch: `codex/b-p3-tamamo-owner-readiness-capability`
Owner root: `servant.tamamo`
Classification: bounded zero-credit owner-readiness capability
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Strict formal accounting: `146/944`, remaining `798`

## Full-owner preflight

The frozen F1 owner set is exactly three identities and all three are `currentRoute=none` at Base:

- `servant.tamamo.skill.sc-tamamo-1` — 水天日光天照八野镇石;
- `servant.tamamo.skill.sc-tamamo-2` — 荼枳尼天法;
- `servant.tamamo.skill.sc-tamamo-3` — 水天日光天照八野镇石.

F1 clause evidence:

- sc1 true-name clause SHA-256 `34d0686e0a3e32928564917e173f901363e57039d02d16fb7d63a4003209ab4c`; Cascade clause SHA-256 `6214f5d0b7ed372a0b1b4c49569067996c09bff6ddb6037f551c1fe40d5cf182`;
- sc2 Weirding Hex clause SHA-256 `8461020ffd61f81e1949cd455d6a41d6340bf9cc35334f1129520274c0fe1938`; Magic penetration clause SHA-256 `2d97857fa616bb62a787ea367f8d12e572f2b5ff82407cf480e7e7a0213a21e1`;
- sc3 true-name clause SHA-256 `34d0686e0a3e32928564917e173f901363e57039d02d16fb7d63a4003209ab4c`; Transcendence seal clause SHA-256 `358d51c100845b6f257702d91f99240826c50e5c952c29c793f31d2530e1afc5`.

The locked Reference implementation confirms the observable behavior family: sc2 round-scoped Magic attribute replacement plus Magic attack close/power-reduction protection; sc3 after-battle sealing of a qualifying same-location active basic attack under the sc3 physical host; sc1 atomic replay of all sealed cards with normal costs followed by post-battle per-card reseal/discard. The Reference's identity handlers remain non-canonical evidence only and are not copied into production.

## Implemented generic capability

The new `sealed-card-magic-capability` family is identity-free and accepts only exact whole-ability shapes. It provides:

1. current-round authored-definition attribute replacement;
2. effective-attribute Magic protection against effects controlled by another player;
3. a round-scoped after-battle seal arm and exact private target interaction;
4. physical sealed-card binding to an authored host with owner/controller provenance;
5. atomic play-all-sealed replay using ordinary card costs;
6. post-battle reseal/discard disposition with 1 mana per resealed card;
7. persistent runtime state plus strict restore/reference validation for bindings, pending interactions, armed actions and replay state;
8. loader fail-closed gating for privileged nodes.

Production code contains no Tamamo identity, card-name, printed-text, or legacy-handler routing for this capability. No `SkillLib` fallback is introduced. `data/authoring/**` is unchanged in this readiness task.

## Behavior verification

Focused regression: `9/9 PASS`. It covers exact-gateway acceptance and near-match rejection, round attribute replacement expiry, Magic close/power protection, the real production `reduce_opponents_power` / `set_opponent_power_to_zero` extended-effect paths with authoritative effect-controller provenance and self-origin reduction remaining unprotected, combat arm + after-battle physical seal, atomic replay/reseal/discard behavior including borrowed cards and aggregate-cost failure, trusted MatchSession round-trip, forged host/key rejection, and production identity audit.

Directly affected green verification: `10 files / 256 tests PASS`:

- Tamamo readiness;
- authoring interpreter;
- executable-card-pack;
- MatchSession;
- card-action-close;
- FB2-49 opponent-close interaction;
- Steno Divine Core readiness;
- Suzuka owner readiness;
- Taisui location-marker readiness;
- complex-skills production regressions, including existing Achilles/Tomoe content paths.

The separately probed `m50-02-opponent-close-one-non-residual` test retains its pre-existing current-main debt (6 failures). The same debt was already mechanically recorded before Tamamo readiness; this change does not modify `opponent-close-to-one.ts` or that test. Its failures therefore are not used as Tamamo green evidence and are not represented as Candidate-caused regressions.

Static gates:

- `FD_TOOLCHAIN_OK`;
- `npm run typecheck` PASS;
- `npm run content:validate` PASS — `7 masters / 12 servants / 20 events / 0 blocking issues`;
- `npm run content:compile` PASS with the same result;
- `npm run verify:generated-content` PASS:
  - content library `b2c446488a28c5036ac36557e09b563b54b11018d5396233a53f37ffdbff6923`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence report `f4ae33de4dc2832766064bdf46e277d9559398d4d34b45d7d05a0eb76744cd14`;
- `git diff --check` PASS;
- locked Reference clean at exact `b2f9fa15fba07c63530bbf4612b03b8b704755f9`;
- `data/authoring/**` delta EMPTY.

## Revision closure after fresh R

Fresh independent R reviewed predecessor Candidate `6c91b25e2b6a0d7c5af2f5964584ddd5e7171c18` and returned `IMPLEMENTATION_NEEDS_REVISION`. The Reviewer GitHub write failed with HTTP 403, so the same completed attempt was relayed by Coordinator and mechanically verified at canonical evidence `https://github.com/binchen648/fd/pull/481#issuecomment-5882423372`.

The single P1 finding was that production `set_opponent_power_to_zero` and `reduce_opponents_power` stamped anonymous `sourceId: extended-effect`, so `calculateCardPower` could not identify the other-player controller and Magic protection was bypassed. The successor revision closes that finding by persisting the authoritative `controllerId` on both production extended-effect power modifiers, preserving the concrete source-card instance when available, and making `calculateCardPower` consume explicit effect-controller provenance before falling back to physical-source provenance. Regression coverage executes both real production extended-effect reducer handlers and verifies self-originating Power reduction is still applied.

Revision verification: focused `9/9 PASS`; affected green set `10 files / 256 tests PASS`; no `data/authoring/**` delta; formal accounting remains unchanged because this readiness task is permanently zero-credit.

## Accounting boundary

This is readiness/capability work and is permanently zero-credit. Strict formal accounting remains `146/944`, remaining `798`.

If this exact Candidate receives `IMPLEMENTATION_ACCEPTED_CANDIDATE`, A-sync must perform a full Tamamo owner rescan and return to the same owner. Only the subsequent owner-complete formal consumer Candidate may claim Tamamo sc1/sc2/sc3 migration credit.

Allowed verdicts:
- `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`
