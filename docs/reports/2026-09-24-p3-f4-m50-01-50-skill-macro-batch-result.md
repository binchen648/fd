# P3 F4 M50-01 50-skill macro-batch result

Task: `P3-F4-M50-01-50-SKILL-MACRO-MIGRATION-BATCH`
Branch: `codex/batch-p3-f4-m50-01-50-skill-macro`
Base: exact R121 acceptance synchronization `b4589eebbd09409458cf7b49d7fb7d9af6469f07`
Initial Candidate: `12efa4d292a04a5b592b965b44dde67d1ad6b9da`; fresh R returned `IMPLEMENTATION_NEEDS_REVISION`. The revised Candidate is the direct successor containing the R1 closure below; its exact SHA is recorded mechanically in PR #440 and the fresh-R handoff after commit creation.
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Mode: user-authorized F4 50-skill macro-batch

## Scope

This batch materializes exactly 50 fresh frozen identities from the existing locked F1/confirmed-reference evidence. It does not redo whole-roster classification and does not split the batch into per-card handlers or reviews.

The recovered local selection initially contained two identities that were already material at the exact Base (`master.shiki-ryougi.skill.s3` and `servant.kintoki.skill.sc-kintoki-3`). Keeping them would have produced only +48 new material identities. Per the macro-batch replacement rule, they were mechanically replaced with two blocker-free, previously unmaterialized frozen identities:

- `servant.leonidas.skill.sc-leonidas-2`
- `servant.valkyrie.skill.sc-valkyrie-3`

The final frozen roster is source-controlled in `scripts/phase3-reference/materialize-m50-batch.ts` as `M50_01_SELECTED_IDS`, so a fresh checkout does not depend on local `.fd-*` scratch state.

## Final 50-skill roster

1. `servant.muramasa.skill.sc-muramasa-1`
2. `servant.sigurd.skill.sc-sigurd-3`
3. `servant.darius.skill.sc-darius-3`
4. `servant.medea.skill.sc-medea-1`
5. `master.sion.skill.s6`
6. `servant.leonidas.skill.sc-leonidas-2`
7. `master.kirei.skill.s2`
8. `master.kohaku.skill.s1a`
9. `servant.darius.skill.sc-darius-4`
10. `servant.lionking.skill.sc-lionking-3`
11. `servant.illya.skill.sc-illya-2`
12. `servant.tesla.skill.sc-tesla-3`
13. `master.caules-yggdmillennia.skill.s1a`
14. `servant.shakespeare.skill.sc-shakespeare-3`
15. `servant.robin.skill.sc-robin-2`
16. `servant.boudica.skill.sc-boudica-2`
17. `master.kirei.skill.ascension`
18. `master.sion.skill.s11`
19. `master.araya.skill.s1a`
20. `master.sion.skill.s16`
21. `servant.emiya.skill.sc-emiya-np`
22. `servant.kiritsugu.skill.sc-kiritsugu-3`
23. `servant.chloe.skill.sc-chloe-1`
24. `servant.roberts.skill.sc-roberts-2`
25. `servant.boudica.skill.sc-boudica-1`
26. `servant.kama.skill.sc-kama-1`
27. `servant.frank.skill.sc-frank-1`
28. `servant.kagekiyo.skill.sc-kagekiyo-2`
29. `master.kiritsugu.skill.ascension`
30. `master.chaos.skill.s13`
31. `servant.napoleon.skill.sc-napoleon-2`
32. `master.chaos.skill.s12`
33. `servant.albion.skill.sc-albion-1`
34. `servant.nero.skill.sc-nero-2`
35. `servant.chiron.skill.sc-chiron-2`
36. `master.caules-yggdmillennia.skill.s2`
37. `servant.caligula.skill.sc-caligula-1`
38. `master.waver.skill.s3`
39. `servant.arthur.skill.sc-arthur-1`
40. `master.sion.skill.s13`
41. `servant.astraea.skill.sc-astraea-1`
42. `servant.hassanser.skill.sc-hassanser-2`
43. `servant.merlin.skill.sc-merlin-3`
44. `servant.hassan.skill.sc-hassan-2`
45. `servant.valkyrie.skill.sc-valkyrie-3`
46. `servant.iskandar.skill.sc-iskandar-2`
47. `servant.frank.skill.sc-frank-3`
48. `servant.donquixote.skill.sc-donquixote-1`
49. `servant.constantine.skill.sc-constantine-2`
50. `servant.medusa.skill.sc-medusa-np`

## Shared runtime work

The recovered dirty branch already contained broad M50 shared-runtime work. This Candidate preserves and completes that work rather than replacing it with consumer-identity handlers. The shared families include structured player/round flags, structured choices, metrics/formulas, selected-card movement/removal, card activation/deactivation, resource/power modifiers, movement, lifecycle/rule modifiers, trigger mapping, combat/scoring hooks, and related state/dataflow support.

Two additional shared blockers were required to keep the batch at exactly 50 fresh identities:

- **Scheduled captured payload:** a generic structured schedule can select one currently active same-battlefield opponent attack, revalidate target provenance, capture its authoritative current card Power, persist that numeric payload, and inject it into the scheduled target ability on the configured later trigger. This supports Leonidas without identity routing.
- **Restricted on-play retrigger:** a generic exact `definitionIds` set can retrigger only active face-up matching attack-area cards' own automatic `on_card_played` abilities. It does not emit a global replay event and therefore does not replay unrelated listeners. This supports Valkyrie without identity routing.

Additional shared fixes discovered by behavioral execution:

- structured `phase_is` now compares the normalized rules phase (`battle` state -> `combat` rules phase);
- `card_count_at_least` supports exact `definitionIds`, active-only, and face-up/down filtering;
- scheduled variables are accepted only for `m50_round_started` target abilities that actually consume the named payload through structured numeric payload nodes;
- structured card choice supports generic attack-only filtering.

No runtime Chinese-text parsing, `SkillLib` fallback, or consumer canonical-identity/name routing was introduced.

## Materialization / product isolation

- `--probe-selected`: **50 PASS / 0 FAIL**.
- `--write-authoring`: **41 batch-specific archives / 50 cards**.
- Batch archives use the suffix `.p3-m50-01.json` and are not added to the playtest pack manifest.
- `data/packs/fd-playtest-v1/pack.json`: unchanged.
- One selected ID (`master.kiritsugu.skill.ascension`) already appears in the exact Base generated content only as existing `excludedCards` metadata; the batch did not introduce that product reference.
- The product generated content library was deterministically refreshed only because the shared loader now preserves pre-existing `markers` on compiled abilities. The observed semantic diff is eight existing true-name-release abilities gaining their existing `真名解放` marker plus the corresponding definition hash update; fixture and evidence-report outputs are unchanged.

## Exact frozen-material audit

Mechanically comparing the exact Base tree against the Candidate working tree:

- frozen denominator: **944**
- Base material authoring overlap: **165/944**
- Base duplicate frozen IDs: **0**
- Candidate material authoring overlap: **215/944**
- Candidate duplicate frozen IDs: **0**
- exact additions: **50**
- exact removals: **0**
- source-controlled M50 roster: **50 unique**
- roster exactly equals the 50 Base->Candidate additions: **YES**

## Routing / scope audit

Production diff under `packages/rules/src`:

- added canonical `servant.*` / `master.*` identity literals: **0**
- added CJK literals: **0**
- name / `printedText` / `printedClause` routing comparisons: **0**
- tracked deletions in task scope: **0**

Two added `printedClause` mentions are structural authoring fields/type preservation only, not routing or runtime text parsing.

## Verification

- M50 focused behavioral/material suite: **1 file / 6 tests PASS**.
- repaired historical isolation checks (B06 / Helena / Ruler / golden pipeline): **4 files / 30 tests PASS**.
- full CI suite with an explicit 15s per-test ceiling: **195 files / 1494 tests PASS**.
- The first default-5s parallel CI run exposed two workload-only timeouts; both passed when rerun independently and both pass in the final full suite under the explicit 15s ceiling. No semantic failure remains.
- `npm run typecheck`: **PASS**.
- `npm run content:validate`: **PASS** (`7 masters, 7 servants, 20 events, 0 blocking issues`).
- `npm run verify:generated-content`: **PASS**.
- generated content-library SHA-256: `09f7118d0cc7397901bf7b505d7c68b4b3b01b483db27e284ec95ebd881e96bc`
- generated fixture SHA-256: `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
- generated evidence-report SHA-256: `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- `git diff --check`: **PASS**.

## R1 revision closure — Araya zero-target semantics

Fresh independent R on exact initial Candidate `12efa4d292a04a5b592b965b44dde67d1ad6b9da` returned `IMPLEMENTATION_NEEDS_REVISION`. The Reviewer could not write its own GitHub comment because its transport returned HTTP 403, so the already-completed R finding was relayed without re-review at <https://github.com/binchen648/fd/pull/440#issuecomment-5804342795>.

The single blocking finding was `master.araya.skill.s1a` / `origin-stillness-combat-end`: the initial encoding allowed `choose_cards` to write an empty payload through `skipIfNoCandidates`, then a fixed `move_selected_cards count: 1` consumed that empty payload and rejected a legal no-target battle-end state.

The revised Candidate uses the Reviewer's explicitly allowed equivalent bounded semantic encoding:

- the ability now requires `card_count_at_least` one controller-owned active `basic_attack` in `attack_area` before opening its response/choice path;
- the choice itself is exact-one and no longer uses `skipIfNoCandidates`;
- generic `card_count_at_least` now honors the already-validated identity-free `basicOnly` structural filter;
- no consumer identity/name routing or text parsing was added.

Focused regression coverage drives the real battle-terminal response path:

- zero active basic attacks => Araya is not offered in the response window and the battle-end state is a legal no-op;
- one active basic attack => Araya response -> exact-one structured choice -> selected attack returns to deck -> controller gains exactly twice its printed mana cost.

Successor verification after the revision:

- source-controlled selected probe: **50 PASS / 0 FAIL**;
- M50 focused suite: **1 file / 8 tests PASS**;
- affected M50 + B06 + Helena + Ruler suites: **4 files / 36 tests PASS**;
- frozen material remains **215/944**, exact batch +50, duplicate frozen IDs **0**;
- `npm run typecheck`: **PASS**;
- `npm run content:validate`: **PASS** (`7 masters, 7 servants, 20 events, 0 blocking issues`);
- `npm run verify:generated-content`: **PASS** with the same three deterministic hashes recorded above;
- `git diff --check`: **PASS**.

The narrow successor does not rerun the full 1494-test CI suite; the exact initial Candidate's full CI result remains historical evidence, while this NEEDS_REVISION cycle follows the repository rule to run affected focused tests plus the relevant compile/validation/determinism/diff gates.

## Credit / review gate

Before fresh independent R acceptance and A synchronization, formal migration remains **169/944**, with **775** remaining. Candidate material authoring overlap is **215/944**.

Only one fresh independent review of the exact macro-batch Candidate is authorized. A fresh exact-Candidate `IMPLEMENTATION_ACCEPTED_CANDIDATE` plus acceptance synchronization may award the 50 fresh identities, advancing formal migration exactly to **219/944**, with **725** remaining.

The batch must not be split into per-skill reviews and PR #439 remains open/unmerged/unretargeted.
