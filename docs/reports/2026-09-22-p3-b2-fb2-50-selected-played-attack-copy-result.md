# P3-B2 FB2-50 Selected Played Attack Temporary Copy Result

Role: Codex B2
Status: `CANDIDATE_READY_FOR_FRESH_R`
Date: 2026-09-22

## Exact dispatch input

- Task: `P3-FB2-50-SELECTED-PLAYED-ATTACK-TEMPORARY-COPY`
- Exact A dispatch Base: `c6c5470ef944c3c599cc66748a21e7588f2cde11`
- A dispatch branch: `codex/a-p3-fb2-50-selected-played-attack-copy-dispatch`
- B2 branch: `codex/b2-p3-fb2-50-selected-played-attack-copy`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Formal migration remains **`152/944`**, with **`792`** remaining. FB2-50 earns zero migration credit.

## Implemented bounded semantic

FB2-50 adds one identity-free whole-ability envelope for the exact Atalanta-S2-shaped temporary attack-copy transaction:

1. action-phase controller action-window activation;
2. exact source-active plus positive controller deployment-bonus conditions;
3. exactly one controller-owned attack-area target, different from the source and played this round;
4. settlement revalidates exact target provenance, attack classification, active/face-up state, current-round play state, source state and deployment bonus before mutation;
5. creates exactly one same-definition public active face-up temporary attack copy;
6. the copy costs no mana, does not route through ordinary play, does not increment play counters and emits no ordinary card-play semantics;
7. the temporary copy is explicitly non-played (`playedRound: 0`) and therefore cannot recursively qualify as another copy source;
8. lifecycle is exact `this_round` and removes the generated copy from game on the next round even if the copy was already closed;
9. malformed authoring, forged/stale selections, provenance drift and unsupported payload fields fail closed without committing partial mutation;
10. no generic clone API and no consumer authoring are added.

## Dedicated gateway

`packages/rules/src/ability/selected-played-attack-temporary-copy.ts` owns the exact whole-ability classifier and reserved compound effect token. `loader.ts` admits the token only through that exact envelope and rejects near-miss authoring at `selectedPlayedAttackTemporaryCopy.gateway`.

Runtime settlement stays inside the existing ability interpreter and uses the already-authenticated pending target selection. No card id, servant id, localized name or consumer identity routing exists in production runtime.

## Focused regression

`packages/rules/tests/fb2-50-selected-played-attack-copy.test.ts` covers:

- exact raw and compiled admission plus malformed near-miss rejection;
- candidate filtering to current-round controller attacks only;
- exactly one free same-definition active face-up temporary copy;
- no ordinary play counters or play events;
- next-round expiry/removal including a copy already closed before cleanup;
- mutation-free rejection on outsider/stale/provenance drift;
- source/deployment-condition settlement revalidation;
- structured-clone persistence and exactly-once settlement;
- generated copy cannot recursively qualify because it is not a played card.

## Validation

Final validation on the exact working tree before commit:

- `git diff --check` — PASS.
- `npm.cmd run typecheck` — PASS.
- focused compatibility suite — PASS, **6 files / 99 tests**.
- official `npm.cmd run test:ci -- --maxWorkers=2` — PASS, **179 files / 1329 tests**.
- `npm.cmd run content:validate` — PASS, **7 masters / 7 servants / 20 events / 0 blocking issues**.
- `npm.cmd run verify:generated-content` — PASS with unchanged deterministic hashes.
- `npm.cmd run build --workspace @fd/client` — PASS; only pre-existing Vite browser-externalization/chunk-size warnings are emitted.
- fixed toolchain verification — `FD_TOOLCHAIN_OK`.

## Candidate scope

The Candidate contains only:

- `packages/rules/src/ability/selected-played-attack-temporary-copy.ts`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/types.ts`
- `packages/rules/src/ability/loader.ts`
- `packages/rules/src/index.ts`
- `packages/rules/tests/fb2-50-selected-played-attack-copy.test.ts`
- this result report

There is no `data/authoring/**`, consumer identity, generated product delta, client production change, KPI redefinition, migration credit change, merge or retarget.

## Next gate

This is only a B2 implementation Candidate. Fresh independent R must review the exact Base/Candidate pair. After exact fresh R acceptance and A synchronization, freshly re-overlay the complete `servant.atalanta.skill.sc-atalanta-2`; singleton S is allowed only if the whole card is mechanically zero-gap.

## R1 revision: pending-decision integrity closure

The first independent-review handoff for PR #425 returned `IMPLEMENTATION_NEEDS_REVISION` for exact remote Candidate `71cf84b67063a2a5a28683a1d29b7078c110f09a`. The linked GitHub evidence comment currently contains only the independent-review marker, so this revision does not invent or attribute unavailable prose findings.

Mechanical re-verification against the dispatch contract's explicit stale/forged-decision requirement produced a concrete red regression: after the exact ability opened its generic pending target decision, replacing persisted `pendingDecision.remainingEffects` with an arbitrary `adjust_victory_points` payload was accepted and executed. The new regression failed before the fix with `choose(...).ok === true`.

The revision closes that integrity gap without broadening the mechanic:

- FB2-50 now stamps its existing `PendingDecision` with dedicated identity-free provenance metadata;
- settlement verifies source/controller/ability/target/effect/continuation/revision/candidate metadata before mutation;
- settlement reconstructs the authoritative context/effect from the compiled ability instead of executing mutable persisted `remainingEffects`;
- current target eligibility is re-derived server-side at settlement;
- exact attack eligibility uses the stable card-play classification for this bounded transaction, including valid `master_deck_card` attacks, instead of the narrower legacy helper;
- the forged persisted-effect regression is now green and mutation-free.

No consumer authoring, migration credit, generic cloning API, merge, or retarget is added.

## R2 revision: malformed persisted-state fail-closed

Fresh independent R for exact Candidate `cee18930d4d1af0381bcd4720d69cb25ff3cdd58` returned `IMPLEMENTATION_NEEDS_REVISION` with a concrete blocker: malformed persisted FB2-50 pending-decision subobjects could be dereferenced before validation and raise native `TypeError` outside `RuleRejection`.

The repair stays bounded to the existing FB2-50 interaction path. The pending-decision root and required subobjects are treated as `unknown` and validated before property/array use, including `context`, `remainingEffects`, `interaction.constraints`, `candidates`, and `interaction.candidateIds`. Malformed state now rejects through `RuleRejection`, so dispatch returns `ok:false` and leaves the authoritative state unchanged.

Focused red-to-green regressions cover missing `context`, missing `remainingEffects`, non-array `candidates`, missing `interaction.constraints`, and non-array `interaction.candidateIds`. Candidate-scope evidence now also lists `packages/rules/src/ability/types.ts`, correcting the reviewer's non-blocking evidence-hygiene finding.
