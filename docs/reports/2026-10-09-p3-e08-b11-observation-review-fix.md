# B11 Observation Review Fix

Control Epoch: `FD-P3-2026-09-23-08`
Task: `P3-E08-B11-CONTRACT-PARITY`, scoped A tooling / owner-mapping repair.
Claimed status: `AUTOMATION_BASELINE_CANDIDATE`. Readiness remains FAIL; the new premise requires independent review.

## Exact lineage and evidence

- Reviewed prior carrier: `de28753ee243cd82e5a7730a3b0cf07ad031c928`; its failed snapshot is preserved in Git.
- Reviewer B failed premise evidence: `866cce69460c724abad527d810d2ca40fad271c6:docs/reviews/phase3/P3-E08-B11-owner-mapping-de28753-review.json`, verified SHA-256 `24D3A0A1296DF2D3E68887BC8E871E9716AF410D5B8FA161C714C0C9D2350D0D`.
- Runtime candidate now bound: `7ec91bbc26be0f63332d5cc8421b2c7c014906c5`; parent dependency `c0db16ae65699b2e2789c7776c0aa4271b11e496`. Reviewer B explicitly directs rebinding to this narrowly reviewed ownership repair. This A work does not create another runtime acceptance or infer full-combination acceptance from it.
- B-owned dependency merge: `13755f39b3d5650ee92dde421ad7d7412abacdba`. The production compiler/interpreter/helper and runtime tests in that merge are B-owned changes, not A-authored rule edits.
- A implementation / fixture / adapter producer: `7a9699efcca8e16467cd973a7c7dd522e5a230a9`.
- Published minimum contract remains `e65503e601d7a3a4d1265d87a09484cb8295f2c2`.
- Input: `scripts/fixtures/phase3-b11-parity-contract.json`, SHA-256 `CF307202E26222774344F4CA75B7208FFE16020C0097390E30A2D84A346D1AB8`.
- Fixture: `scripts/fixtures/phase3-b11-parity-fixtures.json`, SHA-256 `CA345E013C74B233ABE5A496760C04E0C50E5A4241030608B68843D6163AEAE4`.
- Receipt: `artifacts/phase3-e08-b11-inventory-coverage-parity.json`, SHA-256 `5206C6104277A0344306AE6AE1664EA502CC329DBC4BAADF75BAA44B7DC5E7EB`.
- New review premise SHA-256: `CF2A50939F709D71ECFC29D29AFB626F1BFCFDED787DD49A027E160787C2DB81`.

## Minimal fixes

`impactTarget` now reads the already null-safe conditions list rather than dereferencing the original array. Golden optional target conditions `[null]` produce structured observations with exactEligible=false through both inventory and coverage APIs, without throwing or changing the input. Two direct negative regressions reproduced the TypeError before the fix, then passed after it.

Conversion inventory structural ownership now checks phase/window/envelope and the two ordered effect types, not binding validity. Binding declaration, reference, field/type and destination validity remain in exact validation. Regressions prove unknown/missing/scalar/incorrect typed bindings are owned but exact-ineligible. These are raw-authoring diagnostics, not production routing changes by A.

All ten existing fixture expected maps are preserved, including `conversion-unknown-binding` routeCandidate=true. Only exact canonical-source references are rebound. The same candidate's actual runtime and compiler exports are executed; inventory/coverage share the disclosed read-only authoring diagnostic contract, never another owner's observed boolean or the fixture's expectation. KPI/taxonomy is not changed.

Required observations: 60/60 available, including all 30 A fields and four B-exported structural fields. Missing required observations: 0. API expectation disagreements: 0. For unknown-binding, runtime/inventory ownership=true, runtime/inventory/coverage exact eligibility=false, compiler=REJECT.

Readiness still FAIL with exactly `EXPECTATIONS_NOT_INDEPENDENTLY_REVIEWED`. Actual agreement is not independent acceptance. Old failed fixture reviews are not substituted into the new premise, and no applicability waiver is added.

## Verification

Implementation tested: `7a9699efcca8e16467cd973a7c7dd522e5a230a9` (same bound adapter files in the final evidence carrier).

- `npx vitest run scripts/tests/phase3-b11-diagnostic-api.test.ts`: pre-fix exit 1, 13 pass / 2 fail, both `[null]` cases reproduced TypeError; post-fix exit 0, 20/20 PASS.
- `npx vitest run scripts/tests/phase3-contract-parity.test.ts scripts/tests/phase3-b11-diagnostic-api.test.ts scripts/tests/phase3-b11-observation-gaps.test.ts scripts/tests/phase3-preflight.test.ts`: exit 0, four files / 55 tests PASS. Includes isolated real API execution, adapter/dependency drift negatives and no missing-observation exemption.
- `npm run typecheck`: exit 0.
- `npx tsx scripts/phase3-b11-tooling-inputs.ts --fixtures-only`: exit 0; exact-SHA input generation with fixture/adapter producer above: exit 0.
- `npx tsx scripts/phase3-contract-parity.ts --contract scripts/fixtures/phase3-b11-parity-contract.json --candidate 7ec91bbc26be0f63332d5cc8421b2c7c014906c5 --out artifacts/phase3-e08-b11-inventory-coverage-parity.json`: execution performed; exit 1 solely for independent-review-pending readiness, not a subprocess failure or disagreement.
- `npx vitest run scripts/tests/phase3-e08-b11-coverage-sync.test.ts`: exit 1, historical exact-candidate guard rejects `Candidate source drift: packages/rules/src`; three tests skipped after failed setup. Do not change the old historical acceptance record to suppress this conflict.
- Full CI was not rerun for this narrow fix. Prior frozen `00fa5b4` full CI failed: 187/191 files, 1440 pass / 2 fail / 25 skipped and one RPC timeout. Historical source-binding conflict and concurrency limitations remain open; no full-CI PASS is claimed.
- `git diff --check`: exit 0. Exact parent lookup confirms `7ec91bbc` directly follows `c0db16ae`.
- Read-only comparison against `de28753` confirms all ten fixture expected maps unchanged, exit 0.
- Final receipt regenerated twice byte-identically with SHA-256 `5206C6104277A0344306AE6AE1664EA502CC329DBC4BAADF75BAA44B7DC5E7EB`. Read-only validation independently counts 60/60 required fields and exactly one independent-review-pending issue, exit 0.

## Reviewer handoff

Reviewer A: independently re-review the malformed nested-input repair, read-only ownership/exact separation, exact Git/hash closure and automation evidence. Reviewer B: independently re-review the NEW premise SHA above for both canonical consumers and all ten fixture owner mappings. Neither prior narrow runtime review nor successful API agreement grants this fixture-premise PASS.

Known retained paths: legacy consumers outside this scoped pair are unchanged by A; historical coverage-sync still binds its original candidate and needs a separate compatibility disposition. A did not add, remove or independently certify runtime fallback in this repair.

Not verified: new independent fixture/owner-mapping acceptance, full current-combination CI/readiness, browser effect correctness, global Gate C and promotion. Historical 93 missing-image blockers are retained, not freshly recounted. Main coverage / migration / denominator deltas are all 0; promotedOnMain=false. No runtime, authoring, KPI or Gate repair was authored by A.
