# P3-A B17 Current-Main Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-10-23
Task: `P3-B17` / `P3-R11`
Classification: accepted current-lineage recertification; zero migration credit

## Exact accepted evidence

- Exact Base: `0d2ca44c702bde8c7a2ad8c1d4a81f6ed16e8cb7` (B16 A-sync)
- Exact Builder Candidate: `41088a383b343a04cc9f2c51f17b057db43d5367`
- Builder branch: `codex/b-p3-b17-current-main-20261023`
- Independent Reviewer branch: `codex/r-p3-b17-current-main-20261023`
- Independent Reviewer report commit: `5cd4187b33888d4ce5caebe0ae833551b68c5a8c`
- Independent verdict: `MIGRATION_ACCEPTED`
- Reviewer report: `docs/reports/2026-10-23-p3-r11-b17-current-main-review.md`

The Reviewer independently used the exact Candidate and reported a clean worktree. Fresh scoped evidence included:

- `npm ci`: exit 0;
- TypeScript typecheck: exit 0;
- B17 focused/Card Action: `11/11 PASS`;
- B13/B14/B15/B16/Trigger/Lifecycle compatibility: `46/46 PASS`;
- fresh Olga Chromium Gate C: `1/1 PASS`, covering scoring → barrier → first-loss ordering, round-end typed activation exactly once, scoring-eliminated eligibility, projection, reconnect, stale rejection, and no duplicate target-card activation.

The review also ran full CI after dependency installation: Base and Candidate both exited 1 with the same `6` failed files / `8` failed tests / `1,508` passed tests / `114` skipped. The report preserves this red full-suite result and does not claim whole-repository green; the Candidate delta is limited to E2E/support/report and has no production runtime diff.

This synchronization accepts only the existing Olga first-loss direct-consumer recertification on the current B13–B16 lineage. It adds no canonical identity and does not inherit acceptance for any sibling TO14 consumer.

## Mechanical scope rescan and accounting

The Base-to-Candidate delta contains only B17 recertification assertions, dedicated E2E/support fixture, and the report. No `data/authoring/**`, packs, generated content, coverage/KPI/classifier policy, or production runtime was changed.

- Before: `111 / 944 FULL`; remaining `833`.
- B17 recertification credit: `+0`.
- After this A-sync: `111 / 944 FULL`; remaining `833`.
- New owner/skill credit: `0`.

This A-sync makes the accepted B17 recertification Candidate the next exact formal Base for B18. It does not merge PRs, retarget branches, create a successor, or claim full-suite green. The next implementation must use this A-sync commit as its Base and obtain a fresh independent Reviewer before any additional accounting.

