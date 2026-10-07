# P3-E07 C01-A Control Automation Dispatch

- Control Epoch: `FD-P3-2026-09-23-07`
- Task ID: `P3-E07-C01-A`
- Owner: `Codex A / Automation Owner`
- Status: `WAIT_RP00_RECOUNT`
- Required base: `a7751c3fa51895fd3a401721b1e926b90e016862` or the
  post-recount main explicitly selected by Planner
- Resource domain: `evidence-governance`

## Start Gate

Do not start implementation while Codex A owns `P3-E07-RP-00-A3`. Planner must
first record the recount candidate and Reviewer A verdict, then grant the
`evidence-governance` writer reservation to C01-A.

## Goal

Implement the minimum machine control layer for:

1. task status inspection;
2. resource-domain lock validation;
3. deterministic Git/SHA/dirty-state handoff collection;
4. changed-path and declared-domain comparison;
5. main-drift evidence generation;
6. promotion preflight input generation.

Target command interfaces:

```text
npm run phase3:control -- status
npm run phase3:control -- prepare --task <id>
npm run phase3:control -- lock check --task <id>
npm run phase3:handoff -- --task <id>
npm run phase3:drift -- --task <id> --new-main <sha>
npm run phase3:promotion-preflight -- --task <id>
```

## Boundaries

Codex A may modify automation scripts, schemas, package commands, focused tests,
and machine-readable evidence templates. It must not modify runtime semantics,
authoring definitions, migration credit, canonical rules, or acceptance status.

The drift tool emits evidence for one of:

- `CONTROL_ONLY_DRIFT`
- `NON_OVERLAPPING_DRIFT`
- `CONTRACT_DRIFT`

It does not make the final acceptance decision. Reviewer A independently
reviews classifier inputs, dependency closure, protected paths, consumer sets,
and adversarial drift cases.

Allowed completion claim: `AUTOMATION_COMPLETE_CANDIDATE`.
