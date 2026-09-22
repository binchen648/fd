# P3-B2 FB2-50 Selected Played Attack Temporary Copy Result

Role: Codex B2
Status: `CANDIDATE_READY_FOR_FRESH_R`
Date: 2026-09-22

## Exact dispatch input

- Task: `P3-FB2-50-SELECTED-PLAYED-ATTACK-TEMPORARY-COPY`
- Exact A dispatch Base: `c6c5470ef944c3c599cc66748a21e7588f2cde11`
- A dispatch branch: `codex/a-p3-fb2-50-selected-played-attack-copy-dispatch`
- B2 branch: `codex/b2-p3-fb2-50-selected-played-attack-copy`
- A dispatch report: `docs/reports/2026-09-22-p3-a-fb2-50-selected-played-attack-copy-dispatch.md`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Formal migration remains **`152/944`**, with **`792`** remaining. FB2-50 earns zero migration credit.

## Implemented bounded semantic

FB2-50 adds one identity-free whole-ability envelope and one dedicated compound effect token:

`create_selected_played_attack_temporary_copy`

The accepted runtime path is bounded to the dispatched structure:

1. automatic Action-phase phase action in `controller_action_window`;
2. exact source-active condition plus exact `controller.deployment_bonus > 0` server metric condition;
3. exactly one controller-owned/controller-controlled `attack_area` target;
4. exact target constraints `is_attack`, `played_this_round`, `not_source_card`;
5. exact effect payload `{ type: create_selected_played_attack_temporary_copy, target: selected_attack }`;
6. settlement revalidates source conditions plus selected owner/controller/zone/attack/current-round provenance before mutation;
7. creates exactly one same-definition controller-owned/controller-controlled public attack-area card;
8. generated copy is active, face-up, and has `playedRound: 0`, so it is explicitly not a normal card play;
9. no mana is charged, no ordinary play counter is incremented, and no `on_card_played` event is emitted;
10. a dedicated round lifecycle removes the temporary copy from play when the next round begins, including if it was already closed before expiry.

The implementation does not add a generic clone API, arbitrary copy count/destination/face/activity parameters, consumer identity routing, or consumer authoring.

## Fail-closed boundary

`packages/rules/src/ability/selected-played-attack-temporary-copy.ts` owns exact structural admission. The loader reserves only the dedicated compound token and routes malformed near-misses to `selectedPlayedAttackTemporaryCopy.gateway` as unsupported.

The runtime rejects before mutation when the selected target is stale or forged, including wrong owner, wrong controller, wrong zone, non-attack definition, source selection, or non-current-round `playedRound`. Source-active and deployment-bonus conditions are also re-evaluated at settlement through the authoritative server state.

The temporary lifecycle stores exact copied-definition provenance and rejects corrupt lifecycle/card state before round-transition mutation. Existing generic authenticated `PendingDecision` dispatch, structured-clone persistence and replay rejection remain the transport boundary; FB2-50 does not add a new client command or public cloning surface.

## Focused evidence

`packages/rules/tests/fb2-50-selected-played-attack-copy.test.ts` covers 8 focused cases:

- exact raw/compiled admission and malformed-shape rejection;
- exact target eligibility;
- same-definition copy fidelity;
- free active face-up attack placement;
- no mana charge, no play-counter change, and no ordinary play event;
- round-expiry cleanup even after early close;
- stale/forged target and source/deployment drift rejection with transactional state preservation;
- structured-clone persistence, one-shot settlement/replay rejection, and corrupt persisted lifecycle fail-closed behavior.

Affected focused regression run: **7 files / 102 tests PASS**.

## Full validation

- `npm.cmd run typecheck` — PASS.
- focused FB2-50 + FB2-49 + source-state + interaction projection + room + complex-skill regressions — PASS, **7 files / 102 tests**.
- official `npm.cmd run test:ci -- --maxWorkers=2` — PASS, **179 files / 1329 tests**.
- `npm.cmd run content:validate` — PASS, **7 masters / 7 servants / 20 events / 0 blocking issues**.
- `npm.cmd run verify:generated-content` — PASS with unchanged hashes:
  - content library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence report `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- `npm.cmd run build --workspace @fd/client` — PASS; only the existing Vite browser-externalization/chunk-size warnings were emitted.
- `npm.cmd run phase3:coverage` — PASS: **128 archives / 170 cards / 282 abilities / 0 blocking issues**, `newRuntimeSemanticRouted=22`, `dualRuntime=0`.
- generated `artifacts/phase3-skill-coverage.json` restored byte-for-byte to exact Base after validation.
- production Candidate identity audit — PASS: no Atalanta/card/name/text literal routing in changed production files.
- `git diff --check` — PASS.

## Candidate scope

The intended Candidate contains exactly these six paths:

- `packages/rules/src/ability/selected-played-attack-temporary-copy.ts`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/loader.ts`
- `packages/rules/src/index.ts`
- `packages/rules/tests/fb2-50-selected-played-attack-copy.test.ts`
- this result report

There is no `data/authoring/**`, consumer migration, generated product, client production, KPI definition, full-roster count, Task Index, or Reference change.

## Accounting / next gate

FB2-50 is zero-credit capability infrastructure. Formal project migration remains **`152/944`**, with **`792`** remaining.

This is only a B2 implementation Candidate. Fresh independent R must review the exact Base/Candidate pair before capability acceptance synchronization. After exact fresh R acceptance and A synchronization, the coordinator must freshly reconstruct complete `servant.atalanta.skill.sc-atalanta-2`; singleton S is allowed only if that whole-card probe is mechanically zero-gap.
