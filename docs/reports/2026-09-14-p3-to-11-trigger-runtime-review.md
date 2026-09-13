# P3-TO-11 Independent Trigger Runtime Review

- Document Role: INDEPENDENT_REVIEW
- Reviewer: Codex R
- Task: `P3-TO-11`
- TargetCommit: `17d96b0057b79883769f9bd266d1f0cfefddbd5d`
- Runtime Base: `427d3e2cdec2e55411559fbf6339ae6948851262`
- Review Branch: `codex/r-p3-to11-trigger-runtime-review`
- Final Status: `IMPLEMENTATION_NEEDS_REVISION`

## Findings

### [P1] TO11 removes an existing public rules-package export

**Blocking.**

`packages/rules/src/ability/interpreter.ts` exposed `collectTriggeredAbilities` as an exported function at the accepted base. `packages/rules/src/index.ts` re-exports the complete interpreter surface with `export * from './ability/interpreter'`, so the function is part of the package root API.

The TO11 candidate changes:

```text
-export function collectTriggeredAbilities(...)
+function collectTriggeredAbilities(...)
```

while adding a new exported helper `triggerEventScopeMatches`.

This API removal is unrelated to the scoped location-trigger migration and can break downstream imports even though repository-local callers do not currently reference the symbol.

Independent runtime probe on the exact target:

```text
collectTriggeredAbilities=undefined
triggerEventScopeMatches=function
```

The existing `package-exports.test.ts` still passes because it does not assert this previously exported symbol. Therefore the green package-export regression does not close the compatibility break.

**Required repair:** preserve the prior `collectTriggeredAbilities` export and add durable package-root export coverage so this surface cannot silently disappear again. No broader TO11 semantic change is required by this finding.

## Non-Blocking Adversarial Checks

### Ereshkigal remains legacy, not falsely migrated

The reviewed candidate intentionally classifies `sc-ereshkigal-2.gain-mana-on-deploy` as unsupported by the TO11 typed semantic because no authoritative source-battlefield anchor exists.

Independent probe with Netherworld Protection controlled by `p1` at Miyama and a deployment event at Shinto produced:

```text
classifier=false
manaAfter=5
 typedManaEvent=false
processed=true
```

Starting mana was 4. This shows the row still executes through the pre-existing generic legacy trigger/effect path; it is not routed through the new typed Resource Numeric trigger semantic. The target diff only adds `locationId` to the deployment event and does not introduce an Eresh-specific route.

This is retained technical/rules debt, consistent with the implementation report's `SOURCE_BATTLEFIELD_ANCHOR_REQUIRED` skip. It must not be counted as migrated or accepted by inheritance. It is not introduced by the TO11 typed slice and is not the reason for this review rejection.

### Semantic identity routing

The candidate's TO11 classifier itself is semantic and contains no Shinji/Ereshkigal card or ability identity branch in the runtime routing files. The dedicated renamed-ability test passes.

### Loader admission and focused behavior

Fresh reviewer environment verification:

```text
npm run typecheck
PASS

package-exports.test.ts + trigger-resource-runtime.test.ts
PASS: 2 files / 11 tests
```

The dedicated TO11 tests confirm wrong/missing location rejection, replay dedupe, typed mana cap/block behavior, malformed candidate rollback, and real movement event production. These checks do not override the public API blocker.

## Diff / Scope Judgment

The core semantic change is narrow and generally consistent with the accepted Trigger Gateway:

- fixed location metadata is authored rather than parsed from text;
- discovery checks the trusted event destination;
- server movement creates the location event;
- exact supported trigger-resource shape routes to typed Resolution Data-flow;
- malformed recognized shape fails closed rather than retrying legacy;
- deployment payload gains `locationId` without claiming Eresh migration;
- generated product content is synchronized.

However, removing an unrelated previously exported function violates compatibility and is outside the authorized semantic delta.

## Gate Judgment

Gate promotion is blocked pending repair.

- Gate A: **NOT ACCEPTED** because the candidate introduces an unrelated root-package API regression.
- Gate B: **NOT ACCEPTED** until the repaired exact candidate is independently re-reviewed.
- Gate C: not applicable to the current finding; no projection/reconnect change is claimed.

No A-owned KPI/taxonomy synchronization is authorized from this review.

## Required Next Step

Create a separate Codex B repair branch/worktree from exact candidate `17d96b0057b79883769f9bd266d1f0cfefddbd5d` and make only the compatibility repair:

1. restore `export` on `collectTriggeredAbilities`;
2. add a package-root regression asserting the export remains a function;
3. rerun typecheck, TO11 focused tests, package-export regression, generated-content determinism, and the inherited full-suite baseline;
4. submit the new exact candidate for a fresh independent review.

## Final Judgment

`IMPLEMENTATION_NEEDS_REVISION`
