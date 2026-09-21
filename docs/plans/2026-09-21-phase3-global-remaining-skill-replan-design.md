# Phase 3 Global Remaining-Skill Replan Design

Status: `DESIGN_ACCEPTED`
Owner: Codex A
Date: 2026-09-21
Baseline: `8b63d3cdd2ae068810805c650dca6903874e825d`

## Objective

Replace the historical FM09 dependency batch mindset with a reproducible global migration-credit-first queue across every remaining frozen identity. The coordinator must select the smallest independently reviewable next slice from current evidence and must not launch an eleven-card FM09 completion batch.

## Verified baseline

A strict top-level `cards[]` intersection of the locked full-roster inventory with current canonical authoring JSON gives:

- frozen denominator: `944` (`943` static plus `1` known dynamic identity);
- canonical authored frozen identities in this checkout: `146`;
- formal accepted migration ledger: `151/944`;
- material/formal drift: `5` identities from accepted stacked branches not materialized in this checkout;
- material missing identities: `798`; formal remaining identities: `793`.

The earlier `151` material count recursively inspected nested objects and counted five nested IDs as if they were top-level cards. The readiness collector now reads only canonical archive `cards[]` entries. It reports material and formal ledgers separately and does not infer duplicate credit from the five-identity branch drift.

The current machine catalog gives only a coarse starting split for the `798` identities absent from this checkout:

- `743` `SOURCE_EVIDENCE_REQUIRED`;
- `50` historical `READY_GENERIC_EXTENSION`;
- `5` `SPECIAL_HANDLER_CANDIDATE`.

These labels predate much of the accepted runtime work. In particular, historical `READY_GENERIC_EXTENSION` does not mean `S_READY_NOW`; every one of the 50 rows still requires a fresh complete-card overlay against exact accepted contracts. Conversely, task-local accepted source evidence must be reconciled before a row remains permanently in the 738 source-evidence bucket.

The historical eleven FM09 provisioning targets are now:

| State | Count | Identities |
|---|---:|---|
| Present | 2 | `master.ciel.skill.s2`, `master.shiki-ryougi.skill.s3` |
| Missing | 9 | Bazett s2; Caules s2/s3; Fujino s3; Nanaya Shiki s2; Ryougi Shiki s2; Tohno Shiki s2; Zouken s3/s4 |

The nine missing targets still span distinct interaction, lifecycle, replacement, battle, hidden-information, and transitive-definition requirements. They are not one mechanic family and receive no batch exception.

## Options considered

### FM09-first completion

Finish the nine missing FM09 targets before returning to the rest of the roster. This has a visible milestone but creates long multi-gap runtime work, weak reuse ordering, and pressure to combine unrelated contracts. Rejected.

### Mechanic-family bulk migration

Group all remaining identities by broad taxonomy and migrate large batches. This improves raw throughput only when taxonomy and accepted runtime semantics are already exact. Current broad labels hide interaction and trigger differences, so this would recreate unverified entry points. Rejected as the default.

### Global migration-credit-first queue

Recompute every missing identity against the exact current accepted runtime, immediately dispatch true zero-gap consumers, and otherwise choose one reusable identity-free capability gap with the best bounded closure yield. Accepted.

## Queue model

Every material-missing identity must be assigned exactly one current state. The formal ledger remains separately visible until branch integration removes the drift:

1. `S_READY_NOW`: source-grounded, all referenced definitions exist, compiler/load report is empty, every semantic node maps to an independently accepted runtime contract, and the complete card has executable positive and negative proof.
2. `ONE_SHARED_GAP`: exactly one reusable identity-free capability is missing; all other complete-card semantics are accepted.
3. `TRANSITIVE_DEPENDENCY`: the card references another missing definition or unresolved generated identity.
4. `MULTI_GAP`: two or more independent runtime contracts are missing.
5. `SOURCE_EVIDENCE_REQUIRED`: authoritative clause normalization or source lineage is incomplete.
6. `RULE_DECISION_REQUIRED`: canonical rules and source evidence do not determine one implementation.
7. `SPECIAL_HANDLER_REVIEW`: semantics may be clear but are too specific to enter a generic contract without explicit B/R review.
8. `ACTIVE_TASK_RESERVED`: an exact identity or capability is already owned by an open task.

Classification is fail-closed. Unknown, stale, or incomplete evidence cannot become `S_READY_NOW`.

## Selection policy

The coordinator applies this order after every accepted R verdict and A synchronization:

1. Preserve the current active chain. FB2-49 and its Astolfo consumer closure finish before a competing hot-runtime task starts.
2. Dispatch `S_READY_NOW` identities before creating new runtime capability work.
3. One S task contains one frozen identity by default. A second identity is allowed only when both are inseparable cards in the same owner archive and share the exact accepted complete-card contract; the handoff must justify the exception.
4. If the ready queue is empty, rank `ONE_SHARED_GAP` candidates by bounded closure yield, then lower interaction/privacy risk, then lower lifecycle/battle-ordering risk.
5. Dispatch exactly one B2 capability contract. It must be identity-free, have one representative, and earn zero migration credit.
6. After R accepts that capability, A reruns the complete-card overlay. Newly unblocked consumers do not inherit acceptance automatically.
7. `MULTI_GAP`, transitive, source, rule-decision, and special-handler rows stay explicit; they cannot be bundled to make a batch compile.

## Parallelism and efficiency

Parallel work is allowed only across non-overlapping ownership lanes:

- B2 runtime lane: maximum one task touching hot runtime files.
- S consumer lane: up to three singleton migrations concurrently after their complete contracts are accepted, provided files and owner archives do not overlap.
- A evidence lane: one authoritative queue update at a time; it may prepare future read-only probes while B2/S runs.
- R lane: reviews may proceed independently, but each verdict must bind one exact Base/Candidate and cannot promote another task by inheritance.

This raises throughput through safe consumer parallelism, not through larger semantic batches.

## FM09 policy

FM09 remains a dependency label, not an implementation batch.

- The nine missing target identities enter the same global queue as every other missing identity.
- No task may be named or scoped as “complete the remaining FM09 cards”.
- Fujino s3 cannot absorb missing Fujino s2.
- Ryougi s2 cannot inherit Ryougi s3 interaction acceptance for its deck-bottom comparison and paired-cost semantics.
- Caules s2/s3, Zouken s3/s4, Bazett s2, Nanaya s2, and Tohno s2 remain separate complete-card contracts.
- Only after every provisioning target exists and the strict compiler succeeds may the ten FM09 source identities be freshly re-evaluated. Even then, migration is sliced by identity/owner boundary rather than assumed as one bulk PR.

## Evidence output

The global readiness refresh must produce a machine-readable artifact containing:

- exact repository and locked Reference commits;
- source fingerprint;
- formal/material counts and drift;
- one row for each of 944 identities;
- current queue state and reason codes;
- accepted contract dependencies with exact evidence links;
- active-task reservations;
- closure-yield calculation;
- FM09 membership as metadata only;
- stale-evidence and unknown-semantics failures.

The human report summarizes counts and the top bounded candidates. It must never replace the machine artifact.

## Release boundaries

This design authorizes planning and automation only. It does not authorize roster JSON changes, runtime changes, a new B2 seam, an S migration, Gate promotion, Phase PASS, Release Ready, PR merge, or PR retarget.
