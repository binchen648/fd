# P3 A — FB2-45 pre-battle defeat by round attack attribute dispatch

Status: `DISPATCHED`

## Current synchronized baseline

- Exact current baseline: `0ffcbdbb8f9e0dbdf796bd95de7fc9c0601821c2` (Darnic s1a migration acceptance synchronization).
- Formal migration: **148/944**, **796** remaining.
- Current material authoring overlap: **143/944**, duplicates **0**.
- FB2 work is capability infrastructure and earns **zero migration credit**.

## Why a B2 seam is formally next

Migration-credit-first was re-run on the exact current baseline rather than trusting historical `READY_GENERIC_EXTENSION` labels.

1. Darnic s1a was the only new direct-ready consumer found after the previous zero-ready proof; its accepted S Candidate changed consumer authoring/tests only and added no runtime capability, so it cannot unlock a second consumer by itself.
2. A fresh scan of the authoritative 944 inventory found 58 currently-unmaterialized `SOURCE_GROUNDED`, block-free historical candidates. Current loader/runtime vocabulary and exact accepted classifiers were then checked rather than inferred from capability names.
3. Known low-complexity rows still retain concrete blockers: Akasha s1 (copy semantics + `until_condition_met`), Ciel s1b (round VP threshold crossing + missing `master.ciel.skill.s3` target definition), Arcueid s1/s3 (skill-used/reset or card-cost seam), Nobunaga s3 (winner-resource routing), Albion s2 (first-move ledger + source-card permanent power), Sion s13 (VP payment), Helena s1 (`set_selected_cards_face`), Valkyrie s3 (three Commander support definitions + retrigger primitive), and the other spot-probed stale rows retain unsupported modifier/event/selection/special-effect contracts.
4. Exact accepted capability names were not treated as generic authorization: e.g. FB2-36 `skill_use:forbid`, add-to-attack, combat-power and Presence Concealment routes are all exact structural classifiers and fail closed for nonmatching shapes.

The current `S_READY_NOW` queue is therefore defensibly zero, so one narrow zero-credit runtime seam is permitted.

## Nearest one-seam closure target

Select exactly `servant.medusa.skill.sc-medusa-2` (`石化之魔眼`) as the next whole-card closure target.

Locked Reference/F1 source-grounded whole-card semantics are structurally small:

- action phase;
- source must be active;
- true-name declaration on use;
- defeat each engaged opponent that, in the current round, has not played or had added to its attack any attack with attribute `迅捷`.

Reference has only three `defeat_player` effect occurrences. Medusa's exact target shape is unique:

`scope = engaged_opponents` with exactly one `where` predicate `no_attack_played_this_round_with_attribute` and one attribute value. Gorgon and Mephisto use different scopes/predicates and must remain unsupported.

Current runtime already provides every surrounding fact needed by this card:

- ordinary plays write authoritative `cardState.playedRound`;
- accepted add-to-attack writes the same `playedRound` and changes `controllerPlayerId` to the player whose attack the card joined;
- card definitions provide server-known attack/attribute metadata, including hidden cards without leaking it to clients;
- battle participants are authoritatively derived from active players at the battlefield;
- battle-loss immunity is already centralized in settlement via `ignoresBattleLossEffects`;
- action activation, source-active gating and servant-package true-name reveal are already accepted.

The only remaining whole-card gap is a bounded pre-battle defeat intent and its exact Medusa round-attack-attribute selector.

## FB2-45 implementation contract

Implement **only** the following identity-free semantic shape. Do not create a generic arbitrary `defeat_player` engine.

1. Loader accepts `defeat_player` only when the containing automatic ability is exactly:
   - `kind: phase_action`;
   - activation exactly action/controller-action-window;
   - exactly one `source_active` condition;
   - no targets, cost, creates, rule modifiers, response window, limit or lifecycle payload;
   - exactly one effect;
   - effect exactly `{ type: "defeat_player", target: { scope: "engaged_opponents", where: [{ type: "no_attack_played_this_round_with_attribute", attribute: <non-empty canonical attribute> }] } }`;
   - ordinary servant-package true-name reveal metadata is allowed exactly as already accepted for action skills.
2. Resolution derives the controller battlefield from authoritative current state and fails closed unless the controller is active at an enabled battlefield.
3. Candidate targets are the other active players at that same battlefield (the same player set from which battle participants are derived). No arbitrary player IDs or client target selection are accepted.
4. For each candidate, the server checks whether any attack currently/provenance-controlled by that player has authoritative `playedRound === current round` and a definition containing the requested attribute. Both ordinary play and accepted add-to-attack must satisfy the history check. Face-down visibility must not suppress the server-side check or reveal the hidden definition to clients.
5. Only candidates with **no** matching round attack receive a pre-battle defeat intent keyed at least by current round + battlefield + target player + source provenance. Repeated resolution must be idempotent.
6. At authoritative battle settlement for that same round/battlefield, matching pre-battle defeat targets are excluded from winning exactly as a battle `【败北】` effect. Existing battle-loss immunity (e.g. Luck) must be honored. The intent is consumed after the matching settlement and must not leak across rounds/battlefields.
7. Do **not** reuse or widen `pendingPresenceConcealmentDefeats`: that contract is bound to post-power `resultId` + frozen Power snapshots. FB2-45 needs a separate narrowly typed ledger so Presence Concealment invariants remain unchanged.
8. No identity/name/Chinese-text hardcoding in runtime. Medusa is evidence for the exact shape only.
9. Gorgon's `same_battlefield_opponents + face_up_cards_played_this_round_at_least`, Mephisto's controller defeat, arbitrary defeat scopes/predicates, elimination, and generic status mutation remain unsupported.

## Required tests / gates

Focused regression must prove at minimum:

- exact loader shape accepted; widened/wrong phase, scope, predicate, extra fields, multiple effects/conditions and Gorgon/Mephisto near-shapes rejected;
- no matching swift round attack -> same-battlefield opponent receives pre-battle defeat and cannot win settlement;
- ordinary swift attack this round prevents defeat;
- accepted add-to-attack swift card this round also prevents defeat;
- non-swift attack does not prevent defeat;
- another battlefield / inactive player / controller itself unaffected;
- previous-round `playedRound` does not protect;
- face-down swift attack still counts server-side without exposing hidden definition;
- existing battle-loss immunity cancels the defeat consequence;
- intent is idempotent, consumed at matching settlement, and does not leak to another round/battlefield;
- Presence Concealment focused regressions remain green.

Then run typecheck, strong rules subset, full CI, content validation, generated-content determinism, exact Locked Reference verification, client build, coverage, `git diff --check`, and identity/hardcode audit.

## After fresh R

FB2-45 itself keeps formal migration at **148/944**, **796** remaining. Only exact fresh-R `IMPLEMENTATION_ACCEPTED_CANDIDATE` plus A synchronization can accept this capability. After that synchronization, immediately re-overlay the complete `servant.medusa.skill.sc-medusa-2` card; dispatch singleton S only if the whole-card probe is mechanically zero-gap. If any other blocker remains, record it and do not credit the identity.