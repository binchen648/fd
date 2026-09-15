# P3 F1 Source Evidence — Himiko / Ibaraki / Iskandar / Ivan / Izou / Jack R1

- Role: S source-evidence / semantic-normalization candidate
- Base accepted R: `008fe2137c7e44b6615acf0ee227e58e7af36b39`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: 16 identities (Himiko 3, Ibaraki 2, Iskandar 2, Ivan 3, Izou 3, Jack 3)
- Source replay: 16/16 exact printed-text bindings from locked development snapshots

## Classification

- READY_GENERIC_EXTENSION: 2
- SPECIAL_HANDLER_CANDIDATE: 14
- Iskandar Riding and Ivan Riding reuse the reviewed Rider generic family.
- Izou Presence Concealment reuses the reviewed assassination rule family.
- Iskandar Ionioi Hetairoi reuses the reviewed temporary-attack creation family.
- Remaining complex choice/state/memory rules fail closed as reviewed-special candidates.

## Recomputed state

- sourceGroundedCount: 721/944
- semanticBlockedCount: 223
- READY_EXISTING_CONTRACT: 2
- READY_GENERIC_EXTENSION: 238
- SPECIAL_HANDLER_CANDIDATE: 481
- SOURCE_EVIDENCE_REQUIRED: 223
- structuredAbilityCount: 999
- sourceEvidenceOverlayCount: 649
- sourceEvidenceOverlayAbilityCount: 882
- zeroSilentFallback: true
- automation audit: `EXACT_AGREEMENT`
- gapCount: 0

## Verification

- typecheck: PASS
- focused Phase 3 suite: 6 files / 148 tests PASS
- full CI (`--maxWorkers=2`): 84 files / 593 tests PASS
- `git diff --check`: PASS
- production runtime diff from base accepted R: none

No runtime migration was performed in S.
