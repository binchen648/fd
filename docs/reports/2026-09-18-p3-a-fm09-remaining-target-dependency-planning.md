# P3-A FM09 Remaining-Target Dependency Planning After R45

Date: 2026-09-18
Role: Codex A
Status: `SYNCHRONIZED`
Credit: zero frozen-migration credit

## Exact base

- Base: post-R45 acceptance synchronization `575650f7be3dc9a3a61d5191d0a44829b6daf8ba`.
- Integrated main ancestor: `553779e8ffcc926ae4763ee86a2ea937e090c128`.
- Accepted non-frozen Shirou derived target dependency: `1c3149ba5f33ad3092a57da4a12d7bbe96f43823`, fresh R45 accepted.
- Frozen accepted overlap: `111/944`; eleven frozen FM09 provisioning target definitions remain absent.

## Fresh target classification

A re-read the locked Reference rule-program/static data and current recovery runtime rather than inheriting historical target order. The eleven remaining targets still span distinct semantics.

Key narrowing evidence:

- `master.caules-yggdmillennia.skill.s2`: source-grounded, but needs both an exact deployment-to-non-battlefield trigger and a turn-scoped player-level defeat-ignore semantic; not one narrow prerequisite.
- `master.caules-yggdmillennia.skill.s3`: FB2-16 covers required-additional play and a power-zero primitive exists, but current `set_opponent_power_to_zero` is not attribute-filtered and there is no generic once-per-game unused-attribute declaration state; more than one gap.
- `master.fujino.skill.s3`: its effect must activate `master.fujino.skill.s2`, which is itself absent and therefore a transitive frozen dependency outside a one-target attempt.
- `master.shiki-ryougi.skill.s3`: card-zone primitives exist, but the exact cross-player private-hand inspection/optional-return interaction contract is not accepted; generic private interaction must be solved first.
- `master.ciel.skill.s2`: low-mana play exception, battle-result conditions, fixed mana gain, location condition, and VP adjustment already have accepted generic routes. Its one missing generic value is the controller's effective authored terrain/deployment bonus.

Ciel is therefore not dispatched directly. The narrowest legal next task is an identity-free shared terrain/deployment-bonus metric seam, with zero frozen credit.

Historical non-recovery FB2-20 Ciel work is used only as technical evidence that the missing value can be isolated. It carries no acceptance authority and its combined card+runtime scope is not inherited.

## Required next step

Dispatch `P3-FB2-21-RECOVERY` only for a shared `controller.deployment_bonus` server-owned metric backed by the same terrain calculation used by combat resolution. No authoring card, pack registration, generated content, Ciel identity, or migration credit belongs in FB2-21.

After a fresh independent review accepts FB2-21 and A synchronizes that acceptance, a separate fresh S task may attempt exactly `master.ciel.skill.s2` as one frozen support definition.