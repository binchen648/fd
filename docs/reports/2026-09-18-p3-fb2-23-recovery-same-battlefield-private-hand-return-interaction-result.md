# P3-FB2-23 Recovery — Same-Battlefield Private Hand Return Interaction Result

Date: 2026-09-18
Role: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Base: `077dac0d8f9ca7956554e3cb45511f8edf659156`
Credit: zero frozen migration credit

## Result

Implemented exactly one identity-free interaction seam for a same-battlefield player private-hand inspection followed by optional `0..1` return-to-owner-deck and owner-deck shuffle.

No production authoring/content/generated pack is changed and no frozen identity is materialized by this task. The implementation is deliberately structural; no Ryougi/Ciel/Bazett/Zouken/card-name/printed-text/Reference handler or target-specific allowlist is present in production code.

## Exact semantic envelope

The accepted Candidate shape is reserved by two exact authoring vocabulary nodes:

- player target constraint `same_battlefield_as_controller`;
- effect `inspect_target_hand_optional_return_one_to_owner_deck` referencing that player target.

The interaction-gateway classifier reserves those node types anywhere in an ability and fails closed unless the entire ability is the exact supported shape:

- `phase_action`;
- action phase / `controller_action_window`;
- source must be active;
- exactly one player target, exactly `1..1`;
- exactly one constraint, `same_battlefield_as_controller`;
- no invented `not_controller` requirement;
- exactly one hand-inspection/return effect;
- no conditions, cost, creates, rule modifiers, lifecycle, response window, or limit;
- automatic execution.

Supported near-matches and typo/alternate vocabulary are rejected by loader/gateway validation instead of falling through to another runtime route.

## Two-stage server-owned interaction

Stage 1 reuses the existing generic player `PendingDecision`. Candidate players must be active and at exactly the same battlefield as the ability controller. Because the source wording only says “a player at the same battlefield,” controller self-selection remains legal and is regression-tested.

After the player is selected, Stage 2 creates server-owned interaction metadata:

- kind `same_battlefield_private_hand_return_v1`;
- `owner_only` visibility;
- selected player id and player-target id bound into metadata;
- exact controller-visible snapshot of the selected player's current hand;
- exact `0..1`, distinct card-selection constraint;
- revision / continuation / source-card / ability identity bound for settlement.

Only the ability controller receives the Stage-2 pending decision and inspected candidate card definitions. The selected hand owner continues to see their own hand through ordinary ownership projection. Unrelated observers receive neither the candidate instance ids nor inspected card definitions.

## Settlement / fail-closed boundaries

Before mutation, settlement revalidates:

- interaction kind/template/visibility/cancel policy;
- continuation id and exact runtime revision;
- pending controller equals effect context controller;
- source card/controller/source-active state;
- source ability still matches the exact structural semantic;
- exact synthetic Stage-2 target shape;
- selected-player metadata equals Stage-1 selection;
- selected player is still active and still at the controller battlefield;
- snapshot ids are distinct and every snapshot card still belongs to the selected player and remains in hand;
- submitted selection is `0..1`, distinct, within the original snapshot, and currently legal.

`dispatchAbilityCommand`'s existing clone-then-commit transaction means any stale/forged rejection is mutation-free.

Selecting zero deletes the pending decision without moving cards or advancing shuffle RNG. Selecting one card moves exactly that selected player's card into that card owner's deck and calls the existing deterministic `shuffle(s, ownerId)` for that owner, never the ability controller by assumption.

The only new settlement event is `deck_shuffled` with the affected owner player id, source card and ability; it does not contain the private selected card instance id. Existing MatchSession behavior already redacts `choose_target` payloads for `owner_only` interactions, and MatchSession source is unchanged.

## Compatibility / privacy evidence

Focused regression proves:

- exact structural classification and fail-closed near-matches;
- same-battlefield player candidates only;
- literal self-selection is accepted;
- only the ability controller receives inspected candidate ids/definitions;
- unrelated observers cannot see selected-hand candidates;
- unselected players' hand cards are excluded;
- zero selection leaves cards/decks/RNG unchanged;
- one selection returns only that card to the selected player's deck and leaves controller deck ordering unchanged;
- MatchSession serialize/restore preserves the private interaction snapshot safely without modifying MatchSession source;
- late-added cards cannot be selected;
- departed/wrong-owner snapshot cards fail closed;
- wrong controller, duplicate selection, changed battlefield and forged continuation/revision/selected-player metadata fail closed and mutation-free;
- terminal replay cannot apply the interaction twice;
- existing `private_optional_hand_play_v1` regression remains green.

## Validation

Fresh B2 validation:

- `npm ci --offline`: PASS, 239 packages, 0 vulnerabilities;
- typecheck: PASS;
- focused FB2-23 + existing private optional interaction: `2 files / 16 tests PASS`;
- unchanged official `npm run test:ci`: `132 files / 859 tests PASS`;
- timing-sensitive eleven-round MatchSession test completed at about 4437 ms with no timeout/config/test modification;
- rules core + regression: `72 files / 444 tests PASS`;
- client production build: PASS, existing Vite `node:crypto` warning only;
- content validation: `7 masters / 7 servants / 20 events / 0 blocking issues`;
- official content compilation: PASS;
- generated determinism: PASS;
- locked Reference verification at `b2f9fa15fba07c63530bbf4612b03b8b704755f9`: PASS;
- phase3 coverage: PASS;
- automation audit: PASS;
- `git diff --check`: PASS.

Coverage/audit commands temporarily rewrote their reporting artifacts; both files were restored exactly before Candidate commit.

## Unchanged product/accounting baseline

No content/product file changes. Fresh verification remains:

- content library hash: `2ffde7a8cf54611332456fe91b812ab6d36d98800f5b8d53f57394d65c05e572`;
- fixture hash: `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
- evidence hash: `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`;
- material: `100 archives / 135 cards / 235 abilities`;
- compiled: `72 cards / 14 characters / 0 blockers`;
- buckets: `22/3/130/0/80/127`;
- automation audit: `130/3/80/20`;
- F1 denominator: 944 unique identities;
- canonical authoring frozen overlap: `112/944`;
- duplicate canonical authoring ids: 0;
- recovery-line accepted overlap: `112/944`;
- integrated `origin/main` remains `553779e8ffcc926ae4763ee86a2ea937e090c128` with integrated accepted overlap `111/944`.

FB2-23 itself earns zero frozen migration credit.

## Exact Candidate scope

Candidate scope is exactly six files:

1. `packages/rules/src/ability/types.ts`;
2. `packages/rules/src/ability/interaction-gateway.ts`;
3. `packages/rules/src/ability/loader.ts`;
4. `packages/rules/src/ability/interpreter.ts`;
5. `packages/rules/tests/regression/fb2-same-battlefield-private-hand-return-interaction.test.ts`;
6. this result report.

No MatchSession source, executable compiler, authoring/content/generated product, pack, taxonomy/KPI, F1/Reference, coverage/audit artifact, UI/server, or frozen migration file changes are present.

## Next gate

Stop after committing/pushing this Candidate and opening a stacked PR on the exact planning branch. Fresh independent `P3-R48-RECOVERY` is mandatory before any Ryougi support-definition attempt.

Do not self-review, add `master.shiki-ryougi.skill.s3`, continue another frozen target, retry FM09, start FM10, or merge/retarget a stacked PR from this result.
