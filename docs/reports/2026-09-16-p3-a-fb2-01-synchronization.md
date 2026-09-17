# P3-A F2/F3 FB2-01 Synchronization — 2026-09-16

- A-owned sync branch: `codex/a-p3-fb2-01-evidence-sync`
- Exact R18 acceptance base: `30c1e5365eeba102853a7f20f5bad139b3953acc`
- Accepted FB2-01 candidate: `36670ca3d57331b5354fca35deadc1e34bf5a1db`
- Accepted runtime lineage before handoff: `a5f390e96ac2560226f9d48f133c9b09f5a1e140`
- F1 normalization/evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Reviewer verdict: `GATE_A_B_CANDIDATE_ACCEPTED`
- Runtime request: `runtime-capability-855dd7329e2d` / `GENERIC_COST_PAYMENT`

## Accepted scope

FB2-01 accepts exactly one reusable Cost/Payment sub-capability: a single top-level fixed positive safe-integer controller `pay_mana` cost under a parent semantic route that is already independently accepted.

The component is identity-free and excludes variable/expression values, third-party payer, multiple top-level cost nodes, non-mana cost, and effect-level `optionalCost`. It reuses the existing typed Resolution Data-flow `pay_mana` primitive rather than introducing another payment engine.

Runtime adoption in this candidate remains limited to the two previously accepted parent routes that already contain the exact fixed cost shape:

- Maiya ADD_TO_ATTACK activation flow;
- Kayneth source-card PLAY response flow.

No F1 roster authoring is migrated by this acceptance.

## Transaction semantics synchronized

R18 independently accepted the parent-route stage boundaries:

- Maiya remains staged: the activation dispatch commits typed mana payment, then opens the existing pending target; a rejection in the later target stage does not refund the already committed activation payment.
- Kayneth remains non-staged: typed mana payment plus source-card play settle inside one Resolution Data-flow transaction; same-stage downstream failure discards the payment and effect together.
- insufficient fixed mana fails closed before the current stage commits payment/effect state.

This synchronization does not generalize those stage boundaries to other cost shapes or parent mechanics.

## Fresh A-owned coverage run

`npm.cmd run phase3:coverage` completed successfully from the exact R18 acceptance lineage.

```text
archives=14
cards=46
abilities=92
compiledCards=70
compiledCharacters=14
blockingIssues=0
definitionHash=37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333
newRuntimeSemanticRouted=12
legacyExecuteAbility=3
legacyResolveEffect=49
dualRuntime=0
pilotAllowlist=0
notClassifiable=28
taxonomyWarnings=79
```

Raw Phase 3 coverage is unchanged. The current reporter does not separately count this accepted reusable fixed-cost component, so no synthetic KPI improvement is claimed.

The regenerated coverage artifact changed only `generatedAt` and generic static-evidence source line numbers. Source fingerprint, counters, compiled identity, classifications, and evidence identities are unchanged, so this non-semantic generated drift is intentionally not committed.

## Independent evidence carried into A

R18 fresh verification from exact candidate `36670ca3d57331b5354fca35deadc1e34bf5a1db` recorded:

```text
typecheck                            PASS
FB2-01 + Maiya + Kayneth focused     3 files / 22 tests PASS
all rules regressions                40 files / 240 tests PASS
full test:ci                         107 files / 653 tests PASS
generated-content determinism        PASS
production identity/text audit       0 matches
forbidden-file delta audit           0 matches
```

The candidate changes no MatchSession/client/projection protocol and therefore requires no new browser Gate C. Full room/session compatibility remains green in `test:ci`.

## F2/F3 checkpoint judgment

For this exact Cost/Payment sub-capability:

- F2 alignment is satisfied: the normalized request is narrowed to a concrete semantic contract compatible with already accepted parent routes.
- F3 runtime-capability acceptance is satisfied: B2 implementation has independent R18 acceptance and is now pinned at `36670ca3d57331b5354fca35deadc1e34bf5a1db`.

This does **not** complete full-roster F4. F4 still requires an S migration batch selecting exact F1 identities that satisfy both this accepted cost component and an independently accepted parent runtime contract, followed by independent review and A burn-down synchronization.

## Non-promotion

This synchronization does not accept or promote:

- variable/X payment;
- effect-level optional payment;
- third-party or multi-player payment;
- upkeep/maintenance or replacement payment;
- command-seal, victory-point, discard-card, or source-card-movement costs;
- ordinary printed card play costs;
- generic Resource Numeric, Interaction, or Card Action behavior;
- any F1 identity solely because it contains a mana cost.

No A-owned taxonomy/classifier or raw KPI definition is changed.

## Closure / next dependency

The FB2-01 runtime/reviewer lane is accepted and the exclusive `interpreter.ts` lease for this task is released.

The next legal full-roster step is to derive an exact migration membership set from F1 using two simultaneous requirements:

1. the ability matches the accepted fixed controller mana-cost component; and
2. its parent semantic route is already independently accepted.

Abilities that match only the cost shape but still lack an accepted parent route remain blocked on their parent runtime capability and must not be migrated by implication.
