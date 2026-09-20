# P3-A R90 Siegfried s2 Consumer Migration Dispatch

Role: Codex A
Status: `READY`
Date: 2026-09-20

## Formal baseline

- Exact R90 FB2-43 acceptance-sync Base: `dcaa4d6cd9e9125bccaa99a530ec92cf459a5591`
- Accepted FB2-43 runtime Candidate: `19ff09ed65e34f241d332250e1cc1370071ecf75`
- Formal migration accepted: `145/944`
- Formal remaining: `799`
- Branch-local frozen overlap: `140/944`
- Frozen duplicates: `0`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Frozen F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`

FB2-43 is synchronized identity-free infrastructure and earns zero migration credit. A's acceptance-sync differs from the exact accepted runtime Candidate only by the task index and synchronization report, so the runtime re-overlay below was executed against the exact reviewed Candidate bytes.

## Exact migration identity

Migrate exactly one frozen consumer:

- `servant.siegfried.skill.sc-siegfried-2`
- owner: `servant.siegfried`
- owner class: `Saber`
- legacy id: `sc_siegfried_2`
- name: `恶龙之血铠`
- static card metadata: cost `3`, basePower `9`, typeLabel `宝具`, attributes `宝具`, legacy requirement `8`.

Frozen F1 binds the whole printed clause/text to SHA-256 `7203c9276b4653d632bec22e8c81567db4b26e4e1c9db2d60f4031989990eacb` at `src/content/authoring/cards.json / skillCards[0].abilities[0].printedClause`:

`【真名解放】\n若你的真名已经公开并处于交战状态，当一名对手移动至你所在的战场时，关闭此牌。`

Locked Reference provides stable static metadata and legacy id only. Reference handler identity is evidence and must not be used for production routing.

## Mechanical whole-card re-overlay

After accepted FB2-43, A reconstructed the complete card in memory from frozen F1 semantics plus current accepted identity-free vocabulary. The normalized ability uses:

1. standard servant skill card-play envelope and final-rule skill-zone mana threshold `8`;
2. structural true-name release visibility `revealsTrueName / on_use_declared / servant_package`;
3. authoritative trigger `after_controller_enters_location` with active-source gating;
4. exact conditions `source_active`, `controller_servant_revealed`, `at_battlefield`, `event_player_is_opponent`, and accepted exact type-only `event_location_equals_controller`;
5. existing `close_source_card` effect;
6. automatic execution and no identity-specific runtime route.

The read-only whole-card probe on exact accepted runtime Candidate `19ff09ed65e34f241d332250e1cc1370071ecf75` returned:

- loader `report=[]`;
- card `mode=automatic`;
- ability execution `mode=automatic`;
- structural true-name release classifier: `true`;
- real game-loop opponent movement from `magic_workshop` to controller battlefield `miyama_town` emitted the authoritative enter-location event and closed the source;
- opponent movement elsewhere: no trigger;
- controller/self movement: no trigger;
- unrevealed controller servant: no trigger;
- controller outside a battlefield: no trigger;
- inactive source: no trigger.

This closes the only known normalized whole-card seam identified before FB2-43. No additional B2 capability is required for this card, so `servant.siegfried.skill.sc-siegfried-2` is mechanically `S_READY_NOW`.

## Frozen accounting contract

A mechanically enumerated all top-level authoring `cards[]` ids against the authoritative frozen inventory:

- frozen denominator: `943 static + 1 dynamic = 944`, all unique;
- current authoring unique ids: `163`;
- Base frozen overlap: exactly `140/944`;
- duplicate frozen authoring ids: `0`;
- target currently present: `false`;
- adding only `servant.siegfried.skill.sc-siegfried-2` yields exactly `141/944`.

The S Candidate must therefore be exactly **`141/944`**, with exact +1 `servant.siegfried.skill.sc-siegfried-2`, zero removals, zero frozen duplicates, and no second frozen identity. This branch-local material overlap is not formal migration credit.

## S scope

Fresh S is authorized only to:

1. add one standalone authoring archive `data/authoring/servants/servant.siegfried.json` containing exactly `servant.siegfried.skill.sc-siegfried-2`;
2. encode the whole card only through the accepted generic normalization above and preserve exact frozen F1 / Locked Reference evidence;
3. add focused `packages/rules/tests/siegfried-s2-consumer-migration.test.ts` coverage proving exact text/hash/static metadata, loader `report=[]`, automatic execution, structural true-name release, real movement-event close behavior and fail-closed negatives, product/generated non-registration, and exact frozen accounting;
4. add one S result report.

Forbidden:

- any production runtime source edit;
- any second Siegfried or other frozen identity;
- any Siegfried/name/skill-id runtime routing;
- any new selector, event-field DSL, trigger, condition, close semantics, or movement-emission rewrite;
- product pack/generated registration;
- merge or retarget;
- migration credit before fresh independent R returns `MIGRATION_ACCEPTED` for the exact S Candidate and A synchronizes that acceptance.

## Required gates

S must prove, at minimum:

- Base `140/944` -> Candidate exactly `141/944`, exact +1 target, zero removals, zero duplicates;
- production runtime source diff empty;
- `npm run typecheck`;
- focused Siegfried s2 consumer migration + FB2-43 coverage;
- rules src/core/regression/focused suite;
- official `npm run test:ci -- --maxWorkers=2`;
- `npm run content:validate`;
- `npm run verify:generated-content`;
- exact Locked Reference verification;
- client production build;
- `git diff --check`, identity/scope audit, and final clean worktree.

Formal project migration remains **`145/944`**, with **`799`** remaining until fresh independent R migration acceptance plus A synchronization.
