# P3-R38 FM07 Alter Ego Migration — Independent Review

Date: 2026-09-16
Owner: Codex R
Verdict: `MIGRATION_ACCEPTED`
S candidate: `9c32957b13bc3964932b9a134702c1487069e059`
A synchronization: `1d04b43094a3797413069182a994426eab28f816`
Pre-FM07 accepted A sync: `2fec63dbd6533f435e851c471d3bf00fa75695e2`
FB2-13 runtime candidate: `18f2733eb0551f368e78a5f67ad9a32b96193d5b`
R37 runtime acceptance: `dc96afa3253dcf86a13e13ea29c8b99fb895df49`
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Verdict

R38 independently accepts FM07. No blocking finding remains.

Accepted canonical overlap advances from `91/944` to `101/944`. The remaining not-yet-accepted canonical gap is `843/944`.

## Independent exact-set / burn-down audit

R38 recomputed the full frozen denominator directly from the F1 inventory:

- static identities: `943`;
- dynamic identities: `1`;
- total: `944`.

Comparing pre-FM07 canonical authoring with the A-synchronized lineage yields:

- before: `91/944`;
- after: `101/944`;
- additions: exactly `10`;
- removals: `0`;
- unauthorized F1 additions: `0`;
- exact added set equals the R37/A-dispatched ten-member Alter Ego family.

## Independent source/static audit

All ten full-text hashes match the frozen F1 evidence.

Nine regular identities use:

`b6c74ac37a50b671ded913dbc6ae6736f2057904fe4c02924d79f84971cebbdf`

Sion EX uses:

`43c84de7cf6532ee6b561d8cfa35ddbdeac52850f6105684b23a82121636a892`

Locked static differences remain intact:

- all nine servant owners: class `Alterego`;
- regular numeric metadata: printed cost `2`, legacy requirement `2`, base Power `3`;
- eight regular cards: type label `被动`;
- Passionlip: type label `特殊` and its distinct Reference metadata;
- Sion: class `Master`, `master_skill`, type label `特殊`, printed cost `3`, legacy requirement `3`, base Power `3`;
- all ten: final-rule skill-zone gate `8`;
- Sion EX triggered payment remains a distinct response cost of `3`, not the play gate or printed cost.

## Independent structural/runtime audit

Nine regular cards exactly encode the R37-accepted regular FB2-13 structure:

- optional `on_card_played` response from active source;
- trusted event-bound target, no client card target;
- `transform_event_source_card` then `close_source_card`;
- no extra response cost or limit.

Sion EX exactly encodes the accepted EX structure:

- same trusted trigger;
- response payment `pay_mana(controller, 3)`;
- `transform_event_source_card` only;
- no source close;
- once per round / this-card scope.

Production runtime diff from the accepted pre-FM07 synchronization to the S candidate is `0` files.

The FM07 focused suite executes real migrated Douman and Sion cards through the production interpreter. It proves regular effective-attribute replacement + source close and EX deferred payment + no-close + once-per-round behavior.

## Independent dynamic validation

R38 used a fresh reviewer worktree and fresh offline dependency install.

- `npm.cmd ci --offline --ignore-scripts`: PASS, 0 vulnerabilities.
- `npm.cmd run typecheck`: PASS.
- FM01-FM07 migration suites + FB2-13: `8 files / 56 tests PASS`.
- rules regression + core: `65 files / 385 tests PASS`.
- `npm.cmd run content:validate`: `7 masters / 7 servants / 20 events / 0 blocking issues`.
- generated-content determinism: PASS with unchanged hashes:
  - content `8da51a30935845670dcd88928089730ff4a7a39d9b53b8c8c794189d95509840`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- standard `npm.cmd run test:ci`: `119 files / 727 tests PASS`.
- fresh `npm.cmd run phase3:coverage`:
  - archives `90`;
  - cards `123`;
  - abilities `222`;
  - `newRuntimeSemanticRouted=22`;
  - `legacyExecuteAbility=3`;
  - `legacyResolveEffect=127`;
  - `dualRuntime=0`;
  - `notClassifiable=70`;
  - `taxonomyWarnings=124`;
  - compiled definition hash `37551fd5f5b0a968f9143dee0698adf8582a0a26d8edabef55907cf78d374333`;
  - blocking issues `0`.

Reviewer fresh coverage differs from A's committed material artifact only by `generatedAt`; source fingerprint, counters and material rows are identical. The reviewer leaves this timestamp-only artifact drift uncommitted.

## Scope audit

- S changed only ten authoring archives, the FM07 focused test and S report.
- A changed only material coverage evidence and coordination/reporting docs.
- runtime diff: `0`.
- `git diff --check`: PASS.
- no identity/name/printed-text runtime routing was added by migration.
- no coverage taxonomy or runtime was modified to manufacture KPI movement.

## Acceptance consequence

FM07 is `MIGRATION_ACCEPTED`. Accepted canonical overlap is now `101/944`, leaving `843/944` identities outside independently accepted canonical authoring. The next A planning pass may use the R38-accepted lineage as its base and scan the remaining frozen F1 set for the next legal 10–40 member capability-complete migration family.
