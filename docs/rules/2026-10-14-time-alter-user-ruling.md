# Time Alter User Ruling

Date: 2026-10-14. Authority: explicit user clarification in the Reviewer B conversation.
Scope: master.kiritsugu.skill.time-alter / time-alter.action only.
This records a rule decision, not implementation acceptance or a new universal PLAY rule.

## Confirmed Contract

1. Time Alter is a Master phase ability. Its source does not need to be played
   first. Master abilities are normally already active under Final Rules 11.1.
   Activation still requires the legal action-phase ability window, ownership,
   usage limits and all other applicable requirements.
2. The played card is a separate target in the controller's hand, not the Master
   ability source. Select exactly one otherwise legally face-down-playable hand
   card, play it face-down, then draw exactly one card.
3. Origin Bullet is an allowed target when legally present in the controller's
   hand. Its master_deck_card implementation type must not exclude it by itself.
4. Skill cards are not hand targets in this contract. Time Alter does not grant
   permission to move a skill card into the hand or override the normal skill-card
   face-down restriction in Final Rules 9.5. Artificially changing a skill card's
   zone in a test does not establish a legal production target.
5. This does not waive other play prohibitions, source/target ownership, zone,
   timing or card-specific requirements. Otherwise illegal targets remain illegal.
6. Face-down play remains play/use, not activation. Apply normal face-down rules:
   no mana payment, no active attack power, hidden information protection and
   applicable later cleanup. Drawing follows successful play; rejected selection
   or failed play must not draw or partially commit the dispatch.

## Authority Trace

The user confirmed that the target is any otherwise legally face-down-playable
hand card, that skill cards are not hand cards, and that Origin Bullet is allowed.
The user then confirmed the distinction between activating a Master ability and
playing its target card, and explicitly requested this clarification be recorded.
No GitHub-bound human attestation is claimed by this conversation record.

Reference rules: 9.5, 9.6, 11.1 and 11.10. Printed text remains unchanged:
play one card face-down, then draw one card. Do not rewrite it as attack-only.

## Implementation Disposition

Observed source: a42b5e1c517141b90f3407773958b0d8afe63264.
Current isAttack excludes master_deck_card although the play classifier treats
Origin Bullet as attack. The target selector and face-down play validator thus
exclude an explicitly allowed target. This is a scoped implementation mismatch.
The old attack-only implementation envelope cannot certify the whole identity.

Planner must authorize one correction slice with exact base and literal writable
paths before production work. Fix shared target/play legality consistently; do
not add Origin Bullet/Time Alter identity-specific bypasses. Review compiler and
semantic-route applicability if changing the target shape. Do not widen unrelated
PLAY, ADD_TO_ATTACK, ACTIVATE, CLOSE or other card families.

Required evidence includes real setup replacement and draw to hand, activation
without playing the Master source, Origin Bullet face-down play followed by one
draw, basic/servant hand attacks, skill-card exclusion, wrong owner/zone/phase,
play prohibition, malformed graph, atomic failure, no legacy fallback and hidden
projection. Freeze one candidate for fresh RB review, then A/RA evidence binding.
Browser, promotion, migration credit and Release remain separate gates.
