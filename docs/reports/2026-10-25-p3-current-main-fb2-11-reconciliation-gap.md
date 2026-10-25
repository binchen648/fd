# P3 Current-Main FB2-11 Reconciliation / Gap

Date: 2026-10-25  
Status: `RECONCILIATION_REQUIRED`  
Role: Builder evidence-only audit  

## Purpose and boundary

This document records why the existing FB2-11 contract cannot be dispatched as
a successor of the current-main FB2-10 A-sync. It is a docs-only audit. It
does not create a Builder Candidate, claim FB2-11 acceptance, alter runtime or
authoring data, or change the formal ledger.

## Current-main evidence

- Current-main FB2-10 A-sync: `1d0500390081620e94cd21d56ac83b4eafc51057`.
- Its exact FB2-10 handoff Base is `09ddfaee5ea54226d232c85d80db32a7b04b186e`.
- The FB2-10 A-sync report records independent acceptance of the narrow Saber
  Magic Resistance route, zero migration credit, unchanged `111/944`, and no
  successor or retarget authorization:
  `docs/reports/2026-10-25-p3-a-fb2-10-current-main-acceptance-synchronization.md`.
- The current-main A-sync worktree was clean at this audit and its remote
  branch resolved to the same SHA.

## Existing FB2-11 contract and lineage

The canonical task index contains `TASK P3-FB2-11`, unlike the older index in
the FB2-10 A-sync worktree. Its contract is:

- Owner: Codex B2; status in the canonical index: `REVIEW_ACCEPTED`.
- Goal: add only the trusted read-only formula metric `game.round_number`,
  returning authoritative `state.round.roundNumber`.
- Allowed surface: formula metric allowlist/evaluator, focused tests, and the
  B2 report; no subtraction, new operators, arbitrary state paths, identity
  routing, or F1 authoring changes.
- Contract source:
  `docs/agents/PHASE3-TASK-INDEX.md` (`TASK P3-FB2-11`).
- Handoff source:
  `docs/reports/2026-09-16-p3-fb2-11-round-number-formula-handoff.md`.
- Canonical index records the historical FB2-11 candidate as
  `5383c37c8362341b8a581624b8ad1d77ddce356`; its parent/current B2 planning
  lineage is `c6f1ce1a` (the A/FM05 planning lineage), not the current-main
  FB2-10 A-sync lineage.

## Exact mismatch

`1d0500390081620e94cd21d56ac83b4eafc51057` is the current-main continuation
after FB2-10. The existing FB2-11 evidence is attached to the separate
`c6f1ce1a -> 5383c37c8362341b8a581624b8ad1d77ddce356` lineage. Therefore the
historical FB2-11 candidate and its reviewer evidence cannot be treated as a
current-main Builder Candidate, and the FB2-11 contract cannot be dispatched
from `1d050039...` without a fresh A-owned handoff/reconciliation.

## Required A-owned next step

Codex A must first produce a current-main reconciliation that:

1. proves the current-main Base and parent relationship for the proposed
   FB2-11 start;
2. rebinds the FB2-11 contract and its dependencies to that Base, or records
   a concrete blocker if the formula/runtime assumptions differ;
3. states whether the historical FB2-11 review evidence remains usable or
   requires fresh review; and
4. explicitly authorizes a new Builder branch/Candidate, with unchanged
   accounting until independent review.

Until that A-owned handoff exists, this report recommends no successor
dispatch. The formal ledger remains `111/944`; no credit is claimed.
