# P3-A Tamamo Owner Readiness Capability Acceptance Synchronization

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-29

## Accepted input

- PR: `#481`
- Exact Base: `93b5536c8a4a02d79fe9b525e450e2883056cdad`
- Exact accepted successor Candidate: `472d7d7cb6ed16a0d526ff91a68de0e1fe12d3da`
- Superseded predecessor Candidate: `6c91b25e2b6a0d7c5af2f5964584ddd5e7171c18`
- Canonical fresh-R evidence: `https://github.com/binchen648/fd/pull/481#issuecomment-5882572670`
- Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- ReviewJobKey: `pr481:472d7d7cb6ed16a0d526ff91a68de0e1fe12d3da`
- Exact-Candidate Phase 3 Gate: `36512899227` — `SUCCESS`

The fresh independent Reviewer completed the successor exact-Candidate review. Reviewer-side GitHub publication returned explicit 403, so Coordinator published one bounded same-attempt relay. No second review was performed.

## Accepted bounded readiness scope

The accepted zero-credit transaction closes the currently discoverable generic sealed-card/Magic capability family required by the complete Tamamo owner:

- current-round exact-definition attribute replacement;
- effective Magic attack protection against other-player close/deactivation and Power reduction while leaving self-originating reductions effective;
- authoritative controller/source provenance for production `set_opponent_power_to_zero` and `reduce_opponents_power` reducers;
- after-battle sealing of one qualifying same-location active face-up basic Magic/Luck/Remote-operation attack under an authored host;
- atomic replay of all sealed cards using normal aggregate card costs;
- post-battle per-card 1-mana reseal or discard disposition, preserving physical-card provenance and ownership rules;
- strict runtime persistence/restore validation and identity-free fail-closed loader gateway.

No Tamamo consumer authoring is added by readiness. No Tamamo/card identity, Chinese/printed-text parsing, legacy Reference handler route, or `SkillLib` fallback is introduced.

## Review closure

The predecessor exact Candidate received one P1 because production extended-effect Power reducers used anonymous `sourceId=extended-effect`. The accepted successor preserves authoritative `controllerId`, retains concrete `sourceCardId` where available, and makes `calculateCardPower` consume that provenance. Fresh R confirmed the predecessor finding closed with no new exact-scope blocker.

Independent verification recorded for the successor includes focused Tamamo readiness `9/9 PASS`, directly affected green set `10 files / 256 tests PASS`, `FD_TOOLCHAIN_OK`, typecheck PASS, content validate/compile PASS, generated determinism PASS, empty `data/authoring/**` delta, production identity audit CLEAN, and `git diff --check` PASS.

## Mandatory A-rescan of the complete Tamamo owner

Frozen owner scope remains exactly:

1. `servant.tamamo.skill.sc-tamamo-1`
2. `servant.tamamo.skill.sc-tamamo-2`
3. `servant.tamamo.skill.sc-tamamo-3`

All three had `currentRoute=none` at the readiness Base. F1 clauses and locked Reference behavior map completely onto the accepted generic readiness family. No additional currently discoverable source-grounded blocker remains. Owner-readiness is CLOSED.

Execution is authorized to enter one owner-complete formal Tamamo migration containing sc1 + sc2 + sc3 together. No further readiness task is authorized unless formal consumer implementation mechanically exposes a genuinely new source-grounded blocker.

## Accounting and continuation

This A-sync grants zero migration credit. Strict formal accounting remains **`146/944`**, remaining **`798`**.

Next task: `P3-S-OWNER-TAMAMO-COMPLETE-MIGRATION`.

The formal unit is one Tamamo owner batch containing all three frozen skills in one Candidate, one PR, one fresh R, and one A-sync/accounting transaction before advancing owners. If accepted, the formal batch may add exactly `+3` and move accounting from `146/944` to `149/944`, remaining `795`.
