# A0 To DR-P01 Explicit Release

Date: 2026-10-29 (Asia/Shanghai).
Authority: direct user scheduling instruction and Codex B acknowledgement as A0 Owner.
Publication: original Planner control branch codex/planner-p3-e08-environment-recovery.
No separate Planner conversation acknowledgement or message delivery is claimed.

## Effective Disposition

A0 candidate 3ec55814b8aca84416fca46dfaf7032a7f115094 is frozen. The actual
A0 worktree D:/fd-validation/b-cb-a0-play-clarification is clean and its HEAD
and remote branch both match that SHA. This action changes neither its code
nor test receipts and does not convert its VALIDATION_BLOCKED status to PASS.

The reservation P3-CB-A0-TIME-ALTER-PLAY-LEGALITY-REPAIR is explicitly
RELEASED_FOR_SCHEDULING. Its production/shared-runtime write authorization is
disabled, and it no longer owns these paths:

- packages/rules/src/ability/interpreter.ts
- packages/rules/src/ability/loader.ts

Scheduling handoff target is exactly DR-P01. After this record is published,
the old A0 reservation is not a blocker for DR-P01's independently authorized
scope. DR-P01 still binds its own task, owner, exact base, branch and worktree,
and checks any new competing writer. No other A0 paths, mechanic permissions,
heavy-test window, acceptance or promotion are transferred.

## D:/f49-26

Historical branch codex/b2-fb2-49-r12-fix at
26cadeacbdd602e6c512c3b4c0e5adae4e27c46c retains three uncommitted files.
The interpreter was last written on 2026-09-21. The machine record captures
all three file hashes, sizes and timestamps so preservation is verifiable.

Disposition under the current user's scheduling authority:
PRESERVED_IN_PLACE_FROZEN_LEGACY_WORK_NOT_AN_ACTIVE_SHARED_WRITER.
This dormant dirty checkout is not a current lease over interpreter.ts or
loader.ts and must not block DR-P01 merely because its files are dirty.
Nothing is reset, stashed, deleted, moved, merged or cherry-picked. No historical
patch is adopted or accepted. Resuming that branch's runtime writes requires a
new explicit reservation, not revival of an old claim. This is a scheduling
decision, not a claim that its unavailable original session replied.

## Durable References

- Machine record: docs/agents/manifests/releases/P3-CB-A0-TO-DR-P01.json
- Updated old grant: docs/agents/manifests/reservations/P3-CB-A0-TIME-ALTER-PLAY-LEGALITY-REPAIR.json
- This notice: docs/agents/P3-CB-A0-TO-DR-P01-RELEASE.md

The record commit SHA is the commit publishing these three control files and
is provided in the direct handoff. Use the published Git object rather than a
stale local copy of the earlier pending reservation. Existing unrelated dirty
Planner documents are preserved and are not part of this control-only commit.

No production files, main branch, authoring, registry, coverage or runtime
acceptance are changed. Migration credit delta is zero. No PR is created.
