# Phase 3 Source Evidence — Ritsuka / Roche / Tiamat / Kohaku / Chaos (S R1)

- Date: 2026-09-15
- Role: Codex S
- Base accepted R: `153d4b98032af6248a49d6e8e300a630bb698c3d`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Candidate

- 19 identities: Ritsuka-F 3, Ritsuka-M 3, Roche 4, Tiamat 4 (including dynamic `master.tiamat.card.life-sea`), Kohaku 4, Chaos Scrambled Seals 1.
- Development-text / locked-Reference exact gate: **18/18 static PASS**.
- Dynamic Life Sea locked development snapshot: **PASS** (`Fate_Domination-开发版/index.html#sc_tiamat_sea`).
- Source-grounded: **329 / 944**.
- Blocked: **615**.
- Classification: **2 existing / 190 generic / 137 special / 615 source-evidence-required**.
- Batch: **6 generic / 13 reviewed-special**.
- Overlay coverage: **257 cards / 476 structured abilities**.
- Full-roster structured abilities: **593**.
- Audit: **EXACT_AGREEMENT**, gapCount=0.
- Generic mapper identity literals added: **none**.
- Production runtime diff: **NONE**.
- Typecheck: PASS.
- Focused suite: **6 files / 96 tests PASS**.
- Full CI single worker: **84 files / 541 tests PASS**.

Dynamic source evidence is fail-closed: the normalizer and independent audit both require an allowlisted hash-locked development snapshot, and the audit accepts dynamic overlays only for IDs present in the locked Reference dynamic-runtime identity set. This does not add or change production runtime behavior.

Reviewed-special boundaries are limited to dual-servant switching, attribute-chain rewards, Craft Essence pool/effects, Betrayal threshold/ascension rules, Tiamat command-seal/beast substitution and hidden-double-attack rules, Kohaku batch Mana Rush use, and Chaos Scrambled Seals effect replay. Ordinary resources, draw/card-zone movement, visibility, movement/deployment restrictions, power modifiers, and lifecycle dependencies remain explicit generic axes.

This is F1 source-evidence / semantic-normalization candidate only; acceptance requires fresh A and R.
