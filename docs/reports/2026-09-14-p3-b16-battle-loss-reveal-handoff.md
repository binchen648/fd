# P3-B16 Battle-Loss Servant Reveal Runtime Handoff

- Date: 2026-09-14
- Owner: Codex A handoff to Codex B
- Task: `P3-B16`
- Base lineage: A03 B15 sync `b56ffd2780fef8f9457fb26c1ec3538f8d5e030b`
- Accepted prerequisite runtime: B15 `26be105af227306e5a7154ca0d7cdccac34d72bf`
- Accepted prerequisite review: R09 `2eb04b8495f988e8d2d78d63a580658ce6b3494d`
- Status: `READY_FOR_IMPLEMENTATION`

## Representative

```text
archive: servant.achilles
card: servant.achilles.skill.sc-achilles-1
ability: sc-achilles-1.achilles-heel
kind: forced_trigger
trigger: after_controller_loses_battle
effect: reveal_information(scope=servant_package, subject=controller.servant)
```

Printed clause: `阿喀琉斯之踵-被动：当你战败后，你【真名解放】。`

This is selected from the remaining 10 TO14 direct consumers because it reuses the already accepted B13 post-scoring loss event and has no optional interaction, no Special directive/transform, no rule modifier, no power calculation, no cost and no target selection. The only missing reusable capability is a typed Visibility primitive for controller servant-package reveal.

## Exact Gap

Current runtime already has legacy `reveal_information` handling in the interpreter and projection support through `abilityRuntime.revealedServants`, including the domain event `servant_package_revealed`.

However, the exact effect is not represented by typed resolution-dataflow. B16 must migrate only the narrow semantic shape below to a reusable typed primitive and must not route by Achilles/card/ability identity.

## Typed Visibility Contract

The migrated semantic shape is exactly:

```text
forced_trigger
+ trigger = after_controller_loses_battle
+ no optional response window
+ no conditions/targets/cost/creates/ruleModifiers/lifecycle/limit
+ exactly one reveal_information effect
+ scope = servant_package
+ subject = controller.servant
```

The implementation may name the normalized primitive `reveal_servant_package` or an equivalent generic typed name, but it must provide the following semantics:

- controller player must exist;
- the subject is always the ability controller's servant package, never a client-selected player;
- first successful reveal records the controller in the authoritative revealed-servant state;
- first successful reveal emits typed `servant_package_revealed` evidence with stable resolution provenance;
- repeated reveal when already revealed is idempotent and must not duplicate the reveal event;
- invalid scope/subject/controller or malformed same-family semantic fails closed atomically;
- exact supported B16 semantics must execute through typed resolution-dataflow and must not fall through to legacy `resolveEffect`.

B16 may share the existing authoritative revealed-servant state/projection representation; it must not create a second reveal truth source.

## Battle Ordering Contract

B16 consumes the already accepted B13/B14/B15 battle result pipeline. It must not alter battle ordering.

For the production path:

1. all supported battlefield base scoring receipts exist;
2. post-scoring result/loss events are dispatched through Trigger Gateway;
3. Achilles loss reveal settles from the stable `after_controller_loses_battle` event;
4. later phase-terminal `after_battle_ended` work remains after ordinary result/loss work;
5. cleanup remains last.

The existing frozen-participant eligibility rule remains authoritative, including the case where scoring eliminates the losing controller before its same-battle trigger settles.

## Required Tests

Focused tests must include:

- identity-free synthetic exact-shape classifier positive;
- renamed same-shape positive;
- wrong trigger/kind/scope/subject/extra effect/extra condition negatives;
- typed servant-package reveal success and typed event/result evidence;
- already-revealed idempotence with no duplicate reveal event;
- invalid controller/scope/subject fail closed with unchanged caller state;
- production `after_controller_loses_battle` path reveals only the actual losing controller;
- no-loss path does not reveal;
- same stable result event replay does not duplicate the trigger or reveal event;
- a losing controller that becomes eliminated by base scoring still resolves this same-battle reveal under frozen participant eligibility;
- B13 Shinji, B14 shared-victory VP and B15 terminal Card Zone ordering remain green.

## Gate C

Use a real remote room/server browser path with Achilles as a losing participant. The scenario must prove:

- base scoring is committed before the loss-trigger reveal;
- the controller's servant package changes from hidden to publicly projected after the loss trigger;
- other players receive the revealed servant package through authoritative projection;
- reconnect preserves the revealed state;
- a stale revision is rejected;
- reconnect/stale/re-entry does not produce a second `servant_package_revealed` event.

## Explicitly Out Of Scope

B16 does not migrate or promote:

- Gatou `seeker.battle-end-reward` directive semantics;
- Tomoe `penalty-on-defeat` or its unpreventable clause;
- Olga loss transform;
- Artoria Alter optional battle-result triggers;
- Artoria Caster optional Luck-on-win triggers;
- declaration-reveal abilities triggered by `on_use_declared`;
- broad Hidden Information or private-look behavior;
- broad Battle/Modifier/Power migration;
- TO15 Modifier/Power runtime;
- TO16 Special subsystem runtime;
- coverage KPI/classifier/taxonomy.

## Reviewer Boundary

Codex B may stop only at `IMPLEMENTATION_COMPLETE_CANDIDATE` with an exact frozen SHA.

A fresh P3-R10 reviewer must independently verify typed Visibility atomicity/idempotence, post-scoring loss ordering, frozen-participant eligibility, authoritative projection/reconnect/stale behavior, no identity routing/legacy bypass, Gate A/B/C, and the full baseline before A03 may advance the scoped TO14 overlay from `3/13` to `4/13`.
