# P3 F4 M50-02 50-skill macro-batch implementation checkpoint

> Repository task contract requires a non-tail batch to remain exact 50 by replacing truly blocked selected skills where possible. The former 47/3 blocker state is historical only. After three source-grounded replacements, the local selected probe is now **50 PASS / 0 FAIL**. This is an implementation checkpoint, not formal migration credit and not independent-R acceptance.

Task: `P3-F4-M50-02-50-SKILL-MACRO-MIGRATION-BATCH`
Branch: `codex/batch-p3-f4-m50-02-50-skill-macro`
Exact Base / current HEAD at intermediate checkpoint: `f688876fa11b86130e2b8999eaffb23cab79798a`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Mode: source-controlled exact-50 probe with fail-closed dependency replacement
Candidate / PR / independent R: this report is checked in with the Candidate payload; exact Candidate SHA, PR, and independent-R evidence are recorded externally after the commit exists.

## Scope

The frozen roster is source-controlled as `M50_02_SELECTED_IDS` in `scripts/phase3-reference/materialize-m50-02-batch.ts` and contains exactly 50 unique identities. Contract-guided replacement is allowed only after a selected identity is mechanically proven truly blocked and an eligible frozen replacement can be migrated from Locked-Reference evidence. The implementation does not guess missing card semantics, create empty dependency shells, add runtime Chinese-text parsing, or route production behavior by consumer/card identity.

The historical pre-replacement implementation checkpoint reached **47 PASS / 3 FAIL**. Contract-guided replacements have since advanced the exact-50 selected probe to **50 PASS / 0 FAIL**.

## Historical dependency blockers and replacements

### 1. `master.akasha.skill.s1` -> `master.akasha.skill.s6`

Locked authoring source for `fate-overload-seeding` creates the original linked skill `master.akasha.skill.s6` and copies that same linked definition to battlefield board locations. Therefore S1 requires an executable definition for S6; implementing only S1's creation/copy mechanics would produce nonfunctional Overload cards.

F1 inventory for `master.akasha.skill.s6` is explicitly:

- `semanticNormalization.status = BLOCKED`
- `semanticNormalization.blocks = [SEMANTIC_SOURCE_REQUIRED]`
- `phase3.classificationRoute = SOURCE_EVIDENCE_REQUIRED`
- `phase3.mappingStatus = EXPLICIT_BLOCK`
- no source-grounded authoring card

The materializer now fails directly and generically at the dependency edge:

`master.akasha.skill.s1 abilities.fate-overload-seeding.creates[0].linkedSkillId depends on source-blocked definition master.akasha.skill.s6`

This blocked selection has been replaced in the exact-50 roster by `servant.mash.skill.sc-mash-4` after independent source-grounded implementation of its catalogue-marker semantics.

### 2. `master.arcueid.skill.s1` -> `master.arcueid.skill.s2`

Locked authoring source for True Ancestor requires `master.arcueid.skill.s2` in both game-start materialization and post-Moon-Princess recovery. It also resets S2 usage before returning/creating that definition. Thus completing S1 while S2 has no executable semantics would create an unusable skill shell.

F1 inventory for `master.arcueid.skill.s2` is explicitly:

- `semanticNormalization.status = BLOCKED`
- `semanticNormalization.blocks = [SEMANTIC_SOURCE_REQUIRED]`
- `phase3.classificationRoute = SOURCE_EVIDENCE_REQUIRED`
- `phase3.mappingStatus = EXPLICIT_BLOCK`
- no source-grounded authoring card

The materializer now fails directly and generically at the dependency edge:

`master.arcueid.skill.s1 abilities.true-ancestor-game-start-materialization.effects[0].linkedSkillId depends on source-blocked definition master.arcueid.skill.s2`

This blocked selection has been replaced in the exact-50 roster by `servant.sherlock.skill.sc-sherlock-4`. Locked Reference defines that identity as an initially outside-game Retroduction secret-record definition with exact `deduction-record` / `deduction-attribute:力量` metadata; the migration preserves that typed marker only and does not duplicate or invent `sc-sherlock-3` consumer behavior.

### 3. `master.tiamat.skill.ascension` -> unresolved follow-up definition (replaced)

The safe Titan-form rule subset is implemented and behavior-tested: workshop deployment/movement forbids, authored card-play-prevention ignore, and basic-attack cost/power adjustments.

The remaining two-face-down-card follow-up cannot be completed from the locked evidence because the Locked Reference is internally inconsistent:

- the ascension printed clause says the follow-up adds **【生命之海】** to the attack;
- `src/rules-core/tiamat-skill.ts` defines `TIAMAT_LIFE_SEA_ID = master.tiamat.card.life-sea` and provides runtime behavior for that card;
- the confirmed override metadata instead declares `faceDownAttackFollowup.definitionId = servant.shakespeare.skill.sc-shakespeare-3`;
- `master.tiamat.card.life-sea` is a dynamic inventory identity with no authoring card, no confirmed override, and both `SEMANTIC_SOURCE_REQUIRED` / `SOURCE_EVIDENCE_REQUIRED` blocks;
- `servant.shakespeare.skill.sc-shakespeare-3` is a different printed skill and is itself `SEMANTIC_SOURCE_REQUIRED` / `SOURCE_EVIDENCE_REQUIRED` in the inventory.

The implementation does not choose between these conflicting identities. The materializer remains fail-closed:

`master.tiamat.skill.ascension faceDownAttackFollowup depends on source-blocked definition servant.shakespeare.skill.sc-shakespeare-3`

This blocked selection has been replaced in the exact-50 roster by `servant.sherlock.skill.sc-sherlock-5`. Locked Reference defines that identity as the initially outside-game Retroduction agility record with exact `deduction-record` / `deduction-attribute:迅捷` metadata and `SHERLOCK_RECORD_AGILITY_ID`; the migration reuses the same identity-free typed-record envelope and does not invent `sc-sherlock-3` consumer behavior.

## Generic dependency guard

M50-02 materialization now validates dependency-bearing structured authoring before normalization erases/re-writes source fields. For linked definitions referenced by `creates`, `copies.source`, or `return_card_by_definition`, and for `faceDownAttackFollowup`, the dependency must be mechanically confirmed as:

- `semanticNormalization.status = SOURCE_GROUNDED`;
- `phase3.classificationRoute = READY_GENERIC_EXTENSION`;
- present in the locked Reference authoring skill-card registry.

The check is structural and identity-independent. Once a dependency receives valid source-grounded authoring evidence, the guard can clear mechanically without adding an exception for Akasha, Arcueid, or Tiamat.

## Verification history and current replacement checkpoint

The historical pre-replacement checkpoint was **47 PASS / 3 FAIL** in `.fd-m50-02-batch-closure-final.json`. That result remains useful blocker evidence but is not a valid non-tail batch closure.

After mechanically replacing blocked `master.akasha.skill.s1` with `servant.mash.skill.sc-mash-4`:

- selected roster remained **exactly 50 unique identities**;
- selected probe advanced to **48 PASS / 2 FAIL**;
- probe artifact: `.fd-m50-02-selected-probe-owner-mash-final.json`;
- Mash source identity is a Locked-Reference catalogue marker only; executable Guard behavior remains on the two physical Guard cards rather than being duplicated into this identity;
- owner-matching outside-game `servant_skill` support is covered through loader + executable-pack regression while mismatched ownership and unsupported card types remain fail-closed;
- historical focused behavior regression before replacement: **3 files / 15 tests PASS**;
- Mash placement/executable-pack affected regression: **2 files / 98 tests PASS**;
- the immediately preceding Kagekiyo affected regression checkpoint remains **10 files / 160 tests PASS**.

After mechanically replacing blocked `master.arcueid.skill.s1` with `servant.sherlock.skill.sc-sherlock-4`:

- selected roster still contains **exactly 50 unique identities**;
- fresh selected probe advances to **49 PASS / 1 FAIL**;
- current probe artifact: `.fd-m50-02-owner-sherlock-record-checkpoint.json`;
- the Locked-Reference `deduction-record` / `deduction-attribute:*` family is implemented as an identity-free exact marker envelope for outside-game typed record definitions;
- the marker family accepts only `力量`, `迅捷`, `魔术`, or `特殊`, rejects widened/unsupported marker shapes, and carries no invented Retroduction consumer effects;
- Sherlock focused + outside-game regression checkpoint: **2 files / 18 tests PASS**;
- Sherlock affected regression (`deduction-record`, outside-game placement, executable pack, authoring interpreter): **4 files / 143 tests PASS**;
- root `npm run typecheck`: **PASS**;
- `git diff --check`: **PASS** (only existing CRLF conversion warnings; exit code 0).

After mechanically replacing blocked `master.tiamat.skill.ascension` with `servant.sherlock.skill.sc-sherlock-5`:

- selected roster remains **exactly 50 unique identities**;
- fresh final selected probe reaches **50 PASS / 0 FAIL**;
- final probe artifact: `.fd-m50-02-owner-sherlock-agility-final.json`;
- the actual Locked-Reference S5 agility record is explicitly behavior-checked as `outside_game` and resolves to semantic attribute `迅捷` through the generic record classifier;
- focused + outside-game regression: **2 files / 19 tests PASS**;
- affected regression (`deduction-record`, outside-game placement, executable pack, authoring interpreter): **4 files / 144 tests PASS**;
- root `npm run typecheck`: **PASS**;
- `git diff --check`: **PASS** (existing CRLF conversion warnings only; exit code 0);
- branch / HEAD / merge-base remain the exact batch Base `f688876fa11b86130e2b8999eaffb23cab79798a`.

## Final pre-Candidate verification

The source-controlled materializer was run with `--write-authoring` after the roster reached exact 50/50. It wrote **42 owner archives** containing the **50 selected frozen identities** under `data/authoring/{masters,servants}/*.p3-m50-02.json`.

Mechanical frozen-material comparison against exact Base `f688876fa11b86130e2b8999eaffb23cab79798a`:

- frozen denominator: **944**;
- Base material overlap: **215/944**;
- Candidate worktree material overlap: **265/944**;
- exact frozen additions: **50**;
- frozen removals: **0**;
- duplicate frozen material identities: **0**.

Candidate-representative verification after materialization and compatibility cleanup:

- M50-02 focused suite: **46 files / 196 tests PASS**;
- full `test:ci` with local `.fd-*` scratch tests excluded: **241 files / 1694 tests PASS**;
- targeted compatibility regression after full-CI findings: **6 files / 53 tests PASS**;
- response-window compatibility regression: **5 files / 27 tests PASS**;
- root `npm run typecheck`: **PASS**;
- `npm run content:validate`: **PASS** (`7 masters, 7 servants, 20 events, 0 blocking issues`);
- `npm run verify:generated-content`: **PASS**;
- fresh source-controlled selected probe: **50 PASS / 0 FAIL**;
- `git diff --check`: **PASS**.

The final compatibility cleanup restores pre-existing Chinese attribute literals that had been accidentally mojibaked, keeps historical material-count tests scoped to their intended pre-/M50-01 snapshots, narrows the opponent-close candidate detector so unrelated close-card semantics are not captured, and normalizes stale source-card response failures to `illegal_response` only for the exact structural source-card-with-cost response family. Malformed unrelated response semantic families continue to fail with their original `resolution_failed` contract.

## Credit / Candidate status

Exact-50 implementation success is not formal migration credit. This report is intended to be checked in with the single M50-02 Candidate; the exact Candidate SHA is recorded externally in the PR/reviewer handoff rather than self-embedded in the commit that defines that SHA.

Formal accepted migration therefore remains **219/944**. The **50/50 Candidate must not be added to formal credit** until one fresh independent exact-Candidate review accepts the whole batch and A performs the required synchronization.

The batch must remain one Base, one Candidate, one PR, and one fresh independent R. Do not split it into per-skill reviews, merge it early, retarget it, or count the local/material overlap as accepted migration credit.
