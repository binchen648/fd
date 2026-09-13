# P3-A02 B04 Reviewer Packet — CARD_ACTION_SEMANTICS_MINIMAL_PLAY

- Document Role: REVIEWER_PACKET
- Owner: Codex A
- Source Task: `P3-A02`
- Runtime Task: `P3-B04`
- Mechanic Family: `CARD_ACTION_SEMANTICS_MINIMAL_PLAY`
- Exact Candidate Commit: `628238a696d9adfdbfb3a3c404871a8405a6ff8d`
- Candidate Commit Subject: `feat: route minimal play semantics through data flow`
- Status: `REVIEW_PACKET_BASELINE_CANDIDATE`
- Promotion: none; P3-R04 owns independent judgment.

## Candidate Scope

The implementation report claims one exact eligible representative:

- `master.kiritsugu.skill.time-alter#time-alter.action`

Claimed semantic shape:

- automatic `phase_action` in action phase;
- controller action window;
- no cost and no creates;
- one server-projected controller hand-card target constrained to attacks;
- typed `play_selected_cards` face-down through the shared play hook;
- paired `draw_cards(1)` effect.

The report explicitly skips `play_source_card`, ADD_TO_ATTACK, ACTIVATE, CLOSE, append-only markers, and Drake's non-exact private/hidden play shape.

## Exact Evidence Location

The current A02 checkout does not contain the B04 focused test or Time Alter E2E file, but both are present in the reachable exact Git object `628238a`.

Reviewer should create a fresh read-only worktree at that exact commit rather than trusting the report text:

```powershell
git worktree add --detach E:\Codex\FD\fd-r04-b04 628238a696d9adfdbfb3a3c404871a8405a6ff8d
```

Files introduced by the candidate include:

- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/tests/regression/card-action-play.test.ts`
- `e2e/fd-time-alter-core-primitive.spec.ts`
- `docs/reports/2026-09-10-p3-b04-runtime-implementation-report.md`

## Fresh Reviewer Commands

Run at exact `628238a`:

```powershell
npm run typecheck
node docs/audits/fd-card-action-play-inventory.mjs
npx vitest run packages/rules/tests/regression/card-action-play.test.ts packages/rules/tests/regression/resolution-dataflow.test.ts packages/rules/tests/executable-card-pack.test.ts
npx playwright test e2e/fd-time-alter-core-primitive.spec.ts --project=chromium
```

Do not treat the implementer's historical pass counts as independent review evidence.

## Gate A Checklist

R04 should verify:

- semantic routing accepts the Time Alter shape without card/ability-id eligibility;
- wrong phase, added cost, missing draw companion, face-up play, wrong zone, wrong card type, and unrelated card-action effects stay outside the route or fail closed as required;
- compiler validation rejects malformed supported-shape graphs;
- typed play primitive requires the production hook and does not fall through to legacy effect execution after eligibility;
- failure before commit leaves state/revision/events unchanged.

## Gate B Checklist

R04 should prove through real `MatchSession.dispatchPlayerAction`:

- Time Alter is legally projected only in the supported window;
- target candidates are server-derived controller hand attacks;
- selecting the target stages/plays the attack face-down through the shared play path;
- the paired draw resolves through the same accepted transaction semantics;
- no-legal-target state is rejected without opening an invalid pending decision.

## Gate C Checklist

The candidate contains `e2e/fd-time-alter-core-primitive.spec.ts`. Independent review must rerun it and inspect that it actually proves:

- browser activation of the real ability;
- WebSocket `expectedRevision`;
- server target decision;
- reconnect while the decision or resulting state is authoritative;
- face-down attack projection plus draw projection;
- stale replay rejection without duplicate mutation.

Snapshot setup is acceptable only as deterministic preparation; the browser/server action path itself must still be exercised.

## Inventory Claim To Recheck

The implementation report records:

```text
cardActionSemanticAbilities=7
eligible=1
skipped=6
legacyPlayConsumerCount.before=1
legacyPlayConsumerCount.after=0
newRuntimeSemanticRoutedPlayCount.before=0
newRuntimeSemanticRoutedPlayCount.after=1
dualCompatiblePlayCount.before=1
dualCompatiblePlayCount.after=0
remainingSkippedCardActionCount.after=6
```

R04 should rerun the inventory and confirm all six skips remain explicit.

## Ownership / Diff Finding For Reviewer

The exact B04 commit also changes files outside the current B04 `May touch` boundary:

- `artifacts/phase3-skill-coverage.json`
- `docs/audits/fd-rule-conformance-matrix.md`
- `docs/audits/fd-skill-mechanic-family-matrix.md`
- `docs/audits/fd-skill-primitive-conformance-matrix.md`
- `docs/plans/fd-card-engine-stabilization-plan.md`

Current P3-B04 rules prohibit B from changing coverage KPI, taxonomy classifier rules, or evidence classification. A02 does not decide whether these historical documentation/artifact changes are harmless synchronization or unacceptable role contamination; R04 must explicitly judge the diff boundary. If clean role separation is required, the runtime candidate should be repacked without A-owned changes before promotion.

## Missing / Non-Independent Evidence

- No committed P3-R04 independent review report was found in the current task baseline.
- The focused B04 test and Gate C E2E are absent from the current A02 checkout and must be reviewed from exact candidate `628238a`.
- Historical implementer pass claims are not independent evidence.
- Diff ownership contamination requires explicit R04 judgment before candidate promotion.

## Requested R04 Output

- findings ordered by severity;
- semantic routing / legacy-bypass judgment;
- Gate A/B/C judgment for Time Alter;
- explicit disposition of the out-of-scope A-owned files in `628238a`;
- accepted burn-down delta, if and only if the candidate is accepted;
- residual skipped-card risks.
