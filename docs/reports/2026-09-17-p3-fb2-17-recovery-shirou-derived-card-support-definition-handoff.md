# P3-FB2-17 Recovery Shirou Derived-Card Support Definition Handoff

Date: 2026-09-17
Role: Codex A -> Codex S
Status: `READY_FOR_S_RECOVERY`
Credit: zero frozen-migration credit

## Base and evidence

- Base: exact fresh post-R42 A synchronization commit carrying this handoff.
- Accepted FB2-16 recovery candidate: `bc45b2032ec344d2c743d8b32e3a3d05aa8b67ca`.
- Fresh FB2-16 planning base: `ff0c9cb853d9b72273736d41ca85d8d1f08614fa`.
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`.
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- Support target: `card.derived.master.shirou-emiya.ganjiang-moye`.

Fresh exact-ID scanning confirms the support target is absent from canonical authoring and the generated product definition set. The other eleven FM09 provisioning targets are also absent. The target is outside the frozen 944 denominator, so this task earns no migration credit.

## Exact authority split

Frozen F1 evidence for `master.shirou-emiya.skill.s2` is authoritative for the relationship that at game start the derived `干将·莫邪` card is added from outside the game to the skill zone.

Locked Reference may be used only for the derived card's stable identity/static metadata and source locator:

- id `card.derived.master.shirou-emiya.ganjiang-moye`;
- name `干将·莫邪`;
- owner `master.shirou-emiya`;
- `cardType=master_skill`;
- cost `1`;
- base Power `5`;
- attributes `力量` and `宝具`;
- skill-zone mana requirement `8`;
- printed rule equivalent to `（你的魔力需要达到8点才能打出此牌）\n投影-此牌需追加打出。`.

Do not copy Reference implementation code, special handlers, identity routing, or legacy runtime behavior.

Fresh FB2-16/R42 is authoritative only for the required-additional semantic. Encode the `此牌需追加打出。` clause using the same exact structural authoring shape accepted by R42:

- ability kind `passive`;
- activation exactly `{ trigger: "while_active" }`;
- effects exactly `[{ type: "append_only_rule" }]`;
- execution exactly `{ mode: "automatic" }`;
- no extra effect fields or semantic widening.

Represent the 8-mana requirement with the current canonical authoring contract `playRequirements: [{ type: "skill_zone_mana_at_least", value: 8 }]`. Normal cost/Power/attributes belong in `cardFace`; ordinary play timing remains `action / controller_play_card_window`.

## May touch

Only:

1. `data/authoring/masters/master.shirou-emiya.json` — new archive containing only this derived support card; do not pre-migrate Shirou's frozen skills.
2. `data/packs/fd-playtest-v1/pack.json` — register that authoring archive.
3. `data/generated/fd-playtest-v1.content-library.json` — deterministic generated output only.
4. `docs/reports/2026-09-17-p3-fb2-17-recovery-shirou-derived-card-support-definition-result.md` — result/evidence report.

No `packages/rules`, executable compiler/interpreter, scripts, taxonomy/KPI, other authoring archive, frozen source skill, Reference, or unrelated generated file may change.

If the current loader/compiler cannot represent the exact support card without assigning semantically incorrect initial placement, return `SUPPORT_DEFINITION_BLOCKED`; do not widen scope. If the official generator materially requires another generated output outside this May-touch list, record that as a blocker rather than silently expanding scope.

## Required verification

At minimum:

- prove worktree base is the exact A synchronization commit and starting tree is clean;
- exact-ID scan: target changes from absent to exactly one proposed registered definition, while all eleven frozen FM09 targets remain absent;
- independently verify frozen F1 relationship and locked Reference static metadata;
- `npm.cmd run typecheck`;
- `npm.cmd run content:validate`;
- official content compilation / generated determinism probe sufficient to expose any generated-output or placement mismatch;
- focused loader/executable evidence proving owner, `master_skill`, mana gate, required-additional marker, and initial-placement behavior;
- `git diff --check`;
- scope check proving no runtime/taxonomy change and zero frozen-944 overlap increase.

Completion status allowed:

- `SUPPORT_DEFINITION_COMPLETE_CANDIDATE`
- `SUPPORT_DEFINITION_BLOCKED`

After an S candidate, A material synchronization and a fresh independent review are still required before the support definition may be relied on as accepted dependency evidence. FM09 remains blocked regardless until the other eleven frozen targets are separately closed.
