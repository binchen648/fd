# P3-A04 B10 Coverage Alignment

- Document Role: AUTOMATION_COVERAGE_SYNC
- Owner: Codex A
- Source Task: `P3-A04`
- Runtime Task: `P3-B10`
- Reviewed Runtime Commit: `9fba6d9`
- Claimed Acceptance: `AUTOMATION_BASELINE_CANDIDATE`
- Promotion: this report does not promote Gate A/B/C, Phase 3, or Release status.

## Review Outcome

The independent B10 review accepted the corrected runtime commit `9fba6d9`. The two blockers recorded in the earlier A03 packet are closed at that commit:

- the `card.luck` identity exclusion was removed; eligibility is now semantic-shape based;
- an existing same-definition card with absent or inconsistent provenance fails closed instead of being adopted.

The earlier A03 packet remains historical evidence for the reviewed pre-fix commit `bb32fc2`; this report records the accepted replacement baseline.

## Classifier Alignment

Coverage now recognizes only this exact B10 contract:

```text
forced_trigger + game_start + no conditions/targets/cost/creates
+ one create_card(cardId, to=skill, no owner override, no nested then)
+ automatic execution
```

The classifier uses semantic form and does not use card or ability ids. Negative regression coverage rejects wrong kind, trigger, conditions, targets, cost, creates, effect count, missing card id, destination, owner override, nested continuation, and execution mode.

Three canonical setup abilities enter `SETUP_CARD_CREATION_MINIMAL:CREATE_TO_SKILL`:

- Maiya `military.has-support-shot`
- Olga-Marie `astronomical-science.has-chaldeas`
- Shinji `useless-person.setup`

The three Artoria Caster post-battle Luck abilities do not inherit this route. Their trigger, condition, source-card cost, deck destination, and shuffle continuation remain a separate contract.

## Cumulative Baseline

A04 also reconciles the already accepted B06-B08 classifier boundaries so global burn-down is measured against the accepted runtime stack, not an older A-only branch snapshot:

- B06 `CARD_ACTION_SEMANTICS_MINIMAL:ADD_TO_ATTACK`
- B07 `CARD_ACTION_SEMANTICS_MINIMAL:ACTIVATE`
- B08 `CARD_ACTION_SEMANTICS_MINIMAL:CLOSE`
- B10 `SETUP_CARD_CREATION_MINIMAL:CREATE_TO_SKILL`

Fresh classifier verification is reproducible from the A worktree with 20 automation tests. The reviewed-runtime integration check used B10 commit `9fba6d9` plus the same A04 classifier:

```text
newRuntimeSemanticRouted: 9 -> 12
legacyResolveEffect:      52 -> 49
dualRuntime:               0 -> 0
legacyExecuteAbility:           3
notClassifiable:                28
pilotAllowlist:                  0
```

The reviewed-runtime integration result was `fd-playtest-v1@1`, definition hash `f4aeaddb88f3018efed31ca74a8a0c91a614c9a61752237952285b017de4d192`, with 70 cards, 14 characters, and zero blocking issues.

The committed generated artifacts are intentionally generated from the A checkout itself. They report the same `12/49/0` classifier baseline but 10 compiled-content blocking issues because the A automation branch does not merge the accepted B10 runtime commit. This is an explicit integration-baseline difference, not hidden as a zero-blocking current-checkout result.

## Fresh Checks

```text
npx vitest run scripts/tests/phase3-coverage.test.ts
PASS: A checkout and B10 integration baseline, 1 file / 20 tests

npm run typecheck
PASS: A checkout

npm run phase3:coverage
PASS: current A checkout generated artifacts synchronized at new=12,
legacyResolveEffect=49, dual=0, blockingIssues=10

Reviewed-runtime integration check:
PASS: new=12, legacyResolveEffect=49, dual=0, blockingIssues=0

npm run phase3:automation-audit
PASS: current A checkout artifact synchronized; promotionFindings=14 remain governance findings
```

No `chm-extract` content or junction is committed. The generated artifact was refreshed with the same local asset junction used by the project worktrees, reducing environment-only missing-image findings before recording the 10 actual A-versus-B10 integration issues.

## Evidence Boundary

- A04 changes automation classification and evidence only; no runtime files are changed.
- No Gate A/B/C claim is inherited or promoted.
- The remaining 49 `legacyResolveEffect`, 3 `legacyExecuteAbility`, and 28 `NOT_CLASSIFIABLE` consumers remain explicit.
- The three Artoria Caster Luck abilities remain outside the B10 contract.
- The 14 current-checkout automation-audit promotion findings are not converted into runtime failures and require their normal owners/reviewer handling.

## Machine-Readable Artifact

Companion artifact:

```text
artifacts/phase3-a04-b10-coverage-alignment.json
```
