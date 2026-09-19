# P3-FB2-32 Source State Conditions — Fresh Independent Review

Reviewer: Codex R
Date: 2026-09-19
Formal verdict: `GATE_A_B_CANDIDATE_ACCEPTED`

## Review identity

- reviewJobKey: `pr376:ae80ed7fb759a35964bcf5d9f581dc4e52d49d49`
- Repository: `binchen648/fd`
- PR: `#376`
- Exact Base: `425c7d56e97b95b2a379bae81d49c89a2b739f65`
- Exact Candidate: `ae80ed7fb759a35964bcf5d9f581dc4e52d49d49`
- Candidate branch: `codex/b2-p3-fb2-32-source-state-conditions`
- Reviewer branch: `codex/r-p3-fb2-32-source-state-conditions-r2-review`

## Mechanical recovery

GitHub PR metadata was re-read independently rather than relying on coordinator chat text. PR #376 is OPEN, non-draft, unmerged, with Base branch `codex/a-p3-fb2-32-source-state-conditions-dispatch` at exact SHA `425c7d56e97b95b2a379bae81d49c89a2b739f65` and Head branch `codex/b2-p3-fb2-32-source-state-conditions` at exact SHA `ae80ed7fb759a35964bcf5d9f581dc4e52d49d49`. GitHub reports two commits and four changed files.

Independent `git ls-remote` resolves the same dispatch Base and Candidate head. Local commit ancestry shows the initial implementation commit `c89eac0357b2427aa9682a95f644f3e1442281bc` has parent exactly the Base, followed by revision commit `ae80ed7fb759a35964bcf5d9f581dc4e52d49d49` (`fix(rules): close FB2-32 reviewer findings`).

The Base task index and `docs/reports/2026-09-19-p3-a-fb2-32-source-state-conditions-dispatch.md` define the FB2-32 contract as only two identity-free exact type-only generic condition nodes:

- `{ type: "source_active" }`
- `{ type: "source_owned" }`

Required semantics are authoritative physical-source/current-controller evaluation, benign fail-closed behavior for missing/stale source context, read-only evaluation, exact-shape rejection of payload-bearing near-matches, and no broadening of activation trigger, effect, target, interaction, lifecycle, or modifier routes. FB2-32 earns zero migration credit. `docs/agents/PHASE3-AGENT-CONTRACT.md` defines Codex R as independent/default READ ONLY and separates review from implementation.

## Candidate scope audit

`git diff --name-status Base..Candidate` is exactly:

- `A docs/reports/2026-09-19-p3-fb2-32-source-state-conditions-result.md`
- `M packages/rules/src/ability/interpreter.ts`
- `M packages/rules/src/ability/loader.ts`
- `A packages/rules/tests/fb2-32-source-state-conditions.test.ts`

No `data/phase3`, authoring/packs, app, artifact, task-index, taxonomy/KPI/coverage, consumer migration, merge, or retarget change is present. `git diff --check Base Candidate` passes. The reviewer checkout had no tracked modifications before this reviewer-only report branch was created.

## Review of revision against previous blockers

The initial Candidate `c89eac0357b2427aa9682a95f644f3e1442281bc` had two blocking findings recorded on PR #376. Both are closed by `ae80ed7...` and were re-probed independently.

### 1. Condition-only loader route boundary — PASS

The revision keeps the two node types in the shared recognized-type set but adds position-aware acceptance: `source_active` and `source_owned` are supported only under the top-level ability `conditions` route. A fresh direct Candidate probe authored an ordinary ability with `conditions: []` and `effects: [{ type: "source_active" }]`.

Observed result:

- loader report contains `Source-state condition is supported only under ability conditions` at `effects[0]`;
- ability execution mode becomes `unsupported`.

Therefore accepting this condition family no longer silently broadens the effect route. Code-path inspection also shows target constraints and modifier constraints are scanned under paths not beginning with `conditions`, so the same guard rejects those placements while allowing nested subconditions within an actual conditions tree.

### 2. Nonphysical event-rule source must fail closed — PASS

The revision changes source lookup from throwing `card(s, ctx.sourceCardId)` to a physical-card search followed by `return false` when no physical source exists.

Fresh direct Candidate probe used a placement-backed event-rule source whose rule instance id is `event-rule-1`, with condition `{ type: "source_owned" }`, no physical cards, and a guarded +2 VP effect.

Observed result:

- `processAbilityEvent(...)` did not throw;
- VP remained `0 -> 0`;
- the guarded effect did not run.

This closes the prior `Card is not available` failure while preserving benign condition non-match semantics for valid nonphysical rule contexts.

## Fresh semantic probes

Direct Candidate module probes were run independently of the implementer-owned focused test file:

- exact `{type:"source_active"}` classifier result: `true`;
- exact `{type:"source_owned"}` classifier result: `true`;
- payload-bearing `{type:"source_owned", owner:"controller"}` classifier result: rejected;
- active physical source: one trigger collected;
- same source after runtime active=false: zero triggers collected;
- physical source owner == controller: one trigger collected;
- physical source owner != controller: zero triggers collected;
- unsupported trigger paired with `source_active`: remains `Unmapped trigger`;
- unsupported trigger paired with `source_owned`: remains `Unmapped trigger`.

Code inspection confirms `source_active` reuses the pre-existing authoritative `active(...)` helper, which requires the source card to be in `field|attack_area`, runtime-active, and face up. `source_owned` compares only physical `ownerPlayerId` against current `ctx.controllerId`. Missing physical source is rejected as a false condition before `active(...)` can perform a throwing card lookup.

Malformed payload-bearing runtime nodes are rejected by `isSourceStateCondition(...)`, preserving the exact type-only contract.

## Validation evidence

The Candidate result report records the following post-revision implementer validation:

- focused FB2-32: `1 file / 8 tests PASS`;
- core + regression + focused: `79 files / 490 tests PASS`;
- official CI selection: `146 files / 1025 tests PASS`;
- typecheck: PASS;
- content validation: PASS;
- generated-content determinism: PASS;
- Locked Reference verification: PASS;
- client production build: PASS;
- `git diff --check`: PASS.

GitHub currently exposes no workflow runs for this Candidate. A fresh reviewer attempt to reproduce the full repository suite locally was blocked by checkout materialization/network conditions: a sparse checkout initially lacked generated content required by the aggregate entrypoint, and subsequent full materialization/clone attempts were interrupted by GitHub transport failures. Those broad suite counts are therefore cited as implementer evidence, not falsely represented as independently reproduced.

The contract-critical changed behavior itself was independently exercised through direct loader/interpreter runtime probes above, all of which pass, and no new blocker or contradiction was found.

## Metadata note

The PR body still names the old Candidate `c89eac0357b2427aa9682a95f644f3e1442281bc` and the old pre-revision test counts. This is stale PR description metadata only; current GitHub head metadata resolves authoritatively to `ae80ed7fb759a35964bcf5d9f581dc4e52d49d49`. It is non-blocking for the implementation verdict.

## Formal verdict

`GATE_A_B_CANDIDATE_ACCEPTED`

The exact Candidate `ae80ed7fb759a35964bcf5d9f581dc4e52d49d49` satisfies the recovered FB2-32 contract within the authorized four-file scope. The two prior blocking defects are closed by the revision and independently reproduced as fixed. No Candidate modification, merge, or retarget was performed by this review.

A direct PR comment write was attempted first but GitHub returned `403 Resource not accessible by integration`; this reviewer report is the required evidence fallback.
