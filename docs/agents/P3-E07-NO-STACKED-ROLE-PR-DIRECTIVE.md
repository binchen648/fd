# P3-E07 No Stacked Role PR Directive

- Control Epoch: `FD-P3-2026-09-23-07`
- Effective main: `a7751c3fa51895fd3a401721b1e926b90e016862`
- Status: `ACTIVE_PLANNER_DIRECTIVE`
- Scope: every newly dispatched Phase 3 Slice

## Rule

One Slice has one final Promotion PR targeting `main`. A conversation is not a
Slice, and a role task is not a Slice.

| Role | Worktree/branch/commit | Role-stage PR | Final Promotion PR | Merge |
|---|---:|---:|---:|---:|
| A | allowed | forbidden | forbidden | forbidden |
| B/B2 | allowed | forbidden | forbidden | forbidden |
| R/RA/RB | read-only plus artifact | forbidden | forbidden | forbidden |
| S | allowed | forbidden | forbidden | forbidden |
| G | governance artifact | governance-only when authorized | forbidden | forbidden |
| I | allowed after acceptance | forbidden | allowed | forbidden |
| Human | not applicable | not applicable | approval decision | allowed |

`forbidden` means no new PR whose base is another unmerged role branch. It does
not forbid isolated branches, exact-SHA handoffs, GitHub issue comments, or
immutable review attestations.

## Existing PRs

Existing stacked PRs are frozen as source evidence. They may be inspected and
classified, but are not automatically merged, retargeted, credited, or closed.
Planner must record one of:

- `ALREADY_INCLUDED`
- `EVIDENCE_ONLY`
- `REPLAY_REQUIRED`
- `SUPERSEDED`
- `ARCHIVE_READY`

before repository housekeeping occurs.

## Violation Handling

A newly opened role-stage stacked PR is `PROCESS_DRIFT`. The worker stops before
additional commits, returns the exact HEAD and source task to Planner, and does
not recreate or delete history. Planner converts valid work into a branch or
artifact handoff and decides whether the PR should be closed.

CI enforcement is pending a separately reviewed Codex A implementation and
Codex G governance acceptance. This directive is immediately binding for
Planner dispatch even before CI enforcement lands.
