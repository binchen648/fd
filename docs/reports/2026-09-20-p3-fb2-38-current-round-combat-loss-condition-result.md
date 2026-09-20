# P3-FB2-38 Current-Round Combat-Loss Absence Condition Result

Role: Codex B2
Status: `IMPLEMENTED_REVISED_CANDIDATE`
Date: 2026-09-20

## Dispatch binding

- Exact A dispatch Base: `aed88b889f0cbedcd029438f442d2d15ce4858bd`
- Branch: `codex/b2-p3-fb2-38-current-round-combat-loss-condition`
- Formal project migration at dispatch: `140/944`, `804` remaining
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

FB2-38 is runtime capability infrastructure only and earns zero migration credit.

## Reviewer revision binding

- Initial Candidate: `a9657b1203728295fa7f945428b1a7b91e15dfd7`
- Fresh R verdict: `IMPLEMENTATION_NEEDS_REVISION`
- Canonical reviewer evidence: `https://github.com/binchen648/fd/pull/387#issuecomment-5745968595`
- Blocking finding: the initial implementation reconstructed terminal provenance from live `state.battleResults`, but production scoring clears that array before `after_battle_ended`; MatchSession also uses history-aware battle ordinals that cannot be reconstructed from a phase-local index.
- Revision scope: preserve per-battle participant IDs in the already-authoritative frozen terminal snapshot, consume that snapshot directly, and add post-scoring plus later-round MatchSession regressions. No persistent player flag or generic flag interpreter was added.

## Implemented structural seam

The Candidate adds one identity-free exact condition family only:

```json
{ "type": "player_flag_number_not_current_round", "key": "combatLossRound" }
```

Behavior:

- classifier accepts exactly the two-key shape above;
- loader admits it only in ability-condition placement and fail-closes wrong key/type/extra fields/non-condition placement;
- runtime evaluates only an exact current-round authoritative `after_battle_ended` terminal event;
- the scoring-preclear battle snapshot now freezes per-battle participant IDs together with each battlefield's winner IDs into terminal provenance;
- the condition validates terminal `battleIds`, `resultIds`, scoring receipts, participant union, and per-battle frozen outcomes internally, without reading cleared live `state.battleResults` and without reconstructing battle ordinals;
- controller loss means the controller appears in a frozen outcome's participant IDs and is absent from that outcome's winner IDs;
- non-participation in another battlefield is not loss;
- shared winner membership is non-loss;
- `lossEffectSuppressedPlayerIds` does not erase an actual non-winner outcome, matching Locked Reference combat-loss-round semantics;
- no persistent `combatLossRound` state or generic player-flag interpreter was added.

Production paths changed across the full Candidate:

- `packages/rules/src/ability/current-round-combat-loss-condition.ts`
- `packages/rules/src/ability/battle-terminal.ts`
- `packages/rules/src/ability/types.ts`
- `packages/rules/src/core/game-loop.ts`
- `packages/rules/src/match-session.ts`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/loader.ts`
- `packages/rules/src/index.ts`

Focused test:

- `packages/rules/tests/fb2-38-current-round-combat-loss-condition.test.ts`

No consumer authoring, pack/generated product, app, frozen accounting, merge, or retarget is included.

## Closure readiness proof

A read-only whole-card probe normalized the intended closure consumer onto already accepted authoring contracts plus FB2-38. The resulting complete card compiled with:

- loader report: `[]`
- card mode: `automatic`
- residual ability mode: `automatic`

This probe was temporary and deleted; no consumer identity is present in the B2 Candidate. Fresh R acceptance plus A synchronization is still required before any consumer migration dispatch.

## Validation

At the Candidate worktree:

- `npm.cmd ci --ignore-scripts --offline`: PASS, 239 packages, 0 vulnerabilities;
- `npm.cmd run typecheck`: PASS;
- focused FB2-38: **1 file / 9 tests PASS**, including post-scoring live-result clearing and later-round MatchSession terminal ordinal coverage;
- rules `src/__tests__ + core + regression + focused`: **83 files / 503 tests PASS**;
- official `npm.cmd run test:ci -- --maxWorkers=2`: **156 files / 1096 tests PASS**;
- eleven-round MatchSession case: PASS, about 1.78 s in official CI;
- content validation: **7 masters / 7 servants / 20 events / 0 blocking issues**;
- generated determinism: PASS with unchanged hashes:
  - library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`
- exact Locked Reference verifier against `E:\Codex\FD\fd-reference`: PASS;
- client production build: PASS; existing Vite browser-externalization/chunk-size warnings only;
- `git diff --check`: PASS;
- added-production-lines + new-module hardcode audit: CLEAN for consumer IDs/names, F1/Reference hashes, Reference handler, and `printedText` routing.

## Formal accounting

Formal migration remains **`140/944`**, with **`804`** remaining. FB2-38 earns **zero migration credit**.

PR #381 / Ibaraki remains pending independent migration review and is not credited here.

After fresh R `IMPLEMENTATION_ACCEPTED_CANDIDATE` plus A synchronization, immediately re-overlay the intended closure consumer and dispatch fresh S migration before unrelated B2 work.

## Second reviewer revision binding

- Superseded Candidate: `29c0dd121d4732e57921d50ec8cdf2314d7a4803`
- Fresh R verdict: `IMPLEMENTATION_NEEDS_REVISION`
- Canonical reviewer evidence: `https://github.com/binchen648/fd/pull/387#issuecomment-5746041760`
- Blocking finding: malformed terminal provenance with a truthy non-string `battleIds` member reached `.startsWith(...)` and threw instead of failing closed.
- Minimal revision: explicitly require string elements in `battleIds`, `resultIds`, and `scoringReceiptIds` before terminal ID validation; add regression coverage proving `[123]` in each neighboring ID array returns no trigger and does not throw.
- No semantic scope expansion, consumer authoring, persistent player flag, merge, retarget, or migration credit is included.

Validation after this revision:

- `npm.cmd run typecheck`: PASS;
- focused FB2-38: **1 file / 9 tests PASS**;
- rules `src/__tests__ + core + regression + focused`: **83 files / 503 tests PASS**;
- official `npm.cmd run test:ci -- --maxWorkers=2`: **156 files / 1096 tests PASS**;
- content validation: **7 masters / 7 servants / 20 events / 0 blocking issues**;
- generated determinism, exact Locked Reference verification, client production build, and `git diff --check`: PASS;
- revision-only production hardcode audit: CLEAN;
- formal migration remains **`140/944`**, with **`804`** remaining; FB2-38 remains zero-credit runtime capability infrastructure.
## Latest reviewer revision binding

- Superseded Candidate: `14f0c6a990d236498703d502bab1b4e38f018887`
- Fresh R verdict: `IMPLEMENTATION_NEEDS_REVISION`
- Canonical reviewer evidence: `https://github.com/binchen648/fd/pull/387#issuecomment-5746344635`
- Blocking finding: a battle-capable location that is currently excluded by MatchSession `modeState.closedLocations` was still accepted as authoritative current-phase terminal provenance.
- Minimal revision: derive the accepted current battle-eligible set from enabled battle-capable locations minus current `closedLocations`, matching the authoritative MatchSession producer; add a real `collectTriggeredAbilities` regression proving a known-but-currently-closed battlefield returns no trigger without throwing.
- Previously fixed post-scoring frozen provenance, history-aware battle ordinals, malformed ID grammar, current-roster identity validation, and unknown/non-battle battlefield validation remain unchanged.

Validation after this revision:

- `npm.cmd run typecheck`: PASS;
- focused FB2-38: **1 file / 9 tests PASS**;
- rules `src/__tests__ + core + regression + focused`: **83 files / 503 tests PASS**;
- official `npm.cmd run test:ci -- --maxWorkers=2`: **156 files / 1096 tests PASS**;
- content validation: **7 masters / 7 servants / 20 events / 0 blocking issues**;
- generated determinism, exact Locked Reference verification, client production build, and revision `git diff --check`: PASS;
- formal migration remains **`140/944`**, with **`804`** remaining; FB2-38 remains zero-credit runtime capability infrastructure.

## Current reviewer revision binding

- Superseded Candidate: `ddf280664c00e27044f708608373ddb888609b8e`
- Fresh R verdict: `IMPLEMENTATION_NEEDS_REVISION`
- Canonical reviewer evidence: `https://github.com/binchen648/fd/pull/387#issuecomment-5746420578`
- Blocking finding: a represented terminal battle outcome could contain an empty participant set or an empty winner set and still be accepted as authoritative provenance, even though production combat resolution cannot emit either shape for a resolved battle.
- Minimal revision: preserve the valid phase-wide zero-battle terminal case (`battleOutcomes.length === 0`), but require every represented battle outcome to contain at least one participant and at least one winner before evaluating current-round loss absence.
- Focused regression uses the real `collectTriggeredAbilities` path to prove zero-battle terminal provenance still passes while per-battle empty participants / empty winners fail closed without throwing.
- Previously fixed post-scoring frozen provenance, history-aware ordinals, malformed ID grammar/type validation, current-roster identity validation, battlefield identity validation, and closed-location filtering remain unchanged.

Validation after this revision:

- `npm.cmd run typecheck`: PASS;
- focused FB2-38: **1 file / 9 tests PASS**;
- rules `src/__tests__ + core + regression + focused`: **83 files / 503 tests PASS**;
- official `npm.cmd run test:ci -- --maxWorkers=2`: **156 files / 1096 tests PASS**;
- content validation: **7 masters / 7 servants / 20 events / 0 blocking issues**;
- generated determinism, exact Locked Reference verification, client production build, and `git diff --check`: PASS;
- revision-only production hardcode audit: CLEAN;
- formal migration remains **`140/944`**, with **`804`** remaining; FB2-38 remains zero-credit runtime capability infrastructure.
## Cross-battle ordinal-sequence reviewer revision binding

- Superseded Candidate: `484c24acfbe75552ae9e30a30dd3bad2e701cf81`
- Fresh R verdict: `IMPLEMENTATION_NEEDS_REVISION`
- Canonical reviewer evidence: `https://github.com/binchen648/fd/pull/387#issuecomment-5746467063`
- Blocking finding: each battle ordinal was validated only as an independent positive integer, so impossible duplicate, reversed, or gapped multi-battle ordinal runs could be accepted even though both authoritative terminal producers emit one contiguous increasing run; history-aware MatchSession offsets such as `8,9` must remain valid.
- Minimal revision: retain the first authoritative ordinal as an arbitrary positive history-aware offset, then require each following represented battle ordinal to equal the previous ordinal plus one in terminal outcome order; no phase-local ordinal reconstruction is added.
- Focused regression uses the real `collectTriggeredAbilities` path to prove `[1,2]` and later-offset `[8,9]` remain valid while duplicate `[1,1]`, reversed `[2,1]`, and gapped `[1,3]` provenance fail closed without throwing.
- Previously fixed post-scoring frozen provenance, string/grammar validation, current-roster identity validation, battle-capable/open-location validation, and non-empty represented outcome validation remain unchanged.

Validation after this revision:

- `npm.cmd run typecheck`: PASS;
- focused FB2-38: **1 file / 10 tests PASS**;
- rules `src/__tests__ + core + regression + focused`: **83 files / 504 tests PASS**;
- official `npm.cmd run test:ci -- --maxWorkers=2`: **156 files / 1097 tests PASS**;
- content validation: **7 masters / 7 servants / 20 events / 0 blocking issues**;
- generated determinism, exact Locked Reference verification, client production build, and `git diff --check`: PASS;
- revision-only forbidden-scope and production hardcode audits: CLEAN;
- formal migration remains **`140/944`**, with **`804`** remaining; FB2-38 remains zero-credit runtime capability infrastructure.
