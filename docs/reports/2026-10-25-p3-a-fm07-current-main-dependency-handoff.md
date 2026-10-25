# P3-A FM07 current-main dependency and author handoff

Role: Codex A dependency reconciliation
Status: `DEPENDENCY_RECONCILIATION_REQUIRED`
Task: `P3-FM07` Alter Ego Transform authoring migration

## Exact current-main Base

- Current A-sync Base: `d54fb52b2d2ff711f4e0ef24b1028884fc26511a`.
- This line contains accepted FB2-02, FB2-11, FB2-12, FM05, and FM06 dependencies; formal ledger is `123/944`.
- The current source has unrelated B23 return-silence loss-transform code, but no accepted FB2-13 Alter Ego Transform runtime contract. That unrelated transform must not be used as an FM07 substitute.
- Historical FB2-13/FM07 evidence shares only common handoff Base `09ddfaee5ea54226d232c85d80db32a7b04b186e`; it is not the current Base.

## Historical accepted evidence, not current-main lineage

- FB2-13 runtime Candidate: `18f2733eb0551f368e78a5f67ad9a32b96193d5b`.
- Independent Reviewer: `dc96afa3253dcf86a13e13ea29c8b99fb895df49`.
- Historical A evidence sync: `2fec63dbd6533f435e851c471d3bf00fa75695e2`.
- Historical FB2-13 handoff Base: `61d9f0c92e0af7598e237b71fb90ad83c13c88c1`.

These objects establish contract evidence only. No historical Candidate, review branch, or A-sync is copied into the current-main line.

## Dependency reconciliation

The accepted FB2-13 runtime delta is broader than an authoring-only change and must be A-materialized before FM07 dispatch. The exact historical runtime/test paths are:

`packages/rules/src/ability/card-instance-state.ts`, `packages/rules/src/ability/extended-effects.ts`, `packages/rules/src/ability/interpreter.ts`, `packages/rules/src/ability/loader.ts`, `packages/rules/src/ability/resolution-dataflow.ts`, `packages/rules/src/ability/types.ts`, `packages/rules/src/core/combat-resolver.ts`, `packages/rules/src/index.ts`, `packages/rules/src/match-session.ts`, and `packages/rules/tests/regression/fb2-alter-ego-transform.test.ts`.

A must three-way reconcile only the accepted FB2-13 runtime/test delta onto `d54fb52...`, retaining current FB2-02/11/12 and FM05/FM06 behavior. Exclude historical FM03/FM04/FM05/FM06 authoring drift, coverage, generated artifacts, task-index rewrites, governance, B23 return-silence semantics, and all FM07 archives. No dependency materialization is performed by this docs-only handoff.

## FM07 contract after dependency readiness

After the accepted FB2-13 runtime is materialized and independently revalidated on this current line, a fresh Builder may modify only ten authoring archives, one focused migration test, and one report:

1. `servant.douman.skill.sc-douman-3`
2. `servant.koyanskaya.skill.sc-koyanskaya-1`
3. `servant.mechaeli.skill.sc-mechaeli-3`
4. `servant.meltryllis.skill.sc-meltryllis-3`
5. `servant.muramasa.skill.sc-muramasa-3`
6. `servant.okita-alt.skill.sc-okita-alt-1`
7. `servant.passionlip.skill.sc-passionlip-1`
8. `servant.sitonai.skill.sc-sitonai-3`
9. `servant.taisui.skill.sc-taisui-1`
10. `master.sion.skill.s12`

The first nine use the regular identity-free transform variant; Sion is the EX variant with fixed controller mana cost 3, source remains active, and once-per-round behavior. Preserve frozen full-text/source/reference metadata and final skill-zone rule. No broad transform, generic target selection, identity/name/text routing, or unrelated reverse-capable card is allowed.

## Dispatch boundary

`FM07 CURRENT-MAIN DISPATCH BLOCKED_PENDING_A_FB2-13_RUNTIME_MATERIALIZATION`.

The next A action is to materialize and verify the accepted FB2-13 runtime/test delta on exact Base `d54fb52...`; only then may A authorize a fresh FM07 Builder Candidate. This report does not claim FM07 acceptance, credit, or merge.
