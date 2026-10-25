# P3-A FM08 current-main dependency / authoring handoff

Role: Codex A
Status: `DEPENDENCY_HANDOFF_READY` (no authoring, acceptance, credit, or A-sync)
Task: `P3-FM08`
Exact Base: `162d166f14b584c151e6820e68506ba2d9c24a83`
Branch: `codex/a-p3-fm08-current-main-dependency-handoff-20261026`

## Determination

FM08 is the locked `core.game-start-rule-flags` capability family. Its required runtime dependency is the identity-free FB2-14 typed persistent RuleOverride contract: a forced `game_start` ability installs one or more whitelisted, controller-scoped overrides. This is not a continuation of FM07's `core.alter-ego-transform` family.

The exact FM08 authoring batch is ten frozen F1 identities:

`master.bazett.skill.s1b`, `master.caules.skill.s1a`, `master.fiore.skill.s2`, `master.fiore.skill.s3`, `master.fiore.skill.s4`, `master.irisviel.skill.s1`, `master.peperoncino.skill.s1a`, `master.sieg.skill.s1`, `master.waver.skill.s1`, and `master.zouken.skill.s5`.

The two other rows under the same Reference handler remain excluded: `master.leonardo.skill.s1a` (incomplete event-mana infrastructure) and `master.ophelia.skill.s1a` (non-canonical Delayed Mystic Eye consumer). No dynamic identity or blocked row is eligible.

## Current-main dependency audit

The FM07 A-sync report at `162d166f` confirms the current line and retained dependencies through FB2-13, FM05, and FM06. Read-only inspection of this exact tree finds only the pre-existing `RuleOverrideState` schema/interface and existing `game_start` event plumbing. It does **not** contain the accepted FB2-14 runtime implementation, its regression test, or any of the ten FM08 authoring IDs. Therefore the old FM08 recovery runtime cannot be reused as-is on this Base.

Before any FM08 authoring, A/B must materialize the accepted FB2-14 runtime/test delta on this exact Base, with three-way reconciliation against current FM07 behavior. The accepted runtime/test scope is exactly these files (15 source + 1 regression test):

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/loader.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/ability/types.ts`
- `packages/rules/src/core/combat-resolver.ts`
- `packages/rules/src/core/effect-resolver.ts`
- `packages/rules/src/core/movement.ts`
- `packages/rules/src/core/rule-overrides.ts` (new typed RuleOverride authority)
- `packages/rules/src/core/situation-engine.ts`
- `packages/rules/src/index.ts`
- `packages/rules/src/match-session.ts`
- `packages/rules/src/phases/advance-phase.ts`
- `packages/rules/src/phases/preparation-phase.ts`
- `packages/rules/src/schema/game.ts`
- `packages/rules/tests/regression/fb2-game-start-rule-overrides.test.ts`

The dependency delta must preserve the current line's FB2-02/11/12, FM05, FM06, B23, and FM07 behavior. It must not copy historical reports, coverage artifacts, task-index edits, authoring files, or FM08 credit. Runtime-only coverage must not manufacture migration credit.

## Historical provenance reuse decision

Historical FM08 material is useful as a read-only semantic/reference input, but none of its acceptance state is current-main provenance:

- Original FB2-14/FM08 handoff and the superseded #342-#345 chain are not reusable for acceptance.
- Corrected recovery candidate `81ccb7e7e5d0f2cf5ad7da1eda3279c20a604c1a`, recovery A sync `bf496c772bda7eb9899fcfa51d825929951012b7`, and R40 report `8ed6b85f80f9b8a2069f523bb53fb58c7935f22d` were accepted on a different recovery lineage and cannot be relabeled as current-main evidence.
- The historical ten-card authoring shape may be reconstructed only after the dependency is materialized and independently checked. The existing playtest `master.irisviel.json` must remain untouched; canonical `master.irisviel.skill.s1` requires an isolated FM08 archive (`master.irisviel.fm08.json`) if authoring proceeds.
- No historical Candidate, Reviewer report, or A-sync is copied into this handoff branch, and no migration credit is recorded.

## Required next sequence

1. Materialize and independently verify only the accepted FB2-14 runtime/test delta listed above on exact Base `162d166f`.
2. Recompute the ten-ID F1/Reference membership and confirm zero selected IDs are already canonical on the resulting current-main lineage.
3. After the dependency is accepted, a separate S authoring Candidate may add exactly eight master archives, ten cards, and one focused FM08 regression; it must not modify runtime, coverage, generated content, task index, or governance.
4. Fresh R review and a fresh A synchronization are required before any FM08 acceptance or credit. Until then the accepted overlap remains the FM07 A-sync value `133/944`; FM08 contributes `+0`.

This report is A-owned planning/evidence only. It does not write FM08 authoring, perform A-sync, alter credit, or modify a frozen Candidate.
