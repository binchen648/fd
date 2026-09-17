# P3-B18 Artoria Alter Noble Bloom TO14 Handoff

- Date: 2026-09-14
- Owner: Codex A handoff to Codex B
- Task: `P3-B18`
- Base lineage: A03 B17 sync `f6b5a4c692372633b4593cf6f31d1d270df8f56a`
- Accepted prerequisites: B13/B14/B15/B16/B17 + TO03 Trigger Gateway + TO05 Interaction + typed Resource runtime
- Status: `READY_FOR_IMPLEMENTATION`

## Representative

```text
archive: servant.artoria-alt
card: servant.artoria-alt.skill.sc-artoria-alt-3
ability: sc-artoria-alt-3.noble-bloom
kind: optional_trigger
phase: combat
trigger: after_battle_result_determined
responseWindow.opens: after_battle_result_determined
condition: controller_played_highest_cost_noble_phantasm_in_battle_this_round
effect: adjust_victory_points(controller,+1)
```

This row is one of the remaining eight TO14 direct result-event consumers after accepted B17 synchronization.

It is selected before Gatou, Tomoe, and Olga loss-transform because its owner composition is already reviewed and narrow: Battle Result produces the stable post-scoring result event; Trigger Gateway discovers the optional trigger; TO05 Interaction owns the response window; typed Resource owns the VP mutation. No TO16 Special or TO15 Modifier/Power behavior is needed.

## Exact Scope

B18 accepts only the structural semantic described above. In particular:

- exactly one qualifying highest-cost Noble Phantasm condition;
- no second `highest_cost_noble_phantasm_cost_at_least` condition;
- no target, cost, create, modifier, lifecycle, or limit nodes;
- one controller `adjust_victory_points(+1)` effect;
- response is optional and controller-owned;
- all routing is semantic/structural, never based on Artoria Alter/card/ability identity.

`sc-artoria-alt-3.noble-bloom-extra-vp` is explicitly not accepted by B18 even though it is a sibling optional response on the same source card.

## Required Ordering Contract

The end-to-end contract to prove is:

1. Battle Result resolves all supported battlefields and base scoring receipts under the accepted B13 phase-wide barrier.
2. Only after all required scoring receipts exist may the stable `after_battle_result_determined` continuation reach Trigger Gateway.
3. The qualifying `noble-bloom` trigger opens one optional response window owned only by the controller.
4. No +1 VP is applied while the response is merely pending.
5. `decline_this_window` closes the window with no VP mutation.
6. `resolve_response` revalidates the exact source/ability/event/condition and resolves one typed `adjust_victory_points(+1)` continuation.
7. The personal +1 VP remains a post-result Resource result; it never rewrites the immutable base scoring pool/receipt.
8. Stable result identity, replay, reconnect, and repeated command attempts cannot open or settle a second response.

## Fail-Closed Boundary

Fresh tests must prove malformed same-family shapes do not silently execute through the generic legacy path. At minimum reject or leave unclassified:

- wrong trigger;
- missing/wrong response window;
- wrong phase;
- zero or multiple non-approved conditions;
- sibling extra-VP shape with the additional cost-at-least condition;
- non-controller resource target;
- amount other than integer `+1`;
- extra effects, targets, costs, creates, modifiers, lifecycle, or limit state.

Condition-false behavior is not an error: when the controller did not satisfy the highest-cost Noble Phantasm condition, no response action/window should be exposed.

## Required Evidence

B18 must produce fresh evidence for:

- typecheck;
- identity-free classifier positive and adversarial near-miss negatives;
- typed Resource result/effect evidence for accepted +1 VP;
- accept +1 and decline +0 behavior;
- duplicate result-event dedupe;
- no response when condition is false;
- real MatchSession battle path showing the response appears only after base-scoring receipts/barrier;
- no regression to B13 loss resource, B14 shared VP, B15 terminal card-zone, B16 reveal, or B17 first-loss activation;
- fresh remote-room Chromium projection/reconnect/stale/no-duplicate proof;
- full root baseline comparison against B17 `666 PASS / 20 inherited FAIL`;
- production diff audit proving no Artoria/card/ability identity routing and no legacy bypass for the exact supported semantic.

## Explicitly Out Of Scope

B18 does not migrate or promote:

- `sc-artoria-alt-3.noble-bloom-extra-vp`;
- Artoria Caster `unique-passive-luck-on-win` rows;
- Gatou `seeker.battle-end-reward`;
- Tomoe `sc-tomoe-1.penalty-on-defeat` or unpreventable semantics;
- Olga `trismegistus.loss-transform`, soul-drag, or return-silence;
- broad optional-trigger ordering changes;
- TO15 Modifier/Power runtime;
- TO16 Special subsystem runtime;
- raw coverage KPI/classifier/taxonomy changes by Codex B.

## Reviewer Boundary

A fresh `P3-R12` reviewer must start from the exact frozen B18 candidate SHA. It must independently verify the post-scoring optional-window ordering, typed +1 VP resource settlement, decline path, dedupe/reconnect behavior, fail-closed boundary, and lack of identity routing.

Only R12 acceptance may allow A03 to advance the scoped TO14 direct-consumer overlay from `5/13` to `6/13`.
