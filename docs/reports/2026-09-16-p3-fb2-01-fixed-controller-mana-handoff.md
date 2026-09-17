# P3-FB2-01 Handoff — Fixed Controller Mana Cost Component

- Date: 2026-09-16
- Owner: Codex A / coordinator handoff
- Runtime baseline: `a5f390e96ac2560226f9d48f133c9b09f5a1e140` (`codex/a-p3-b23-evidence-sync`)
- Closed runtime lane: P3-B23 -> P3-R17 -> A03 synchronization
- F1 accepted evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- F1 runtime request: `runtime-capability-855dd7329e2d` / `GENERIC_COST_PAYMENT`
- B2 implementation branch: `codex/b2-p3-fb2-01-fixed-controller-mana-r1`

## Dispatch judgment

Phase 3 F1 is independently accepted at 944/944 source-grounded identities with no blocked or unclassified rows. The accepted F1 catalog contains only two `READY_EXISTING_CONTRACT` rows: `master.irisviel.skill.s2` for `CARD_ZONE_CORE_DIRECT_ACTION` and `master.kiritsugu.skill.s2` for `CARD_ACTION_SEMANTICS_MINIMAL_PLAY`. Each existing contract therefore has only one exact F1 migration candidate, below the normal 10-40 ability FM01 batch. P3-FM01 is intentionally not dispatched by inventing additional eligibility.

The latest accepted runtime chain is B23/R17/A03 at `a5f390e96ac2560226f9d48f133c9b09f5a1e140`. The F1 closure commit is a parallel evidence branch and is not used as the production runtime base. Its catalog and request artifacts are consumed read-only.

The first missing capability request is selected from dependency wave 1. `GENERIC_COST_PAYMENT` affects 30 F1 identities, but those identities are heterogeneous: 24 carry a mana-cost axis, while the remainder include command-seal, discard-card, and victory-point costs. The mana rows themselves include fixed controller payment, variable payment, third-party payment, upkeep/maintenance, and optional-effect payment. FB2-01 therefore implements only the smallest reusable component that is already precisely expressible by structured authoring: one fixed controller `pay_mana` top-level ability cost.

## Exact accepted sub-capability

FB2-01 may recognize and execute a cost component only when all of the following are true:

- the ability has already been admitted by another independently accepted semantic route; the cost component does not make an otherwise unsupported ability routable;
- the top-level authoring `cost` contains exactly one node with `type=pay_mana`;
- the amount is a fixed positive safe-integer literal;
- the payer is the ability controller through the existing authoritative controller context;
- payment obeys the parent route's already accepted authoritative stage boundary: non-staged routes settle payment and downstream effects atomically in one stage, while a staged route may commit its activation cost before opening an accepted pending decision;
- insufficient mana fails closed before the current stage commits payment, effects, or a new pending decision;
- a later failure inside the same stage rolls back that stage's payment and downstream mutation; a rejection in a later already-committed stage must not refund an earlier accepted activation-stage cost;
- successful payment produces the existing typed `pay_mana` result/event envelope, including `before`, `after`, `requestedAmount`, `actualAmount`, and status;
- routing and payment contain no card ID, ability ID, owner ID, printed-text parsing, or character-specific checks.

This is a component contract. It may be reused by already accepted routes such as Maiya `military.attach-support-shot` and Kayneth `volumen.extra-play`, but FB2-01 must not broaden either card-action contract.

## Explicitly excluded

FB2-01 does not accept or imply support for:

- variable/X mana amounts or client-authored variable values;
- `optionalCost` attached to an effect, including Golden Eater's optional second payment;
- payment by a non-controller or multi-player payment collection;
- command-seal, victory-point, discard-card, source-card movement, or other non-mana costs;
- round-end upkeep/maintenance choices;
- replacement costs such as command seal -> mana;
- response-window creation, target selection, hidden information, or payment UI changes;
- ordinary printed card play costs;
- any F1 authoring migration or KPI/burn-down update.

Excluded shapes remain on their existing route or blocked for a later explicitly scoped capability. No exclusion may silently fall back into the FB2-01 path.

## Existing component evidence

The current runtime already contains a typed `pay_mana` Resolution Data-flow primitive. Its result schema exposes `before`, `after`, `requestedAmount`, `actualAmount`, and `status`, and the primitive rejects insufficient mana before mutation. FB2-01 must consume that primitive rather than introducing a second mana-payment implementation.

Two current structured authoring representatives exercise fixed top-level controller mana payment under independently scoped card-action contracts:

- `master.maiya.skill.military` / `military.attach-support-shot`: fixed `pay_mana(2)` before the accepted ADD_TO_ATTACK settlement;
- `master.kayneth.deck.volumen-hydrargyrum` / `volumen.extra-play`: fixed `pay_mana(2)` before the accepted source-card response PLAY settlement.

They are compatibility representatives only. Their card-action semantics are not re-opened or generalized by this task.

## Required implementation proof

1. An identity-free fixed-cost classifier/adapter accepts the exact one-node fixed controller `pay_mana` shape after an accepted parent route admits the ability.
2. Renaming card/ability IDs does not change cost-component behavior.
3. Amount 2 with sufficient mana emits typed payment evidence and deducts exactly once.
4. Insufficient mana rejects with no payment, downstream mutation, event, or revision leak.
5. A forced failure later in the same stage proves stage-local rollback restores mana and state; Maiya's already accepted pending-target flow separately proves that a later target-stage rejection does not refund its committed activation-stage payment.
6. Negative tests reject zero/negative/non-integer, variable/expression, additional cost nodes, non-mana costs, and effect-level `optionalCost` from this component route.
7. Maiya and Kayneth current-lineage focused tests remain green without changing their semantic classifiers or transaction boundaries.
8. Current B13-B23 runtime compatibility remains green; no new deterministic root failure is accepted.
9. No new browser Gate C is required unless the implementation changes payment projection, pending interaction, reconnect, or stale-command behavior. If any of those surfaces change, fresh Gate C becomes mandatory before acceptance.

## May touch

- `packages/rules/src/ability/interpreter.ts` for the narrow component bridge/classifier and use of the typed payment primitive;
- `packages/rules/src/ability/resolution-dataflow.ts` only if a minimal additive adapter is required to call the already accepted primitive; primitive semantics/result schema must not be weakened or duplicated;
- one focused FB2-01 regression test file;
- narrow compatibility assertions for Maiya/Kayneth only if needed;
- `docs/reports/2026-09-16-p3-fb2-01-fixed-controller-mana-result.md`.

## Must not

- edit F1 inventory/catalog/source-evidence artifacts or A-owned KPI/taxonomy;
- migrate any of the 30 F1 request identities in the B2 implementation branch;
- parse printed Chinese text at runtime;
- route by card, ability, owner, master, or servant identity;
- generalize variable, optional, third-party, upkeep, replacement, or non-mana costs;
- modify `packages/rules/src/match-session.ts`, client/UI payment projection, or interaction protocols unless a new coordinator task explicitly expands scope;
- merge the parallel F1 evidence branch into the runtime branch as a shortcut.

## Reviewer launch

After B2 records an exact candidate SHA, a fresh reviewer worktree must independently verify semantic shape, identity independence, typed payment evidence, insufficient-mana fail-closed behavior, rollback, Maiya/Kayneth compatibility, current-lineage tests, and absence of scope expansion. The reviewer implements no fixes.
