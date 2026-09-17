# P3-FB2-08 Source-Play + Basic-Attack Draw Trigger Result

Date: 2026-09-16
Role: B2
Status: IMPLEMENTATION_COMPLETE_CANDIDATE
Base A handoff: `85cbc179a1ae4743b3ebb66756b066578edfc1b3`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`

## Implemented scope

FB2-08 adds one identity-free typed Trigger Runtime contract only:

`forced on_card_played + source active + played_with_basic_attack + fixed controller draw 1`

The implementation:

- reuses the accepted fixed controller draw component and the existing typed Resolution Data-flow `draw_cards` primitive;
- accepts the source-authoring controller alias `owner: controller` or canonical `player: controller`, but rejects third-party draw and rejects specifying both aliases at once;
- requires the executing source itself to be face-up in the trusted `playedCards` batch under the same controller;
- requires at least one other face-up `basic_attack` in that exact batch under the same controller;
- requires `event.sourceCardId` and `event.playerId` to match source/controller provenance;
- rejects recognized malformed near-matches before legacy draw fallback;
- leaves TO13 optional low-power hand-play and all other Card Action/Trigger families unchanged.

No card, ability, or servant identity and no printed text participates in production routing.

## Frozen candidate membership

The A handoff freezes 14 candidate post-review F1 identities under this same source clause:

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

B2 does not migrate these identities and does not dispatch FM01.

## Validation

- `npm.cmd run typecheck`: PASS.
- Focused compatibility suite: 6 files / 78 tests PASS.
- Drake Riding integration filter: 5/5 PASS.
- All rules regressions: 47 files / 280 tests PASS.
- Generated-content determinism: PASS with unchanged hashes:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- Full `test:ci`: 114 files / 693 tests PASS.
- `git diff --check`: PASS.
- Production identity audit against all 14 candidate identities plus Drake ability identity: 0 hits.
- Forbidden-file audit: PASS; no authoring, generated content, MatchSession, client, app, coverage, or taxonomy file changed.

A direct full run of `drake-authoring.test.ts` also produced 24/25 PASS; its only failure is the pre-existing local asset-presence assertion for an `original_card_image` path. The five Riding integration tests all pass when selected directly, and the repository CI profile excludes per-servant authoring image-presence tests.

## Boundaries not promoted

FB2-08 does not accept broad Trigger Gateway, generic `on_card_played`, optional response triggers, event-attribute CLOSE semantics, Okita repeat-play, broad Condition Evaluation, broad PLAY, MatchSession/client/projection changes, F1 authoring migration, or F4 dispatch.

Independent R25 must pin the exact candidate SHA and independently re-run the proof before A may count the 14 frozen identities as migration-ready.
