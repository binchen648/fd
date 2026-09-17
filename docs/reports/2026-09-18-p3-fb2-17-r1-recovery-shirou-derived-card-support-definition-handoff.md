# P3-FB2-17-R1 Recovery Shirou Derived-Card Support Definition Retry Handoff

Date: 2026-09-18
Role: Codex A -> Codex S
Status: `READY_FOR_S_RECOVERY`
Credit: zero frozen-migration credit

## Exact base and authority

- Base: exact fresh post-R43 A synchronization commit carrying this handoff.
- Fresh R43-accepted FB2-18 recovery candidate: `cb81559033db6b96b1f26cf7d9bd15686db5d4fb`.
- Prior fresh FB2-17 blocker: `310e6546fa2457b6bf11b91e547d25eb39751e99`.
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`.
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- Support target: `card.derived.master.shirou-emiya.ganjiang-moye`.

Historical FB2-17/18/19 worktrees and commits are technical evidence only. Do not reuse or clean prior experimental worktrees. Start fresh from this A synchronization lineage.

## Goal

Retry materialization of exactly one non-frozen derived support definition, `card.derived.master.shirou-emiya.ganjiang-moye`, so it is registered as the same-owner automatic `master_skill` required by accepted FB2-15 while accepted FB2-18 keeps it outside the game initially.

Do not migrate frozen Shirou source skill `master.shirou-emiya.skill.s2` or any other frozen identity.

F1 is authoritative only for the future provisioning relationship that at game start Shirou s2 adds the derived card from outside the game to the skill zone.

Locked Reference may supply only stable identity/static metadata and source locator:

- id `card.derived.master.shirou-emiya.ganjiang-moye`;
- name `干将·莫邪`;
- owner `master.shirou-emiya`;
- `cardType: "master_skill"`;
- cost `1`;
- base Power `5`;
- attributes `力量` and `宝具`;
- skill-zone mana requirement `8`;
- printed rule equivalent to `（你的魔力需要达到8点才能打出此牌）\n投影-此牌需追加打出。`.

Do not copy Reference implementation code, special handlers, identity routing, or legacy runtime behavior.

## Exact authoring semantics

The support card must use:

- `initialPlacement: "outside_game"` exactly;
- `playRequirements: [{ type: "skill_zone_mana_at_least", value: 8 }]`;
- ordinary action/controller play timing;
- exact R42-accepted required-additional marker:
  - kind `passive`;
  - activation exactly `{ trigger: "while_active" }`;
  - effects exactly `[{ type: "append_only_rule" }]`;
  - execution exactly `{ mode: "automatic" }`;
  - no semantic widening or extra effect fields.

The proposed archive must contain only this support card. Do not add frozen Shirou skills.

## May touch

Only:

1. `data/authoring/masters/master.shirou-emiya.json` — new archive containing only the support card.
2. `data/packs/fd-playtest-v1/pack.json` — register the archive through the currently available manifest path for this retry probe/candidate attempt.
3. `data/generated/fd-playtest-v1.content-library.json` — normal deterministic generator output only.
4. `data/generated/fd-playtest-v1.evidence-report.json` — normal deterministic generator output only; explicitly authorized because the fresh first blocker proved this legitimate generator drift.
5. `docs/reports/2026-09-18-p3-fb2-17-r1-recovery-shirou-derived-card-support-definition-result.md` — result/evidence report.

No `packages/rules`, `packages/content`, MatchSession, interpreter, executable compiler, scripts, taxonomy/KPI, other authoring archive, frozen skill, Reference, fixture output, or unrelated generated file may change.

If the current manifest/loader path still turns the support-only archive into a playable eighth master, creates master presentation material, synthesizes a fallback command spell, perturbs the stable playable-roster boundary, or otherwise requires a loader/compiler change, return `SUPPORT_DEFINITION_BLOCKED`. Do not normalize those effects by changing tests or widening scope.

If normal compilation changes any generated output not listed above, stop as `SUPPORT_DEFINITION_BLOCKED` and report the exact drift rather than widening scope.

## Required verification

At minimum:

- exact clean Base and lineage;
- exact-ID scan proving the target is absent before the retry and exactly one in the experimental product;
- executable compilation proves `initialPlacement: "outside_game"` survives and target has no `initialZone`;
- prove all other eleven frozen FM09 target definitions remain absent;
- prove no frozen-944 identity is added to accepted overlap;
- prove owner/card type/mode, 8-mana gate, and exact required-additional marker survive authoring -> loaded rules -> executable compilation;
- explicitly inspect playable master count, presentation material, executable character definitions, fallback command spells, and archive boundary;
- `npm.cmd run typecheck`;
- relevant focused content/executable-pack/FB2-18 tests;
- `npm.cmd run content:validate`;
- normal content generation followed by `npm.cmd run verify:generated-content`;
- full `npm.cmd run test:ci` only if focused/content structural gates pass;
- `git diff --check`;
- exact scope audit proving zero runtime/taxonomy/frozen migration changes.

Completion status allowed:

- `SUPPORT_DEFINITION_COMPLETE_CANDIDATE`
- `SUPPORT_DEFINITION_BLOCKED`

A successful candidate still requires A material synchronization and fresh independent review before it becomes accepted dependency evidence. FM09 remains blocked regardless until the other eleven frozen provisioning targets are separately closed.
