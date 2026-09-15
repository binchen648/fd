# P3-A Wave 1 Resource Numeric / Cost Closure — 2026-09-16

## Authority

- Runtime/A-sync baseline: `de6e57c2610c560b81791ef931bf5bc09dab8fc7`
- F1 final evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Reference lock: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Wave order authority: `docs/plans/2026-09-13-phase-3-full-roster-collaboration-design.md`

## Accepted wave-1 slices

- FB2-01: fixed positive controller top-level `pay_mana` component, 15 exact F1 literal-Mana identities component-aligned.
- FB2-02: fixed controller deployment Resource reward at exact location, 6 exact F1 identities with a complete accepted parent route.
- FB2-03: fixed controller Mana/VP gain/loss component, 59 exact F1 identities component-aligned.
- FB2-04: fixed controller command-seal signed adjustment component, 6 exact identities / 7 effects component-aligned.
- FB2-05: fixed controller exact `set_mana` primitive/component, 5 exact identities component-aligned.

These acceptances are deliberately compositional. Component alignment is not migration acceptance unless every parent/timing/target/interaction/lifecycle/special dependency is independently accepted.

## Cost residual closure

`GENERIC_COST_PAYMENT` has 30 F1 identities. Fifteen fixed literal controller Mana rows are covered by FB2-01. The remaining 15 do not form another safe independent wave-1 component:

- command-seal payment is coupled to battlefield-entry / linked-player special semantics;
- discard payments depend on selected/random card semantics or a selected-card cost binding;
- variable Mana payments depend on selected-card printed cost, `X`, controller hand count, or other result bindings;
- VP payments are attached to later Card Action / Modifier / Target / special behavior;
- several cost-axis rows have no isolated executable payment node in the F1 overlay and remain dependent on their declared later gateways.

Therefore variable/expression, discard, VP, command-seal, third-party, upkeep/replacement, and special-coupled payment siblings are explicitly deferred to their declared Result Binding / Target / Card Zone / Trigger / Lifecycle / Special dependencies. No broad Cost Payment acceptance is claimed.

## Resource Numeric residual closure

`GENERIC_RESOURCE_NUMERIC` has 125 F1 identities. The accepted fixed components cover 69 unique identities across FB2-03/04/05 (FB2-04 and FB2-05 overlap at `master.shinji.skill.s4`). The remaining 56 do not expose another clean independent literal-controller numeric family:

- 32 have no isolated simple numeric node; resource semantics are embedded in cross-wave or reviewed-special behavior;
- variable gain/loss rows consume card counts, paid Mana, round aggregates, token bindings, or other result variables;
- VP/Mana transfer and VP swap require target/result-binding ownership;
- non-controller command-seal changes require Target/Condition semantics; restore-all is not a fixed delta;
- global/scoped penalties, linked-player contributions, gem/food/damage resource rules, shared-victory links, and similar rows remain special or later-wave dependent.

No residual row is promoted merely because its final mutation is numeric. This closes wave 1's independently implementable primitives while preserving explicit dependency blocks.

## Transition to wave 2

Per the accepted mechanic-wave order, runtime work may now proceed to Card Zone / Draw / Move / Return. This does not mark the residual wave-1 rows accepted; it marks them explicitly dependency-deferred rather than pretending that later gateways belong to Resource Numeric / Cost.

The first wave-2 scan found 30 `draw_cards` identities. Twenty-three contain a fixed positive controller draw from the ordinary controller deck with no variable count/custom deck/until-draw semantics in the draw component itself. Their parent qualifiers remain independently gated.

One pure representative is `master.waver.skill.s2`: outpost/advance action, fixed 1 Mana payment, draw 2. The F1 source overlay contains the fixed cost even though the F1 capability axis lists only Card Zone; runtime implementation must preserve the source-grounded payment and reuse FB2-01 rather than treating the action as free.

A second high-value family contains 14 servant skills with the same source-grounded pair: draw 1 when the source is played with one basic attack, plus an optional 0..3 controller-hand play constrained to base power <=3. The optional-play half matches the already accepted TO13 representative shape, but the draw half still requires a scoped `on_card_played` Trigger runtime. Those 14 are therefore not yet F4-ready.

## F4 gate

`P3-FM01` remains undispatched. No single fully accepted complete runtime contract yet owns 10–40 exact F1 identities. The 14-card servant family is the nearest visible batch, but its trigger-owned draw clause must be accepted before migration can be honest.
