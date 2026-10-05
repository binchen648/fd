# P3-B Caules Yggdmillennia Owner Readiness Complete Gap Set Result

Date: 2026-10-05
Task: `P3-B-CAULES-YGGDMILLENNIA-OWNER-READINESS-CAPABILITY`
Classification: parent zero-credit owner-readiness preflight
Exact Base: `7949b477c3518e9a20214f1408f579b462519158`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Frozen owner scope

The next owner after accepted Caren accounting is `master.caules-yggdmillennia`, with exactly five frozen identities:

- `master.caules-yggdmillennia.skill.ascension`
- `master.caules-yggdmillennia.skill.s1`
- `master.caules-yggdmillennia.skill.s1a`
- `master.caules-yggdmillennia.skill.s2`
- `master.caules-yggdmillennia.skill.s3`

Canonical authoring is absent at Base (`0/5`). This readiness transaction changes no `data/authoring/**`, grants zero migration credit, and keeps strict accounting at `211/944`, remaining `733`.

Frozen/source evidence is mechanically grounded by Phase-3 source evidence PR #126 exact head `9d59040a5a7fa9ba356dfc12c1ef8950fce05e78`, its report `docs/reports/2026-09-15-p3-reines-caules-shishigou-source-evidence-r1.md`, the F1 inventory/rule evidence, and locked Reference corroboration in `src/rules-core/caules-yggdmillennia.ts` plus `test/skill-caules-yggdmillennia-package.test.js`.

## Complete owner-local readiness gap set

One identity-free capability closes the complete current owner-local gap set without embedding Caules identity or printed-text routing in production runtime:

- definition-bound master-skill activation/deactivation, including game-start/round-end deactivation and battlefield-deployment activation;
- workshop deployment choice with dynamic legal candidates: gain `+1` mana, or pay exactly `2` mana to bind the existing authoritative current-round battle-loss-ignore state;
- active-only required-additional play with a controller declaration from exactly `力量 / 迅捷 / 魔术 / 特殊 / 宝具`;
- game-long per-definition declaration history, with pre-ascension one-use-per-attribute enforcement;
- same-battlefield matching opponent **basic attack** Power set-to-zero authority, excluding non-basic and remote cards;
- ascension rewrite allowing repeated declarations while keeping the declaration owner-only until the combat window, followed by authoritative reveal;
- exact next-round deck rebuild scheduling and settlement for the frozen 12-card deck definition while preserving the skill zone;
- MatchSession/deferred restore validation for declaration history, per-card declaration state, and scheduled deck-rebuild provenance;
- exact whole-ability fail-closed loader/interpreter gateway for every privileged shape.

The deck rebuild definition is exactly:

- `card.cardb3` x2
- `card.cardb4` x3
- `card.carda3` x2
- `card.carda4` x3
- `card.cardluck` x1
- `card.cardsurveil` x1

## Verification

Focused Caules Yggdmillennia readiness regression: `11/11 PASS`.

Task-relevant affected aggregate: `192/192 PASS` across 13 files, covering required-additional play, deployment resource routing, Caren shared definition/resource capability, MatchSession restore and projection, executable authoring, ascension unlock, resource numeric paths, and existing Suzuka battle-loss-ignore consumers.

Repository gates:

- `npm run typecheck`: PASS.
- `npm run content:validate`: PASS — `14 masters / 19 servants / 20 events / 0 blocking issues`.
- `npm run verify:generated-content`: PASS with unchanged generated hashes.
- Phase-3 coverage command: PASS — `archives=120`, `cards=239`, `abilities=424`, `compiledCards=163`, `compiledCharacters=33`, `blockingIssues=0`, `newRuntimeSemanticRouted=22`.
- Phase-3 automation audit command completed — `legacyResolveEffect=157`, `legacyExecuteAbility=3`, `notClassifiable=242`, `promotionFindings=20`.
- Coverage/audit tracked artifacts were verification side effects unrelated to this bounded readiness task and were restored byte-for-byte from Exact Base/HEAD after recording the command results; they are not Candidate changes.
- production Caules identity / Chinese printed-text routing audit across `packages/rules/src/**`: CLEAN.
- `data/authoring/**` delta: EMPTY.
- `git diff --check`: PASS.

A supplemental direct `core/combat-resolver.test.ts` probe exposed its existing no-AbilityRuntime fixture (`Ability runtime is not initialized`) while the other 9 tests in that file passed. This task does not modify that fixture or `core/combat-resolver.ts`; the green 192-test affected aggregate above exercises the accepted battle-loss-ignore consumers through initialized production runtime paths and keeps unrelated convergence debt out of this readiness Candidate.

## Fresh Reviewer P1 revision closure

Exact Candidate `e8f2362c4df24222655c3719723a434b63da4672` returned `IMPLEMENTATION_NEEDS_REVISION`. The completed attempt's 403 evidence was relayed without re-review and is canonically anchored at `https://github.com/binchen648/fd/pull/526#issuecomment-5991657853`.

The successor revision closes both reproduced deck-rebuild blockers together:

- replacement deck order now goes through the shared authoritative xorshift32/Fisher-Yates ability-runtime RNG seam, so same runtime seed yields the same shuffled order while different seeds can yield different orders;
- exact rebuild removal scope is restricted to owned `hand + deck + discard`, preserving `field`, `attack_area`, and `skill` physical cards exactly as the locked Reference boundary requires;
- focused regression now validates exact 12-card multiset/counts, same-seed deterministic shuffle, different-seed order variation, old hand/deck/discard removal, and field/attack-area/skill preservation instead of asserting source-array deck order.

Revision verification: focused `11/11 PASS`, affected `192/192 PASS`, typecheck PASS, content validation PASS, generated-content determinism PASS, `data/authoring/**` delta EMPTY, and `git diff --check` PASS.

## Gate

No migration credit is counted here. Fresh independent review of the exact readiness Candidate is required. On `IMPLEMENTATION_ACCEPTED_CANDIDATE`, FORMAL must perform a zero-credit acceptance sync/rescan of all five frozen identities. Only then may the single owner-complete consumer migration materialize all remaining Caules Yggdmillennia identities in one formal Candidate / one PR / one fresh R.
