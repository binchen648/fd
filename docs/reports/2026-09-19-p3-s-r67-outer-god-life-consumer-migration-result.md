# P3-S R67 Outer-God-Life Consumer Migration Result

Role: Codex S
Status: `MIGRATION_COMPLETE_CANDIDATE`
Date: 2026-09-19

## Exact baseline

- A dispatch Base: `90d7536ebc314cef00a01cc76d181557c0be0449`
- Accepted capability synchronization: `187218d9ca3c3b2f619c61377abbed320b342dae`
- Accepted runtime Revision Candidate: `a79d6ca63f1ce2a8cf957fe224e60f8537905575`
- Fresh capability review: R67 `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Project formal recovery state at dispatch: `131/944`, remaining `813`

This S Candidate does not alter the accepted generic Outer-God-Life runtime. It only materializes the exact five dispatched frozen consumers as standalone authoring definitions.

## Exact migrated identities

Exactly five frozen identities are added:

1. `servant.abigail.skill.sc-abigail-4`
2. `servant.clytie.skill.sc-clytie-4`
3. `servant.hokusai.skill.sc-hokusai-4`
4. `servant.molay.skill.sc-molay-4`
5. `servant.voyager.skill.sc-voyager-4`

Full frozen F1 printed-text SHA-256 values:

- Abigail: `c067eaf714c63dc3cb08957261a643c8107e21ebd66fc2981008ac075957e940`
- Clytie: `146c26d2ca823f92c1a758e9e23c37f6d8f88c54e3818164b153af19260d464f`
- Hokusai: `e0c05d4411c50ccc67a2354a8d856c79014a6a6e63d41f32b59d364b471326f3`
- Molay: `9aa41b08e14ff5d692af6b91a7f653b0626c3419b3a847611da5fa2a750cf97f`
- Voyager: `d0ba9965338bcd719d3631256f57144ff71363113069c44dfb4225af5296d0bd`

Each archive records the exact F1 clause provenance/hashes. No sixth frozen identity is added.

## Authoring representation

Five new standalone `servant_skill_card_archive` files are added:

- `data/authoring/servants/servant.abigail.json`
- `data/authoring/servants/servant.clytie.json`
- `data/authoring/servants/servant.hokusai.json`
- `data/authoring/servants/servant.molay.json`
- `data/authoring/servants/servant.voyager.json`

Each contains exactly one `领域外生命` servant-skill definition. Frozen F1 is authoritative for canonical identity and printed text. Locked Reference supplies only static owner/class/card-face metadata:

- Abigail: `Foreigner`, cost `1`, base power `0`, legacy requirement `1`, type `特殊`;
- Clytie: `Foreigner`, cost `1`, base power `0`, legacy requirement `0`, type `特殊`;
- Hokusai: `Foreigner`, cost `1`, base power `0`, legacy requirement `1`, type `特殊`;
- Molay: `Saber`, cost `1`, base power `0`, legacy requirement `1`, type `特殊`;
- Voyager: `Foreigner`, cost `1`, base power `0`, legacy requirement `0`, type `特殊`.

The ordinary accepted standalone servant-skill threshold shape remains `skill_zone_mana_at_least: 8`. Legacy requirement values are retained only as static provenance and do not create a new runtime semantic.

## Accepted structural runtime contract reused

Every migrated card uses the exact R67 / FB2-29 identity-free shape:

- `cardFace.semanticCategory: "outer_god_life"`;
- one combat `phase_action`;
- activation exact `phase=combat`, `opens=controller_combat_action_window`, `requiresSourceState=active`;
- exact effects in order:
  1. `adjust_round_total_power` to `[controller, source_servant_owner]`, amount `6`, `dedupe=true`;
  2. `schedule_source_card_return` to `source_servant_owner`;
- no additional condition/target/cost/create/modifier/lifecycle/limit/visibility semantics;
- automatic execution with no host operations.

Molay uses the same structural source-servant-owner relation. There is no Molay-specific runtime branch and no identity/name/printed-text/F1/Reference-handler routing.

## Runtime proof with actual migrated definitions

`packages/rules/tests/outer-god-life-consumer-migration.test.ts` loads the real five archives and proves:

- all five authoring definitions load with zero issues and satisfy `isOuterGodLifeAbilitySemantic`;
- exact full-text hashes and static metadata;
- controller != source owner gives exactly `+6/+6` and schedules the physical return to the structural source owner;
- controller == source owner dedupes to `+6`, never `+12`;
- every one of the five definitions uses the same runtime relation, including Molay;
- eliminated owner at use time rejects transactionally;
- one active + one eliminated duplicate match resolves the unique live owner;
- multiple active matches reject transactionally;
- a validly established physical return survives later recipient elimination and settles to that recorded recipient at authoritative battle terminal;
- terminal replay is idempotent;
- two independent physical sources stack to `+12/+12`;
- production battlefield resolution consumes the current-round ledger;
- round advancement expires the ledger;
- derived/generated source skips ordinary physical-return scheduling;
- none of the five standalone archives is registered in the production playtest pack or generated product library.

## Product / role isolation

Relative to the exact A dispatch Base, S changes no file under:

- `packages/rules/src/**`
- `data/packs/**`
- `data/generated/**`
- `apps/**`
- `scripts/**`
- `artifacts/**`
- `data/phase3/**`

The five standalone archives therefore create no playable servant character, deck, fixture seat, or generated product registration. Generic runtime/compiler source remains byte-identical to Base.

## Mechanical frozen accounting

Fresh scan of every JSON archive under `data/authoring/**` against the authoritative F1 roster gives:

### Base material

- denominator: `944 = 943 static + 1 dynamic`
- authoring archives: `111`
- cards: `150`
- unique IDs: `150`
- frozen overlap: `127/944`
- duplicates: `[]`

### Candidate material

- authoring archives: `116`
- cards: `155`
- unique IDs: `155`
- frozen overlap: `132/944`
- candidate-material remaining: `812`
- duplicates: `[]`
- exact additions: the five dispatched IDs above
- removals: `[]`

The `127 -> 132` values are branch-local material accounting because this capability lineage predates the separately accepted Lostbelt migration. Project formal recovery accounting remains **`131/944`**, remaining **`813`**, until fresh independent migration review plus later A synchronization. If this exact five-card migration is accepted and synchronized, the project formal total would become `136/944`; this S Candidate does not pre-credit it.

Historical P3-FM09 remains `MIGRATION_BLOCKED`.

## Validation

Fresh S dependency materialization completed with `npm ci --offline`. The first focused invocation occurred before workspace TypeScript package output was available and therefore could not resolve `@fd/content`; no repository/product change was made for that environment state. Normal `npm run typecheck` built the workspace successfully, after which the identical focused command passed.

Final gates:

- typecheck: PASS;
- focused migration + FB2-29 + executable compiler: **`3 files / 98 tests PASS`**;
- rules `src + core + regression + migration`: **`83 files / 499 tests PASS`**;
- official CI: **`143 files / 1003 tests PASS`**;
- eleven-round MatchSession in official CI: approximately **`4692 ms / 5000 ms`**, PASS;
- content validate/compile: **`7 masters / 7 servants / 20 events / 0 blockers`**;
- generated determinism unchanged:
  - library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- Locked Reference verify: PASS at exact `b2f9fa15fba07c63530bbf4612b03b8b704755f9`;
- client production build: PASS; existing Vite `node:crypto` browser-externalization warning only;
- Phase 3 coverage reflects the five new standalone authoring definitions: `116 archives / 155 cards / 260 abilities`; compiled production remains `76 cards / 14 characters / 0 blockers`; routing `22/3/135/0/100/142`;
- automation audit: `135/3/100/20`;
- coverage/audit artifact side effects restored;
- `git diff --check`: PASS.

## Next gate

Commit/push one S Candidate, open one PR against the exact A dispatch branch, and hand the exact Candidate to a fresh independent R. S does not merge, retarget, or perform A acceptance synchronization.