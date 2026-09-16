# P3-FM07 Alter Ego Transform Migration — S Result

Date: 2026-09-16
Owner: Codex S
Status: `MIGRATION_COMPLETE_CANDIDATE`
Base / A synchronization: `2fec63dbd6533f435e851c471d3bf00fa75695e2`
FB2-13 accepted runtime: `18f2733eb0551f368e78a5f67ad9a32b96193d5b`
R37 acceptance: `dc96afa3253dcf86a13e13ea29c8b99fb895df49`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Exact migration set

FM07 materializes exactly the ten A/R37-authorized identities and no others:

1. `servant.douman.skill.sc-douman-3`
2. `servant.koyanskaya.skill.sc-koyanskaya-1`
3. `servant.mechaeli.skill.sc-mechaeli-3`
4. `servant.meltryllis.skill.sc-meltryllis-3`
5. `servant.muramasa.skill.sc-muramasa-3`
6. `servant.okita-alt.skill.sc-okita-alt-1`
7. `servant.passionlip.skill.sc-passionlip-1`
8. `servant.sitonai.skill.sc-sitonai-3`
9. `servant.taisui.skill.sc-taisui-1`
10. `master.sion.skill.s12`

All ten owner archives were absent at the synchronization base, so this batch creates ten minimal one-card canonical archives. No pre-existing owner archive is overwritten and no sibling skill is imported.

The complete F1 inventory has `944` identities. Exact material overlap changes from `91/944` at the base to `101/944`, with `10` additions and `0` removals. This is material coverage only; accepted overlap remains `91/944` until downstream A synchronization plus independent migration review accepts FM07.

## Frozen evidence and static metadata

The nine servant identities preserve the regular frozen source-text SHA:

`b6c74ac37a50b671ded913dbc6ae6736f2057904fe4c02924d79f84971cebbdf`

Sion EX preserves its distinct frozen source-text SHA:

`43c84de7cf6532ee6b561d8cfa35ddbdeac52850f6105684b23a82121636a892`

Locked Reference metadata is preserved per identity rather than flattened:

- all nine servant owners remain class `Alterego`;
- regular servant cards preserve printed cost `2`, legacy requirement `2`, and base Power `3`;
- eight regular cards preserve type label `被动`;
- Passionlip preserves its distinct type label `特殊`, name `他人格`, and Reference residual static metadata;
- Sion preserves owner `master.sion` / class `Master`, card type `master_skill`, name `他人格 EX`, type label `特殊`, printed cost `3`, legacy requirement `3`, and base Power `3`.

Every archive records the frozen F1 commit, source references, source-text SHA, locked Reference static metadata and `P3-R37/FB2-13` accepted-contract provenance. The normal final-rule skill-zone play threshold is recorded as `skill_zone_mana_at_least: 8`; this threshold remains distinct from printed card cost and from Sion EX's triggered 3-mana payment.

## Structural authoring

Nine regular identities use only the accepted FB2-13 regular structure:

- `optional_trigger`;
- Action phase / trusted `on_card_played` / active source;
- no client card target;
- `transform_event_source_card`;
- then `close_source_card`;
- turn-order response with `decline_this_window`;
- no additional cost or use limit.

Sion EX uses only the accepted FB2-13 EX structure:

- same trusted event-bound trigger and response window;
- `pay_mana` 3 to controller at successful response settlement;
- `transform_event_source_card`;
- no source close;
- `per_round`, one use, `this_card` scope.

No runtime file, Trigger gateway, taxonomy implementation, generic transform command, identity router or printed-text parser is changed by FM07.

## Focused migration evidence

`packages/rules/tests/fm07-alter-ego-transform-authoring.test.ts`: `6 / 6 PASS`.

Together with the accepted FB2-13 regression: `2 files / 13 tests PASS`.

The FM07 suite proves:

1. exact ten-member archive membership, one canonical card per new owner and locked legacy/static identity;
2. frozen regular/Sion text hashes, F1 provenance and final 8-mana skill-zone threshold;
3. all ten load blocker-free and classify only as the accepted FB2-13 `regular` or `ex` structure;
4. a real migrated Douman card transforms the trusted current-round target, applies selected effective attributes and closes only the Alter Ego source;
5. a real migrated Sion EX card defers payment while the attribute choice is pending, then pays exactly 3, preserves the source in the attack area, applies the transform and cannot respond a second time that round;
6. the 8-mana skill-zone qualification remains separate from the regular card's printed cost 2.

All migration suites FM01-FM07 plus FB2-13: `8 files / 56 tests PASS`.

## Full validation

- `npm.cmd run typecheck`: PASS.
- rules regression + core: `65 files / 385 tests PASS`.
- `npm.cmd run content:validate`: `7 masters / 7 servants / 20 events / 0 blocking issues`.
- generated-content determinism: PASS with unchanged hashes:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- standard `npm.cmd run test:ci`: `119 files / 727 tests PASS`.
- `git diff --check`: PASS.

The first focused invocation in this fresh worktree occurred immediately after `npm ci --ignore-scripts` and failed during module collection because the workspace build output for `@fd/content/rules` did not yet exist. No test body ran. Running the repository's normal `typecheck` build first resolved that environment-order issue; all subsequent focused and full gates above pass.

## Fresh material coverage

Fresh `npm.cmd run phase3:coverage` after the exact ten archives:

- archives `90` (`+10`);
- cards `123` (`+10`);
- abilities `222` (`+10`);
- `newRuntimeSemanticRouted=22`;
- `legacyExecuteAbility=3`;
- `legacyResolveEffect=127`;
- `dualRuntime=0`;
- `notClassifiable=70` (`+10`);
- `taxonomyWarnings=124`;
- compiled definition hash unchanged at `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`;
- blocking issues `0`.

The ten new coverage rows account for the `notClassifiable` increase because the coverage taxonomy does not yet classify primitive `transform_event_source_card`; this is the same material-coverage behavior seen for earlier migrated accepted primitives. The independent FM07 authoring test directly loads all ten and proves that the production interpreter classifies each as the already accepted FB2-13 semantic route. S does not modify coverage taxonomy/runtime to manufacture KPI movement.

The generated coverage artifact contains real material changes and is intentionally left unstaged for downstream A material synchronization.

## Scope audit

- complete F1 identity set: `944`;
- base material overlap: `91/944`;
- FM07 material overlap: `101/944`;
- exact additions: `10`;
- removals: `0`;
- each authorized identity appears in exactly one authoring archive;
- production runtime diff against A-sync base: `0` files;
- unrelated authoring modifications: `0`;
- generated coverage artifact: unstaged.

## Downstream handoff

A should synchronize the exact S candidate and material coverage evidence without taking accepted `101/944` credit yet. The independent migration reviewer must re-check exact 10-ID membership, both source-text hashes, locked static metadata including Passionlip/Sion differences, the distinct skill-zone / printed-cost / Sion ability-cost semantics, real regular and EX execution, no runtime diff, and the full validation gates. Only an independent migration acceptance may advance accepted overlap from `91/944` to `101/944`.
