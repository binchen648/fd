# P3-R Goetia + Magical Ruby + Irisviel Source-Evidence Review R1

- Date: 2026-09-15
- Role: Codex R
- Exact S candidate: `e209afb87e64700eb6853f039d54844344750ab6`
- S PR: `#108`
- Exact A audit: `2fd93f49c35d9c68d2fb583993ba06689fed4a24`
- A PR: `#109`
- Locked Reference: `fengling20011118-dotcom/fate-domination@b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: fresh independent read-only acceptance review of the nine-ID Goetia/Magical Ruby/Irisviel F1 slice; no candidate/runtime repair
- Verdict: `F1_SOURCE_EVIDENCE_ACCEPTED`

## Independent verification

```text
npm ci                                      PASS
npm run typecheck                           PASS
fresh independent full-roster audit         EXACT_AGREEMENT / gapCount=0
Phase 3 reference/full-roster suite          6 files / 81 tests PASS
source replay                               9 / 9 PASS
bounded full CI                             84 files / 526 tests PASS
production runtime diff                     NONE
R candidate lane diff                       NONE before report
```

Recomputed state:

```text
sourceEvidenceOverlayCount=108
sourceEvidenceOverlayAbilityCount=232
sourceGroundedCount=180
semanticBlockedCount=764
contractMappedCount=180
explicitBlockCount=764
READY_EXISTING_CONTRACT=1
READY_GENERIC_EXTENSION=115
SPECIAL_HANDLER_CANDIDATE=64
SOURCE_EVIDENCE_REQUIRED=764
structuredAbilityCount=349
```

## Source and semantic review

All nine development-text snapshots replay exactly against `Fate_Domination-开发版/data_masters.js` and the locked Reference printed text (`bad=[]`).

R confirms the batch classification as:

- one existing accepted contract: `master.irisviel.skill.s2` / Conversion Magic -> `CARD_ZONE_CORE_DIRECT_ACTION`;
- five generic extensions: Goetia ascension, Magical Ruby s1a + ascension, Irisviel s1 + ascension;
- three reviewed-special identities: Goetia s1, Goetia s2, Magical Ruby s1.

For Conversion Magic, R separately verified `currentRoute=new`, exact owner/name bridge evidence, inherited `CARD_ZONE_CORE_DIRECT_ACTION`, and no populated Card-Zone contract invalidating axes (`trigger`, `cost`, `lifecycle`, `modifier`, `battle`). The promotion is therefore evidence-backed reuse of an already accepted contract, not a new runtime implementation.

Goetia special boundaries remain structural: shared Demon-God rules and Forneus action-ability retrigger are reviewed-special, while ordinary card-zone/play/close/movement/resource/trigger/lifecycle/selection/binding dependencies stay explicit. Magical Ruby's deck-entry replacement remains reviewed-special. No new Goetia, Magical Ruby, or Irisviel identity literal was added to generic normalization/mapping machinery.

## Full-CI timeout isolation

Two default-parallel reviewer CI attempts produced only 5-second timeout failures in pre-existing expensive tests; the specific failing files varied with parallel load. There were no assertion or semantic failures. R then:

1. reran every timeout-bearing file in isolation and all passed (`inventory 12/12`, `reference-lock 8/8`, `complex-skills 37/37`, `match-session 26/26`);
2. reran the exact 84-file CI test set with one worker, without changing code or test timeout values;
3. obtained `84 files / 526 tests PASS`.

S and A had also independently completed the default full CI at `84 files / 526 tests PASS`. R therefore classifies the parallel failures as machine-load timeouts rather than candidate regressions.

## Acceptance

```text
previous accepted checkpoint: 171 grounded / 773 source-evidence blocked
new accepted checkpoint:      180 grounded / 764 source-evidence blocked
delta:                         +9 grounded / -9 blocked
```

This is `180 / 944 = 19.07%` source-grounded readiness.

Acceptance does **not** promote F2/F3/F4, new runtime implementation, migration acceptance, or full-roster closure. The single existing-contract identity reuses an already accepted runtime contract; the five generic identities remain generic-extension work and the three special identities remain reviewed-special implementation work.
