# P3-B Abigail s3a Builder report

## Scope

This Builder change is limited to `servant.abigail.skill.sc-abigail-3` first clause:

`被动/行动阶段：移除手牌的一张【领域外生命】。若如此，获得2点魔力。`

The second clause of s3, and s1, s2, and s4 remain source-only. No Candidate, PR,
A-sync, inventory, or credit accounting was created.

## Canonical provenance

- Main source candidate: `E:\Codex\FD\Fate_Domination-重构版\src\content\generated\legacy-content.json`, SHA-256 `8DE23E47529D59E1E05BB8FBD74E1FAAADF21687CBCCDD859B5A8ACFB85E277C`, locator `servants[178].skills[2].text#line=1`, clause SHA-256 `967eb0e8af3fde249604483793fb7d414e2e702dc7f37dff62ebd122b3675838`.
- Development source candidate: `E:\Codex\FD\Fate_Domination-开发版\batch_berserker_extra.js`, SHA-256 `6BF26E40FF08FF632AC5DCEE88A9CDA4684E60CA71C39ADADBB239D1F3723FDC`, locator `servant.abigail`.
- Development card image candidate: `E:\Codex\FD\Fate_Domination-开发版\images\servants\阿比盖尔·威廉姆斯.png`, SHA-256 `3A049A05FC5B7A1C8CA864EA3152239C2E353E15CA509C623487A91B73179D1F`.
- The authoring archive records these candidates as relative metadata paths so the pack validator remains deterministic; this report preserves the absolute audit paths.

## Contract

The accepted runtime contract is source-specific and fail-closed:

1. The active source card must be the owned/controller-controlled canonical s3 card,
   face-up and active during the action phase.
2. Exactly one private controller hand `card_instance` is selected. Its canonical
   definition is `servant.abigail.skill.sc-abigail-4`, its owner and controller are
   the source controller, its zone is `hand`, its visibility is owner-only, and its
   provenance marker is exactly `generatedBy=servant.abigail.skill.sc-abigail-1`.
3. The action moves that one card atomically to `removed_from_game` and then grants
   two mana through the typed mana primitive. Any stale, forged, duplicate, wrong
   owner/controller/zone/source, or changed phase/source state rejects before mutation.
4. Pending target snapshots and restore validation re-evaluate the same source and
   provenance contract; replay cannot apply the card or mana effect twice.

`servant.abigail.skill.sc-abigail-4` is the canonical Outside-Life derived-card
identity and is mapped in both authoring and executable deck compilers. The fixed
seven-player MatchSession roster intentionally excludes Abigail until the remaining
source-only clauses have accepted owner contracts; the live session still loads and
validates the Abigail cards from the generated executable pack.

## Verification

- Abigail focused regression: 4/4.
- Existing MatchSession regression: 30/30.
- `npm run content:validate`: 8 masters, 8 servants, 20 events, 0 blocking issues.
- `npm run verify:generated-content`: deterministic hashes pass.
- `npm run verify:playtest-v1`: 8 masters, 8 servants, 20 events, 96 starting-deck cards, 0 private-view leaks.
- `npm run typecheck`: pass.
- `git diff --check`: pass.
