# P3-A FM06 current-main dependency reconciliation

Role: Codex A dependency handoff
Status: `DEPENDENCY_RECONCILIATION_REQUIRED`
Task: `P3-FM06` Presence Concealment, following `P3-FB2-12`

## Exact current-main Base

- Current materialized A-sync Base: `a1e3c970893446d39ec8a1d9e991008d69683f52`.
- Its parent materialization is `c2df64f2cee72652a610ac5aec4f478fafbbc1f3`, which contains accepted FB2-02 and FB2-11 runtime deltas and accepted FM05 authoring.
- The current task index on this line is older than the historical FB2-12/FM06 records and does not itself authorize reusing those records.
- Historical FB2-12 A-sync `35aa5ef063fe6d8c6c611f70f0696bf111a80657` shares only common handoff Base `09ddfaee5ea54226d232c85d80db32a7b04b186e`; it is not the current-main Base.

## Historical evidence, not current-main acceptance

The historical evidence is useful for contract reconciliation only:

- FB2-12 runtime Candidate: `4c97449de07b1e7a859d8ef43b60e34069541830`.
- Independent FB2-12 Reviewer: `ee3367b1ea17e6db9d98b1ae42d769fae6122d5e`.
- Historical FM06 Candidate: `ebc1ca575fcef0e3894b13ec10613801e4227970`.
- Historical FM06 A-sync: `34f891a7739e86b835bc78e65aa58fdf5f4e955a`.

Neither historical Candidate is a current-main Candidate, and neither historical A-sync may be treated as the next Base.

## Reconciliation result

Current Base has no FB2-12 Presence Concealment runtime surface (`after_battle_power_calculated`, frozen pre-scoring snapshot, strict-second eligibility, highest-power defeat, battle-local winner/scoring rebuild, and stale/decline safeguards are absent from the current source/test tree). Therefore FM06 cannot be dispatched directly from `a1e3c970...` as an authoring-only migration: its twelve cards would not load through an accepted runtime contract.

The exact A-owned prerequisite is a dependency materialization that reapplies only the accepted FB2-12 production/test delta, with three-way reconciliation against the current FB2-02/FB2-11 interpreter and loader. The historical diff names the allowed dependency paths: `packages/rules/src/ability/interpreter.ts`, `packages/rules/src/ability/loader.ts`, `packages/rules/src/ability/types.ts`, `packages/rules/src/core/combat-resolver.ts`, `packages/rules/src/schema/game.ts`, plus the dedicated FB2-12 focused regression. Exclude historical FM03/FM04 runtime, authoring, coverage, generated artifacts, task-index rewrites, and all FM06 authoring.

## FM06 contract after dependency readiness

Once the accepted FB2-12 runtime is materialized and independently revalidated on this current line, a fresh FM06 Builder may start from that exact materialized Base and may change only the twelve canonical Presence Concealment servant archives, one focused migration test, and one report. The twelve IDs are:

`servant.corday.skill.sc-corday-1`, `servant.danzou.skill.sc-danzou-3`, `servant.hassan.skill.sc-hassan-1`, `servant.hassanhf.skill.sc-hassanhf-3`, `servant.hassanser.skill.sc-hassanser-1`, `servant.izou.skill.sc-izou-3`, `servant.jekyll.skill.sc-jekyll-3`, `servant.kama.skill.sc-kama-3`, `servant.kiritsugu.skill.sc-kiritsugu-1`, `servant.kotarou.skill.sc-kotarou-1`, `servant.semiramis.skill.sc-semiramis-1`, `servant.stheno.skill.sc-stheno-1`.

Frozen evidence is the common full-text SHA `29b3f6c71d8bc5eb6f004d930e5b753f44ee766fb2e47ea6b9f0d89f5fa9643f`, four F1 clause-source hashes from the historical A handoff, handler `core.presence-concealment`, Swift/cost 3/base Power 4/historical requirement 3, and final skill-zone gate 8. Semiramis must preserve its already accepted FM05 card unchanged. Sion EX and unrelated handlers remain excluded. FM06 itself must not alter runtime, coverage, generated artifacts, or governance.

## Dispatch boundary

`FM06 CURRENT-MAIN DISPATCH BLOCKED_PENDING_A_RUNTIME_MATERIALIZATION`.

The next A action is to materialize and verify accepted FB2-12 runtime on `a1e3c970...`; only after that exact Base is clean and focused/runtime checks pass may A authorize a fresh FM06 Builder Candidate. This docs-only handoff does not claim FM06 acceptance, migration credit, or merge.
