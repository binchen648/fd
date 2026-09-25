# P3-A Current-Main FB2-42 Acceptance Synchronization

Status: `SYNCHRONIZED`

## Exact accepted input

- Task: `P3-B-MAIN-REPLAY-FB2-42`
- PR: `#444`
- Exact implementation Base: `c6c5786cb48f6abc563aa8359e335fbd26c14c4f`
- Exact accepted Candidate: `c820161a427de6b0e55c209b7e14e3f6fba36033`
- Fresh Reviewer attempt: `pr444:c820161a427de6b0e55c209b7e14e3f6fba36033:retry1`
- Canonical accepted evidence: `https://github.com/binchen648/fd/pull/444#issuecomment-5830650148`
- Prior environment-only BLOCKED evidence: `https://github.com/binchen648/fd/pull/444#issuecomment-5830498237`

## Synchronization result

Fresh independent retry1 accepted the exact Candidate after the fixed Reviewer transport blocker was repaired without changing the Candidate. The accepted seam is only the identity-free FB2-42 controlled-card `card_close` forbid capability already dispatched for current main.

A therefore synchronizes that accepted capability on the current-main replay lineage. This is documentation/governance synchronization only; it does not alter runtime, authoring, generated content, packs, client production, or any consumer identity.

The accepted implementation preserves:

- exact bounded automatic `this_round` `card_close` forbid semantics;
- structural `has_card_id` selection under self-controller scope;
- centralized live-source Card Zone liveness;
- rejection before mutation/event in both close routes;
- stale/dead source, expired lifecycle, wrong controller/definition, and widened near-match rejection;
- current-main fixture adaptation that does not widen unsupported `source_active` authoring vocabulary.

## Independent verification carried by the accepted R

- typecheck: PASS
- focused: 5 files / 42 tests PASS
- affected rules/core/regression: 74 files / 441 tests PASS
- full CI: 131 files / 866 tests PASS
- content validation: 7 masters / 7 servants / 20 events / 0 blockers
- generated-content determinism: PASS
- frozen rescan: 944 = 943 static + 1 dynamic; 111 unique / 111 occurrences; duplicates 0; remaining 833
- Base -> Candidate authoring/pack/generated diff: empty; additions 0 / removals 0
- canonical identity/name/Chinese printed-text/`printedText`/`SkillLib` routing additions: 0
- `git diff --check`: PASS

## Accounting

FB2-42 replay is zero-credit infrastructure. Current-main formal/material accounting remains **111/944**, with **833** remaining. No migration credit is granted by implementation acceptance or this A synchronization.

## Next legal task

`P3-B-MAIN-REPLAY-FB2-49-R2` is READY from the exact A synchronization commit carrying this report/task block. It must semantically replay only the narrow identity-free FB2-49 runtime/restore/replay authority contract on current main, now with FB2-42 available as an accepted prerequisite.

PR #422 / PR #424 / R123 frontier remain semantic/evidence sources only. They must not be cherry-picked, merged, retargeted, or wholesale promoted. Astolfo and Scathach consumer migration remains out of scope and receives no credit here.