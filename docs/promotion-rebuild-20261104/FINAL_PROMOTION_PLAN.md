# Final Promotion Plan

## Locked baseline

origin/main was fetched and locked at e63cdeb2a065a9f87c24039d2b08bbe059513fed. The audit worktree is detached from the user's dirty worktree and no historical PR was merged.

## Proposed final PRs (not created because blocked)

| Proposed PR | Source | Intended scope | Dependencies | Current state |
|---|---|---|---|---|
| Promotion: public seven-player entry | PR #689 | client/server hosted entry, safe invitations, focused tests and e2e | current main only; server reservation must be released | BLOCKED by A-RECOVER-04 reservation |
| Promotion: seven-roster repair | PR #690 | runtime repair + authoritative master/servant data + acceptance/regression tests | current main only; runtime reservation and independent review | BLOCKED by A-RECOVER-04 reservation; requires fresh replay |

No Runtime PR, Content PR, Master/Data PR, or Integration PR is opened in this run because the only exact-current-main candidates overlap a granted runtime writer reservation. Opening placeholder PRs would create duplicate/repackaged history and would not be independently promotable.

## Required release sequence

1. Release or re-scope A-RECOVER-04 in the reservation manifest.
2. Re-run semantic replay from e63cdeb2a065a9f87c24039d2b08bbe059513fed, extracting implementation commits rather than cherry-picking complete historical PRs.
3. Split only at real dependency boundaries; keep coupled runtime/data/integration changes together when splitting would create an invalid intermediate state.
4. Run Build/Test/Policy/Promotion checks and obtain an exact-HEAD independent review for each candidate.
5. Create one Promotion PR per accepted Slice targeting main; stop before merge.

## Explicit semantic blockers

- Altera/Arthur magic-resistance: typed ability with empty effects cannot be promoted until the set_opponent_power_to_zero primitive is formally admitted; do not route through legacy behavior.
- Arthur: authoritative source must be independently verified before replay.
- Abigail: missing SC3a input is a hard evidence block; do not invent or infer the ability.
