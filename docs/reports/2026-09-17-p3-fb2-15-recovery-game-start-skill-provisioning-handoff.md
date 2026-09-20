# P3-FB2-15 Recovery Game-Start Skill Provisioning Handoff

Date: 2026-09-17
Role: Codex A
Status: `READY_FOR_B2_RECOVERY`

## Pins

- Integrated current-main baseline: `553779e8ffcc926ae4763ee86a2ea937e090c128`
- Accepted post-R40 synchronization provenance: `aec3e11ffdaa6eec76e339793af421573bf94df8`
- Accepted post-R40 dispatch correction provenance: `d72814a7f01ecba1eecd62960b60137e7500ed15`
- Current-main accepted overlap: `111/944` (`11.76%`)
- Frozen F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

This recovery dispatch starts from the integrated 111/944 main baseline. The superseded old FM08/R40 chain and its downstream FB2-15 acceptance are not acceptance provenance.

## Why FB2-15 is next

After corrected FM08 acceptance and PR2 integration, the next downstream gate required by FM09 is the identity-free `core.game-start-add-skill` provisioning runtime seam. FM09 cannot be re-run honestly until this capability is rebuilt and freshly reviewed on the integrated current-main lineage.

FB2-15 is runtime infrastructure only. It adds zero frozen canonical identities and cannot change `111/944`.

## Exact future FM09 source family

The future migration family remains the exact ten locked-Reference `core.game-start-add-skill` source identities:

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

The three unrelated Reference-handler members `master.fiore.skill.s1`, `master.sion.skill.ascension`, and `master.tokiomi.skill.s2` remain excluded.

## Required recovery contract

B2 may implement only one typed, identity-free game-start provisioning route.

The accepted candidate must:

- recognize only an exact automatic/forced `game_start` structural envelope for provisioning one or more nonempty target definition IDs;
- require every target definition to be an already registered same-owner automatic `master_skill` definition suitable for the controller skill zone;
- provision each distinct target exactly once as controller-owned/controller-controlled, face-up, inactive, non-temporary skill-zone material;
- be idempotent across repeated setup/replay/restore;
- fail closed for empty, duplicate, malformed, unknown, wrong-owner, wrong-card-type, wrong-zone, inactive/non-automatic, or non-game-start declarations;
- perform multi-target provisioning transactionally with rollback on any invalid target, never leaving partial mutation;
- use deterministic instance identity/evidence and existing trusted setup/card creation mechanics or one narrow typed equivalent;
- share the same exact structural classifier between compiler validation/deferral and runtime execution.

The implementation must not route by source identity, owner name, printed text, target allowlist, or Reference handler ID.

## Explicit exclusions

No authoring migration. No broad Card Zone/Card Create/Trigger/Lifecycle/Visibility acceptance. No item/training/derived-card special handling. No arbitrary setup creation promotion. No taxonomy/KPI change. No Reference mutation. No change to FM08 accepted material.

## Review sequence

1. B2 recovery implementation from integrated current main `553779e8ffcc926ae4763ee86a2ea937e090c128` plus this dispatch.
2. Fresh process-separated R41 review of candidate semantics, fail-closed compiler boundary, production setup path, replay/idempotency, transaction rollback, and exact future family/exclusions.
3. A recovery synchronization.
4. Only then may FM09 be rescanned on the integrated current-main lineage.

No migration credit is taken by FB2-15/R41/A sync.
