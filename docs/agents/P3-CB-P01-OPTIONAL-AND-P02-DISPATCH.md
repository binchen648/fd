# P01 Optional Conformance And P02 Incremental Batch Dispatch

Date: 2026-10-14
Owner: Planner / Process Controller
Control Epoch: FD-P3-2026-09-23-09
Observed main: `a42b5e1c517141b90f3407773958b0d8afe63264`
Status: READ_ONLY_SCREENING_AUTHORIZED; PRODUCTION_WRITES_NOT_AUTHORIZED

## Decision And Precedence

The user approved parallel incremental screening without waiting for P01.
This decision supersedes the ordering, not the historical evidence, in
`P3-CB-P01-ZERO-INCREMENT-DECISION.md`: P01 conformance is OPTIONAL and is
NOT a prerequisite for P02 selection, Lead Builder initialization, or coding.
No new Control Epoch, policy waiver, runtime acceptance or credit is created.
Main accounting remains 111/944. Historical recovery acceptance and material
presence do not grant current-main credit.

## P01: Minimum Optional Scope

PREPARE candidate `e6534b89eba39891d1ff610cec0f9afab6c0bdad` has a scoped
Reviewer A PASS at `da34fa390e741000bfc269c6e354a214e2232ea2`, artifact
`docs/reviews/phase3/P3-CB-P01-A-e6534b89-reviewer-a.json`.
That artifact accepts PREPARE/provenance/preflight only, not conformance.

Existing B may take one test-only task, `P3-CB-P01-B-CONFORMANCE-OPTIONAL`,
after accepting a literal test-file reservation. Proposed single file:
`packages/rules/tests/regression/cb-p01-command-spell-conformance.test.ts`.
No test writer reservation is granted by this document.

- Two controls only: `master.gatou.command-spell#command-spell.gain-mana`
  and `master.olga-marie.command-spell#command-spell.gain-mana`.
- Verify real current-main definitions, legal action-window invocation,
  mana +4, command seal -1, other-player isolation and typed result evidence.
- Include insufficient seals, illegal phase and missing/stale revision atomic
  rejection at the authoritative boundary; rejected state/revision must match.
- Keep other command-spell clauses outside acceptance. No synthetic replacement
  definitions, runtime edits, production mutation overlay, browser rebuild,
  source-assets repair, or full-CI campaign merely for this optional check.
- One focused receipt packet and one existing RB scoped review; reuse the
  accepted PREPARE instead of another A/RA preparation loop. No standalone
  role PR or automatic promotion. Zero migration/denominator credit.
- A failure is an incident for the affected contract, not an automatic mandate
  to restart P02 if its separate game-start contract is unaffected.

## P02: First Incremental Candidate Batch

Task: `P3-CB-P02`.
Capability: GAME_START_FIXED_CONTROLLER_SET_MANA.
Class: AUTHORING_ONLY / CONTENT_REGISTRATION, pending feasibility confirmation.
Risk: MEDIUM; no session, trigger engine, or shared runtime implementation.

| Frozen identity | Whole printed clause | Main material | Main accepted-111 membership |
| --- | --- | --- | --- |
| master.iliya.skill.s1 | Initial mana is 6 | Authoring exists; generated registry absent | ABSENT |
| master.taiga.skill.s1 | Initial mana is 3 | Authoring exists; generated registry absent | ABSENT |

These are unaccepted on the official main ledger, NOT never-authored cards.
Expected benefit is production registration and fresh current-main acceptance
for two complete identities, not new implementation of their numeric effect.
Potential main increment is +2 ONLY after independent identity acceptance,
promotion and post-merge accounting; never granted by this selection.

Evidence read directly at the observed main:

- `data/phase3/full-roster-ability-inventory.json`: exact full text, canonical
  identities and clause hashes for both rows.
- `artifacts/phase3-e04-current-main-accepted-111-execution-matrix.json`:
  neither canonicalIdentityId is in its frozen 111 rows. This is a historical
  ledger baseline, not proof that its old execution diagnoses remain current.
- `data/authoring/masters/master.iliya.json` and `master.taiga.json`:
  one automatic forced game_start trigger with fixed controller set_mana 6/3.
- `data/packs/fd-playtest-v1/pack.json` and
  `data/generated/fd-playtest-v1.content-library.json`: neither identity is
  registered in the generated production library.
- `packages/rules/src/ability/interpreter.ts`:
  `isGameStartFixedControllerManaSetSemantic` currently exists, as do its
  fixed-controller primitive and regression tests.
- `docs/reports/2026-09-18-p3-a-r51-fb2-25-acceptance-synchronization.md`
  and `2026-09-18-p3-a-r52-initial-mana-acceptance-synchronization.md`:
  historical scoped contracts and recovery-line +2, NOT main acceptance.
- `packages/rules/tests/fb2-25-initial-mana-consumer-migration.test.ts`:
  existing archive tests deliberately assert exclusion from the playtest pack.
  Updating that expectation requires an explicit current registration contract;
  its existence does not prove production game-start execution.

Do NOT add Shirou solely because his text also says initial mana. R51 explicitly
excluded that row on lifecycle/modifier grounds. Do NOT add Zouken or Tiamat;
their complete skills introduce additional semantic clauses.

## P02-A: Execute Now, Read-Only Screening

Owner: existing Codex A. Task: `P3-CB-P02-A-PREPARE`.
Use a clean worktree from the exact observed main, not a recovery branch.
Suggested branch `codex/a-p3-cb-p02-prepare`. Bind actual branch/worktree in
the packet and acknowledge the three-output reservation before writing.

One bounded pass must return ALL readiness gaps together:

1. Recheck live main, ledger membership, frozen full-text/clauses and generated
   registration. Distinguish absent material, archived-only material and credit.
2. Bind R51/R52 exact source proofs and current compiler/interpreter blobs.
   Determine whether the historical contract remains applicable. No inherited
   PASS merely because a report or predicate is present.
3. Determine a production registration path using EXISTING content contracts.
   Single-card archives are NOT automatically valid master_support archives
   (outside_game is mandatory) or mixed master_rule archives (ordinary plus
   outside_game cards are mandatory). Never invent placeholder cards or mark
   initial abilities outside_game to satisfy these shapes.
4. Establish how the actual production initialization instantiates the source
   and executes game_start for these owners. Direct loadAuthoringJson plus a
   manually inserted card is insufficient final production proof.
5. If existing playable-master registration is needed, identify its exact
   metadata/product surface and whether it pulls in other skills. Do not widen
   the batch to the complete master roster/UI without separate user decision.
6. Produce an exact proposed source/test/generated path list, writer conflict
   check, per-identity acceptance matrix and ready/blocked reasons. Generated
   outputs must come from existing generators, not manual patches.
7. Run Historical Failure Preflight once using the actual task metadata; bind
   receipt/source refs and carry applicable negatives into the same packet.
   It is a reusable startup check, NOT an additional independent review gate.
   NO_MATCH is unknown risk, not acceptance; invalid/unavailable proof remains
   visible. Cache until relevant scope or source changes.

No source changes, broad tests, package installation, runtime locks or PRs
are authorized in this screening. Read-only source inspection and retrieval
may run beside P01. A may prepare a scratch structured input outside the
tracked tree for the preflight CLI and embed its bytes in the receipt.

If this pair cannot reach production without shared runtime changes, classify
P02 as BLOCKED_NO_RUNTIME_FREE_PATH. In the SAME packet, propose one alternative
2-4-identity batch from Card Action or Skill Normalization, with exact full
clauses, ledger subtraction and one mature contract. No padded identities,
partial-skill credit, mixed PLAY/ADD_TO_ATTACK/ACTIVATE/CLOSE contracts or
automatic runtime expansion. The inventory's old READY counts are hints only.

## Owners, Dependencies And Earliest Coding

| Lane | Owner | Work | Waits for |
| --- | --- | --- | --- |
| P01 optional | Existing B -> RB | One test-only conformance | Exact test reservation; does not block P02 |
| P02 PREPARE | Existing A | Sources, production-registration feasibility, one packet | Evidence reservation acknowledgement only |
| P02 evidence review | Existing RA | Exact identities, source/contract/path bindings | P02 packet; one review, no separate preflight approval |
| P02 implementation | Existing B/S acting as Lead Builder | Approved content/tests, no shared runtime | Conditions below; no dependency on P01 |
| P02 contract/identity review | Existing RB | Shared contract once plus two identity rows and negatives | Frozen implementation |
| P02 evidence/finalization | A -> RA | One consolidated sync and exact references | Scoped RB verdict and final carrier |
| P02 promotion | Existing I | One final promotion PR and main drift check | Accepted final packet and existing governance policy |

Lead Builder can begin as soon as ALL five conditions are recorded:

1. Exact live main is bound; if changed, a verified relevant-source drift check
   or new binding is supplied. Ordinary evidence/control drift is not an
   automatic full technical re-review.
2. Two complete, distinct frozen identities remain outside main credited set;
   applicable current-main contract and runtime-free registration are proven.
3. PREPARE scope/provenance accepted by RA; Planner confirms the exact batch
   and literal implementation paths. Unresolved contract conflict goes to RB,
   not to A inventing a semantics waiver.
4. Named Lead branch/worktree and exact content/test reservation are granted
   and acknowledged with no overlapping active writer. This dispatch grants
   evidence outputs only, NOT a global lock or prospective production writer.
5. Actual Historical Preflight receipt is valid and required applicable
   negative tests are assigned in the implementation packet. No new approval
   just for the lookup. Any unrelated P01 progress is irrelevant.

Initialization needs a fresh task context, not a new organizational role or
agent. Reuse current B/S capacity. No changes to packages/rules/src, server,
client authority, primitive semantics, coverage classifier/KPI or policy.
If any is required, stop and return the combined blocker list.

## Acceptance And Next Sync

P02 expected acceptance: two entire initial-mana skills, production generated
registry plus real initialization/execution, typed outcome, other-player
isolation, same-value/replayed-event behavior, invalid/over-cap atomic rejection
and no hidden legacy fallback. Shared contract is reviewed once; every identity
retains a distinct source/positive/negative/result/reviewer matrix row.
Readiness and credit are separate; no Global Gate C or Release claim.
93 missing images remain a Release blocker, not secretly deleted or waived.

Next sync: P02-A returns its single readiness/feasibility packet, or live-main
change affecting selected content/runtime occurs. P01 completion is NOT a sync
prerequisite. PR #561 is a separate pending K03 promotion, not a P02 dependency.
Planner productionWriteAuthorized=false; Lead reservation=NOT_GRANTED.
