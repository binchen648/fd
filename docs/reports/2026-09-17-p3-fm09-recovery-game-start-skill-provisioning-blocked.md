# P3-FM09 Recovery Game-Start Skill Provisioning Migration - S Blocker

Date: 2026-09-17
Owner: Codex S
Status: `MIGRATION_BLOCKED`

## Pins

- Integrated current-main baseline: `553779e8ffcc926ae4763ee86a2ea937e090c128`
- Accepted FB2-15 recovery candidate: `23a666913a3050ad55d781e3f5b3a1518add4c3e`
- Fresh R41 verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- A recovery synchronization / S base: `fa89d867977056968ec98019129487f80ed839df`
- Frozen F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

Historical FM09 material, including `85f9dab738b80bcbee7d2dfb9c1e9de132f973f1` and its old downstream acceptance/blocker chain, is used only as technical reconstruction material. No old FM09 acceptance is inherited on this integrated recovery lineage.

## Exact authorized FM09 sources

The authorized source family remains exactly ten identities from the accepted FB2-15 recovery handoff:

1. `master.bazett.skill.s1` -> `master.bazett.skill.s2`
2. `master.caules-yggdmillennia.skill.s1` -> `master.caules-yggdmillennia.skill.s2`, `master.caules-yggdmillennia.skill.s3`
3. `master.ciel.skill.s1a` -> `master.ciel.skill.s2`
4. `master.fujino.skill.s1` -> `master.fujino.skill.s3`
5. `master.shiki-nanaya.skill.s1` -> `master.shiki-nanaya.skill.s2`
6. `master.shiki-ryougi.skill.s1` -> `master.shiki-ryougi.skill.s2`
7. `master.shiki-ryougi.skill.s1a` -> `master.shiki-ryougi.skill.s3`
8. `master.shiki-tohno.skill.s1` -> `master.shiki-tohno.skill.s2`
9. `master.shirou-emiya.skill.s2` -> `card.derived.master.shirou-emiya.ganjiang-moye`
10. `master.zouken.skill.s2` -> `master.zouken.skill.s3`, `master.zouken.skill.s4`

The three exclusions remain `master.fiore.skill.s1`, `master.sion.skill.ascension`, and `master.tokiomi.skill.s2`.

Fresh exact-ID scan on S base finds canonical source presence `0/10`, exclusion presence `0/3`, and required provisioning target registration `0/12`.

## Fresh S migration attempt

S did not write the old FM09 authoring into canonical files. Instead, an in-memory probe reconstructed only the exact ten source card objects from historical technical material, merged them onto the current `fa89d86...` canonical archive model, and executed the current accepted loader/classifier/compiler.

This avoids committing authoring that is already known to violate the accepted product compiler while still exercising the exact proposed migration against the current runtime boundary.

Fresh proposal evidence:

- source F1/Reference/hash provenance: `10/10` PASS;
- unique provisioning targets: `12`;
- locked Reference verification at `b2f9fa15fba07c63530bbf4612b03b8b704755f9`: PASS;
- exact-ten source `loadAuthoringJson`: `10/10` PASS with zero loader reports;
- exact-ten source `isGameStartSkillProvisioningSemantic`: `10/10` PASS;
- proposal product archive count after adding the nine FM09 owner archives to the current enabled product set: `23`;
- product executable compilation: FAIL CLOSED at the accepted FB2-15 target-registration boundary.

Exact compiler result:

```text
Invalid game-start skill provisioning target master.bazett.skill.s2: master.bazett.skill.s1#s1.game-start-skill-provisioning
```

The current branch itself remains typecheck-clean before the blocker report; no product source or canonical authoring mutation was required to reproduce the failure.

## Blocking dependency

The accepted FB2-15 compiler requires every `provision_skill_cards.targetDefinitionIds` member to already be a registered same-owner automatic `master_skill` before initial-placement deferral is allowed. The source proposal is therefore structurally valid, but its target-registration dependency is not satisfied.

All twelve targets are absent from current canonical authoring. Eleven are frozen static identities in the 944 denominator:

- `master.bazett.skill.s2`
- `master.caules-yggdmillennia.skill.s2`
- `master.caules-yggdmillennia.skill.s3`
- `master.ciel.skill.s2`
- `master.fujino.skill.s3`
- `master.shiki-nanaya.skill.s2`
- `master.shiki-ryougi.skill.s2`
- `master.shiki-ryougi.skill.s3`
- `master.shiki-tohno.skill.s2`
- `master.zouken.skill.s3`
- `master.zouken.skill.s4`

The twelfth target, `card.derived.master.shirou-emiya.ganjiang-moye`, is not a frozen static 944 identity.

Fresh inventory verification finds all eleven frozen targets present in the frozen full-roster inventory (`11/11`) and the derived Shirou target absent from that frozen inventory, as required.

## Why S does not repair the blocker inside FM09

Adding the eleven frozen target skills inside FM09 would expand an exact-ten source migration into at least twenty-one frozen identities without accepted contracts for those target semantics. Adding placeholder target cards would create fake canonical coverage. Weakening the compiler would modify the already accepted FB2-15 runtime boundary. Treating the derived Shirou target as a frozen identity would corrupt denominator accounting.

All four are outside P3-FM09-RECOVERY scope and explicitly prohibited by the A dispatch.

## Result

P3-FM09-RECOVERY is `MIGRATION_BLOCKED`.

No FM09 source identity is committed as canonical authoring by this S task. No runtime, taxonomy/KPI, Reference, generated-content, or unrelated authoring file is changed. Accepted current-main overlap remains `111/944` (`11.76%`), with `833/944` remaining.

Required next step: Codex A must freshly synchronize this blocker and reconcile the eleven frozen target identities plus the one derived-card dependency against currently accepted contracts and canonical material before dispatching the next legal dependency task. FM09 may be retried only after all required target definitions can satisfy the accepted FB2-15 compiler contract without broadening the exact-ten source family. Do not jump directly to Ciel and do not import the superseded downstream acceptance chain.
