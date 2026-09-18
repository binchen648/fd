# P3-A R52 / FB2-25 Initial-Mana Consumer Migration Acceptance Synchronization

Date: 2026-09-18
Role: Codex A
Status: `SYNCHRONIZED`
Credit: `+2` frozen F1 identities accepted on the recovery lineage

## Exact accepted lineage

- Post-R51 accepted recovery synchronization: `f81cdbf42e7469e75213b51a97b1202670022831` / accepted `115/944`.
- A consumer-migration dispatch: `bfa9087ab77223e40525fe36214509b1f2cdf9ff`.
- Accepted S Candidate: `0de67e5b5c4f403f04fa54868c6db09b980c90f8`.
- Candidate direct parent is exact A dispatch `bfa9087ab77223e40525fe36214509b1f2cdf9ff`.
- Accepted FB2-25 runtime Candidate `101cb0d4e3fbd105cfadafda26585b3825616fe1` is in the Base ancestry.
- R52 verdict: `MIGRATION_ACCEPTED`; blocking findings none.
- Fresh reviewer worktree: `E:\Codex\FD\fd-r52-review-fresh-20260918` at exact Candidate SHA.
- PR #363 remains OPEN and non-draft, base `codex/a-p3-r51-fb2-25-acceptance-sync`, head `codex/s-p3-fb2-25-initial-mana-consumers`, and was not merged or retargeted.

Before synchronization, A rechecked Candidate, reviewer, and locked Reference cleanliness; exact ancestry; PR topology; and remote `origin/main`. Locked Reference remains clean at `b2f9fa15fba07c63530bbf4612b03b8b704755f9`. Remote `origin/main` remains `553779e8ffcc926ae4763ee86a2ea937e090c128`.

## Exact accepted frozen identities

R52 independently accepts exactly:

1. `master.iliya.skill.s1` / 人工生命体 — initial controller Mana `6`;
2. `master.taiga.skill.s1` / 带着她的头号帮手 — initial controller Mana `3`.

No other frozen identity receives credit. In particular, `master.zouken.skill.s1` remains excluded because its F1 semantics additionally include game-duration Mana-capacity mutation.

R52 independently reconstructed both rows from exact F1 `59f145434695d29bdd17e4cb3adc887e84182377`, verified their full-text hashes/source locators, and confirmed their complete semantic axes are only `game.started + SET_MANA`. Locked Reference was used only for stable owner/static metadata and historical corroboration.

## Accepted authoring and runtime boundary

Candidate adds exactly two standalone `master_skill_card_archive` files plus one focused regression and one S result report. Base-to-Candidate scope is exactly four files:

- `data/authoring/masters/master.iliya.json`;
- `data/authoring/masters/master.taiga.json`;
- `packages/rules/tests/fb2-25-initial-mana-consumer-migration.test.ts`;
- `docs/reports/2026-09-18-p3-fb2-25-initial-mana-consumer-migration-result.md`.

There is zero Candidate diff under `packages/rules/src/**`, `data/packs/**`, `data/generated/**`, `apps/**`, `scripts/**`, or `artifacts/**`.

Each accepted ability remains inside the exact R51/FB2-25 envelope: automatic `forced_trigger`, activation exactly `{ trigger: "game_start" }`, empty host operations, exactly one fixed-controller literal `set_mana` effect, and no additional conditions, targets, costs, creates, rule modifiers, lifecycle, visibility, or limits. Existing normalized default response metadata is unchanged. No identity/name/text-specific runtime route exists.

R52 reviewer-only runtime probes independently verify controller Mana `4 -> 6` for Iliya and `4 -> 3` for Taiga, other-player isolation, typed `mana_adjusted` evidence, same-value no-op, replay idempotency, and fail-closed behavior for a lifecycle near-match.

The two archives remain outside the playtest pack and add no playable master roster surface, deck, fallback/manual product, fixture drift, or public roster exposure.

## Fresh R52 validation recorded

R52 independently reran and passed:

- `npm ci --offline`: 239 packages, 0 vulnerabilities;
- typecheck;
- focused migration + FB2-25 + FB2-05 + FM08 precedent: `4 files / 21 tests`;
- content validate / compile;
- generated determinism;
- locked Reference verify;
- official full CI: `136 files / 880 tests`;
- rules core + regression: `74 files / 456 tests`;
- client production build;
- Phase 3 coverage: `105 archives / 140 cards / 243 abilities`, compiled `73 / 14 / 0`;
- automation audit: `133 / 3 / 85 / 20`;
- `git diff --check`.

Deterministic product hashes remain unchanged:

- library `03582e22b830c59ccfe03379159dd5e50aef19fd7bae3561469c000e56618a79`;
- fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
- evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.

## A independent frozen accounting

A independently rescanned exact F1 and both exact Git trees after the R52 verdict:

- F1 static identities: `943`;
- F1 dynamic identities: `1`;
- frozen denominator: `944`;
- Base authoring archives/cards/material overlap: `103 / 138 / 115`;
- Candidate authoring archives/cards/material overlap: `105 / 140 / 117`;
- exact additions: `master.iliya.skill.s1`, `master.taiga.skill.s1`;
- removals: `0`;
- duplicate frozen canonical authoring IDs: `0`.

Because R52 returned `MIGRATION_ACCEPTED`, this A synchronization advances recovery-line accepted overlap from **`115/944` to `117/944 = 12.39%`**, leaving **`827/944`** frozen identities not yet accepted on the recovery line.

Integrated `origin/main` remains `553779e8ffcc926ae4763ee86a2ea937e090c128`, so integrated-main accepted overlap remains `111/944`. Recovery-line accepted and integrated-main accepted must continue to be reported separately.

## Coordination effect

This synchronization closes the F4 acceptance loop for exactly Iliya s1 and Taiga s1. It changes no implementation/runtime/product content beyond the already reviewed Candidate and does not merge or retarget PR #363.

P3-FM09 remains `MIGRATION_BLOCKED` with the same nine provisioning targets. This throughput migration is not FM10 and does not change the FM09 blocker claim. The next coordinator action is a fresh readiness overlay over the remaining `827` frozen identities against the newly accepted `117/944` recovery baseline, prioritizing exact homogeneous READY batches and reusable accepted capability rather than reverting to one-card prerequisite sequencing.
