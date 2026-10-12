# B11 Inventory / Coverage Observation Completion

Historical snapshot: `de28753ee243cd82e5a7730a3b0cf07ad031c928`. Read the original receipt from that commit when verifying the hashes below. Current review-fix bindings are in `2026-10-09-p3-e08-b11-observation-review-fix.md`; this historical report does not describe the moving receipt at HEAD.

Control Epoch: `FD-P3-2026-09-23-08`
Scope: user-authorized read-only completion of 30 inventory/coverage observations and integration of the B-owned exported API. Claimed status: `AUTOMATION_BASELINE_CANDIDATE`; readiness: `FAIL`. No Review, Gate, migration or promotion acceptance is granted.

## Exact bindings

- Runtime API candidate: `c0db16ae65699b2e2789c7776c0aa4271b11e496`.
- Candidate parent / previous combination: `9eaa0e0c417486adf7b0449e3d32fb90b7d362f9`.
- B dependency integration merge: `92f8604` (B-owned exported predicate and its tests/manifests; not an A-authored runtime change).
- Fixture producer: `ac4d401a9905384d35f0aee7f2474e3072ed75c6`.
- Adapter producer: `dbc1b75aaf40253982fc4e458b80dce4043b9224`.
- Contract publication: `e65503e601d7a3a4d1265d87a09484cb8295f2c2`.
- Contract input: `scripts/fixtures/phase3-b11-parity-contract.json`, SHA-256 `6C3EDC8C31E6273B1254581DB8596E6481A83B5B40B535A9DA1D7C2E1ECD45FD`.
- Fixture: `scripts/fixtures/phase3-b11-parity-fixtures.json`, SHA-256 `B7DE0808C98DE132E15078E698EC9A5CE1515521A01B93521D283A30311B161B`.
- Receipt: `artifacts/phase3-e08-b11-inventory-coverage-parity.json`, SHA-256 `D5E6B0C2F739F3D060555E0223D8738AE1470DF78E399F6E5E78BD732C0E2691`.
- New independent-review premise: `2540B370B8A55EEEC68810CF9B1A98826CE35290F00A6D4F17B1261E3B768A61`.

## Observed completion

Ten fixtures, two canonical consumers; six required fields per fixture. Required observations now evaluated: 60/60; missing: 0. Historical missing count was 34: A supplied 20 inventory fields plus 10 coverage fields; B's exported structural API supplies the other four runtime fields. These are observation counts, not migration credit or distinct newly implemented skills.

`classifyB11InventoryAbility` reads the mutated raw authoring graph and returns structural ownership and exact shape eligibility. `classifyB11CoverageEligibility` reads that same raw graph and returns exact diagnostic eligibility; the separate candidate `classifyAbilityForCoverage` call retains actual runtime taxonomy. Its arguments now use archive/card objects, matching the real API signature.

Inventory and coverage explicitly share `inspectB11AuthoringShape`: they are two callable diagnostic surfaces, NOT independent runtime implementations. Neither consumes another owner's observed boolean, compiler outcome, fixture expectation, card ID or ability ID. No production router or KPI classifier was changed. The independent reviewer must assess this shared diagnostic contract and each owner meaning, not treat agreement as rule correctness.

Conversion structural ownership requires advance/action-window timing, an empty target/cost/creates envelope, two move/count/mana effects and a matching binding reference. Exact eligibility additionally requires hand-to-discard movement. Golden ownership checks the combat binding/private-selection envelope; exact diagnostics check two constrained targets, first/second moves, actual movedCount VP expressions and optional payment of seven. IDs are references within the graph, never a source-card/ability allowlist.

Worker/controller/common/diagnostic module are all bound by exact Git blob and SHA-256. Candidate source trees, isolated `npm ci` lockfile, complete installed dependency tree and Node identity are bound in the receipt. Local drift is rejected; missing observations are never waived.

## Fail-visible review boundary

Old fixture review `2e94865ff9581f4f41b5d1e8d479479ce75eb135`, `docs/reviews/phase3/P3-E08-B11-fixture-expectation-review.json`, remains FAILED and is not inherited. New fixture source references bind the exported-API candidate, but all ten expected observation maps remain unchanged. The new premise is `PENDING` independent review.

Actual readiness issues:

1. `EXPECTATIONS_NOT_INDEPENDENTLY_REVIEWED`.
2. `conversion-unknown-binding:runtime.routeCandidate`: actual false, declared true.
3. `conversion-unknown-binding:inventory.routeCandidate`: actual false, declared true.

The compiler rejects this unknown-binding graph, and exact eligibility is false. Structural ownership disagreement must be resolved by independent fixture/contract review; do not rewrite expectations merely to bless possible fallback. No runtime semantic repair was performed or fallback closure newly certified by A.

## Verification

- `npx vitest run scripts/tests/phase3-b11-diagnostic-api.test.ts`: exit 0, initial 12/12.
- `npx vitest run scripts/tests/phase3-contract-parity.test.ts scripts/tests/phase3-b11-diagnostic-api.test.ts scripts/tests/phase3-b11-observation-gaps.test.ts scripts/tests/phase3-preflight.test.ts`: exit 0, initial 47/47; after malformed nested-input regression, 48/48.
- `npm run typecheck`: exit 0.
- `git diff --check`: exit 0 before implementation commit; final check recorded at evidence completion.
- Input generation with short `ac4d401`: exit 1, correctly rejected non-exact SHA; regenerated with full SHA, exit 0.
- `npx tsx scripts/phase3-contract-parity.ts --contract scripts/fixtures/phase3-b11-parity-contract.json --candidate c0db16ae65699b2e2789c7776c0aa4271b11e496 --out artifacts/phase3-e08-b11-inventory-coverage-parity.json`: exit 1, execution performed; 60/60 observations, three fail-visible issues above. Exit 1 is a blocked readiness verdict, not missing execution.
- Earlier `ac4d401` receipt regenerated twice with identical full SHA-256 `A511EDD48A8DE64313D2FAD43E92E66FE24076D42A8D76FB9523CE3DCF710712`. This is historical reproducibility evidence, not the final adapter receipt hash.
- Final `dbc1b75aaf40253982fc4e458b80dce4043b9224` adapter receipt regenerated twice byte-identically: SHA-256 `D5E6B0C2F739F3D060555E0223D8738AE1470DF78E399F6E5E78BD732C0E2691`. Read-only receipt check independently counted all 30 A observations as booleans. Both executions retain readiness exit 1; no output fields were normalized to hide differences.
- Initial default `npm run test:ci`: exit 1, 185/191 files, 1436 passed / 5 failed / 25 skipped, one unhandled RPC timeout. Historical coverage-sync rejects `packages/rules/src` drift because it binds the pre-export candidate. Other failures were timeout in preflight setup, observation-gap negative, full-roster, two Reference cases and MatchSession three-round smoke. This run was not a final frozen-carrier acceptance run; all failures remain recorded.
- Frozen carrier `00fa5b4a703b5c262e8e252c78443c382e87abd3`, clean worktree, default `npm run test:ci`: exit 1, 187/191 files passed; 1440 passed / 2 failed / 25 skipped (1467 total), one unhandled RPC timeout. Four failing files: historical coverage-sync (`Candidate source drift: packages/rules/src`), preflight setup (10-second hook timeout), observation-gap reviewer-negative (5-second timeout), full-roster executable intake (5-second timeout). New parity 8/8 and diagnostic API 13/13 passed in this full run; MatchSession 30/30 passed. No global or unrelated local timeout was increased. Full CI and combination readiness are NOT PASS.

## Handoff

Reviewer A: inspect automation implementation, exact bindings, drift/missing observation negatives and CI limitations. Reviewer B: independently review the new fixture/owner-mapping premise and ownership disagreement. Old review PASS for the two prior tooling blockers does not accept this new diagnostic API or fixture premise. If semantics require change, route it to B; A does not patch production rules.

Existing runtime/legacy consumers outside the two scoped shapes are intentionally retained. No runtime fallback was added, removed or certified by this A work. Historical coverage-sync remains bound to its own prior candidate and needs a separate compatibility disposition; do not silently change its historical verdicts to pass this checkout.

Full combo readiness, browser effect correctness, fallback closure, independent fixture expectations and promotion remain unverified. Historical 93 missing-image Release blockers and global Gate C limitations are retained, not freshly re-audited. Main coverage, migration and denominator deltas: 0. `promotedOnMain=false`.
