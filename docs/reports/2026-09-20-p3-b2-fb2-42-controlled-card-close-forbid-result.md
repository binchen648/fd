# P3-B2 FB2-42 Controlled Card-Close Forbid Result

Role: Codex B2
Status: `CANDIDATE_READY_FOR_FRESH_R`
Date: 2026-09-20

## Exact dispatch input

- A dispatch Base: `ec39baa2d99c1e9f2359e832ca7bd61118c44558`
- A synchronization parent: `8cbd313373ce4e683d0454f10bdcb82116093724`
- Task: `P3-FB2-42-CONTROLLED-CARD-CLOSE-FORBID`
- Branch: `codex/b2-p3-fb2-42-card-close-forbid`
- F1 evidence commit: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Formal migration before/after this B2: **`144/944`**, remaining **`800`**.

FB2-42 is identity-free runtime capability infrastructure and earns **zero migration credit**.

## Implemented capability

FB2-42 adds one bounded server-owned card-close prohibition seam. It does not add a generic card-action prohibition language.

The loader admits a `card_close` rule modifier only when all of the following hold:

- parent execution mode is exactly `automatic`;
- parent lifecycle duration is exactly `this_round`;
- modifier `operation === "forbid"`;
- modifier `rule === "card_close"`;
- modifier scope has exactly `controller: "self"` plus one constraints array;
- that array has exactly one structural `{ type: "has_card_id", cardId: <nonempty> }` constraint and no widened constraint keys;
- modifier lifecycle is exactly `{ duration: "this_round" }`;
- no list, wildcard, attribute, relation, permanent, or while-active close immunity is accepted.

At runtime, the matcher considers only a currently live `this_round` ongoing effect installed in the authoritative current round, owned by the same controller as the target card, with the exact selected definition id. A definition set is represented by multiple independently exact modifiers rather than by a new list-selector primitive.

Both existing close paths enforce the same server-owned query before close mutation:

1. generic `resolveEffect(... close_source_card ...)` rejects while a matching live forbid exists;
2. typed resolution-dataflow `close_source_card` throws `card_close_forbidden` before mutating active/face/zone/visibility state or emitting the close event.

The new non-power modifier is explicitly excluded from generic card-power aggregation, so it cannot accidentally participate in numeric power calculation. Existing `card.currentPower` behavior remains independent.

## Scope / identity audit

Candidate implementation scope is limited to:

- `packages/rules/src/ability/card-close-forbid.ts` — new exact classifier/runtime query;
- `packages/rules/src/ability/loader.ts` — admit only the exact bounded shape;
- `packages/rules/src/ability/interpreter.ts` — generic close guard and non-power isolation;
- `packages/rules/src/ability/resolution-dataflow.ts` — typed transactional close guard;
- `packages/rules/src/index.ts` — public export for mechanical tests;
- `packages/rules/tests/fb2-42-controlled-card-close-forbid.test.ts` — focused mechanical coverage;
- this result report.

No `data/authoring/**`, pack/generated content, content-package production, or client production file is changed. Production additions contain no Darius identity/name/skill-id token, Frozen F1 hash, or Locked Reference hash. The structural tokens `card_close`, `has_card_id`, and `this_round` are identity-free capability vocabulary only.

Branch-local frozen-roster accounting remains:

- frozen identities: `944`;
- unique authoring card ids: `162`;
- frozen overlap: **`139/944`**;
- frozen duplicate ids: `0`.

Therefore FB2-42 adds **zero** frozen identity credit. Formal project migration remains **`144/944`**, remaining **`800`**.

## Focused behavioral evidence

The FB2-42 focused suite proves:

- exact bounded loader shape is accepted;
- wrong operation/rule/controller, empty selector, multiple selector constraints, wrong modifier duration, widened scope, wildcard/attribute selector, wrong parent lifecycle, and host-adjudicated parent are rejected;
- a live exact modifier prevents a matching controller-owned source from closing;
- the generic close path rejects before card mutation/close event;
- the typed resolution-dataflow transaction also rejects without mutating caller state;
- a different definition or different controller closes normally;
- the protection expires after its installation round and ordinary close resumes;
- widened/unrelated installed modifier state cannot broaden the matcher;
- installing close protection does not alter ordinary card power;
- existing card-action close regression remains green.

## Validation

Environment protocol was followed. This fresh worktree had no `node_modules`, so installation used only:

- `npm.cmd ci --ignore-scripts --offline` — PASS, 239 packages, 0 vulnerabilities.

Validation on the Candidate working tree:

- `npm.cmd run typecheck` — PASS.
- FB2-42 + existing card-action-close focused — PASS, **2 files / 13 tests** (`8 + 5`).
- rules `src/__tests__ + core + regression + focused` — PASS, **83 files / 502 tests**.
- `npm.cmd run test:ci -- --maxWorkers=2` — PASS, **163 files / 1147 tests**.
- `npm.cmd run content:validate` — PASS, **7 masters / 7 servants / 20 events / 0 blocking issues**.
- `npm.cmd run verify:generated-content` — PASS with unchanged hashes:
  - library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- `npm.cmd run phase3:reference:verify -- --reference-root E:\Codex\FD\fd-reference` — PASS at exact Locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- `npm.cmd run build --workspace @fd/client` — PASS; only the existing Vite browser-externalization/chunk-size warnings.
- `git diff --check` — PASS.
- production identity/hardcode audit — CLEAN.
- forbidden authoring/product/client scope audit — CLEAN.
- frozen overlap audit — `139/944`, duplicates `0`.

## Fresh reviewer handoff

The exact committed Candidate must receive a fresh independent read-only R review against exact Base `ec39baa2d99c1e9f2359e832ca7bd61118c44558`.

Formal accepted verdict for this B2 is `IMPLEMENTATION_ACCEPTED_CANDIDATE`; revision verdict is `IMPLEMENTATION_NEEDS_REVISION`.

Do not merge or retarget. Do not credit any frozen identity. On fresh R acceptance, A synchronizes FB2-42 with zero migration credit and immediately re-normalizes/re-overlays the complete `servant.darius.skill.sc-darius-2` whole card. Only a mechanically zero-gap whole card may then be dispatched as singleton S.