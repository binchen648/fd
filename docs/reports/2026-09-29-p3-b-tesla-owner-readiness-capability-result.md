# P3-B Tesla Owner Readiness Capability — Result

Role: Codex B
Status: `REVISION_IMPLEMENTED_AWAITING_SUCCESSOR_REVIEW`
Date: 2026-09-29
Base: `7131b216d78dc04f21390e63b9d0ce0f28139a82`
Classification: complete currently discoverable bounded zero-credit owner-readiness capability for current owner `servant.tesla`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Strict formal accounting: `151/944`, remaining `793`

## Full-owner preflight

Frozen owner scope is exactly:

1. `servant.tesla.skill.sc-tesla-1` — 雷电之手;
2. `servant.tesla.skill.sc-tesla-2` — 人类神话·雷电降临;
3. `servant.tesla.skill.sc-tesla-3` — 人类神话·雷电降临.

Mechanical history inspection found no current `data/authoring/servants/servant.tesla.json` and no historical Git authoring migration for that file. No Tesla identity is therefore treated as preservation-only at this preflight; all three remain potential new-credit identities only in a later formal owner-complete migration.

F1 source evidence is already closed globally at `944/944`, blocked `0`, unclassified `0`, with final accepted closure `59f145434695d29bdd17e4cb3adc887e84182377`. Tesla's frozen clauses are source-grounded there. Locked Reference is used only for static metadata / non-authoritative sanity, never as semantic authority.

Frozen printed semantics require one bounded generic resource-transaction family:

- sc1 residual: when another player at the same location spends at least 2 mana, gain 2 mana; every storage-cap overflow grants +5 total Power for the current round and arms this source to close at the canonical battle terminal;
- sc2 overload passive: when an opponent at the controller's battlefield suffers storage-cap mana overflow, apply battle defeat unless generic ability/loss immunity prevents it;
- sc2 on-play: lose all remaining controller mana and add exactly the amount lost to current-round total Power; this is resource loss, not a paid-mana spend;
- sc3 on-play and mandatory combat action: every active opponent at the controller's same location receives 2 mana through normal mana-gain rules, so a real storage overflow can feed the accepted overflow reactions.

Reference static metadata for the later formal consumer is:

- sc1 `特殊`, printed cost `6`, base Power `0`, legacy requirement `6`;
- sc2 `宝具`, printed cost `0`, base Power `3`, requirement `8`, true-name reveal on play;
- sc3 `魔术/宝具`, printed cost `5`, base Power `12`, requirement `8`, true-name reveal on play.

## Implementation

Added identity-free `mana-transaction-capability.ts` with exact whole-ability gateways for:

- `same_location_other_player_mana_spend_reward`;
- `self_mana_overflow_round_power_close`;
- `opponent_mana_overflow_defeat`;
- `lose_all_controller_mana_add_round_power`;
- `grant_same_location_opponents_mana`.

The generic runtime now centralizes authoritative paid-mana observation across accepted interpreter costs, batch card play, resolution-dataflow mana cost, legacy card-pair play, and normal movement. Movement spend is observed at the authoritative pre-move origin location.

`grantMana` retains its existing public `overflowAmount = requested - actual` contract, but Tesla reactions use a separate internal **storage-cap overflow** amount. Round/situation gain-cap clipping and mana-gain suppression therefore do not falsely trigger overflow semantics.

Self overflow adds stackable `player.combatTotalPower +5` modifiers for the current round and stores a source-bound close marker. The marker is restore-validated against exact accepted ability provenance/current round/live source and is consumed only by the canonical battle-terminal event. Opponent overflow defeat uses existing generic other-player ability immunity and battle-loss immunity seams.

`data/authoring/**` is unchanged. No Tesla formal consumer is included in this readiness Candidate. Production files contain no Tesla/card-name/printed-text identity parser, no legacy `core.tesla-*` route, and no `SkillLib` fallback.

## Verification

- focused Tesla readiness regression: `10/10 PASS`;
- movement focused companion: `3/3 PASS`;
- directly affected green set: `17 files / 245 tests PASS`;
- resource-numeric direct-action relevant subset: `3/3 PASS` (one unrelated Tomoe direct-VP pairing test was excluded after reproducing the same failure on the unchanged fixed Reviewer predecessor, so it is a pre-existing fixture failure rather than Candidate regression);
- `FD_TOOLCHAIN_OK`;
- `npm run typecheck`: PASS;
- `npm run content:validate`: PASS — `7 masters / 12 servants / 20 events / 0 blocking issues`;
- `npm run content:compile`: PASS — same result;
- `npm run verify:generated-content`: PASS with deterministic hashes unchanged;
- locked Reference clean/detached at exact commit;
- `git diff --check`: PASS;
- `data/authoring/**` delta from exact Base: EMPTY;
- production identity audit: CLEAN.

Focused coverage includes exact privileged-shape rejection, real paid card cost, normal movement spend at origin, storage-overflow stacking and battle-terminal close, cap/suppression non-overflow, same-battlefield opponent defeat plus loss immunity, lose-all-mana round Power without false spend observation, mandatory same-location grants feeding real overflow reactions, restore round-trip, forged ability/round rejection, and production identity audit.

## Successor revision after predecessor review transport loss

Predecessor exact Candidate `4961a7c432bece612758b7a344981a0ddf1347f6` received `IMPLEMENTATION_NEEDS_REVISION`. Reviewer GitHub publication failed with explicit 403; Coordinator published the same-attempt bounded relay at `https://github.com/binchen648/fd/pull/485#issuecomment-5885532817`. The supplied Reviewer payload did not preserve the textual blocking-findings section, so this report does not reconstruct or attribute any missing finding.

A subsequent FORMAL/Coordinator mechanical audit independently reproduced a concrete Candidate-introduced regression and recorded it at `https://github.com/binchen648/fd/pull/485#issuecomment-5887455935`:

- `movePlayer` called `notifyManaSpent` on a shallow reducer result, so successful paid movement with `abilityRuntime` mutated the input state's shared runtime; probe evidence was `sameRuntime=true`, original event ledger `0 -> 1`;
- `playServantCardPair` had the same shared-state leak; with a same-location spend-reward provider, the input state's provider mana mutated `4 -> 6` and its shared runtime event ledger mutated `0 -> 3`;
- Base..Candidate diff shows both mutation paths were introduced by the readiness Candidate's new external paid-mana observer calls.

The revision detaches every player object and `abilityRuntime` before invoking an external paid-mana observer from these two pure reducers. This preserves the returned-state Tesla reward behavior while keeping the reducer input state unchanged. Regression coverage now asserts input players/cards/runtime immutability for both normal movement and legacy pair play.

Revision verification:

- Tesla readiness + core movement: `2 files / 14 tests PASS` (`11/11` Tesla + `3/3` movement);
- broader mana/resource/movement/play focused set: `18 files / 134 tests PASS`; one FM01 authoring-lineage assertion was excluded as historical/pre-existing after exact Base mechanically showed `servant.teach.json` already contains 3 cards while the unchanged Base test still expects `1`;
- resource-numeric direct-action relevant subset: `3/3 PASS` with the known unrelated Tomoe case skipped;
- `npm run typecheck`: PASS;
- `git diff --check`: PASS.

This independent closure is not claimed to be a reconstruction of the missing predecessor Reviewer finding. The successor exact Candidate must receive a fresh independent R across the whole bounded Tesla readiness scope.

## Accounting and next step

Strict formal accounting stays **`151/944`**, remaining **`793`**. This readiness task is permanently zero-credit.

If fresh independent R returns `IMPLEMENTATION_ACCEPTED_CANDIDATE`, FORMAL must A-sync/rescan this exact readiness Candidate and remain on `servant.tesla`. If that rescan finds no additional complete-owner readiness gap, the next formal transaction is one owner-complete Tesla migration containing sc1 + sc2 + sc3 together. At current mechanical history, all three are newly creditable, so only a later exact formal `MIGRATION_ACCEPTED` plus A-sync could move `151/944 -> 154/944`, remaining `790`.
