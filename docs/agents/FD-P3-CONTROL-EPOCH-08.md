# FD Phase 3 Control Epoch 08

- Control Epoch: `FD-P3-2026-09-23-08`
- Status: `PLANNER_CANDIDATE_WAIT_MAIN_GOVERNANCE_PR`
- Effective date: `2026-10-08`
- Authoritative main: `7072da3f5ad5b6ae77c5fb4b7eb40634c29039b0`
- Previous control: Epoch 07; superseded prospectively, historical evidence preserved.
- Trigger: PR #543 governance contract entered main; ownership and dependency ordering are updated to separate CI reconciliation from runtime implementation.

This Planner commit is an authorization candidate on a side branch. Epoch 08
becomes authoritative for mainline promotion only after the control transition
and the task-index pointer are merged into main through a governance PR.

## Authority And Accounting

Inherit the governance contract merged by PR #543. One final promotion PR per
Slice; Codex I owns assembly; human approval precedes merge. Independent reviews
remain mandatory. This publication grants no technical acceptance or merge.

Frozen accounting remains `111/944`, remaining `833`. Control-transition credit
delta is zero. Gate C is `NOT_VERIFIED`; the reported 93 missing images remain a
Release blocker. These are carried-forward records, not a fresh runtime audit.

## Queue And Reservations

| Task / Slice | Owner | Stage | Disposition |
|---|---|---|---|
| P3-E08-CI-01 | Codex A | IMPLEMENT evidence only | Implementation b5a76f8 accepted as review input; generate evidence next |
| P3-E08-CI-01 independent review | Reviewer A | WAITING | Await exact evidence carrier and complete handoff |
| RP-00 A3 reconciliation | Codex A / Reviewer A | BLOCKED for promotion | Await CI resolution and fresh evidence review; does not block runtime work |
| B11 current-main replay | Codex B | PREPARE | Runtime implementation follows an exact task/reservation handoff; CI-01 is not its dependency |
| C01 control automation | Codex A | PREPARE | Read-only while CI-01 evidence writer is active |
| A113 selection | Codex A-R | PREPARE | Read-only; no runtime authorization |

CI-01 owns only its new artifact/report paths and the already frozen timeout
change. No ability-runtime reservation is assigned by this publication. RP-00's
former runtime reservation remains released. Before B11 implementation, record
its hot files and owner; coordinate any write to complex-skills-regression.test.ts
with CI-01. Frozen candidates may be reviewed concurrently without mutation.

## Synchronization

CI-01 evidence handoff, independent verdict, actual required-check failure,
or main contract changes trigger queue updates. Ordinary commits do not create
a new epoch. CONTROL_ONLY_DRIFT preserves accepted candidates subject to policy
and compatibility verification. Runtime dependency or contract changes require
scoped revalidation. A3 promotion delays do not prevent B11 preparation or a
separately authorized runtime implementation.

Next action: Codex A follows P3-E08-CI-01-EVIDENCE-DISPATCH.md. After Reviewer A
acceptance, Planner authorizes Codex I assembly under the existing policy.
