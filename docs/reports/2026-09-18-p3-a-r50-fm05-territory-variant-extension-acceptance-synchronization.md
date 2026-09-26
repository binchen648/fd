# P3-A R50 / FM05 Territory Variant Extension Acceptance Synchronization

Date: 2026-09-18
Role: Codex A
Status: `SYNCHRONIZED`
Credit: `+2` frozen F1 identities accepted on the recovery lineage

## Exact accepted lineage

- Integrated main ancestor: `553779e8ffcc926ae4763ee86a2ea937e090c128`.
- Post-R49 process-hygiene baseline: `3b2d6bc6ac2eb6bfc7058a238d140995d0711e77`.
- FM05 Territory Variant Extension A dispatch Base: `40eaf45a64ecca0ddb6efe62a8bed35652420707`.
- Accepted S Candidate: `7f83a0cfba2cd7f781ab0c0491c9ed2607db02d6`.
- R50 verdict: `MIGRATION_ACCEPTED`; blocking findings none.
- Fresh reviewer worktree: `E:\Codex\FD\fd-r50-review-fresh-20260918`.
- PR #361 remains OPEN, non-draft, stacked on exact Base `40eaf45a...`, head `7f83a0cf...`, and MERGEABLE with empty stacked status-check rollup.

Before recording acceptance, A independently rechecked the returned state: Candidate and reviewer worktrees are clean at exact `7f83a0cf...`; locked Reference is clean at exact `b2f9fa15...`; Candidate direct parent is exact `40eaf45a...`; PR #361 topology is unchanged; Base-to-Candidate scope is exactly four files; forbidden runtime/product paths have zero diff; and remote `origin/main` remains `553779e8ffcc926ae4763ee86a2ea937e090c128`.

## R50 acceptance evidence recorded

Fresh R50 independently reconstructed both target identities from frozen F1 `59f145434695d29bdd17e4cb3adc887e84182377` and locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9`, rather than relying on the S result report. The accepted identities are:

- `servant.gilles.skill.sc-gilles-2`;
- `servant.medea.skill.sc-medea-2`.

R50 confirms both are Caster Territory Creation skills with Reference handler `core.territory-creation`, type `魔术`, cost `0`, historical base Power `2`, and historical requirement `0`. Family acceptance is not based on handler name alone: the frozen semantic structure matches the already accepted R34/FM05 Territory Creation family, with the only F1 text difference being typography in the first formula line. The deployment clause is the same frozen clause and the runtime-authoring core is unchanged.

The accepted authoring uses only already independently accepted contracts:

- P3-R33 / FB2-11: controlled `game.round_number` formula `add(16, multiply(-2, game.round_number))`;
- P3-R19 / FB2-02: forced Magic Workshop deployment reward, controller `+1 mana` then `+2 VP`;
- P3-R34 / FM05: Territory Creation family precedent;
- Final Rules 9.4: `skill_zone_mana_at_least: 8`.

Reviewer-only runtime probes independently prove, for both new cards, Power `14 / 8 / 2 / 0` on rounds `1 / 4 / 7 / 8`, exactly one `+1 mana` and `+2 VP` reward for controller deployment to `magic_workshop`, and no reward for wrong-location or other-player deployment. No identity-specific runtime route is introduced.

Fresh R50 validation reports:

- `npm ci --offline`: PASS, 239 packages, 0 vulnerabilities;
- typecheck: PASS;
- focused new + existing FM05: `2 files / 9 tests PASS`;
- content validate and content compile: PASS;
- generated determinism: PASS;
- locked Reference verify: PASS;
- rules core + regression: `73 files / 451 tests PASS`;
- client production build: PASS;
- phase3 coverage and automation audit: PASS;
- `git diff --check`: PASS.

The first unchanged Candidate full-CI run had one fixed-5000ms timeout in the eleven-round MatchSession case. R50 did not auto-accept that run: it performed unchanged isolated Base/Candidate timing comparison, then reran both trees without changing timeout, worker, test, or config. Base full CI passed `133 files / 866 tests`; Candidate rerun passed `134 files / 870 tests`. Isolated Base/Candidate timings materially overlapped, and Candidate has zero runtime/pack/generated diff, so R50 found no Candidate-specific performance-regression evidence.

Fresh Candidate reporting is:

- material coverage: `103 archives / 138 cards / 241 abilities`;
- compiled: `73 cards / 14 characters / 0 blockers`;
- buckets: `22/3/133/0/83/130`;
- automation audit: `133/3/83/20`.

Because Candidate does not modify pack/generated product files, deterministic generated-product hashes remain:

- content library: `03582e22b830c59ccfe03379159dd5e50aef19fd7bae3561469c000e56618a79`;
- fixture: `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
- evidence report: `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.

## Accepted frozen accounting

A independently re-ran the frozen intersection against exact F1 and the exact Git trees and reproduces R50:

- frozen denominator: `944`;
- Base material overlap: `113/944`;
- Candidate material overlap: `115/944`;
- exact frozen additions: only `servant.gilles.skill.sc-gilles-2` and `servant.medea.skill.sc-medea-2`;
- frozen removals: `0`;
- duplicate canonical authoring card IDs: `0`.

Because R50 returned `MIGRATION_ACCEPTED`, this A synchronization records **recovery-line accepted overlap `115/944 = 12.18%`**, leaving **`829/944`** frozen identities not yet accepted on the recovery line.

This does **not** claim integrated `origin/main` already contains the two Territory Creation variants. `origin/main` remains `553779e8ffcc926ae4763ee86a2ea937e090c128`; integrated-main accepted overlap therefore remains `111/944` until later coordinated integration of the stacked accepted lineage.

## Coordination effect

The two Territory Creation typography variants are now independently accepted frozen migrations on the recovery lineage. This synchronization changes no product/runtime/content implementation and does not merge or retarget PR #361.

P3-FM09 remains `MIGRATION_BLOCKED`; its nine remaining provisioning targets are unchanged. This FM05 extension is not FM10 and grants no authority to dispatch FM10. The next coordinator action is a fresh full-roster readiness refresh over the remaining `829` identities using the newly accepted `115/944` recovery baseline; no additional migration credit is implied until a later S Candidate receives fresh independent R acceptance.
