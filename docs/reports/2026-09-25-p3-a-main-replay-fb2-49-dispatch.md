# P3-A Current-Main FB2-49 Semantic Replay Dispatch

Role: Codex A
Status: SYNCHRONIZED`nDate: 2026-09-25

## Purpose

Start Phase 3 integration recovery from current main without promoting the diverged frontier wholesale. This dispatch authorizes one zero-credit current-main semantic replay for the identity-free FB2-49 opponent-close-to-one runtime contract.

## Control facts

- current main: `4b52b3166ed2ba0efaa4569ee95c6513fd26ab2f`
- current-main accepted frozen overlap: `111/944`
- reconciliation PR: `#442`
- reconciliation Candidate: `a1b8f274c8f3fb0859540de9dc08ca3a97a5f8cc`
- frozen frontier: R123 `8b26c9d0aa294c065ae6c7f3a2b062f19cdff196`
- frontier formal claim: `269/944`
- frontier material: `265/944`
- historical evidence gaps #356/#359/#361/#363/#364/#366/#368/#372 remain `NOT_VERIFIED`; they are not re-reviewed here and give no current-main replay credit.
- R66 formal-only Lostbelt set (`master.kadoc.skill.s3`, `master.ophelia.skill.s5`, `master.ophelia.skill.s6`, `master.ophelia.skill.s7`) remains absent from R123 material and `NOT_VERIFIED`; no current-main credit is granted.

## Why PR #424 is not the replay vehicle

PR #424 targets current main and passes its existing Build/Test/Phase-3-policy checks, but a fresh mechanical frozen-material scan of exact head `26b252b196e57eb6fa500330a59470583cdbc8bb` against main shows:

- main frozen material: `111/944`;
- #424 frozen material if applied wholesale: `146/944`;
- exact frozen additions: `35`;
- removals: `0`.

Those 35 additions are historical frontier consumer material and are outside the zero-credit FB2-49 capability. Therefore #424 must not be treated as a safe wholesale current-main promotion source during reconciliation. Its historical attestation/promotion evidence is preserved as source evidence only.

## Accepted semantic source

Use only the exact FB2-49 implementation review envelope:

- source PR: `#422`;
- exact source Base: `822b5f9dfd05a64a5707fcb945b8b85eff2238e6`;
- accepted source Candidate: `aa04a12e1647560374e09f7e2b6e62a5dccd0954`;
- source verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`;
- canonical source evidence: `https://github.com/binchen648/fd/pull/422#issuecomment-5775423822`;
- source Base->Candidate changes no `data/authoring/**`, `data/generated/**`, or client authoring/product content.

The #422 diff is evidence of required semantics and adversarial closure. It is not permission to import its frontier ancestry.

## Authorized current-main capability

Replay only the identity-free structural contract required by FB2-49:

- exact compound opponent close-to-one interaction admission;
- fail-closed qualifying-card and pending-decision validation;
- authenticated server-owned continuation authority;
- transactional settlement / queue integrity;
- MatchSession snapshot/replay capability sealing and lifecycle scoping;
- room lifecycle replacement/revocation behavior;
- production server restore path preserving the same trust boundary;
- only the minimum portable hash/authentication helper required by that contract.

Do not infer generic acceptance for other interaction families.

## Scope boundary

No authoring migration is authorized. In particular, this replay does not migrate or credit Astolfo S1, Scathach S2, or any of the 35 frozen identities carried by #424. Current-main formal and material accounting remain `111/944` throughout this capability task.

B must adapt semantic hunks to current main. Whole-file replacement from frontier is not acceptable when it would overwrite newer/current-main behavior. If current main lacks a prerequisite required for faithful replay, B stops with an exact blocker instead of widening the import.

## Required next gate

`P3-B-MAIN-REPLAY-FB2-49` is the only authorized implementation task from this dispatch. On implementation completion it requires one exact stacked Candidate, focused/full validation, one fresh independent R, A capability synchronization, and only then a repository-governed role-I Promotion PR to main.

No merge or retarget is performed by this dispatch.