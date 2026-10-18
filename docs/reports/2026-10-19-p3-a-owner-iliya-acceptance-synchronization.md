# P3-A Iliya Owner Migration Acceptance Synchronization

Date: 2026-10-19  
Task: `P3-S-OWNER-ILIYA-COMPLETE-MIGRATION`  
Classification: formal owner migration acceptance synchronization/accounting

## Exact accepted review

- Repository: `binchen648/fd`
- PR: `#569`
- Exact Base used by the independent review: `2adc423fe17a3ad0310cf18ca9152b0850b4163a`
- Exact accepted Candidate: `46fbae03d7e1c58e0e8623b26babc1d763cccd06`
- Verdict: `MIGRATION_ACCEPTED` (zero credit until this formal synchronization is integrated)
- Independent Reviewer: separate GPT-6 Sol session `/root/iliya_reviewer_r5`
- Independent worktree: `E:\Codex\FD\binchen648_fd\review-iliya-r5`
- Reviewer limitation: no `node_modules`; tests were not silently re-run. Builder evidence is reported separately.

The Reviewer accepted exactly the five frozen Iliya identities after verifying legacy/generated text and the explicit runtime boundary.

## Mechanical acceptance rescan

The Candidate contains exactly these five frozen identities in `data/authoring/masters/master.iliya.json` and registers the archive once in the active pack:

- `master.iliya.skill.ascension`
- `master.iliya.skill.s1`
- `master.iliya.skill.s2`
- `master.iliya.skill.s3`
- `master.iliya.skill.s4`

Generated content and evidence contain the same five identities. `s1` is the only fully executable capability: a loader-compatible `game_start`/`set_mana` effect raises starting mana from 4 to 6 under the exact card envelope. Ascension, `s2`, `s3`, and `s4` remain explicitly `HOST_ADJUDICATED` because the current engine has no first-class support for the required deck-removal, round-start, attack-cost/face-down, or prior-battle/shared-field state. No fake directive or automatic execution is claimed for those boundaries.

## Accepted verification

- Builder Iliya focused regressions: `13/13 PASS`;
- typecheck: `PASS`;
- content validation: `PASS`;
- content compile: `PASS`;
- generated-content verification: `PASS`;
- `git diff --check`: `PASS`;
- Reviewer static checks: legacy/generated locator and text equality, pack/evidence consistency, exact `s1` FULL gate, host-adjudicated gates for the remaining four skills, and no semantic changes to unrelated owners.

The independent Reviewer did not have dependencies installed and therefore did not rerun Builder commands. That limitation is preserved rather than converted into a false independent PASS.

## Formal accounting transaction

- Before synchronized frontier: `294/944`, remaining `650` (Hisui Detective A-sync frontier; PR #568 remains open);
- newly accepted Iliya frozen migration skills: `+5`;
- helper/preservation/shared-fixture credit: `+0`;
- after synchronized frontier: **`299/944`**, remaining **`645`**;
- Iliya owner migration: **`5/5` accepted** on this synchronized frontier.

This synchronization does not merge PR #569 or prior open synchronization PRs. Until the corresponding PRs are integrated into the formal mainline, the pre-sync mainline accounting remains `279/944`; this branch records the next auditable frontier `299/944`.

## Next-owner gate

The next owner must be derived mechanically from the frozen roster after this synchronization is integrated. No additional helper credit or informal acceptance is created here.
