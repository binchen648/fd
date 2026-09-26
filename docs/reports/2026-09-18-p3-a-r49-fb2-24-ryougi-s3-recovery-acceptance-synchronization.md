# P3-A R49 / FB2-24 Ryougi S3 Recovery Acceptance Synchronization

Date: 2026-09-18
Role: Codex A
Status: `SYNCHRONIZED`
Credit: `+1` frozen F1 identity accepted on the recovery lineage

## Exact accepted lineage

- Integrated main ancestor: `553779e8ffcc926ae4763ee86a2ea937e090c128`.
- Post-R48 accepted synchronization: `e8c312986d9d01c9e28e3e70309c925f6f6a5f4b`.
- FB2-24 feasibility/dispatch Base: `7e2925ed37f89b60dac2c2b13c68081af6e33fbe`.
- Superseded pre-review Candidate: `ab79002c3a239036b3d87c8de5652cff51c8e77c`; it is technical evidence only and is not in the accepted Candidate ancestry.
- Corrected accepted Candidate: `8ff45c944ba810edfbfa93d17462d4c3cb6a4e16`.
- R49 verdict: `MIGRATION_ACCEPTED`; blocking findings none.
- Fresh reviewer worktree: `E:\Codex\FD\fd-r49-review-fresh-20260918-1653`.
- PR #359 remains OPEN, non-draft, stacked on exact Base `7e2925ed...`, head `8ff45c9...`, `MERGEABLE/CLEAN`, with the exact six-file Candidate delta and empty stacked status-check rollup.

A independently rechecked the returned state before recording this synchronization: Candidate and fresh reviewer worktrees are clean at exact `8ff45c9...`; locked Reference is clean at exact `b2f9fa15...`; PR #359 topology is unchanged; remote `origin/main` remains `553779e8ffcc926ae4763ee86a2ea937e090c128`; and merge-base checks confirm integrated main plus the post-R48 accepted synchronization are in the accepted recovery ancestry.

## R49 acceptance evidence recorded

Fresh R49 independently found no blocking finding. The critical Final Rules 9.4 gate was independently checked against the canonical rules and runtime: the historical Reference `requirement: 1` remains static metadata only, while the accepted Candidate encodes `skill_zone_mana_at_least: 8`. Reviewer-only runtime probes prove that a skill-zone Ryougi s3 cannot be appended at 7 mana even after an ordinary attack is staged, but can be appended at 8 mana in the otherwise legal FB2-16 context; standalone required-additional play remains rejected.

Fresh R49 also independently revalidated exact F1 clause provenance, support-only/outside-game shape, FB2-16 append-only semantics, FB2-23 exact same-battlefield private-hand envelope, literal controller self-selection, observer privacy, owner-deck settlement, zero-selection behavior, shuffle/RNG behavior, shared-log redaction, stale/forged-state rejection, terminal replay rejection, serialize/restore behavior, identity-free production routing, and final cleanliness.

Fresh R49 validation reported:

- offline install: PASS, 239 packages, 0 vulnerabilities;
- typecheck: PASS;
- focused Ryougi + FB2-23 + executable compiler: `3 files / 66 tests PASS`;
- content validate/compile: `7 masters / 7 servants / 20 events / 0 blockers`;
- generated determinism: PASS;
- unchanged official full CI: `133 files / 866 tests PASS`;
- rules core + regression: `73 files / 451 tests PASS`;
- client build, locked Reference verification, coverage, automation audit, frozen intersection, identity-routing scan, and `git diff --check`: PASS;
- eleven-round MatchSession timing-sensitive test completed at about 4663 ms under the unchanged 5000 ms timeout.

Corrected deterministic hashes are:

- content library: `03582e22b830c59ccfe03379159dd5e50aef19fd7bae3561469c000e56618a79`;
- fixture: `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
- evidence report: `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.

Material/reporting is `101 archives / 136 cards / 237 abilities`, compiled `73 cards / 14 characters / 0 blockers`, buckets `22/3/131/0/81/130`, and automation audit `131/3/81/20`.

The earlier feasibility/pre-review probe hash `cfb99f7f...` belongs to the superseded shape that omitted the global 8-mana skill-zone gate and is not acceptance evidence for the corrected Candidate. Final acceptance evidence uses only corrected Candidate `8ff45c9...` and library hash `03582e22...`.

## Accepted frozen accounting

Fresh R49 independently reconstructs the frozen denominator as 944 unique F1 identities and verifies:

- Base material overlap: `112/944`;
- Candidate material overlap: `113/944`;
- exact frozen addition: only `master.shiki-ryougi.skill.s3`;
- frozen removals: `0`;
- duplicate canonical authoring card IDs: `0`;
- the other nine unresolved FM09 provisioning target definitions remain absent from canonical authoring and generated rules.

Because R49 returned `MIGRATION_ACCEPTED`, this A synchronization now records **recovery-line accepted overlap `113/944 = 11.97%`**, leaving **`831/944`** frozen identities not yet accepted on the recovery line.

This does **not** claim that integrated `origin/main` already contains Ryougi s3. `origin/main` remains `553779e...`; until later coordinated integration of the accepted stacked lineage, integrated-main accepted overlap remains `111/944`.

## Coordination effect

`master.shiki-ryougi.skill.s3` is now an independently accepted frozen migration on the recovery lineage. This synchronization changes no product/runtime/content implementation and does not merge or retarget PR #359.

The remaining nine FM09 provisioning frozen targets are:

- `master.bazett.skill.s2`;
- `master.caules-yggdmillennia.skill.s2`;
- `master.caules-yggdmillennia.skill.s3`;
- `master.fujino.skill.s3`;
- `master.shiki-nanaya.skill.s2`;
- `master.shiki-ryougi.skill.s2`;
- `master.shiki-tohno.skill.s2`;
- `master.zouken.skill.s3`;
- `master.zouken.skill.s4`.

P3-FM09 remains `MIGRATION_BLOCKED` until its remaining provisioning dependencies are legally registered. No FM10 is dispatched by this acceptance synchronization.
