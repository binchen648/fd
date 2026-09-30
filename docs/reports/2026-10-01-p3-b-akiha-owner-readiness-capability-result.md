# P3-B Akiha Owner Readiness Capability Result

Role: Codex B / FORMAL readiness
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Date: 2026-10-01
Base: `d55f1bd56cfb156819c2d64c55259b75ab23d4c6`
Classification: complete currently discoverable Akiha owner-readiness/capability batch; permanently zero migration credit

## Frozen owner scope

One indivisible readiness batch:

1. `master.akiha.skill.ascension` — 璀璨空想;
2. `master.akiha.skill.s1` — 槛发;
3. `master.akiha.skill.s1a` — 鬼之血脉;
4. `master.akiha.skill.s2` — 红赤朱;
5. `master.akiha.skill.s3` — 鬼之血脉 threshold state.

Strict formal accounting remains `181/944`, remaining `763`. This readiness Candidate changes no `data/authoring/**` file and grants zero migration credit.

Repository frozen/source evidence is semantic authority. Locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9` and `src/rules-core/akiha.ts` were used only as bounded behavioral corroboration. No `master.akiha`, printed Akiha skill name, or `core.akiha-*` identity routing is added to production rules runtime.

## Source recertification

The complete five-identity printed/source contract was mechanically recertified before implementation:

- s1 槛发: once per round per eligible opponent, an explicit same-battlefield opponent with at least 6 mana may contribute exactly 1 mana toward the controller's positive card/ability mana payment;
- s1a 鬼之血脉: every mana actually paid by the controller increases Bloodlust by the same amount; after battle, lose a deterministic/restorable random 1–3, doubled at `magic_workshop`;
- s3 thresholds: below 5, Action gains 1 mana +2 round total Power +3 Bloodlust and blocks Bloodlust decay that round; at 5+ active skill Power +1; at 10+ exact skill-zone threshold-8 play requirement may be waived; at 15+ round end transforms;
- s2 红赤朱 transform: Bloodlust locks at 15, all ordinary command seals are removed, future mana gain doubles, positive VP gain is halved with floor;
- ascension 璀璨空想: transformed controller pays +3 cost and gains +4 physical card Power; before transformation, actual mana contributors sealed on that physical play each receive -3 combat total Power while the source stays active.

## Identity-free Bloodlust capability family

New `bloodlust-cycle-capability.ts` defines exact privileged semantics only through authoring-supplied resource/source identities:

- `bloodlust_initialize`;
- `bloodlust_same_battlefield_mana_contribution`;
- `bloodlust_track_controller_mana_spend`;
- `bloodlust_decay_after_battle`;
- `bloodlust_threshold_rules`;
- `bloodlust_low_threshold_action`;
- `bloodlust_transform_at_round_end`;
- `bloodlust_ascension_modifier_and_plunder`.

The loader accepts these only as exact whole-ability shapes and disables widened privileged shapes. Runtime state uses structured player/round provenance under an identity-free resource key rather than owner-specific fields.

## Explicit linked mana contribution transaction

Card play and ordinary ability activation now accept an optional server-validated `manaContributions` payload. A contribution is legal only when all of the following hold atomically before mutation:

- contributor is another real active player;
- exact same battlefield as beneficiary;
- contributor currently has at least 6 mana;
- amount is exactly 1;
- each contributor may be used at most once per round for that beneficiary/resource;
- aggregate contribution cannot exceed the positive mana transaction;
- payer can fund the remaining amount.

The payer and contributors are separately recorded as actual mana spenders through the shared spend ledger. Only the controller's own actual spend increments the controller's Bloodlust. Failed/stale contribution plans mutate neither payer nor contributor.

For physical card plays, exact contributor IDs/amounts are sealed in `CardRuntimeState.playManaContributions`. This is later re-read by the generic ascension plunder query and validated across restore.

## Bloodlust lifecycle and transform authority

- actual mana spend notifications feed the structured Bloodlust counter;
- battle-end random loss consumes serialized runtime RNG state, making the 1–3 result deterministic/restorable rather than using ambient randomness;
- magic workshop loss multiplier is exactly 2;
- the low-threshold action writes a source/ability-bound current-round +2 total-Power adjustment, adds 3 Bloodlust and blocks that round's decay;
- threshold 5 adds exactly +1 active skill Power;
- threshold 10 only waives exact `skill_zone_mana_at_least = 8`;
- threshold 15 transformation seals source/ability provenance, locks value 15, clears seals, doubles shared mana-gain requests, and uses server-owned VP baseline reconciliation for positive floor-half VP gains;
- transformed ascension cost/Power changes and pre-transform contributor penalty are live-source queries, so closing/deactivating the physical source removes plunder authority.

## Restore/fail-closed boundary

Restore validation now re-resolves:

- exact initialization provider physical source and accepted ability;
- exact transform provider source/ability and resource key;
- transformed value exactly 15 plus zero command seals;
- nonnegative VP baseline;
- structured round markers bounded to the authoritative current round;
- physical play contribution recipients as unique existing non-controller players with exact amount 1;
- the low-action +2 round-Power record through the exact accepted Bloodlust source/ability.

Forged provider IDs, transformed value, contributor identity, duplicate contributor state or malformed marker state fail closed.

## Shared-regression correction

The existing Maiya fixed-controller-mana-cost test hard-coded `p2` as a pending target. With the accepted >7 Master pool contract, seed `20260916` now places Maiya herself at `p2`; the exact pending target constraint is `not_controller`, so `p2` is correctly absent. The test was mechanically corrected to choose one real current pending candidate and then eliminate that target. Its original semantic assertion remains unchanged: the already committed fixed mana payment persists while the now-invalid target choice is rejected without new mutation.

## Verification

- Akiha readiness focused regression: `11/11 PASS`;
- Akasha readiness neighboring regression: `17/17 PASS`;
- Xiang Yu readiness neighboring regression: `11/11 PASS`;
- Tezcat readiness neighboring regression: `8/8 PASS`;
- fixed-controller mana-cost regression: `5/5 PASS`;
- complex skills regression: `38/38 PASS`;
- executable-card-pack regression: `50/50 PASS`;
- MatchSession isolated regression: `33/33 PASS`;
- MatchSession restore regressions isolated: `11/11 PASS`;
- playtest pack loader: `21/21 PASS`;
- Spartacus total-Power neighboring regression: `20/20 PASS`;
- Sigurd revealed/base-Power neighboring regression: `7/7 PASS`;
- affected aggregate: **`232/232 PASS`**;
- `E:\Codex\FD\binchen648_fd\tools\verify-toolchain.cmd`: `FD_TOOLCHAIN_OK`;
- `npm run typecheck`: PASS;
- `npm run content:validate`: PASS — `8 masters / 19 servants / 20 events / 0 blocking issues`;
- `npm run content:compile`: PASS — same counts;
- `npm run verify:generated-content`: PASS with unchanged hashes:
  - content library `9bded243cd7dddf19f7896c2f1af6f79b917e9a28d76fd13071529cbdd8d316e`;
  - fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`;
  - evidence report `fd3081d8fadf2f81a7e070feff815ac893e2188cb5d3b18efdd74cc1b8460f8c`;
- Base..working-tree `data/authoring/**` delta: EMPTY;
- production Akiha identity audit: CLEAN;
- `git diff --check`: PASS.

## Next transaction

Freeze one exact readiness Candidate / one PR / one fresh independent Reviewer for all five Akiha frozen identities together. This transaction is permanently zero-credit.

ACCEPTED -> one FORMAL-only A-sync/full-owner rescan while remaining on `master.akiha`; only that rescan may authorize one later five-identity owner-complete formal migration Candidate.

## Successor closure after PR #507 review

Predecessor exact Candidate `2e2288a51ed8a71831fd7f0633b9b7150f2d786d` received `IMPLEMENTATION_NEEDS_REVISION`.
Canonical same-attempt relay: `https://github.com/binchen648/fd/pull/507#issuecomment-5920958682`.

All three blocking P1 findings were closed together in one successor transaction:

1. **Authoritative transformed VP adjustment**
   - both interpreter `adjust_victory_points` and resolution-dataflow `adjust_victory_points` now call the shared identity-free `bloodlustVpGainAdjustment()` at the mutation transaction;
   - positive transformed gain is therefore floor-halved before commit, while loss remains unchanged;
   - real `dispatchAbilityCommand()` regression proves `+5` commits immediately as `+2` with no synthetic follow-up event.

2. **Orphan Bloodlust restore rejection**
   - restore now derives resource families from every `__fd_bloodlust:*` key in both structured player flags and round-key state, not only `:value` roots;
   - unknown prefixed suffixes and families missing required value/provider/baseline provenance fail closed;
   - explicit orphan `:transformed` regression is rejected.

3. **Server-owned physical contribution seal**
   - real card-play contribution commit now seals beneficiary/resource/provider source/provider ability/round/exact contributors in `playManaContributionSeal` alongside the public physical `playManaContributions` projection;
   - restore re-resolves the accepted contribution provider and requires exact contributor equality plus the authoritative same-round contribution markers;
   - ascension contributor penalty trusts only the validated server seal, not the user-visible contribution projection alone;
   - an existing real player forged into `playManaContributions` without the seal is rejected and yields no `-3` penalty.

Successor verification:
- direct Akiha + fixed-controller closure set: `16/16 PASS`;
- broad shared affected run: `250/251`, with the sole failure the known parallel 5-second timeout in the heavy MatchSession regression;
- that exact MatchSession regression file rerun isolated: `11/11 PASS` (heavy first case completes in ~4.5s);
- therefore all tests in the broad affected set are semantically green after isolated timeout rerun;
- `npm run typecheck`: PASS;
- `npm run content:validate`: PASS — `8 masters / 19 servants / 20 events / 0 blocking issues`;
- `npm run content:compile`: PASS — same counts;
- `npm run verify:generated-content`: PASS with unchanged hashes;
- Base..working-tree `data/authoring/**` delta: EMPTY;
- production Akiha identity audit: CLEAN;
- `git diff --check`: PASS.

Readiness remains permanently zero-credit. Strict accounting remains `181/944`, remaining `763`. Successor must receive a fresh independent review before any A-sync/full-owner rescan or Akiha formal consumer migration.