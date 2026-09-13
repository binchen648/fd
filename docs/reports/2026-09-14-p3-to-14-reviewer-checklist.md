# P3-TO-14 Reviewer Checklist

- Candidate status expected: `SPEC_REVIEW_READY`
- Review is docs/spec only. Do not fix runtime in the reviewer worktree.

## Denominator

- [ ] Current semantic-axis has exactly 39 `BATTLE_INTEGRATION` abilities / 28 cards.
- [ ] Historical matrix and current semantic-axis are exact-set equal.
- [ ] Exactly 13 rows use the five post-result/ended battle event types.
- [ ] The other 26 are not falsely declared direct Battle Result consumers.
- [ ] The one cross-axis `after_controller_gains_victory` consumer is covered as a Scoring/Battle producer dependency without changing 39/28.

## Owner separation

- [ ] TO-15 ends at final participant power + immutable trace.
- [ ] Battle Result owns winner/tie/loser/exclusion/margin only after frozen inputs.
- [ ] Trigger Gateway owns scheduling/order/optional/cancel/replay.
- [ ] Scoring owns one immutable scoring plan + one consumption receipt.
- [ ] Resource owner performs actual VP/mana/seal mutations with typed result identity.
- [ ] Movement/Card Zone/Lifecycle/Hidden/Special are not absorbed into Battle Result.

## Adversarial schema checks

- [ ] No arbitrary client winner/score/result payload is admissible.
- [ ] Winner eligibility exclusion is orthogonal to winner/loser outcome: an ineligible participating non-winner can still be a loser.
- [ ] A true nonparticipant is neither winner nor loser and is not inserted into the participant outcome set.
- [ ] Loss outcome is not conflated with suppression of loss effects; suppressed loss effects keep a reviewed policy identity.
- [ ] Tie/sole-winner/margin facts are internally consistent.
- [ ] Result identity, trigger identity, scoring plan identity and resource result identity are distinct.
- [ ] Duplicate/stale Recon and battlefield scoring are impossible by contract.
- [ ] Recon +2 VP is a phase-level exactly-once plan/receipt at battle-power-resolution start, not a per-battlefield winner adjustment.
- [ ] Recon recipient set and delta are validated by the reviewed reward policy; arbitrary numeric Recon deltas fail closed.
- [ ] Base battlefield VP source is a closed discriminated union; no `reviewed_rule`, ambiguous `battle_vp`, label parser, or card-ID escape hatch exists.
- [ ] Event-pool share, competition-pool share and reviewed location reward retain typed provenance; personal card/master/servant rewards remain outside the base plan.
- [ ] Base event/competition/location battle rewards and base military adjustments commit before ordinary post-result personal rewards/effects.
- [ ] Result/win/loss/first-loss event identities may be queued before scoring, but their ordinary continuations are blocked by `post_base_scoring` until the base scoring receipt commits.
- [ ] Personal trigger VP never re-enters or rewrites the base battle reward pool.
- [ ] Any true pre-scoring modifier requires a distinct reviewed contract/orderingRef rather than bypassing the barrier.
- [ ] `after_controller_gains_victory` cannot be inferred from arbitrary positive VP/display text and has exactly-once `victoryTransitionId`.
- [ ] Scoring-derived victory triggers settle before terminal `after_battle_ended` / cleanup.
- [ ] Optional post-result interaction can pause after result commit without losing result identity.
- [ ] Failed trigger/scoring dispatch rollback boundaries are explicit.
- [ ] Unknown semantic ordering remains blocked rather than guessed.

## Evidence boundary

- [ ] Golden Flow 2 is used only as representative production-path evidence.
- [ ] Spec does not claim full Power family, 39-row migration, Phase 3 PASS, or release readiness.
- [ ] Diff scope is docs only.

Final: `SPEC_ACCEPTED` only if every blocker above is closed; otherwise `SPEC_NEEDS_REVISION`.
