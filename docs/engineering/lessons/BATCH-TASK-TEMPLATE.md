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

The task owner invokes Historical Failure Preflight automatically once at
startup, using the already supplied structured task fields; no repeated user
copying or separate approval is required for successful retrieval:

```text
node --import tsx scripts/engineering/historical-failure-preflight.ts --task <repository-relative-task-json> --out artifacts/<task-id>-historical-preflight.json
```

The task JSON has exactly taskId, capabilityFamily, semanticContracts[],
expectedChangedFiles[], runtimeDomains[], exactBaseSha, selectedIdentities[],
reservationReference. All metadata is nonempty; automation tasks explicitly
use a NOT_APPLICABLE identity marker instead of inventing a canonical identity.
Attach ranked IDs/reasons, pinned bindings, invariants, forbidden patterns,
regression obligations, historical risk/overflow and unverified coverage to the
same task packet. Read only matched case documents if deeper context is needed.
INPUT_INCOMPLETE/SOURCE_UNAVAILABLE/EVIDENCE_INVALID stop implementation and
remain visible, not a silent PASS. NO_MATCH is UNKNOWN risk. Retrieval does not
authorize writes or replace runtime, reservation or independent review gates.
K02 remains an automation candidate until exact Reviewer A acceptance.

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
