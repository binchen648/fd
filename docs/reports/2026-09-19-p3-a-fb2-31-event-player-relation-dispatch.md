# P3-A FB2-31 Event Player Relation Condition Dispatch

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-19

## Baseline

- Exact Base: `75123154585aac49f4c1571a3ac23ac4f9279dca` (R69 / FB2-30 capability acceptance synchronization)
- Formal recovery accepted: `136/944`; remaining: `808`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Integrated `origin/main` remains separate at `553779e8ffcc926ae4763ee86a2ea937e090c128`.

FB2-31 is B2 capability work only and earns zero frozen migration credit.

## Mechanical seam selection

After FB2-30 acceptance, the raw inventory still contains `66` `CONTRACT_MAPPED / READY_GENERIC_EXTENSION` identities; the formal accepted union contributes three already-accounted identities, so the true remaining block-free generic-extension population is `63`.

Across those source-grounded rows, the semantic condition axes contain:

- `EVENT_PLAYER_IS_CONTROLLER`: `12` ability occurrences across `10` identities;
- `EVENT_PLAYER_IS_OPPONENT`: `6` ability occurrences across `6` identities.

These two clauses are one coherent identity-free relation family over trusted event actor metadata. They are reusable across unrelated trigger/effect families and can be accepted without accepting any trigger route, effect primitive, consumer identity, or parent ability.

FB2-31 therefore dispatches only this event-player relation condition seam.

## Exact capability

Add two generic structural condition nodes:

- `{ type: "event_player_is_controller" }`
- `{ type: "event_player_is_opponent" }`

Semantics:

1. Evaluation consumes only trusted `AbilityEvent.playerId` and the current ability controller.
2. `event_player_is_controller` is true iff the event carries a valid repository player id equal to the controller.
3. `event_player_is_opponent` is true iff the event carries a valid repository player id different from the controller.
4. Missing, empty, malformed, or unknown event player identity must fail closed; it must never be treated as an opponent merely because it differs textually.
5. Both nodes must have exact structural shape: no payload fields, aliases, names, canonical IDs, printed text, hashes, or handler identifiers.
6. Loader/compiler acceptance of these condition nodes must not broaden any activation trigger. A parent ability whose trigger is unsupported before FB2-31 remains unsupported after FB2-31.
7. Condition evaluation is read-only and must not mutate authoritative state or emit domain events.

## Identity isolation

Production runtime/compiler must not branch on any canonical ability/card id, owner name, printed text, F1 hash, Locked Reference hash, or Reference handler id. Inventory identities are frequency evidence only and are not runtime routing inputs.

Locked Reference is non-authoritative historical/static corroboration only.

## Authorized scope

B2 may touch only the minimum generic rules loader/interpreter/types/tests plus one FB2-31 result report.

No F1 authoring migration, consumer archive, production pack registration, generated product, `data/phase3`, A-owned taxonomy/KPI, app behavior, merge, or retarget.

Required evidence:

- exact-shape loader acceptance for both nodes;
- malformed near-matches rejected/disabled;
- controller-match true / opponent false;
- opponent-match true / controller false;
- missing event player fails closed;
- unknown event player fails closed;
- no state mutation during condition evaluation;
- no unsupported trigger becomes executable by implication;
- identity/hash/Reference-handler audit clean;
- focused tests, typecheck, rules regression selection, official CI, content validation, deterministic generated-content verification, Locked Reference verification, client build, `git diff --check`, final cleanliness.

Formal recovery accepted remains `136/944`; historical `P3-FM09-RECOVERY` remains `MIGRATION_BLOCKED`.
