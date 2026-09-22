# P3-A FB2-53 Basic-Strength Play -> Opponent Servant-Skill Face-Down Dispatch

Role: Codex A
Status: `READY`
Date: 2026-09-23
Task: `P3-FB2-53-BASIC-STRENGTH-OPPONENT-SERVANT-SKILL-FACE-DOWN`
Branch: `codex/b2-p3-fb2-53-basic-strength-opponent-skill-face-down`

## Exact baseline

- Exact A Base: `475fe8d8bb8ae8054211d79a6882864b2e4f0314` (P3-A-R111 Ciel S1b acceptance synchronization).
- Formal migration: **`155/944`**, **`789`** remaining.
- Material authoring overlap: **`150/944`**.
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.

Fresh current-baseline reconstruction did not find a truthful zero-gap singleton among the lowest-complexity uncredited rows. Historical readiness labels were not reused. Darius S3 still depends on a source-unresolved `sc-darius-4` definition; Andersen S2 remains a compound transform/defeat-immunity boundary; Akasha S1 still spans copy + unsupported lifecycle + target-definition seams; Arcueid and Albion candidates retain multiple runtime/content dependencies. Previously accepted Ibaraki S1 is excluded from candidate credit even though that identity is not materialized on this lineage.

The first bounded source-grounded closure target is `servant.helena.skill.sc-helena-1`. Earlier probes identified both exact same-location-opponent servant-skill targeting and face-state mutation as missing. The current engine now already supplies authoritative multi-target interaction sequencing plus `play_selected_cards -> playBatch`, including normal mana payment, play requirements, face-up limits and play event provenance. The minimum remaining capability can therefore be one exact two-stage whole-ability envelope without exposing generic selection or flip infrastructure.

## Frozen consumer evidence

Consumer:

- canonical id: `servant.helena.skill.sc-helena-1`;
- owner: `servant.helena` / 海伦娜·布拉瓦茨基;
- name: `奥尔科特上校`;
- source ability id: `colonel-olcott-action`;
- frozen printed text / sole clause: `被动/行动阶段：从手牌打出一张力量基础攻击，若如此做，将一名你所在地点的对手技能区明置的一张从者技能暗置。`;
- F1 locator: `src/content/authoring/cards.json / skillCards[31].abilities[0].printedClause` at Phase-3 evidence commit `59f145434695d29bdd17e4cb3adc887e84182377`;
- full-text / clause SHA-256: `abc76e38254ac8688fa7caef5392e28a7b8baa507479231db743a638e9f3fc52`;
- Locked Reference static metadata: servant skill, passive, printed cost `0`, base power `0`, no attributes, no requirement.

F1 semantic order is authoritative: choose one playable controller-hand basic Strength attack; play it and pay normal cost; only after that successful play, choose exactly one face-up servant skill in a same-location opponent's skill zone and set that physical skill face down.

## Exact capability released

Implement exactly one identity-free whole-ability family. The authoring/compiled envelope must be structurally bounded to:

1. `kind=phase_action`, action phase / `controller_action_window`, automatic execution;
2. no ability-level mana cost, creates, rule modifiers, lifecycle, limit, or arbitrary response window;
3. first card target: exactly one controller-controlled card in hand, constrained by the literal token `basic_strength_attack`;
4. first effect: existing `play_selected_cards` of that exact target, face up, using the existing effect-play `playBatch` path so normal printed mana cost, requirements, face-up limits and authoritative play events are preserved;
5. second card target: exactly one skill-zone card from any owner/controller, constrained by literal token `same_location_opponent_face_up_servant_skill`;
6. second effect: literal `set_selected_card_face_down` targeting only that exact second target.

The two new selector tokens and the face-down effect token are **not generic authorization**. Any occurrence outside this exact whole envelope, in the wrong target/effect slot, with extra fields, reordered targets/effects, widened cardinality, arbitrary attributes/card types/zones/controllers, or additional sibling semantics must fail closed at loader admission and runtime execution.

## Runtime semantics

The exact server semantics are:

- `basic_strength_attack` candidate = current controller's physical hand card whose executable definition has `cardType=basic_attack`, printed/effective Strength attribute `力量`, and which is currently playable face up through the same validation used by effect-play `playBatch`; do not admit servant/master attacks or an unplayable/insufficient-mana card.
- Existing effect-play semantics remain authoritative: selecting the first card must ultimately call existing `playBatch(..., quota='effect')`; no duplicate mana/payment/play-event implementation.
- `same_location_opponent_face_up_servant_skill` candidate = a physical card whose controller is another active player at exactly the controller's current location, whose owner equals that opponent controller, whose zone is exactly `skill`, whose executable definition is exactly `servant_skill`, and whose runtime faceDown state is exactly false.
- The second mutation must preserve physical identity, owner, controller and zone; set runtime `faceDown=true` and `active=false`; normalize visibility to owner-only for that physical owner; emit one safe server event identifying the changed card.
- Generic card closing is not invoked and card-close prohibition is not silently inherited: this capability is face-state mutation, not a close-card action.
- The pending-target engine must snapshot candidate sets through existing decision state and revalidate live candidates on each choose command. Forged ids, stale zone/location/controller/owner/definition/face state, wrong source context, malformed persisted decision state, duplicate selections, or changed whole-envelope semantics must fail closed before that command's mutation.
- If the first play cannot still succeed when selected, the entire first choose command is transactional. The second target selection occurs only after the first target has been chosen through the accepted sequencing path; no client-authored candidate lists are trusted.

## Forbidden widening

FB2-53 must not:

- author Helena or any frozen consumer card;
- branch on Helena/card/owner identity, Chinese printed text, clause hash, or frozen id in production runtime;
- expose arbitrary `basicOnly`, arbitrary attribute selectors, arbitrary opponent skill selectors, arbitrary same-location card queries, or a generic card face setter;
- allow master skills, face-down skills, remote players, self cards, controlled foreign skills, non-skill zones, or non-basic/non-Strength first cards;
- bypass normal printed mana cost / play requirements / face-up play limits for the first card;
- modify product/generated/client content or frozen KPI definitions;
- merge or retarget any stacked PR;
- claim migration credit.

## Required B2 proof

At minimum, tests must prove:

- raw + compiled exact envelope admission and wrong-slot/extra-key/near-match fail-closed behavior;
- basic Strength hand candidate admits the exact basic card but excludes servant/master attacks, non-Strength basics, opponent/remote/stale cards and currently unplayable cards;
- first play charges the card's ordinary printed mana cost through existing playBatch, moves it to the ordinary attack destination and emits ordinary authoritative play events;
- second candidate set contains exactly same-location active opponents' owner-controlled face-up servant skills and excludes self, remote, master skill, already-face-down, wrong-zone and foreign-controlled cards;
- exact selected target becomes face-down/inactive owner-only while physical identity/owner/controller/zone stay unchanged;
- forged/stale first and second decisions fail closed transactionally;
- existing generic hand-play, face-up limit, card-close and skill-use-forbid behavior remains unchanged;
- serialization/replay-safe pending decision metadata is validated if any new metadata is introduced;
- focused tests + typecheck + full CI + content/reference/generated/client/coverage/audit gates required by current repo contract remain green;
- `git diff --check` PASS.

## Accounting

FB2-53 is capability-only and earns zero frozen credit. Formal migration remains **`155/944`**, **`789`** remaining, material overlap **`150/944`**. After exact fresh independent R `IMPLEMENTATION_ACCEPTED_CANDIDATE` plus A synchronization, reconstruct `servant.helena.skill.sc-helena-1` from the synchronized baseline. Dispatch singleton S only if the whole card is then zero-gap; otherwise dispatch only the next minimum missing seam.
