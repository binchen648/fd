# Phase 3 Card Action Reviewer Packet Template

- Document Role: REVIEWER_PACKET_TEMPLATE
- Owner: Codex A
- Source Task: `P3-A02`
- Status: `REVIEW_PACKET_BASELINE_CANDIDATE`
- Purpose: reusable independent-review packet structure for P3-B04 through P3-B10 slices.

## Candidate Identity

Record all of the following before review starts:

```text
runtimeTask:
mechanicFamily:
exactTargetCommit:
exactRuntimeBase:
implementerReport:
reviewBranch:
```

Do not review “latest”. Do not inherit acceptance from a neighboring mechanic family.

## Scope Contract

Reviewer must confirm:

- the candidate implements only the assigned mechanic family;
- routing eligibility is semantic and does not depend on card/ability identity unless the task explicitly authorizes identity;
- skipped shapes remain skipped rather than being broadened to improve counts;
- no A-owned KPI/taxonomy/evidence-classification rule is modified by a B task;
- no unrelated Trigger, Lifecycle, Interaction, Battle, Modifier, Hidden, or other gateway runtime is pulled into scope.

## Gate A

Required evidence:

- compiler/normalizer rejects malformed supported-shape graphs;
- typed primitive/result contract is validated;
- negative cases fail closed;
- runtime invariant failure leaves authoritative state unchanged for the current dispatch;
- eligible paths do not retry through legacy `resolveEffect` after typed routing is selected.

Reviewer reruns the focused compiler/data-flow tests named by the implementation report and records exact pass counts.

## Gate B

Required evidence:

- at least one canonical representative is compiled from current authoring/content;
- execution goes through real `MatchSession.dispatchPlayerAction` or the task's explicitly trusted production entry;
- state delta, emitted events/result envelopes, and rollback behavior match the mechanic contract;
- server revalidates targets/costs/state rather than trusting client-derived result values.

## Gate C

Gate C may be promoted only when the task requires it and independent production-path evidence exists.

For browser/server paths, verify as applicable:

- real legal-action projection;
- WebSocket command revision;
- server-side legality revalidation;
- pending interaction projection;
- reconnect consistency;
- stale/duplicate replay rejection;
- failed dispatch leaves authoritative state/revision unchanged.

A restored snapshot may prepare deterministic state, but `/restore` alone is not proof that the production action path executed.

## Inventory / Burn-Down

Record, without redefining A-owned classifiers:

```text
eligible:
migrated:
skipped:
legacy before -> after:
new runtime before -> after:
dual before -> after:
```

Every skipped current ability must have an explicit scope reason.

## Diff / Ownership Review

Reviewer must inspect `git diff --name-only <base>..<target>` and classify each file as:

- allowed runtime hot file;
- allowed focused test/E2E;
- allowed scoped report;
- out-of-scope ownership drift.

Any B-owned commit changing coverage KPI, taxonomy/classifier logic, evidence promotion, or unrelated planning state must be reported rather than silently accepted.

## Required Reviewer Output

- findings ordered by severity;
- accepted evidence;
- rejected or non-independent evidence;
- missing tests/evidence;
- semantic-routing/no-legacy-bypass judgment;
- Gate A/B/C judgment;
- residual risks;
- A synchronization input when accepted.

The reviewer must not implement fixes in the review branch.
