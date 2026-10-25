# P3-A FM06 current-main dependency and author handoff

Role: Codex A dependency reconciliation
Status: `READY_FOR_FRESH_FM06_AUTHORING`
Task: `P3-FM06` Presence Concealment

## Exact current-main Base

- Current A-sync Base: `284731d8e24f30cf1d1794dd951f735cc2a98b4b`.
- This line contains accepted FB2-02, FB2-11, and FB2-12 runtime/test materializations, with FB2-12 strict typed `limit.uses === 1`.
- FM05 materialized migration is already synchronized on this lineage; its 10-ID authoring must remain unchanged.
- The previous handoff `037768ad...` is obsolete because it predates FB2-12 materialization and must not be reused.

## Dependency closure

Current source contains the required accepted FB2-12 Presence Concealment runtime surface: frozen pre-scoring snapshot, strict-second eligibility, derived highest-power opponents, battle-local defeat, existing BattleResult/scoring rebuild, optional response sequencing, decline/once-per-round behavior, and stale/fail-closed handling. The current FB2-02 deployment-resource and FB2-11 round-number contracts remain green on the same line.

Required focused evidence on the accepted dependency line is FB2-02 9/9, FB2-11 7/7, and FB2-12 10/10 (combined 26/26); generated-content determinism remains unchanged. No additional runtime materialization is required before FM06 authoring.

## Historical FM06 and FB2-13 evidence

Historical FM06 evidence is available only as contract/reference evidence:

- FM06 S candidate: `ebc1ca575fcef0e3894b13ec10613801e4227970`.
- FM06 A-sync: `34f891a7739e86b835bc78e65aa58fdf5f4e955a`.
- FM06 independent Reviewer: `e8bc73ede18c14d97158aa8677ae3498fa829935`.
- Historical FM06 accepted base: `35aa5ef063fe6d8c6c611f70f0696bf111a80657`, not the current Base.

FB2-13 is a separate accepted Alter Ego Transform runtime contract for the subsequent FM07 task, not an FM06 dependency:

- FB2-13 Candidate: `18f2733eb0551f368e78a5f67ad9a32b96193d5b`.
- FB2-13 independent Reviewer: `dc96afa3253dcf86a13e13ea29c8b99fb895df49`.
- FB2-13 A evidence sync: `2fec63dbd6533f435e851c471d3bf00fa75695e2`.

These historical Candidate/Reviewer/A-sync objects must not be copied into FM06 or treated as current-main lineage. They are recorded to establish the next queue boundary only.

## Fresh FM06 authoring contract

A fresh Builder may now start from exact Base `284731d8...` and may change only twelve canonical authoring archives, one focused migration test, and one report. The exact IDs are:

`servant.corday.skill.sc-corday-1`, `servant.danzou.skill.sc-danzou-3`, `servant.hassan.skill.sc-hassan-1`, `servant.hassanhf.skill.sc-hassanhf-3`, `servant.hassanser.skill.sc-hassanser-1`, `servant.izou.skill.sc-izou-3`, `servant.jekyll.skill.sc-jekyll-3`, `servant.kama.skill.sc-kama-3`, `servant.kiritsugu.skill.sc-kiritsugu-1`, `servant.kotarou.skill.sc-kotarou-1`, `servant.semiramis.skill.sc-semiramis-1`, `servant.stheno.skill.sc-stheno-1`.

Preserve full-text SHA `29b3f6c71d8bc5eb6f004d930e5b753f44ee766fb2e47ea6b9f0d89f5fa9643f`, the four frozen F1 clause-source hashes, handler `core.presence-concealment`, Swift/cost 3/base Power 4/reference requirement 3, final skill-zone gate 8, and source-defined owner class. Semiramis must preserve its accepted FM05 card unchanged. Sion EX and all other handlers remain excluded.

FM06 authoring must not modify runtime, coverage, generated artifacts, task index, governance, or FB2-13. No historical FM06 archive or Candidate is accepted by this handoff; the next Builder must create a fresh current-main Candidate.

## Dispatch boundary

`FM06 READY_FOR_FRESH_CURRENT_MAIN_BUILDER` from exact Base `284731d8...`. This docs-only handoff does not claim FM06 migration acceptance, credit, or merge. Formal ledger remains `111/944`; FM06 migration credit remains `0` until independent review and A-sync.
