# P3-E07 RP-00 RA3 Recount Review Dispatch

- Control Epoch: `FD-P3-2026-09-23-07`
- Task ID: `P3-E07-RP-00-RA3`
- Owner: `Reviewer A`
- Mode: `READ_ONLY`
- Authoritative main: `a7751c3fa51895fd3a401721b1e926b90e016862`
- Candidate: `fa76e0311c9f7bd0ca07c973866b12938c5fd79f`
- Candidate branch: `codex/a-p3-e06-post-merge-recount`
- State: `READY_FOR_REVIEW`

## Epoch Transition Binding

Codex A began the recount after PR #536 merged but before Planner published
Epoch 07. Its artifact therefore names Epoch 06 and the original A task ID.
Planner maps that exact candidate, without rewriting it, to
`P3-E07-RP-00-A3`. Reviewer A must decide whether this explicit transition
binding is sufficient or whether the artifact must be regenerated under Epoch
07. Do not silently repair the candidate while reviewing.

## Review Scope

Verify independently:

1. PR #536 merged as `a7751c3...` and that SHA is current authoritative main.
2. Candidate `fa76e03...` descends from exact main and the remote branch points
   to the same SHA.
3. Candidate changes only evidence, coverage output, recount report, and focused
   automation test paths.
4. Runtime candidate `30be3b7...` is in main ancestry.
5. The three authorized consumers are exactly:
   - `military.has-support-shot`
   - `astronomical-science.has-chaldeas`
   - `useless-person.setup`
6. Fresh coverage reproduces all reported counters and route count.
7. Coverage artifact SHA-256 and all Reviewer/Governance artifact bindings
   match the files in the candidate lineage.
8. Frozen accounting remains `111/944`, duplicates remain zero, and runtime
   promotion delta `+3` is not migration or denominator credit.
9. Gate C remains `NOT_VERIFIED`; the 93 missing source assets remain a release
   blocker and are not hidden by ordinary content validation.
10. Focused test, typecheck, content validation, generated determinism, and diff
    checks are rerun or independently established.

## Boundaries

Reviewer A must not modify the candidate, runtime, coverage implementation,
authoring, or governance. A PASS may authorize Planner to mark RP-00
`PROMOTED_ON_MAIN_RECOUNTED` and release only the RP-00 runtime reservation. It
does not grant Gate C, migration credit, Phase 3 completion, or Release Ready.

## Verdicts

- `POST_MERGE_RECOUNT_PASS`
- `POST_MERGE_RECOUNT_NEEDS_REVISION`
- `STALE_CANDIDATE`

Return exact main, exact candidate, changed paths, reproduced counts, hash
checks, epoch-transition disposition, findings, non-claims, and next owner.
