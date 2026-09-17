# P3-A FM09 Recovery Dependency Blocker Synchronization

Date: 2026-09-17
Role: Codex A
Status: `BLOCKER_SYNCHRONIZED`

## Pins

- Integrated current-main baseline: `553779e8ffcc926ae4763ee86a2ea937e090c128`
- Accepted FB2-15 recovery candidate: `23a666913a3050ad55d781e3f5b3a1518add4c3e`
- Fresh R41 verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- Prior A synchronization / S base: `fa89d867977056968ec98019129487f80ed839df`
- Fresh S blocker: `9c6e38b33de1f1d6f090e9c644d0ab66dbbee4e7`
- Frozen F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Blocker reconciliation

A synchronizes the fresh S result as a dependency fact, not as migration credit. FM09 remains the exact ten-source `core.game-start-add-skill` family from the accepted FB2-15 handoff, with the same three exclusions.

Fresh S reconstructed only the exact ten proposed source cards in memory on the integrated recovery lineage. Their frozen F1/Reference/hash provenance passed `10/10`; `loadAuthoringJson` passed `10/10` with zero reports; all ten abilities passed the accepted shared game-start provisioning classifier. The accepted FB2-15 executable compiler then failed closed at the first missing registered target:

```text
Invalid game-start skill provisioning target master.bazett.skill.s2: master.bazett.skill.s1#s1.game-start-skill-provisioning
```

This is the required accepted behavior, not a runtime defect. No FM09 source authoring was committed by S.

All twelve required provisioning targets remain absent from current canonical authoring. Eleven are frozen static identities in the 944 denominator; `card.derived.master.shirou-emiya.ganjiang-moye` is a derived target outside the frozen static denominator. Fresh inventory verification confirms the frozen target split `11/11` plus one non-frozen derived target.

A must not weaken FB2-15 compiler validation, create placeholder targets, fold the eleven additional frozen target identities into the exact-ten source batch, or count the derived target as a frozen identity.

## Fresh dependency classification

The eleven frozen targets are not one homogeneous migration family. Current full-roster inventory classifies them across at least nine distinct handler boundaries:

- `core.bazett-fragarach`
- `core.structured-skill`
- `core.caules-yggdmillennia-thunder`
- `core.fujino-injury-warp`
- `core.nanaya-death-perception`
- `core.ryougi-sever-life`
- `core.tohno-shiki-possession`
- `core.zouken-founder`
- `core.zouken-pseudo-vampire`

`core.structured-skill` appears on multiple targets, but the target set as a whole is heterogeneous and includes reviewed-special-handler work. The current accepted evidence therefore does not justify treating the eleven target identities as one support-definition batch or dispatching a broad runtime contract solely from taxonomy labels.

The exact FM09 source family remains dependency-blocked. No FM09 source identity is accepted or credited.

## Dispatch state

- P3-FM09-RECOVERY is `MIGRATION_BLOCKED` at S blocker `9c6e38b33de1f1d6f090e9c644d0ab66dbbee4e7`.
- No P3-FM10 is dispatched by this synchronization.
- No broad P3-FB2-16 implementation is dispatched merely from capability counts or historical downstream naming.
- No direct Ciel task is dispatched.
- Historical downstream FM09/FB2-16/17/18/19/20 work may be used only as technical planning evidence; it is not acceptance provenance on this integrated recovery lineage.
- Next coordinator work is explicit dependency / reviewed-special-handler planning to select one exact independently reviewable prerequisite contract or dependency packet before any runtime or support-definition modification.

Accepted current-main overlap remains `111/944` (`11.76%`), leaving `833/944`. This blocker synchronization takes zero migration credit.
