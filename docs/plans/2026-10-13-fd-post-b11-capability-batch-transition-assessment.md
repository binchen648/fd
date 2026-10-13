# FD POST-B11 CAPABILITY BATCH TRANSITION PLAN

Assessment date: 2026-10-13. Planner / Process Controller / Flow Auditor.
Status: NEEDS_MORE_INFORMATION.
Decision: adopt a bounded Capability Batch Lead workflow for mature-contract
reuse; do not replace independent review, authority ownership or exact evidence.
No code, PR, main change, new Epoch or worker write grant is made by this plan.

## 1. Current State And Evidence

Fresh origin/main:219d47c8dcc2b8118f2d3f6b37f51ce465e737cb.
Root branch:codex/real-test at05bac08fc4e0755566f0f31fc579193fdd2b7c5a;
root has pre-existing tracked/untracked user changes, untouched.
Assessment branch:codex/planner-p3-e08-environment-recovery; initially clean.

GitHub paginated open-PR snapshot:513 open;51 base main;462 other bases.
These are open records, not513 active writers or ready merge candidates.
GraphQL repository.mergeQueue(branch:main) returned null. No active GitHub merge
queue was exposed; an internal Planner ready queue is a different mechanism.
An initial unsupported branch-protection field query failed; no conclusion about
protection settings is inferred from it.

244 registered worktrees;6 paths inaccessible. Registration does not establish
live agent activity. Relevant inspected heads:
- B K03:540abe6c8cadc015fe7ad4030673091405a61063
- I EFP:1d95b2306b6b3b7aa30c39041b33dad892872657
- A K01:ccbdf647a545e08f09a8067c8f2c4659f849889a
- A K02:36de92a0536d7bc06a47f61c8484a51f4e981dfc
- A K03:e86e9b19d5af4cfa0ca160377ec1e09d13336744
- RA I01:dd9a869de718bc1cf23cf5a9826149becc3cb659
- RA K01:2470f00902bd650bc3122f518b18333afed323f3
- RA K02:d1a8276fd2ed1181ca281b27e840cb022d9079e6
- RA K03:f129797b68c70b9dd85d2ffcc88d9bcfb5c19f83

Current published Epoch:FD-P3-2026-09-23-09, per main task-index header.
Main index still names pre-publication main9a1689d2 and B11 I WAITING.
Its task states are stale relative to actual PR559 and post-merge proof; Epoch09
itself is not stale solely because those fields are old. Epoch07/08 blocks are
historical. Epoch10 throughput document remains proposal, not a new authority.
Planner closure/reservation dispositions are published off-main; main's old
grant records cannot alone determine current scheduling.

Main remains219d47c8; no new merge occurred during assessment. I01 is a main
descendant (main-only0/candidate-only2). Historical b5e68444 is an ancestor now
(main-only11/candidate-only0); it remains old evidence, not a fresh task base.
Example C:/b11-main still points at13ab771, not current main; no writer activity
or acceptance is inferred from its presence. Large PR backlog is not individually
re-audited here; stale-candidate counts beyond these samples remain unknown.

Evidence commands:git fetch origin;git status --short --branch;git worktree list
--porcelain;paginated GitHub pulls?state=open;GraphQL mergeQueue;git rev-list.
Sources below are read at exact commits, not Agent recollection.

## 2. B11 Closure Status

Implementation:COMPLETE within approved B11 result-binding/security scope.
Review:SCOPED_RB_ACCEPTED at0f62210a2e007a15e28f945c546ccd00c345942a,
review4d5b76be9d5459cc0c40e50fae8513bc59cd5d21.
Evidence:RA accepted086a86a; post-merge sync17570203 accepted by
c23a2ce1d356fd1d2f29ebc5e83acd01bc2e00c4.
Promotion:PR559 MERGED; head3ec8b5393118b2b250eacd044dfd18ec098662cb.
Main:merge219d47c8dcc2b8118f2d3f6b37f51ce465e737cb.
Main build/test/policy/deploy all SUCCESS;194 files,1606 passed/1 skipped.
Planner release:54507f29,docs/agents/manifests/reservations/P3-E09-B11-CLOSURE-RELEASE.json.
Both scoped B11 source and finalization tooling grants released; immutable
evidence and unrelated reservations remain.

Remaining risk:Global Gate C NOT_VERIFIED;93 missing images;long-term stability.
No B11 repair blocks a read-only Batch prepare. A new runtime pilot still needs
its own contract/base/reservation; B11 closure does not authorize it.

## 3. Remaining Work Map

This is a capability-level map, not a freshly reconciled per-identity backlog.
Ledger111/944,remaining833, from accepted post-merge accounting. Source inventory
has127 archives/169 cards/281 abilities; those counts are not the944 identity
denominator. Current routing23 new/144 resolve/3 execute/0 dual/111 unclassified
is implementation measurement, not migration acceptance.

| Work / type | Owner | Current evidence-backed status | Risk | Dependency | Batch suitable |
| --- | --- | --- | --- | --- | --- |
| Result Binding / runtime + migration | B/Lead;RB | B11 limited production reuse merged; broader forms unproved | HIGH outside scope | typed outputs, costs, pending ownership | Same accepted graph only |
| Resource Numeric / runtime + authoring | Lead;RB | main classifier/tests exist; early TO08 review target not main ancestor | LOW-MEDIUM for direct form | current-main contract equivalence | Yes after binding |
| Card Action / runtime + authoring | Lead;RB | five primitive surfaces/tests present; separate contracts; early TO10 ancestry false | MEDIUM | PLAY/source/attach/activate/close separately | Per exact action contract |
| Target Interaction / runtime | B;RB | B11 target/reconnect scope present; generic/private extension not globally accepted | HIGH | session/revision/private authority | Mature fixed contract consumers only |
| Trigger Gateway / runtime + migration | B;RB | historical TO11 single forced-entry representative; universal reuse unproved | HIGH | domain event payload/order/idempotency | No new gateway batch |
| Lifecycle Gateway / runtime + migration | B;RB | historical TO12 scoped reinstall policy; broader ownership/cleanup unproved | HIGH | source-state/incarnation/reset | No core-policy batch |
| Modifier / runtime + authoring | B;RB | shared ongoing/secondary paths reported; not unified full ownership | HIGH | lifecycle/source/power trace | Existing pinned policy only |
| Power / runtime | B;RB | GF2 representative proof exists; full layering not certified current main | HIGH | canonical power order/trace | No core pipeline batch |
| Battle / runtime | B;RB | GF2 report scoped; K03 reward guard candidate/fullCI blocked | HIGH | winner/result/events/compiled admission | No cross-contract batch |
| Full roster / migration | S or scoped Lead;A/RB/RA |111 accepted,833 remain; no fresh per-ID readiness ranking | MEDIUM-HIGH | identity source/current runtime contract | Only fresh zero-gap group |
| Skill normalization / authoring | S/Lead;RB | branch/source inventories exist, exact new batch not selected | LOW-MEDIUM | printed clause fidelity/schema/whole-skill coverage | Yes within one family |
| Evidence migration / evidence | A;RA | K01/K02 accepted off-main; I01 scoped pass; G bridge continuation pending | MEDIUM | remote source closure/exact lineage | Yes frozen source sets |
| Governance/integration | G/I;Human | G01 at4e6b969 reports input incomplete;3d5b5fc9 supplements authority | MEDIUM | actual bridge/ref/policy/required checks | One final PR per boundary |

Main artifact source:artifacts/phase3-skill-coverage.json.
Historical review sources read at main:
2026-09-14-p3-to08-resource-current-r1-review.md,
p3-to10-card-action-current-r1-review.md,
p3-to-11-trigger-runtime-r1-review.md,
p3-to-12-lifecycle-runtime-r1-review.md,
p3-to-13-interaction-runtime-r1-review.md,
golden-flow-2-independent-review-r2.md.
The six target candidates all fail main ancestry checks. This does not disprove
their contracts or copied source equivalence, but requires exact applicability/
blob verification before claiming accepted current-main reuse. No fresh dynamic
conformance for these historical reports was run in this assessment.

## 4. Bottleneck Analysis

Primary Bottleneck:integration/evidence composition and branch/provenance debt.
Evidence:462/513 PRs use non-main bases; PR559 initial test failed because pinned
historical review was unpublished (0935b0db records exact repair); I01 scoped
review requires remote closure/topology identity; main index still says WAITING
after actual merge; K03 new runtime source hits a frozen B11 packages snapshot.

Secondary Bottleneck:scope/contract readiness and shared-file ownership.
Evidence:K03 consumes loader predicate reservation; broader trigger/lifecycle/
interaction historical acceptance is not automatically current-main acceptance.
Implementation complexity remains material, but no task timing data proves
Agent edit speed is the dominant cause.

Review bottleneck:documented per-role handoff loops and missing reference
contracts, rather than demonstrated insufficient reviewers. Case FD-FIXTURE006
records producer/assembly context mismatch. Queue waiting durations and first
review pass-rate baseline are not available, so no quantified ranking of review
labor versus implementation time is claimed.

Evidence bottleneck:new source changes repeatedly collide with immutable old
execution snapshots. K03 report at540abe6c states defaultCI193/194 files,
1615/1616 tests,exit1; failure is Candidate source drift:packages/rules/src in
phase3-e09-b11-final-binding.test.ts. This producer result is not RB acceptance.
Resolve temporal evidence applicability in one bounded contract continuation
before scaling runtime batches; preserve historical snapshots and negative
guards. This plan does not authorize a validator fix.

## 5. Batch Suitability Matrix

| Class | Reason / expected scope | Risk | Decision |
| --- | --- | --- | --- |
| Direct resource mapping | Same typed fixed adjustment, known timing/cost, no hidden choice/trigger | LOW-MEDIUM | Prepare pilot |
| Existing PLAY mapping | Existing hook/legality/cost contract; independently prove each identity | MEDIUM | After current-main binding |
| Same-contract normalization | Clause-faithful schemas and no new engine behavior | LOW-MEDIUM | Suitable |
| Frozen-source evidence binding | Exact verified refs/blob set with unchanged semantics | MEDIUM | Suitable; no runtime credit |
| New primitive/gateway | New rule ownership and schema/runtime failure behavior | HIGH | Keep scoped B -> RB workflow |
| Session/credentials/revision | Core authority and private state | CRITICAL | Exclude Lead batch |
| Trigger/lifecycle core | Ordering/identity/reset/cleanup cross-contract effects | HIGH | Serialize under owner, scoped review |
| Modifier/power/battle changes | Competing owner paths and broader canonical dependencies | HIGH | Exclude generic batch |
| Old macro/owner stack replay | Mixed runtime/authoring/evidence, divergent topology | HIGH | Extract one compatible boundary; no wholesale batch |

Capability batching already appears in main stabilization plan's mechanic-family
direction. The transition is enforcing that model operationally, not redesigning
Phase3 architecture. Use mature-contract batches alongside scoped runtime repair,
not an all-or-nothing replacement of the current process.

## 6. Lead Builder Permission Model

Need New Agent:NO as a new authority/role layer. An optional fresh Codex conversation
can act as Lead Builder to reduce irrelevant history, using existing B or S role
ownership. It does not acquire A's measurement or R's acceptance powers.

Proposed initial cap:2-4 exact skill identities, one approved semantic contract;
expand only after measured successful pilot. All IDs chosen before IMPLEMENT.
Allowed:assigned authoring mappings, scenario tests, exact clause normalization
and existing adapter configuration only where task explicitly authorizes it.
Allowed new tests cover per-ID positives and shared family negatives.
Any implementation change to the adapter itself ends the low-risk mapping scope
and requires explicit runtime delta task/review.

Restricted without separate grant:interpreter.ts,match-session.ts,loader shared
helpers,resolution-dataflow.ts,room/hub/protocol/server authority,mutation rules,
new primitives,trigger/lifecycle owners,cost legality,taxonomy/coverage KPI.
No ability/card-ID exception, hidden fallback, canonical-rule reinterpretation,
coverage credit assignment or self-acceptance. A reservation is still required
for every actual writer domain; Lead cannot delegate competing writers.

## 7. Capability Batch Pipeline

| Stage | Owner | Entry / output |
| --- | --- | --- |
| PREPARE | Planner selects;A evidence;Lead read-only | Exact main,IDs,one contract,source clauses,primitive support,failure preflight,test/acceptance matrix,lock |
| IMPLEMENT | Lead Builder under B/S contract | One boundary,per-ID mappings/tests,all blocker list,one frozen candidate |
| VERIFY | Reviewer B | Shared contract core once plus every identity's semantic mapping/positive/negative/result completeness |
| EVIDENCE | A;Reviewer A | One exact packet,counts/refs/source equivalence;RA verifies evidence only |
| PROMOTION | G as required;I;Human | Actual candidate/RA/G topology,remote closure,CI/policy,one final PR,approval,post-merge sync |

Lead can assemble draft evidence while implementing; A finalizes measurements
once at freeze. Reviewers may read PREPARE early without awarding acceptance.
N+1/N+2 prepare while N is verified; do not create three speculative runtime
branches. One writer per shared resource domain; same-file domains do not become
safe merely by giving them different lane names.

## 8. Reviewer Adaptation

Recommended Review Model:shared capability-contract review plus mandatory
per-identity acceptance matrix. Do not reread common primitive implementation
for every identical consumer when exact accepted objects are reusable.
Every identity still needs source-clause mapping,eligible shape,cost/timing/
target/result/visibility completeness and no fallback evidence.

Different PLAY,ADD_TO_ATTACK,CREATE_AND_ACTIVATE,ACTIVATE,CLOSE never inherit
each other's acceptance. A shared family is not necessarily a shared contract.
Use delta review only after reviewer proves actual semantic equality and
preserved owner dependencies. New semantic behavior gets full scoped review.
Never replace fresh actual HTTP/WS/private projection checks with direct unit
counts when the contract touches that production path.

## 9. Pilot Recommendation

Pilot Capability:RESOURCE_NUMERIC_CORE_DIRECT_ACTION mapping/normalization.
Proposed Task ID:P3-CB-P01. State:PREPARE_ONLY_NOT_DISPATCHED.
Expected scope:2-4 exact additional eligible identities using already supported
fixed direct resource primitives; no runtime changes or new trigger/payment/
battle/private/lifecycle/result-dependent variants.
Owner:existing B/S acting as Lead;Reviewer B technical;A/RA evidence;I promotion.

Known control identities at current main:
- master.gatou.command-spell#command-spell.gain-mana
- master.olga-marie.command-spell#command-spell.gain-mana
They are already new-routed, not new migration opportunities. Tomoe direct VP
is a separate control if that contract is selected; do not silently mix it.
Main Gatou printed effects are adjust_mana4 and adjust_command_seals-1.
Current resource core tests explicitly cover semantic-form routing,typed events,
corruption fail-closed and direct Tomoe VP.

Expected files:only each selected canonical authoring archive plus one batch
test and one packet/report. Exact new archives cannot be listed until new IDs
are selected. Existing relevant regression paths:
packages/rules/tests/regression/resource-numeric-core-direct-action.test.ts
packages/rules/tests/regression/resource-numeric-room-boundary.test.ts.
No shared interpreter/session edit. If existing authoring is already canonical,
run conformance pilot without meaningless no-op edits and label zero migration.

Acceptance:current-main primitive/contract binding;all selected printed clauses;
per-ID production dispatch/typed deltas;wrong shape/controller,cost underflow/
atomic rejection,stale/missing revisions and applicable historical negatives;
legacy/new/dual counts without KPI changes;same final tests fail against a
controlled prior-error mutation and pass against valid code;independent review.
Mutation probe is test-only,never persisted in runtime or published as real
historical evidence. Preserve B11 tests,global gates and exact receipts.

Why suitable:small stable visible direct shape with reusable controls and no
new authority dependency. Why not READY:additional exact identities and their
whole-skill eligibility have not been proved;historical TO08 source equivalence
on current main is not yet bound;no current-main per-ID readiness matrix.
Do not pick arbitrary skills solely from family keyword counts.

## 10. Risk Assessment And Current Lane Constraints

B11 lane released by explicit Planner54507f29;no unfinished B11 runtime grant.
K03-B loader predicate lane remains reserved underdd3cfd5c;candidate540abe6c
is IMPLEMENTATION_COMPLETE_CANDIDATE,fullCIblocked;no fresh RB verdict inspected.
Its heavy validation window ended, but source reservation is not released.
Do not treat it as the low-risk pilot or let a Lead edit loader simultaneously.

I01 integration lane is independent tooling/evidence;G bridge authorization
3d5b5fc9 is published,latest fetched G packet4e6b969 still reports incomplete.
Do not infer that bridge is now complete from authorization alone.
Historical worktree6 inaccessible paths and branch-local owner records prevent
a claim of globally enforced locks. New task starts with fresh targeted checks.

Batch risk:one bad shared assumption affects multiple identities;control with
small initial cap,per-ID matrix,family negatives,unknown-coverage visibility,
independent RB and single accepted promotion. Long batches can also hide
partial success;failed rows never receive blanket batch credit.

## 11. Missing Data And Recommended Next Action

Need before IMPLEMENT:
1. A's current-main exact per-ID ready list for one resource contract,including
   source provenance/printed clauses and all non-resource dependencies.
2. Current-main primitive/accepted-contract object binding;not merely old PASS
   report presence. Missing ancestry can use validated exact source equivalence.
3. Explicit eligible2-4 new identities and exact authoring paths;or formally
   choose a zero-increment conformance pilot instead.
4. K03 scoped RB verdict and contract disposition for deterministic B11 source
   binding CI failure before any runtime-changing batch scales.
5. Actual G bridge/input-complete ref and final I01 checks when integration starts.
6. Current lane owner acknowledgements/reservations for proposed files.
7. Comparable task timing/rework baseline;not needed for safe PREPARE,required
   before claiming throughput improvement.

Next actions are assessment recommendations, not new writer grants:
- A prepares one P3-CB-P01 eligibility/contract/identity packet,without runtime.
- B/RB complete the already assigned K03 review;do not expand it into a batch.
- G/I complete already authorized EFP integration independently.
- Planner approves the exact eligible pilot and reservation after evidence
  arrives. I publishes one final PR per accepted boundary,not role chains.
- Publish a scoped current-control task-index correction through normal
  governance later;do not rewrite old reports or generate an Epoch for this plan.

Keep historical PRs as provenance until supersession/delta disposition is proved;
513 open PRs is no license for bulk closure,merge or reset.
Before any new runtime batch,disposition evidence snapshot applicability so the
next legitimate source change does not repeat K03's deterministic CI blocker.

## 12. Efficiency Measurement

Collect first-review PASS rate with numerator/denominator,repeated failure IDs,
rework cycles,start-to-accepted time,contracts accepted per batch and preflight
elapsed time. Historical missing timestamps remain null.
Compare equivalent risk/contracts,not a security repair against a content batch.
One-preflight-per-stable-scope cache and one final packet reduce administrative
steps;no extra Reviewer layer or extra Agent is proposed. No 2-5x claim is
supported by available data.

## 13. Final Disposition

NEEDS_MORE_INFORMATION.

The hybrid model is appropriate in principle and the planning/retrieval
infrastructure is available off-main. B11 is closed. Capability-map breadth,
exact new pilot identities,accepted-current-main contract binding and live
reservation/policy readiness are not enough to authorize batch implementation.
Proceed with one PREPARE packet rather than announce universal model adoption.
No runtime/full-migration/Phase3 completion is claimed. Ledger111/944,credit0,
Global Gate C NOT_VERIFIED,93 missing images and long-term stability retained.
