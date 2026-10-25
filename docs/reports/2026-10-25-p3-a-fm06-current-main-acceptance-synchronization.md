# P3-A FM06 current-main acceptance synchronization

Role: Codex A accounting
Status: `SYNCHRONIZED`
Task: `P3-FM06` Presence Concealment authoring migration
Classification: owner-complete accepted 12-ID migration

## Exact evidence

- Current-main A-owned Base: `284731d8e24f30cf1d1794dd951f735cc2a98b4b`.
- Fresh Builder Candidate: `abd117976f496e134a0dd5617c42ddb7c3c0b53a`.
- Builder branch: `codex/s-p3-fm06-current-main-20261025`.
- Independent Reviewer report: `9c4320bdfb02e96815819b9a64c7f3296a069a28` on `codex/r2-p3-fm06-current-main-20261025`.
- Independent verdict: `MIGRATION_ACCEPTED`.

The accepted migration contains exactly twelve Presence Concealment authoring IDs and the FM05 Semiramis compatibility-test adjustment. It preserves the accepted FB2-02 deployment-resource, FB2-11 round-number, and FB2-12 Presence Concealment runtime dependencies. No runtime production, coverage, generated, taxonomy, task-index, governance, or unrelated servant changes are included.

## Accepted 12-ID set

`servant.corday.skill.sc-corday-1`, `servant.danzou.skill.sc-danzou-3`, `servant.hassan.skill.sc-hassan-1`, `servant.hassanhf.skill.sc-hassanhf-3`, `servant.hassanser.skill.sc-hassanser-1`, `servant.izou.skill.sc-izou-3`, `servant.jekyll.skill.sc-jekyll-3`, `servant.kama.skill.sc-kama-3`, `servant.kiritsugu.skill.sc-kiritsugu-1`, `servant.kotarou.skill.sc-kotarou-1`, `servant.semiramis.skill.sc-semiramis-1`, `servant.stheno.skill.sc-stheno-1`.

All twelve preserve frozen full-text SHA `29b3f6c71d8bc5eb6f004d930e5b753f44ee766fb2e47ea6b9f0d89f5fa9643f`, four F1 clause-source hashes, handler `core.presence-concealment`, Swift/cost 3/base Power 4/reference requirement 3, and final skill-zone gate 8. Semiramis retains the accepted FM05 Territory Creation card unchanged. Kiritsugu remains class Master; the other eleven remain Assassin. Sion EX is excluded.

## Verification receipt

- FM06 authoring: 4/4.
- FM05 compatibility: 4/4.
- FB2-02: 9/9.
- FB2-11: 7/7.
- FB2-12: 10/10.
- Combined focused: 34/34.
- Full CI: 118 files / 723 tests.
- Typecheck, content validation, generated determinism, and diff-check: passed.

## Accounting

This synchronization binds the independently accepted Candidate to the current-main lineage. It does not merge or modify the frozen Candidate.

- Before: `111 / 944 FULL`; remaining `833`.
- FM06 owner-complete migration credit: `+12`.
- After this A-sync: `123 / 944 FULL`; remaining `821`.
- New owner/skill credit this round: `+12`.

Formal accounting is now `123/944`; FM06 is not re-counted in later dependency materialization.
