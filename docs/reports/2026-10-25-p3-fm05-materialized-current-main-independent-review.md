# P3-FM05 materialized current-main independent review

Verdict: **MIGRATION_ACCEPTED** for exact materialized Base `c2df64f2cee72652a610ac5aec4f478fafbbc1f3` and final Candidate `e093616a45adb56533ed6ff12804de177f369f4c`.

This is a fresh review of the rebuilt Candidate, not acceptance of the earlier `d5c7f714` → `29d6b91b` pair, which lacked the FB2-11 runtime dependency. Separate exact-Base and Candidate worktrees were used. The materialized Base adds only the independently accepted FB2-02 and FB2-11 production/test deltas plus A's dependency report to `d5c7f714`; its accepted test blobs match the reviewed Candidates. No FM03/FM04, generated, coverage, taxonomy, or unrelated file is included in that materialization.

The FM05 Base→Candidate delta contains exactly ten new servant archives, the focused test, and Builder receipt. The card IDs match the A handoff's frozen ten-ID list exactly: Anastasia, Andersen, Avicebron, King Gilgamesh, Lady Avalon, Maxwell, Mephistopheles, Mozart, Semiramis, and Shakespeare. There is no FM05 runtime, generated, coverage, other-servant, or F1 authoring change. Lady Avalon remains Pretender and Semiramis Assassin.

Across all ten, independent SHA-256 recomputation confirms the frozen full printed-text hash `295a5b531db5d1031cbbb89dc677e76737b7d3b3c7ca70af59405cc84bd98c58` and both clause hashes `a65ce56a69bba9214eba95ab30154209228bcd28f7fec21f6317c8a70f421847` / `2137380f5f57233a98494f45a9d12a848f3d1cf710101c60462c523ea3f1624f`. The Reference legacy-content at `b2f9fa15fba07c63530bbf4612b03b8b704755f9` independently matches each card's exact text, cost 0, historical basePower 2, and 魔术 type label. Each archive declares the final 8-mana skill-zone requirement. The only executable clauses are the accepted controlled `add(16, multiply(-2, game.round_number))` formula and FB2-02 Magic Workshop controller deployment reward of +1 mana/+2 VP; no identity route is added.

Independent execution of all ten archive loaders returned `report=[]`. `calculateCardPower` on each archive yielded 14/8/2/0 at rounds 1/4/7/8. The final focused test now persists loader-empty and execution assertions; the FB2-02/FB2-11 compatibility tests also pass. The Builder receipt's test counts are accurate for the final Candidate.

| Check | Independent result |
| --- | --- |
| `npm ci` and typecheck | pass in both worktrees |
| FM05 + FB2-02 + FB2-11 focused | 4 + 9 + 7 = 20/20 pass |
| `content:validate` | pass: 7 masters, 7 playtest servants, 20 events, 0 blocking; separate FM05 loader/execution checks above cover the ten new archives |
| Generated-content determinism | pass; unchanged content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`, fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`, evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3` |
| `git diff Base..Candidate --check` | pass |
| Standard full CI, sequential Base then Candidate | Base 116 files / 709 tests pass; Candidate 117 files / 713 tests pass; zero failures |
| Unfiltered `npm test`, sequential Base then Candidate | Base 814 total / 794 pass / 20 fail; Candidate 818 / 798 / 20; failed-test identities exactly equal |

The 20 unfiltered failures are unchanged external source-image/CHM path-existence checks in other authoring/playtest suites; they are not an FM05 regression. This Reviewer performed no A-sync, migration credit, merge, or successor promotion.
