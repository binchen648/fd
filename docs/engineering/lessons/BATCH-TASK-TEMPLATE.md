# Capability Batch Task Template

Task ID:
Owner:
Exact base / branch / worktree:
Capability family:
Semantic contracts:
Exact selected identities:
Expected changed files:
Runtime domains:
Risk / promotion class:
Existing primitive support and pinned contract:
Runtime hot-file reservation (record, owner, acquisition/release):
Dependencies:
Read: agent contract, assigned task, this preflight protocol, matched cases only.

## Startup

Run Historical Failure Preflight using the structured task fields automatically.
Before K02 exists perform its deterministic protocol and record
automationAvailable=false. Attach matched Failure IDs, source bindings,
invariants, forbidden patterns, required regressions and missing coverage.
Do not load the full history. A lookup failure is visible, not a silent PASS.

## Acceptance Matrix

| Identity | Semantic contract | Primitive / binding | Positive | Historical negative | Result binding / atomicity | Reviewer / exact SHA | State |
| --- | --- | --- | --- | --- | --- | --- | --- |
| exact ID | one independently judged contract | pinned proof | receipt | case/test/ref | applicable evidence | fresh proof | pending |

Implementation may batch multiple identities inside one approved capability
boundary. Each semantic contract remains independently judgeable. Split tasks
with unrelated mechanic families or overlapping incompatible invariants.
Set a batch exit criterion and return all known blockers together.

## Freeze And Handoff

One implementation/carrier packet, scoped immutable review, one final promotion
PR by I. No role-level PR chain or repeated knowledge approval. Required tests
scale with risk and scope, not every edit. Existing B11 heavy-test windows and
locks remain authoritative.

## Metrics

Record timestamps and exact terminal state, first-review verdict, repeated
failure IDs, rework count, accepted contract count, and preflight elapsed time.
Unknown data is null, never zero. No claimed speedup without a comparable pilot.

