# P3-EFP-K01 Evidence Handoff

Control Epoch: FD-P3-2026-09-23-09.
Dispatch/base: 3ab115927eaf7c104fab9064d71ceebdac870da1 on
codex/planner-p3-e08-environment-recovery.
Observed main: 1d0e102c1ff43c272dc5ccfb2871eda48a5f52ce.
Role: Codex A, Coverage / Evidence. Knowledge Review: PENDING_REVIEWER_A.
Status: DOCUMENTATION_EVIDENCE_CANDIDATE; no runtime acceptance or promotion.

## Scope And Reproduction

Only docs/engineering/lessons/** changed. Planner's task reserves this bounded
documentation scope; isolated checkout was clean. B11 temporal carrier
1ce0b406ecf1e7389886bd2962e9e28f0d7d444b was already frozen and handed off.
No competing B11 write, runtime fix, npm install, runtime suite, CI or browser
execution is performed. Primary dirty worktree remains untouched.

`node docs/engineering/lessons/verify-k01.mjs` generates K01-SOURCE-AUDIT.json.
`node docs/engineering/lessons/verify-k01.mjs --validate` compares exact output;
no timestamp or HEAD-derived evidence identity is included. Full source commit,
path, raw-byte SHA-256, blob, review identity, static file existence, named test
selectors and main ancestry are reconstructed from Git. The tool fails on source
hash drift, invalid review identity, historical/current identity conflation or
stale generated output. This is a provenance audit, NOT test execution or the
K02 retrieval CLI. No audit result upgrades draft lessons to accepted.

The audit's catalogSha256 and auditToolSha256 bind the inputs. Carrier SHA and
audit/report hashes are reported externally to avoid self-referential claims.
Reviewer A independently judges factual extraction, not gameplay semantics.

## Verification Commands

- `node docs/engineering/lessons/verify-k01.mjs`: generation and all selected
  raw-Git source/review identities verified; six case rows, five preserved seeds.
- `node docs/engineering/lessons/verify-k01.mjs --validate`: exact recomputation
  of committed output, no timestamp or execution-HEAD dependence.
- `node docs/engineering/lessons/verify-k01.mjs --unknown`: expected exit1,
  unsupported argument rejected; this is an audit CLI boundary, not a runtime test.
- `git diff --check`: whitespace validation only. Final carrier source scope and
  remote identity are checked separately at handoff.

No Vitest, Playwright, npm ci/typecheck/full CI, runtime probes or source-assets
verification was executed. Negative runtime test gaps remain as described; the
audit's generic corrupted-source guards are not advertised as a new unit-tested
K02 CLI. Knowledge acceptance stays pending despite successful provenance checks.

## Source And Regression Gap Matrix

| Case | Primary source commit / exact reviewed identity | Accepted scope or failure | Historical regression / probe | Current-main footprint and next owner |
| --- | --- | --- | --- | --- |
| FD-SEC-001 | cf179ca3 / reviewed carrier463facb1, tested9a4f4c6 | FAILED: actual credential leakage and identity impersonation | Named enforcing negatives at0f62210; RB4d5b76be scoped closure; no K01 execution | Files exist but new named server negatives absent; repaired candidate not main ancestor. Reuse B11/RB input; Planner confirms released lane before any B work |
| FD-REV-002 | cf179ca3 / reviewed carrier463facb1, tested9a4f4c6 | FAILED: raw WS end_turn omission mutated revision/log/version | Named direct-Hub and raw-WS negatives at0f62210; scoped closure only | Old stale server case is not the full omission/invalid matrix. Current dynamic behavior NOT_VERIFIED; no duplicate B repair |
| FD-SHAPE-003 | b22691ab /4dd8eca5 | FAILED technical: four malformed compiled containers activate privileged reward | Seven existing historical tests lack that rejection matrix; reviewer probe expects defect, not prevention | Historical gateway and test path absent on main; differently named test is present, no contract equivalence proved. Planner/current runtime owner first clarifies applicability |
| FD-RESTORE-004 |7e65291a /fe4653d1 | FAILED technical: actual sc3 legal nested response/choice cannot restore | Ordinary completion test exists; no enforcing nested-pause test. Probe reproduces defect | Main archive lacks actual sc3 and interpreter lacks named transaction. Do not transplant old-stack tests; Planner/current runtime owner clarifies contract |
| FD-EVID-005 | dbd430be /b5e68444; preserved failure cfa6a925 separately | PASS only on later exact closure candidate, not earlier failed carrier or final assembly | Existing evidence suites and RA focused88; producer CI receipt not independently rerun by RA | Listed tests absent on observed main. B11 lane already owns candidate verification; K01 records UNKNOWN hook/RPC root cause |
| FD-FIXTURE-006 | A carrier1ce0b406; failure487ab81, not an independent review SHA | Original I exit1 bytes verified; A repair candidate is not accepted by this task | Fixed pre-review fixture and explicit assembled regressions atf1b3588b; both-stage95/1607 are A-bound receipts only | Test/preflight paths absent on main. Existing A/RA/G/I temporal lane continues; no new repair task or credit |

All five original primary hashes match the dispatch catalog. K01 adds only one
evidence-supported draft. Security/revision share one source artifact but expose
different invariants, so are not duplicate evidence counted as independent runs.
Every test existence and static selector is pinned by exact SHA in the audit.
NONE of five historical repair/test candidates is an ancestor of observed main.
No main inclusion or dynamic success is inferred from filenames or summaries.

## Corrections To The Seed Drafts

- FD-EVID-005's source artifact reviewedSha is b5e68444; cfa6a925 is preserved
  failureSha. Catalog now records both, preserving the original verdicts.
- PR474 exact test path is regression/p3-stheno-full-reward-each-readiness-capability.test.ts,
  not the later fb2-34 path. PR475 exact owner test is
  regression/p3-owner-stheno-complete-migration.test.ts, not the later Stheno path.
- MISSING historical negative does not mean every test file is missing. Reviewer
  probes at review commits are not located at runtime candidates and do not
  enforce repaired behavior in CI.
- RB repair browser15 and full-CI exit1 are inspected receipts, not independently
  reexecuted results. Rules46/server16 are the scoped independent results at
  source-equivalent88dcd441. Production/browser start is trusted fixture, not
  natural seven-seat progression acceptance.
- The full cause of cfa6a925 hook/RPC failure remains UNKNOWN. The deterministic
  later producer/assembly lifecycle cause has separate FD-FIXTURE-006 evidence.

## Remaining Candidate Triage

| Candidate | Decision | Evidence boundary |
| --- | --- | --- |
| FD-FIXTURE-006 | Draft added | Exact original I receipt index/streams sealed in1ce0b406, failing487 source and6ea diagnosis bound |
| FD-SHA-007 | UNKNOWN, not added |27dab records a missing explicit review-reference contract, not a wrong candidate/reviewer identity; cannot rename that into a SHA failure |
| FD-FALLBACK-008 | UNKNOWN, not added | No selected pinned failing source. Later CLOSED claims do not establish what failed previously |
| FD-REVIEW-009 | UNKNOWN, not added | PR475 separately attributes historical relay and new independent review; no proved conflation occurrence |
| FD-WRITER-010 | UNKNOWN, not added | Reservation says prospective grant with unfilled owner binding and limited snapshot; no observed competing writer. Domain stays retained, not FREE |

No broad history scan, invented root cause, candidate count quota or additional
case ID. No false zero for missing evidence or measured speedup. Retrieval CLI
is NOT_IMPLEMENTED; this focused audit is not its implementation.

## Acceptance And Next Step

Six source-backed drafts plus four explicit UNKNOWN candidates form one K01
carrier. All knowledgeReview states remain PENDING. No K01 runtime tests or
full CI ran; lack of execution is intentional authorization scope, not PASS.
93 MISSING_IMAGE, Global Gate C and existing runtime reservations remain; ledger
111/944, main/migration/denominator deltas0. No role-level PR, Gate or promotion.

Next: Reviewer A read-only exact carrier/hash/source extraction review. Only
after that scoped knowledge verdict and confirmation of K02's separate write
reservation may Planner activate the retrieval CLI implementation. K03 remains
test task cards plus runtime owner applicability decision, not automatic batch
repair of historical mechanisms. No B11 writer or task is re-opened by K01.
