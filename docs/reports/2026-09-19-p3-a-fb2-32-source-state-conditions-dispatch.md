# P3-A FB2-32 Source State Condition Dispatch

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-19

## Baseline

- Exact Base: `189d221cb7f11693edec8985e1b69af775896bf4` (R70 / FB2-31 capability acceptance synchronization)
- Formal recovery accepted: `136/944`; remaining: `808`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

FB2-32 is B2 capability work only and earns zero frozen migration credit.

## Mechanical seam selection

A fresh overlay over `CONTRACT_MAPPED / READY_GENERIC_EXTENSION` rows after FB2-31 acceptance shows no honest complete homogeneous S family unlocked solely by the event-player relation conditions.

The next highest-frequency narrow condition family that is absent from the accepted generic interpreter is source-state relation:

- `SOURCE_ACTIVE`: present in `30` READY_GENERIC_EXTENSION identities; Locked Reference source authoring contains `48` exact occurrences, all structurally `{ "type": "source_active" }`;
- `SOURCE_OWNED`: present in `28` READY_GENERIC_EXTENSION identities; Locked Reference source authoring contains `36` exact occurrences, all structurally `{ "type": "source_owned" }`.

These are one coherent identity-free family over the authoritative source card instance and current ability controller. They can be accepted without accepting any activation trigger, effect primitive, consumer identity, or parent ability.

## Exact capability

Add two generic exact-shape condition nodes:

- `{ type: "source_active" }`
- `{ type: "source_owned" }`

Semantics:

1. `source_active` is true iff the authoritative physical source card is currently active under the existing shared runtime source-state rules.
2. `source_owned` is true iff the authoritative physical source card's owner player equals the current ability controller.
3. Missing/stale source context must fail closed rather than infer state from definition/name/text.
4. Both nodes are exact type-only shapes. Extra payload fields, aliases, names, canonical ids, hashes, or handler identifiers are unsupported.
5. Evaluation is read-only: no authoritative mutation and no domain event emission.
6. Loader/compiler acceptance of these conditions must not broaden any activation trigger, effect, target, interaction, lifecycle, or modifier route.
7. Runtime routing must remain identity-free and structural.

## Authorized scope

B2 may touch only the minimum generic rules loader/interpreter/tests plus one FB2-32 result report.

No F1 authoring migration, consumer archive, production pack registration/generated product, `data/phase3`, A-owned taxonomy/KPI, app behavior, merge, or retarget.

Required evidence:

- exact-shape loader acceptance for both condition nodes;
- malformed near-matches rejected/disabled;
- `source_active` true for active authoritative source and false for inactive/closed source;
- `source_owned` true only when physical source owner equals controller;
- wrong/non-owner controller fails false;
- stale/missing source context fails closed before mutation;
- no state mutation or emitted event from condition evaluation;
- an unsupported trigger remains unsupported when paired with either condition;
- identity/hash/Reference-handler audit clean;
- focused tests, typecheck, rules regression selection, official CI, content validation, deterministic generated-content verification, Locked Reference verification, client build, `git diff --check`, final cleanliness.

Formal recovery accepted remains `136/944`; historical `P3-FM09-RECOVERY` remains `MIGRATION_BLOCKED`.
