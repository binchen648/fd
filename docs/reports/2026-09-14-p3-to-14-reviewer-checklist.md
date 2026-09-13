# P3-TO-14 Reviewer Checklist

- Candidate status expected: `SPEC_REVIEW_READY`
- Review is docs/spec only. Do not fix runtime in the reviewer worktree.

## Denominator

- [ ] Current semantic-axis has exactly 39 `BATTLE_INTEGRATION` abilities / 28 cards.
- [ ] Historical matrix and current semantic-axis are exact-set equal.
- [ ] Exactly 13 rows use the five post-result/ended battle event types.
- [ ] The other 26 are not falsely declared direct Battle Result consumers.

## Owner separation

- [ ] TO-15 ends at final participant power + immutable trace.
- [ ] Battle Result owns winner/tie/loser/exclusion/margin only after frozen inputs.
- [ ] Trigger Gateway owns scheduling/order/optional/cancel/replay.
- [ ] Scoring owns one immutable scoring plan + one consumption receipt.
- [ ] Resource owner performs actual VP/mana/seal mutations with typed result identity.
- [ ] Movement/Card Zone/Lifecycle/Hidden/Special are not absorbed into Battle Result.

## Adversarial schema checks

- [ ] No arbitrary client winner/score/result payload is admissible.
- [ ] Participant cannot be in winner/loser/excluded sets inconsistently.
- [ ] Loss outcome is not conflated with suppression of loss effects.
- [ ] Tie/sole-winner/margin facts are internally consistent.
- [ ] Result identity, trigger identity, scoring plan identity and resource result identity are distinct.
- [ ] Duplicate/stale scoring is impossible by contract.
- [ ] Optional post-result interaction can pause after result commit without losing result identity.
- [ ] Failed trigger/scoring dispatch rollback boundaries are explicit.
- [ ] Unknown semantic ordering remains blocked rather than guessed.

## Evidence boundary

- [ ] Golden Flow 2 is used only as representative production-path evidence.
- [ ] Spec does not claim full Power family, 39-row migration, Phase 3 PASS, or release readiness.
- [ ] Diff scope is docs only.

Final: `SPEC_ACCEPTED` only if every blocker above is closed; otherwise `SPEC_NEEDS_REVISION`.
