# P3-A R51 / FB2-25 Game-Start Fixed Set-Mana Acceptance Synchronization

Date: 2026-09-18
Role: Codex A
Status: `SYNCHRONIZED`
Credit: `0` frozen F1 identities; runtime capability acceptance only

## Exact accepted lineage

- Post-R50 recovery baseline: `fa27e9b132990a6fde164b8806443c533383375f` / accepted `115/944`.
- FB2-25 A dispatch Base: `c04e42ea8d002e974f8965218f915d642fe26ea5`.
- Accepted B2 Candidate: `101cb0d4e3fbd105cfadafda26585b3825616fe1`.
- R51 verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`; blocking findings none.
- Fresh reviewer worktree: `E:\Codex\FD\fd-r51-review-fresh-20260918`.
- PR #362 remains OPEN, non-draft, stacked on exact Base `c04e42ea...`, head `101cb0d4...`, and was not merged or retargeted during review.

A rechecked Candidate direct parent and PR topology before synchronization. Candidate, reviewer, Base dispatch, and locked Reference are clean at their exact SHAs. Base-to-Candidate scope is exactly the interpreter seam, its regression test, and the B2 result report. There is zero authoring/pack/generated/app/script identity material.

## Accepted capability boundary

R51 independently accepts one identity-free fail-closed composed parent semantic:

- ability kind is `forced_trigger`;
- activation is exactly `{ trigger: "game_start" }`;
- execution is automatic with no host operations;
- effects contain exactly one accepted FB2-05 fixed-controller literal `set_mana` node;
- conditions, targets, cost, creates, rule modifiers, lifecycle, visibility, and limits are empty;
- response metadata may contain only the existing default `turn_order / decline_this_window` values.

Near matches fail closed, including wrong/extended activation, conditions/targets/cost/creates/modifiers/lifecycle/visibility/limits, multiple effects, non-controller or non-literal set amounts, non-default response semantics, host authority, and non-automatic execution.

Reviewer-only runtime probes independently verify exact assignment at amounts 3 and 6, typed `mana_adjusted` evidence for non-zero changes, no effect on the other player, same-value no-op, event-id replay idempotency, and transactional rollback for an over-cap target.

Production runtime remains identity-free: R51 finds no Iliya/Taiga/name/text/Reference-handler routing in `packages/rules/src/**`.

## F1 consumer boundary

R51 independently re-scans the frozen 944 inventory. The exact future consumers whose complete semantic axes fit this newly accepted parent envelope are only:

- `master.iliya.skill.s1` — game.started -> SET_MANA 6;
- `master.taiga.skill.s1` — game.started -> SET_MANA 3.

`master.zouken.skill.s1` is not covered because it additionally carries game-duration Mana-capacity mutation. Shirou/Tiamat initial-Mana wording is also outside this envelope because those rows use different lifecycle/modifier semantics.

This consumer list is planning evidence only. It is not migration acceptance and does not itself authorize frozen credit.

## Fresh R51 validation recorded

- `npm ci --offline`: PASS, 239 packages, 0 vulnerabilities;
- typecheck: PASS;
- focused FB2-25/05/14/15: `4 files / 29 tests PASS`;
- content validate / compile: PASS;
- generated determinism: PASS;
- locked Reference verify: PASS at `b2f9fa15...`;
- full CI: `135 files / 875 tests PASS`;
- rules core + regression: `74 files / 456 tests PASS`;
- client production build: PASS;
- phase3 coverage: `103 archives / 138 cards / 241 abilities`, compiled `73/14/0`;
- automation audit: `133/3/83/20`;
- `git diff --check`: PASS.

## Frozen accounting and coordination effect

Frozen denominator remains `944`. Base and Candidate material overlap are both `115/944`, with zero additions, removals, or duplicate canonical authoring IDs. Therefore recovery-line accepted overlap remains **`115/944 = 12.18%`**, leaving **`829/944`**. Integrated `origin/main` remains `553779e8ffcc926ae4763ee86a2ea937e090c128` / accepted `111/944`.

This synchronization accepts FB2-25 as runtime infrastructure only. It does not merge or retarget PR #362, does not migrate Iliya or Taiga, and does not unblock or dispatch FM10. The next legal coordinator action is a fresh feasibility/source-grounding check for exactly Iliya s1 and Taiga s1 against the now accepted composed runtime boundary.
