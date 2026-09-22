# P3-B2 FB2-53 Basic-Strength Play -> Opponent Servant-Skill Face-Down Result

Role: B2
Task: P3-FB2-53-BASIC-STRENGTH-OPPONENT-SERVANT-SKILL-FACE-DOWN
BaseCommit: `fce4e3df812a1c4ba3c7f5ca9ff2d73c69b42d0a`
ReferenceCommit: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
MechanicFamily: bounded basic-Strength effect-play -> same-location opponent servant-skill face-down transaction
AffectedAbilities: `[]`
RuntimeBehaviorChanged: true
MigrationCredit: `0`

## Result

Implemented only the identity-free FB2-53 two-stage whole-ability family dispatched for the first source-grounded Helena-S1-shaped closure seam. Production runtime contains no Helena/servant identity, Chinese printed text, clause hash, or frozen-id routing.

The new vocabulary is deliberately reserved to one exact whole envelope rather than exposed as generic selectors or a generic face setter:

- target 1: exactly one controller-owned/controller-controlled hand card constrained by literal `basic_strength_attack`;
- effect 1: existing `play_selected_cards` for that target;
- target 2: exactly one skill-zone card constrained by literal `same_location_opponent_face_up_servant_skill`;
- effect 2: exact `set_selected_card_face_down` for that second target.

The whole classifier requires an automatic action-phase `phase_action` on `controller_action_window`, exact target/effect order and keys, empty ability-level cost/creates/rule-modifier/lifecycle/limit/visibility surfaces, and canonical response/execution defaults. Reserved vocabulary in a wrong slot, reordered/widened target/effect, extra key, changed cardinality, or unrelated whole ability fails closed through the loader gateway and compiled runtime admission.

Runtime behavior:

- `basic_strength_attack` accepts only the current controller's physical hand card whose executable definition is exactly `basic_attack`, whose effective attributes include literal `力量`, and which is currently playable under the same server `playFailure` contract used by effect-play; servant/master attacks, non-Strength basics, foreign cards, insufficient-mana cards and other unplayable cards do not qualify;
- the existing pending-decision engine remains authoritative: activation creates the first target decision, the first successful choose creates the second target decision without playing the attack yet, and only the final valid choose settles both effects in one dispatch clone;
- existing `play_selected_cards -> playBatch(..., quota='effect')` performs the first effect, preserving normal printed mana payment, play requirements, face-up-card limit handling, attack placement, play counters and authoritative declare/play event processing; no duplicate play implementation was added;
- the second selector accepts only an owner-controlled face-up `servant_skill` in the `skill` zone of another active player at exactly the controller's current location; self, remote, master-skill, already-face-down, wrong-zone and foreign-controlled cards are excluded;
- face-down settlement preserves physical instance id, definition id, owner, controller and zone; it sets runtime `faceDown=true`, `active=false`, normalizes visibility to owner-only, and emits one server `card_set_face_down` event;
- this path is not card-close semantics and does not call the generic close-card operation;
- both target stages are revalidated against live server state on `choose_target`; stale/forged choices fail before settlement, and a stale final target leaves the first attack unplayed and mana unchanged because the final command is transactional.

No generic `basicOnly` selector, arbitrary attribute selector, arbitrary same-location opponent card query, arbitrary skill selector, arbitrary card face setter, Helena authoring, generated/product/client content change, merge/retarget, or migration credit was added.

## Evidence

- `FD_TOOLCHAIN_OK`.
- FB2-53 focused whole-envelope/runtime proof: `1` file / `8` tests PASS.
- Affected compatibility bundle (FB2-53 + generic authoring interpreter + ordinary play + skill-use forbid + card-close forbid + face-up-card limit): `6` files / `82` tests PASS.
- Typecheck: PASS after final implementation.
- Official `npm run test:ci -- --maxWorkers=2`: **`185` files / `1383` tests PASS**.
- `npm run content:validate`: PASS (`7` masters / `7` servants / `20` events / `0` blocking issues).
- `npm run verify:generated-content`: PASS; content-library SHA-256 remains `b38f475ddba68450d678f38da04d336d5d905c315527f08c474496fd09076f0c`.
- Locked Reference verification: PASS at exact `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- Client production build: PASS; only existing Vite browser-externalization/chunk-size warnings.
- `npm run phase3:coverage`: PASS (`128` archives / `173` cards / `286` abilities / `78` compiled cards / `14` compiled characters / `blockingIssues=0` / `dualRuntime=0`); generated coverage artifact restored byte-for-byte from exact Base.
- `npm run phase3:automation-audit`: PASS (`promotionFindings=20`); generated audit artifact restored byte-for-byte from exact Base.
- frozen recount: denominator `944`, material overlap remains `150/944`, duplicate frozen ids `0`, `servant.helena.skill.sc-helena-1` remains absent.
- production diff identity-routing probe for `Helena` / `海伦娜` / `奥尔科特` / `sc-helena`: no hits.
- product/generated/pack/client diff from exact Base: empty.
- `git diff --check`: PASS.

Formal migration remains **`155/944`**, with **`789`** remaining. Frozen material authoring overlap remains **`150/944`**. FB2-53 is zero-credit capability infrastructure.

After exact fresh independent R `IMPLEMENTATION_ACCEPTED_CANDIDATE` plus A synchronization, A must freshly reconstruct `servant.helena.skill.sc-helena-1` on that synchronized baseline. Singleton S is allowed only if the complete frozen card is then mechanically zero-gap; otherwise dispatch only the next minimum missing seam.
