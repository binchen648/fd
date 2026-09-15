# Phase 3 F1 Source Evidence — Akasha / Hisui Detective / Wallachia (S, R1)

- Base accepted reviewer: `8b3b896846cc635317adfc0beb65e21193e5f9bb`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Development source: `E:\Codex\FD\Fate_Domination-开发版\data_masters.js`
- Development source SHA-256: `c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825`

## Slice

21 identities total:
- Akasha: 7
- Hisui Detective: 5
- Wallachia: 9

Exact development-text gate: **21/21 PASS**.
Independent structured source replay against the development source: **21/21 PASS**.

## Semantic result

- `sourceGroundedCount`: **386 / 944**
- `blockedCount`: **558**
- `structuredAbilityCount`: **664**
- Batch classification: **0 existing / 0 generic / 21 reviewed-special**
- Global classification: **2 existing / 198 generic / 186 reviewed-special / 558 source-evidence-required**
- Source-evidence overlays: **314 cards / 547 abilities**
- Audit: **EXACT_AGREEMENT**, `gapCount=0`

Mechanism-level reviewed-special boundaries added to the generic mapper vocabulary only:
- `REINCARNATION_RULE`
- `VESSEL_STATE_RULE`
- `OVERLOAD_CARD_RULE`
- `DETECTIVE_CLUE_RULE`
- `DETECTIVE_ACCUSATION_RULE`
- `FEAR_ATTRIBUTE_RULE`
- `TATARI_RULE`
- `TATARI_DETERIORATION_RULE`
- `SKILL_COPY_LIFECYCLE_RULE`

No character identity branch was added to the generic mapper.

## Verification

- `npm.cmd run typecheck`: PASS
- focused Phase 3 suite: **6 files / 102 tests PASS**
- `npm.cmd run test:ci`: **84 files / 547 tests PASS**
- `git diff --check`: PASS
- production runtime diff under `packages` / `src` from base: **NONE**
- mapper identity-literal diff for Akasha/Hisui/Wallachia: **NONE**
