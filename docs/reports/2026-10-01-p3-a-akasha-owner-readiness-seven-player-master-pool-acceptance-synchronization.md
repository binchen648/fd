# P3-A Akasha seven-player master-pool readiness acceptance synchronization

Date: 2026-10-01
Owner: FORMAL A-sync
Accepted readiness task: `P3-B-AKASHA-OWNER-READINESS-SEVEN-PLAYER-MASTER-POOL`
Accepted Candidate: `5f1a37d53fa0e6b2c2b21a13c3df39cec03ff0ec`
Canonical evidence: `https://github.com/binchen648/fd/pull/505#issuecomment-5917276459`
Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
Gate: run `36758262351` / job `110033947596` `SUCCESS`

## Accounting

This transaction is readiness-only and grants zero migration credit. Strict accounting remains `173/944`, remaining `771`.

## Full-owner rescan

Canonical `data/authoring/**` still contains no `master.akasha` owner archive and none of the eight frozen Akasha identities. All eight remain newly creditable; none is preservation-only:

- `master.akasha.skill.ascension`
- `master.akasha.skill.s1`
- `master.akasha.skill.s1a`
- `master.akasha.skill.s2`
- `master.akasha.skill.s3`
- `master.akasha.skill.s4`
- `master.akasha.skill.s5`
- `master.akasha.skill.s6`

The accepted #505 follow-up closes the additional shared preflight gap found while materializing an eighth playable Master: MatchSession now keeps the product boundary at exactly seven seats, deterministically selects exactly seven Master/Servant pairings from larger pools, fails closed below seven, and never creates `p8` authority.

No additional currently discoverable Akasha owner-local readiness gap remains.

## Next legal FORMAL task

`P3-S-OWNER-AKASHA-COMPLETE-MIGRATION` is `READY`.

The formal transaction must materialize all 8 frozen identities together, consume only accepted identity-free generic runtime seams, introduce no Akasha/card-name/legacy identity routing in production runtime, and may add exactly +8 only after exact `MIGRATION_ACCEPTED` plus A-sync/accounting (`173 -> 181`, remaining `763`).