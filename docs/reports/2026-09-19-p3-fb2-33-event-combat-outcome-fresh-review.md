# P3-FB2-33 Event Combat Outcome Conditions — Fresh Independent Review

Reviewer: Codex R
Date: 2026-09-19
Formal verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`

## Review identity

- reviewJobKey: `pr377:5ccef0d682ce0673926e349eda1732419fc0792c`
- Repository: `binchen648/fd`
- PR: `#377`
- Exact review Base: `d858de4c786bd717ac29226a619bd29ed28a3ea1`
- Exact Candidate: `5ccef0d682ce0673926e349eda1732419fc0792c`
- Candidate branch: `codex/b2-p3-fb2-33-event-combat-outcome`
- Base branch: `codex/a-p3-fb2-33-event-combat-outcome-dispatch`
- Reviewer branch: `codex/r-p3-fb2-33-event-combat-outcome-review`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- F1 evidence named by the dispatch: `59f145434695d29bdd17e4cb3adc887e84182377`

## Mechanical recovery

This review recovered the acceptance target from Git, GitHub PR metadata, and repository reports rather than relying on coordinator chat text.

GitHub reports PR #377 OPEN, non-draft, merge state CLEAN, with exact Base branch/OID `codex/a-p3-fb2-33-event-combat-outcome-dispatch` / `d858de4c786bd717ac29226a619bd29ed28a3ea1` and exact Head branch/OID `codex/b2-p3-fb2-33-event-combat-outcome` / `5ccef0d682ce0673926e349eda1732419fc0792c`. Git reports `merge-base(Base, Candidate)` exactly equal to the review Base. The PR contains one Candidate commit and four changed paths.

The dispatch report itself records `8ca5037864fb11d98fe4a17d4ca8c9089bab2609` as its own baseline (the R71 acceptance synchronization from which the dispatch was authored). That is not the review Base. The authoritative Base for this B2 review is the later dispatch commit `d858de4...`, as independently confirmed by the PR base OID and merge-base.

`docs/agents/PHASE3-TASK-INDEX.md` and the exact Base dispatch report define FB2-33 as zero-credit B2 capability work implementing only two identity-free, exact type-only condition nodes:

- `{ type: "event_player_won_combat" }`
- `{ type: "event_player_lost_combat" }`

The accepted input seam is limited to trusted `AbilityEvent.playerId` and trusted `AbilityEvent.battleResult.{winners,loserIds}`. Missing, empty, unknown, malformed, duplicate, or contradictory context must fail closed; the nodes must be condition-route-only; no activation trigger, effect, target, interaction, lifecycle, modifier, consumer migration, event producer, taxonomy/KPI, app, merge, or retarget route may be added. Evaluation must be read-only and identity-free.

`docs/agents/PHASE3-AGENT-CONTRACT.md` defines Codex R as an independent reviewer with default READ ONLY behavior and explicitly separates review from implementation.

## Candidate scope audit

`git diff --name-status Base..Candidate` is exactly:

- `A docs/reports/2026-09-19-p3-fb2-33-event-combat-outcome-result.md`
- `M packages/rules/src/ability/interpreter.ts`
- `M packages/rules/src/ability/loader.ts`
- `A packages/rules/tests/fb2-33-event-combat-outcome.test.ts`

No consumer authoring, production pack/generated product, `data/phase3`, app, task-index, taxonomy/KPI, migration ledger, merge, or retarget change is present. `git diff --check Base..Candidate` passes.

A production-diff token audit found no F1 hash, Locked Reference hash, `core.structured-skill`, consumer `ownerId`, `definitionId`, or `cardId` routing token added by this Candidate.

## Implementation review

### Loader boundary — PASS

`loader.ts` recognizes the two new node types but adds position-aware validation for both:

- placement is accepted only when the scan path begins under top-level ability `conditions`;
- any extra key beyond `type` is reported unsupported;
- unsupported report entries disable automatic execution through the existing loader mechanism.

The loader's existing scans cover effects/cost/creates, target constraints, and modifier-scope constraints. Therefore adding the two types to the shared recognized-type set does not make them executable in non-condition routes.

The Candidate focused test directly covers effect placement. Fresh reviewer-only probes independently covered target constraints and modifier constraints; both produced `Event combat outcome condition is supported only under ability conditions` and disabled the ability.

### Runtime semantics and fail-closed behavior — PASS

`interpreter.ts` adds an exact-shape classifier and a single structural evaluator. The evaluator:

- requires a nonempty `event.playerId` that matches a player in the authoritative state;
- requires `battleResult` with array-valued `winners` and `loserIds`;
- rejects unknown outcome player ids;
- rejects duplicate ids within either result list;
- rejects winner/loser overlap;
- returns true for won only when the known event player is in `winners`;
- returns true for lost only when the known event player is in `loserIds`;
- otherwise returns false without mutation.

Fresh reviewer probes additionally verified false/no-trigger behavior for: empty event player, an event player absent from both outcome lists, both outcome lists empty, duplicate loser ids, unknown loser id, non-array winners, non-array loserIds, and a non-string/unknown winner entry.

The implementation reads state and event data only. No domain event, authoritative mutation, producer, or new trigger route is introduced by condition evaluation.

### Trusted production event path — PASS

Code inspection confirms the established battle-result producer creates `after_battle_result_determined` with trusted `battleResult`. Existing `processEvent(...)` then derives `after_controller_wins_battle`, `after_controller_gains_victory`, and `after_controller_loses_battle` events by preserving that trusted battle result and adding the relevant trusted `playerId`.

A fresh reviewer-only integration probe drove an `after_battle_result_determined` event through that real derived-event path. An effectless per-game tracked ability using `event_player_won_combat` executed for the trusted winner and an effectless tracked ability using `event_player_lost_combat` executed for the trusted loser. A contradictory parent result with the same id in winner and loser lists still caused the new condition to fail closed on the derived event.

### Exact-shape / unsupported-route behavior — PASS

The Candidate test proves both exact type-only classifiers return true and a payload-bearing near-match returns false. Runtime malformed near-match evaluation rejects rather than silently broadening semantics. Loader near-matches are reported unsupported. An otherwise unsupported trigger remains unsupported when paired with either accepted condition type.

## Locked Reference audit

The Candidate checkout's local object store did not contain the Locked Reference repository commit, which is a reviewer-environment layout issue rather than a Candidate defect. The existing clean independent worktree `E:\Codex\FD\fd-reference` was reused instead.

That worktree is detached exactly at `b2f9fa15fba07c63530bbf4612b03b8b704755f9` from `fengling20011118-dotcom/fate-domination`. Fresh inspection of exact `src/content/authoring/cards.json` found `13` occurrences across `event_player_won_combat` / `event_player_lost_combat`, and all `13/13` are exact type-only objects. The repository's formal `phase3:reference:verify` also passes against that exact clean checkout.

## Fresh validation

Environment protocol was followed: an existing clean reviewer worktree with installed `node_modules` was reused; `package-lock.json` was unchanged, so `npm ci` was not rerun; `npm.cmd run typecheck` was executed before any reviewer focused probe. The local `rg` binary was unavailable, so equivalent read-only `git grep` / PowerShell searches were used; this was treated only as a reviewer environment issue.

Fresh results on exact Candidate `5ccef0d...`:

- reviewer worktree typecheck: PASS (`npm.cmd run typecheck`);
- Candidate focused FB2-33: `1 file / 7 tests PASS`;
- fresh reviewer-only contract probes after correcting the probe fixture: `1 file / 4 tests PASS`;
- core + regression + focused selection: `79 files / 489 tests PASS`;
- official CI selection: `147 files / 1032 tests PASS`;
- content validation: `7 masters / 7 servants / 20 events / 0 blocking issues`;
- generated-content determinism: PASS with exact hashes:
  - content library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence report `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`;
- Locked Reference formal verification: PASS at exact `b2f9fa15fba07c63530bbf4612b03b8b704755f9`;
- client production build: PASS; only the existing Vite `node:crypto` browser-externalization warning appeared;
- `git diff --check Base..Candidate`: PASS;
- final pre-report reviewer worktree status: clean;
- GitHub status checks exposed for PR #377: none (`statusCheckRollup: []`).

The first draft of one reviewer-only integration probe paired an `after_controller_loses_battle` synthetic ability with an `adjust_victory_points` effect. That fixture tripped the pre-existing specialized battle-loss VP semantic guard (`Unsupported unpreventable battle-loss VP semantic shape`). This was a reviewer probe-construction error, not an FB2-33 failure. The probe was rewritten to use an effectless per-game usage marker and then passed through the same real derived-event path. All temporary reviewer-only probe files were deleted after execution.

## Boundary and verdict

FB2-33 remains generic infrastructure only and earns zero frozen migration credit. Formal recovery remains `136/944`, with `808` remaining. No consumer is promoted by this review, and historical migration blockage is not changed by accepting this capability Candidate.

No Candidate modification, merge, or retarget was performed. The only repository modification made by Codex R is this reviewer report on the dedicated reviewer branch.

`IMPLEMENTATION_ACCEPTED_CANDIDATE`
