# P3-A R73 / FB2-34 Combat Reward Distribution Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-20

## Accepted review input

- Formal verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- Canonical reviewer evidence: `https://github.com/binchen648/fd/pull/378#issuecomment-5744013376`
- Redundant later accepted evidence: `https://github.com/binchen648/fd/pull/378#issuecomment-5744094298`
- Exact A dispatch Base: `44339c2ba405d2a4b798b53522e51e1fb11e4121`
- Accepted Candidate: `99032d4458352ecdee26dd8964b46ce4e094c0f3`
- PR: `#378`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

The canonical review comment binds exact PR/Base/Candidate and records `IMPLEMENTATION_ACCEPTED_CANDIDATE`. A second accepted comment exists for the same PR/Candidate; it is redundant evidence only and creates no second acceptance event or migration credit.

## A synchronization checks

A independently rechecked:

- synchronization worktree starts from exact accepted Candidate `99032d4458352ecdee26dd8964b46ce4e094c0f3`;
- `merge-base(Base, Candidate)` is exact Base `44339c2ba405d2a4b798b53522e51e1fb11e4121`;
- PR #378 remains OPEN, non-draft, CLEAN, unmerged, and unretargeted;
- PR base/head OIDs equal the exact Base/Candidate above;
- Locked Reference is clean at exact `b2f9fa15fba07c63530bbf4612b03b8b704755f9`;
- Base..Candidate changes exactly four authorized FB2-34 paths: result report, generic loader, combat resolver, focused test;
- no consumer authoring migration, generated product, `data/phase3`, taxonomy/KPI, app migration, merge, or retarget is included.

FB2-34 therefore has zero frozen migration delta. Formal migration accounting remains `136/944`, with `808` remaining.

## Accepted capability envelope

Accepted FB2-34 capability is limited to the exact identity-free static passive reward-distribution semantic:

- `operation = replace`;
- `rule = combat_reward_distribution`;
- scope exactly `{ subject: "controller", whenControllerWins: true, mode: "full_reward_each" }`;
- active only from an authoritative physical source controlled by a winner, in `field` or `attack_area`, runtime-active and face-up;
- raw authoring and canonical compiled forms are both validated fail-closed;
- the modifier changes only winner-count split distribution for shared event, competition, and location VP pools;
- winner selection, Power, exclusions/defeat, military settlement, individual bonuses, lifecycle, and unrelated modifier families are unchanged;
- duplicate qualifying modifiers are idempotent; sole-winner behavior is neutral;
- no Stheno/Napoleon identity routing or Reference/F1 hash routing is accepted.

## Independent evidence

Canonical accepted review records fresh verification on exact Candidate including:

- typecheck PASS before focused Vitest;
- focused FB2-34 `1 file / 7 tests PASS`;
- rules core + regression + focused `79 files / 489 tests PASS`;
- official CI `148 files / 1039 tests PASS`;
- content validation `7 masters / 7 servants / 20 events / 0 blocking issues`;
- generated-content determinism PASS with unchanged hashes;
- Locked Reference verification PASS at exact locked commit;
- client production build PASS with only the existing Vite `node:crypto` browser-externalization warning;
- `git diff --check` PASS;
- production identity/hash/handler audit PASS;
- reviewer and Candidate worktrees clean;
- previous Candidate `996e7a7c5b294f4d6208ca7ec473d0ef6adccf27` blocker is closed by exact Candidate `99032d4458352ecdee26dd8964b46ce4e094c0f3`.

## Formal accounting after synchronization

Formal migration accepted remains **`136/944`**, with **`808`** remaining.

FB2-34 is B2 capability infrastructure and earns zero migration credit. PR #378 remains OPEN, unmerged, and unretargeted. Historical `P3-FM09-RECOVERY` remains `MIGRATION_BLOCKED` absent new formal evidence.

## Next coordinator action

Run the promised immediate closure re-overlay for `servant.stheno.skill.sc-stheno-2`. If its previously identified sole formal capability gap is now closed and no new dependency is found, dispatch S migration immediately rather than selecting another unrelated B2 seam.
