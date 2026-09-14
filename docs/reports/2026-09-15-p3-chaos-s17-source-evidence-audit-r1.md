# P3-A Chaos Scrambled Seals Source-Evidence Audit R1

- Date: 2026-09-15
- Role: Codex A
- Exact S input: `ae38c399a415d76bbdce877badfdb59b121d10e4`
- S PR: `#87`
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: independent automation/evidence recomputation only; no S semantic repair, runtime implementation, or Gate promotion
- Result: `EXACT_AGREEMENT`

## Independent recomputation

```text
status=EXACT_AGREEMENT
gapCount=0
staticSkillCount=943
dynamicSkillCount=1
totalIdentityCount=944
programCount=943
authoringCardCount=72
authoringAbilityCount=117
sourceEvidenceOverlayCount=85
sourceEvidenceOverlayAbilityCount=177
clauseCount=1789
sourceRefCount=1887
sourceGroundedCount=157
semanticBlockedCount=787
contractMappedCount=157
explicitBlockCount=787
capabilityCount=32
blockedPacketCoverageCount=787
runtimeRequestCount=23
```

Classification:

```text
READY_EXISTING_CONTRACT=0
READY_GENERIC_EXTENSION=100
SPECIAL_HANDLER_CANDIDATE=57
SOURCE_EVIDENCE_REQUIRED=787
```

## Independent source replay

A independently reread `master.chaos.skill.s17` from the hash-locked development source and compared it with both the source-evidence overlay and locked Reference printed text.

```text
records=1
locator=m_chaos.skills[s17]#line=96
source file SHA=c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825
sourceText mismatch=0
sourceText SHA mismatch=0
Reference printedText mismatch=0
Reference printedText SHA mismatch=0
```

A independently verified the semantic invariants that matter for this card:

- exactly one once-per-game four-option Action envelope;
- the The 666 reuse option remains a reviewed-special `ability_reuse_rule`;
- the mana option gains 2 mana and does not carry an extra `draw_cards` effect, preventing a duplicate Beast draw;
- the win reward is scoped to `this_round` and depends on winning combat;
- the movement option is one adjacent move;
- classification is `SPECIAL_HANDLER_CANDIDATE` with zero inherited acceptance contracts.

## Lane isolation

Relative to exact S candidate `ae38c399a415d76bbdce877badfdb59b121d10e4`, A changes only A-owned audit/report/test files. There is no A diff under `packages/`, `apps/`, `src/`, `data/phase3/`, or S-owned semantic/capability code.

## Verification

```text
npm ci                                      PASS
npm run typecheck                           PASS
fresh independent full-roster audit         EXACT_AGREEMENT / gapCount=0
A audit/decision/semantic/capability suite  4 files / 60 tests PASS
independent development-source replay       1 / 1 PASS
full npm run test:ci                        84 files / 525 tests PASS
git diff --check                            PASS before freeze
production / S-semantic lane diff           NONE
```

The initial A-suite failure was the expected stale A-owned snapshot (`82/171/154/790`) after fresh recomputation produced `85/177/157/787`. Updating those four audit expectations restored the suite to green without changing S semantics.

## Non-promotion

This audit certifies arithmetic/provenance agreement only. It does not promote F2, F3, F4, `READY_EXISTING_CONTRACT`, runtime implementation, migration acceptance, or full-roster closure. Fresh independent R review is required before `157 grounded / 787 source-evidence blocked` becomes accepted.
