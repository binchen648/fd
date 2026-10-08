# P3-S Goredolf Owner-Complete Migration Candidate

Date: 2026-10-09
Task: `P3-S-OWNER-GOREDOLF-COMPLETE-MIGRATION`
Owner: FORMAL
Classification: owner-complete frozen consumer migration
Base: `45945303b1535e7e661af6014ca1132ca3e40459` — accepted readiness zero-credit A-sync
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Accepted readiness: PR #555, Candidate `0c63e26e7e511b5a1660e65080eafdd8c01906c3`, evidence https://github.com/binchen648/fd/pull/555#issuecomment-6064675657

## Exactly frozen owner scope

- `master.goredolf.skill.s1` — 铁腕绅士: replace the two highest printed-Power basic attacks in controller's deck with two physical Gof Fist cards, deterministic tie order.
- `master.goredolf.skill.s1a` — 愚者的决意: preparation/outpost +2 round Power, battlefield-only deployment and round movement lock, trusted battle defeat -2 VP.
- `master.goredolf.skill.ascension` — 别掉队了！: +6 Gof Fist Power, trusted victory with current-round Foolish Resolve subtracts 2 VP from each loser.

Gof Fist `card.card-gof-fist` is an auxiliary physical basic-attack definition, **not a fourth frozen master-skill credit**. It has exact printed base Power 2 and two interactive semantics:
- one unique authenticated win reward of +4 VP only for a face-up active physical Fist source on a winning controller, with protection against duplicate active-copy rewards;
- combat action to choose one other controller-owned Fist from hand, discard it and double the selected active source's Power, with exact target selection and an anti-repetition gate.

The content archive `data/authoring/masters/master.goredolf.json` contains these three skill identities and this one physical Gof Fist card; the canonical active pack registers that archive once. Generated content files have been deterministically recompiled. The locked Reference supplies the owner/card metadata and card text; the development master image locator follows the Reference metadata. A distinct Gof Fist source-image file path was not independently established.

## FORMAL implementation evidence — not independent acceptance

- Real owner archive Goredolf regression: `9/9 PASS`, including physical win reward, duplicate-copy suppression, legal player choice, unrelated-card rejection and repeated-action prevention.
- Accepted identity-free readiness regression: `5/5 PASS`.
- Shared selected tests: core movement `3/3`, complex skills `38/38`, MatchSession `34/34`.
- Total selected affected: `89/89 PASS` across five test files.
- `npm.cmd run typecheck`: PASS.
- `npm.cmd run content:validate`: PASS — 26 masters, 19 servants, 20 events, zero blocking issues.
- `npm.cmd run verify:generated-content`: PASS after intentional generated-content refresh. Output SHA256: library `4b0044bbff90cfb2bd3c61583d131e267f2fbd6498f633f0a75378dc454cb0e6`; fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`; evidence `d8c5c5e8c5bafa27f4dfe6d5494ebcb88af2f2f3951ed690776f9a977d11f378`.
- `phase3:coverage` with unique external `--out`: PASS — archives=130, cards=309, abilities=543, compiledCards=249, compiledCharacters=45, blockingIssues=0, legacyExecuteAbility=3, legacyResolveEffect=165, notClassifiable=353, taxonomyWarnings=361.
- `phase3:automation-audit` with unique external `--out`: PASS — promotionFindings=20 still disclosed.
- External FORMAL reports:
  - `E:\Codex\FD\.fd-runner-review-evidence\formal-goredolf-owner-complete-45945303\phase3-skill-coverage.json`
  - `E:\Codex\FD\.fd-runner-review-evidence\formal-goredolf-owner-complete-45945303\phase3-a02-automation-audit.json`

Historical broader `test:ci` from PR #555 was not green (replay initialization, M50-02, Tamamo, historical counts, timeouts); its failure causes were not independently classified and are not claimed fixed. This Candidate has NOT received fresh independent owner review. The above tests are FORMAL implementation checks only.

## Formal gate and accounting

- Accounting before independent owner migration acceptance: **270/944**, remaining **674**.
- This Candidate adds **+0** until fresh exact `MIGRATION_ACCEPTED` followed by FORMAL A-sync.
- Maximum later lawful increment for this single owner: exactly `+3`, advancing `270/944 -> 273/944`, remaining `671`.
- Submit exactly one PR and one fresh independent Reviewer against the exact pinned Base and frozen Candidate. Do not merge/retarget, do not reset/discard dirty work, and do not claim F5 closure.
