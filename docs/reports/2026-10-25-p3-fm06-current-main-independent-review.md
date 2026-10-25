# P3-FM06 current-main independent review

Verdict: **MIGRATION_ACCEPTED**.

## Exact lineage and scope

- Base: `284731d8e24f30cf1d1794dd951f735cc2a98b4b`.
- Candidate: `abd117976f496e134a0dd5617c42ddb7c3c0b53a` (`codex/s-p3-fm06-current-main-20261025`).
- This independent review used a separate Reviewer worktree and a detached exact-Base worktree. The Candidate changes eleven new servant archives and Semiramis's existing archive, adds one FM06 focused test and a Builder report, and updates one frozen FM05 compatibility test. It changes no runtime, coverage, generated content, task index, governance, or unrelated servant data.

## Contract findings

- The exact twelve members are Corday, Danzou, Hassan, Hassan of the Hundred Faces, Hassan of the Cursed Arm, Izou, Jekyll, Kama, Kiritsugu, Kotarou, Semiramis, and Stheno. Sion EX is excluded. Kiritsugu remains a Master; the other eleven remain Assassins.
- Independently recomputed full printed-text SHA-256 for all twelve: `29b3f6c71d8bc5eb6f004d930e5b753f44ee766fb2e47ea6b9f0d89f5fa9643f`. Each of the four printed clauses also matches its declared frozen F1 clause hash. Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9` confirms each linked skill's printed text, Swift type, cost 3, base Power 4, and requirement 3; migration taxonomy maps all twelve to `core.presence-concealment`. Each new skill has the final skill-zone requirement 8.
- Each authored ability uses the accepted FB2-12 identity-free Presence Concealment shape: active-source optional combat response after battle power calculation, strict second battle power, post-power response and one use per round, and defeat of highest-power opponents. No runtime or identity-specific route was added.
- Semiramis's pre-existing FM05 Territory Creation card is byte-for-byte equivalent as parsed JSON to Base. The new Presence Concealment skill is a second card. The revised FM05 test selects the frozen FM05 card by exact ID; it still requires exactly one card for the other nine FM05 members and exactly two for Semiramis.

## Independent verification

- Focused FM06 4/4, FM05 4/4, FB2-02 9/9, FB2-11 7/7, FB2-12 10/10: combined 34/34.
- Full root `npm run test:ci` run against exact Base and Candidate in sequence: both 118 test files, 723/723 passed, zero failed and zero skipped. The initial Candidate had one additional FM05 synthetic-fixture failure; the revised Candidate removes it without changing production behavior.
- `npm run typecheck`, `npm run content:validate`, `npm run verify:generated-content`, and `git diff Base..Candidate --check` passed. Generated-content hashes were unchanged. The content validation command covers the playtest pack; the twelve FM06 archives were separately checked through the focused loader test and direct Reference/text/hash audit.

No A-sync, migration credit, or merge was performed by the Reviewer.
