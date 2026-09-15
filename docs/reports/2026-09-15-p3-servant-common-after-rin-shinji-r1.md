# Phase 3 Full-Roster Source Evidence — Servant Common Slice after Rin/Shinji R1

- Date: 2026-09-15
- Role: Codex S
- Exact accepted base: `8aab3db51b11ffda1eddd53b5b96b2e89d66d72a`
- Branch: `codex/s-p3-servant-common-after-rin-shinji-r1`
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: ten source-evidence identities only; no runtime implementation or migration acceptance

## Source-evidence slice

The batch contains:

```text
servant.gil.skill.sc-gil-1
servant.gilles.skill.sc-gilles-2
servant.hassan.skill.sc-hassan-1
servant.iskandar.skill.sc-iskandar-1
servant.medea.skill.sc-medea-2
servant.medusa.skill.sc-medusa-1
servant.cu.skill.sc-cu-2
servant.diarmuid.skill.sc-diarmuid-3
servant.emiya.skill.sc-emiya-1
servant.angra.skill.sc-angra-3
```

All ten identities are bound to the hash-locked development source `Fate_Domination-开发版/data_servants.js`.

```text
source file SHA-256=6da31ebdf36561c550dfe9725963a71496705050e90a8b5a87464f501ee43ae3
records=10
whole-file SHA mismatch=0
locator/sourceText mismatch=0
sourceText SHA mismatch=0
Reference printedText mismatch=0
Reference printedText SHA mismatch=0
```

## Structured semantics

The slice intentionally exposes ordinary capability dependencies rather than hiding them behind legacy handlers:

- Independent Action: first-half action-order play requirement, Action VP gain, and unpreventable loss penalty after controller combat defeat.
- Territory Creation: printed X formula plus residual Magic Workshop deployment reward.
- Presence Concealment: post-power combat conditions with Defeat retained as reviewed-special.
- Riding: same-play-batch basic-attack draw plus an Action interaction that chooses and plays up to three low-base-power hand cards.
- Battle Continuation: Action selection of any destination except Magic Workshop, followed by direct movement.
- EMIYA quick suppression: Combat modifier sets opponents' Quick attribute power to zero at the controller's battlefield.
- Angra Mainyu: below-eight-mana play permission plus opponent-present draw / alone-at-battlefield mana branches.

No canonical identity branch was added to generic normalization or capability mapping.

## Generated result

```text
totalIdentityCount=944
sourceEvidenceOverlayCount=105
sourceEvidenceOverlayAbilityCount=215
sourceGroundedCount=177
semanticBlockedCount=767
structuredAbilityCount=332
contractMappedCount=177
explicitBlockCount=767
READY_EXISTING_CONTRACT=0
READY_GENERIC_EXTENSION=118
SPECIAL_HANDLER_CANDIDATE=59
SOURCE_EVIDENCE_REQUIRED=767
zeroSilentFallback=true
capabilityCount=32
runtimeRequestCount=23
runtimeRequestAffectedIdentityCount=177
```

Batch classification:

```text
READY_GENERIC_EXTENSION=9
SPECIAL_HANDLER_CANDIDATE=1
inheritedAcceptanceContracts=0 / 10
```

`servant.hassan.skill.sc-hassan-1` remains reviewed-special because its source-grounded effect is `defeat_player`. The other nine identities are generic-extension candidates only; none inherits runtime acceptance.

## No-drift / lane isolation

Independent comparison against accepted base `8aab3db...` found the other 934 identities byte-for-byte unchanged in `full-roster-ability-inventory.json`.

```text
non-batch identity drift=0
identity literals in normalize/map=0
production diff under packages/, apps/, src/=NONE
```

The older uncommitted reference worktree `fd-servant-common-source-s-r1` was used only as a draft source for these records and was not reset, modified, or discarded.

## Verification

```text
npm ci                                                        PASS
npm run typecheck                                             PASS
S-owned Reference/inventory/semantic/capability/decision      5 files / 76 tests PASS
fresh independent full-roster automation audit                EXACT_AGREEMENT / gapCount=0
independent development-source replay                          10 / 10 PASS
non-batch generated identity drift                             0 / 934
full npm run test:ci                                           84 files / 530 tests PASS
git diff --check                                               PASS before freeze
```

## Result

This slice is ready for independent A recomputation and fresh R review as the next incremental F1 source-evidence checkpoint.

Candidate delta from the accepted Rin/Shinji checkpoint:

```text
167 grounded / 777 blocked
→
177 grounded / 767 blocked

delta = +10 grounded / -10 blocked
candidate source-grounded readiness = 177 / 944 = 18.75%
```

This does **not** promote F2, F3, F4, `READY_EXISTING_CONTRACT`, runtime implementation, migration acceptance, or full-roster closure. Formal accepted progress remains at the prior checkpoint until independent A and R complete.
