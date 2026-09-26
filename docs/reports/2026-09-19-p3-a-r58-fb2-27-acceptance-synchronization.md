# P3-A R58 / FB2-27 Ruler Seal Subsystem Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-19

## Accepted review input

- Fresh reviewer verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- Exact A dispatch Base: `fbc7687edf13c27eb7383117ba22551054aa4e96`
- R57 rejected Candidate: `f315f2e412399f3aca7971adf7ccd1812437e63f` / `IMPLEMENTATION_NEEDS_REVISION`
- Accepted Revision Candidate: `e30e7efef3cf9fc111236599441e5a869f4bc81a`
- PR: `#367` (`feat(rules): add Ruler seal subsystem`)
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

Fresh R58 reports no blocking finding. R58 independently replays the R57 ordered least-bound blocker and confirms exact Reference ordering: with issuer history p2=0, p3=1, p4=1, p2->p3 and p2->p4 are legal while p3->p2 rejects `illegal_target` mutation-free.

R58 also revalidates the complete FB2-27 structural/runtime contract: issuer-scoped history, issuer-owned single-use seals, multiple distinct seal use in one round, action-phase use without source-active requirement, movement/occupancy rollback, round movement lock across core and MatchSession boundaries, zero-mana free play while preserving ordinary playRequirements, delayed +2 VP win/loss/replay behavior, exact no-copy/no-steal marker, identity-free routing, product isolation, zero frozen credit, official gates, topology, and final cleanliness.

## A independent synchronization checks

A re-verified after the R58 verdict:

- fresh A sync worktree starts at exact accepted Revision Candidate `e30e7efef3cf9fc111236599441e5a869f4bc81a`;
- Revision parent is exact R57 rejected Candidate `f315f2e412399f3aca7971adf7ccd1812437e63f`; the original Candidate descends directly from dispatch Base `fbc7687edf13c27eb7383117ba22551054aa4e96`;
- PR #367 remains OPEN, non-draft, unmerged and unretargeted with exact base OID `fbc7687...` and head OID `e30e7efe...`;
- fresh R58 worktree is clean at exact Revision Candidate;
- locked Reference remains clean at exact `b2f9fa15fba07c63530bbf4612b03b8b704755f9`;
- fetched `origin/main` remains `553779e8ffcc926ae4763ee86a2ea937e090c128`.

A mechanically reconstructed current frozen accounting from the authoritative F1 Git blob and exact accepted tree:

- F1 denominator: `943` static + `1` dynamic = `944` identities;
- authoring cards: `144`;
- unique authoring cards: `144`;
- frozen overlap: `121/944`;
- remaining: `823`;
- duplicate frozen canonical IDs: `0`.

FB2-27 has no authoring/product identity diff and earns zero frozen migration credit. The mechanical result reproduces fresh R58 accounting.

## Accepted capability envelope

The accepted FB2-27 capability is one identity-free Ruler seal relationship subsystem. It includes:

- ordered two-stage least-bound selection with game-long history scoped per issuer;
- issuer -> bound-player seal relationships and per-physical-seal once-only consumption;
- action-phase use from the skill surface without an artificial source-active requirement or generic once-per-round limit;
- structural move, current-round movement-lock, and free-play + delayed issuer reward branches;
- movement occupancy and transactional rollback at both ability/core and MatchSession product boundaries;
- ordinary card playRequirements preserved while the exact Ruler free-play opportunity waives the intended mana/timing/quota constraints;
- win-only issuer +2 VP reward with loss consumption and replay idempotency;
- exact `ruler_copy_steal_guard / forbid_source_and_effects` marker;
- exact structural recognition with near matches fail closed;
- no canonical ID, owner ID, name, printed text, Reference handler, F1 hash, or Reference hash routing.

R57's unordered-pair defect is not accepted history. Only Revision Candidate `e30e7efe...` is accepted by this synchronization.

## Fresh R58 validation accepted by A

Fresh R58 independently reports:

- offline install: 239 packages, 0 vulnerabilities;
- typecheck PASS;
- reviewer ordered-selection probe: `4/4 PASS`;
- reviewer subsystem probe: `5/5 PASS`;
- focused FB2-27: `12/12 PASS`;
- content validate/compile: `7 masters / 7 servants / 20 events / 0 blockers`;
- generated determinism PASS with unchanged hashes:
  - library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`;
- locked Reference verification PASS;
- official full CI: `139 files / 942 tests PASS`;
- rules src + core + regression: `80 files / 482 tests PASS`;
- client production build PASS;
- Phase 3 coverage: `106 archives / 144 cards / 249 abilities`, compiled `76 / 14 / 0`, routing `22/3/135/0/89/131`;
- automation audit: `135/3/89/20`;
- `git diff --check` PASS;
- reviewer, Candidate, and Reference final cleanliness PASS.

## Formal frozen accounting after synchronization

Formal recovery-line accepted overlap remains:

**`121/944` (`12.82%`)**

Remaining frozen identities:

**`823/944`**

FB2-27 is zero-credit infrastructure. Integrated `origin/main` remains mechanically `111/944`; it is not mixed with recovery-line accounting.

PR #367 remains open and unmerged. This synchronization does not merge or retarget it.

Historical P3-FM09 remains `MIGRATION_BLOCKED`. No FM10 is dispatched.

## Next coordinator action

The exact six Ruler-family consumers named by the accepted A dispatch are now dependency-ready for a separate S task:

1. `servant.amakusa.skill.sc-amakusa-3`
2. `servant.amor.skill.sc-amor-1`
3. `servant.jeanne.skill.sc-jeanne-1`
4. `servant.morgan.skill.sc-morgan-3`
5. `servant.oberon.skill.sc-oberon-3`
6. `servant.oberon.skill.sc-oberon-4`

A separate fresh S dispatch/source-grounding step is required. Candidate material may reach `127/944`; formal accepted remains `121/944` until fresh migration R and later A acceptance synchronization.
