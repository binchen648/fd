# P3-A FM09 current-main dependency / authoring handoff

Role: Codex A\r\nStatus: `DEPENDENCY_HANDOFF_READY` (no authoring, acceptance, credit, A-sync, or merge)\r\nTask: `P3-FM09`\r\nExact Base: `1afe10ff9c1c1a65a0c2b68c56c5607cb0c1c447`\r\nBranch: `codex/a-p3-fm09-current-main-handoff-20261026`

## Determination

FM09 is the locked `core.game-start-add-skill` capability family: an identity-free, forced `game_start` ability provisions one or more declared skill-card definitions into the controller's skill zone. The future source batch is exactly these ten frozen identities; the arrows are provisioning targets, not extra FM09 source credit:

1. `master.bazett.skill.s1` -> `master.bazett.skill.s2`
2. `master.caules-yggdmillennia.skill.s1` -> `master.caules-yggdmillennia.skill.s2`, `master.caules-yggdmillennia.skill.s3`
3. `master.ciel.skill.s1a` -> `master.ciel.skill.s2`
4. `master.fujino.skill.s1` -> `master.fujino.skill.s3`
5. `master.shiki-nanaya.skill.s1` -> `master.shiki-nanaya.skill.s2`
6. `master.shiki-ryougi.skill.s1` -> `master.shiki-ryougi.skill.s2`
7. `master.shiki-ryougi.skill.s1a` -> `master.shiki-ryougi.skill.s3`
8. `master.shiki-tohno.skill.s1` -> `master.shiki-tohno.skill.s2`
9. `master.shirou-emiya.skill.s2` -> `card.derived.master.shirou-emiya.ganjiang-moye`
10. `master.zouken.skill.s2` -> `master.zouken.skill.s3`, `master.zouken.skill.s4`

Explicit exclusions remain `master.fiore.skill.s1`, `master.sion.skill.ascension`, and `master.tokiomi.skill.s2`. The derived Shirou target is outside the frozen 944 denominator; the eleven other targets are separate frozen identities and cannot be silently absorbed into the ten-source migration.

## Current-main dependency audit

The exact FM08 A-sync at `1afe10ff` carries FM08's ten accepted RuleOverride cards and focused test, plus the retained prior FM07/FM06/FM05/FB2-13/FB2-02/FB2-11/FB2-12/B23 line. Inspection of the exact Base shows the FM09 provisioning predicate/runtime and the required-additional/private cross-player interaction seams are not present. The existing `private_optional_hand_play_v1` is a different controller-hand play contract and cannot be widened by implication.

FM09 authoring is therefore not ready on this Base. The legal dependency order is:

### FB2-15 — game-start provisioning (first gate, zero credit)

Required contract: one shared structural classifier used by compiler and runtime; only automatic/forced `game_start` provisioning with nonempty target IDs; every target must already be a registered same-owner automatic `master_skill`; distinct targets are provisioned exactly once as controller-owned, face-up, inactive, non-temporary skill-zone cards. Empty, duplicate, malformed, unknown, wrong-owner/type/zone, non-automatic, and non-game-start declarations must fail closed; multi-target setup must preflight and roll back atomically; replay/restore must be idempotent.

Historical accepted runtime scope (to be freshly materialized/reviewed on this Base, not copied as acceptance) is:

- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/ability/game-start-skill-provisioning.ts` (new)
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/loader.ts`
- `packages/rules/tests/executable-card-pack.test.ts`
- `packages/rules/tests/regression/fb2-game-start-skill-provisioning.test.ts`

The generated content file may change only if the exact executable classification deterministically requires it. No FM09 authoring, target placeholders, identity routing, or credit is allowed in FB2-15.

### FB2-16 — required additional-play marker (second gate, zero credit)

The derived Shirou target requires the identity-free bare `append_only_rule` marker. Its exact contract is: regular-play batches may include one or more required-additional cards only alongside an otherwise legal ordinary attack batch; they pay atomically, count in `cardsPlayedThisRound`, do not consume the ordinary attack allowance, and required-additional-only batches remain illegal. Foreign `append_only_rule` shapes with another explicit rule (including `ignore_battle_loss_effects`), optional/conditional permissions, effect-play, and explicit extra-regular-play allowances remain excluded.

Fresh materialization is limited to:

- `packages/rules/src/ability/executable-card-pack.ts`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/required-additional-play.ts` (new)
- `packages/rules/tests/executable-card-pack.test.ts`
- `packages/rules/tests/regression/fb2-required-additional-play.test.ts`

It must remain zero-credit infrastructure and must not register the derived card or any FM09 source/target identity.

### FB2-23 — Ryougi s3 interaction seam (third gate, zero credit)

`master.shiki-ryougi.skill.s3` additionally requires an action-phase interaction that selects one active player at the controller's same battlefield (not opponent-only), privately snapshots that player's hand to the controller, permits `0..1` selection, and on one selection returns that physical card to its owner's deck followed by deterministic shuffle. Unrelated viewers must not receive candidate IDs/definitions. Settlement must revalidate source, controller, selected player, same-battlefield relation, snapshot membership, owner/zone, revision, and continuation identity; stale/forged/duplicate/terminal replay is mutation-free.

Fresh materialization is limited to:

- `packages/rules/src/ability/types.ts`
- `packages/rules/src/ability/interaction-gateway.ts`
- `packages/rules/src/ability/loader.ts`
- `packages/rules/src/ability/interpreter.ts`
- one focused regression under `packages/rules/tests/regression/`

Reuse current PendingDecision, projection, serialization, deterministic shuffle, and card-zone transaction machinery. If MatchSession or broad target infrastructure is required, stop as blocked rather than widening scope. Preserve `private_optional_hand_play_v1` unchanged.

## Historical provenance reuse decision

The old FM09 recovery blocker, FB2-15/16/23 Candidates, R41/R42/R48 reviews, and their A synchronizations are planning/reference material only. They were accepted on earlier recovery bases (for example `553779e8...`, `ee0c4a6d...`, and `077dac0d...`), not on exact current-main Base `1afe10ff`; their acceptance, credit, and reports cannot be relabeled as current-main provenance. No historical Candidate/Reviewer/A-sync is copied into this branch.

The historical ten-source shape and exclusions are reusable only as read-only F1/Reference reconstruction inputs. Before any S authoring, fresh B/R/A work must establish all three zero-credit dependency gates on this exact Base, then rescan target registration and transitive support. In particular, do not jump directly to Ciel, Ryougi, or any FM09 source archive; do not create placeholders; do not weaken the compiler; and do not count the derived Shirou card as frozen coverage.

## Required next sequence

1. Dispatch fresh FB2-15 runtime/test materialization from exact Base `1afe10ff9c1c1a65a0c2b68c56c5607cb0c1c447`; obtain independent review and A synchronization.
2. Dispatch fresh FB2-16 only after FB2-15 is accepted/synchronized; obtain independent review and A synchronization.
3. Dispatch fresh FB2-23 only after its prerequisite path is accepted/synchronized; obtain independent review and A synchronization.
4. Recompute exact ten-source membership and all twelve target registrations on the resulting current-main lineage.
5. Only when every target definition and transitive dependency is legitimately registered may a separate S authoring Candidate add exactly the ten FM09 source identities. That Candidate must not include dependency runtime, placeholders, unrelated targets, generated drift, task-index edits, or governance changes.
6. Fresh R review and fresh A synchronization are required before any FM09 credit. Until then FM08's synchronized accounting remains `143/944`; FM09 contributes `+0`.

This A-owned report is planning/evidence only. It does not write FM09 authoring, materialize runtime, perform A-sync, alter credit, or merge/retarget any PR.
