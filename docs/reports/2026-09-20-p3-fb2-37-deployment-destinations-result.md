# P3-B2 FB2-37 Deployment Destinations Replacement Result

Role: Codex B2
Status: `IMPLEMENTATION_CANDIDATE`
Date: 2026-09-20

## Dispatch binding

- Exact A dispatch Base: `17deda33289c1f9467cda439109f2bbaf325d772`
- Task: `P3-A-FB2-37-DEPLOYMENT-DESTINATIONS-DISPATCH`
- Formal migration at dispatch: `139/944`, remaining `805`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- This task is runtime capability infrastructure only and earns **zero migration credit**.

## Implemented capability

Added one identity-free exact structural admission/runtime seam for a permanent controller deployment-destination replacement with all of the following shape:

- `operation: replace`
- `rule: deployment_destinations`
- `scope.subject: controller`
- destination filter:
  - `locationKind: battlefield`
  - numeric `opponentCountEquals: 1`
  - `opponentVictoryPoints: less_than_controller`
- modifier lifecycle `{ duration: permanent }`
- priority `{ tier: card_text, specificity: explicit_exception }`
- `conflictPolicy: explicit_exception_over_general`
- passive ability with the exact `source_owned` source-state condition and no additional effect/cost/target/create behavior.

The loader does not add `deployment_destinations` to an unrestricted generic whitelist. It admits the rule only through the exact structural classifier and fails recognized near matches closed.

## Runtime behavior

The authoritative MatchSession deployment path now evaluates the structural modifier directly while preserving the existing generic legacy product effect bridge for compatibility.

- Production helper naming is structural rather than consumer-identity based.
- A structural source must be both owned and controlled by the deploying player and currently be in an eligible `skill` or `field` source zone.
- Existing legacy bridge behavior remains controller-based as before, avoiding an unrelated compatibility change.
- Current enabled battlefield, ordinary deployment legality, deployment limits, active opponent status, live location occupancy, and current victory points are evaluated at legal-action/dispatch time.
- If one or more otherwise legal battlefields each contain exactly one active opponent with lower VP than the controller, deployment choices are replaced by exactly those locations.
- If no qualifying location exists, ordinary legal deployment choices remain unchanged.
- Dispatch uses the same legal-action path, so selecting a filtered-out destination fails with `illegal_deployment`.

No consumer identity, consumer name, printed text, F1 hash, Locked Reference hash, Reference handler, or definition-ID routing was added to production.

## Focused coverage

`packages/rules/tests/fb2-37-deployment-destinations.test.ts` covers:

1. exact modifier and passive ability classification;
2. fail-closed near matches including string-vs-number confusion, wrong count, extra selector field, wrong lifecycle, priority, conflict policy, and wrong rule;
3. loader automatic admission for the exact shape and unsupported mode for a recognized near match;
4. exact authoritative legal-deployment replacement and dispatch rejection of an alternative location;
5. ordinary choices when no qualifying lower-VP lone battlefield exists;
6. current occupancy and active-player status, including exact-one-opponent semantics;
7. source-zone gating;
8. authoritative `source_owned` ownership gating;
9. preservation of the existing generic legacy product deployment behavior.

Focused result: **1 file / 8 tests PASS**.

## Validation

All validations were run in the fresh B2 worktree at the candidate worktree state:

- `npm.cmd run typecheck`: **PASS**.
- focused FB2-37: **1 file / 8 tests PASS**.
- rules `src/__tests__ + core + regression + focused`: **83 files / 502 tests PASS**.
- official CI with `--maxWorkers=2`: **154 files / 1081 tests PASS**; eleven-round MatchSession smoke passed at about 1.85 s.
- content validation: **7 masters / 7 servants / 20 events / 0 blocking issues**.
- generated determinism: **PASS**, hashes reproduced:
  - content library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence report `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- Locked Reference verifier: **PASS** against exact clean commit `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- client production build: **PASS**; only existing Vite browser-externalization/chunk-size warnings appeared.
- `git diff --check`: **PASS**.
- diff-only production hardcode audit: **CLEAN** for consumer identities/names, F1/Reference hashes, and Reference-handler tokens.
- worktree after validation contains only authorized FB2-37 source/test/result-report material; generated/audit/build outputs are not tracked changes.

## Closure proof

A read-only post-implementation probe loaded the Locked Reference canonical `master.kayneth.skill.s3` after container-only normalization into the accepted local authoring envelope:

- loader report: `[]`
- compiled execution mode: `automatic`
- exact structural ability classifier: `true`

This is readiness evidence only and does **not** migrate or credit that identity in FB2-37.

## Accounting / next action

Formal migration remains **`139/944`**, with **`805`** remaining. FB2-37 earns **0** migration credit.

After fresh independent R returns `IMPLEMENTATION_ACCEPTED_CANDIDATE` on the exact Candidate and A synchronizes that acceptance, migration-closure-first requires immediate fresh S dispatch for `master.kayneth.skill.s3` before unrelated runtime work.
