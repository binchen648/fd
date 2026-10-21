# P3-B Abigail s3b Builder report

## Scope

This Builder change is limited to the second clause of
`servant.abigail.skill.sc-abigail-3`:

`行动阶段：将你的弃牌堆中任意数量的【领域外生命】打出，战斗阶段结束后将你所有激活的【领域外生命】洗入牌库。`

The first clause remains unchanged and is inherited from accepted Candidate
`6424b3463751b29664b8ef56df1819a18aeab454`. Abigail s1, s2, and s4 remain
source-only. No Candidate, PR, A-sync, inventory, or credit accounting was
created.

## Canonical provenance

- Main source candidate: `E:\Codex\FD\Fate_Domination-重构版\src\content\generated\legacy-content.json`, SHA-256 `8DE23E47529D59E1E05BB8FBD74E1FAAADF21687CBCCDD859B5A8ACFB85E277C`, locator `servants[178].skills[2].text#line=2`, clause SHA-256 `a68c200c1a14a2a22a091514c57ab1ae24a8aff0ae94becd97fe139eb9d9c208`.
- Development source candidate: `E:\Codex\FD\Fate_Domination-开发版\batch_berserker_extra.js`, SHA-256 `6BF26E40FF08FF632AC5DCEE88A9CDA4684E60CA71C39ADADBB239D1F3723FDC`, locator `servant.abigail`.
- Development card image candidate: `E:\Codex\FD\Fate_Domination-开发版\images\servants\阿比盖尔·威廉姆斯.png`, SHA-256 `3A049A05FC5B7A1C8CA864EA3152239C2E353E15CA509C623487A91B73179D1F`.
- The authoring archive records the source candidates as relative metadata paths; this report preserves the absolute audit paths and exact clause locator/hash.

## Contract

The second-clause runtime is source-specific and fail-closed:

1. The owned/controller-controlled canonical Abigail s3 source must be face-up
   and active in the action phase. The action opens one private target decision
   over controller-owned/controller-controlled discard cards only.
2. Every selected card must be the canonical Outside-Life definition,
   `generatedBy=servant.abigail.skill.sc-abigail-1`, owner/controller matched to
   Abigail, discard zone, and owner-only visibility. Any number from zero through
   the canonical twelve-card envelope is selectable, dynamically capped by the
   live canonical candidate count.
3. Selected cards are played in one trusted effect batch from discard. Their
   printed mana costs are aggregated and paid before any card moves; insufficient
   mana, duplicate, forged, wrong-zone, stale, or changed-source selections leave
   the state byte-for-byte unchanged. The normal card-play lifecycle then marks
   each card active in its ordinary attack area.
4. The terminal `after_battle_ended` event is accepted only by an active canonical
   s3 source. It atomically moves all controller-owned/controller-controlled,
   canonical, active Outside-Life cards from public field/attack-area zones into
   the controller deck, then shuffles that deck. Forged, inactive, discarded, or
   other-player cards are not moved. Stable event identity makes replay a no-op.
5. Pending target snapshots and restore validation compare the exact target,
   candidate list, effect suffix, source state, phase, priority, owner/controller,
   provenance, zone, and visibility contract; stale or forged continuations fail
   closed without resource or card mutation.

## Verification

- Abigail focused s3a+s3b regressions: 9/9.
- `npm run content:compile`: 8 masters, 8 servants, 20 events, 0 blocking issues.
- `npm run content:validate`: 8 masters, 8 servants, 20 events, 0 blocking issues.
- `npm run verify:generated-content`: pass (deterministic generated hashes).
- `npm run verify:playtest-v1`: 8 masters, 8 servants, 20 events, 96 starting-deck cards, 0 private-view leaks.
- `npx vitest run packages/rules/tests/match-session.test.ts`: 30/30.
- `npm run typecheck`: pass.
- `git diff --check`: pass before commit.

The generated active pack now contains both s3b action and terminal cleanup
abilities. This Builder worktree intentionally does not create or push a
Candidate; it is ready for independent GPT-6 Sol review only after final
generated/content/determinism checks.
