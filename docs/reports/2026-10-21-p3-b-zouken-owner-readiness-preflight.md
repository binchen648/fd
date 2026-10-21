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

