# P3-A Alice Multi-Presence Core Readiness Acceptance Synchronization

Date: 2026-10-01
Owner: FORMAL A-sync
Accepted readiness task: `P3-B-ALICE-OWNER-READINESS-MULTI-PRESENCE-CORE`
PR: `#510`
Exact Base: `0ad0e05d79a738aa55f43ea9c87ef5db5ef2acb9`
Accepted Candidate: `29cece96ef155c76899a1e14673923405b1a870b`
Canonical evidence: `https://github.com/binchen648/fd/pull/510#issuecomment-5923495992`
Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
Gate: run `36805338719` / job `110188307485` = `SUCCESS`

## Evidence transport

The fresh independent Reviewer completed the exact Candidate review and returned `IMPLEMENTATION_ACCEPTED_CANDIDATE`. GitHub review-evidence publication failed with explicit 403/transport failure. FORMAL published only the visible exact same-attempt Base/Candidate/verdict/task/classification as a Coordinator bounded relay and mechanically re-read issue comment `5923495992`. No second review was performed.

## Accounting

This synchronization is readiness-only and grants zero migration credit.

- before: `186/944`, remaining `758`
- readiness increment: `+0`
- after: `186/944`, remaining `758`

## Full-owner rescan

Canonical `data/authoring/**` still contains `0/3` Alice frozen identities:

- `master.alice.skill.ascension`: absent
- `master.alice.skill.s1`: absent
- `master.alice.skill.s2`: absent

The accepted #510 Candidate closes only the generic multi-presence core foundation: extra-presence state/provenance, deployment, one-logical-player discovery/combat, terrain sharing, primary-to-extra mirror movement, actual-paid-mana post-play tax, sacrifice, and restore provenance. It does not materialize any Alice consumer and does not close the parent owner-readiness task.

The pre-R HELPER `latest.md` was Epoch 17 material for this exact Candidate and was treated read-only. Its bounded remainder matches the formal source rescan: one mandatory owner-local readiness follow-up remains.

## Remaining owner-local blocker

`P3-B-ALICE-OWNER-READINESS-PRESENCE-CONTEXT` is now `READY`.

It must close, generically and without Alice identity routing:
- explicit single-location choice for separated-presence location/battle-related effect transactions;
- server-owned transaction-bound selection provenance that cannot double-trigger the ability;
- generic consumers reading the selected presence context instead of silently defaulting to primary `PlayerState.locationId`;
- authoritative movement of either physical presence, including externally moved extra presence, through the same legal mirror rule;
- engagement, occupancy, movement legality, restore, and fail-closed behavior.

The parent `P3-B-ALICE-OWNER-READINESS-CAPABILITY` therefore remains `WAIT_READINESS_SUBTASKS`. No Alice formal owner-complete migration is legal yet.
