# P3-A Voyager Owner Readiness Capability Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-30

## Accepted input

- PR: `#499`
- Exact Base: `b4dbc40e4ecd48da82f6304b427811b24c00f68c`
- Exact accepted Candidate: `c0e0fb4f506145a2a93a3ce330fdd9cef3fd6aa8`
- Canonical fresh-R same-attempt bounded relay: `https://github.com/binchen648/fd/pull/499#issuecomment-5913743850`
- Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- ReviewJobKey: `pr499:c0e0fb4f506145a2a93a3ce330fdd9cef3fd6aa8`
- Exact-Candidate Phase 3 Pre-Review Gate: run `36730891403` / job `109939873769` — `SUCCESS`

Reviewer transport failed only at GitHub comment write with explicit 403. FORMAL published the bounded same-attempt relay above and mechanically re-read the exact Base/Candidate/verdict from the real issue comment. No duplicate exact-Candidate review was performed.

## Accepted readiness scope

The accepted zero-credit readiness transaction closes the complete currently discoverable Voyager owner readiness/capability batch for frozen scope:

1. `servant.voyager.skill.sc-voyager-1` — exact entering-player outside-game matching-definition provisioning plus global optional reveal and per-revealer +2 VP authority;
2. `servant.voyager.skill.sc-voyager-2` — bounded matching/face-down hand extra-play through normal play semantics plus all-player hand reveal and matching-player attack suppression;
3. `servant.voyager.skill.sc-voyager-3` — exact opponent discard reveal, optional all-or-none free play-all matching set, and conditional bounded 2 VP transfer;
4. `servant.voyager.skill.sc-voyager-4` — generated-card controller + generator-owner deduplicated +6 Power provenance, exact restore validation, battle-end return to generator owner discard, and consumed-authority retirement.

The accepted successor also closes both predecessor P1 findings: generated-card controller provenance is sealed and exact-recipient checked; matching-definition pending continuations revalidate exact controller plus live active/face-up source both during restore and dispatch.

## Full-owner A-rescan

FORMAL mechanically re-read the frozen owner scope, current canonical authoring, accepted readiness Candidate, Task Index, full-roster inventory/rule-decision records, and repository-wide `data/authoring/**` identities after acceptance.

- frozen Voyager owner scope is exactly sc1 + sc2 + sc3 + sc4;
- no canonical `data/authoring/servants/servant.voyager.json` exists in the accepted lineage;
- repository-wide `data/authoring/**` contains none of `servant.voyager.skill.sc-voyager-1` through `sc-voyager-4`;
- therefore all four frozen Voyager identities remain newly creditable in the later formal owner-complete migration; there is no preservation-only duplicate item;
- accepted readiness covers the complete currently discoverable owner-local runtime pressure set for the four skills, including outside-game definition provenance, private reveal decisions, bounded multi-card play, all-player hand reveal/Power suppression, discard reveal/free-play transactionality, conditional VP transfer, generated-card dual-recipient Power authority, restore fail-closed validation, and battle-end source return/cleanup;
- production runtime remains structural and identity-free; the accepted Candidate contains no Voyager/card-name/printed-text/legacy `core.voyager-*` routing in `packages/rules/src/**`;
- no additional currently discoverable Voyager owner-local readiness gap is discovered by this post-acceptance rescan.

Therefore the next legal FORMAL task remains on the same owner: one owner-complete Voyager consumer migration covering frozen sc1 + sc2 + sc3 + sc4 together.

## Verification / accounting

Accepted successor evidence remains:

- Voyager readiness focused `10/10 PASS`;
- complex-skills regression `38/38 PASS`;
- MatchSession regression `33/33 PASS`;
- MatchSession regressions `11/11 PASS`;
- affected total `92/92 PASS`;
- `FD_TOOLCHAIN_OK`;
- typecheck PASS;
- content validate/compile PASS: `7 masters / 17 servants / 20 events / 0 blocking issues`;
- generated-content determinism PASS;
- `data/authoring/**` Base..Candidate delta EMPTY;
- production identity audit CLEAN;
- `git diff --check` PASS.

Readiness remains permanently zero-credit. Strict formal accounting remains **`166/944`**, remaining **`778`**.

## Next task

`P3-S-OWNER-VOYAGER-COMPLETE-MIGRATION`

Formal owner scope is the exact frozen sc1 + sc2 + sc3 + sc4 set. All four remain newly creditable only after exact formal `MIGRATION_ACCEPTED` plus A-sync/accounting.