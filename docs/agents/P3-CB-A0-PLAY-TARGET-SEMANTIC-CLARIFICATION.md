# P3-CB-A0 PLAY Target Semantic Clarification

Date: 2026-10-14. Control Epoch: FD-P3-2026-09-23-09.
Observed main: a42b5e1c517141b90f3407773958b0d8afe63264.
Task ID: P3-CB-A0-PLAY-TARGET-SEMANTIC-CLARIFICATION.
Disposition: USER_RULE_CLARIFIED / CURRENT_IMPLEMENTATION_MISMATCH.
Authoritative clarification: docs/rules/2026-10-14-time-alter-user-ruling.md.
The user allows Origin Bullet as an otherwise legally face-down-playable hand
target and confirms that Time Alter is activated as a Master phase ability, not
played as its source card. Skill cards are not hand targets in this contract.
The historical questions below are retained as investigation history, not open
questions. Production writes and the suspended reservation are not reauthorized
by this clarification. Planner must dispatch a separate limited correction.
Next owner: Codex B for the separately authorized correction at
docs/agents/P3-CB-A0-TIME-ALTER-PLAY-LEGALITY-REPAIR.md; Reviewer B then
reviews the frozen candidate. The historical read-only task is closed.

## Verified Boundary

- Frozen identity: master.kiritsugu.skill.s2; production definition: master.kiritsugu.skill.time-alter; ability: time-alter.action.
- Printed clause: `行动阶段：暗置打出一张牌，然后抽一张牌。` (`data/authoring/masters/master.kiritsugu.json`).
- Current target: exactly one controller hand card constrained by `is_attack`; current PLAY semantic route explicitly requires that constraint.
- Final Rules 9.4 governs ordinary play of attacks. Sections 9.5-9.6 govern face-down and effect play; 9.6 separately says `打出一张攻击`. Section 11.1 defines playing a card from a legal zone. These sections do not, by themselves, prove that every hand card is a legal face-down target for this skill or that `一张牌` means only attack cards.
- `isAttack` in `packages/rules/src/ability/interpreter.ts` excludes `master_deck_card`, while `classifyCardPlay` and the executable pack classify that type as attack. Kiritsugu's `master.kiritsugu.deck.origin-bullet` is a master deck card. This is an observed classification inconsistency, not yet an accepted runtime defect for this exact effect.
- The historical scoped PLAY report accepts the attack-only shape as an implementation candidate. It does not supply a source-to-target rule ruling. The A0 conformance report identifies the mismatch; its new Vitest test was not executed in that checkout. A synthetic event-in-hand fixture is not evidence that such an event is a legal production target.

## Historical Questions (Resolved By User Ruling)

1. For Time Alter, does `一张牌` mean (A) any otherwise legally playable controller hand card, (B) only attack cards, or (C) a category conditional on card type and face-down legality? State the rule source and legal zone for each category. Do not infer the answer from the current authoring constraint.
2. Are support/event or other non-attack cards actually obtainable in a production controller hand, and can they be legally played face-down by this effect? If none are, distinguish unreachable counterexamples from actual restrictions.
3. Is Origin Bullet a legal Time Alter hand target after its setup replacement? Trace its definition, initial/deck/hand flow, target projection, `is_attack` check, `playFailure`, and shared playBatch. Include positive and negative bounded fixtures; label synthetic setup explicitly.
4. Does `CARD_ACTION_SEMANTICS_MINIMAL_PLAY` remain valid as an attack-only *scoped implementation contract* even if the whole printed identity needs a wider contract? Separate primitive validity, route validity, and whole-identity conformance.

## Evidence Packet

Read only the exact main rule sections 4.2, 9.4-9.6, 11.1, 11.10; Kiritsugu source authoring and canonical frozen text; current interpreter target/legality/classification functions; executable pack classification; shared playBatch; existing PLAY regression and historical scoped review. Bind each source to an exact SHA/blob. Provide a table for basic/servant attack, servant skill, master deck card (Origin Bullet), and any *proven production-reachable* non-attack hand card. For each: production reachability, face-down legality, projected selection, execution, and authority for the conclusion. Mark unsupported cells UNKNOWN.

Reviewer B checks the source-to-rule reasoning and counterexamples without implementing a fix. If final rules and confirmed decisions do not settle the legal category, Planner records the precise unresolved rule question for the user/rule authority. No Reviewer may convert an implementation convention into a new canonical rule.

## Exit And Routing

- CONTRACT_VALID only if the entire printed clause and all production-reachable legal targets are shown to fit the existing attack-only contract; record exact evidence path, Reviewer B verdict, and a fresh A0 retry candidate. Historical scoped PASS alone is insufficient.
- CONTRACT_INVALID if accepted rule evidence proves a legal target excluded by the current route or an illegal target included. Then Planner creates a separate, scoped authoring/runtime correction task for Codex B; Reviewer B must accept the changed contract and behavior. No automatic production write or migration credit follows this document.
- The category decision is now recorded in the user ruling. Current implementation excludes Origin Bullet and therefore needs a separately authorized correction. A0 Lead Builder and promotion remain blocked until fresh corrected-candidate acceptance; clarification alone is not acceptance.

This task is read-only. Do not alter authoring, tests, runtime, reservation ownership, migration credit, or policy. Do not start a replacement A0 implementation in parallel.
