# P3-FB2-01 current-main independent Reviewer

- Date: 2026-10-24
- Exact Base: `9dea52b0e470f02baf7450b354e3d5d8fcfa3bc5`
- Exact Candidate: `bc145748a2c669189d1b7f008249be2acc07efe7`
- Reviewer branch: `codex/r2-p3-fb2-01-current-main-20261024`
- Verdict: **MIGRATION_ACCEPTED / GATE_A_B_CANDIDATE_ACCEPTED**

## Findings and boundary judgment

No blocking finding remains in the scoped fixed controller mana-cost component. The exact component classifier accepts one top-level `pay_mana` node with a positive safe-integer literal and optional explicit `player: controller` only. It rejects unknown cost keys, third-party payer, zero/negative/fractional, variable or expression amount, additional or non-mana nodes, and effect-level `optionalCost`. It uses no card, ability, owner, or printed-text identity. A renamed accepted ability retains the same component classification, but the component itself does not make an unsupported parent ability routable.

The Kayneth source-card PLAY and Maiya ADD_TO_ATTACK parent families now reject malformed cost shapes before the generic legacy cost loop. Independent execution probes covered canonical amount 2 plus unknown key, third-party payer, zero, wrong positive amounts 1 and 3, expression, variable, two nodes, and non-mana cost in each family. Canonical Kayneth pays 5 to 3, plays its source, and emits typed `mana_paid`; canonical Maiya pays 6 to 4, emits typed `mana_paid`, then opens its accepted pending-target stage. Every negative probe rejected without payment, source movement, pending decision, or new event. The typed primitive independently returned `status: applied`, `requestedAmount: 2`, `actualAmount: 2`, `before: 5`, `after: 3`, with a causally identified `mana_paid` event of delta -2. Kayneth same-stage downstream failure rolls back payment; Maiya's later target-stage rejection correctly retains its previously committed activation payment. Authoritative MatchSession insufficient-mana dispatch leaves mana, revision, pending decision, events, and sequence unchanged.

Non-blocking inherited observation: direct, non-MatchSession `executeAbility` on insufficient Maiya mana increments the internal runtime sequence by one before throwing, while committing no mana, event, revision, or pending decision. This behavior is identical on exact Base; the authoritative MatchSession stage rolls it back. This report does not certify direct-call full-object equality for that pre-existing path.

## Independent receipts

- Fresh separate Reviewer worktree from exact Base, then exact Candidate; separate detached Base worktree. `npm ci`, `npm run typecheck`, and `git diff --check Base..Candidate` passed.
- FB2-01 plus Maiya/Kayneth focused tests: 3 files / 29 passed. Entire rules regression directory: 69 files / 494 passed.
- Sequential full `npm run test:ci -- --reporter=json`: Base exit 1, 1,518 passed / 8 failed / 114 skipped; Candidate exit 1, 1,525 passed / 8 failed / 114 skipped. Normalized failed-test names and failed-suite names are identical; all failures are historical Phase-3 provenance Git-path/blob checks. The full suite is **not green**.
- Scope diff contains only the interpreter, focused FB2-01 regression, and Builder report. No F1 authoring, KPI/taxonomy, MatchSession, client/projection, interaction protocol, or generic cost-loop change. Gate C is not required by the FB2-01 contract.

Gate A structural scope and Gate B behavior/compatibility are accepted for this narrow component. Explicit A synchronization input is the exact Base/Candidate pair above and this Reviewer report commit. This report performs no A-sync, merge, or migration-credit change.
