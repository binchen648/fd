# Phase 3 F1 Source Evidence — Akasha / Hisui Detective / Wallachia (R, R1)

- S candidate SHA: `8de9598f16093bb6f6c5fe532b46b019702f3d99`
- A audit SHA: `5ca696213d04fb21e12dcdcffef5df1cfa9a3466`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- A delta from S: audit report only
- Independent source replay: **21/21 PASS**
- Independent regeneration: **CLEAN**
- Audit: **EXACT_AGREEMENT**, `gapCount=0`
- Accepted checkpoint candidate: **386/944 grounded**, **558 blocked**
- Batch classification: **21 reviewed-special**
- `npm.cmd run typecheck`: PASS
- focused Phase 3 suite: **6 files / 102 tests PASS**
- full CI: **84 files / 547 tests PASS**, exit code 0
- production runtime diff under `packages` / `src`: **NONE**
- mapper identity literals for Akasha/Hisui/Wallachia: **NONE**

Reviewer verdict: **ACCEPTED**.
Formal F1 checkpoint after this review: **386/944 = 40.89% grounded; 558 blocked**.
