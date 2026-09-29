# P3-B Teach Owner Readiness Capability — Result

Role: Codex B
Status: `IMPLEMENTED_AWAITING_CANDIDATE_REVIEW`
Date: 2026-09-29
Base: `1987bfe9e23037c2e682fba15bc83fbff8cf33c0`
Classification: bounded zero-credit owner-readiness capability for current owner `servant.teach`

## Full-owner preflight

Frozen owner scope is exactly:

1. `servant.teach.skill.sc-teach-1` — newly creditable only in the later formal owner batch;
2. `servant.teach.skill.sc-teach-2` — newly creditable only in the later formal owner batch;
3. `servant.teach.skill.sc-teach-3` — historical FM01 accepted material, preservation-only and never re-credited.

Mechanical authoring inspection at Base confirms `data/authoring/servants/servant.teach.json` already contains only sc3. Historical FM01 synchronization records exact S Candidate `6203b70c5bc2a81ceecca31008dc2b71246519a9`, F1 evidence `59f145434695d29bdd17e4cb3adc887e84182377`, and includes `servant.teach.skill.sc-teach-3` in the accepted FM01 membership. Therefore this readiness task does not alter `data/authoring/**` and does not reopen sc3.

The frozen source-evidence batch for Teach is mechanically grounded by S `80aaa029ff20448b92afc4fd115080cd3f34a60c`, independently audited by `4961de83468716cc748f16faf9f03212c47a8713`, and accepted by R `9d92b036332fc22df07ccb8f26af0bc69c066b34`; final F1 evidence closure is `59f145434695d29bdd17e4cb3adc887e84182377`. Locked Reference remains evidence-only at `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.

Preflight found one bounded generic readiness family spanning the two missing Teach consumers:

- sc1 replaces only the controller's competition-VP branch after an authoritative contested win, selects one authoritative loser, exposes the physical top three cards of that loser (recycling discard only if needed), removes exactly one selected physical card, grants VP equal to its printed base Power capped at 5, and preserves arbitrary order for the other exposed top cards;
- sc2 replays exactly one physical card previously removed by that accepted record, preserves original ownership while giving the Teach controller play control, applies normal play cost with a floor of 2 mana, and removes the active source skill after the battle terminal;
- runtime provenance is bound to exact physical card, controller, source card/ability, authoritative battle-result identity, original owner, record key, revision, the exact winning trigger event, and a private server event proving the selected card belonged to the validated top-three removal set;
- pending private decisions and persisted removed-card authority are restore-validated and malformed/stale/forged provenance fails closed;
- no `core.teach-gentleman-love`, `core.teach-queen-anne`, character/card-name identity routing, printed-text parsing, or `SkillLib` fallback is restored.

## Implementation

Added the generic identity-free `battle-plunder-replay` capability and exact loader/runtime gateway:

- `battle_competition_reward_plunder` — exact competition-reward replacement + physical top-three loser-deck plunder/reorder semantic;
- `play_recorded_removed_card` — exact recorded-physical-card replay semantic with minimum 2-mana paid cost and post-battle source removal;
- privileged whole-ability validation rejects widened/near-match shapes before runtime fallback;
- battle reward construction skips only the accepted provider controller's competition-VP adjustment when the authoritative result contains at least one loser; all-winner contested ties keep ordinary competition VP and never force an impossible plunder choice;
- physical removed-card authority and private continuation metadata are authenticated on restore; persisted recorded-card replay authority must match the exact server-emitted removal evidence (source/ability/result/winning-trigger/revision/top-three set/selected physical card/original owner);
- generic `playBatch` minimum-cost parameter defaults to zero, so existing callers retain their previous behavior.

`data/authoring/**` delta from exact Base is EMPTY. No Teach formal consumer is included in this readiness Candidate.

## Verification

- focused Teach readiness regression: `7/7 PASS`;
- directly affected green set: `12 files / 261 tests PASS`;
- focused coverage includes exact gateway negatives, competition-VP replacement isolation, authoritative winner/loser facts, physical top-three removal, printed-Power cap, arbitrary reorder, recorded physical replay, minimum-cost floor, ownership preservation, source post-battle removal, pending decision restore, durable provenance restore, forged provenance rejection, and production identity audit;
- `FD_TOOLCHAIN_OK`;
- `npm.cmd run typecheck`: PASS;
- `npm.cmd run content:validate`: PASS — `7 masters / 12 servants / 20 events / 0 blocking issues`;
- `npm.cmd run content:compile`: PASS — same result;
- `npm.cmd run verify:generated-content`: PASS with unchanged hashes:
  - `b2c446488a28c5036ac36557e09b563b54b11018d5396233a53f37ffdbff6923`
  - `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - `f4ae33de4dc2832766064bdf46e277d9559398d4d34b45d7d05a0eb76744cd14`
- production identity audit: CLEAN;
- locked Reference clean/detached at exact commit;
- `git diff --check`: PASS.

## Fresh-R revision closure

Predecessor Candidate `f8a10e61fef647a129f6c8bdc0309099b281d3b4` received `IMPLEMENTATION_NEEDS_REVISION`. Canonical Coordinator bounded relay for that same completed review attempt is `https://github.com/binchen648/fd/pull/483#issuecomment-5883235407`.

Both P1 findings are closed together in this successor:

- all-winner contested ties now gate competition-VP replacement on the existence of an authoritative loser, matching the trigger gateway and preventing reward suppression with no legal plunder target; a dedicated two-winner/no-loser regression is green;
- recorded removed-card authority now requires exact server-created removal evidence that binds the selected physical card to the validated top-three set, exact winning trigger/result, source/ability, owner/controller and revision; a regression substitutes a different loser-owned removed physical card while keeping otherwise-valid source/key/result provenance, independently seals that forged state, and restore rejects it.

The latest HELPER report available during this task is Epoch 7 for already synchronized Tamamo and is stale auxiliary evidence only; it grants no Teach verdict, scope, or credit.

## Accounting and next step

Strict formal accounting stays **`149/944`**, remaining **`795`**. This readiness task is permanently zero-credit.

If fresh independent R returns `IMPLEMENTATION_ACCEPTED_CANDIDATE`, FORMAL must A-sync/rescan this exact readiness Candidate and return immediately to the same owner `servant.teach`. The later formal owner-complete transaction must contain preserved sc3 plus new sc1 + sc2 together. Only sc1 + sc2 may receive new migration credit, so an accepted synchronized Teach formal result may move `149/944 -> 151/944`, remaining `793`; sc3 remains `+0`.
