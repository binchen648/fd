# P3-A Ushiwakamaru Owner Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-30

## Accepted formal input

- PR: `#494`
- Exact Base: `3b3a57cc7c9e766f66d9349453c6f1703b3b8815`
- Exact accepted Candidate: `ad7d506e405faead4c7a037643a7aca14f8bfeed`
- Verdict: `MIGRATION_ACCEPTED`
- Canonical same-attempt Coordinator relay: `https://github.com/binchen648/fd/pull/494#issuecomment-5906305747`
- Phase 3 Pre-Review Gate: run `36683022622` / job `109782489671` — `SUCCESS`

Reviewer-side GitHub publication returned explicit HTTP 403. Coordinator published one bounded same-attempt relay. No duplicate review was used.

## Owner accounting

Frozen owner scope remained exactly:

1. `servant.ushiwakamaru.skill.sc-ushiwakamaru-1` — newly creditable;
2. `servant.ushiwakamaru.skill.sc-ushiwakamaru-2` — newly creditable;
3. `servant.ushiwakamaru.skill.sc-ushiwakamaru-3` — preservation-only / already accounted by accepted FM01/R26.

The exact accepted formal Candidate materialized the complete owner archive, locked-development 12-card deck, canonical pack integration, and consumed the already accepted PR #493 generic readiness capability without adding owner-name runtime routing.

Accepted migration credit is therefore exactly `+2` (sc1 + sc2). sc3 receives `+0` duplicate credit.

Strict formal accounting moves:

- before: `159/944`, remaining `785`;
- after: **`161/944`**, remaining **`783`**.

## Verification carried forward

- owner-complete focused regression: `5/5 PASS`;
- accepted readiness regression: `14/14 PASS`;
- complex skills: `38/38 PASS`;
- MatchSession: `33/33 PASS`;
- generic MatchSession regressions: `11/11 PASS`;
- focused/affected aggregate: `101/101 PASS`;
- canonical pack compile CLI: `4/4 PASS`;
- `FD_TOOLCHAIN_OK`;
- typecheck PASS;
- content validate/compile PASS: `7 masters / 15 servants / 20 events / 0 blocking issues`;
- generated-content determinism PASS;
- Base..Candidate production runtime delta EMPTY;
- production Ushiwakamaru identity-routing audit CLEAN;
- `git diff --check` PASS.

## Next owner

Mechanical frozen-roster order after Ushiwakamaru selects `servant.valkyrie`.

Exact frozen scope:
- `servant.valkyrie.skill.sc-valkyrie-1`
- `servant.valkyrie.skill.sc-valkyrie-2`
- `servant.valkyrie.skill.sc-valkyrie-3`

Next legal FORMAL task is owner-readiness-first for the complete Valkyrie frozen scope. No Valkyrie migration credit exists from this A-sync.
