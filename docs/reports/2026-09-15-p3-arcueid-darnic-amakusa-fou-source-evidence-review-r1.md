# P3-R Arcueid + Darnic + Amakusa + Fou Source-Evidence Review R1

- Date: 2026-09-15
- Role: Codex R
- Exact S candidate: `2094dadb6a68487e7298c3a5cee6f31882ff0580`
- S PR: `#102`
- Exact A audit: `21ed627dac07e4524bc34819f5b060a38f3385ea`
- A PR: `#103`
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: independent read-only acceptance review of the eight-ID Arcueid/Darnic/Amakusa/Fou source-evidence slice; no candidate or runtime repair
- Verdict: `F1_SOURCE_EVIDENCE_ACCEPTED`

## Independent mechanical verification

Fresh reviewer worktree verification produced:

```text
npm ci                                      PASS
npm run typecheck                           PASS
Phase 3 full-roster/reference suite         6 files / 77 tests PASS
full reviewer CI (`npm run test:ci`)         84 files / 522 tests PASS
fresh independent full-roster audit         EXACT_AGREEMENT / gapCount=0
sourceEvidenceOverlayCount                  90
sourceEvidenceOverlayAbilityCount           189
sourceGroundedCount                         162
semanticBlockedCount                        782
contractMappedCount                         162
explicitBlockCount                          782
READY_EXISTING_CONTRACT                     0
READY_GENERIC_EXTENSION                     103
SPECIAL_HANDLER_CANDIDATE                   59
SOURCE_EVIDENCE_REQUIRED                    782
```

## Independent source/provenance review

R independently replayed all eight development-text snapshots against `Fate_Domination-开发版/data_masters.js` and the locked Reference inventory:

```text
records=8
source file SHA=c596af5730846ef9092375f18c4200b84f032028dc2e8f5483377d8ddcc22825
whole-file SHA mismatch=0
locator/sourceText mismatch=0
sourceText SHA mismatch=0
Reference printedText mismatch=0
Reference printedText SHA mismatch=0
bad=[]
```

All eight identities retain zero inherited runtime acceptance contracts.

## Independent semantic findings

No blocking semantic mismatch was found.

The batch resolves to three `READY_GENERIC_EXTENSION` identities (`master.arcueid.skill.ascension`, `master.amakusa.skill.ascension`, `master.fou.skill.s1`) and five `SPECIAL_HANDLER_CANDIDATE` identities (`master.arcueid.skill.s2`, both Darnic identities, `master.amakusa.skill.s3`, and `master.fou.skill.ascension`).

R confirmed that the special boundaries are structural rather than identity-based:

- Arcueid materialization keeps delayed combat scheduling and the one-repeat replacement window reviewed-special while exposing close, card-zone, add-to-attack, selection, binding, and lifecycle dependencies.
- Darnic keeps terrain ownership/mutation reviewed-special while exposing trigger, VP cost, branch choice, movement, lifecycle, and modifier dependencies.
- Amakusa's Vassal keeps linked-player mana contribution and cross-battle reward reviewed-special while exposing movement, Command Seal cost, battle, resource, lifecycle, and trigger dependencies.
- Fou's Force of Providence keeps elimination prevention, VP swapping, and shared victory reviewed-special while exposing lifecycle, resource, result-binding, condition, and trigger dependencies.

The three generic identities carry no special blocker and are not falsely promoted to an existing acceptance contract.

## Generic machinery and lane audit

R found no Arcueid, Darnic, Amakusa, or Fou identity literal in the generic semantic normalizer or capability mapper. The added classifications are structural effect-family mappings only.

There is no candidate production-runtime diff under `packages/`, `apps/`, or `src/` relative to the prior accepted reviewer checkpoint. R made no production or candidate-semantic fix.

## Acceptance

The incremental F1 source-evidence checkpoint is accepted:

```text
previous accepted checkpoint: 154 grounded / 790 source-evidence blocked
new accepted checkpoint:      162 grounded / 782 source-evidence blocked
delta:                         +8 grounded / -8 blocked
```

This is `162 / 944 = 17.16%` source-grounded readiness for the full roster.

Acceptance does **not** promote F2, F3, F4, any `READY_EXISTING_CONTRACT`, runtime implementation, migration acceptance, or full-roster closure. The five special identities remain reviewed-special implementation work, the three generic identities remain generic-extension work, and the 782 remaining identities remain explicitly source-evidence blocked.
