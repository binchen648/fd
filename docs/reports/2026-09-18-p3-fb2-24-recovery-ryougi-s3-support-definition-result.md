# P3-FB2-24 Recovery — Ryougi S3 Support Definition Result

Date: 2026-09-18
Role: Codex S
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Base: `7e2925ed37f89b60dac2c2b13c68081af6e33fbe`
Target: exactly `master.shiki-ryougi.skill.s3`

## Result

Materialized exactly one frozen master support definition: `master.shiki-ryougi.skill.s3` (`两仪式` / `死・紧握`). No second frozen identity, playable master, deck, fallback command spell, MatchSession source, or production rules route was added.

The implementation uses only already-accepted generic contracts:

- required-additional play via `append_only_rule` (P3-R42 / FB2-16);
- `initialPlacement: outside_game` (P3-R43 / FB2-18);
- `master_support_definition_archive` support-only registration (P3-R44 / FB2-19);
- exact same-battlefield private-hand inspection / optional return-one-to-owner-deck interaction (P3-R48-R2 / FB2-23).

F1 wording permits “one player at the same battlefield”; no `not_controller` or opponent-only restriction was invented.

## Provenance

F1 `59f145434695d29bdd17e4cb3adc887e84182377` is the semantic/provenance authority.

Exact clauses:

- `此牌需追加打出。` — SHA-256 `b8948b29606c56ee673f234c17afe98448ae3986ee1a6155b5b827e23096a239`;
- `行动阶段：查看一名与你位于同一战场的玩家的手牌，你可将其中一张牌洗回其所有者的牌库。` — SHA-256 `c3554f0f6f966f69aa14816bcba99bb291db64c13b4ca8f345a74fd4619c95c4`.

Combined printed text SHA-256: `49bfaa05b153321ecdc5a317f257a228d8f9f16c5afcf337b69ea526bad90110`.

Locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9` supplies only stable static metadata/source locator: legacy id `s3`, type label `魔术`, cost `1`, base Power `0`, legacy requirement `1`, and `master.shiki-ryougi/两仪式`. The historical `core.structured-skill` handler is not used as current routing authority.

## Static / product shape

The authoring archive is support-only:

- `archiveType: master_support_definition_archive`;
- archive id `master.shiki-ryougi`;
- exactly one card `master.shiki-ryougi.skill.s3`;
- owner `master.shiki-ryougi`;
- `cardType: master_skill`;
- `initialPlacement: outside_game`;
- canonical final-rules skill-zone play threshold `skill_zone_mana_at_least: 8`; legacy Reference `requirement: 1` is retained only as static evidence and is not used as the current play threshold;
- no archive `publicInformation` or deck;
- registered only through `authoringMasterSupportFiles`;
- not registered through `authoringMasterFiles`.

Generated product keeps playable masters `7`, servants `7`, and executable characters `14`; compilation reports `73` executable cards and `0` blockers. Fixture/evidence outputs contain zero `master.shiki-ryougi` occurrences. Generated library exposure is limited to the support card plus its three source-map entries (card, append-only ability, private-hand ability); no Ryougi playable-master surface is created.

Production `packages/rules/src/**` contains no `master.shiki-ryougi`, `两仪式`, `死・紧握`, or `core.structured-skill` routing introduced by this Candidate, and Base→Candidate has zero `packages/rules/src/**` / MatchSession source diff.

## Behavior regression

The dedicated regression verifies:

- exact F1 clause hashes and Reference static metadata, while preserving final-rules 9.4 skill-zone threshold `8` rather than the legacy Reference requirement `1`;
- support-only / outside-game shape and no `initialZone`;
- append-only contract and exact FB2-23 semantic envelope;
- support-only pack registration;
- actual p1-controller / p2-selected / p3-observer private-hand behavior;
- p2 selected card returns to p2/card-owner deck without mutating p1/controller deck;
- literal controller self-selection remains legal when at the same battlefield.

Focused Ryougi + FB2-23 + executable compiler: `3 files / 66 tests PASS`.

## Validation

Fresh S validation:

- `npm ci --offline`: PASS, 239 packages, 0 vulnerabilities;
- typecheck: PASS;
- content validate/compile: `7 masters / 7 servants / 20 events / 0 blocking issues`;
- generated determinism: PASS;
- focused Ryougi + FB2-23 + executable compiler: `3 files / 66 tests PASS`;
- unchanged official `npm run test:ci`: `133 files / 866 tests PASS`;
- rules core + regression: `73 files / 451 tests PASS`;
- client production build: PASS, existing Vite `node:crypto` warning only;
- locked Reference verification: PASS at exact `b2f9fa15fba07c63530bbf4612b03b8b704755f9`;
- phase3 coverage: PASS;
- automation audit: PASS;
- `git diff --check`: PASS.

### Timing investigation

The historical pre-correction Candidate had one unchanged fixed-5000 ms inventory-test timeout followed by a green retry and overlapping Base/Candidate isolated timings; no timeout, worker, test source, or repository configuration was changed. After the pre-R49 semantic correction, the corrected Candidate's unchanged official full CI passed directly at **133 files / 866 tests**, the inventory intake test completed at about **1294 ms**, and the eleven-round MatchSession test completed at about **4576 ms**. There is no fresh evidence of a Candidate-specific performance regression.

## Determinism / reporting

Pre-review semantic correction: before R49 dispatch, coordinator inspection found that the initial Candidate had omitted the global final-rules 9.4 skill-zone 8-mana play threshold by leaving `playRequirements` empty. This was corrected within the same six-file Candidate scope before independent review; no runtime/source scope was expanded.

Candidate deterministic hashes:

- content library: `03582e22b830c59ccfe03379159dd5e50aef19fd7bae3561469c000e56618a79`;
- fixture: `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
- evidence: `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.

Fresh reporting:

- archives `101`;
- cards `136`;
- abilities `237`;
- compiled `73 cards / 14 characters / 0 blockers`;
- buckets `22/3/131/0/81/130`;
- automation audit `131/3/81/20`.

Coverage/audit commands temporarily rewrote their reporting artifacts; both artifacts were restored exactly before Candidate commit.

## Frozen accounting

Fresh mechanical F1 intersection:

- frozen denominator: `944` unique identities;
- Base material overlap: `112/944`;
- Candidate material overlap: `113/944`;
- exact frozen additions: only `master.shiki-ryougi.skill.s3`;
- frozen removals: `0`;
- duplicate canonical authoring IDs: `0`.

The other nine unresolved FM09 provisioning frozen targets remain absent from authoring/generated material.

This is **material only**. During S and R49 review, accepted recovery overlap remains `112/944`; integrated-main accepted overlap remains `111/944`. Only fresh independent R49 acceptance followed by post-review A synchronization may record accepted recovery overlap `113/944`.

## Exact Candidate scope

Expected Base→Candidate scope is exactly six files:

1. `data/authoring/masters/master.shiki-ryougi.json`;
2. `data/packs/fd-playtest-v1/pack.json`;
3. `data/generated/fd-playtest-v1.content-library.json`;
4. `packages/rules/tests/executable-card-pack.test.ts` — aggregate only `72 -> 73`;
5. `packages/rules/tests/regression/fb2-ryougi-s3-support-definition.test.ts`;
6. this result report.

No production rules source, MatchSession, fixture, evidence, scripts, taxonomy/KPI, Reference/F1, UI/server, or second frozen target is changed.

## Next gate

Commit/push the exact Candidate and open a stacked PR on `codex/a-p3-fb2-24-ryougi-s3-feasibility`. Then stop for fresh independent `P3-R49-RECOVERY`.

Do not self-review, perform post-R49 A synchronization, continue another frozen target, retry FM09, start FM10, merge, or retarget the stacked PR from this result.
