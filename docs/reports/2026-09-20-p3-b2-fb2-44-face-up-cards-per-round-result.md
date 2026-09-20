# P3-B2 FB2-44 Face-Up Cards Per Round Result

Role: Codex B2
Status: `CANDIDATE_READY_FOR_FRESH_R`
Date: 2026-09-20

## Exact dispatch input

- A dispatch Base: `24fb6d424625fd3cbfbfb4c7f7e56e3c05c6acd8`
- A synchronization parent: `7cc689dba18779619efde79e9367e5dd55f05f4f`
- Task: `P3-FB2-44-FACE-UP-CARDS-PER-ROUND`
- Branch: `codex/b2-p3-fb2-44-face-up-cards-per-round`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Formal migration before/after this B2: **`146/944`**, remaining **`798`**.

FB2-44 is identity-free runtime capability infrastructure and earns **zero migration credit**.

## Implemented capability

FB2-44 adds exactly one bounded static card-play rule envelope:

```json
{
  "type": "card_play_rule_override",
  "operation": "set",
  "rule": "face_up_cards_per_round",
  "scope": { "subject": "players_at_source_battlefield" },
  "value": 1,
  "lifecycle": { "duration": "while_active" },
  "priority": { "tier": "card_text", "specificity": "specific" },
  "conflictPolicy": "host_required"
}
```

The parent ability must also be the exact automatic residual/static envelope: no activation payload, conditions, targets, effects, cost, creates, limit or visibility; one exact modifier only; parent lifecycle `while_active`; no widened host operations.

The loader rejects wrong value, scope, lifecycle, type, priority, conflict policy, extra selector keys, or a widened parent ability shape. No arbitrary values, arbitrary locations, generic selector combinations, generic conflict engine, or identity-specific routing are introduced.

At runtime the rule is discovered structurally from the loaded ability pack plus authoritative physical source state. A live cap exists only when:

- the source is a face-up active card source;
- the source controller is active and currently at a battlefield;
- the subject player is active and currently at that exact same battlefield;
- the source definition contains the exact accepted static modifier envelope.

A closed/inactive source, a source controller outside a battlefield, a player elsewhere, or a controller that moves away supplies no live cap. Multiple accepted sources do not widen the fixed cap because the only admitted value is exactly `1`.

## Authoritative play accounting

`RoundPlayCounters` gains a dedicated backward-compatible optional `faceUpCardsPlayedByPlayer` ledger. New runtimes initialize it, round advance resets it, and restored older states without the field are treated as zero until first write.

The server-owned play gateway now enforces the live cap before mutation:

- ordinary single-card face-up play is removed from legal play once the allowance is exhausted and authoritative dispatch rejects it with `face_up_card_play_limit_reached`;
- face-down play neither consumes nor is rejected by the face-up allowance;
- multi-card/staged face-up batches are preflighted against aggregate remaining allowance before mana/card mutation and fail atomically;
- `play_selected_cards` effect play reuses `playBatch`, so it cannot bypass the cap;
- `executeAbility` performs a face-up effect-play preflight before mana, usage or source mutation, preventing a rejected effect route from polluting `usedAbilities` or costs;
- the existing direct `play_source_card` trusted effect route now records a completed face-up play before its declaration/play events, so a successful source-card effect consumes the same per-round allowance and cannot be followed by another face-up play at the live battlefield.

Existing all-card counters, attack allowance semantics, face-down visibility, timing/mana gates, required-additional-play behavior and unrelated rule modifiers remain intact.

## Scope / identity audit

Candidate implementation scope is limited to:

- `packages/rules/src/ability/face-up-cards-per-round.ts` — exact selector/parent classifier, live structural predicate, read-only count and completed source-effect counter writer;
- `packages/rules/src/ability/loader.ts` — admit only the exact FB2-44 modifier/parent envelope;
- `packages/rules/src/ability/interpreter.ts` — regular/batch/effect preflight and successful direct source-play counting;
- `packages/rules/src/ability/types.ts` — dedicated optional per-round face-up play ledger;
- `packages/rules/src/index.ts` — public export for mechanical tests;
- `packages/rules/tests/fb2-44-face-up-cards-per-round.test.ts` — focused fail-closed/runtime/atomicity/effect-path coverage;
- this result report.

No `data/authoring/**`, product pack, generated content, content-package production, client production, frozen card identity, character name, or skill id is changed or referenced by runtime selection logic.

Branch-local frozen-roster accounting remains:

- frozen identities: `944`;
- frozen overlap: **`141/944`**;
- frozen duplicate ids: `0`;
- `servant.leonidas.skill.sc-leonidas-1` authoring count: `0`.

Therefore FB2-44 adds **zero** frozen identity credit. Formal project migration remains **`146/944`**, remaining **`798`**.

## Focused behavioral evidence

The FB2-44 focused suite proves:

- exact modifier and exact residual parent envelope accept while wrong value/scope/lifecycle/type/priority/conflict policy/extra keys/widened parent reject;
- controller and opponent at the source battlefield each receive an independent one-face-up-card allowance;
- a second face-up card is absent from legal play and authoritative dispatch rejects it after the first completes;
- face-down cards do not consume the allowance;
- players elsewhere are unaffected;
- inactive/closed source and non-battlefield source controller are inactive rules;
- moving the source controller away releases the live static cap immediately;
- round advance resets the face-up allowance;
- a two-face-up-card batch is rejected before mutation;
- staged batch confirmation cannot bypass the aggregate cap;
- selected-card trusted effect play cannot bypass the cap and rejected effect play leaves caller state unchanged;
- a successful direct `play_source_card` face-up effect consumes the allowance before subsequent play checks.

During focused validation an initial effect-play test exposed that rejection happened after `usedAbilities` mutation. The preflight was moved ahead of all ability cost/usage mutation and the test then passed. A later route audit found that successful direct `play_source_card` effects did not pass through `playBatch`; dedicated completed face-up counting plus a regression test closed that bypass before Candidate commit.

## Validation

Fresh worktree dependencies were installed with `npm.cmd ci --ignore-scripts --offline` (239 packages, 0 vulnerabilities), followed by normal typecheck/build output generation.

Validation on the final Candidate working tree:

- `npm.cmd run typecheck` — PASS.
- final FB2-44 + source-play focused verification — PASS, **2 files / 16 tests**.
- rules `src/__tests__ + core + regression + FB2-43 + FB2-44` — PASS, **84 files / 514 tests**.
- `npm.cmd run test:ci -- --maxWorkers=2` — PASS, **167 files / 1179 tests**.
- `npm.cmd run content:validate` — PASS, **7 masters / 7 servants / 20 events / 0 blocking issues**.
- `npm.cmd run verify:generated-content` — PASS with unchanged hashes:
  - library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- `npm.cmd run phase3:reference:verify -- --reference-root E:\Codex\FD\fd-reference` — PASS at exact Locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- `npm.cmd run build --workspace @fd/client` — PASS; only existing Vite browser-externalization/chunk-size warnings.
- `npm.cmd run phase3:coverage` — PASS, `blockingIssues=0`. The command-generated coverage artifact was restored byte-for-byte to dispatch Base because it is validation output and outside FB2-44 delivery scope.
- `git diff --check` — PASS.
- runtime identity/hardcode audit — CLEAN.
- forbidden authoring/generated/product/client scope audit — CLEAN.
- frozen overlap remains `141/944`, duplicates `0`, target Leonidas s1 still absent.

## Fresh reviewer handoff

The exact committed Candidate must receive a fresh independent read-only R review against exact Base `24fb6d424625fd3cbfbfb4c7f7e56e3c05c6acd8`.

Formal accepted verdict for this B2 is `IMPLEMENTATION_ACCEPTED_CANDIDATE`; revision verdict is `IMPLEMENTATION_NEEDS_REVISION`.

Do not merge or retarget. Do not credit any frozen identity. On fresh R acceptance, A synchronizes FB2-44 with zero migration credit and mechanically re-overlays the complete `servant.leonidas.skill.sc-leonidas-1` card against the accepted runtime. Only if that whole card is mechanically zero-gap may A dispatch singleton S.

Long-term S gate: any later S must complete recertification and lock/submit its **Exact Base** and **Exact Candidate** before it is eligible for fresh independent R. An S lacking recertification or exact SHA lineage must not enter fresh R.
