# P3-R45 Recovery Review Record — FB2-17-R3 Shirou Derived Support Definition

Date: 2026-09-18
Role: Codex A recording returned fresh independent R evidence
Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
Blocking findings: none
Credit: zero frozen-migration credit

## Exact review target

- Implementation Base: `1ef5262abb7d6c55edef8d98e2bc127b631f5d0b`.
- S Candidate: `1c3149ba5f33ad3092a57da4a12d7bbe96f43823`.
- A material synchronization: `7fc8df7210f2d64b21820171faeaa3d4dcac33cc`.
- Fresh reviewer worktree: `E:\Codex\FD\fd-fb2-17-r3-review-r45-fresh-0745`.
- PR: `#354` (stacked; no main-base Actions expected).

## Independent reviewer result

Fresh R45 found no blocking finding. The reviewer independently verified exact direct-parent lineage Base -> Candidate -> A sync; integrated main `553779e8ffcc926ae4763ee86a2ea937e090c128` belongs to the recovery ancestry; A sync is documentation-only; and Base -> Candidate contains exactly the five authorized files.

The reviewer independently re-grounded F1 provisioning authority and locked-Reference static metadata for `card.derived.master.shirou-emiya.ganjiang-moye`, including the F1 clause SHA-256 `a0ea1f45cedb3ac69c9d4050cfdadcf318cf32f62b749013a8454245535ca575`. Reference is used only for stable identity/static metadata/source locator, not implementation routing.

The support archive is exact `master_support_definition_archive`, contains exactly one non-frozen derived card, has no public-information/deck/playable-master surface, and is registered only through `authoringMasterSupportFiles`. Product checks retain seven playable masters, seven servants, fourteen executable characters, no Shirou character/fallback/command-spell/deck/setup surface, and register the target outside game with no `initialZone`.

The derived card preserves the exact 8-mana gate and accepted FB2-16 required-additional marker, compiling as `attack` / `attack_area`. The only package test change is the aggregate executable-card expectation `70 -> 71`; no structural assertion is weakened.

Deterministic hashes independently reproduced by R45:

- content library `c9841d4bad3d43a525895372fabd3b49ea07e79075652a5cbd18fad3405e2e1e`;
- fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
- evidence report `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.

All eleven remaining frozen FM09 target identities stay absent. The newly accepted dependency is outside the frozen 944 denominator, so frozen accepted overlap remains `111/944`.

## Fresh reviewer validation

- `npm ci --offline`: PASS, 239 packages, 0 vulnerabilities.
- typecheck: PASS.
- focused loader/compiler + FB2-15/16/18: `94/94` PASS.
- content validation: `7 masters / 7 servants / 20 events / 0 blockers`.
- official content compilation and generated determinism: PASS.
- full `test:ci`: `835/835` PASS across 129 files.
- rules core + regression: `420/420` PASS across 69 files.
- client production build: PASS.
- locked Reference verification: PASS.
- coverage: `99 archives / 134 cards / 233 abilities`, compiled `71/14/0`, buckets `22/3/128/0/80/126`.
- automation audit: `128/3/80/20`.
- `git diff --check`: PASS.

Reviewer and Candidate worktrees were both clean at the required exact SHAs. The review process did not modify Candidate and did not continue into A acceptance synchronization or downstream FM09 dependencies.