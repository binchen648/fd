# P3-A R43 / FB2-18 Recovery Synchronization

Date: 2026-09-18
Role: Codex A
Status: `SYNCHRONIZED`
Credit: zero frozen-migration credit

## Exact lineage

- Integrated current-main baseline: `553779e8ffcc926ae4763ee86a2ea937e090c128`.
- Fresh FB2-17 recovery blocker: `310e6546fa2457b6bf11b91e547d25eb39751e99`.
- Fresh A blocker synchronization / FB2-18 dispatch: `d87e74007f2cf723b2436f27f284ebd09145a48f`.
- Fresh FB2-18 recovery candidate: `cb81559033db6b96b1f26cf7d9bd15686db5d4fb`.
- Candidate direct parent is exactly `d87e74007f2cf723b2436f27f284ebd09145a48f`.

Historical FB2-18/R43 work, including `6a6d00b...`, remains technical evidence only and is not acceptance provenance for this recovery lineage.

## Fresh R43 result synchronized

Fresh process-separated R43 returns `IMPLEMENTATION_ACCEPTED_CANDIDATE` with no blocking finding for `cb81559033db6b96b1f26cf7d9bd15686db5d4fb`.

The reviewer independently verified exact `initialPlacement: "outside_game"` validation and preservation, owned-master-skill restriction, malformed/near-match fail-closed behavior, executable registration without `initialZone`, unchanged ordinary master-skill placement, semantic-survival coverage, identity-free deferred-card routing, no runtime movement/create/provision semantics, FB2-15/FB2-16 compatibility, exact scope, zero-credit accounting, and final cleanliness.

Fresh reviewer validation recorded:

- `npm ci --offline`: PASS, 239 packages, 0 vulnerabilities;
- typecheck PASS;
- focused `4 files / 63 tests` PASS;
- rules core + regression `69 files / 420 tests` PASS;
- full CI `129 files / 816 tests` PASS;
- client production build PASS;
- content validation `7 masters / 7 servants / 20 events / 0 blocking issues`;
- generated determinism PASS with unchanged hashes;
- locked Reference verification at `b2f9fa15fba07c63530bbf4612b03b8b704755f9` PASS;
- coverage remains `98 archives / 133 cards / 232 abilities`, compiled `70 cards / 14 characters / 0 blockers`, raw `22/3/127/0/80/124`;
- automation audit remains `127/3/80/20`;
- `git diff --check` PASS;
- fresh reviewer and candidate worktrees both clean at the exact candidate SHA.

FB2-18 is representation/compiler dependency closure only and earns zero frozen-migration credit. Accepted overlap remains `111/944`, leaving `833/944`.

## Fresh retry decision

FB2-18 closes only the first FB2-17 blocker: an owned `master_skill` can now be registered with `initialPlacement: "outside_game"` and no executable `initialZone`.

The prior fresh FB2-17 probe also established two independent remaining concerns that FB2-18 intentionally did not solve:

1. ordinary `authoringMasterFiles` registration may still promote a support-only Shirou archive into the playable master roster and trigger fallback command-spell synthesis;
2. normal deterministic generation legitimately changes the evidence report as well as the content library.

Therefore the next legal step is a fresh FB2-17-R1 support-definition retry, not direct FB2-19 implementation. The retry contract explicitly authorizes the two normal generated outputs already proven necessary, but still forbids any loader/compiler/runtime change. If the support-only registration blocker remains, S must return `SUPPORT_DEFINITION_BLOCKED` and A may then dispatch the narrowest generic registration dependency.

P3-FM09 remains `MIGRATION_BLOCKED`; no FM10 or Ciel task is authorized by this synchronization.
