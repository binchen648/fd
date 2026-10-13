# Evidence-Derived Engineering Guardrails

State: SOURCE_VERIFIED_DRAFT; Reviewer A knowledge review pending.
These are bounded summaries of the case evidence, not a new rule authority.
A source review remains valid only for its exact SHA and accepted scope.

| Case | Required guardrail | Regression obligation |
| --- | --- | --- |
| FD-SEC-001 | Keep credentials private and unpredictable; bind reconnect to identity | Real HTTP/WS impersonation negatives and valid reconnect control |
| FD-REV-002 | Require revision before every scoped mutation; reject atomically | Missing/invalid/stale revisions for dispatch and end_turn, state/version/log invariance |
| FD-SHAPE-003 | Preserve difference between absent and malformed present fields | Compiled-container negatives plus valid minimal passive |
| FD-RESTORE-004 | Legal nested pending states round-trip with authenticated ownership | Actual consumer response/choice pause restore and forged/orphan rejection |
| FD-EVID-005 | Bind command results to tested objects and execution stage | Exact receipts and producer/assembly test contexts |
| FD-FIXTURE-006 | Isolate unit fixture base from executing HEAD; supply explicit assembled refs | Same suites on pre-review and post-review trees; unbound producer RA still rejects |

K01 extraction is hash/source-checked only; all entries remain RA-review-pending.
Absent main mechanism/consumer is an applicability boundary, not proof that its
historical defect is fixed or permission to insert old-stack tests. Historical
PR474/475 probe paths are not runtime CI rejection gates. In FD-EVID-005 the
source review accepts b5e68444, while its failure record concerns cfa6a925;
these identities must remain separate in every downstream evidence packet.

Never turn a successful positive test count into proof that its missing negative
was covered. EXISTS at a branch SHA does not imply EXISTS or accepted on main.
UNKNOWN and NOT_VERIFIED must remain visible. Do not automatically transfer a
historical verdict, guess a root cause, or rewrite a failed receipt.

If a proposed guardrail conflicts with an accepted contract, stop that specific
claim and return the exact conflict to Planner. Do not reinterpret canonical
rules. New missing regressions require Runtime Owner authorization and a free
domain reservation; a lesson alone never grants a write lock.
