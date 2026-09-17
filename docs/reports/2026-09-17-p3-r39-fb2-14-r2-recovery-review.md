# P3-R39 FB2-14 r2 Recovery Review

Date: 2026-09-17
Reviewer: Codex R
Status: `REVIEW_BLOCKED`

## Pins

- Target: `3879203870bb05ad9619c03c60c69ed9e1941080`
- Base / A handoff: `50602c9355794c9c0c7fe4d79b75f7936d912c17`
- Prior r1 candidate: `86afe51311ff2b6cd05ea403044e8e226b0cde7d`
- Fresh reviewer worktree: `E:\Codex\FD\fd-fb2-14-r2-review-r39-recovery`
- Fresh reviewer branch: `codex/r-p3-fb2-14-r2-review-r39-recovery`
- Fresh reviewer thread: `01a0adcc-a41a-7572-a460-17ef803b34aa`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

The reviewer independently read the Phase 3 agent contract, the P3-FB2-14/P3-R39/P3-FM08 task blocks, the A handoff, the B2 result reports, and the exact `50602c9..3879203` candidate diff. The reviewer made no repository changes while reviewing. The worktree was clean at the pinned target before the report was materialized.

## Blocking Finding

### P1 - raw execution metadata is not fail-closed

`packages/rules/src/ability/loader.ts` normalizes authority with:

```ts
const requested = execution.hostOps ?? execution.allowedOperations;
```

For automatic abilities containing `install_rule_override`, missing authority normalizes to an empty `allowedOperations` array. `isGameStartRuleOverrideSemantic` later validates only the normalized execution object and therefore cannot distinguish legal absence from raw authority that was discarded during normalization.

The fresh reviewer identified two raw payload classes that violate the handoff's fail-closed boundary but can normalize into an accepted semantic shape:

```json
{
  "mode": "automatic",
  "hostOps": [],
  "allowedOperations": ["adjust-mana"]
}
```

The nullish-coalescing selection keeps the empty `hostOps` array and hides the simultaneous nonempty `allowedOperations` declaration.

```json
{
  "mode": "automatic",
  "unknownExecutionAuthority": true
}
```

Unknown execution keys are not rejected before the normalized execution object is built, so the unknown authority metadata is discarded before semantic classification.

Required correction: validate the complete raw `execution` object before normalization. Reject unknown execution keys, reject simultaneous `hostOps` plus `allowedOperations`, and reject any nonempty operation authority for this automatic game-start RuleOverride contract.

## Other Reviewed Areas

The fresh reviewer reported no additional blocker in:

- first-round game-start ordering and Situation mana timing;
- processed-event idempotency and persistence;
- the eleven whitelisted RuleOverride effect shapes;
- shared mana-gain accounting;
- generic consumer routing;
- movement restriction and trusted bypass behavior;
- hidden-event and opponent-discard projection boundaries;
- identity/name/printed-text independence;
- authoring scope and zero FM08 migration in the runtime candidate;
- exact Base -> Target lineage.

This statement does not convert those areas into migration acceptance; it only records that no second blocker was found during this review of the runtime candidate.

## Verdict

`REVIEW_BLOCKED`

P3-FB2-14 r2 remains `IMPLEMENTATION_COMPLETE_CANDIDATE`. P3-FM08 remains `BLOCKED_ON_FB2_14_R39_A_SYNC` and must not proceed from this target. Strict accepted canonical overlap remains `101/944`.

A corrected B2 candidate must receive a new fresh independent R39 review before A may synchronize FB2-14 acceptance or release FM08.

The prior r1 acceptance chain must not be used as substitute evidence for this gate.
