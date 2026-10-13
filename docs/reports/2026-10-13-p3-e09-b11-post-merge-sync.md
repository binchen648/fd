# B11 Post-Merge Synchronization

Observed main: 219d47c8dcc2b8118f2d3f6b37f51ce465e737cb
PR: https://github.com/binchen648/fd/pull/559
Promotion head: 3ec8b5393118b2b250eacd044dfd18ec098662cb

Artifact: artifacts/phase3-e09-b11-post-merge-sync.json
Artifact SHA-256: 98EFF40A739F395DDEB6C7FCF909F30971A1F49548C7B77E83A982DE0BC66F82

Status: READY_FOR_REVIEW_POST_MERGE_SCOPE_ONLY

- Actual merge parents, candidate/RA/G/sync ancestry, exact evidence hashes and preserved Epoch 09 controls verified.
- Accepted carrier, promotion head and observed main have identical runtime/client/server/content/config source objects.
- Fresh read-only coverage: 22/144/3/0/112 -> 23/144/3/0/111 (new/legacyResolve/legacyExecute/dual/notClassifiable). Raw +1 is NOT new formal credit.
- Frozen identity list and accounting artifacts unchanged: 111/944; remaining 833; duplicates 0. A111/A112 execution verdicts are not inherited.
- Executable pack compilation: 76 cards, 14 characters, 0 blocking issues; hash 68c578e7575ff649b1b54a6532b105e3e93d6e5f7f9910b607958bf54a4ea7ce.
- GitHub post-merge Test: 194 files; 1606 passed, 1 skipped (1607 total). Build, policy and deploy succeeded at the exact observed main. Raw API responses and full test log are hash-bound in artifacts/phase3-e09-b11-post-merge-github-observations.json.
- No local full CI/browser rerun, no new runtime semantic acceptance.
- Main coverage/migration/denominator credit deltas: 0/0/0.
- Historical failures remain unchanged. Global Gate C NOT_VERIFIED; 93 missing-image Release blockers retained, not reaudited; long-term stability unverified.
- No reservation release by A. Reviewer A reviews this synchronization before Planner closes B11.

Reproduction: run this script with --baseline-root pointing to a clean detached 1d0e102c1ff43c272dc5ccfb2871eda48a5f52ce checkout. --validate compares complete artifact/report bytes using committed GitHub observations; no moving origin/main requirement.
