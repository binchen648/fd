# P3-B2 FB2-40 Source-Card Active-Round Count Result

Role: Codex B2
Status: `IMPLEMENTATION_CANDIDATE_READY`
Date: 2026-09-20

## Exact dispatch

- A dispatch Base: `0b666871a99a76ab9fb804e5c817f02a9f583727`
- Branch: `codex/b2-p3-fb2-40-source-active-round-count`
- Formal migration accounting: `143/944`; remaining `801`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- F1 evidence commit: `59f145434695d29bdd17e4cb3adc887e84182377`

FB2-40 is capability work only and earns zero migration credit.

## Implemented capability

The Candidate adds exactly one controlled server formula metric, `source_card_active_round_count`.

Implementation is identity-free:

1. The authoring loader whitelists only the exact metric name inside its bounded server-metric set; near names remain unsupported.
2. Formula evaluation resolves the metric from the current physical source instance plus authoritative `abilityRuntime.cardState[sourceCardId].playedRound`.
3. A valid active, face-up source in `field` or `attack_area` evaluates to `currentRound - playedRound + 1`.
4. Same-round activation returns `1`; later rounds count inclusively.
5. Missing physical source, missing card state, inactive source, face-down source, non-active source zone, invalid/non-integer/zero/negative played round, or future played round fails closed with `invalid_variable` before mutation.
6. No second counter, combat history flag, generic dynamic property traversal, arbitrary named metric, event trigger, or consumer identity routing is introduced.

`combatWinRound` is intentionally not admitted by FB2-40 and remains a separate unresolved gap for the intended Nero s1 closure target.

## Scope audit

Production code changes are limited to:

- `packages/rules/src/ability/loader.ts`
- `packages/rules/src/ability/interpreter.ts`

Focused evidence is added only in:

- `packages/rules/tests/fb2-40-source-active-round-count.test.ts`

The production diff contains no Nero identity/name, Golden Theater text, `combatWinRound`, consumer clause hashes, Locked Reference hash, or Reference handler route. There is no `data/authoring/**`, pack, generated-content, schema, product-registration, merge, or retarget change.

Mechanical frozen overlap in this lineage remains **`138/944`**, with zero duplicates. Formal project accounting remains **`143/944`**, remaining **`801`**.

## Validation

Fresh validation on the Candidate worktree passes:

- `npm.cmd run typecheck`: PASS.
- Focused FB2-40: **1 file / 5 tests PASS**.
- Rules `src/__tests__ + core + regression + focused`: **83 files / 499 tests PASS**.
- Official `npm.cmd run test:ci -- --maxWorkers=2`: **160 files / 1122 tests PASS**.
- Content validation: **7 masters / 7 servants / 20 events / 0 blocking issues**.
- Generated determinism: PASS with unchanged hashes:
  - library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- Locked Reference verifier: PASS against exact clean `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- Client production build: PASS; only the existing Vite browser-externalization/chunk-size warnings appear.
- `git diff --check`: PASS.
- Production identity-hardcode audit: CLEAN.

Focused tests prove exact loader admission, near-name rejection (including `combatWinRound` as an arbitrary metric name), same-round and later-round arithmetic, fail-closed source/card-state provenance, no mutation on failure, and preservation of existing controlled server metrics.

## Review handoff

Fresh independent R must review the exact committed Candidate against Base `0b666871a99a76ab9fb804e5c817f02a9f583727`. R remains read-only and returns only `IMPLEMENTATION_ACCEPTED_CANDIDATE` or `IMPLEMENTATION_NEEDS_REVISION` for this B2 Candidate.

Acceptance authorizes only A synchronization of this zero-credit metric seam. It does not authorize Nero migration: after synchronization A must re-overlay Nero s1, and the separately unsupported exact `combatWinRound` absence condition remains unresolved unless independently accepted later.
