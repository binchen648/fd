# P3-A Darnic Owner Acceptance Synchronization

Date: 2026-10-07
Task: `P3-S-OWNER-DARNIC-COMPLETE-MIGRATION`
Classification: formal owner migration acceptance synchronization/accounting

## Exact accepted review

- PR: `#541`
- Base: `f6376feb3e3b615db4264fc51349ca0d4efc06ba`
- Accepted Candidate: `d40eb77b1480fa334688f0a5c1377ca0531c7704`
- Verdict: `MIGRATION_ACCEPTED`
- ReviewJobKey: `pr541:d40eb77b1480fa334688f0a5c1377ca0531c7704:blocked-retry-1`
- Canonical evidence: `https://github.com/binchen648/fd/pull/541#issuecomment-6031672772`
- Exact-head Phase 3 Pre-Review Gate: run `37539080811` = `SUCCESS`.
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.

## Blocked-retry closure

The predecessor review attempt was blocked only because the official coverage/audit commands wrote two tracked Reviewer artifacts. The fixed Reviewer recovery/output policy was then applied: both CLIs were source-inspected, their supported `--out` behavior was used to write evidence outside every Git workspace, and the fixed Reviewer remained clean at the same exact Candidate. No Darnic code finding existed in the blocked attempt.

Fresh retry independently confirmed the same Base/Candidate lineage, exact frozen Darnic scope, locked Reference behavior, clean Reviewer state, external-output coverage/audit, and all affected regressions before returning `MIGRATION_ACCEPTED`.

## Mechanical acceptance rescan

Exact Base contains no canonical `master.darnic` authoring archive (`0/3`). Accepted Candidate contains exactly the complete frozen three-identity owner scope (`3/3`):

- `master.darnic.skill.s1`
- `master.darnic.skill.s1a`
- `master.darnic.skill.ascension`

Canonical Darnic pack registration is exactly once and immediately after Dan. Darnic initial mana is `4`; ascension remains `outside_game` with exact `力量 / cost 8 / requirement 8 / power 9` metadata. Production runtime remains free of Darnic identity/name routing.

The accepted consumer routes preserve the previously accepted identity-free readiness semantics from PR #540: unclaimed battlefield terrain, optional post-win `set_mana=4`, mana<=2 round-end `-2 VP`, exact `2 VP` same-battlefield terrain upkeep or terrain release, and current-round terrain doubling.

Independent exact-Candidate verification passed `140/140` affected tests, typecheck, content validation at `21 masters / 19 servants / 20 events / 0 blocking issues`, generated determinism, exact-head GitHub pre-review gate, external-output Phase-3 coverage/audit, production identity/text audit, and `git diff --check`. The historical source-assets debt remains exactly `93` missing images with no Darnic hit.

## Accounting

Strict accounting advances lawfully:

- before: `250/944`, remaining `694`;
- newly accepted Darnic migration credit: `+3`;
- after: `253/944`, remaining `691`.

No readiness credit is recounted.

## Next-owner gate

Owner change is not authorized from chat memory alone. Before selecting the next owner, FORMAL must read the fixed HELPER report and mechanically re-derive stable owner order / complete remaining frozen scope from the exact acceptance-sync Base. The HELPER report remains preparatory evidence only and cannot grant acceptance or credit.
