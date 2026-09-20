# P3-A R88 FB2-42 Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-20

## Accepted capability input

- Formal verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- Canonical reviewer evidence: `https://github.com/binchen648/fd/pull/394#issuecomment-5748132070`
- Exact A dispatch Base: `ec39baa2d99c1e9f2359e832ca7bd61118c44558`
- Accepted B2 Candidate: `d082a90e194ee4cf1f528086f1ba01150a9ead41`
- Prior rejected Candidate: `5fc30e258be7f007e979008d9d46a43a2917098a`
- PR: `#394`
- Task: `P3-FB2-42-CONTROLLED-CARD-CLOSE-FORBID`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Frozen F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`

## A synchronization checks

A mechanically rechecked:

- this synchronization worktree starts at exact accepted Candidate `d082a90e194ee4cf1f528086f1ba01150a9ead41`;
- PR #394 remains OPEN / CLEAN / non-draft, unmerged, with exact dispatch Base branch `codex/a-p3-fb2-42-card-close-forbid-dispatch` and exact Head Candidate `d082a90e194ee4cf1f528086f1ba01150a9ead41`;
- canonical fresh independent R evidence `5748132070` binds exact Base `ec39baa2d99c1e9f2359e832ca7bd61118c44558` and exact revised Candidate `d082a90e194ee4cf1f528086f1ba01150a9ead41`, returning `IMPLEMENTATION_ACCEPTED_CANDIDATE` with no blocking finding;
- the prior exact Candidate `5fc30e258be7f007e979008d9d46a43a2917098a` was rejected for allowing a dead protection source to keep enforcing `card_close`; the accepted revision is its direct child and does not re-review the old SHA;
- accepted capability remains bounded to automatic `this_round` `operation=forbid`, `rule=card_close`, `scope.controller=self`, with exactly one nonempty structural `has_card_id` selector;
- physical source liveness is now centralized through Card Zone `isActiveCardSource(...)`, reused by interpreter liveness and the FB2-42 guard;
- after the protection source closes through typed resolution, its stale ongoing record may remain but is no longer live and the formerly protected target can close normally;
- both server-owned close routes still reject before mutation/event while a valid accepted modifier is live;
- no consumer authoring, Darius identity routing, broad card-action forbid DSL, generated/product mutation, merge, or retarget is introduced;
- reviewer validation on exact revised Candidate passed typecheck, focused 4 files / 37 tests, rules 83 files / 503 tests, official CI 163 files / 1148 tests, content validation, generated determinism, exact Locked Reference verification, client production build, `git diff --check`, and production identity/hardcode audit.

## Formal accounting after synchronization

Project formal migration accepted remains **`144/944`**, with **`800`** remaining.

FB2-42 is identity-free runtime capability infrastructure and earns **zero migration credit**. No consumer identity is credited by this synchronization. Historical `P3-FM09-RECOVERY` remains `MIGRATION_BLOCKED`.

PR #394 remains OPEN, unmerged, and unretargeted.

## Next coordinator action

Migration-credit-first requires immediate whole-card re-overlay of `servant.darius.skill.sc-darius-2`. Before FB2-42, the exact +1 undead power modifiers were already executable and `card_close` forbid was the sole known gap. Re-run the whole card against the accepted runtime; dispatch exactly one singleton S only if loader `report=[]`, execution is automatic, lifecycle and close behavior are mechanically complete, and frozen accounting is exact +1 with zero removals/duplicates.
