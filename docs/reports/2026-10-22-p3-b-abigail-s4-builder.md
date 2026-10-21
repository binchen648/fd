# P3-B Abigail s4 Builder

Status: Builder implementation complete; pending independent GPT-6 Sol review. No Candidate, PR, A-sync, or credit was created.

## Scope

Only `servant.abigail.skill.sc-abigail-4` is implemented. The accepted s3a/s3b contracts remain unchanged. The implementation is source-bound to the true-name release and terminal discard clauses:

- `servant.abigail.skill.sc-abigail-4.true-name-release`: action-phase on-use declaration installs one auditable +6 total-power envelope for the controller and Abigail; the target list is canonical and exact, so Abigail as controller receives +6 once, not +12. It also reveals Abigail's servant package. Wrong-phase events are rejected before event-ledger mutation.
- `servant.abigail.skill.sc-abigail-4.recycle-to-abigail-discard`: an active source with an installed release envelope is accepted only for a canonical `after_battle_ended` event, then atomically moves the source to Abigail's owner-only discard and removes the envelope. Event replay is idempotent through the runtime processed-event ledger.

The runtime validates the exact card definition, `generatedBy` marker, owner/controller relationship, active public `attack_area` source state, Abigail uniqueness, exact ability/effect shape, and restore envelope. The target envelope is exactly `[controller, Abigail]` (or `[controller]` when identical), with no third player or reorder. Combat totals consume only the validated envelope and the active source. Unreleased Outside-Life cards are excluded from the s4 terminal trigger, and s3b terminal cleanup skips a released s4 source so same-event ordering remains atomic.

## Provenance

- Legacy source: `Fate_Domination-重构版/src/content/generated/legacy-content.json`, SHA-256 `8DE23E47529D59E1E05BB8FBD74E1FAAADF21687CBCCDD859B5A8ACFB85E277C`, locator `servants[178].skills[3].text`.
  - Clause 1 (`【真名解放】`) UTF-8 SHA-256 `34d0686e0a3e32928564917e173f901363e57039d02d16fb7d63a4003209ab4c`.
  - Clause 2 (`你和阿比盖尔各获得+6合计威力（若你是阿比盖尔，该效果不会令你+12合计威力）。`) UTF-8 SHA-256 `6a848e72c9475916be224140aae1bd920e23d7716e82ced6b7c039321ea54a60`.
  - Clause 3 (`战斗阶段结束后，将此牌加入阿比盖尔的弃牌堆。`) UTF-8 SHA-256 `04d91af3bd1b263a8e9a2ed8d6562257fc21cdb07810c9344230caa419ad1231`.
- Development image: `Fate_Domination-开发版/images/servants/阿比盖尔·威廉姆斯.png`, SHA-256 `3A049A05FC5B7A1C8CA864EA3152239C2E353E15CA509C623487A91B73179D1F`.
- Development source: `Fate_Domination-开发版/batch_berserker_extra.js`, SHA-256 `6BF26E40FF08FF632AC5DCEE88A9CDA4684E60CA71C39ADADBB239D1F3723FDC`, Abigail `x_Foreigner` record.

## Verification

- focused Abigail s4 regression: 8/8
- accepted Abigail s3a+s3b regressions: 9/9
- MatchSession suite: 30/30
- `npm run content:compile`: 0 blocking issues
- `npm run content:validate`: 0 blocking issues
- `npm run verify:generated-content`: PASS
- `npm run verify:playtest-v1`: 8 masters, 8 servants, 20 events, 96 starting-deck cards, 0 private-view leaks
- `npm run typecheck`: PASS
- `git diff --check`: PASS

The generated content library was refreshed from the authoring archive. Existing repository-wide servant asset tests that expect the pre-Abigail seven-servant roster remain outside this owner scope; the authoritative pack verifier and generated-content checks pass.
