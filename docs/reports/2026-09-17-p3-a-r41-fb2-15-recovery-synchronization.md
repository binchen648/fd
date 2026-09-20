# P3-A R41 / FB2-15 Recovery Synchronization and FM09 Recovery Dispatch

Date: 2026-09-17
Role: Codex A
Status: `SYNCHRONIZED`

## Pins

- Integrated current-main baseline: `553779e8ffcc926ae4763ee86a2ea937e090c128`
- FB2-15 recovery dispatch: `8376bece0e84a510aa8324f17d98c2f2deabaa07`
- Exact FB2-15 candidate: `23a666913a3050ad55d781e3f5b3a1518add4c3e`
- Fresh R41 verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- Frozen F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Legal recovery lineage

Fresh R41 independently reviewed the exact direct lineage

`553779e8ffcc926ae4763ee86a2ea937e090c128 -> 8376bece0e84a510aa8324f17d98c2f2deabaa07 -> 23a666913a3050ad55d781e3f5b3a1518add4c3e`

from a fresh detached reviewer worktree/context and returned `IMPLEMENTATION_ACCEPTED_CANDIDATE` with no blocking finding and no requested correctness/scope revision. The historical FB2-15 candidate `61dd7af630a12bca0a71da16cc554bb65c4ce8bf` is not an ancestor of the current candidate and contributes no inherited acceptance authority.

A independently rechecked that the fresh reviewer checkout remains detached at exact candidate `23a666913a3050ad55d781e3f5b3a1518add4c3e`, with porcelain `0` and `git diff --check` PASS. Candidate PR #349 remains based on `553779e8ffcc926ae4763ee86a2ea937e090c128`, with build/test GitHub Actions green at the reviewed head.

R41 independently confirmed the shared typed identity-free game-start-only classifier, validated compiler deferral boundary, malformed/non-game-start/source/target fail-closed behavior, production initialization, one-/multi-target atomicity, replay/restore idempotency, retained target ownership/control/zone/visibility/state validation, deterministic creation provenance, B10 compatibility, FB2-14 isolation, future FM09 membership/exclusions, zero migration credit, and final candidate/reviewer cleanliness.

R41 mechanical evidence is typecheck PASS; focused `93/93`; rules core+regression `403/403`; full CI `798/798`; client production build PASS; content validation `0` blockers; generated determinism PASS; locked Reference verification PASS; coverage `98/133/232` with raw `22/3/127/0/80/124`; automation audit `127/3/80/20`; Base-to-Candidate `git diff --check` PASS. A does not replace R41's semantic verdict with those mechanical checks.

## Accepted FB2-15 boundary

The accepted recovery boundary is one narrow typed, identity-free, idempotent `game_start` skill-provisioning contract. Compiler and runtime share one exact structural classifier. Compiler deferral occurs only after the full envelope, source type/ownership, and every target definition have passed validation. Runtime preflights the whole target batch before mutation, provisions only missing targets, and preserves replay/restore idempotency and transaction rollback behavior.

No source identity/name/printed-text/target allowlist, Reference-handler routing, arbitrary Card Zone/Card Create/Trigger promotion, authoring migration, taxonomy/KPI change, or unrelated runtime behavior is accepted by FB2-15.

## Fresh FM09 recovery reconciliation

The future source family remains exactly the ten locked-Reference `core.game-start-add-skill` identities from the recovery handoff:

1. `master.bazett.skill.s1`
2. `master.caules-yggdmillennia.skill.s1`
3. `master.ciel.skill.s1a`
4. `master.fujino.skill.s1`
5. `master.shiki-nanaya.skill.s1`
6. `master.shiki-ryougi.skill.s1`
7. `master.shiki-ryougi.skill.s1a`
8. `master.shiki-tohno.skill.s1`
9. `master.shirou-emiya.skill.s2`
10. `master.zouken.skill.s2`

Fresh exact-ID scanning of `data/authoring` finds canonical presence `0/10`. The three explicit exclusions also remain absent and excluded: `master.fiore.skill.s1`, `master.sion.skill.ascension`, and `master.tokiomi.skill.s2`.

Fresh dependency scanning finds all twelve provisioning target definitions currently absent from canonical authoring: `master.bazett.skill.s2`, `master.caules-yggdmillennia.skill.s2`, `master.caules-yggdmillennia.skill.s3`, `master.ciel.skill.s2`, `master.fujino.skill.s3`, `master.shiki-nanaya.skill.s2`, `master.shiki-ryougi.skill.s2`, `master.shiki-ryougi.skill.s3`, `master.shiki-tohno.skill.s2`, `card.derived.master.shirou-emiya.ganjiang-moye`, `master.zouken.skill.s3`, and `master.zouken.skill.s4`.

P3-FM09-RECOVERY is therefore dispatched only as a fresh S migration attempt against the accepted FB2-15 compiler/runtime boundary. S may materialize only the exact ten source identities from frozen F1 plus locked Reference static metadata. S must not create placeholder target definitions, weaken compiler validation, silently absorb the eleven additional frozen target skills, treat the derived Shirou target as a frozen source identity, or expand the batch to make compilation pass. If the accepted target-registration precondition remains unsatisfied, the correct S outcome is `MIGRATION_BLOCKED`.

## Credit state and next gate

FB2-15, R41, and this A synchronization take zero migration credit. Accepted current-main overlap remains `111/944` (`11.76%`), leaving `833/944` outside accepted canonical authoring.

The next legal task is P3-FM09-RECOVERY in a fresh S worktree/context. A successful S result would still require fresh A material synchronization and a fresh independent migration review before any accepted overlap could advance. A blocked S result must be synchronized as a blocker; it must not be bypassed by jumping directly to Ciel or by importing the superseded downstream FM09 acceptance chain.
