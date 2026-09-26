# P3-A FB2-37 Deployment Destinations Replacement Dispatch

Role: Codex A
Status: `DISPATCHED`
Date: 2026-09-20

## Baseline

- Exact formal migration Base: `cebd96a34845c109b87ddb0d6563628cd906305d`
- Formal migration accepted: `139/944`
- Formal remaining: `805`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

PR #381 / Ibaraki remains pending independent migration review and is not part of this lineage.

## Closure target

Migration-closure-first overlay selects the nearest one-seam frozen target `master.kayneth.skill.s3`.

Reference/F1 semantics require exactly one permanent passive deployment-destination replacement:

- operation: `replace`
- rule: `deployment_destinations`
- scope subject: `controller`
- destination filter:
  - `locationKind: battlefield`
  - `opponentCountEquals: 1`
  - `opponentVictoryPoints: less_than_controller`
- lifecycle: `{ duration: "permanent" }`
- priority: `{ tier: "card_text", specificity: "explicit_exception" }`
- conflictPolicy: `explicit_exception_over_general`

This B2 task does not migrate that consumer and earns zero migration credit.

## Exact implementation scope

Implement one identity-free structural seam only:

1. Add an exact classifier for the modifier shape above. Near matches must fail closed, including wrong numeric type, extra structural keys, wrong lifecycle, wrong priority/conflict policy, broader destination filters, or any identity/definition-id/text selector.
2. Loader may admit `deployment_destinations / replace` only when that exact classifier succeeds. Do not add the rule to an unrestricted generic whitelist.
3. The authoritative MatchSession deployment eligibility path must consume the exact structural modifier and apply the already-existing lower-VP lone-battlefield filtering behavior.
4. Preserve current product compatibility for the existing generic legacy `deployment_rule_override / must_deploy_to_lower_vp_lone_battlefield` effect until consumer/product material is migrated; do not route by Kayneth identity.
5. Rename any production helper whose name encodes Kayneth/Pride identity to a structural name.
6. If at least one qualifying legal battlefield exists, deployment choices are replaced by exactly those qualifying locations. If none exists, ordinary legal deployment choices remain unchanged.
7. Source controller/zone and current player/location/VP/occupancy state must be evaluated authoritatively at query/dispatch time.

## Forbidden scope

- no canonical consumer identity, name, printed text, F1 hash, Locked Reference hash, or Reference handler routing in production;
- no `data/authoring/**` consumer migration;
- no pack/generated product mutation;
- no merge/retarget;
- no broad deployment DSL or unrelated movement/deployment capability;
- no migration credit.

## Required validation

Fresh B2 must prove:

- exact classifier accepts only the dispatched structural shape;
- loader zero-issue automatic compile for the exact synthetic shape and fail-closed near matches;
- authoritative ordinary legal-deployment projection and dispatch both enforce the replacement;
- lower-VP, exactly-one-opponent battlefield filter is exact;
- no qualifying destination means no forced replacement;
- wrong controller / source absent from eligible source zone does not apply;
- legacy product deployment behavior remains unchanged;
- typecheck, focused, rules core+regression, official CI, content validation, generated determinism, Locked Reference verify, client build, diff-check, final cleanliness;
- production diff hardcode audit is clean;
- formal migration remains `139/944`, remaining `805`.

After fresh R `IMPLEMENTATION_ACCEPTED_CANDIDATE` and A synchronization, immediately re-overlay and dispatch `master.kayneth.skill.s3` to fresh S if no new blocker appears.
