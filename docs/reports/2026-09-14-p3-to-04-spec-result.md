# P3-TO-04 Lifecycle Policy Gateway Specification Result

- Task: `P3-TO-04`
- Owner: Codex B, specification lane only
- Branch: `codex/b-p3-to-04-lifecycle-gateway-contract`
- Base: `a4897da78f98ca588a28eb18a7f434f6a948fd5d`
- Status: `SPEC_REVIEW_READY`
- Runtime authorization: `NONE`
- Gate promotion: none

## Delivered

1. `docs/plans/2026-09-14-p3-to-04-lifecycle-gateway-contract.md`
   - typed lifecycle source/policy/state/transition concepts;
   - server-owned usage consumption/reset semantics;
   - unique trigger-window claim contract;
   - source active/closed/moved/transformed/missing validity;
   - source-leave cleanup composition for future CLOSE;
   - fixed-duration boundary and cleanup-destination requirements;
   - `remain_active`, projection/reconnect, idempotency, rollback, and external ownership.
2. `docs/audits/2026-09-14-p3-to-04-lifecycle-ability-map.md`
   - exact 11 corrected lifecycle/reset abilities;
   - exact lifecycle-policy memberships;
   - normalized family, start/consume boundary, duration/reset boundary, cleanup ownership, external dependencies.
3. `docs/audits/2026-09-14-p3-to-04-lifecycle-negative-acceptance-matrix.md`
   - 54 fail-closed cases spanning identity, usage/reset, unique group, close composition, duration, cleanup, reconnect, ownership, and rollback.
4. `docs/reports/2026-09-14-p3-to-04-reviewer-checklist.md`
   - independent review checklist and explicit B08 dependency boundary.

## Mechanical Inventory Verification

Direct comparison with `artifacts/phase3-skill-coverage.json`:

```text
sourceRows=11
mapRows=11
uniqueAbilities=11
missing=[]
extra=[]
lifecyclePolicyMembershipMismatches=[]
```

The map preserves every source `lifecyclePolicies` token for every one of the 11 abilities.

## Key Safety Decisions

### Usage consumption is explicit

The generic policy requires an explicit consumption boundary. Prompt creation, decline, cancel, stale replay, and failed transactions do not consume a use unless a separately committed reviewed boundary says otherwise.

For delayed first-trigger forms, `trigger_schedule_commit` exists as an explicit option; Lifecycle does not infer it merely from `per_game` or printed text.

### Unique groups claim on successful activation

A unique group is keyed by controller + semantic groupId + authoritative trigger-window ID. Prompt creation does not claim it. Successful activation atomically claims it; a concurrent/stale second claim cannot also commit.

### CLOSE does not become Lifecycle-owned

`when_card_leaves_active_area` cleans lifecycle-owned state only. Card Action/Card Zone owns moving/closing the source. If cleanup is mandatory for one source transition, movement + lifecycle cleanup compose in one transaction and roll back together.

### Fixed duration does not guess timing or destination

`round_count` requires an explicit boundary convention. The current Artoria Caster `rounds=2` consumer remains runtime-blocked until its exact counting rule is confirmed in the later runtime/reviewer packet.

Movement-producing expiry requires a resolved cleanup destination. Lifecycle may not infer it from names, IDs, current zone, or unreviewed card-type heuristics.

### `remain_active` is not immunity

It suppresses Lifecycle-owned automatic round cleanup movement. Another accepted rule may still close/remove/transform the source.

## Accepted Dependencies

- Trigger Gateway: spec `ac70c33cb943d99d02f1f7077d80b36337014439`, independent acceptance `6ce17aab18ea20cec7e5fcfc6efb4fc5f6384f6e`.
- Interaction Template: reachable acceptance synchronization `7aab428`. Historical TO-05 object referenced by old metadata is not represented as restored.

## Scope Verification

- `git diff --check`: PASS.
- Changes are documentation only.
- No `packages/`, `apps/`, `e2e/`, `data/`, `scripts/`, or `artifacts/` change is made by the TO-04 B spec candidate.
- No runtime, authoring, generated content, taxonomy, KPI, or Gate change is claimed.

## Runtime Boundary

P3-TO-04 acceptance alone must not authorize B08 runtime. B08 still requires exclusive runtime hot-file ownership and a fresh implementation/review candidate limited to exact CLOSE semantics.

## Next Step

Fresh Codex R review of the exact candidate commit.

Allowed outcomes:

- `SPEC_ACCEPTED`
- `PLAN_NEEDS_REVISION`
- `FAILED`