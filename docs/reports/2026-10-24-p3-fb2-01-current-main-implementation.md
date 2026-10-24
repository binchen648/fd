# P3-FB2-01 current-main implementation candidate

- Exact Base: `9dea52b0e470f02baf7450b354e3d5d8fcfa3bc5` (B23 A-sync)
- Branch: `codex/b2-p3-fb2-01-current-main-20261024`
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`

Current-main audit retained the existing identity-free fixed controller mana component and added one narrow fail-closed guard: the sole top-level `pay_mana` node now rejects unknown fields before parent-route adoption. No F1 authoring, inventory, taxonomy, governance, MatchSession, projection, or generic legacy-cost behavior was changed.

Verification:

- `npm ci --offline --ignore-scripts`: exit 0 (workspace dependency reconstruction).
- `npm run typecheck`: exit 0.
- FB2-01 + Maiya/Kayneth focused suites: 3 files / 22 tests passed.
- Current regression suite: 69 files / 487 tests passed.
- `npm run test:ci`: 189 files / 1518 passed / 8 failed / 114 skipped. The 8 failures are historical Phase-3 provenance/blob references to unavailable old artifacts, not FB2-01 behavior; no new deterministic runtime failure was observed.
- Gate C: not required by the FB2-01 contract because payment behavior does not change transport, projection, pending interaction, reconnect, or stale-command protocols.
- `git diff --check`: passed.

This is a Builder candidate only. It does not claim Reviewer acceptance, credit, merge, or promotion.
