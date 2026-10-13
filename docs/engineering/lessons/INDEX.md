# Engineering Failure Lessons Index

Status: K01_SOURCE_BINDINGS_VALIDATED_DRAFT; independent RA knowledge review pending.
Entry task: P3-ENGINEERING-FAILURE-PREVENTION-MVP.
Machine index: [catalog.json](catalog.json). Execution protocol:
[HISTORICAL-FAILURE-PREFLIGHT.md](HISTORICAL-FAILURE-PREFLIGHT.md).

| Failure | Domain / contract | Trigger files | Source state |
| --- | --- | --- | --- |
| [FD-SEC-001](cases/FD-SEC-001.md) | Identity / private projection | match-room, match-server | Pinned RB FAILED; scoped repair tests exist on branch |
| [FD-REV-002](cases/FD-REV-002.md) | Revision / atomic rejection | hub, protocol, match-server | Pinned RB FAILED; scoped repair tests exist on branch |
| [FD-SHAPE-003](cases/FD-SHAPE-003.md) | Compiled envelope / reward | combat-reward-distribution | Pinned PR474 technical FAILED; enforcing test unproved |
| [FD-RESTORE-004](cases/FD-RESTORE-004.md) | Nested continuation / persistence | interpreter, match-session, Stheno | Pinned PR475 technical FAILED; enforcing test unproved |
| [FD-EVID-005](cases/FD-EVID-005.md) | Receipt / fixture reproducibility | final-binding, readiness tests | Old FAIL preserved in pinned RA scoped PASS |
| [FD-FIXTURE-006](cases/FD-FIXTURE-006.md) | Explicit temporal fixture / exact refs | final-binding, readiness, preflight | Original I failure bytes bound; A repair still candidate |

FD-SHA-007, FD-FALLBACK-008, FD-REVIEW-009 and FD-WRITER-010 remain UNKNOWN
in catalog.candidateTriage; no source-backed occurrence was established in the
bounded selected evidence. Six cases are drafts, none is knowledge-accepted by A.
Do not invent ten cases to fill a quota.

K01 packet: [K01-SOURCE-AUDIT.json](K01-SOURCE-AUDIT.json).
Source/gap table and owner routing: [K01-HANDOFF.md](K01-HANDOFF.md).
Read-only provenance command: `node docs/engineering/lessons/verify-k01.mjs --validate`.
It verifies source identities/hashes and reproduces the audit, without loading
runtime, installing dependencies or executing tests. It is NOT the K02 task-aware
retrieval CLI, and it grants no review/promotion result.

Existing docs/spec/guardrail-policy.md governs Window C content approval, not
engineering historical evidence. This index supplements that policy and the
agent contract; neither is redefined. Canonical rules and independently
accepted runtime contracts remain the authority. Lessons are navigation and
prevention aids, never new gameplay rules or acceptance votes.

Retrieve at most five relevant cases; default three. Read pinned evidence only
when a claim or missing test requires verification. No whole-history startup.
