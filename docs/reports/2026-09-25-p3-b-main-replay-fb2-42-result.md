# P3-B Current-Main Replay FB2-42 Result

Role: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Date: 2026-09-25

## Exact lineage

- Task: `P3-B-MAIN-REPLAY-FB2-42`
- Current-main A dispatch Base: `c6c5786cb48f6abc563aa8359e335fbd26c14c4f`
- Branch: `codex/b-p3-main-replay-fb2-42`
- Source implementation Base: `ec39baa2d99c1e9f2359e832ca7bd61118c44558`
- Source accepted Candidate: `d082a90e194ee4cf1f528086f1ba01150a9ead41`
- Source fresh-R evidence: `https://github.com/binchen648/fd/pull/394#issuecomment-5748132070`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

This is a semantic replay onto current main. No frontier commit was cherry-picked or merged.

## Replayed capability

The Candidate replays only the accepted identity-free FB2-42 controlled-card close-forbid seam:

- automatic parent ability;
- exact parent `this_round` lifecycle;
- modifier `operation=forbid`, `rule=card_close`;
- `scope.controller=self`;
- exactly one nonempty structural `has_card_id` constraint;
- ordinary active physical source liveness;
- controller and definition matching;
- interpreter/extended-effect close and typed resolution-dataflow `close_source_card` both reject before mutation while protection is live;
- expired round, dead protection source, another controller, another definition, or widened/malformed modifier does not protect.

The replay centralizes the already-existing Card Zone active-source predicate as `isActiveCardSource` so the forbid query and ordinary lifecycle validity use the same server-owned source-state rule.

## Current-main adaptation

The historical FB2-42 focused fixture used `conditions:[{type:"source_active"}]`. Current main does not admit a generic `source_active` authoring condition, and the current-main FB2-42 dispatch does not authorize importing that separate gateway. The replay fixture therefore keeps `requiresSourceState:"active"` and the real card runtime active/face-up state, but uses empty `conditions` for the synthetic ward/close cards. This preserves the FB2-42 contract without broadening current-main authoring semantics.

## Exact implementation scope

Production/runtime files:

- `packages/rules/src/ability/card-close-forbid.ts`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/loader.ts`
- `packages/rules/src/ability/resolution-dataflow.ts`
- `packages/rules/src/core/card-source-state.ts`
- `packages/rules/src/index.ts`

Focused test:

- `packages/rules/tests/fb2-42-controlled-card-close-forbid.test.ts`

No `data/authoring/**`, pack/generated content, client code, consumer identity, FB2-49 implementation, M50 material, or governance file is changed.

## Validation

- `npm run typecheck` — PASS.
- Focused FB2-42 + Card Zone / card-close / lifecycle source-active / resolution-dataflow — **5 files / 42 tests PASS**.
- Affected rules/core/regression set — **74 files / 441 tests PASS**.
- `npm run test:ci -- --maxWorkers=2` — **131 files / 866 tests PASS**.
- `npm run content:validate` — PASS: **7 masters / 7 servants / 20 events / 0 blocking issues**.
- `npm run verify:generated-content` — PASS:
  - content library `c9841d4bad3d43a525895372fabd3b49ea07e79075652a5cbd18fad3405e2e1e`
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence report `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- frozen rescan — denominator **944 = 943 static + 1 dynamic**, frozen overlap **111 unique / 111 occurrences**, additions `0`, removals `0`, duplicates `0`, remaining `833`.
- runtime diff routing audit — no `master.` / `servant.` canonical identity routing, no Chinese printed-text routing, no `SkillLib`, no `printedText` dispatch.
- `git diff --check` — PASS.

## Accounting

FB2-42 replay is zero-credit infrastructure. Current-main formal/material accounting remains **111/944**, with **833** remaining. No consumer migration is authorized by this Candidate.

## Next gate

Freeze the exact commit containing this report as the B Candidate, push a stacked PR against `codex/a-p3-main-replay-fb2-42-dispatch`, and obtain fresh independent R. Do not merge/retarget. Only after fresh R acceptance plus A synchronization may the current-main FB2-49 replay resume from the synchronized FB2-42 capability lineage.
