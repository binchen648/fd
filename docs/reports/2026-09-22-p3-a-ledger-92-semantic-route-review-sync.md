# P3-A Ledger 92 Semantic Route Review Synchronization

Role: Codex A
Status: `SYNCHRONIZED_WITH_BLOCKERS`
Date: 2026-09-22

## Baseline relationship

- Accepted automation Candidate: `6abf5a80b251eaf4009bc01ed7377574c2191c1e`
- Automation review sync: `4f3d469390c01aea591279e49d770ae9fda11609`
- Reviewed scope: the 12 rows classified as `NEW_RUNTIME_SEMANTIC_ROUTED`

The original artifact remains the accepted reproducible classifier baseline. This synchronization adds an independent-review overlay; it does not silently rewrite the historical classifier output.

## Reviewed effective routing

The independent runtime review found that the three `game_start + create_card(to=skill)` abilities do not currently have a typed new-runtime owner. They still execute through generic `resolveEffect(create_card)` and fail open when the target definition is absent.

Until a narrow repair receives fresh independent acceptance, the effective routing is:

| Route | Baseline classifier | Reviewed effective count |
|---|---:|---:|
| `NEW_RUNTIME_SEMANTIC_ROUTED` | 12 | 9 |
| `LEGACY_RESOLVE_EFFECT` | 49 | 52 |
| `LEGACY_EXECUTE_ABILITY` | 3 | 3 |
| `NOT_CLASSIFIABLE` | 28 | 28 |
| Total | 92 | 92 |

The three exact runtime-repair identities are listed under the P1 finding in `artifacts/phase3-ledger-92-semantic-route-review-overlay.json`. The report intentionally does not duplicate their ability tokens because reports are discovery inputs to the accepted ledger generator.

The only authorized B repair contract is:

`SETUP_CARD_CREATION_MINIMAL:CREATE_TO_SKILL_CURRENT_LINEAGE_REPAIR`

It must restore an identity-free typed route, target-definition validation, atomic failure, replay/idempotency, and no legacy fallback for those three exact semantic shapes. It must not include other cards or Maiya Add-to-Attack.

## Evidence-only blocker

The exact Maiya Add-to-Attack row identified in the overlay retains its reviewed new-runtime owner and Gate A/B. Gate C is blocked only because `e2e/fd-add-to-attack-card-action.spec.ts` expects stale deterministic instance id `created-4`; authoritative current output is `created-3`.

This requires a separate evidence fixture repair. It does not authorize runtime changes and must not be bundled into the setup-card-creation B slice.

## Structured verdict summary

- `ACCEPTED`: 6
- `AB_ACCEPTED`: 2
- `EVIDENCE_REPAIR_REQUIRED`: 1
- `RUNTIME_REPAIR_REQUIRED`: 3
- Gate A PASS: 9
- Gate B PASS: 9
- Gate C PASS: 6
- Gate C repair required: 1
- Gate C not verified: 5

The exact twelve-row overlay is recorded in `artifacts/phase3-ledger-92-semantic-route-review-overlay.json`.

## Scheduling state

1. Coordinator may now create one clean B worktree for the three-row setup repair.
2. Coordinator must assign a separate evidence-only fixture repair for Maiya Add-to-Attack.
3. A does not touch `interpreter.ts`, `executable-card-pack.ts`, `resolution-dataflow.ts`, or runtime tests.
4. The three setup rows return to new-runtime credit only after B repair, fresh R acceptance, and A resynchronization.

No Gate, Phase, roster-wide migration, or Release promotion beyond the explicit twelve-row R verdict is claimed.
