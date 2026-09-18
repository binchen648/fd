# P3-A Ryougi S3 Recovery Feasibility / FB2-24 Dispatch

Date: 2026-09-18
Role: Codex A
Status: SYNCHRONIZED
Base: exact post-R48 acceptance synchronization `e8c312986d9d01c9e28e3e70309c925f6f6a5f4b`
Target: `master.shiki-ryougi.skill.s3`

## Fresh source grounding

Accepted F1 evidence commit `59f145434695d29bdd17e4cb3adc887e84182377` identifies exactly `master.shiki-ryougi.skill.s3`, owner `master.shiki-ryougi`, name `死・紧握`, with two printed clauses:

1. `此牌需追加打出。`
2. `行动阶段：查看一名与你位于同一战场的玩家的手牌，你可将其中一张牌洗回其所有者的牌库。`

Locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9` is used only for stable static metadata/source location and independently supplies legacy id `s3`, type `魔术`, cost `1`, base Power `0`, legacy requirement `1`, and the Ryougi source locator. Reference handler/runtime syntax is not authority.

## Current-lineage feasibility

No further generic runtime prerequisite remains after R48-R2. The exact card can be represented using already accepted contracts only:

- support-only master archive: P3-R44 / FB2-19;
- outside-game initial placement for later source-driven provisioning: P3-R43 / FB2-18;
- exact required-additional marker: P3-R42 / FB2-16;
- exact same-battlefield private hand inspection / optional return-one-to-owner-deck interaction: P3-R48-R2 / FB2-23.

Fresh in-memory authoring probe on this exact accepted lineage loads with zero unsupported report entries. It preserves `master_skill`, `outside_game`, automatic execution, recognizes the first ability as the exact required-additional marker, and recognizes the second ability through the accepted FB2-23 interaction gateway.

The literal F1 target scope is “一名与你位于同一战场的玩家”; therefore implementation must not invent opponent-only or `not_controller` restrictions.

## P3-FB2-24-RECOVERY dispatch

Implement exactly one frozen support definition: `master.shiki-ryougi.skill.s3`.

Expected product shape:

- `archiveType: master_support_definition_archive`;
- owner/archive `master.shiki-ryougi`;
- exactly one card `master.shiki-ryougi.skill.s3`;
- `cardType: master_skill`;
- `initialPlacement: outside_game`;
- card face: type/attribute `魔术`, cost `1`, basePower `0`;
- action/controller play timing;
- `skill_zone_mana_at_least = 1`;
- ability 1: exact FB2-16 passive/while-active/`append_only_rule` marker;
- ability 2: exact FB2-23 action-phase same-battlefield private-hand-return semantic envelope.

May touch only the new Ryougi support authoring file, pack support registration, generated content library, executable-card aggregate expectation if required, one focused regression file, and the FB2-24 result report. No `packages/rules/src/**`, MatchSession, compiler, F1/Reference, taxonomy/KPI, UI/server, fixture/evidence, second frozen target, FM09/FM10, merge, or PR retarget is authorized.

Current accepted recovery overlap remains `112/944` during implementation/review. Candidate material may become `113/944` only by adding exactly `master.shiki-ryougi.skill.s3`; accepted credit must wait for fresh independent R49 and post-review A synchronization.
