# P3 Source Evidence S — Meltryllis / Melusine / Mephisto / Merlin / MHX / Morgan R1

Role: S (source evidence / semantic normalization)

Base accepted reviewer: `137fc1cbd4289525884d3cf1139a37fc75989356`
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

Scope: 15 SOURCE_EVIDENCE_REQUIRED identities:
- Meltryllis: 3
- Melusine: 3
- Mephisto: 1
- Merlin: 2
- MHX: 3
- Morgan: 3

Source grounding:
- Exact development-text printed/source binding with SHA-256 provenance.
- Shared-family reuse: Alter Ego reverse effect, Dragon Heart, Caster territory construction, Ruler command-spell binding.
- Melusine replacement follows the user ruling: first defeat reveals; second defeat replaces with Albion and true-name reveals; pre-replacement hand/discard/attack-zone cards leave the game; all original Melusine servant cards leave the game; non-original servant cards previously added to the deck remain; Albion deck/skills replace the servant package.

Candidate result:
- totalIdentityCount: 944
- sourceGroundedCount / contractMappedCount: 813
- blocked / explicitBlockCount: 131
- READY_EXISTING_CONTRACT: 2
- READY_GENERIC_EXTENSION: 244
- SPECIAL_HANDLER_CANDIDATE: 567
- SOURCE_EVIDENCE_REQUIRED: 131
- Batch classification delta: 15 reviewed-special
- zeroSilentFallback: true
- audit: EXACT_AGREEMENT
- gapCount: 0

Validation:
- typecheck: PASS
- focused Phase 3: 160/160 PASS
- full CI (`--maxWorkers=2`): 605/605 PASS
- `git diff --check`: PASS
- production runtime diff vs base under `packages src`: none

Runtime migration remains out of scope for F1.