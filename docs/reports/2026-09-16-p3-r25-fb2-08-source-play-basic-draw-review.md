# P3-R25 FB2-08 Source-Play + Basic-Attack Draw Trigger Review

Date: 2026-09-16
Role: R
Status: GATE_A_B_CANDIDATE_ACCEPTED
Candidate: `ea6a1522f6382ef617ae26fbca7d208e999f204f`
A handoff: `85cbc179a1ae4743b3ebb66756b066578edfc1b3`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`

## Verdict

ACCEPT the exact FB2-08 runtime contract only:

`forced on_card_played + source active + played_with_basic_attack + fixed controller draw 1`

No broad Trigger Gateway, generic `on_card_played`, optional trigger, broad PLAY, or roster migration is accepted by implication.

## Independent findings

1. Routing is identity-free. The production diff contains no frozen candidate servant/card/ability identity.
2. Trusted event provenance is enforced: source card, event player, source face-up batch membership, and another face-up same-controller `basic_attack` are required.
3. Separate plays, face-down companion attacks, another controller's attack, wrong source/player, and duplicate event IDs do not grant the draw.
4. The exact draw settles through the existing typed Resolution Data-flow draw primitive; deck/discard recycling remains owned by that primitive.
5. Recognized malformed near-matches fail closed before legacy draw execution.
6. The accepted FB2-06 fixed controller draw component now treats source-authoring `owner: controller` and canonical `player: controller` as exclusive aliases for the same controller-only primitive; third-party or dual-alias shapes remain rejected.
7. TO13 private optional hand-play and Card Action CLOSE compatibility remain green.
8. No authoring, generated-content, MatchSession, client/app, coverage, taxonomy, or unrelated hot file is changed by the candidate.

## Independent validation

- Candidate pinned exactly: `ea6a1522f6382ef617ae26fbca7d208e999f204f`.
- `git diff --check` from handoff to candidate: PASS.
- Changed-file audit: exactly result report + `interpreter.ts` + focused regression test.
- Production identity audit: 0 hits.
- Forbidden-file audit: PASS.
- Typecheck: PASS.
- Focused compatibility: 6 files / 78 tests PASS.
- Drake Riding integration selection: 5/5 PASS.
- All rules regressions: 47 files / 280 tests PASS.
- Generated-content determinism: PASS with unchanged hashes:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- First reviewer full CI run: 692/693 PASS; one unrelated `executable-card-pack` unknown-binding test exceeded the 5-second timeout under parallel load.
- The exact timeout test then passed in isolation twice, in 65ms and 59ms.
- Second reviewer full CI run: 114 files / 693 tests PASS.

The first timeout is therefore classified as transient parallel-load timing noise, not a deterministic candidate regression.

## F4 consequence

R25 accepts only the runtime contract. The A lane may now re-evaluate the 14 frozen F1 candidate identities against all accepted parent/component dependencies. R25 itself does not mark them migrated and does not dispatch FM01.

## Not promoted

- broad Trigger Gateway / all `on_card_played`;
- optional triggers or response windows;
- Noble-Phantasm/event-attribute CLOSE semantics;
- Okita repeat-play semantics;
- generic Condition Evaluation;
- broad Card Action PLAY;
- authoring migration;
- Gate C/client/projection changes;
- any unrelated F1 family.
