# P3-R24 FB2-07 Fixed Controller Source-Card Removal Independent Review

Date: 2026-09-16
Role: R
Target Candidate: `7cfa53b1dcea1f8b0769ff247924724d20d1d626`
Handoff Base: `6fb7e2c529cc22599ba820d49de6cce8fea2e128`
Verdict: `GATE_A_B_CANDIDATE_ACCEPTED`

## Findings

No blocking finding remains.

The candidate extends the existing typed `move_source_card` primitive only with the narrow `removed_from_game` destination and adds an identity-free component classifier. It does not add a parent route for any F1 member.

The existing B15 source-return contract remains intact: `move_source_card -> skill` still requires a controller-owned/controller-controlled source that is active, face up, and on `field` or `attack_area`.

For `removed_from_game`, the candidate does not invent a parent timing or source-zone requirement. The executing source must exist, be owned and controlled by the ability controller, and must not already be removed. The authoritative shared zone mutation makes the removed source public and inactive. Wrong controller/owner, invalid destination, duplicate removal, malformed component shape, and later-stage failure are fail-closed/atomic.

## Accepted scope

Accepted only:

- typed `move_source_card` destination `removed_from_game` for the executing controller-owned/controller-controlled source;
- public/inactive authoritative removed-zone state;
- existing typed source-card movement result/event envelope;
- identity-free fixed controller source-removal component classifier;
- unchanged B15 `move_source_card -> skill` semantics.

Not accepted by implication:

- generic Card Zone;
- `return_card_by_definition` or Card Create;
- arbitrary source-card destinations;
- selected/matching-card movement;
- Trigger Gateway, Lifecycle, Target/Interaction, Movement, Visibility, Power/Battle, or reviewed-special behavior;
- any F1 authoring migration or F4 batch.

The 12 exact F1 identities in the A handoff are component-aligned only. Every one still has another parent dependency or reviewed-special requirement, so complete migration-ready count added by FB2-07 is `0`.

## Independent verification

- fresh dependency install: PASS;
- typecheck: PASS;
- focused compatibility set: 4 files / 34 tests PASS;
- all rules regression: 46 files / 274 tests PASS;
- generated-content determinism: PASS:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- full CI: 113 files / 687 tests PASS;
- production representative identity audit: `IDENTITY_NONE`;
- forbidden-file audit: `FORBIDDEN_NONE`;
- corrected quoted-range `git diff --check`: PASS.

## Gate judgment

`GATE_A_B_CANDIDATE_ACCEPTED`

No Gate C promotion is introduced by this component-only runtime slice.
