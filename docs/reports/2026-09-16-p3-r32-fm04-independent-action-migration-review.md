# P3-R32 FM04 Independent Action Migration Review

Date: 2026-09-16
Role: R
Candidate lineage: A synchronization `3e816160d8051a314e8b20cf2c2d924dcd0c7e3e`
S candidate: `0047b30cd00fd3093f01db373f69cc9540466cd5`
A dispatch base: `a3f7e7d56d6e4bb5af9bf5ae68d89e534ea7df96`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Verdict: `MIGRATION_ACCEPTED`

## Findings

No blocking findings.

## Independent scope review

The migration lineage from the FM04 dispatch base contains exactly:

- ten new authorized Independent Action servant archives;
- the FM04 authoring regression test and S migration report;
- A-owned material coverage, Task Index, synchronization report, and throughput evidence.

Production runtime hot-file diff is zero. `servant.tomoe.json` has zero diff. `git diff --check` passes.

## Family/source/static-metadata judgment

Independent reviewer reconstruction from frozen F1 finds exactly eleven `core.independent-action` family members with the same frozen printed-text SHA:

`792fe5ed9a320b58e58103d05aaf9ae27755c5940c159bf47733f04d36da7bc5`

Current canonical authoring contains all 11; exactly 10 were added by FM04 and Tomoe is the sole pre-existing member. For every new archive, reviewer checks pass for:

- frozen full printed text;
- all three F1 clause source hashes;
- locked Reference evidence commit;
- `typeLabel=特殊`, `cost=0`, `basePower=6`, historical `requirement=0`;
- canonical skill-zone requirement `8` mana;
- exact Tomoe-derived play timing and requirements;
- exact two-ability structure after removing identity-only ability IDs;
- real-newline clause rejoin to the frozen card text.

No mismatch was found. Gilgamesh remains structurally identical despite its historical F1 blocker-label name.

## Runtime-contract judgment

The first ability on every new card is the accepted TO08 Resource direct action shape: action/controller window, active source, first-half seat condition, controller VP `+3`.

The second is the accepted B21/R15 battle-loss exception shape: forced `after_controller_loses_battle`, controller VP `-5`, with the exact `ignore / effect_prevention / this_effect / explicit_exception` rule modifier.

The FM04 focused suite exercises a newly migrated Atalanta representative through both real paths, including ordinary prevention being unable to suppress the `-5` penalty.

## Independent frozen-F1 burn-down

Reviewer recomputation against the exact dispatch base:

- denominator `944`;
- canonical authoring overlap `59 -> 69`;
- net `+10`;
- added set exactly equals the authorized ten non-Tomoe siblings;
- removed frozen IDs `0`;
- Independent Action family `1/11 -> 11/11`.

## Independent validation

- fresh dependency install: PASS;
- typecheck: PASS;
- FM04 + TO08 + B21 focused: `3 files / 15 tests PASS`;
- all rules regressions: `49 files / 292 tests PASS`;
- content validation: `0` blockers;
- deterministic generated content: PASS with unchanged hashes:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`;
- standard full CI: `116 files / 705 tests PASS`;
- fresh reviewer coverage: archives `59`, cards `91`, abilities `180`, raw `22 / 3 / 117 / 0 / 38 / 124`;
- fresh reviewer coverage equals the A committed material artifact except `generatedAt`;
- compiled definition hash unchanged at `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`;
- compiled cards `70`, characters `14`, blocking issues `0`;
- runtime hot-file diff `0`;
- Tomoe diff `0`;
- diff check PASS.

## Final judgment

`MIGRATION_ACCEPTED` for exact P3-FM04 Independent Action family migration.

This acceptance does not promote broad Special Subsystem handling or redefine the coverage reporter's B21 legacy label. It accepts only the eleven-member family already reconciled by R31 and migrated here with the two independently accepted runtime contracts.
