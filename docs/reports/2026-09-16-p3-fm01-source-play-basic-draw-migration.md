# P3-FM01 Source-Play / Basic-Attack Draw Migration Result

Date: 2026-09-16
Role: Codex S
Status: MIGRATION_CANDIDATE
Base A synchronization: `135d1d1996165f07e3044d5378329eb38362f8b3`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Accepted runtime dependencies:
- TO13 private optional hand-play: `3964556699dafc116a67d7f43af9a740d17a0a04`, independent review `8c7349e8a36a198f0f83bf114fe94bc588bc8569`
- FB2-06 fixed controller draw component: candidate `3f1080a7cb4f68e7c08af91b349680a6536cd362`, R23 `0dc6619eba6f2ff67c96b6ec9c3ff736cae66740`
- FB2-08 source-play/basic-attack draw trigger: candidate `ea6a1522f6382ef617ae26fbca7d208e999f204f`, R25 `33f0a0e1b3e9c4c62c8eb713ae45cd7117c7a0a7`

## Exact migration result

Selected: 14 exact F1 identities.
New canonical authoring archives: 13.
Pre-existing canonical representative retained unchanged: Drake Riding.
Skipped: 0.
Runtime files changed: 0.

Exact batch:

- `servant.boudica.skill.sc-boudica-3`
- `servant.constantine.skill.sc-constantine-1`
- `servant.drake.skill.sc-drake-1`
- `servant.hephaistion.skill.sc-hephaistion-3`
- `servant.iskandar.skill.sc-iskandar-1`
- `servant.ivan.skill.sc-ivan-3`
- `servant.mandricardo.skill.sc-mandricardo-3`
- `servant.martha.skill.sc-martha-3`
- `servant.medb.skill.sc-medb-1`
- `servant.medusa.skill.sc-medusa-1`
- `servant.odysseus.skill.sc-odysseus-3`
- `servant.roberts.skill.sc-roberts-3`
- `servant.teach.skill.sc-teach-3`
- `servant.ushiwakamaru.skill.sc-ushiwakamaru-3`


Drake already carried the accepted canonical two-ability structure before FM01, so S deliberately did not rewrite its file. The other 13 selected identities receive minimal per-servant archives containing exactly the selected skill card and no sibling skills or decks.

## Source preservation and static metadata

For every selected card:

- whole printed text SHA-256: `0514b5cce67642f6c5215fe348f433ce3638806be3af558ac845d39310a3d2b1`;
- draw clause SHA-256: `88e0daa4be5047709147c103b33305e34b428e053e34ff8c90d5065252a9bebc`;
- action clause SHA-256: `cbdff481f797da49ce7639a279842cc6f0e9fda622b584bcc42103065bc2c5c8`.

The 13 new archives preserve their F1 source references and clause-source hashes. Locked Reference commit `b2f9fa15fba07c63530bbf4612b03b8b704755f9` was consulted read-only only for static card metadata. All 13 target cards agree on `cost=3`, `basePower=0`, and the same special card type. Reference handler semantics were not imported.

The historical Reference `requirement=3` field is retained only as metadata. Canonical skill-zone play eligibility uses final-rule 9.4: `skill_zone_mana_at_least=8`, matching the existing Drake authoring and the repository's current servant-skill policy.

## Canonical accepted shape

Each selected card resolves into exactly two authoring abilities:

1. forced `on_card_played`, source active, `played_with_basic_attack`, fixed controller draw 1;
2. action-phase active-source private selection of 0..3 controller-hand cards, exactly one `base_power_at_most=3` constraint, then `play_selected_cards`.

The FM01 focused test loads all 14 archives and proves every trigger ability matches `isSourcePlayBasicAttackDrawTriggerSemantic` and every action ability matches `isPrivateOptionalHandPlayInteractionSemantic`. One newly introduced Boudica archive is additionally executed end to end through the accepted runtime: same-batch basic attack draws one card, and the action interaction exposes the low-power hand card while excluding a base-power-5 card.

## Validation

- `npm.cmd run typecheck`: PASS.
- FM01 + FB2-08 + TO13 focused compatibility after final test addition: 3 files / 30 tests PASS.
- FM01 exact authoring suite alone: 18/18 PASS.
- `npm.cmd run content:validate`: PASS, 7 masters / 7 production-pack servants / 20 events / 0 blocking issues. FM01 does not expand the production playtest pack.
- `npm.cmd run verify:generated-content`: PASS, hashes unchanged:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- all rules regressions: 47 files / 280 tests PASS.
- full `test:ci`: 114 files / 693 tests PASS.
- `git diff --check`: PASS.
- runtime hot-file audit: 0.

## A-owned coverage observation (not modified by S)

A temporary non-artifact `phase3:coverage` run after the authoring addition reported:

- archives `14 -> 27`;
- cards `46 -> 59`;
- abilities `92 -> 118`;
- `newRuntimeSemanticRouted=12` unchanged;
- `legacyExecuteAbility=3` unchanged;
- `legacyResolveEffect=49 -> 75`;
- `dualRuntime=0` unchanged;
- `notClassifiable=28` unchanged;
- `taxonomyWarnings=79 -> 92`;
- compiled product definition hash unchanged at `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`.

Inspection shows all 26 newly visible abilities are structurally the intended FM01 abilities, but the current A coverage classifier labels them `LEGACY_RESOLVE_EFFECT` and emits the generic `phase_action_is_not_domain_trigger` warning for each new TO13 action ability. Runtime focused tests prove these same shapes are accepted by TO13/FB2-08. S therefore records this as an A-owned evidence-classification/reconciliation issue and does not edit coverage/taxonomy code or artifacts.

## Scope boundary

FM01 does not change runtime, MatchSession, client/server/app code, coverage/taxonomy classifiers, F1 frozen artifacts, the production playtest pack, Okita, or unrelated servant skills.

A must now independently synchronize exact before/after migration coverage and classify the raw reporter mismatch. R26 reviews only after that A synchronization; S does not self-promote F4 acceptance.
