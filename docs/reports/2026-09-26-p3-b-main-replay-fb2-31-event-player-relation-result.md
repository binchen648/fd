# P3-B Current-Main FB2-31 Event-Player Relation Replay

Role: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Date: 2026-09-26

## Exact input

- Formal Base: `ea25b1dac6a6138c0995a709e3283e4d3b49ce02` (`P3-A-MAIN-REPLAY-M50-PLAYER-FLAG-ROUND-STATE-CORE-R2-ACCEPTANCE-SYNC`).
- Historical accepted source Base: `26042ddf24284d2ecbe053ee70cb447c28f03cc2`.
- Historical accepted Candidate: `8d68f64aff1b37e4739ebc922ea4d7192714864c` (PR #375).
- Canonical historical reviewer evidence: `https://github.com/binchen648/fd/pull/375#issuecomment-5742361142`.
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.

## Replayed capability

Only two identity-free trusted-event actor conditions are added:

- `{ type: "event_player_is_controller" }`
- `{ type: "event_player_is_opponent" }`

Semantics preserve the historical accepted seam: evaluation consumes only trusted `AbilityEvent.playerId` and the current ability controller; the controller relation is true only for a known repository player equal to the controller; the opponent relation is true only for a known repository player different from the controller; missing or unknown actors fail closed; evaluation is read-only; the trigger set is not widened.

Historical accepted material contains 27 occurrences and every occurrence is a direct `ability.conditions[i]` node. Current-main therefore admits these exact type-only nodes only at direct ability-condition paths. Nested logical, target-condition, and rule-modifier-condition placements remain unsupported, preventing widening through condition carriers added after the historical FB2-31 review.

No consumer authoring, trigger family, effect family, identity/name/printed-text/Chinese runtime routing, SkillLib fallback, merge, or retarget is introduced.

## Verification

- focused FB2-31 current-main: `1 file / 7 tests PASS`;
- affected chain including accepted player-flag predecessor/R2, M50-01/02, FB2-32/33/42/49, source-state, resolution-dataflow, and MatchSession: `12 files / 164 tests PASS`;
- `match-session.test.ts`: `30/30 PASS`;
- `npm run typecheck`: `PASS`;
- `npm run phase3:coverage`: `PASS`, `blockingIssues=0`;
- current trigger set remains unchanged; synthetic unsupported trigger remains loader-disabled;
- malformed payload-bearing nodes and non-direct condition carriers remain loader-disabled;
- trusted controller/opponent evaluation is read-only; missing/unknown actors fail closed;
- strict reconciliation/evidence loader-ready count remains `17`; this capability alone unlocks no additional full identity because other blockers remain;
- Base-to-Candidate `data/authoring/**`: `EMPTY` by construction;
- migration credit: `0`; formal/material remains `112/944`, remaining `832`.

## Freeze requirement

Final Candidate must be exactly the two production runtime files above, this focused test, and this report. `git diff --check` and exact Base/Candidate scope must pass before fresh R.
