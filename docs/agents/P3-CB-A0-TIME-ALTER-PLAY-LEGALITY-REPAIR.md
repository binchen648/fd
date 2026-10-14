# P3-CB-A0 Time Alter Play Legality Repair

Date: 2026-10-14. Control Epoch: FD-P3-2026-09-23-09.
Task ID: P3-CB-A0-TIME-ALTER-PLAY-LEGALITY-REPAIR.
Disposition: CONTRACT_INVALID_FOR_WHOLE_IDENTITY / SCOPED_RUNTIME_REPAIR_AUTHORIZED_CONDITIONALLY.
Exact implementation base: origin/main@a42b5e1c517141b90f3407773958b0d8afe63264.
Authority: user-confirmed ruling recorded at a1328bead4d653991f7b52817686e24e882d50b4,
docs/rules/2026-10-14-time-alter-user-ruling.md, Git blob 5865aa653f614da29361b777569cb8a0f44d0c2f.
The ruling is on a separate pushed lineage; it is an exact source dependency, not
an assertion that this commit is on main or that the runtime is accepted.

## Scope And Owner

Codex B owns this one runtime/authoring correction. Reviewer B gives a fresh
whole-contract and runtime verdict on the frozen candidate. Codex A then binds
one final evidence packet; Reviewer A verifies the exact candidate, source
objects, receipts and zero-credit accounting. Existing G/I promotion follows
only after these accepted verdicts. No Lead Builder implementation delegation.

The ability is master.kiritsugu.skill.time-alter#time-alter.action, frozen
identity master.kiritsugu.skill.s2. The Master ability source stays in skill;
the separately selected controller-hand card is played face-down, then one card
is drawn. Origin Bullet is eligible if it is legally in hand. This task does
not create an exception for skill cards, other card families or illegal plays.

Writer reservation:
docs/agents/manifests/reservations/P3-CB-A0-TIME-ALTER-PLAY-LEGALITY-REPAIR.json.
It grants only the listed paths after B binds an actual clean branch/worktree
at the exact base and checks for competing writers. The existing A0 test-only
reservation stays suspended. Do not write in the dirty D:/fd root.

Permitted production changes, only where required for this correction:

- data/authoring/masters/master.kiritsugu.json
- packages/rules/src/ability/interpreter.ts
- packages/rules/src/ability/loader.ts (only if a typed target constraint is needed)

Permitted regression/evidence changes:

- packages/rules/tests/regression/card-action-play.test.ts
- packages/rules/tests/regression/complex-skills-regression.test.ts
- packages/rules/tests/regression/cb-a0-time-alter-origin-bullet.test.ts (new)
- packages/rules/tests/executable-card-pack.test.ts
- e2e/fd-time-alter-core-primitive.spec.ts (only if the production browser path needs a new assertion)
- artifacts/phase3-cb-a0-time-alter-play-legality-repair.json
- docs/reports/2026-10-14-p3-cb-a0-time-alter-play-legality-repair.md

Other files, generated content, MatchSession/session/authority, UI, workflows,
timeouts, coverage classifiers, migration counters and policy are excluded.
If the correction needs another path, stop and return the exact reason to
Planner before writing it. Do not route by card ID or ability ID, or add a
fallback to the legacy effect interpreter.

## Acceptance Contract

1. Use one consistent, side-effect-free legality predicate for projected
   face-down targets and final effect play. Recheck at submission under the
   current state. The semantic route must remain structural/identity-free and
   fail closed for malformed shape. Do not silently equate card text with the
   old attack-only authoring field.
2. Trace a real Kiritsugu setup replacement into the deck, then an actual draw
   of Origin Bullet into hand before activation. Show the Master source remains
   in skill. If full production setup cannot reach this state, report that as a
   blocker rather than constructing a synthetic success claim.
3. Activation selects exactly one otherwise legal controller-hand target;
   Origin Bullet and normal hand attacks work. Successful face-down play enters
   the correct zone, is not activated, pays no mana and draws exactly one card
   afterward. Verify typed result/event binding and owner/private projections.
4. Negative matrix: source-versus-target confusion, fabricated skill in hand,
   wrong owner/zone/phase, already moved target, play prohibition, malformed
   graph, missing target, stale selection, invalid target and corrupt draw.
   Every rejection must preserve state, events and revision as applicable and
   must not invoke legacy fallback. Check neighboring card-action regressions
   for behavior changed by shared `isAttack` / face-down legality.
5. Save actual commands, tested SHA, raw receipt paths/hashes and known gaps in
   one frozen candidate packet. Run focused rules/loader/neighbor regressions,
   typecheck and content validation before review. Run browser proof if the
   specific production path can be established. Full CI is a candidate-freeze
   gate subject to a nonconflicting heavy-test window, not a separate write lock.

RB must independently judge rule-to-authoring parity and whether the correction
retains the previous scoped PLAY behavior for legal old targets. A scoped runtime
PASS is not whole-identity acceptance if replacement/draw/projection evidence is
missing. A/RA do one consolidated evidence sync after RB; no role-level PRs.
Promotion requires one final PR, exact remote evidence, required checks and
human approval. Ledger remains 111/944; credit delta 0; Global Gate C and the
93 missing images are unaffected by this authorization.

## Copyable B Task

You are Codex B for P3-CB-A0-TIME-ALTER-PLAY-LEGALITY-REPAIR. Read this file,
the exact user ruling at a1328bea, the reservation and relevant Final Rules
9.5-9.6/11.1. Start from origin/main@a42b5e1c in a clean isolated worktree.
Bind your actual owner/branch/worktree and verify no competing writer for the
literal paths before changing files. Repair only the allowed Time Alter
target/face-down legality contract. Preserve identity-free routing and atomic
rejection. Produce the real Origin Bullet replacement-to-play regression and
the required negatives, freeze one candidate and return its exact SHA, changed
paths, raw receipts and known gaps for fresh Reviewer B review. Do not claim
migration credit, Gate C or promotion.
