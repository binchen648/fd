# Phase 3 Diverged Lineage Reconciliation

Status: **RECONCILIATION_INVENTORY_COMPLETE**

## FRONTIER RECONCILIATION HANDOFF

- Control Epoch: `FD-P3-2026-09-23-02`
- Mode: `INTEGRATION_RECOVERY_MODE`
- Main: `4b52b3166ed2ba0efaa4569ee95c6513fd26ab2f`
- Frontier Freeze / R123: `8b26c9d0aa294c065ae6c7f3a2b062f19cdff196`
- Merge base: `575650f7be3dc9a3a61d5191d0a44829b6daf8ba`
- Main Accepted: **111/944**
- Frontier Formal: **269/944** (stacked accepted, not promoted)
- Frontier Material: **265/944**
- Formal Delta: **+158**
- Material Delta: **+154**
- Total identities inventoried: **158**
- Migration-only: **0**
- Generic-runtime-required: **31**
- Already-equivalent: **0**
- Contract-revalidation-required: **2**
- Evidence-only: **0**
- Blocked: **0**
- Special subsystem: **5**
- Not verified: **120**
- Hot-file affected: **38 confirmed identity-level**, plus **99 M50 identities with batch-level hot-file evidence but unresolved identity-level parity**
- Missing concrete reviewer evidence: **20 identities**

This report inventories and preserves frontier evidence. It does **not** declare the frontier ready to merge, does not perform Semantic Replay, and does not grant current-main credit.

## Mechanical lineage facts

GitHub reports current `main` at `4b52b3166ed2ba0efaa4569ee95c6513fd26ab2f`. The R123 frontier `8b26c9d0aa294c065ae6c7f3a2b062f19cdff196` and current main diverge at `575650f7be3dc9a3a61d5191d0a44829b6daf8ba`. Main owns the promotion-governance line; the frontier owns the stacked Phase 3 migration/runtime line. The two must be reconciled semantically rather than treated as a normal fast-forward/rebase promotion.

Frozen material was rescanned identity-by-identity against the checked-in 944 roster: main **111**, R123 **265**, exact material additions **154**, removals **0**, duplicate frozen IDs **0** on both sides.

## Why formal delta is +158 but material delta is +154

The extra four formal-ledger identities are the R66 Lostbelt objective set:

- `master.kadoc.skill.s3`
- `master.ophelia.skill.s5`
- `master.ophelia.skill.s6`
- `master.ophelia.skill.s7`

R66 synchronization claims these four as accepted, but they are absent from the R123 material tree. PR #372 currently has no GitHub reviewer comment/review, and no independent R66 reviewer report exists in the frontier report tree. Under the reconciliation rule, these four are `NOT_VERIFIED`; the historical sync claim is preserved but not promoted as current-main evidence.

## Classification summary

| Classification | Count | Replay meaning |
|---|---:|---|
| `CONTRACT_REVALIDATION_REQUIRED` | 2 | Resolve current-main contract conflict first. |
| `GENERIC_RUNTIME_REQUIRED` | 31 | Replay/revalidate runtime capability before consumer migration. |
| `NOT_VERIFIED` | 120 | Evidence/parity must be repaired before semantic promotion. |
| `SPECIAL_SUBSYSTEM` | 5 | Treat subsystem contract as an explicit replay boundary. |

### Contract revalidation

Exactly two inventoried identities are mechanically tied to the FB2-49 authority/lifecycle surface that Planner flagged against PR #424:

- `servant.astolfo.skill.sc-astolfo-1` — explicit accepted dependency on FB2-49.
- `servant.scathach.skill.sc-scathach-2` — M50-02 normalized effect `opponent_close_one_non_residual` routes through the same opponent-close authority family.

No other M50 identity was promoted into this conflict class merely because M50-02 touched the shared interpreter; the affected set was located from normalized authoring/runtime references.

### M50 evidence preservation without macro replay

M50-01 and M50-02 contribute **100 material identities**. Their batch-level fresh-R evidence is preserved (PR #440 canonical acceptance relay and PR #441 canonical acceptance relay), but identity-level current-main contract parity has not been reconstructed. Therefore 99 of those identities remain `NOT_VERIFIED`; Scathach is the one explicit `CONTRACT_REVALIDATION_REQUIRED` identity. Replay must decompose these 100 identities by normalized semantics / required capabilities rather than replaying either 50-skill Candidate wholesale.

### Missing historical reviewer evidence

Besides the M50 identity-parity issue, the repository/GitHub scan found historical acceptance-sync claims whose source PRs have no concrete reviewer comment/review and no independent reviewer report: **#356, #359, #361, #363, #364, #366, #368, #372**. Their affected identities are retained in the artifact with the synchronization/report claims, but classified `NOT_VERIFIED` until evidence is recovered or a governance-authorized re-review occurs.

## Replay grouping recommendation

1. **Evidence recovery / ledger repair first.** Repair the eight historical PR evidence gaps above; resolve the R66 formal/material mismatch.
2. **FB2-49 parity.** Revalidate Astolfo + Scathach against the eventual promoted #424 lifecycle/authority contract.
3. **Outer God Life subsystem.** Re-establish the accepted generic subsystem boundary, then replay its five consumers as definitions.
4. **Generic runtime families.** Group the remaining verified runtime-dependent identities by their actual contract/runtime primitive and hot-file overlap, not historical PR number.
5. **Migration-only candidate lane.** No identity currently meets the strict MIGRATION_ONLY proof threshold. Darnic s1a has an authoring/tests/report-only source PR, but current-main reviewer evidence is scoped and does not prove inheritance of its complete optional-response/condition/resource contract; keep it NOT_VERIFIED until exact parity evidence is established.
6. **M50 decomposition.** Partition the 100 M50 identities by semantic contract / requiredCapabilities / handler. Do not replay M50-01 or M50-02 as 50-card macros.

## Hot-file map

The machine artifact records per-entry runtime-introduction ranges and changed production/test paths where exact contract commits could be mechanically recovered. Confirmed replay dependencies include interpreter/loader, combat resolver, opponent-close authority/session/room surfaces and other rules hot files. M50 batch hot-file evidence is intentionally kept as batch-level evidence until identity contract decomposition is performed.

## Governance / promotion authority

The frontier is not promotion-authoritative. Main-owned governance files are not recreated or modified by this task. This inventory must be consumed by the current-main promotion/replay process.

## Frozen local Work note

The fixed Work directory already contains an uncommitted M50-03 draft. This reconciliation did not modify, reset, discard or delete it. M50-03 remains frozen and outside this inventory.

## Known contract conflicts

- FB2-49 lifecycle/server-authority parity versus current integration PR #424 affects Astolfo and Scathach.
- R66 has formal-ledger credit without R123 material and without concrete reviewer evidence found in GitHub/repo.
- M50 batch acceptance is valid frontier evidence but is not an identity-level current-main semantic replay contract.

## Open questions

- Can missing independent reviewer evidence for PRs #356/#359/#361/#363/#364/#366/#368/#372 be recovered from an external reviewer channel not present in GitHub/repo history?
- Should the four R66 Lostbelt objective identities be re-materialized only after reviewer-evidence repair, or re-reviewed under current promotion governance?
- Which M50 identity-level semantic groups are already equivalent to current main after governance/integration work, versus requiring replay?
- What exact FB2-49 semantic parity is established once PR #424 is promoted, especially for Astolfo and the M50-02 Scathach single-opponent extension?

## Artifact

Machine-readable inventory: `artifacts/phase3-frontier-reconciliation.json`. Each of the **158** entries records identity/card/owner, normalized ability IDs/location, source references, source PR/commit, formal/material/reviewer evidence, accepted-contract/runtime dependencies, main/frontier status, classification, runtime/hot-file evidence where available, and secondary dependencies.

## Completion

**RECONCILIATION_INVENTORY_COMPLETE**

Inventory complete is not Semantic Replay complete and does not authorize merge readiness.
