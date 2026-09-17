# P3-TO-16 Independent Special Isolation Review

- Review owner: Codex R
- Date: 2026-09-14
- Reviewed candidate: `a3e8ee6dc0bd1549ca3fc7d463eaec831cc7d3bf`
- Candidate base: `c4dc860652345c9d328a261568c2c87d38d502ed`
- Review mode: fresh worktree, review only
- Verdict: `PLANNING_ACCEPTED`
- Runtime authorization: none
- Gate promotion: none

## Decision

```text
Decision: PLANNING_ACCEPTED
Reviewed commit: a3e8ee6dc0bd1549ca3fc7d463eaec831cc7d3bf
Blocking findings: 0
Non-blocking findings: 1
Strict special abilities: 17
Strict special cards: 12
Inventory exact: yes
Cluster sum: 17
Current strict special legacy routes: 17/17
Runtime files changed by candidate: no
Runtime/Gate promotion: no
```

## Authoritative Denominator Verification

Independent regeneration from `artifacts/phase3-skill-coverage.json` produced:

```text
specialSubsystemCounts.SPECIAL_SUBSYSTEM=17
strict rows=17
strict cards=12
mapped rows=17
unique mapped rows=17
missing=[]
extra=[]
LEGACY_RESOLVE_EFFECT=17
record_master_directive rows=10
```

The current `docs/audits/fd-skill-semantic-axis-matrix.md` independently reports 17. Historical inspection of taxonomy-remediation commit `ce17801` also shows the corrected semantic-axis matrix was introduced at 17, so the older `18 abilities / 13 cards` planning prose is stale evidence rather than proof that a current special consumer was silently lost.

The candidate correctly refuses to use the historical conservative `30 special-like` heuristic as an acceptance denominator.

## Cluster Verification

The inventory partitions all 17 rows exactly once:

```text
DIRECTIVE_PROTOCOL=10
INDEPENDENT_DECK=2
DECK_REPLACEMENT=1
MATCH_DECK_INTERVENTION=1
STATE_TRANSFORM_CHAIN=2
IDENTITY_REPLACEMENT=1
sum=17
```

The partition is planning-only. A cluster label does not itself authorize a runtime owner or taxonomy reclassification.

## Directive Protocol Finding

The candidate correctly quarantines `record_master_directive` instead of promoting it as a generic primitive.

Independent current-runtime inspection confirms `match-session.ts` still categorizes directive entries through substring tests such as:

```text
create_independent_deck
draw_from_independent_deck
adjust_command_seals
set_mana
movement
deploy
replacement
extra_play
reverse_dash
```

This is an implicit string protocol. The ten current strict directive consumers also represent different rule families, including movement, scoring, command-spell timing, rule permission and battle behavior. The candidate's requirement to decompose them into typed semantic owners is therefore appropriate.

## Legacy Owner / Randomness Finding

The candidate distinguishes strict special quarantine from the wider `extended-effects.ts` legacy owner surface. That distinction is necessary because the file also contains generic shims and conservative-risk handlers outside the strict 17.

Independent inspection confirms a direct `Math.random()` call remains in legacy random-discard handling. The candidate does not add that handler to the strict denominator; it correctly records deterministic server RNG as a future runtime admission requirement for any random subsystem.

## Quarantine Exit Review

The exit criteria are sufficiently strict. A special row cannot leave quarantine solely because an implementation exists. Required evidence includes:

- reviewed source/rules evidence;
- complete semantic envelope ownership;
- accepted external gateways;
- typed compiler/runtime validation;
- no card/ability-name routing or translated-text parsing;
- explicit persistent/result/continuation state;
- reconnect/hidden/RNG evidence where applicable;
- fail-closed transaction behavior;
- no legacy retry after semantic admission;
- focused negative tests and representative Gate evidence;
- independent review;
- explicit A-owned taxonomy/coverage reclassification.

This prevents implementation candidates from silently shrinking the strict special denominator.

## Legacy Deletion Review

The deletion contract does not permit deleting a branch merely because a typed replacement exists. It additionally requires:

- every reachable authoring consumer enumerated;
- zero fresh legacy consumers for the exact contract;
- no generic fallback path;
- no direct caller bypass;
- save/restore/reconnect compatibility;
- generated-definition old-tag accounting;
- fail-closed behavior for unknown old tags;
- full required tests/E2E;
- independent deletion review.

The explicit prohibition on deleting all of `extended-effects.ts` while mixed generic shims and special logic remain closes the main over-deletion risk.

## Dedicated Versus Core Ownership

The candidate correctly separates reusable composed candidates from dedicated subsystem candidates:

- deck replacement / match-deck intervention may eventually compose typed Card Zone, Interaction, Hidden, Trigger and Lifecycle owners;
- identity replacement and multi-stage state topology may retain dedicated typed subsystem ownership;
- dedicated ownership still may not use character/card-name branches or runtime text interpretation.

## Scope

Exact candidate diff is limited to:

```text
docs/audits/2026-09-14-p3-to-16-special-legacy-owner-audit.md
docs/audits/2026-09-14-p3-to-16-special-subsystem-inventory.md
docs/plans/2026-09-14-p3-to-16-special-isolation-and-deletion-contract.md
```

`git diff --check` passes. No runtime, authoring, tests, generated content, coverage classifier, taxonomy implementation or Gate status changed.

## Non-Blocking Evidence Drift

`docs/reports/fd-phase-3-throughput-baseline.md` and `docs/plans/fd-phase-3-throughput-optimization-plan.md` still contain stale `18 abilities / 13 cards` prose outside the TO-16 candidate's allowed scope.

The owning documentation/automation lane should synchronize those documents to the authoritative 17/12 denominator. This is evidence drift, not a blocker to accepting the TO-16 planning contract because the candidate explicitly identifies and corrects the denominator in its own authoritative inventory.

## Acceptance Boundary

`PLANNING_ACCEPTED` means only that the quarantine/deletion plan and strict inventory are accepted planning evidence.

It does not:

- reclassify any of the 17 rows;
- migrate any runtime consumer;
- delete any legacy handler;
- authorize new runtime work;
- promote Gate A/B/C;
- make the conservative 30-row risk heuristic authoritative.
