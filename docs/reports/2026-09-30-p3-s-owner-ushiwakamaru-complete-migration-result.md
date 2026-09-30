# P3-S Ushiwakamaru Owner-Complete Migration Result

Role: Codex S
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Date: 2026-09-30
Base: `3b3a57cc7c9e766f66d9349453c6f1703b3b8815`
Classification: formal owner-complete migration for `servant.ushiwakamaru`

## Accepted prerequisite

- readiness PR #493 exact Candidate `2cc5fe6a13d6519f564076c5e1b7897b062f513d`;
- verdict `IMPLEMENTATION_ACCEPTED_CANDIDATE`;
- canonical same-attempt relay `https://github.com/binchen648/fd/pull/493#issuecomment-5906025243`;
- A-sync/full-owner rescan `3b3a57cc7c9e766f66d9349453c6f1703b3b8815` confirms sc1 + sc2 are the only newly creditable identities and sc3 is preservation-only.

## Formal owner scope

One indivisible frozen owner set:

1. `servant.ushiwakamaru.skill.sc-ushiwakamaru-1` — newly creditable;
2. `servant.ushiwakamaru.skill.sc-ushiwakamaru-2` — newly creditable;
3. `servant.ushiwakamaru.skill.sc-ushiwakamaru-3` — preservation-only / already accounted by FM01/R26.

## Implementation

- Existing `data/authoring/servants/servant.ushiwakamaru.json` is completed to the full sc1 + sc2 + sc3 owner archive.
- Locked-reference static metadata is preserved: sc1 Power 3 / cost 3 / 力量+迅捷; sc2 Power 6 / cost 2 / 迅捷+宝具; sc3 existing canonical material unchanged semantically.
- Final servant skill-zone threshold is 8 for all three skills; historical requirement values remain evidence metadata only.
- sc1 separates canonical true-name declaration/reveal from the accepted exact source-bound cross-phase provider and one-shot used attack ability reuse shapes.
- sc1 unique reuse uses `ushiwakamaru-whirling-slashes` and consumes the accepted PR #493 generic capability without identity routing.
- sc2 separates canonical true-name declaration/reveal from the accepted exact strict-current-Power / atomic-redeployment shape.
- sc2 consumes the accepted current-Power projection, two-endpoint atomic occupancy preflight, durable terrain authority preservation, ordinary deployment reward, and destination deployment trigger behavior.
- sc3 is preserved exactly as the accepted source-play/basic-attack draw plus private optional low-Power hand-play family; no duplicate migration semantics or credit are introduced.
- The locked-development twelve-card starting deck is materialized as B1, B2, Q1x2, Q2x2, Q3, Q4, Surveilx2, Preparationx2.
- Ushiwakamaru is added to the canonical `fd-playtest-v1` authoring servant list immediately after Tristan.
- Generated content/evidence is refreshed deterministically.
- Base..Candidate production runtime delta under `packages/rules/src/**` is empty.

## Verification

- Ushiwakamaru formal owner-complete regression: `5/5 PASS`;
- Ushiwakamaru accepted readiness regression: `14/14 PASS`;
- complex skills regression: `38/38 PASS`;
- MatchSession regression: `33/33 PASS`;
- generic MatchSession regressions: `11/11 PASS`;
- focused/affected aggregate: **`101/101 PASS`**;
- canonical pack compile CLI: `4/4 PASS`;
- `npm run typecheck`: PASS;
- `npm run content:validate`: PASS — `7 masters / 15 servants / 20 events / 0 blocking issues`;
- `npm run content:compile`: PASS — same counts;
- `npm run verify:generated-content`: PASS;
- production runtime identity audit for Ushiwakamaru/card-name/legacy handler/SkillLib: CLEAN;
- `packages/rules/src/**` Base..working-tree runtime delta: EMPTY;
- `git diff --check`: PASS.

## Accounting boundary

Strict formal accounting remains `159/944`, remaining `785` until this exact formal Candidate receives `MIGRATION_ACCEPTED` and a subsequent A-sync/accounting transaction.

If accepted, exactly sc1 + sc2 may add credit: `159/944 -> 161/944`, remaining `783`. sc3 remains +0.
