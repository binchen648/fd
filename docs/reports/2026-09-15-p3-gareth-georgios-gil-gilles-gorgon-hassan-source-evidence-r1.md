# P3 F1 Source Evidence — Gareth / Georgios / Gil / Gilles / Gorgon / Hassan R1

- Role: S source-evidence / semantic-normalization candidate
- Base accepted R: `ef6df8546790501e41a7de857379c879a41c1006`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Scope: 16 identities (Gareth 3, Georgios 3, Gil 3, Gilles 3, Gorgon 1, Hassan 3)
- Source replay: 16/16 exact printed-text bindings

## Classification

- SPECIAL_HANDLER_CANDIDATE: 16
- Hassan Presence Concealment reuses the reviewed `presence_concealment_assassination_rule` family.
- Gil Gate of Babylon is bound to the user-approved semantics: choose X on play as mana cost, gain X chosen non-special attributes, and double terrain during the action phase.
- Remaining multi-stage/stateful effects remain reviewed-special rather than being falsely split into generic coverage.

## Recomputed state

- sourceGroundedCount: 689/944
- semanticBlockedCount: 255
- READY_EXISTING_CONTRACT: 2
- READY_GENERIC_EXTENSION: 235
- SPECIAL_HANDLER_CANDIDATE: 452
- SOURCE_EVIDENCE_REQUIRED: 255
- zeroSilentFallback: true
- automation audit: `EXACT_AGREEMENT`
- gapCount: 0

## Verification

- typecheck: PASS
- focused Phase 3 suite: 6 files / 144 tests PASS
- full CI (`--maxWorkers=2`): 84 files / 589 tests PASS
- `git diff --check`: PASS
- production runtime diff: none

No runtime migration was performed in S.
