# P3-A Akasha location-provisioning readiness acceptance synchronization

Date: 2026-10-01
Owner: FORMAL A-sync
Accepted readiness task: `P3-B-AKASHA-OWNER-READINESS-LOCATION-PROVISIONING`
Accepted Candidate: `ff26b046be5ea5e3ef2302e756e52fcbcd919a6c`
Canonical evidence: `https://github.com/binchen648/fd/pull/504#issuecomment-5916944435`
Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
Gate: run `36755548497` / job `110024740882` `SUCCESS`

## Accounting

This transaction is readiness-only and grants zero migration credit. Strict accounting remains `173/944`, remaining `771`.

## Full-owner rescan

Canonical `data/authoring/**` contains no `master.akasha` owner archive and none of the eight frozen Akasha identities. All eight remain newly creditable; none is preservation-only:

- `master.akasha.skill.ascension`
- `master.akasha.skill.s1`
- `master.akasha.skill.s1a`
- `master.akasha.skill.s2`
- `master.akasha.skill.s3`
- `master.akasha.skill.s4`
- `master.akasha.skill.s5`
- `master.akasha.skill.s6`

The accepted #504 follow-up closes the additional preflight gap found after the first A-sync: exact game-start temporary target-definition provisioning at every enabled battlefield with physical `generatedBy` and authoritative `placedAtLocationId` provenance. The separate skill-zone target copy remains under the already accepted `provision_skill_cards` seam.

No additional currently discoverable owner-local readiness gap remains.

## Next legal FORMAL task

`P3-S-OWNER-AKASHA-COMPLETE-MIGRATION` is now `READY`.

The formal transaction must materialize all 8 frozen identities together, consume only accepted identity-free generic runtime seams, introduce no Akasha/card-name/legacy identity routing in production runtime, and may add exactly +8 only after exact `MIGRATION_ACCEPTED` plus A-sync/accounting (`173 -> 181`, remaining `763`).
