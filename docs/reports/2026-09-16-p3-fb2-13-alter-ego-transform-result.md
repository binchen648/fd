# P3-FB2-13 Alter Ego Transform — B2 Result

Date: 2026-09-16
Owner: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Base / A handoff: `61d9f0c92e0af7598e237b71fb90ad83c13c88c1`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Implemented contract

FB2-13 implements only the identity-free Alter Ego transform contract frozen by A. No future FM07 identity is routed by id, name, or printed text.

- Adds physical-card runtime state `reversed?: boolean` and `attributeOverrides?: string[]` plus one shared effective-attribute resolver.
- Trusted target provenance is backend-owned: the exact face-up controller card named by the current `on_card_played` event, present in that event's frozen play batch, active in `attack_area`, and played this round. The client does not select the card target.
- If the target has authored `cardFace.hasReversalEffect: true`, resolution sets physical `reversed=true`; optional `revealsTrueNameOnReverse` uses the existing reveal authority.
- Otherwise the controller chooses a distinct subset of `力量 / 迅捷 / 魔术`, including the empty subset. The chosen subset replaces the physical card's effective attributes rather than adding to printed attributes.
- Effective attributes are consumed by subsequent target-attribute checks, event attribute checks, and authored combat attack tags. Printed attributes remain immutable and continue to own original play classification/cost history.
- The regular structural variant transforms and then closes the source through the existing typed `close_source_card` primitive.
- The EX structural variant uses the existing fixed-controller-mana authority for exactly 3 mana, keeps the source active, and uses the existing per-round usage authority for exactly one successful use per round.
- Attribute choice is a server-owned non-cancelable pending interaction over the existing `choose_target` command. Payment/use is deliberately deferred until the choice is submitted and revalidated; no half-paid pending state exists.
- Every continuation revalidates revision, trusted trigger event, exact event target, source state, variant shape, candidates, fixed mana and use limits before mutation.
- Reverse/attribute transforms are cleared whenever the physical card leaves board zones through interpreter movement, resolution data-flow movement/close, legacy extended close/move-to-skill, MatchSession round cleanup/attachment return, or direct combat removal.

The implementation does not create a generic client transform command, broad Trigger acceptance, identity-specific handler table, runtime text parser, or second card-zone engine.

## Production files

- `packages/rules/src/ability/card-instance-state.ts` — shared physical-card effective-attribute and transient-transform cleanup authority.
- `packages/rules/src/ability/types.ts` — transform state and exact Alter Ego pending-interaction metadata.
- `packages/rules/src/ability/loader.ts` — exact transform/source-reversed vocabulary and reversal metadata validation.
- `packages/rules/src/ability/interpreter.ts` — exact regular/EX classifiers, trusted target derivation, response/choice routing, atomic settlement, effective-attribute consumers and projection.
- `packages/rules/src/ability/resolution-dataflow.ts` — clears transient transform state on typed moves/close.
- `packages/rules/src/ability/extended-effects.ts` — clears the same state on pre-existing legacy move-to-skill/close exits.
- `packages/rules/src/core/combat-resolver.ts` — consumes effective attributes for authored attack tags and clears state on direct removal.
- `packages/rules/src/match-session.ts` — clears state on round-end attack discard and attachment return.
- `packages/rules/src/index.ts` — exports the shared physical-card helper.

No authoring archive, F1 evidence/taxonomy artifact, content archive, or client protocol was modified.

## Focused evidence

`packages/rules/tests/regression/fb2-alter-ego-transform.test.ts`: `7 / 7 PASS`.

The exact suite proves:

1. identity-free classifier accepts only the frozen regular and EX structural variants and rejects near matches;
2. trusted just-played own face-up attack target is event-bound, while normal targets stage a 0..3 attribute choice without early close/mutation;
3. empty and non-empty replacement subsets work, and effective attributes are visible to later target constraints and combat tags;
4. authored reversal targets resolve immediately, reveal when authored, expose `source_reversed`, and project public reversed state;
5. EX pays nothing while choice is pending, then atomically pays exactly 3, mutates authoritative post-payment state, stays active, and becomes unavailable for a second same-round use;
6. decline, insufficient mana, wrong-controller/face-down/stale event provenance are mutation-free and do not consume use;
7. stale pending targets fail atomically and transformed state is cleared when the target leaves the board.

High-risk compatibility set after the full cleanup audit: `10 files / 101 tests PASS`, covering resolution data-flow, combat, card source state, existing close/source-play responses, private interaction/projection, MatchSession regressions and complex skills.

## Full validation

- `npm.cmd run typecheck`: PASS.
- rules regression + core: `65 files / 385 tests PASS`.
- `npm.cmd run content:validate`: `7 masters, 7 servants, 20 events, 0 blocking issues`.
- `npm.cmd run verify:generated-content`: PASS with unchanged hashes:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e81d655cc3` is not used; authoritative evidence hash remains `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- standard `npm.cmd run test:ci`: `119 files / 727 tests PASS`.
- `git diff --check`: PASS.

## Coverage / determinism

Fresh `phase3:coverage` remains exactly at the R36-accepted FM06 material baseline:

- archives `80`
- cards `113`
- abilities `212`
- `newRuntimeSemanticRouted=22`
- `legacyExecuteAbility=3`
- `legacyResolveEffect=127`
- `dualRuntime=0`
- `notClassifiable=60`
- `taxonomyWarnings=124`
- compiled definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`
- blocking issues `0`

The fresh generated coverage artifact differs from the accepted baseline only by `generatedAt` and static source line offsets caused by runtime edits. It is intentionally not part of the B2 candidate commit.

## Scope / safety audit

- exact future FM07 IDs found in `packages/rules/src`: `0`;
- future FM07 character/skill names or `他人格` used for production routing: `0`;
- authoring changes: `0`;
- runtime printed-text parsing: `0`;
- client-supplied transform target authority: `0`;
- broad Trigger/transform promotion: `0`;
- new client command/protocol: `0`.

## Reviewer handoff

R37 must review the exact B2 candidate independently and must not implement fixes. Particular attention should be paid to trusted event provenance, exact structural fail-closed classification, EX post-payment authoritative-state mutation, pending-choice CAS/revalidation, effective-attribute consumers, transient cleanup across all board-exit paths, and reconciliation of the exact ten-member future FM07 Reference-handler family.
