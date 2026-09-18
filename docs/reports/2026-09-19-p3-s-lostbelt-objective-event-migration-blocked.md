# P3-S Lostbelt Objective Event Definitions Migration Blocked

Role: Codex S
Status: `MIGRATION_BLOCKED`
Date: 2026-09-19

## Exact dispatched baseline

- Exact A dispatch commit: `5d6a9982c0fead6c28fa73446f68ccf31562048c`
- Exact accepted capability baseline behind the dispatch: `1c33320b468825dd7e37b5ede6645bb29e5ee333` (R61 FB2-28 acceptance synchronization)
- Accepted FB2-28 Revision Candidate: `69f2fb09ca951957148f965df459bb3063323800`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Formal accepted frozen overlap remains `127/944`; remaining `817`.

The dispatch authorized exactly four homogeneous `core.lostbelt-objective` event definitions: Kadoc s3 and Ophelia s5/s6/s7. S did not broaden scope or migrate a partial subset.

## Blocking finding

FB2-28 supplies a rules-only `event_rule_definition_archive`, an executable `eventRules` map, an `eventCatalog`, event lifecycle operations, source-battlefield trigger context, and runtime preservation/restoration of catalog battle modifiers. However, the accepted compiler path does **not** compile static battle-modifier metadata from a rules-only event definition into `eventCatalog`.

For ordinary production event content, `eventStaticMetadata(...)` derives `battleModifiers` from ordinary event-card effects. For rules-only event definitions, `eventCatalogFromContent(...)` currently copies only event tags, event-set IDs, printed reward, and applicable locations. It does not derive or copy a rules-only event definition's static battle modifiers.

This blocks three dispatched identities:

- `master.ophelia.skill.s5` requires Strength `+4`, Agility `-2` at its battlefield;
- `master.ophelia.skill.s6` requires Agility `+4`, Magecraft `-2` at its battlefield;
- `master.ophelia.skill.s7` requires Magecraft `+4`, Strength `-2` at its battlefield.

The combat resolver consumes `EventPlacementState.battleModifiers`; the generic event lifecycle obtains those from `eventCatalog`. Therefore an authoring field that remains only inside `eventRules` is not executable static metadata.

## Fresh S reproduction

S installed the fresh worktree with `npm ci --offline` (239 packages) and ran a temporary reviewer-style Vitest probe against the real compiler. The probe:

1. loaded the real current playtest content;
2. appended one synthetic `event_rule_definition_archive`;
3. placed two static battle-modifier entries under that rules-only event card's authoring metadata;
4. compiled through `compileExecutableCardPack(...)`;
5. verified the metadata remained present in `executable.eventRules[cardId]`;
6. verified `executable.eventCatalog[cardId].battleModifiers === undefined`.

The probe passed `1/1`, proving the metadata has no executable catalog path. The temporary test file was deleted and is not part of this result.

## Why S does not work around the blocker

S scope explicitly forbids `packages/rules/src/**` or compiler/runtime changes. Encoding Ophelia s5/s6/s7 as invented triggers would also violate the dispatch requirement to use accepted generic static event metadata rather than manufacture trigger semantics.

Kadoc s3 itself is representable by the accepted FB2-28 event-source envelope (`event_player`, source-battlefield condition, generic `adjust_mana -2` on deploy/enter). S nevertheless does not submit a one-card partial Candidate because the A dispatch authorized one exact four-card homogeneous migration and its expected accounting was `127 -> 131`.

## Scope / accounting

This blocked S result changes no authoring card, runtime source, production pack, generated product, F1/taxonomy data, app code, or FM09/FM10 state.

Frozen accounting therefore remains exactly:

- denominator: `944`;
- formal accepted overlap: `127/944`;
- candidate additions: `0`;
- removals: `0`;
- remaining: `817`.

Historical P3-FM09 remains `MIGRATION_BLOCKED`.

## Required next capability

A later B2 task may add a narrow identity-free rules-only event static battle-metadata authoring/compiler contract that maps structured attribute modifiers into `eventCatalog.battleModifiers`, with strict validation and product isolation. No Ophelia/Kadoc identity, text, handler, F1 hash, or Reference hash may participate in runtime/compiler routing.

Until that capability is independently accepted, this four-card migration must remain blocked.
