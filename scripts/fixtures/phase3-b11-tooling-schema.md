# B11 Readiness Tooling V1

Authority: Planner publication `e65503e601d7a3a4d1265d87a09484cb8295f2c2`,
`docs/agents/P3-E08-B11-TOOLING-MINIMUM-CONTRACT.md`.
This schema/adapters implementation is a candidate for independent automation review.

## Task Input

`fd-p3-task-check-v1` is a new explicit task-check schema, not an implicit
conversion of historical contractVersion=1 manifests. Required top-level keys:
taskId, controlEpoch, baseSha, candidateSha, contract, segments, checks.
The supported task is P3-E08-B11-COMBINATION-READINESS under Epoch 08.

Each authorization segment has adapter, role, taskId, scope, baseSha,
candidateSha, literal authorizedPaths, record, references, dependencies.
Segments must cover one contiguous ancestry chain from CLI base to candidate.
Each record/reference is an exact Git commit/path/SHA-256 triple. Canonical
references additionally bind a literal section and the segment candidate.

- b11-v1: B, RESULT_BINDING_B11. Reads the current B11 record and bounds changes
  to the two consumers' submitted runtime/authoring/tests/browser paths.
- shared-socket-v1: B, SHARED_SOCKET_LIFECYCLE. Only match-server.ts,
  match-server.test.ts and its own task record are admitted.
- a-coverage-v1: A, COVERAGE_EVIDENCE. Only the six submitted coverage/evidence
  files are admitted. It does not authorize runtime changes or award credit.

These adapter ceilings are in scripts/phase3-preflight.ts. Declaring additional
paths cannot expand a ceiling. Deleted paths and both renamed paths are checked.
Each segment must explicitly declare its exact task/candidate review dependency.

Dependencies are PENDING or ACCEPTED. Pending is a fail-visible issue, not an
accepted default. Accepted records bind fd-p3-task-review-v1 evidence containing
taskId, controlEpoch, reviewedSha, reviewer and verdict=PASS; commit ancestry
and raw artifact digest are verified. This validates the supplied evidence
identity/conclusion, not independent GitHub approval or a new Review verdict.
Historical artifact schemas are not silently translated into this schema.

Checks are PENDING or EXECUTED and bind an exact testedSha. Execution evidence
fd-p3-execution-check-v1 contains testedSha, command, producer and exitCode.
PASS requires exitCode=0 and an exact descendant producer/artifact binding.
No old B-reported strings are converted into fresh execution evidence.

Dirty detection is diagnostic only. The tool reads Git blobs and always states
inspectedWorkingTree=false, even when the checkout happens to be clean.

## Parity Input

fd-p3-contract-parity-v1 binds contract ID/version, adapterVersion,
candidateSha, minimum-contract reference, fixture reference, owners and
expectationReview. Fixture bytes are loaded from the bound producer commit,
not from a caller-supplied observations JSON.

Fixtures use fd-p3-b11-parity-fixtures-v1. They bind canonical source digests,
references, positive, owned-malformed, outside-scope and identity variations.
Mutations apply to in-memory input only. They never edit authoring/runtime files.

Real API mappings in b11-api-observations-v1:

- Runtime Golden Eater: routeCandidate and exactEligible from the two exported
  ResultBindingProductionBridge classifier APIs, on actual loader output.
- Runtime Conversion Magic: exactEligible from the exported
  isCardZoneCoreDirectActionSemantic. Structural routeCandidate has no exported
  API and is reported unavailable, not copied from exactEligible.
- Compiler: compileOutcome=ACCEPT/REJECT from compileExecutableCardPack. It does
  not export comparable standalone routeCandidate/exactEligible classifications;
  both remain null with reasons. Compilation is not equated with eligibility.
- Coverage: raw runtimeRoute/semanticRoutes from classifyAbilityForCoverage.
  These broad taxonomy outputs do not expose exact B11 graph eligibility.
  Required exactEligible therefore remains NOT_EVALUATED.
- Inventory: no B11 comparable classification API exists. The Card Zone CLI
  is a different contract, not an interchangeable inventory owner observation.
  Both required fields remain NOT_EVALUATED.

Required comparable fields in this version are runtime (both Golden fields,
Conversion exactEligible), compiler compileOutcome, inventory both fields,
coverage exactEligible. No CLI waiver switch disables an owner.
Unavailable required fields fail readiness. These missing capabilities are
tooling/API boundaries, not a claim that effects themselves are broken.

Execution uses an isolated shared Git clone, detached at the exact candidate,
and a real API subprocess. Git checkout preserves Unicode paths on Windows. Installed
dependencies come from the tooling checkout only after all package source and
coverage Git objects are verified equal to the candidate. Observations record
fixture/input digests, actual identities, normalization reports and API calls.
Declared expectations are never used as observation values.

Fixture expectations start PENDING. ACCEPTED requires a bound independent
fd-p3-parity-expectation-review-v1 artifact with verdict=PASS, reviewer,
candidateSha, reviewedFixtureCommit and premiseSha256. The premise hashes
candidate, contract, fixture reference and owner mappings, excluding the review
itself. Review must descend from the exact fixture producer. Agreement with
unreviewed expectations never passes readiness.

## Exit Codes And Boundaries

Both CLI tools: 0 diagnostic PASS, 1 diagnostic FAIL, 2 malformed/missing inputs
or unsupported schema. Windows npm/npx may flatten nonzero child exit codes;
the direct Node/tsx entrypoint retains the distinct codes. JSON records reasons.

No tool grants Gate, Review, Promotion, fallback-closure or browser acceptance.
They do not update task records, reviewReady, migration credit or policy.
Old evidence remains immutable. Package command names point to dedicated tools,
not aliases for phase3:ci-gate.
