# P3-A Maiya Owner Migration Acceptance Synchronization

Date: 2026-10-19
Task: `P3-S-OWNER-MAIYA-COMPLETE-MIGRATION`
Classification: formal owner migration acceptance synchronization/accounting

## Exact accepted review

- Repository: `binchen648/fd`
- PR: `#597`
- Exact Base: `870b8bb2ce7ad9876b3fb614dfabb0dca7315eda`
- Accepted Candidate: `52a736f3e630e7f4a4e8559a07ae4fb6248f092d`
- Parent: `870b8bb2ce7ad9876b3fb614dfabb0dca7315eda`
- Verdict: `MIGRATION_ACCEPTED` (static independent review; zero credit until this formal synchronization is integrated)
- Independent Reviewer: separate GPT-6 Sol session `/root/kirei_reviewer`
- Independent worktree: `E:\Codex\FD\binchen648_fd\review-maiya`
- Reviewer limitation: no `node_modules`; tests were not silently re-run. Builder evidence is reported separately.

## Frozen owner scope

The Candidate contains exactly these three frozen Maiya identities in the canonical archive and active pack:

- `master.maiya.skill.ascension`
- `master.maiya.skill.s1`
- `master.maiya.skill.s2`

Independent review confirmed exact inventory printed text, source locators, owner IDs and all three source SHA values. The legacy `military`/`deck.support-shot` identities and excluded ascension are preserved as explicit evidence. Pack, generated content/evidence and sourceMap references are unique. All three use `record_master_directive` only and remain `HOST_ADJUDICATED`; no automatic or `FULL` behavior is claimed.

## Accepted verification

- Builder focused regressions: `4/4 PASS`;
- typecheck: `PASS`;
- content validation/compile: `PASS`;
- generated determinism: `PASS`;
- `git diff --check`: `PASS` on Builder and independent Reviewer worktrees;
- Reviewer static checks: exact text/hash equality, legacy mapping evidence, pack/sourceMap/generated/evidence consistency, host-adjudicated boundary and clean worktree.

The independent Reviewer did not have dependencies installed and therefore did not rerun Builder commands. That limitation is preserved rather than converted into a false independent PASS.

## Formal accounting transaction

- Before synchronized frontier: `355/944`, remaining `589` (Leonardo A-sync frontier; PR #596 remains open);
- newly accepted Maiya frozen migration skills: `+3`;
- helper/preservation/shared-fixture credit: `+0`;
- after synchronized frontier: **`358/944`**, remaining **`586`**;
- Maiya owner migration: **`3/3` accepted** on this synchronized frontier.

This synchronization does not merge PR #597 or prior open synchronization PRs. Until the corresponding PRs are integrated into the formal mainline, the pre-sync mainline accounting remains `279/944`; this branch records the next auditable frontier `358/944`.

## Next-owner gate

The next owner must be derived mechanically from the frozen roster after this synchronization is integrated. No additional helper credit or informal acceptance is created here.
