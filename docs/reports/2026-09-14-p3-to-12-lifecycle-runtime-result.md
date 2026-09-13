# P3-TO-12 Lifecycle Runtime Result

- Date: 2026-09-14
- Task: P3-TO-12
- Owner lane: Codex B runtime
- Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
- Base: `c1facfb7c203ed6078c61613d92386cfe81a83cc`
- Branch: `codex/b-p3-to12-lifecycle-runtime`
- Accepted dependency: P3-TO-04 Lifecycle Gateway spec `b46cfa4439c27112d14066e2239e7524f5a1e137`, independent review `d1e13d84b31bcbb57a6326ce9ea803fa877c651c`, `SPEC_ACCEPTED`

## Scope

P3-TO-12 is limited to the first source-active duration/cleanup slice. It does not migrate the full 11-row Lifecycle denominator.

Representative migrated:

- `servant.artoriac.skill.sc-artoriac-3#sc-artoriac-3.discard-public-and-power-formula`
- lifecycle: `while_card_active`
- cleanup: `when_card_leaves_active_area`
- start: immediate
- lifecycle-owned effect: continuous public discard visibility plus existing source-card power modifier lifetime
- result: **MIGRATED AS CANDIDATE**

Not promoted by inheritance:

- Artoria Alter `sc-artoria-alt-2.angra-mainyu-embrace` remains outside this slice because it composes with Trigger + `close_source_card` behavior.
- Ereshkigal `sc-ereshkigal-2.netherworld-protection` remains outside this slice because it composes with Battle/Location and `remain_active` semantics.
- fixed-duration, per-round, per-game, and unique-window rows remain outside this candidate.

Local slice result: **eligible=1 / migrated candidate=1 / dual=0**.

## Source-State Policy Boundary

The accepted TO-04 contract requires `while_card_active` to consume a resolved Card Zone/source-state policy rather than hard-code active zones inside Lifecycle.

This candidate therefore adds a narrow external helper:

```text
policyId=fd.card-zone.active-card-source.v1
owner=card_zone_source_state
kind=accepted_source_state_policy
```

The helper is backed by canonical `FD-Game-Rules-Final` sections 11.1, 11.3/Residual, and 11.4/Close semantics and validates:

- exact source card instance still exists;
- controller identity is unchanged;
- source definition is unchanged;
- source ability still exists on the current definition;
- source remains an active, face-up card in an active board area according to the Card Zone/source-state helper.

Important review boundary: **the policy implementation is bundled with this TO12 candidate and is not self-declared independently accepted**. The fresh reviewer must decide whether this Card Zone-owned source-state adapter is an admissible resolution of the TO-04 external dependency. No prior P3-TO-09 direct Card Zone candidate is treated as supplying this acceptance.

## Implementation

### Authoring and compiler admission

Artoria Caster SC3 now explicitly carries:

```json
"sourceValidity": {
  "kind": "accepted_source_state_policy",
  "owner": "card_zone_source_state",
  "policyId": "fd.card-zone.active-card-source.v1"
}
```

Loader/compiler admission rejects:

- unknown source-validity policy IDs;
- wrong policy kind/owner;
- source-validity metadata on non-`while_card_active` lifecycle;
- unsupported cleanup pairing.

Executable compiler negative coverage proves malformed policy metadata fails closed rather than silently falling back.

### Server-owned lifecycle state

Source-bound ongoing records now retain:

- semantic `policyKey`;
- source definition at install;
- source-validity policy ID;
- install revision;
- server-owned lifecycle transition history.

Transitions used by this slice:

- `install`;
- `source_invalidated`.

The runtime does not use character/card/ability identity to decide eligibility. The canonical ability ID is evidence only; a renamed ability with the same semantic lifecycle shape and sourceValidity policy follows the same path.

### Source invalidation and cleanup

Lifecycle does not move or close the source card.

External Card Action/Card Zone mutation occurs first inside the cloned dispatch. `cleanupOngoing` then revalidates the lifecycle source. If the source is no longer valid:

1. a server-owned `source_invalidated` transition is recorded once;
2. the ongoing record is removed;
3. public discard visibility disappears with that lifecycle record;
4. the external source transition and lifecycle teardown commit together when the dispatch succeeds.

If source-bound lifecycle state is corrupt or the source-validity policy is unsupported, the authoritative dispatch does not commit. Projection/admission also fails closed for missing install-transition identity instead of silently accepting a corrupt restored record.

### Reconnect/idempotency

- reload/reconnect does not reinstall lifecycle state;
- projection reads the persisted server lifecycle record;
- duplicate/stale client replay cannot create a second close/cleanup transition;
- projection itself does not mutate lifecycle transition history.

## Scope Expansion For Reviewer Judgment

The queue names `interpreter.ts`, `match-session.ts`, `combat-resolver.ts`, and tests as the expected runtime area. Satisfying the accepted TO-04 source-validity contract required a narrowly scoped dependency surface beyond that shorthand:

- `packages/rules/src/core/card-source-state.ts` — Card Zone-owned source-state policy helper;
- `packages/rules/src/ability/types.ts` — lifecycle record/transition state;
- `packages/rules/src/ability/loader.ts` — fail-closed policy admission;
- one Artoria Caster authoring row plus deterministic generated content.

No MatchSession or combat semantics were changed. No other lifecycle consumer was marked migrated. This extra surface is intentionally exposed for independent scope review rather than hidden as an implied dependency.

## Generated Product Pack

Formal content compile result:

```text
7 masters, 7 servants, 20 events, 0 blocking issues
```

Generated product content contains the SC3 sourceValidity metadata and deterministic definition hash:

```text
26167661823b52de598c77a59df4d05440a6bfced7d68cd3e04d11353d72dbaa
```

Only `data/generated/fd-playtest-v1.content-library.json` changed among generated outputs. Golden compiled-content/hash regression passes.

## Verification

- `npm.cmd run typecheck`: **PASS**.
- `npm.cmd run content:compile`: **PASS**, 0 blocking issues.
- Final focused suite:
  - `lifecycle-source-active-runtime.test.ts`
  - `executable-card-pack.test.ts`
  - `golden-card-content-pipeline.test.ts`
  - `complex-skills-regression.test.ts`
  - `ability-interaction-projection.test.ts`
  - `package-exports.test.ts`
  - `match-session.test.ts`
  - result: **7 files / 98 tests PASS**.
- Source-active lifecycle focused regression: **7/7 PASS**.
- Executable compiler coverage: **21/21 PASS**.
- Browser Gate C candidate:
  - `e2e/fd-lifecycle-source-active.spec.ts`
  - two clients / server projection / WebSocket expectedRevision / reload+reconnect / external CLOSE / stale replay
  - final `--repeat-each=5`: **5/5 PASS**.
- Final root Vitest baseline:
  - **96 files total**
  - **86 passed / 10 failed**
  - **590 tests total**
  - **570 passed / 20 failed**
  - all 20 failures match the inherited local CHM/original-image asset absence class already present before TO12; no TO12 functional regression is present in that failure set.
- Runtime identity-routing audit for `servant.artoriac`, `sc-artoriac-3`, and `discard-public-and-power-formula`: **0 matches**.
- `git diff --check`: **PASS**.

## Fail-Closed Evidence

Covered in focused tests:

- malformed/unknown source-validity policy rejected by loader;
- malformed/unknown source-validity policy rejected by executable compiler;
- source instance/definition/ability/controller validity is server-owned;
- duplicate install does not stack a second lifecycle record;
- round change does not expire `while_card_active` while source remains valid;
- external CLOSE removes source from active area and tears down lifecycle state in the same successful dispatch;
- corrupt policy prevents authoritative commit;
- missing install transition in restored/corrupt lifecycle state fails closed;
- reconnect/projection does not reinstall or mutate transition history;
- renamed ability proves semantic routing rather than ability-ID eligibility.

## Gate / Review Judgment

This task claims only an implementation candidate.

- Gate A: **not self-promoted**.
- Gate B: **not self-promoted**.
- Gate C: **not self-promoted**, despite browser evidence being present.
- Global 11-row Lifecycle denominator/KPI: unchanged by this task.
- A-owned coverage/taxonomy artifacts: not edited.
- No other Lifecycle row inherits this candidate's status.

A fresh independent reviewer must pin the exact candidate commit and judge at least:

1. whether the bundled Card Zone/source-state policy legitimately satisfies TO-04's resolved source-validity dependency;
2. whether the extra loader/types/core/authoring surface is justified by TO12 scope;
3. semantic routing/no identity branch;
4. source-close + lifecycle teardown atomicity;
5. corruption/reconnect/idempotency fail-closed behavior;
6. generated pack/hash determinism;
7. browser projection/reconnect/stale-replay evidence;
8. the inherited 20-failure asset baseline.
