# P3-B Current-Main FB2-32 Source-State Conditions Replay Result

Role: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Date: 2026-09-25

## Exact dispatch input

- Task: `P3-B-MAIN-REPLAY-FB2-32-SOURCE-STATE-CONDITIONS`
- Exact A decomposition Base commit: `63666879bc004c724d7ceef0b43d8a9bbd910fdf`
- Base tree: `75b31b6f5b0b7f67f7a85041a3c7f7342a50a16e`
- Historical accepted FB2-32 Candidate: `ae80ed7fb759a35964bcf5d9f581dc4e52d49d49`
- Historical reviewer evidence commit: `f1da3b4d0976cd80dbe4a3569bb9a216cf7dc441`
- Initial rejected Candidate: `c89eac0357b2427aa9682a95f644f3e1442281bc`; reviewer finding: `https://github.com/binchen648/fd/pull/376#issuecomment-5742601244`.
- Current-main accounting before/after this unreviewed B Candidate: `112/944`, remaining `832`.

FB2-32 is identity-free infrastructure and carries zero migration credit.

## Replayed accepted seam

The current-main replay adds only the two exact type-only source-state conditions:

- `{ type: "source_active" }`
- `{ type: "source_owned" }`

The replay preserves both fixes required by the historical fresh R revision:

1. loader admission is position-aware: source-state nodes are accepted only below `ability.conditions`; the same token under effects/targets/cost/creates is reported unsupported rather than silently promoted;
2. missing/nonphysical source context is a benign false condition match instead of a raw `Card is not available` exception.

Runtime evaluation remains identity-free. `source_active` delegates to the authoritative physical card/source-state predicate; `source_owned` compares the physical source owner to the current controller. Payload-bearing/widened shapes remain rejected.

No activation trigger, effect, target, interaction, lifecycle, modifier, consumer, Scathach/M50 primitive, identity/name/printed-text/Chinese route, or SkillLib fallback is added.

## Exact scope

Candidate scope is exactly:

- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/loader.ts`
- `packages/rules/tests/fb2-32-source-state-conditions.test.ts`
- this result report

No `data/authoring/**`, packs/generated product, client production, governance policy, Task Index, or other consumer path is changed.

## Verification

Validation was run from an exact scratch snapshot based on the A-decomposition tree, isolated from the four protected unrelated dirty files in the canonical checkout.

- `npm run typecheck` — PASS.
- focused FB2-32 + FB2-42 + FB2-49 + card-source-state + resolution-dataflow — PASS, **5 files / 88 tests**; FB2-32 **8/8**, FB2-42 **9/9**, FB2-49 **51/51**.
- `npm run test:ci -- --maxWorkers=2` — PASS, **134 files / 941 tests**.
- `npm run content:validate` — PASS: **7 masters / 7 servants / 20 events / 0 blocking issues**.
- `npm run verify:generated-content` — PASS; deterministic hashes unchanged.
- frozen rescan — PASS: denominator `944 = 943 static + 1 dynamic`; overlap `112 unique / 112 occurrences`; duplicates `0`; dynamic materialized `0`; remaining `832`.
- Base -> Candidate authoring delta — empty.
- final tree diff check required immediately before Candidate freeze.

## Gate

This is only a zero-credit B implementation Candidate. Formal/material accounting remains `112/944`. Fresh independent R must review the exact Candidate before A synchronization and before FB2-33 replay is dispatched.