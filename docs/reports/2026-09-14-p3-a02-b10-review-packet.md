# P3-A02 B10 Reviewer Packet — Replacement CREATE_TO_SKILL Baseline

- Document Role: REVIEWER_PACKET
- Owner: Codex A
- Source Task: `P3-A02`
- Runtime Task: recovered `P3-B10`
- Mechanic Family: `SETUP_CARD_CREATION_MINIMAL:CREATE_TO_SKILL`
- Accepted Replacement Runtime Candidate: `bcb7ed1db310be5a8b04b3e1a223005a21c65102`
- Independent R05 Evidence Commit: `d92764e9bcabeb52c04c5fb429dd9c718ddf0c36`
- Historical Missing SHA: `9fba6d9` — unavailable and not treated as restored
- Status: `REVIEW_PACKET_BASELINE_CANDIDATE`

## Supersession Notice

`docs/reports/2026-09-12-p3-a03-b10-reviewer-packet.md` reviewed old candidate `bb32fc2` and correctly found two blockers:

1. card-identity exclusion using `card.luck`;
2. unsafe provenance adoption for an existing unprovenanced same-definition card.

That packet is historical evidence only. The current replacement baseline is `bcb7ed1`, independently accepted by fresh R05 review `d92764e` after both blocker classes and a later mixed-provenance ordering gap were repaired.

## Accepted Scope

Exact supported semantic family:

- automatic forced trigger;
- `game_start`;
- no conditions;
- no targets;
- no cost;
- one supported `create_card` to controller skill zone;
- no owner override;
- no nested continuation;
- route eligibility based on semantic shape, not created-card identity.

Canonical matching setup abilities:

- Maiya `military.has-support-shot`;
- Olga-Marie `astronomical-science.has-chaldeas`;
- Shinji `useless-person.setup`.

Artoria Caster post-battle Luck creation remains outside the contract because its semantic shape differs, not because `card.luck` is identity-blocked.

## Current Independent Evidence

Fresh R05 review of exact `bcb7ed1` records:

```text
npm run typecheck
PASS

focused: 7 files / 85 tests
B10 dedicated: 12 passing tests
full rules: 353 / 372 passed, 19 inherited baseline failures
```

R05 independently adversarially checked mixed-provenance orderings:

- incompatible duplicate after legitimate same-source card -> `resolution_failed`, state unchanged;
- incompatible duplicate before legitimate same-source card -> `resolution_failed`, state unchanged;
- missing provenance mixed with legitimate card -> `resolution_failed`, state unchanged;
- all same-source compatible set -> idempotent no-op, no extra card.

## Gate Judgment Already Recorded By R05

- Gate A: PASS for the scoped setup-create primitive/route.
- Gate B: PASS for production MatchSession game-start setup of the three canonical representatives.
- Gate C: not promoted by B10; downstream B11 owns its own production-browser evidence.
- Final task token: `GATE_A_B_CANDIDATE_ACCEPTED`.

This A02 packet does not re-review or re-promote B10. It packages the accepted replacement evidence so later B05-B10-style review work does not accidentally consume stale `bb32fc2`/`9fba6d9` assumptions.

## Provenance / Idempotency Contract To Preserve

For a same-definition controller-owned card set:

- no existing card -> create exactly one canonical skill card with `generatedBy = sourceCardId`;
- compatible same-source existing state -> safe idempotent no-op;
- any missing or different provenance -> fail closed;
- mixed compatible/incompatible duplicates -> fail closed regardless of ordering;
- failure must not mutate cards, events, or revision.

No reviewer or later migration may reintroduce provenance adoption.

## A-Owned Follow-Up Boundary

B10 itself must not edit coverage classifier/KPI ownership. A-owned synchronization is separate. The current reviewer should distinguish:

- runtime acceptance at exact `bcb7ed1`;
- reviewer evidence at `d92764e`;
- later A coverage/classifier synchronization.

The reviewer report commit is evidence only and must not become the runtime base.

## Residual Risks / Missing Evidence

- Historical `9fba6d9` remains irretrievable; do not claim historical-object restoration.
- The replacement chain is semantically reviewed but not Git-object-identical to the lost historical chain.
- B10 has no independent Gate C browser promotion; this is intentionally not inferred from Gate A/B.
- Any future create-to-skill shape outside this exact contract needs a new review rather than inheriting B10 acceptance.

## Reusable Guidance For B05-B10 Packets

When packaging later Card Action slices, always record:

- exact target and base commits;
- semantic eligibility axes;
- skipped ability list and reasons;
- compiler/runtime fail-closed evidence;
- independent MatchSession proof;
- browser/reconnect/stale evidence only when Gate C is actually required;
- complete diff ownership audit;
- A-owned burn-down synchronization only after R judgment.
