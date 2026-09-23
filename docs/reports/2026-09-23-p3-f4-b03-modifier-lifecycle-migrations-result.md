# P3 F4 B03 Modifier/Lifecycle Migration Batch Result

Date: 2026-09-23
Task: `P3-F4-B03-MODIFIER-LIFECYCLE-MIGRATION-BATCH`
Branch: `codex/batch-p3-f4-b03-modifier-lifecycle-migrations`
Exact Base: `9cb15f78513bb2281fef03d5fa5ce172ee0ea4b6` (R117 B02 acceptance sync)
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Batch scope

This BATCH-FIRST Candidate migrates exactly two fresh frozen identities from the existing F1/source-grounded evidence without redoing whole-roster classification:

- `servant.mozart.skill.sc-mozart-1` — Mozart `小夜曲`
- `servant.edison.skill.sc-edison-3` — Edison `W·F·D`

Both are implemented through one bounded identity-free modifier/lifecycle family. Production runtime contains no Mozart/Edison/Chinese-name identity routing.

## Runtime closure

### Mozart / 小夜曲

- exact action-phase active-source ability installs a this-round opponent movement-destination forbid from `magic_workshop`;
- the installed lock remains for the round even if the source later closes and expires on the next round;
- exact action-phase schedule arms one next-round `+3` card-power boost for the authored linked Requiem definitions;
- schedule state is server-owned and cross-checked against source definition, controller, arm ability, target ability, armed round, due round, exact definition list, amount and duplicate keys;
- malformed, stale, widened, duplicate or forged pending/active schedule state fails closed.

### Edison / W·F·D

- while the residual source is active, same-battlefield opponent `魔术` attacks and the authored Luck definitions have card power set to `0`;
- controller deployment advantage receives `+2`; ordering matches Locked Reference: additive deployment-advantage changes occur before the existing multiplier;
- battle resolution freezes participant attack attributes from authoritative participant facts;
- the exact post-scoring `after_battle_result_determined` path closes the source only when the controller participated at that battlefield and the frozen combat contained `魔术`;
- forged/tampered battle identity/provenance fails closed against the trusted result root.

## Frozen source evidence

The focused batch test re-hashes the actual migrated `printedText` and every B03 `printedClause` against the frozen F1 hashes. Locked Reference is used for static metadata and semantic cross-checks only, preserving the repository source-priority contract.

## Validation

- `FD_TOOLCHAIN_OK`
- B03 focused: `1 file / 9 tests PASS`
- affected regression bundle: `19 files / 186 tests PASS`
- `npm run typecheck`: PASS
- `npm run content:validate`: PASS (`0 blocking issues`)
- `git diff --check`: PASS
- frozen roster recount: denominator `944`, material overlap `159`, duplicate frozen IDs `0`
- exact B03 identities are each materialized exactly once
- changed production source identity/name scan: `0` Mozart/Edison identity-routing hits

Per user-authorized BATCH-FIRST F4, no fixed full-suite gate is imposed on every batch. Full CI / validate / coverage / audit / determinism remain mandatory for F4/F5 convergence and will be repeated until all formal gates are green.

## Accounting

Pre-B03 synchronized baseline:

- formal migration: `161/944`
- remaining: `783`
- material authoring overlap: `157/944`

This Candidate changes material overlap exactly `157/944 -> 159/944` with zero removals and zero duplicate frozen IDs.

Before fresh independent R, formal migration remains `161/944`. Only an exact fresh independent `IMPLEMENTATION_ACCEPTED_CANDIDATE` for this Candidate plus A synchronization may award the two fresh identities, advancing formal migration to `163/944` with `781` remaining. No merge or retarget is authorized.
## R1 Revision Closure

Rejected Candidate: `b7697943fba9d88dafde77fe5eb04118e4068903`
Reviewer evidence: `https://github.com/binchen648/fd/pull/436#issuecomment-5789777778`
Verdict: `IMPLEMENTATION_NEEDS_REVISION`

Both exact-scope blocking findings are closed in one successor revision:

1. **Real MatchSession next-round promotion**
   - `runFullMatch` no longer mutates `roundNumber` before `startRound` observes the transition.
   - `startRound` preserves the previous round and advances B03 schedule state exactly once on an old->new boundary while keeping the existing phase-event/setup ordering.
   - production-path regression uses `MatchSession.runFullMatch` to prove Mozart's armed +3 is active in the exact next round and expires after that round.

2. **Loss-suppressed controller remains a real B03 battle participant**
   - ordinary result/loss triggers keep the existing suppression-filtered loser semantics.
   - B03 combat-attribute provenance now freezes the authoritative full `participantBreakdowns` participant set independently of the suppression-filtered result-event participant set.
   - production-path regression uses active Basic Luck to suppress the W·F·D controller's loss effects while still proving W·F·D closes when the same frozen battle contains Magic.

Revision validation:
- B03 focused: **1 file / 11 tests PASS**.
- Reviewer-targeted B03 + MatchSession + FB2-47 + B01: **4 files / 57 tests PASS**.
- affected movement / terrain / combat / game-loop / replay / MatchSession / B01-B02-B03: **19 files / 188 tests PASS**.
- `npm run typecheck`: PASS.
- `npm run content:validate`: PASS, `0 blocking issues`.
- `git diff --check`: PASS.
- frozen material recount remains **159/944**, zero duplicate frozen IDs.

Accounting is unchanged until fresh independent review of the successor Candidate: formal migration remains **161/944**, with **783** remaining. Exact acceptance plus A synchronization may award only the same two fresh B03 identities, advancing formal migration to **163/944**.
