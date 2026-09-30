# P3-S Valkyrie Owner-Complete Migration Result

Role: Codex S
Status: `MIGRATION_COMPLETE_CANDIDATE`
Date: 2026-09-30
Base: `3086dbb3b09606b963651dacadb46b3524e0338d`
Task: `P3-S-OWNER-VALKYRIE-COMPLETE-MIGRATION`
Classification: one formal owner-complete consumer migration for the exact frozen Valkyrie owner scope

## Formal owner scope / accounting boundary

Exact frozen owner scope:

1. `servant.valkyrie.skill.sc-valkyrie-1` — newly creditable;
2. `servant.valkyrie.skill.sc-valkyrie-2` — newly creditable;
3. `servant.valkyrie.skill.sc-valkyrie-3` — newly creditable.

Strict formal accounting before fresh R remains **`161/944`**, remaining **`783`**. This Candidate may add exactly **+3** only after exact-Candidate `MIGRATION_ACCEPTED` and subsequent A-sync/accounting, producing `164/944`, remaining `780`.

Accepted prerequisite is readiness PR #495 Candidate `6352b1fcfca193cb2c4dfefa9481cecfd4acabcf`, fresh-R `IMPLEMENTATION_ACCEPTED_CANDIDATE`, canonical same-attempt relay `https://github.com/binchen648/fd/pull/495#issuecomment-5907322400`, followed by A-sync/full-owner rescan commit `3086dbb3b09606b963651dacadb46b3524e0338d`.

## Canonical owner archive

Added `data/authoring/servants/servant.valkyrie.json` and integrated it immediately after Ushiwakamaru in `data/packs/fd-playtest-v1/pack.json`, preserving frozen owner order.

All three servant skills use the final-rule skill-zone threshold `8`; locked-Reference legacy requirement values remain static evidence metadata only.

### sc1 — 终末幻想·少女降临

Consumes the exact accepted PR #495 definition-set relocation contract:

- advance/controller action window;
- source-owned, per-game one use;
- exact three Commander definition IDs;
- each definition independently selects hand or attack destination;
- accepts physical cards from existing zones including removed-from-game;
- attack placement is active/public with zero paid-on-play provenance;
- hand placement is owner-private/inactive;
- no ordinary play route, no `on_card_played`, no play-count increment;
- exact true-name reveal and decision provenance/restore authority remain the accepted generic runtime behavior.

### sc2 — 天鹅礼装

Consumes existing generic directed movement authority for both printed movement windows:

- action and combat phase actions require the source active;
- exact one-step `reachable_along_arrows` from the controller current location;
- existing enabled-location, movement-lock and occupancy authority remains canonical.

Steel Shield consumes the exact accepted PR #495 current-cost recall/source-join contract:

- combat controller action window;
- inactive owned skill-zone source;
- one live active face-up owned/controlled Commander in attack area;
- pays current source play cost through shared cost/mana authority;
- selected Commander returns to hand;
- source joins attack active/public with zero play provenance;
- no source card-play trigger/count is fabricated;
- insufficient-mana / stale-target paths remain transactional/fail-closed under the accepted runtime.

### sc3 — 伪·大神宣言

Consumes the source-grounded exact `retrigger_card_play_effects` contract:

- action/controller action window;
- source-owned and true-name reveal;
- requires at least one current live face-up active Commander from the exact definition set;
- re-emits authoritative `on_card_played` semantics for each current live member without replaying/moving the physical card or incrementing its card-play count.

## Zero-credit Commander dependency materialization

Valkyrie's frozen 12-card starting deck contains:

- `card.cardb1`;
- `card.cardb2`;
- `card.cardq1` x2;
- `card.cardq3`;
- `card.x-commanderortlinde`;
- `card.x-commanderhildr`;
- `card.x-commanderthrud`;
- `card.carda1`;
- `card.carda2`;
- `card.cardluck` x2.

The three Commander named deck definitions are materialized inside the Valkyrie archive so canonical deck loading and sc1/sc2/sc3 definition references resolve to real physical cards.

This dependency materialization grants **zero frozen-roster migration credit**. Its automated scope is deliberately bounded to the Commander `on_card_played` Power semantics directly consumed by sc3, for which locked Reference `src/content/content-package.ts#CONFIRMED_PLAY_POWER_BONUSES` provides explicit bounded behavior observation:

- Ortlinde: +2 this round;
- Hildr: +3 this round;
- Thrud: +6 this round.

These are implemented through the existing generic `create_modifier` / `power_bonus` / `this_card` / `this_round` route. Retriggering installs another ordinary round modifier, matching the accepted sc3 repeat semantics.

No claim is made here that other Commander printed clauses are migrated or creditable. Locked Reference remains NON_AUTHORITATIVE for canonical skill semantics; its explicit Commander play-power table is used only as bounded dependency behavior evidence.

## Runtime / identity boundary

Formal consumer migration changes no `packages/rules/src/**` file. Base..working-tree rules-runtime source delta is EMPTY.

Production audit over `packages/rules/src/**` is CLEAN for:

- `servant.valkyrie`;
- `sc-valkyrie`;
- `瓦尔基里`;
- `终末幻想`;
- `天鹅礼装`;
- `伪·大神宣言`;
- `core.valkyrie`.

All privileged semantics remain structural and fail-closed under the already accepted generic Commander lifecycle capability.

## Verification

Focused / affected verification:

- Valkyrie formal owner-complete regression: `5/5 PASS`;
- accepted Valkyrie readiness regression: `10/10 PASS`;
- complex skills regression: `38/38 PASS`;
- MatchSession regression: `33/33 PASS`;
- generic MatchSession regressions: `11/11 PASS`;
- playtest pack loader: `21/21 PASS`;
- exact affected aggregate: **`118/118 PASS`**.

Additional gates:

- `E:\Codex\FD\binchen648_fd\tools\verify-toolchain.cmd`: `FD_TOOLCHAIN_OK`;
- `npm run typecheck`: PASS;
- `npm run content:validate`: PASS — `7 masters / 16 servants / 20 events / 0 blocking issues`;
- `npm run content:compile`: PASS — same counts;
- `npm run verify:generated-content`: PASS:
  - content library `a49e05a3827942552fb2465c2dd00218fe12651d1be40ed2e536f8a57819094a`;
  - fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`;
  - evidence report `d24806da4788edd65131a5f4783333904bacce75d65198d28bf83f4abb73e625`;
- Base..working-tree `packages/rules/src/**` delta: EMPTY;
- production identity audit: CLEAN;
- `git diff --check`: PASS.

`packages/content/src/__tests__/fd-playtest-servants.test.ts` is not part of the affected gate because it contains pre-existing stale assertions on this Base: its expected list still says thirteen authoring servants while Base `3086dbb3...` already contains fifteen (including Tristan and Ushiwakamaru), and its Artoria Caster overview local-source-file existence assertion is unrelated to the Valkyrie diff. The current run nevertheless showed the remaining 120 tests in that broader batch passing; no Valkyrie runtime/loader failure was present.

## Next transaction

Freeze one exact formal Candidate, push one branch, open one PR, require exact-Candidate Phase 3 gate and one fresh independent formal migration Reviewer.

Allowed verdicts:

- `MIGRATION_ACCEPTED`
- `MIGRATION_NEEDS_REVISION`
- `MIGRATION_BLOCKED`

ACCEPTED -> one A-sync/accounting transaction adds exactly sc1 + sc2 + sc3 (+3), then mechanical frozen-roster owner selection proceeds.
## Fresh-R revision closure — predecessor 0470d2b0

Fresh independent review of predecessor Candidate `0470d2b098b641f616990312857378644ce8745d` returned `MIGRATION_NEEDS_REVISION` with one P1 shared-regression finding. Canonical same-attempt Coordinator relay: `https://github.com/binchen648/fd/pull/496#issuecomment-5907846507`.

The finding was not a Valkyrie skill-semantic failure. Adding a legitimate sixteenth servant changed fixed-seed pairing selection used by two production Artoria Caster continuation tests. Exact Base ran the MatchSession file `33/33`, while the predecessor Candidate ran `31/33`; both failing tests dereferenced a missing Artoria Caster pairing.

Revision closure is deliberately test-fixture-only:

- both Artoria Caster continuation tests now call the existing `createSessionIncludingServant('servant.artoriac')` helper;
- the tests therefore provision the production servant contract they actually exercise instead of depending on a roster-size-sensitive seed;
- no production runtime, Valkyrie authoring, deck, Commander dependency, generated content, or accounting behavior is changed by this revision.

Post-fix verification:

- MatchSession: `33/33 PASS`, including both exact predecessor failures;
- exact affected aggregate: `118/118 PASS`.

The successor Candidate must receive one fresh independent formal migration review; the predecessor Candidate must not be reviewed again.