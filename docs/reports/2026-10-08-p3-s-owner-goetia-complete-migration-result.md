# P3-S Goetia Owner-Complete Migration Result

Date: 2026-10-08
Task: `P3-S-OWNER-GOETIA-COMPLETE-MIGRATION`
Exact Base: `8b3576f4b9e9f73dcc20969e5979494e097083a8`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Accounting before acceptance: `267/944`, remaining `677`.

## Frozen owner scope

The formal owner transaction contains exactly the three frozen Goetia identities:

- `master.goetia.skill.ascension` — 冠位时间神殿
- `master.goetia.skill.s1` — 集体意识
- `master.goetia.skill.s2` — 魔神柱

Exact Base canonical Goetia authoring coverage is `0/3`; `data/authoring/masters/master.goetia.json` does not exist at Base. The working formal transaction materializes all three exactly once in one canonical Master archive. They remain only provisionally creditable until fresh exact `MIGRATION_ACCEPTED` plus FORMAL acceptance synchronization/accounting.

## Formal consumer

Adds `data/authoring/masters/master.goetia.json` and registers it exactly once in `fd-playtest-v1`.

Static owner metadata from locked Reference:
- owner id/name: `master.goetia` / 盖提亚;
- initial mana: `4`;
- `s1` 集体意识: 被动, cost `0`, Power `0`;
- `s2` 魔神柱: 被动, cost `0`, Power `0`;
- ascension 冠位时间神殿: 特殊, cost `13`, requirement `13`, Power `0`, initial placement `outside_game`.

The frozen `s2` skill is the canonical printed carrier for the seven physical Demon God clauses. The physical helper definitions are owner support material and do **not** create additional migration credit:

- `card.goetia.demon-god.baal` — cost 13 / Power 1;
- `card.goetia.demon-god.phenex` — cost 13 / Power 1;
- `card.goetia.demon-god.forneus` — 力量, cost 5 / Power 0;
- `card.goetia.demon-god.flauros` — 迅捷, cost 4 / Power 0;
- `card.goetia.demon-god.zepar` — 魔术, cost 6 / Power 0;
- `card.goetia.demon-god.raum` — 特殊, cost 2 / Power 0;
- `card.goetia.demon-god.barbatos` — cost 3 / Power 0.

The consumer uses only the accepted identity-free `linked_auxiliary_suite` readiness authority from PR #551:
- s1: game-start seven-member setup, zero ordinary Command Seals, battle-win mark, round-end upkeep/removal/elimination;
- Baal: append-only/same-batch cost authority + immutable Power;
- Phenex: immutable Power + remove another active member for 6 mana;
- Forneus: combat close/shuffle/play/action-grant;
- Flauros: preparation shuffle + round Power;
- Zepar: battle-loss shuffle/+2 VP/upkeep skip;
- Raum: post-battle recon return/upkeep skip + Action discard/move;
- Barbatos: 4-mana Command-Seal substitution + exact Action-phase round play exceptions;
- ascension: unlock activation into attack area, standard residual marker for “never close”, +4 Power to newly played non-immutable members, and preparation 1-mana redraw.

No Goetia/card-name/printed-text routing is introduced in production runtime.

## Shared affected-regression closure

Expanding the canonical Master pool to 25 exposed one pre-existing durable-restore defect in accepted Caren behavior.

Reproduction:
- the existing MatchSession regression `drops eliminated players from durable terrain assignment authority after scoring` became a stable restore failure;
- seed `1` did **not** select Goetia and `linkedAuxiliarySuites` was empty;
- executable pack integrity/hash remained valid;
- state-container isolation identified only p1 Caren’s historical flag
  `__fd_definition_resource_binding:provisioned:p1-master.caren.skill.s1:caren.s1.provision`;
- the exact provision source `p1-master.caren.skill.s1` was legally active in `field` after play;
- the restore validator incorrectly reused the execution-time `sourceProvider`, which only permits `skill`, so a legal historical provision marker became unrestorable.

The Candidate therefore includes one identity-free, restore-only repair in
`packages/rules/src/ability/definition-resource-binding-capability.ts`:
- execution-time `sourceProvider` is unchanged;
- new `persistedProvisionProvider` accepts only exact owned active-controller Master-skill provision sources in `skill` or legally played `field`;
- exact accepted provision ability and non-face-down source remain mandatory;
- `hand`, deck, discard, attack-area and unrelated sources remain rejected;
- no Caren or Goetia identity/name/text routing is added.

Focused regression added to the existing Caren readiness suite proves:
- exact game-start provision history remains restore-valid after its exact source is legally played to `field`;
- changing that source to forged `hand` state remains restore-invalid.

This is the same governance pattern already used by prior owner transactions whose affected regressions exposed identity-free shared restore defects (for example Amakusa and Araya): the shared repair is disclosed, independently reviewable, and adds **zero** migration credit.

## Verification

Goetia owner-complete:
- `p3-goetia-owner-complete-migration.test.ts`: **5/5 PASS**.
- proves exact 3/3 frozen materialization plus seven physical helpers and pack-once registration;
- real game-start seven-member creation and zero Seals;
- real Phenex command/decision remove-for-mana;
- real Barbatos round exceptions and Seal substitution;
- real ascension unlock, residual behavior and +4 member Power;
- battle-win upkeep skip, zero-member elimination, forged restore rejection;
- production Goetia identity-routing audit CLEAN.

Accepted Goetia readiness:
- `4/4 PASS`.

Caren shared restore regression:
- full Caren readiness suite now `13/13 PASS`;
- the new field-provider restore case is included.

Selected affected aggregate:
- **`131/131 PASS` across 9 files**:
  - Goetia owner: 5;
  - Goetia readiness: 4;
  - Caren readiness: 13;
  - required additional play: 8;
  - Ruler / Command-Seal subsystem: 13;
  - master ascension unlock: 5;
  - complex skills: 38;
  - MatchSession gameplay regressions: 11;
  - MatchSession: 34.

Static/content gates:
- `npm run typecheck`: PASS;
- `npm run content:validate`: PASS — `25 masters / 19 servants / 20 events / 0 blocking issues`;
- `npm run verify:generated-content`: PASS:
  - content `f7f0a1b44e3e9d22425ed646adbc53aa8a925f2f0bcfc462d5c237325ce7264a`;
  - fixture `87542f5da07effcf6bba03efd963ae964dde99af4f6c3c63352225e870c96e6c`;
  - evidence `600fe09a921a9ace395dbfb00eec850e04b5e65a6a4f22ef3460ffdc15f693e0`;
- `git diff --check`: PASS;
- Goetia development image exists at `E:\Codex\FD\Fate_Domination-开发版\images\masters\盖提亚.png`;
- repository-wide `test:source-assets` still reports exactly `93` pre-existing `chm-extract/图包` missing-image blockers; no Goetia entry appears and this gate is not represented as PASS.

External Phase-3 coverage:
- `archives=129 cards=305 abilities=536`;
- `compiledCards=244 compiledCharacters=44 blockingIssues=0`;
- `newRuntimeSemanticRouted=22 legacyExecuteAbility=3 legacyResolveEffect=165 dualRuntime=0 pilotAllowlist=0 notClassifiable=346 taxonomyWarnings=357`;
- definition hash `c06645c9ce551563966cfbdd09ca6ba4db45ea33d06b9844b8497d325c38fe5e`.

External automation audit:
- `legacyResolveEffect=165 legacyExecuteAbility=3 notClassifiable=346 promotionFindings=20`.

Scratch evidence:
- `E:\Codex\FD\.fd-runner-review-evidence\formal-goetia-owner-8b3576f4-nonce112e95c077f815ee099968484eaeba3f`.

## Accounting / review gate

Mechanical boundary:
- exact Base Goetia coverage: `0/3`;
- formal working coverage: `3/3`;
- seven helper physical definitions: `7`;
- canonical pack registration: exactly `1`;
- production identity-routing audit: CLEAN;
- shared restore repair contributes `+0` credit.

This transaction is not acceptance. Strict accounting remains `267/944`, remaining `677`.

Only one fresh exact Base/Candidate `MIGRATION_ACCEPTED` review followed by FORMAL A-sync/accounting may credit exactly the three frozen Goetia identities:
`267/944 -> 270/944`, remaining `674`.
