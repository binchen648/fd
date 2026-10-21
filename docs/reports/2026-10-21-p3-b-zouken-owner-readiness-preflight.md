# P3-B Zouken owner readiness preflight

- Date: 2026-10-21
- Lane: FORMAL
- Base: `658849d1` (`codex/b-p3-main-replay-fb2-49-r2`)
- Owner: `master.zouken` / 间桐脏砚
- Decision: **BLOCKED — `SOURCE_EVIDENCE_REQUIRED`; no Candidate implementation**

This is a source/readiness preflight only. It deliberately does not add inert
handlers, alter another owner, or claim a six-skill migration. The isolated
worktree used for this check is `zouken-owner-preflight`.

## Scope

The requested owner scope is exactly these six static skills:

| Ability | Name | Frozen Reference route | Current route |
| --- | --- | --- | --- |
| `master.zouken.skill.ascension` | 幕后主使 | `specific_handler` / `core.zouken-illusive-mastermind` | `none` |
| `master.zouken.skill.s1` | 大空洞的亡者 | `shared_handler` / `core.game-start-player-config` | `none` |
| `master.zouken.skill.s2` | 五百年的活尸 | `shared_handler` / `core.game-start-add-skill` | `none` |
| `master.zouken.skill.s3` | 创造者 | `specific_handler` / `core.zouken-founder` | `none` |
| `master.zouken.skill.s4` | 五百年的执念 | `specific_handler` / `core.zouken-pseudo-vampire` | `none` |
| `master.zouken.skill.s5` | 间桐家的宗主 | `shared_handler` / `core.game-start-rule-flags` | `none` |

## Frozen inventory result

Source: `data/phase3/full-roster-ability-inventory.json`, provenance
inventory commit `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.

All six entries are `classification=DISCOVERED`, have no structured
authoring abilities, and are explicitly marked:

```text
semanticNormalization.status = BLOCKED
semanticNormalization.blocks = ["SEMANTIC_SOURCE_REQUIRED"]
phase3.classificationRoute = SOURCE_EVIDENCE_REQUIRED
phase3.mappingStatus = EXPLICIT_BLOCK
phase3.currentRoute = none
```

The development-image and `src/content/generated/legacy-content.json` clause
hashes are discovery evidence only. The existing `core.zouken-*` and generic
`core.game-start-*` values are observed Reference routing, not canonical
semantic authoring. The normalization contract in
`scripts/phase3-reference/normalize-semantic-axes.ts` rejects an entry without
a source-aligned authoring card and non-empty structured abilities.

## Evidence by skill

| Skill | Evidence currently available | Missing contract that prevents implementation |
| --- | --- | --- |
| ascension | Legacy clauses at `masters[14].skills[5]`, hashes `2a10ede8…` and `70b82fdc…`; Reference route only | Source-grounded movement/engagement bypass, removal of the “win a battle” blood-worm condition, and action target/condition semantics for spending 6 mana to remove one opponent command seal |
| s1 | Legacy clause at `masters[14].skills[0]`, hash `2d006d82…`; FB2-05 separately confirms the numeric starting-mana primitive (10) | Canonical lifecycle/trigger/effect authoring for setting current mana and the 16-point cap; the accepted primitive is not an owner card or complete route |
| s2 | Legacy clause at `masters[14].skills[1]`, hash `8b8f4b24…`; FM09 recovery reports identify s2→s3/s4 provisioning dependency | Canonical derived-skill provisioning contract and accepted targets/order for adding `创造者` and `五百年的执念` at game start |
| s3 | Legacy clauses at `masters[14].skills[2]`, hashes `f94b2f9c…` and `eebcb82e…`; Reference `core.zouken-founder` only | Source-grounded command-seal substitution, 2X mana → X power action, and the round-win reward timing/storage contract |
| s4 | Legacy clauses at `masters[14].skills[3]`, hashes `dea05b10…`, `3326dc0b…`, `1a648249…`; Reference `core.zouken-pseudo-vampire` only | Source-grounded round-end VP loss, blood-worms winner/scouting/no-opponent/loser targeting rules, and bug-form 7-mana movement contract |
| s5 | Accepted FM08/R39 archive exists with clause hash `1bfe9fda…` and structured `install_rule_override` (`ignore_situation_play_forbid_attribute=宝具`) | Active-pack registration and inventory regeneration. This is an archive recovery exception, not evidence that the full owner is ready |

## Canonical archive and active-pack check

`data/authoring/masters/master.zouken.json` currently contains only
`master.zouken.skill.s5`. Its source policy records accepted FB2-14/R39
evidence (`phase3EvidenceCommit=59f145434695d29bdd17e4cb3adc887e84182377`)
and says Reference is metadata-only. It does not provide cards for ascension
or s1–s4.

The active `data/packs/fd-playtest-v1/pack.json` contains no Zouken entry in
`masterFiles` or `masterCardFiles`, and does not list `master.zouken.json` in
`authoringMasterFiles` or `authoringMasterSupportFiles`. Therefore the active
pack has 0/6 owner registrations. The frozen inventory predates the s5 archive
recovery and still reports s5 as blocked; that discrepancy must be reconciled
by regeneration/audit rather than silently treating s5 as migrated.

## Runtime-contract check

The current `binchen648/fd` target runtime contains no `core.zouken-*` handler
or Zouken owner route. The only matching IDs are frozen Reference observations
and the archive card above. The older Reference implementation in the other
repository/worktree is not a legal source for Phase 3 semantics and cannot be
copied into this target as an implementation contract. Consequently there is
no verified target-runtime contract on which to build five missing skills or a
complete six-skill owner candidate.

## Readiness decision

This owner is **not implementation-ready**. The blocker is semantic source
evidence, not a tool or test failure:

- frozen inventory: 6/6 explicitly blocked by `SEMANTIC_SOURCE_REQUIRED`;
- canonical structured archive: 1/6 (s5 only);
- active-pack registration: 0/6;
- target runtime Zouken routes: 0;
- FM09 dependency definitions for s2/s3/s4: absent from canonical authoring.

No owner handler, focused implementation test, typecheck result, or Candidate
claim is produced by this preflight.

## Required next steps

1. Obtain accepted, source-aligned authoring/evidence packets for ascension and
   s1–s4, including clause hashes and `phase3Evidence`.
2. Resolve the FM09 s2→s3/s4 derived-skill provisioning dependency and its
   accepted game-start ordering/targets.
3. Define and accept target-runtime contracts for the founder, pseudo-vampire,
   and illusive-mastermind mechanics; do not infer them solely from Reference
   handlers.
4. Extend `master.zouken.json` to all six cards and register it in the active
   pack only after the evidence is accepted.
5. Regenerate the frozen inventory/audit, then implement one six-skill owner
   Candidate with focused tests, typecheck, and diff-check.

## Cross-repository source audit (read-only)

The second audit searched the preserved `Fate_Domination-开发版` source tree,
the dirty `Fate_Domination-重构版` tree, and `binchen648_fd/archive`. It found
useful **source candidates**, but no additional source-aligned card archive
that is legal to bind into the current `fd-playtest-v1` pack.

Companion cross-repository audit record:
`E:\Codex\FD\.fd-takeover-audit-20261018\FD-ZOUKEN-CROSS-REPO-SOURCE-AUDIT-20261021.md`
(SHA-256 `8CBF562644144572B7E6A3A27BB2526B1A2AF8E1B6F513E1A362424B02F7BEAC`).
That record independently confirms the six texts, source hashes, and the rule
that these are candidates only—not an accepted Reviewer verdict or active-pack
binding.

### Full original-text candidate

`E:\Codex\FD\Fate_Domination-开发版\data_masters.js` (SHA-256
`C596AF5730846EF9092375F18C4200B84F032028DC2E8F5483377D8DDCC22825`, 102627
bytes, line 19) contains the complete `m_zouken` record: `initMana: 10`,
s1–s5, and ascension text. The six mappings are:

| Skill | Text present in `data_masters.js` | Current `fd` active-pack binding |
| --- | --- | --- |
| s1 / 大空洞的亡者 | game start mana 10, cap 16 | No — external legacy source only |
| s2 / 五百年的活尸 | creator + five-hundred-year obsession derived names | No — FM09 provisioning contract still absent |
| s3 / 创造者 | command-seal substitution and 2X→X power/round reward | No — old runtime contract only |
| s4 / 五百年的执念 | round-end VP loss, blood-worms, bug-form | No — old runtime contract only |
| s5 / 间桐家的宗主 | situation card cannot forbid Noble Phantasm | No — current canonical archive is not pack-registered |
| ascension / 幕后主使 | engagement bypass, blood-worm win-gate removal, 6-mana seal loss | No — old runtime contract only |

This is strong original-text evidence, but it is an external local development
tree with no Git provenance in this workspace. It is not a Phase 3 structured
authoring card, has no accepted `phase3Evidence` packet, and is therefore not
by itself sufficient to clear `SEMANTIC_SOURCE_REQUIRED` or enter active pack.

The same development tree contains the owner art
`E:\Codex\FD\Fate_Domination-开发版\images\masters\间桐脏砚.png`
(SHA-256 `4E4F3F5607D7B39BC16F4ACB01831976E4036F38EBC180514C4E6BC28F75C6B9`,
631359 bytes). Its visible card text covers s1, s2, and s5. The development
image index
`Fate_Domination-重构版/src/content/generated/development-image-sources.json`
(SHA-256 `5FDB8B0EA95D81A0317202B6E8F7EB01B8398AAFABEC37ACA0CB069DBCA0D5C9`,
99798 bytes, lines 200–210) maps this owner image to all six IDs, but that
index is metadata and does not make the absent s4 card face or runtime contract
canonical.

### Preserved card-art candidates

The old repository has these two matching card images:

| Skill | File and SHA-256 | Binding result |
| --- | --- | --- |
| ascension / 幕后主使 | `E:\Codex\FD\Fate_Domination-重构版\assets\cards\skills\master-间桐脏砚-ascension.png`; `D762F7F387744CC353E1267B6CDD1F2FA36A4FCCE8F9EAF48D80DF41D3A8794F` | Original-text image candidate; not active-pack bindable |
| s3 / 创造者 | `E:\Codex\FD\Fate_Domination-重构版\assets\cards\skills\master-间桐脏砚-s3.png`; `5349F02028B972C8D0B6E1EDD83F888CADC75C9B5F2E1451BCAD1E0605363EEE` | Original-text image candidate; not active-pack bindable |

The ascension image is byte-identical to the preserved source image
`E:\Codex\FD\卡图原图\Images\httpssteamusercontentaakamaihdnetugc17107898504809433183EB1BCECC8730DF17E1F6D8BF1E433F79E22C285.png`
(same SHA-256, 709410 bytes). The migration index
`src/content/generated/card-art-migration.json` (SHA-256
`4A29FDDEFC6DA0D492C9D90ABFE9F9D5A12CB78D772774E6EB0FB061C33BBE45`) records
ascension and s3 as matched, but records s1, s2, s4, and s5 as
`matchMethod=unmatched`, with no source file and no target image. Thus these
assets do not provide a six-card pack bundle.

### Preserved legacy text snapshot

`E:\Codex\FD\binchen648_fd\archive\legacy-content-ref.json` (SHA-256
`BFF4C268CA3F292E3F32FD2A3B51C7520E3D8C475C703BDB854A43B48318BF2A`, 1879958
bytes) contains all six exact texts and the same development-image/legacy
source references. Its warning is explicit: `activation` is machine-inferred
and cannot be final rule adjudication. Every Zouken skill has
`implementation: "pending"`; the snapshot is evidence/lookup material, not a
bindable authoring card.

The corresponding old-repository copies are also only candidates:

- `Fate_Domination-重构版/docs/print-manifest.csv` — SHA-256
  `00835C8DAB9591423D0DC1738BA3F7049240333E46FA9BA92516BE4ED80B06A6`;
- `Fate_Domination-重构版/docs/print-manifest.json` — SHA-256
  `3DD864E990B296C976E283BF9A0181EA64CFD83BC14464A7B15BBC43BB9C680D`;
- `Fate_Domination-重构版/docs/partial-current.json` — SHA-256
  `C8D217B07D5633B5D84B1F3BBBC615B24EFF55F2789EEDD60BFB422E9418B0FE`;
- `Fate_Domination-重构版/docs/skill-migration-queue.json` — SHA-256
  `A82FA901287A1694256816F2B53D21C610B6D9EA856B2BA18A01B4AB1091CDB2`.

The print manifests carry all six printed texts. `partial-current.json` has
only ascension, s3, and s4 with partial host-adjudicated rules. The migration
queue labels all six `FULL`, but the entries retain their clauses in
`unparsedEffects`; this is a legacy classification/runtime result, not the
current canonical normalization contract. None is eligible for active-pack
binding without an accepted migration/evidence decision.

### Legacy structured/runtime candidates

Additional old-repository files were recorded for traceability, but are not
accepted canonical sources:

- `src/content/structured-batch-009.ts`, SHA-256
  `6C7D8B3E1398F0A457E1C3C4AE8C5D67C787E2AB8B8AE1C53BB8822D8252B414`:
  partial clauses for ascension, s3, and s4 under `core.structured-skill`;
- `src/content/confirmed-skill-overrides.ts`, SHA-256
  `6AF7050C0FC46008FC1DDBEF56699271257969A960EB910B35D75EF274DF83A8`:
  legacy `FULL` handler declarations for all six, including the old
  `core.zouken-*` contracts;
- `src/rules-core/zouken.ts`, SHA-256
  `91BBE14E243F5DEB2A344769DFEEEF39FBEB7CEAB114C4287500EF7191433661`:
  legacy specific handlers for s3, s4, and ascension;
- `test/skill-zouken-package.test.js`, SHA-256
  `740A97E5DE9FF79746C33051E61E3F9A2D76F67E28FF95ABBB2F0B7FD15AD72D`:
  legacy behavior tests only.

The original development runtime also has observable hooks in
`Fate_Domination-开发版/index.html` (SHA-256
`1ADEB8CA963D18BC53A6FE18EDD365EABD1125D554E25A393E036CEF9E28C3D1`),
including s3 power/reward storage, s4 blood-worm and round-end handling, and
the s5 situation-forbid exception. These are useful behavior observations but
are not the current target runtime contract and must not be copied as accepted
semantics.

### Audit conclusion after source discovery

The audit upgrades the evidence statement from “no local source text found” to
“complete local original text and partial card-art/legacy structured candidates
found.” It does **not** change the implementation decision:

- original text candidate coverage: 6/6 (`data_masters.js`, legacy snapshot);
- direct card-art coverage: 2/6 (ascension, s3), plus owner art displaying s1/s2/s5;
- accepted target authoring coverage: 1/6 (canonical s5 archive only);
- active-pack binding: 0/6;
- accepted target-runtime Zouken routes: 0.

The next legal step is to promote these candidates through an explicit source
evidence/authoring decision packet, with clause hashes and target-runtime
contracts. Until then, they remain auditable references and cannot clear the
frozen `SOURCE_EVIDENCE_REQUIRED` block.

