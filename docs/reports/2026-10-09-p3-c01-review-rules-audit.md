# C01 Review Rules Audit

Date: 2026-10-09
Scope: read-only rule and implementation audit; no task review or acceptance.

## Source Binding

After fetching the two named refs:

- `origin/main`: `9a1689d2ec5b56b67d1483d2593b4ab809d6c15c`.
- `origin/codex/planner-p3-e07-control`: `45eb5b3f038f227d69a8f15e7a3c7842f1a718d3`.
- C01 original implementation base: `fefcf4f7f5bd66ed7693889fb99391e6e7321016`.

Local checkout modifications and untracked control records were inspected as
unpublished context, not treated as current-main authority. Existing changes
were preserved. No conversation history or credentials were read.

The main promotion contract, promotion lane, governance validator and policy
workflow are unchanged between the C01 base and the fetched main. Their actual
contents, rather than historical header labels alone, informed this audit.

## Confirmed Review Order

`docs/governance/phase3-slice-task-promotion-contract.md`, Role Pipelines:

```text
EVIDENCE_ONLY: A -> RA -> I -> Human
RUNTIME_DELTA: B -> RB -> A -> RA -> I -> Human
AUTHORING_ONLY: A dependency check -> S -> focused independent review -> A/RA -> I -> Human
CONTRACT_CONFLICT: read-only analysis -> Planner/user disposition
```

RA is evidence/automation review. RB is runtime review. Both are independent,
read-only review roles, not the A/B implementers. Historical recovery roles
have separate assignments and cannot silently take over mainline work.
The prior conversational example suggesting A review before B review is not
the FD runtime pipeline.

## Rules A Worker Must Receive

- Read the agent contract first, then the exact assigned task block and its
  explicit dependencies, relevant canonical rules and plan sections.
- Bind the task, Slice, role, exact base/candidate, control epoch, permitted
  paths, consumer set, dependencies, risk tier and resource reservation.
- Review a frozen candidate. Do not change the target or implement a fix while
  reviewing; return findings to the implementation role.
- Review canonical semantics and production call paths; independently verify
  relevant negatives, fail-closed behavior, secondary paths and evidence limits.
- Do not promote Gate status from implementer-only evidence. Gate A/B/C have
  different scopes; a passing suite is not automatically browser/runtime proof.
- Store a separately attributable immutable verdict with exact candidate SHA,
  evidence, tests actually performed, blockers and non-claims. Do not rewrite
  another role's artifact.
- Distinct GitHub accounts are not required by current promotion governance;
  separate role work and immutable exact-SHA evidence remain required.
- Promotion requires the real GitHub-bound review carrier, matching artifact
  digest/fields and accepted conclusion. Codex I assembles the one final Slice
  Promotion PR; human approval and final required checks remain applicable.
- A conversation or worker completion event has no acceptance authority itself.

## Findings

1. Current-main Epoch 08 metadata is internally inconsistent. The top declares
   `ACTIVE_ON_AUTHORITATIVE_MAIN_AFTER_MERGE`, while its terminal status says
   `EPOCH_08_CANDIDATE_PENDING_GOVERNANCE_REVIEW_AND_HUMAN_MERGE`. The embedded
   main SHA is historical. The task index points to Epoch 08, and the Planner
   closure records A3 promotion on the fetched main. A machine must not infer
   execution authorization from one status string. Planner/G should reconcile
   the published metadata; this audit does not rewrite it.
2. The Slice promotion contract still labels itself
   `PLANNER_PUBLISHED_GOVERNANCE_REVIEW_REQUIRED` and names Epoch 07's old base,
   although current-main Epoch 08 explicitly inherits that governance. Preserve
   this source discrepancy in any handoff rather than treating the header as
   the sole applicability test.
3. The local code-fix/pre-review standard contains uncommitted additions about
   canonical reconstruction, graph closure, timeline identity and invariant
   review across entry points. They are useful context but not a pinned,
   published normative input unless separately authorized or published. The
   local task index and Epoch 05/06 records also differ from current main.
4. `scripts/phase3-governance.ts` validates manifest fields, accepted verdict,
   real-looking GitHub URL syntax, artifact digest and matching fields, distinct
   review commit identity, and candidate -> synchronization -> final-head
   ancestry. It does not encode the complete risk-tier-specific RA/RB pipeline,
   prove that the GitHub URL contains a substantive review, or verify human
   approval. Historical `stacked` input remains accepted in code even though
   new stacked role PRs are forbidden by the contract. The contract explicitly
   says missing automation is enforced manually by Planner and reviewers.

These findings mean policy PASS is a partial check, not evidence that every
review stage occurred. No fresh candidate was reviewed in this audit.

## Minimal Handoff Recommendation

Prepare a source-pinned review packet containing the applicable rules file
paths/blob digests, exact task authorization, role, risk tier, candidate/base,
required predecessors with accepted artifact references, permitted paths and
explicit non-claims. Add any user-confirmed chat-only instruction as a separate
provenance-bearing input; never invent missing context.

Before dispatch, manually check all predecessor stages and unresolved source
conflicts. A worker may return a review candidate artifact, but it must not
declare itself an existing desktop reviewer or receive promotion authority by
its session name. Missing authorization, conflicting instructions or unbound
candidate evidence keep the handoff blocked.

For C01, the applicable path is A -> RA; there is no runtime-delta authority and
no reason to insert RB merely because a CLI process ran. This audit does not
dispatch RA or satisfy independent review of C01.

## Verification And Limits

Verified by Git fetch, exact-ref `git show`, relevant local file reads, source
diff and validator/workflow inspection. No runtime tests, live GitHub checks,
branch-protection audit, substantive PR review or human-approval verification
were performed. This is a rule audit, not a machine-policy acceptance result.

Primary inspected files:

- `docs/agents/PHASE3-AGENT-CONTRACT.md`
- `docs/agents/PHASE3-TASK-INDEX.md` startup/current-control portions
- `docs/agents/FD-P3-CONTROL-EPOCH-08.md`
- Planner `P3-E08-CI-01-REVIEW-DISPOSITION.md`
- Planner `P3-E08-A3-CLOSURE-AND-NEXT-QUEUE.md`
- `docs/governance/phase3-slice-task-promotion-contract.md`
- `docs/governance/phase3-promotion-lane.md`
- `docs/plans/fd-rules-conformance-and-acceptance.md` gate/reviewer portions
- local `docs/plans/2026-09-14-fd-code-fix-and-pre-review-standard.md`
- local historical Epoch 05/06 and re-attestation dispatch records
- `scripts/phase3-governance.ts`
- `.github/workflows/phase3-pre-review-gate.yml`
