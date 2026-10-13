# Historical Failure Preflight

Owner: Planner matching contract; A automation; RA evidence review.
The agent invokes this protocol once at task startup, before implementation.
It is not a second approval gate or a replacement for task/runtime acceptance.

## Required Task Input

taskId, capabilityFamily, semanticContracts[], expectedChangedFiles[],
runtimeDomains[], exactBaseSha, selectedIdentities[], reservationReference.
Empty required metadata returns INPUT_INCOMPLETE, never CHECKED.

Read catalog.json. Before the CLI exists, the agent performs and records this
same matching procedure directly; report automationAvailable=false. Do not
claim the CLI ran. After K02 is accepted the Batch template invokes it
automatically; users need not copy lessons between chats.

## Deterministic Retrieval Contract

Rank each case: exact file match +8; exact semantic contract +6; exact domain
+3; declared capability family matching a contract +2. Normalize separators,
use repository-relative exact paths, reject traversal. Tie-break by risk
CRITICAL/HIGH/MEDIUM/LOW then Failure ID. Return three by default, at most five.
If more than five cases apply, return overflow IDs and a scope-splitting alert;
do not silently omit applicable critical risks. No matches returns NO_MATCH,
not historical risk LOW or a proven absence of prior failures.

Verify the catalog/case and each selected pinned source commit/path/hash.
Unavailable source returns SOURCE_UNAVAILABLE. Hash mismatch returns
EVIDENCE_INVALID. Draft cases remain visibly DRAFT until RA verifies them.
Neither retrieval success nor review of the case grants runtime acceptance.

## Output

- taskId, exactBaseSha, knowledge/catalog digest, input digest, source digest
- Relevant Failure IDs, matching reasons and case review state
- applicable invariants, forbidden patterns
- required regression paths/commands, existence SHA, current-base existence
- missing or unverified negative coverage and non-gating reviewer probes
- historical risk classification and overflow
- automationAvailable, status and elapsedMs

Cache by task input digest + knowledge/source digests + relevant task-source
objects at the exact base. Reuse within the task. Recompute only when scope,
applicable knowledge, or relevant sources change; a report-only commit does
not alone invalidate the preflight. A failed lookup cannot be cached as success.

## Proposed K02 Invocation

node --import tsx scripts/engineering/historical-failure-preflight.ts --task <task-json> --catalog docs/engineering/lessons/catalog.json --out <task-output>

This command is NOT_IMPLEMENTED until K02. Output can be embedded in the
existing task packet. It must not auto-run tests, acquire locks, dispatch
workers, edit runtime or award acceptance. Synthetic unit fixtures must be
clearly marked and must never become historical case evidence.
