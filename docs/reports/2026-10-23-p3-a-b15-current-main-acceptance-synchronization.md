# P3-A B15 Current-Main Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-10-23
Task: `P3-B15` / `P3-R09`
Classification: accepted identity-free runtime capability; zero migration credit

## Exact accepted evidence

- Exact Base: `e951d7cc86e031807f6dc3af7c029310bf1317c9` (B14 A-sync)
- Exact Builder Candidate: `90e72841ec58d4a5a670ef79333a2ba7d7c3e939`
- Builder branch: `codex/b-p3-b15-current-main-20261023`
- Independent Reviewer branch: `codex/r-p3-b15-current-main-20261023`
- Independent Reviewer report commit: `2fd7769eda2ddae625c02356b2d86683c787e127`
- Independent verdict: `MIGRATION_ACCEPTED`
- Reviewer report: `docs/reports/2026-10-23-p3-r09-b15-current-main-review.md`

The Reviewer independently used the exact Candidate and reported a clean worktree. Fresh evidence included:

- `npm ci`: exit 0;
- TypeScript typecheck: exit 0;
- focused B15 semantic/fail-closed tests: `7/7 PASS`;
- seven-file compatibility chain: `47/47 PASS`;
- additional Trigger/Card Zone/Card Action/Interaction regressions: `20/20 PASS`;
- fresh Chromium Gate C: `1/1 PASS`, covering phase-terminal ordering after all battlefield results, pre-cleanup source return, stable references, reconnect, stale rejection, and exactly-once re-entry.

The accepted scope is limited to Ereshkigal `sc-ereshkigal-2.return-to-skill-zone` and its identity-free typed phase-terminal source-card-to-controller-skill capability. It does not accept sibling TO14 consumers or inherit B13/B14 evidence in place of B15 evidence.

## Mechanical scope rescan

The Base-to-Candidate delta is confined to B15 terminal-event/source-card runtime, focused regression, dedicated B15 E2E/support fixture, and the implementation report. It does not modify `data/authoring/**`, packs, generated content, coverage/KPI/classifier policy, or governance. The fixture is test support only and leaves production authentication unchanged.

No canonical frozen authoring identity is added by this runtime capability. The current-main inventory remains `943 static + 1 dynamic = 944`, with accepted formal/material overlap unchanged at `111/944`; no duplicate or removal is introduced.

## Exact accounting

- Before: `111 / 944 FULL`; remaining `833`.
- B15 accepted capability credit: `+0`.
- After this A-sync: `111 / 944 FULL`; remaining `833`.
- New owner/skill credit: `0`.

This A-sync makes the accepted B15 Candidate the next exact formal Base for the next legal current-main task. It does not merge PRs, retarget branches, create a successor, or claim whole-repository CI green. The next implementation must use this A-sync commit as its Base and obtain a fresh independent Reviewer before any additional accounting.

