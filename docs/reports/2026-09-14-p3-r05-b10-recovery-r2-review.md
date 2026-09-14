# P3-R05 Review — B10 Recovery r2

- Document Role: INDEPENDENT_REVIEW
- Reviewer: Codex R
- Task: `P3-R05` reviewing recovered `P3-B10`
- Exact Target: `e699f3b2ad207165aba37fe144b5f806de7f1873`
- Runtime Base Before B10: `5d34befa085fe6426e1d550ad0c5d0a0ca824db6`
- Accepted B08 review evidence: `55c890d`
- Historical missing baseline: `9fba6d9` (not inherited)
- Final Status: `GATE_A_B_CANDIDATE_ACCEPTED`

## Findings

No blocking finding remains in the scoped B10 r2 replacement candidate.

The previously accepted B10 semantic delta has been repacked onto the fresh accepted B08 replacement base. The reviewer did not inherit the prior acceptance; the exact r2 target was independently re-tested.

## Independent Verification

### Target / routing audit

- Reviewer worktree starts at exact target `e699f3b2ad207165aba37fe144b5f806de7f1873`.
- `git diff --check` passes.
- Production diff contains no character-id, card-id, ability-id, or `card.luck` special-case eligibility branch for the B10 route.
- The generic `candidate.definitionId === effect.cardId` comparison is definition matching for the requested created card, not identity routing.

### Typecheck and focused Gate A/B suite

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
```

Dedicated B10 coverage is 12/12 PASS. The focused stack also preserves the accepted B07 ACTIVATE and B08 CLOSE replacement paths.

### Independent mixed-provenance adversarial probe

The reviewer separately exercised the historical P1 duplicate-provenance boundary through the trusted `processAbilityEvent(game_start)` path:

```text
bad-after-good:    rejected=true, sameState=true
bad-before-good:   rejected=true, sameState=true
missing-after-good: rejected=true, sameState=true
all-good:          rejected=false, same card count
```

This confirms:

- an incompatible same-definition duplicate cannot be hidden behind a legitimate same-source card;
- ordering does not bypass provenance validation;
- missing provenance rejects;
- rejection preserves the complete authoritative caller state;
- an all-good same-source duplicate set is idempotent and does not create another card.

### Canonical scenario evidence

The exact runtime path creates the three current canonical `game_start -> create_card -> skill` cards with source provenance:

1. Maiya Support Shot;
2. Olga-Marie Chaldeas;
3. Shinji False Attendant Book.

The route is selected by semantic shape, not identity. A synthetic arbitrary card with the same shape routes. `card.luck` also classifies if synthetically expressed as create-to-skill, while Artoria Caster's actual deck-creation form remains out of scope because its destination/structure differs.

### Full rules baseline

Initial fresh reviewer full-suite run produced one additional timeout in the long-running `match-session.test.ts` eleven-round stress case: the test took about 5.5s against the default 5s per-test limit. No B10-specific assertion failed.

The reviewer then re-ran the exact MatchSession file twice:

```text
npx vitest run packages/rules/tests/match-session.test.ts
PASS: 26/26

npx vitest run packages/rules/tests/match-session.test.ts --testTimeout=15000
PASS: 26/26
```

The eleven-round case completed in about 1.6–1.8s in isolation, establishing the first failure as load/timing noise rather than a semantic regression.

A final complete rules rerun with a non-flaky 15s per-test ceiling produced:

```text
42 passed files / 9 failed files
357 passed tests / 19 failed tests
```

The remaining 19 failures are the inherited baseline set:

- 18 failures require unavailable historical CHM/original-image evidence paths in this checkout;
- 1 failure is the existing generated-content definition-hash drift in `golden-card-content-pipeline.test.ts` (`4c85668f...` fresh source vs `f4aeaddb...` checked-in generated pack).

No B10 r2 regression test fails in the full run.

## Evidence Judgment

Accepted for the exact B10 r2 candidate:

- semantic-only `game_start` create-to-skill routing;
- exactly one controller-owned skill-zone card creation;
- owner-only visibility and `generatedBy = sourceCardId` provenance;
- typed `createdCount` result and `card_created` event on real creation;
- same-source idempotent no-op behavior;
- missing/different provenance rejection;
- complete mixed-duplicate provenance validation independent of ordering;
- atomic rollback at direct and trusted event boundaries;
- preservation of accepted B07/B08 replacement behavior;
- no new full-suite regression beyond inherited environment/hash failures.

Not claimed:

- independent-deck creation;
- deck-destination creation plus shuffle;
- broad setup/lifecycle gateway completion;
- browser/WebSocket/reconnect Gate C promotion;
- global Phase 3 coverage/KPI reconciliation;
- resolution of missing CHM/image evidence or generated-content drift.

## Gate Judgment

- Gate A — Component Conformance: **PASS**.
- Gate B — Scenario Conformance: **PASS**.
- Gate C — Runtime Conformance: **NOT PROMOTED BY B10**, matching the accepted B10 task boundary; this is not a blocker for the scoped B10 replacement runtime baseline.

Permitted task completion token: `GATE_A_B_CANDIDATE_ACCEPTED`.

**Accepted replacement B10 runtime target: `e699f3b2ad207165aba37fe144b5f806de7f1873`.**
