# P3-FB2-01 Result — Fixed Controller Mana Cost Component

- Date: 2026-09-16
- Role: Codex B2
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
- Branch: `codex/b2-p3-fb2-01-fixed-controller-mana-r1`
- A handoff base: `49b7e89142dcbea53c86dc12de322fd12fe6c75b`
- A handoff transaction-boundary correction carried on branch: `f33f8e4f63c98fc0851596ea06da5cf01b895f7c`
- Accepted runtime lineage before handoff: `a5f390e96ac2560226f9d48f133c9b09f5a1e140`
- Read-only F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- F1 request: `runtime-capability-855dd7329e2d` / `GENERIC_COST_PAYMENT`

## Implemented capability

FB2-01 adds one identity-free component classifier for the exact top-level fixed controller mana-cost shape:

- exactly one top-level `pay_mana` node;
- amount is a positive safe-integer literal;
- payer is absent/default controller or explicitly `controller`;
- an ability carrying effect-level `optionalCost` is excluded from this component;
- variable/expression, third-party, multiple-node, non-mana, and zero/negative/fractional shapes are excluded.

The component does not make an unsupported ability routable. Runtime adoption is gated behind the two independently accepted parent semantic routes that already use this exact fixed cost shape:

- Maiya `military.attach-support-shot` — accepted ADD_TO_ATTACK parent route;
- Kayneth `volumen.extra-play` — accepted source-card PLAY response parent route.

No card ID, ability ID, master/servant ID, owner ID, or printed text is used to recognize the cost component itself.

## Transaction behavior

The implementation reuses the existing typed Resolution Data-flow `pay_mana` primitive; no second payment implementation was added and `resolution-dataflow.ts` was not modified.

Parent route stage boundaries are preserved:

- Maiya remains staged. The activation dispatch resolves typed `pay_mana(2)` first and then opens the already accepted pending target. The payment emits typed `mana_paid` evidence. If a later target dispatch rejects because the target became illegal, the already committed activation-stage payment is not refunded.
- Kayneth is non-staged. Its fixed payment node and `play_source_card` effect are passed to the same `executeResolution` transaction. If source-card play fails after the payment node, the resolution clone is discarded and the payment, card movement, and emitted events do not leak.
- Insufficient fixed mana fails before the current stage commits any payment/effect mutation.

All other legacy/variable costs retain their previous path. FB2-01 does not migrate or reinterpret them.

## Files changed by B2

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/tests/regression/fb2-fixed-controller-mana-cost.test.ts`
- this result report

Not changed:

- `packages/rules/src/match-session.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- F1 inventory/catalog/source-evidence artifacts
- A-owned KPI/taxonomy
- authoring roster content
- client/server projection or interaction protocols

## Focused proof

`packages/rules/tests/regression/fb2-fixed-controller-mana-cost.test.ts` proves:

1. identity-independent positive fixed controller mana classification;
2. rejection of zero, negative, fractional, variable/expression, third-party, multi-node, non-mana, and effect-level optional-cost shapes;
3. Maiya typed payment evidence (`mana_paid`, `before`, `after`, `delta`, `resource`, causation fields) at activation-stage commit;
4. Maiya later target-stage rejection preserves the already committed activation payment and adds no new events;
5. Kayneth successful fixed payment and source-card play settle in the same typed stage;
6. Kayneth same-stage source-play failure rolls the payment back;
7. insufficient fixed mana leaves mana, source zone, and events unchanged.

The existing Maiya and Kayneth focused suites were run with the new suite and remain green.

## Verification

Final post-self-review commands:

- `npm.cmd run typecheck` — PASS.
- `npm.cmd exec vitest run packages/rules/tests/regression/fb2-fixed-controller-mana-cost.test.ts packages/rules/tests/regression/card-action-add-to-attack.test.ts packages/rules/tests/regression/card-action-play-source-response.test.ts` — PASS, 3 files / 22 tests.
- `npm.cmd exec vitest run packages/rules/tests/regression` — PASS, 40 files / 240 tests.
- `npm.cmd run test:ci` — PASS, 107 files / 653 tests.
- `npm.cmd run verify:generated-content` — PASS with deterministic hashes:
  - `fd-playtest-v1.content-library.json`: `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`
  - `fd-playtest-v1.fixture.json`: `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - `fd-playtest-v1.evidence-report.json`: `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- `git diff --check` — PASS.

The new worktree initially lacked dependencies. `npm.cmd ci --offline --ignore-scripts` reconstructed the workspace-local dependency links from the existing npm cache; it did not change tracked source or lock data.

## Gate C

No fresh browser Gate C is required for this candidate. FB2-01 does not change MatchSession transport, payment projection, pending-interaction protocol, reconnect behavior, stale-command handling, or client UI. Existing full CI continues to cover room/session compatibility.

## Scope/non-promotion statement

This candidate does **not** promote the entire `GENERIC_COST_PAYMENT` F1 request. In particular it does not accept variable/X costs, optional effect costs, third-party or multi-player payment, upkeep, replacement payment, command-seal cost, victory-point cost, discard-card cost, source-card movement cost, or ordinary printed play costs.

No F1 roster authoring is migrated by B2. A future migration task must independently select exact F1 identities that match an accepted runtime contract.

## Reviewer handoff

P3-R18 should start from the exact final B2 candidate HEAD and independently verify:

- fixed controller mana exact-shape classification and identity independence;
- typed payment evidence;
- insufficient-mana fail-closed behavior;
- same-stage rollback for Kayneth;
- preserved staged activation semantics for Maiya;
- Maiya/Kayneth and B13-B23 compatibility;
- full-root CI/determinism;
- absence of F1 migration, MatchSession/client changes, identity routing, printed-text parsing, and broader Cost/Payment promotion.

Reviewer must not implement fixes in the review worktree.
