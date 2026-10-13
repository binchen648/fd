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

## K02 Standalone Invocation

node --import tsx scripts/engineering/historical-failure-preflight.ts --task <task-json> --catalog docs/engineering/lessons/catalog.json --out <task-output>

Implementation: AUTOMATION_BASELINE_CANDIDATE; K02 exact tooling review pending.
The command invokes only read-only Git and Node built-ins. It does not import
runtime, execute regressions, acquire locks or dispatch workers. No package alias.
Output may be embedded in the existing task packet; --out accepts an untracked
repository-relative artifacts/*.json receipt, never an existing tracked artifact.
Unknown/duplicate CLI flags, traversal and symlink input/output are rejected.
--limit is 3 (default), 4 or 5. --cache accepts only a JSON file below
.cache/historical-failure-preflight/; the default is default.json in that directory.
Synthetic unit fixtures are parser/integrity checks, never historical evidence.

The immutable external K01 Reviewer A commit is
2470f00902bd650bc3122f518b18333afed323f3; artifact
docs/reviews/phase3/P3-EFP-K01-ccbdf647-reviewer-a.json; SHA-256
DA0F45FDED94F1DC941A3A6B7A91DA586D2DE36B0188EC8F3662FCBAF9B98687.
Its direct parent, reviewed candidate, verdict, epoch, scope, bound audit and
per-case verdicts are checked. Frozen catalog/case PENDING/DRAFT wording remains
historically accurate; the output adds ACCEPTED_EXTRACTION_ONLY separately.
No extraction PASS is a current-base semantic execution PASS.

All matched pinned sources, including overflow, are checked on every call.
The cache is a derived-output snapshot, never an evidence authority. It is
reused only when both its stable key and its revalidated payload agree.
Relevant source objects include declared files, matched case files and test
paths at exactBaseSha and their working-tree byte digests (dirty source cannot
silently reuse cached output). The base SHA itself is excluded from the stable task
digest so a report-only descendant can reuse the same cache, while the output
still names the new exactBaseSha. Engine, scope, catalog, case/audit/review bytes
and relevant object changes invalidate it. Failed retrieval is not success-cached.
Hash drift is EVIDENCE_INVALID, unavailable Git/source is SOURCE_UNAVAILABLE,
malformed task is INPUT_INCOMPLETE; all exit 1 with a structured error.
NO_MATCH exits 0 as a completed lookup with UNKNOWN risk, not an approval.
CHECKED also grants no acceptance. Missing static paths are MISSING, existing
paths PRESENT_STATIC_ONLY, semantic execution coverage always NOT_VERIFIED.
No measured speedup or current-main coverage is claimed by cache retrieval.
Ordinary task outputs under docs/reports/ or artifacts/, plus the two K02
handoff/execution outputs, are excluded from source-object cache keys. Their
declared paths remain in the task-scope digest. A matched case naming such a
path adds it back as relevant input; pinned report sources are always verified.
This is only cache applicability, never a path authorization or evidence waiver.
