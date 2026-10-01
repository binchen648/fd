# P3-S Amakusa Owner-Complete Migration Result

Date: 2026-10-01
Task: `P3-S-OWNER-AMAKUSA-COMPLETE-MIGRATION`
Exact Base: `ceffceb3df7a9739726cf0eb52f97c31761af8e5`
Accounting before acceptance: `189/944`, remaining `755`.

## Frozen owner scope

- `master.amakusa.skill.ascension` — 过去的裁定者
- `master.amakusa.skill.s1` — 教则
- `master.amakusa.skill.s1a` — 绝罚
- `master.amakusa.skill.s2` — 红队领袖
- `master.amakusa.skill.s3` — 神仆

All five are absent at Base and materialized together in one canonical owner archive. They remain only provisionally newly creditable until exact formal `MIGRATION_ACCEPTED` plus FORMAL A-sync/accounting.

## Formal consumer

- Adds `data/authoring/masters/master.amakusa.json` and appends Amakusa exactly once immediately after Alice in `authoringMasterFiles`.
- Initial mana: `4`.
- Ascension is `outside_game`; all five frozen static names/text are preserved from frozen source / locked Reference static metadata.
- `s1` consumes accepted linked-role game-start initialization.
- `s2` consumes accepted dynamic Command-Seal recruitment plus next-round member application.
- `s3` consumes accepted pre-climax entry seal tax, one-mana linked contribution and different-battlefield VP reward.
- `s1a` consumes accepted revealed active-member servant-skill temporary copy, original-use round lock and active-member removal while preserving ever-member history.
- Ascension consumes accepted opponent -2 Command-Seal unlock terminal plus exact `servant.shakespeare.skill.sc-shakespeare-3` physical play -> controller basic-card +4 Power authority.
- No Amakusa/Shakespeare/card-name/printed-text/legacy-handler routing is added. The successor revision adds one identity-free shared MatchSession replay-checkpoint rewind fix required by formal review.

## Canonical behavior coverage

- Game start creates the canonical leader + next-seat member relationship with permanent ever-member history.
- Vassalize dynamically spends `1 + active member count` Command Seals, requires a never-member target with fewer seals before spend, and applies at next round start.
- Linked-role battle terminal rewards leader/member once when they win different battlefields.
- Absolute Punishment chooses an active member's revealed servant skill, creates a temporary leader-owned copy, locks the exact original for the round after copied use, removes active membership and preserves ever history.
- Master ascension unlock removes exactly two ordinary Command Seals from each active opponent with floor zero.
- Exact Shakespeare sc3 physical play activates +4 Power only for the Amakusa controller's own `basic_attack` cards while the exact trigger physical source remains live.

## Verification

- Amakusa formal owner regression: `8/8 PASS`.
- Amakusa readiness predecessors/follow-up: `30/30 PASS`.
- Explicit Amakusa focused aggregate: `38/38 PASS`.
- Directly affected shared: `121/121 PASS` (`authoring-interpreter 38`, `executable-card-pack 50`, `MatchSession 33`).
- Explicit focused + shared aggregate: `159/159 PASS`.
- `FD_TOOLCHAIN_OK`.
- typecheck PASS.
- content validate/compile: `11 masters / 19 servants / 20 events / 0 blocking issues`.
- generated determinism PASS.
- Phase 3 coverage and automation-audit commands completed successfully; their transient audit artifacts were not added to the owner Candidate because those repository artifacts are not versioned per owner migration.
- production runtime delta against exact Base is limited to the identity-free MatchSession replay-checkpoint rewind fix required by formal review.
- production Amakusa/Shakespeare identity audit CLEAN.
- `git diff --check` PASS.
- generated hashes:
  - content-library `04aeadf82611b118a8d56085d8f0548f5381fdef8e725a85cdaf00b8f35b9a38`
  - fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`
  - evidence-report `97ee687b4919b443cc31a16824e1abb854c03b068f18fb6b22136614a43cec73`

## Governance

This is the one formal owner-complete Amakusa Candidate for the current frozen 5-identity scope. Implementation and Reviewer acceptance alone grant no credit. Only exact `MIGRATION_ACCEPTED` followed by FORMAL A-sync/accounting may add `+5`, moving strict accounting from `189/944` to `194/944`, remaining `750`.
## Reviewer revision closure

- Predecessor Candidate `e2fa9d4298e204362367ae74684b86dedf3e40fc` received `MIGRATION_NEEDS_REVISION` on PR #517.
- Canonical bounded relay evidence: `https://github.com/binchen648/fd/pull/517#issuecomment-5925732349`.
- P1 root cause: `projectToClientState()` exposes only the last 40 replay entries. The Amakusa-integrated seed produced 41 checkpoints, exposing that `restoreToCheckpoint()` restored state/logs but kept future replay checkpoints. The restored first checkpoint was therefore trimmed from projection even though restore returned success.
- Successor fix is identity-free: after all checkpoint authority validation succeeds, restore rewinds both `replay` and `replaySnapshots` to the restored checkpoint, prunes future replay trust, then records `replay_restored`.
- The existing regression is not weakened; it is strengthened to require the authoritative replay lineage and snapshot lineage to end exactly at the restored checkpoint.
- Post-fix verification: focused failing reproduction PASS; full MatchSession `33/33 PASS`; complete Amakusa formal + readiness `38/38 PASS`; typecheck/content/generated/toolchain/diff gates PASS.
- Migration accounting remains `189/944`, remaining `755` pending fresh review of the successor Candidate.