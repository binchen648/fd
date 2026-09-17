# P3-A Post-R40 Recovery Dispatch Correction

Date: 2026-09-17
Role: Codex A
Status: `DISPATCH_CORRECTED`

## Correction

Post-R40 recovery acceptance commit `aec3e11ffdaa6eec76e339793af421573bf94df8` correctly synchronizes local recovery-line FM08 acceptance at `111/944`, but its wording that FM09 may resume directly from that synchronization is too broad.

The old downstream task graph shows that FM09 itself depends first on the accepted FB2-15 game-start skill-provisioning runtime contract and its R41/A synchronization. That downstream work is not present on the corrected recovery lineage because it was created after the superseded FM08 chain.

Therefore the next legal recovery step is:

1. rebuild FB2-15 game-start skill provisioning on the corrected post-R40 lineage;
2. run fresh R41 review;
3. run fresh A synchronization;
4. only then re-run FM09 blocker/migration planning on that corrected lineage.

Later downstream support work (FB2-16, FB2-18, FB2-19, FB2-17-R3 and any subsequent provisioning-target support definitions) likewise cannot inherit old acceptance provenance merely because the numeric overlap is again `111/944`.

## State

- Local recovery-line accepted overlap remains `111/944` (`11.76%`).
- FM08 remains `MIGRATION_ACCEPTED` on the corrected recovery lineage.
- FM09 is **not yet READY** on this lineage.
- Next recovery gate: `P3-FB2-15-RECOVERY` from exact post-R40 A synchronization lineage.
- `BASELINE_REBASE_REQUIRED` remains open.
- GitHub reviewer-identity/status governance remains open.

No migration credit changes in this correction.
