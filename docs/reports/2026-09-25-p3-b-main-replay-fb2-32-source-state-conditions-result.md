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
## Revision R2 — target.conditions boundary closure

Fresh independent R on initial Candidate `b0ded18877db95dac5cd1030c2f87544b25525a5` returned `IMPLEMENTATION_NEEDS_REVISION` with canonical evidence `https://github.com/binchen648/fd/pull/447#issuecomment-5834476060`.

The single blocker was a loader coverage gap: runtime target selection evaluates `target.conditions`, but the loader did not scan that route. As a result, `{ type: "source_active" }` could survive under `target.conditions` and remain automatic despite the contract requiring source-state conditions to exist only under top-level `ability.conditions`.

R2 closes only that boundary:

- loader now scans `target.conditions` as `targets.conditions`, so the existing position-aware source-state rule reports it unsupported;
- focused regression reproduces the Reviewer probe and requires execution mode `unsupported`;
- no new condition/effect/target vocabulary is added.

R2 verification on the exact successor scratch snapshot:

- `npm run typecheck` — PASS.
- affected focused set — PASS, **5 files / 89 tests**; FB2-32 **9/9**, FB2-42 **9/9**, FB2-49 **51/51**.
- current-main frozen/material accounting remains **112/944**, zero migration credit.
- `git diff --check` is required on the exact successor tree before freeze.
## Revision R3 - remaining runtime condition-carrier boundary closure

Fresh independent R on successor Candidate `213a8d758e9f9b07b1d6cf2e85d41fab37a2e969` returned `IMPLEMENTATION_NEEDS_REVISION`. Reviewer GitHub comment publication failed with `GITHUB_WRITE_FAILED_403`; the same completed review attempt returned a bounded evidence relay. The later marker-only comment `https://github.com/binchen648/fd/pull/447#issuecomment-5834969544` is not treated as standalone canonical evidence.

R3 closes the two remaining loader/runtime route mismatches from that exact review attempt:

- `target.conditions` is scanned for every target type, including `choice`; source-state nodes there are reported unsupported and disable automation;
- `ruleModifiers[].conditions` is scanned as `ruleModifiers.conditions`; source-state nodes there are likewise reported unsupported and disable automation;
- focused regressions cover both paths and require the exact source-state boundary reason plus `execution.mode = unsupported`.

No new runtime vocabulary, authoring consumer, trigger, effect, target, modifier semantics, or migration credit is introduced. Current-main formal/material accounting remains **112/944**, remaining **832**.

R3 verification on the exact successor scratch snapshot:

- `npm run typecheck` - PASS.
- affected focused set - PASS, **5 files / 91 tests**; FB2-32 **11/11**, FB2-42 **9/9**, FB2-49 **51/51**, card-source-state **5/5**, resolution-dataflow **15/15**.
- R3 changes only loader boundary coverage, two focused regressions in the existing FB2-32 test file, and this result report; no authoring delta.
- final `git diff --check` - PASS on the exact successor tree.
