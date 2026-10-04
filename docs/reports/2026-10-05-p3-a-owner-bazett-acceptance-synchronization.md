# P3-A Bazett Owner Acceptance Synchronization

Date: 2026-10-05

## Exact acceptance

- Task: `P3-S-OWNER-BAZETT-COMPLETE-MIGRATION`
- Exact Base: `84e2fab939de6ce1b1cc307488b749b80ce8cc92`
- Accepted Candidate: `9a457a38aa9118cecee410f6b4c133a1d10fac5c`
- PR: `#523`
- Verdict: `MIGRATION_ACCEPTED`
- Canonical evidence: `https://github.com/binchen648/fd/pull/523#issuecomment-5982980953`
- Evidence transport note: the independent review completed normally; GitHub write returned 403, so Coordinator published the bounded same-attempt relay. No second review was performed.

## Mechanical accounting rescan

Frozen Bazett owner scope:
- `master.bazett.skill.ascension`
- `master.bazett.skill.s1`
- `master.bazett.skill.s1a`
- `master.bazett.skill.s1b`
- `master.bazett.skill.s1c`
- `master.bazett.skill.s1d`
- `master.bazett.skill.s2`
- `master.bazett.skill.s3`
- `master.bazett.skill.s4`
- `master.bazett.skill.s5`

Exact Base canonical authoring contains only historical accepted/credited `master.bazett.skill.s1b`, therefore Base coverage is `1/10`.
Accepted Candidate contains all ten frozen identities exactly once, therefore Candidate coverage is `10/10`.

- newly creditable: `9`
- preservation-only: `1` (`master.bazett.skill.s1b`)
- strict accounting: `197/944 -> 206/944`
- remaining: `747 -> 738`

Accepted readiness PR #522 remains permanently zero-credit and is not counted again. The roster-growth-only MatchSession fixture stabilization in the accepted Candidate is review/test closure only and earns no separate migration credit.

## Canonical acceptance checks

- PR #523 Base/head/branch remained exact at relay closeout.
- `FD_TOOLCHAIN_OK` in the independent review.
- Bazett owner-complete `9/9 PASS`.
- Bazett accepted readiness `13/13 PASS`.
- MatchSession `33/33 PASS`.
- affected aggregate `174/174 PASS`.
- typecheck/content/generated determinism PASS.
- content validate: `13 masters / 19 servants / 20 events / 0 blocking issues`.
- production Bazett identity routing audit CLEAN.

## Next owner

Stable first-occurrence owner ordering in `data/phase3/full-roster-ability-inventory.json` contains `251` owners. Bazett is zero-based index `7`; the next owner is zero-based index `8`: `master.caren`.

Caren frozen scope is exactly five identities:
- `master.caren.skill.ascension`
- `master.caren.skill.s1`
- `master.caren.skill.s1a`
- `master.caren.skill.s2`
- `master.caren.skill.s3`

Mechanical repository rescan found no canonical `data/authoring/masters/master.caren.json`, no Caren owner-migration acceptance report, and no Caren owner acceptance-sync commit/report in current history. Therefore current canonical Caren coverage is `0/5`; no preservation-only credit is established by current repo evidence.

The next legal FORMAL transaction would be a complete owner-readiness preflight/gap set for all five Caren identities together, but that owner transition is not promoted while the Bazett post-return provenance blocker below remains unresolved.

## Post-return promotion correction

This report records the historical accepted review event, but its initial accounting conclusion is superseded before promotion.

After the review returned, FORMAL read HELPER Epoch 47 and mechanically reproduced a concrete provenance contradiction in exact Candidate `9a457a38aa9118cecee410f6b4c133a1d10fac5c`:

- first Day-3 staging sets `playedRound` to the current round;
- discard-to-skill Day-3 restaging sets `playedRound` to the current round;
- Day-3 zero-cost skill-to-attack join overwrites `playedRound` to the current round and writes `paidManaOnPlay=0`;
- the previously accepted generic source-skill attack-join contract explicitly requires a joined-but-not-played source to remain non-current for `playedRound`, preserving genuine prior play provenance only when it actually exists;
- production `played_this_round` consumers compare `cardState.playedRound` directly to the current round.

Therefore the exact Candidate can classify a non-play Day-3 staging/join as a current-round play. The Reviewer acceptance remains a historical review fact, but promotion/accounting is blocked by this independently confirmed post-return formal verification.

The earlier synchronization commit `ac38ec7a594559e5d8aab918873aca0bb4f8c5ef` is superseded before promotion and is not canonical migration-credit evidence. Strict formal accounting remains `197/944`, remaining `747`. `master.caren` is not yet the active owner.

Bazett must produce a successor Candidate that reconciles Day-3 provenance with the accepted generic source-skill attack-join policy, adds a real cross-consumer `played_this_round` regression, reruns affected gates, and receives a fresh independent review before a new lawful A-sync/accounting transaction.
