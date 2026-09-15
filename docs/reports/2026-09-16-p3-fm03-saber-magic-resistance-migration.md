# P3-FM03 Saber Magic Resistance Migration

Date: 2026-09-16
Role: S
Status: `MIGRATION_CANDIDATE`
Base A sync: `07f6eb51cd6a107a9e48098a13332ae2f622a795`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference metadata: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Accepted runtime dependencies: B18/R12 + B19/R13 + FB2-10/R29

## Exact batch

FM03 migrates exactly ten frozen F1 Saber-family identities:

- `servant.altera.skill.sc-altera-3`
- `servant.arthur.skill.sc-arthur-3`
- `servant.bedivere.skill.sc-bedivere-1`
- `servant.charlemagne.skill.sc-charlemagne-3`
- `servant.gawain.skill.sc-gawain-3`
- `servant.lakshmibai.skill.sc-lakshmibai-3`
- `servant.mordred.skill.sc-mordred-3`
- `servant.musashi.skill.sc-musashi-3`
- `servant.saber.skill.sc-saber-1`
- `servant.saitou.skill.sc-saitou-1`

All ten were absent from canonical authoring at the handoff. Each new archive contains exactly one selected skill card; no sibling skill was migrated.

## Frozen source and static metadata

Source/printed-text SHA preservation is 10/10 PASS. The three frozen source-text hashes are preserved per identity rather than normalizing wording:

- seven identities: `8a6da48db16868ce5d5766fa7ff05c00b2c392f715106f869cb59aaabee65ffc`;
- Lakshmibai and Saitou: `b2b1bc7cdbc3adce79362de44635ed871f652c60e3b5abe691a07e26458a8d05`;
- Saber: `0cdfc3fafc790b59414b23e58a39fd0926dd776a7df6ccba352ce65dd3c74d22`.

The locked Reference is used only for static metadata and textual clause boundaries. All ten cards preserve `cost=3`, `basePower=3`, `typeLabel=特殊`, and historical `requirement=3`. Canonical skill-zone play uses final rule 9.4 at 8 mana; the legacy requirement remains evidence metadata only.

For Saber, whose source places both Noble Bloom rewards on one printed line, the three ability clauses are split by locating the locked clause boundaries inside the frozen F1 text. The complete card text remains byte-for-byte source-hash preserving.

## Accepted structured split

Each selected card loads into exactly three accepted abilities:

1. B18/R12 base Noble Bloom: optional combat post-result response, highest-cost-Noble-Phantasm condition, controller VP `+1`.
2. B19/R13 threshold sibling: independent optional combat post-result response with the additional `highest_cost_noble_phantasm_cost_at_least(4)` condition, controller VP `+1`.
3. FB2-10/R29 Magic Resistance: combat phase action from active source; exact `combat_power_modifier`; `set attack.currentPower=0`; same-battlefield engaged opponent attack cards; one `has_attribute(魔术)` constraint; duration `this_round`.

All 10 archives load with no adapter blockers. Classifier conformance is 10/10 for each of the three accepted contracts.

## Real migrated representative

Altera is exercised as a real newly migrated archive through both runtime sides:

- Magic Resistance exposes its combat activation and sets a same-battlefield opponent Magic attack from Power 5 to exactly 0 while own Magic, opponent non-Magic, and remote-battlefield Magic remain unchanged;
- with a tracked cost-4 Noble Phantasm, base Noble Bloom and threshold Noble Bloom appear as two independent responses and settle typed VP `+1` then `+1`, moving VP from 4 to 6 with two `victory_points_adjusted` events.

## Frozen-authoring burn-down observed by S

Programmatic frozen-F1 comparison against the exact A handoff:

- denominator: 944;
- canonical authoring overlap: `49 -> 59` (+10);
- exact FM03 batch: `0/10 -> 10/10`;
- added frozen IDs equal the exact authorized FM03 set: PASS;
- unauthorized additions: 0;
- removals: 0;
- skipped members: 0.

## Raw coverage observation

Temporary S coverage is not staged for commit. It reports:

- archives `39 -> 49`;
- cards `71 -> 81`;
- abilities `130 -> 160`;
- `newRuntimeSemanticRouted=12`;
- `legacyExecuteAbility=3`;
- `legacyResolveEffect=107` (`+20` Noble Bloom abilities);
- `dualRuntime=0`;
- `notClassifiable=38` (`+10` Magic Resistance phase actions);
- `taxonomyWarnings=114` (`+10` existing phase-action taxonomy warnings);
- compiled product unchanged: 70 cards / 14 characters / 0 blocking issues;
- compiled definition hash remains `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`.

All 30 newly visible abilities are semantic-signature identical to the already accepted Artoria Alter representatives after removing archive/card/ability identity fields: `STRUCTURAL_MISMATCHES=0/30`. The 20/10 raw reporter labels therefore reproduce the existing representative classification; S does not redefine A-owned runtime taxonomy/KPI.

## Validation

- typecheck: PASS;
- FM03 + FB2-10 + B18 + B19 focused: `4 files / 21 tests PASS`;
- content validation: 7 masters / 7 servants / 20 events / 0 blocking issues;
- all rules regressions: `49 files / 292 tests PASS`;
- deterministic generated content: PASS with unchanged hashes:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.

Standard parallel full CI reproduced the already-reviewed five-second MatchSession wall-clock flake and no other failure:

```text
115 files PASS / 1 timed-out file
704 PASS / 1 timeout / 705 total
```

No timeout/configuration was changed. Fresh S discrimination runs:

```text
match-session.test.ts isolated: 26/26 PASS; 11-round item ~1.96s
same full test:ci set with --maxWorkers=1: 116 files / 705 tests PASS
```

- runtime hot-file changes relative to handoff: 0;
- `git diff --check`: PASS.

## Changed scope

Candidate scope is exactly:

- ten new minimal `data/authoring/servants/*.json` archives for the authorized batch;
- `packages/rules/tests/fm03-saber-magic-resistance-authoring.test.ts`;
- this S migration report.

`artifacts/phase3-skill-coverage.json` is intentionally left unstaged after the temporary S observation. No runtime implementation, coverage classifier/taxonomy definition, frozen F1 artifact, generated playtest content, or unrelated authoring is changed.
