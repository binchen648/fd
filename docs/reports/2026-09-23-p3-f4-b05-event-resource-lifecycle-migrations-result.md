# P3 F4 B05 event/resource/lifecycle migration batch result

Task: `P3-F4-B05-EVENT-RESOURCE-LIFECYCLE-MIGRATION-BATCH`
Branch: `codex/batch-p3-f4-b05-event-resource-lifecycle-migrations`
Base: exact R119 F4 B04 acceptance sync `1f5e929def8e2d51893ab5ad86041faed0a74a7e`
Mode: user-authorized BATCH-FIRST F4

## Scope

This batch materializes exactly two fresh frozen identities from existing F1 evidence without redoing whole-roster classification:

- `servant.edison.skill.sc-edison-2`
- `servant.kama.skill.sc-kama-2`

Shared implementation is bounded and identity-free. Production runtime does not route on either consumer identity/name and does not parse Chinese text at runtime.

## Frozen source grounding

Both authoring cards preserve frozen F1 printed text / clause hashes and Locked Reference static metadata.

Edison S2:
- full printed text SHA-256: `6e4857cd833d06617518b36d6e0a4b2acad3a5683736331e2b2269ab3945062b`
- low-mana clause: `dd3e704dcc5e93424c0773825826c8b35fc2ea92b0b3a66b3033f4b84e9b71a4`
- workshop deployment clause: `9ce3c9b19f9b277448bbcfcbedde59763b38f93967b0a82648d5a7df8faed1c1`

Kama S2:
- full printed text SHA-256: `212ba26db3d5f5cc2759a34e5092f0a8a055a4d20c93bd444daa79335c845fb2`
- entry/steal clause: `782e71fe3cae3f40624522ff57548bfa6aaaf76a102a7eb2ef373cd4798101b6`
- round-close clause: `67573e24324b0de9620585e15aa69bcde199b1653bcd4e49c498a811417d8162`

## Runtime behavior

- Edison S2 closes through the real play/dispatch reconciliation path when its active controller mana is below 2.
- Trusted opponent deployment to `magic_workshop` grants the event player +1 mana, then grants the controller +2 VP and removes up to 3 controller mana.
- Kama S2 consumes trusted movement/deployment entry provenance only; public/forged events cannot install a round-close arm.
- Kama transfers up to 1 VP from the qualifying opponent, installs a source-bound same-round close arm, and closes at authoritative `round_end` only when that exact arm validates.
- Deployment arms are rebound to the exact `trustedEntryEventSnapshots` root in addition to canonical deploy id, processed-event membership, player/location/round, and source/ability bindings.
- Duplicate/tampered persisted round-close state fails closed.
- B04 historical frozen-material assertion was widened only from an eternal exact repository total to `>= 161`; B04 identities remain exact-once and B04 semantics are unchanged.

## Verification

- B05 focused: 1 file / 8 tests PASS.
- affected B01-B05 + movement + game-loop + MatchSession + authoring + replay: 15 files / 163 tests PASS.
- `npm run typecheck`: PASS.
- `npm run content:validate`: PASS, 0 blocking issues.
- `git diff --check`: PASS.
- production identity/name scan for Edison S2 / Kama S2 identities and names under `packages/rules/src`: 0 hits.
- frozen material overlap: exact `161/944 -> 163/944`.
- both B05 frozen identities occur exact-once; zero duplicate frozen IDs.

## Credit

Before fresh independent R, formal migration remains `165/944` with `779` remaining.

Only an exact fresh `IMPLEMENTATION_ACCEPTED_CANDIDATE` for the final B05 Candidate plus A synchronization may award the two fresh identities, advancing formal migration exactly to `167/944` with `777` remaining. B05 is one batch Candidate and must not be split into per-skill reviews.