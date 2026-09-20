# P3-B2 FB2-45 Pre-Battle Defeat by Round Attack Attribute Result

Role: Codex B2
Status: `REVISION_CANDIDATE_READY_FOR_FRESH_R`
Date: 2026-09-21

## Exact dispatch input

- Exact A dispatch Base / B2 parent: `749b700f0e4b2d0b5cfcbf12acde3748a3f7f25b`
- Synchronized formal baseline before dispatch: `0ffcbdbb8f9e0dbdf796bd95de7fc9c0601821c2`
- Task: `P3-FB2-45-PREBATTLE-DEFEAT-ROUND-ATTACK-ATTRIBUTE`
- Branch: `codex/b2-p3-fb2-45-prebattle-defeat-round-attack-attribute`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Formal migration before/after this B2: **`148/944`**, remaining **`796`**.

FB2-45 is identity-free runtime capability infrastructure and earns **zero migration credit**.

## Fresh-R revision closure

Formal fresh-R evidence for exact Candidate `28bf0cbb2aaf4ec5cc4394e3ca25222b95e61ea3` is GitHub comment `5752039805`, terminal verdict `IMPLEMENTATION_NEEDS_REVISION`, bound to exact Base `749b700f0e4b2d0b5cfcbf12acde3748a3f7f25b` and this task/branch.

This revision changes only the two exact P1 findings:

1. FB2-45 token admission now scans the entire containing ability rather than only `effects`, so `defeat_player` or `no_attack_played_this_round_with_attribute` placed in `creates`, conditions, target constraints, or any other non-authorized location must pass the same exact whole-ability gateway and therefore fail closed.
2. The existing Return Silence early-settlement branch now applies the same round+battlefield FB2-45 target intersection, Basic Luck immunity check, winner exclusion, intent consumption, and applied/ignored logging before returning. A matching non-immune intent targeting the Return Silence controller can no longer leave that controller winner-eligible, and the intent cannot leak after settlement. Existing Return Silence behavior is unchanged when no matching non-immune FB2-45 target affects its controller.

No generic defeat engine, new identity route, migration credit, merge, or retarget is introduced by the revision.

## Implemented capability

FB2-45 admits one bounded action-phase pre-battle defeat shape and no generic arbitrary `defeat_player` engine.

The accepted semantic envelope is structurally restricted to:

- `kind: phase_action`;
- activation exactly `phase: action`, `opens: controller_action_window`;
- exactly one `source_active` condition;
- no authoring targets, cost, creates, rule modifiers, response payload, limit or lifecycle payload;
- exactly one `defeat_player` effect;
- target scope exactly `engaged_opponents`;
- exactly one predicate `no_attack_played_this_round_with_attribute(<non-empty attribute>)`;
- automatic execution;
- either empty visibility or the already-accepted exact servant-package true-name reveal metadata.

The loader recognizes the new syntax tokens only behind this whole-ability classifier. Candidate detection traverses the complete ability, so the same tokens in `creates`, conditions, target constraints, or other non-authorized fields are rejected rather than silently admitted. Wrong phase, extra conditions/effects/fields, Gorgon-style `same_battlefield_opponents + face_up_cards_played_this_round_at_least`, Mephisto-style controller defeat, and widened predicates/scopes remain unsupported.

## Authoritative history and target derivation

Resolution uses only server-owned state:

- the controller must be active and currently at an enabled battlefield;
- candidate opponents are other active players at that exact battlefield;
- each candidate is checked against cards whose authoritative `cardState.playedRound` equals the current round and whose current controller is that candidate;
- the qualifying card must be classified by the stable authoritative `classifyCardPlay(definition).playKind === 'attack'` contract and contain the requested definition attribute;
- face-down visibility does not hide the definition from server-side rules evaluation and no hidden definition is projected to other players by this capability.

During focused validation, the first add-to-attack regression exposed an important boundary: Maiya's accepted `master.maiya.deck.support-shot` is a `master_skill` by card type but is authoritatively classified as an attack through the required-additional-play contract. The initial history predicate used the older card-type-oriented `isAttack()` helper and therefore missed this valid current-round attack. FB2-45 now deliberately reuses `classifyCardPlay()` instead, so ordinary plays and accepted add-to-attack provenance share the same stable attack classification rather than duplicating card-type guesses.

## Separate pre-battle defeat ledger

FB2-45 adds `PendingPreBattleDefeat`, keyed by current round + battlefield + controller/source/ability provenance with target player IDs.

- repeated resolution of the same exact source/ability/battlefield is idempotent;
- no matching candidate produces no ledger entry;
- round advance clears stale entries;
- battle settlement reads only entries matching the current round and exact battlefield;
- target IDs are intersected with actual battle participants before application;
- matching targets are routed through the existing `ignoresBattleLossEffects` check;
- non-immune targets are added to the existing winner-exclusion input before winner/scoring derivation;
- matching intents are consumed after settlement, including the existing Return Silence early-settlement path;
- Return Silence applies the same FB2-45 participant intersection and Basic Luck immunity before deciding whether its controller remains winner-eligible;
- resolving a different battlefield neither applies nor consumes the intent.

Presence Concealment remains independent. Its `pendingPresenceConcealmentDefeats` `resultId` + frozen-Power snapshot contract, response timing and dedicated result/log fields are untouched and its focused suite remains green.

## Focused evidence

The final FB2-45 focused suite proves:

- exact loader shape accepted and renamed identity-independent runtime classifier works;
- wrong phase, extra conditions/effects, wrong scope, wrong predicate, extra predicate fields and controller-defeat near-shape reject;
- `defeat_player` in `creates` and the new predicate token in condition/target-constraint positions fail closed through `preBattleDefeat.gateway`;
- an opponent with no qualifying current-round swift attack receives an intent and is excluded from winning settlement;
- an ordinary current-round `迅捷` attack prevents defeat;
- a face-down current-round `迅捷` attack also prevents defeat server-side;
- the real accepted Maiya add-to-attack gateway moves `master.maiya.deck.support-shot` to the recipient attack area, changes controller provenance, writes current `playedRound`, and consequently prevents FB2-45 defeat;
- a non-swift current-round attack and a previous-round swift attack do not protect;
- another battlefield and inactive player are not targeted;
- settling another battlefield does not apply or consume the intent;
- existing Basic Luck battle-loss immunity ignores the defeat consequence while still consuming the matching intent;
- a matching intent targeting the transformed Return Silence controller is applied before the special early return, removes that controller from winner eligibility, and is consumed; the same interaction with Basic Luck is ignored and consumed while preserving the Return Silence winner;
- repeated trusted resolution is idempotent;
- round advance clears stale intents;
- the complete existing Presence Concealment pre-scoring focused regression remains green.

A temporary executable-pack compiler probe (removed after execution) also replaced one existing legal servant-skill ability in-memory with the exact FB2-45 shape and ran the full `compileExecutableCardPack` path. The card and ability both remained `automatic`, proving the new syntax is not only loader-valid but also survives executable-pack compilation without adding a second compiler-specific semantic path.

## Candidate scope

The intended Candidate contains only:

- `packages/rules/src/ability/pre-battle-defeat.ts` — exact identity-free structural classifier and attribute reader;
- `packages/rules/src/ability/loader.ts` — narrow syntax admission + whole-ability fail-closed gate;
- `packages/rules/src/ability/interpreter.ts` — authoritative target/history derivation, intent staging, activation guard and round cleanup;
- `packages/rules/src/ability/types.ts` — dedicated typed pre-battle defeat ledger;
- `packages/rules/src/core/combat-resolver.ts` — exact round+battlefield settlement consumption through existing winner exclusion and immunity;
- `packages/rules/src/index.ts` — mechanical export;
- `packages/rules/tests/fb2-45-prebattle-defeat-round-attack-attribute.test.ts` — focused regression coverage;
- this result report.

No `data/authoring/**`, product pack, generated content, client production, frozen identity, character name or skill ID is changed by FB2-45. Added runtime lines contain no Medusa/servant/master/card-name identity literals.

## Validation

Fresh B2 worktree dependencies were installed with `npm.cmd ci --ignore-scripts --offline` (239 packages, 0 vulnerabilities).

Validation on the final working tree before Candidate commit:

- `npm.cmd run typecheck` — PASS.
- FB2-45 + Presence Concealment focused verification — PASS, **2 files / 20 tests**.
- FB2-45 + Presence Concealment + existing Return Silence/B23 focused compatibility — PASS, **3 files / 31 tests**.
- rules `src/__tests__ + core + regression + FB2-43 + FB2-44 + FB2-45` — PASS, **85 files / 530 tests**.
- `npm.cmd run test:ci -- --maxWorkers=2` — PASS, **170 files / 1211 tests**.
- `npm.cmd run content:validate` — PASS, **7 masters / 7 servants / 20 events / 0 blocking issues**.
- `npm.cmd run verify:generated-content` — PASS with unchanged hashes:
  - library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- `npm.cmd run phase3:reference:verify -- --reference-root E:\\Codex\\FD\\fd-reference` — PASS at exact Locked Reference `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- `npm.cmd run build --workspace @fd/client` — PASS; only existing Vite browser-externalization/chunk-size warnings.
- `npm.cmd run phase3:coverage` — PASS: **125 archives / 166 cards / 277 abilities / 0 blocking issues**; the generated coverage artifact was restored byte-for-byte from HEAD because it is validation output and outside FB2-45 scope.
- exact temporary executable-pack FB2-45 compile probe — PASS (`card.mode=automatic`, `ability.execution.mode=automatic`).
- `git diff --check` — PASS.
- runtime identity/hardcode audit — CLEAN.
- forbidden authoring/product/generated/client/artifact scope audit — CLEAN.

## Accounting / next gate

FB2-45 itself changes no frozen identity and cannot increase migration credit. Formal migration remains **`148/944`**, remaining **`796`** until a later formally accepted consumer migration changes it.

This result is only a Candidate for fresh independent R. No acceptance, synchronization or Medusa migration credit is claimed here.

Long-term S rule: **S 完成 recertification 并提交 Exact Base/Candidate**。
