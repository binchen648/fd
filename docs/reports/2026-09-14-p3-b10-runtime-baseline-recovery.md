# P3-B10 Runtime Baseline Recovery r2

- Document Role: RUNTIME_RECOVERY_IMPLEMENTATION
- Owner: Codex B recovery lane
- Task: `P3-B10`
- Branch: `codex/b-p3-b10-recovery-r2`
- BaseCommit: `5d34befa085fe6426e1d550ad0c5d0a0ca824db6`
- Accepted B08 replacement review: `55c890d`
- RepackedFrom: `cbfef6659ec9e5fd3c0d5c3f57bd544e4fdd52b3` + `bcb7ed1`
- RecoveryCandidateV1: `cbfef6659ec9e5fd3c0d5c3f57bd544e4fdd52b3`
- R05V1Review: `d765d62` -> `IMPLEMENTATION_NEEDS_REVISION`
- Historical accepted B10 object: `9fba6d9` (unavailable in the current local/remote Git object graph)
- MechanicFamily: `SETUP_CARD_CREATION_MINIMAL:CREATE_TO_SKILL`
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE_R2`
- GateClaim: `NONE`

## Recovery Boundary

This r2 repacks the previously repaired P3-B10 runtime delta onto the freshly accepted replacement B08 base `5d34bef`. It does **not** claim to recreate the original `9fba6d9` object or inherit historical review status. A fresh independent Codex R review of the exact r2 candidate is required before this replacement stack may be promoted.

The recovery is restricted to the B10 setup create-to-skill contract. It does not modify coverage KPI/taxonomy rules, reviewer classification, unrelated card-action contracts, Trigger/Lifecycle gateways, broad special-subsystem behavior, or roster-wide migration state. Coverage synchronization remains Codex A-owned after independent runtime acceptance.

## Eligible Semantic Shape

The new route is selected only by executable semantic axes:

- `kind = forced_trigger`
- activation trigger `game_start`
- no conditions
- no targets
- no costs
- no `creates` side-list
- exactly one effect
- effect type `create_card`
- non-empty `cardId`
- destination zone `skill`
- destination owner omitted or `controller`

No card definition id or ability id participates in route eligibility.

The current canonical authoring inventory contains exactly three matching setup abilities:

1. `master.maiya.skill.military` / `military.has-support-shot` -> `master.maiya.deck.support-shot`
2. `master.olga-marie.skill.astronomical-science` / `astronomical-science.has-chaldeas` -> `master.olga-marie.skill.chaldeas`
3. `master.shinji.skill.useless-person` / `useless-person.setup` -> `master.shinji.skill.false-attendant-book`

Kayneth `alchemist.setup` remains outside this contract because it creates an independent deck, not one controller-owned skill-zone card. Artoria Caster Luck creation remains outside this contract because its `create_card` destination is the deck and it has follow-up shuffle semantics. The exclusion is therefore semantic, not `card.luck`-specific.

## Recovered Runtime Contract

`create_card` is registered as a typed resolution primitive for this narrow setup shape. A successful creation:

- requires the created definition to exist in the compiled runtime pack;
- creates exactly one controller-owned card in `skill`;
- gives it owner-only visibility;
- records `generatedBy = sourceCardId`;
- emits `card_created`;
- returns typed `createdCount = 1`.

Duplicate handling is provenance-sensitive:

- if an existing controller-owned card with the same definition has `generatedBy === sourceCardId`, the operation is an idempotent typed no-op with `createdCount = 0` and no new `card_created` event;
- if provenance is absent or belongs to another source, the primitive throws `duplicate_created_card`;
- `executeResolution` clone/commit semantics and the trusted `processAbilityEvent` clone/commit boundary keep the original state, events, sequence/revision, and cards unchanged on that failure.

Unsupported destination or owner shapes fail data-flow validation and cannot silently fall back through the recovered semantic route.

## Historical Review Blockers Reproduced as Tests

The recovery explicitly covers the two recorded historical failed-review findings. The first fresh recovery review (`d765d62`) then found an additional mixed-duplicate provenance bypass; r1 repairs that boundary by validating the complete controller-owned same-definition set before permitting the idempotent no-op.

### `CARD_SPECIFIC_SEMANTIC_EXCLUSION`

- A synthetic arbitrary compiled card id with the same valid setup shape routes successfully.
- `card.luck` with the valid create-to-skill shape classifies as eligible.
- `card.luck` with Artoria Caster's deck destination classifies as ineligible.
- A wrong trigger is ineligible.

This proves the classifier depends on semantic axes rather than a definition-id exception such as `cardId !== 'card.luck'`.

### `EXISTING_CARD_PROVENANCE_ADOPTION`

- Same-source existing card: safe idempotent no-op.
- Missing provenance: `duplicate_created_card`.
- Different provenance: `duplicate_created_card`.
- Both direct resolution and trusted game-start dispatch assert the complete input state is deep-equal after rejection, covering cards, emitted events, sequence/revision, and runtime state.

## Modified Files

- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/tests/regression/setup-create-to-skill.test.ts`
- `packages/rules/tests/regression/resolution-dataflow.test.ts`
- `packages/rules/tests/regression/complex-skills-regression.test.ts`
- this recovery report

The complex-skill regression no longer manually injects Shinji's False Attendant Book before game-start handling; the recovered setup runtime now creates the canonical card itself.

## Focused Verification

```text
npm run typecheck
PASS

npx vitest run \
  packages/rules/tests/regression/setup-create-to-skill.test.ts \
  packages/rules/tests/regression/resolution-dataflow.test.ts \
  packages/rules/tests/regression/card-action-close.test.ts \
  packages/rules/tests/regression/card-action-activate.test.ts \
  packages/rules/tests/regression/card-action-add-to-attack.test.ts \
  packages/rules/tests/regression/complex-skills-regression.test.ts \
  packages/rules/tests/regression/card-zone-core-direct-action.test.ts
PASS: 7 files / 89 tests

git diff --check
PASS
```

The dedicated B10 regression contributes twelve passing tests covering the three canonical setup creations, arbitrary-card semantic routing, `card.luck` semantic separation, same-source idempotence, single-card provenance rejection, and mixed same-definition provenance rejection with atomic rollback.

## Full Rules Baseline Comparison

Recovery stack:

```text
npx vitest run packages/rules/tests
42 passed files / 9 failed files
357 passed tests / 19 failed tests
```

B08 recovery base immediately before this slice:

```text
41 passed files / 9 failed files
345 passed tests / 19 failed tests
```

The failure set is unchanged from the accepted B08 replacement base. Eighteen failures depend on unavailable historical CHM/image evidence paths (`D:\fd\chm-extract` or local `chm-extract`), and one is the existing versioned generated-content definition-hash mismatch in `golden-card-content-pipeline.test.ts`. B10 r2 adds twelve passing dedicated setup-creation tests and introduces no additional full-suite failure.

## Local Before / After

Within the exact recovered setup-create-to-skill contract:

- canonical eligible abilities: `3`
- typed new-runtime migrated abilities: `3`
- remaining legacy-only abilities in this exact semantic shape: `0`
- card-id-specific exclusions: `0`
- unsafe duplicate provenance adoption paths: `0`

These are local B10 contract counts only. They are not a global Phase 3 coverage KPI update; `phase3:coverage` reconciliation remains Codex A-owned after independent review.

## Review Boundary

This r2 stack is a replacement candidate for the lost B10 runtime object. It must not be described as the historical `9fba6d9` commit and cannot inherit an earlier review merely because the semantic delta was previously accepted. The next step is a fresh independent review of the exact r2 candidate on top of accepted B08 replacement `5d34bef`.
