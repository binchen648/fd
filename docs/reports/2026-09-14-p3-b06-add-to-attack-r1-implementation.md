# P3-B06 Add To Attack R1 Implementation Candidate

- Document Role: AGENT_IMPLEMENTATION_REPORT
- Owner: Codex B
- Task: `P3-B06`
- Mechanic Batch: `CARD_ACTION_SEMANTICS_MINIMAL_ADD_TO_ATTACK`
- Accepted Runtime Base: `c505c4748251feb9d151f4af52f091162a64a5b6` (accepted P3-B05 R2)
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`

This is implementer evidence only. Independent P3-R05 review is required before acceptance.

## Scope

This candidate validates and closes the exact Maiya `military.attach-support-shot` add-to-attack contract on the currently accepted runtime chain. The typed `attach_card_to_player_attack` primitive, semantic classifier, server target selection, support-card source validation, attachment state, cannot-win marker, event envelope, and browser E2E already existed in the accepted ancestry through the earlier scoped runtime work. This task does not duplicate or rewrite that implementation.

The exact contract remains:

- advance phase / controller action window;
- controller must not be at a battlefield;
- exactly one active non-controller player target;
- fixed ability cost of 2 mana;
- support card must be controller-owned and in the skill zone;
- direct `attach_card_to_player_attack` with return-at-round-end marker and scoped cannot-win status semantics;
- direct attachment is **not normal PLAY** and does not consume normal card-play or attack-declaration counters.

## Gap found and repaired

Fresh B06 probing found one legality/UI gap in the inherited route: when every other player was inactive/eliminated, the server-projected legal action list still offered `military.attach-support-shot`; dispatch then failed with `no_legal_target`. No cost was committed, but an unusable action was exposed.

The repair applies the existing mandatory-target-availability check to the exact ADD_TO_ATTACK semantic route in `canActivate`. This is semantic routing only; no character, card, or ability id branch was added.

After repair, with no active non-controller target:

- activation is not projected as legal;
- direct dispatch is rejected as `illegal_action`;
- mana remains unchanged;
- Support Shot remains in skill;
- no pending decision, events, or revision are committed.

## Task-required proofs

### Attach beside an existing attack

A regression fixture places an already-active attack under the target player's control before resolving Support Shot. After resolution:

- the existing attack remains in the target player's `attack_area`;
- Support Shot is also in that same player's `attack_area`;
- Support Shot owner remains Maiya's controller while controller becomes the target player.

This proves append/attach behavior without replacing the target's existing attack. It does not invent an authoring requirement that the target must already have an attack; the canonical authoring only requires one other player.

### Normal PLAY counters are not consumed

The same regression seeds nonzero `cardsPlayedByPlayer` and `attacksDeclaredByPlayer` counters for both Maiya and the target. They remain byte-for-byte equal after attachment.

Only the Military ability's explicit 2 mana is paid: mana `6 -> 4`. Support Shot's printed card cost is not charged because rules 11.10 distinguish direct "加入攻击" from "打出".

### Target revalidation

A two-dispatch regression activates the ability successfully, committing the 2 mana and pending target decision. The selected target is then made inactive before the target command. The stale target command is rejected as `illegal_target` while preserving the first dispatch and rolling back only the second dispatch:

- mana remains 4;
- Support Shot remains in skill;
- pending decision remains;
- events and revision do not change on the rejected second dispatch.

## Before / After

Scoped B06 inventory remains:

```text
legacyAddToAttackConsumerCount.before=1
legacyAddToAttackConsumerCount.after=0
newRuntimeSemanticRoutedAddToAttackCount.before=0
newRuntimeSemanticRoutedAddToAttackCount.after=1
dualCompatibleAddToAttackCount.before=1
dualCompatibleAddToAttackCount.after=0
remainingSkippedCardActionCount.after=6
```

This task does not update A-owned global KPI/taxonomy artifacts.

## Verification

- `npm run typecheck`: PASS.
- ADD_TO_ATTACK inventory: eligible 1, skipped 6; scoped before/after as above.
- focused B06 + executable pack + data-flow + B04/B05 regression run: **61/61 PASS** across 5 files.
- browser/WS/reconnect/stale-command B06 Playwright: **1/1 PASS**.
- repeat Playwright stability: **5/5 PASS**.
- `git diff --check`: PASS.

Full-suite environment result:

- `npm run test:ci`: **490 passed / 5 failed / 495 total**.
- The five failures remain the inherited baseline classes: missing CHM/image evidence, two historical absolute `D:\\fd\\data\\manifests\\sample-cards.json` tests, and the existing generated-content definition-hash mismatch.
- No B06 focused/runtime regression failed.

## Boundaries not promoted

This candidate does not claim or modify:

- Support Shot `append_only_rule` or `suppress`;
- round-end return cleanup beyond retaining the existing marker/attachment record;
- normal PLAY or B05 response-play semantics;
- CREATE_AND_ACTIVATE, ACTIVATE, or CLOSE;
- Trigger/Lifecycle/Battle families outside this exact representative;
- roster-wide migration, Phase 3 completion, or release readiness.

## Completion Claim

`IMPLEMENTATION_COMPLETE_CANDIDATE`
