# A3 MatchSession Disposition - Latest Verification 2026-10-09

- Task: `P3-E08-RP-00-A3-RECONCILIATION`
- Control Epoch: `FD-P3-2026-09-23-08`
- Overall status: `REVIEW_RECONCILIATION_REQUIRED`; not READY_FOR_REVIEW.
- Pinned source main: `fefcf4f7f5bd66ed7693889fb99391e6e7321016`.
- Tested implementation: `482d54bde108ffd54015a025044f58eccd8d722f`.
- Carrier SHA is returned externally after the evidence commit.

## Authorization and writer check

Planner authorization:
`ca6d57b0c44c944e2e3d99d3bf74fed297c0d1a7:docs/agents/P3-E08-A3-MATCHSESSION-TIMEOUT-DISPOSITION.md`.
This grants Codex A a writer reservation for the single named MatchSession test.

The Epoch 08 dispatch/reservation search found no competing reservation. Before
editing, git status for this exact path was checked in 111 accessible registered
worktrees; none had an uncommitted change to this path. This is a local-visible
conflict check, not a claim to know all agents' liveness.

The only test edit since carrier `31e69e6...` changes the invocation budget
of `authenticates gameplay-affecting MatchSession fields outside GameState`
from default 5000ms to local 15000ms. The seed, maxRounds=1 simulation, both
snapshot tampering cases, restoration errors and every assertion are unchanged.
No global timeout, worker setting, runtime semantics or other test is modified.

## Both independent Reviewer artifacts preserved

1. Original FAIL: `d5436b77b269db2119f702a54ba7fa61ef4ad1fb`.
   Path: `docs/reviews/phase3/P3-E08-RP-00-A3-RECONCILIATION-reviewer-a.json`.
   SHA-256: `61197DB8CF817ADEE43959DE566F6937B0F3CEE16B5A2E13AEA19077C2753D74`.
   Reviewed carrier: `caeebdd52f8d420b179e464bdd07e4d50f378a4b`.
2. Scoped recount PASS, overall reconciliation still required:
   `3e8af685e11a4fffaebb1cf2bcc1cfd2db14dd63`.
   Path: `docs/reviews/phase3/P3-E08-RP-00-A3-scoped-repair-reviewer-a.json`.
   SHA-256: `4E937FB9F7AD814EE8C71F4FE9BB18056DFD2ED0247EFB59EF8099CD6053F673`.
   Reviewed carrier: `31e69e6251a443cd33cde29f3e2f48a82039dc55`.
   Thread: https://github.com/binchen648/fd/pull/545#issuecomment-6071767065

The scoped artifact's raw Git blob hash and direct-parent binding were verified.
Both original JSON objects are retained under reviewerHistory. Previous local
validation records, including the 6669ms MatchSession failure, remain unchanged
under validationHistory. No old PASS is inherited by this carrier.

## Fresh verification on the tested implementation

| Command | Exit | Actual result |
| --- | ---: | --- |
| npx vitest run packages/rules/tests/match-session.test.ts scripts/tests/phase3-e06-post-merge-recount.test.ts | 0 | 2 files / 33 tests PASS; 14.54s |
| npm run typecheck | 0 | PASS |
| npm run test:ci | 1 | 183/184 files, 1411/1412 tests; 30.93s |
| git diff --check 31e69e6251a443cd33cde29f3e2f48a82039dc55..HEAD | 0 | PASS; repeated for final carrier |

Focused authentication: 2381ms; recount recalculation: 2160ms.
Default full CI: MatchSession 30/30, authentication 6799ms; recount 3/3,
recalculation 8336ms and shallow recovery 6279ms. All scoped assertions passed.

The only full-CI failure is a newly observed timeout in the unchanged
`scripts/tests/phase3-reference-lock.test.ts:61`:
`verifies repository, exact commit, clean checkout, required files, and SHA-256 digests`.
Elapsed 5179ms, default budget 5000ms. This is not an assertion/semantic failure
and does not establish absence of performance regressions. The path is outside
this additional authorization; no fix or repeated full CI to select a PASS was
attempted. Planner must dispose it before overall reconciliation acceptance.

## Exact-input evidence reused, not rerun

Content validation and generated-content determinism reference their actual
PASS runs on `98b58ec22ad8140d940c65170f9e0d3e9a8f3919`, captured by carrier
`31e69e6251a443cd33cde29f3e2f48a82039dc55`. They are not fresh runs.
Git objects for authoring, packs, content source, runtime source and classifier
were compared between that implementation and this implementation and match.
The recount test independently recompiled the executable pack and recomputed
the complete coverage object in both fresh focused and full-suite runs.

- Current recount: `artifacts/phase3-e06-a-post-merge-setup-create-to-skill-recount.json`
- Current SHA-256: `132329CFF17D9BF428BECEDD8CFC17B22E78CDE1A7045C84F5D21D636F8E2CCB`
- Coverage SHA-256 (unchanged):
  `8683CF3C41E62703593CA5508A04544A02BBF7E3EB972371073FDCAE1A16C045`

Raw coverage remains 22/144/3/0/112 and three exact setup consumers.
Canonical accounting stays the retained 111/944, remaining 833.
All migration, coverage and denominator credit deltas are 0.

93 historical MISSING_IMAGE blockers, Gate C NOT_VERIFIED and long-term
stability NOT_VERIFIED remain. No GitHub final-head checks, promotion,
overall Reviewer PASS, new PR or merge are claimed.
Reviewer A can inspect the scoped fix; Codex I must still wait for overall
acceptance before updating the sole final A3 PR #545.

## Earlier revision records (historical, not current readiness)

The following sections preserve earlier evidence and their then-current
dispositions. The current binding/status is the latest section above.

## A3 Reconciliation Revision - 2026-10-09 (earlier)

- Task: `P3-E08-RP-00-A3-RECONCILIATION`
- Control Epoch: `FD-P3-2026-09-23-08`
- Timezone: Asia/Shanghai
- Overall status: `REVIEW_RECONCILIATION_REQUIRED`
- Scoped repair: `RECOUNT_TEST_PASS_FULL_CI_BLOCKED`
- Pinned base remains `fefcf4f7f5bd66ed7693889fb99391e6e7321016`.
- Tested repair implementation: `98b58ec22ad8140d940c65170f9e0d3e9a8f3919`.
- Evidence carrier is returned externally after commit, with no self-reference.

## Reviewer FAIL preserved and bound

Reviewer A reviewed carrier `caeebdd52f8d420b179e464bdd07e4d50f378a4b`.
Review commit: `d5436b77b269db2119f702a54ba7fa61ef4ad1fb`, whose direct
parent is that reviewed carrier. Artifact at that commit:
`docs/reviews/phase3/P3-E08-RP-00-A3-RECONCILIATION-reviewer-a.json`.
SHA-256: `61197DB8CF817ADEE43959DE566F6937B0F3CEE16B5A2E13AEA19077C2753D74`.
Reviewer: github:binchen648. Verdict: FAIL.
Thread: https://github.com/binchen648/fd/pull/545#issuecomment-6071641331

The immutable review JSON was read and its hash and direct parent verified.
Its evidence is retained in the recount's reviewerHistory. The Oct 8 local PASS
remains in validationHistory; it is not rewritten to imply independent acceptance.
Reviewer full CI was 182/184 files and 1410/1412 tests, with two 5000ms timeouts:
new recount recalculation and inherited MatchSession:313.

## Minimal repair and measured result

Only the new async recount recalculation test's local timeout changed from the
default 5000ms to 15000ms. Compiler, full-object, SHA-256, identity and ancestry
assertions are byte-for-byte unchanged. No global timeout or other test changed.
The earlier shallow recovery test retains its existing 15000ms budget.

On fresh default full CI, the recount recalculation took 7700ms and passed;
shallow recovery took 5553ms and passed. This demonstrates the previous 5000ms
budget was insufficient under full-suite contention; it does not prove
long-term stability or guarantee GitHub required checks.

| Fresh command at tested repair implementation | Exit | Result |
| --- | ---: | --- |
| npx vitest run scripts/tests/phase3-e06-post-merge-recount.test.ts | 0 | 1 file / 3 tests PASS |
| npm run typecheck | 0 | PASS |
| npm run content:validate | 0 | 7 masters / 7 servants / 20 events; blocking=0 |
| npm run verify:generated-content | 0 | PASS; same three generated hashes |
| npm run test:ci | 1 | 183/184 files, 1411/1412 tests; 31.49s |
| git diff --check caeebdd52f8d420b179e464bdd07e4d50f378a4b..HEAD | 0 | PASS |

The only fresh full-CI failure is unchanged
`packages/rules/tests/match-session.test.ts:313`:
`authenticates gameplay-affecting MatchSession fields outside GameState`,
6669ms elapsed against the default 5000ms timeout. This path was not edited.
Planner must separately dispose this inherited failure; no unrelated timeout,
global configuration, retries to select a PASS, or runtime repair was imported.

## Current evidence binding and boundaries

- Recount: `artifacts/phase3-e06-a-post-merge-setup-create-to-skill-recount.json`
- Current SHA-256: `8C5C020E6EB46E3E1B801959E5DD926D18ED412065F7DDE427F2CD203A748D44`
- Coverage: `artifacts/phase3-skill-coverage.json` (unchanged)
- Coverage SHA-256: `8683CF3C41E62703593CA5508A04544A02BBF7E3EB972371073FDCAE1A16C045`

Independent classifier/compiler full-object recomputation passed in both focused
and default full CI. Coverage remains 22/144/3/0/112, with exactly three setup
consumers. All coverage/migration/denominator deltas are zero. Runtime, authoring,
taxonomy, workflow and coverage artifact are unchanged by this review repair.

93 historical missing-image blockers remain recorded, not freshly reaudited.
Gate C and final Promotion HEAD GitHub required checks remain NOT_VERIFIED.
No new acceptance, promotion, PR, merge or credit is granted.
Reviewer A may review the scoped repair's exact carrier; overall A3 assembly
remains blocked pending Planner disposition and successful reconciliation.

## Historical Oct 8 record (not current readiness)

Everything below is the original local verification record from the rejected
carrier. Its READY_FOR_REVIEW and PASS statements are historical only, superseded
by the Reviewer FAIL and current full-CI failure above. In particular, the old
artifact hash below is not the current artifact binding.

### Original Epoch 08 A3 Reconciliation

- Task: `P3-E08-RP-00-A3-RECONCILIATION`
- Control Epoch: `FD-P3-2026-09-23-08`
- Owner: Codex A (Automation / Coverage / Evidence)
- Status: `READY_FOR_REVIEW`; independent review NOT_STARTED.
- Base / immutable reconciliation observed main: `fefcf4f7f5bd66ed7693889fb99391e6e7321016`
- Tested implementation commit: `43916d3f7b6e7384d7c1e98875881c99992ab467`
- Branch: `codex/a-p3-e08-rp00-a3-reconciliation`
- Final evidence carrier SHA is returned externally after commit; no self-reference.

## Exact inputs and anchors

Planner dispatch: `b6d785669f7a6853cbb365ba1421a77936fc8ffd:docs/agents/P3-E08-A3-RECONCILIATION-RESUME.md`.
Historical A3 source: `b6375c4889009497e7dd9c98e83c1d2ce0da10d9`.
Historical evidence-contract review: `5e8f83211cde8dbf7aec29cd9a9d896ef027b260`.
These are provenance, not acceptance of this fresh carrier.

The original observed-main anchor remains
`a7751c3fa51895fd3a401721b1e926b90e016862` (PR #536).
Runtime candidate `30be3b74258c817ede1cb857ace947505b62d8ed` and promotion head
`119b8f33e9d59691996a5d03a8dc7589fc816a61` remain verified historical ancestors.
No equality with moving `origin/main` is asserted. Compatibility belongs to
Promotion preflight/policy (`CONTROL_ONLY_DRIFT`).

CI-01 PR #554 merged as `fefcf4f7f5bd66ed7693889fb99391e6e7321016`.
CI-01 post-merge sync `e8147eed9ab98ac3a61520877bf33f2c08d53c19` is provenance.
Its terminal PASS is user-supplied and recorded by Planner; no new immutable
Reviewer artifact is claimed. Its GitHub checks do not substitute for fresh checks.

## Machine evidence

- Recount: `artifacts/phase3-e06-a-post-merge-setup-create-to-skill-recount.json`
- SHA-256: `FDFD723B55783AC4287888DC16545F57E89D873ADFB5909CDDAC5A581832A80A`
- Coverage: `artifacts/phase3-skill-coverage.json`
- SHA-256: `8683CF3C41E62703593CA5508A04544A02BBF7E3EB972371073FDCAE1A16C045`
- Source fingerprint: `7239686f1a799c82029d383962a6674363eb1eb20b6ba399ed988f466e0a2fd0`
- Coverage timestamp: `2026-10-08T08:22:09.673Z`

The recount retains the historical coverage hash and failed validation in
`historicalEvidence`; the active coverage binding refers to fresh bytes.
The test independently regenerates the classifier projection at the bound
timestamp and compiles the real executable pack, comparing the entire coverage
object including compiled definition hash. It also hashes the bound Reviewer B,
Reviewer A binding and Governance artifacts.

## Independent recount

127 archives / 169 cards / 281 abilities. Compiled: 76 cards / 14 characters,
0 blocking issues.

| Counter | Before | After | Delta |
| --- | ---: | ---: | ---: |
| new runtime semantic routed | 22 | 22 | 0 |
| legacy resolveEffect | 144 | 144 | 0 |
| legacy executeAbility | 3 | 3 | 0 |
| dual | 0 | 0 | 0 |
| not classifiable | 112 | 112 | 0 |

The coverage tool's default internal counters are not reconciliation deltas.
The reconciliation record binds before/after explicitly; it does not grant
the tool's historical/default +22 counter as new credit.

Exactly these three double-key consumers map to
`SETUP_CARD_CREATION_MINIMAL:CREATE_TO_SKILL`:

| Card | Ability | Current classification |
| --- | --- | --- |
| master.maiya.skill.military | military.has-support-shot | NEW_RUNTIME_SEMANTIC_ROUTED |
| master.olga-marie.skill.astronomical-science | astronomical-science.has-chaldeas | NEW_RUNTIME_SEMANTIC_ROUTED |
| master.shinji.skill.useless-person | useless-person.setup | NEW_RUNTIME_SEMANTIC_ROUTED |

Authoring, pack, content source, runtime source and classifier Git objects are
identical between the historical observed main and the reconciliation main.
Tests also assert these objects match the carrier lineage.
Legacy fallback remains CLOSED_EXACT_ARTIFACT_BOUND from the existing exact
runtime review; this is not a new runtime acceptance.

Formal canonical accounting remains the previously accepted 111/944,
remaining 833, duplicates 0. This task does not re-enumerate or re-award that
identity list. Coverage, migration and denominator credit deltas are all 0.
The historical runtimePromotionDelta=3 is preserved as historical fact;
this reconciliation runtimePromotionDelta=0.

## Historical failures retained

Original A3 full CI: 183 files passed / 1 failed, 1410 tests passed / 1 failed;
complex-skills-regression.test.ts:1547 timed out at 5000ms.
Isolated historical evidence was 37/37 PASS. These entries were not rewritten.

Pre-authorization restore also failed 0/2: obsolete coverage hash and missing
full-history workflow. The initial fresh comparison failed 2/3 because the
classifier-only helper does not include CLI compiledDefinitions. The repair
adds independent compilation and full-object equality, without dropping checks.
Both development diagnostics remain machine-readable in the recount.

## Fresh verification

All successful task checks below bind implementation
`43916d3f7b6e7384d7c1e98875881c99992ab467`, except dependency installation and coverage generation
which ran against the same source objects at pinned base `fefcf4f...`.
Final carrier changes only this recount and this report after validation.

| Command | Exit | Actual result |
| --- | ---: | --- |
| npm ci | 0 | 239 packages added; npm audit reports 12 vulnerabilities |
| npm run phase3:coverage | 0 | 127/169/281; 22/144/3/0/112; compilation blocking=0 |
| npx vitest run scripts/tests/phase3-e06-post-merge-recount.test.ts | 0 | 1 file / 3 tests PASS |
| npm run typecheck | 0 | PASS |
| npm run content:validate | 0 | 7 masters / 7 servants / 20 events; blocking=0 |
| npm run verify:generated-content | 0 | all three generated hashes match |
| npm run test:ci | 0 | 184 files / 1412 tests PASS; default command; 23.72s |
| git diff --check | 0 | PASS before evidence carrier; repeated on final carrier |

During full CI the recount tests passed, including shallow recovery (3732ms)
and independent classifier/compiler verification (3990ms). MatchSession was
30/30 PASS; complex-skills regression was 37/37 PASS. No unrelated timeout or
runtime edit was made.

## Scope and retained gates

Exactly five paths: Test workflow checkout input, recount artifact, coverage
artifact, recount test and this new report. The old A3 report is untouched.
The workflow change is only `with: fetch-depth: 0`. The shallow failure,
unshallow recovery, historical commit existence and ancestry checks remain.
No moving remote ref or network fetch is needed by the recount assertion.

93 historical MISSING_IMAGE blockers remain recorded, not freshly reaudited.
Default content validation PASS is not required source-assets validation PASS.
npm ci reports 12 dependency vulnerabilities (1 low, 4 moderate, 5 high,
2 critical); no dependency upgrade was authorized.
Gate C, long-term CI stability and final Promotion HEAD GitHub checks remain
NOT_VERIFIED. Phase 3, full roster, Release Gate and new acceptance are not claimed.

## Handoff

Reviewer A must review this fresh exact carrier, including checkout history,
hash binding, independent recount and writer scope. Codex I owns the sole A3
promotion destination PR #545 and must inspect its latest exact HEAD before
assembly. No new PR was created, no merge performed, no credit granted.
