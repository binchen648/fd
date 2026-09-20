# P3-FB2-19 Recovery Master Support-Only Authoring Registration Handoff

Date: 2026-09-18
Role: Codex A -> Codex B2
Status: `READY_FOR_B2_RECOVERY`
Credit: zero frozen-migration credit

## Exact base and evidence

- Base: exact fresh P3-A-FB2-17-R1-RECOVERY-BLOCKER-SYNC commit carrying this handoff.
- Fresh FB2-17-R1 blocker: `7e0356146766486180bcd959ee4e90dcfe193be5`.
- Fresh R43-accepted outside-game seam: FB2-18 candidate `cb81559033db6b96b1f26cf7d9bd15686db5d4fb`.
- Existing accepted game-start provisioning: FB2-15 / R41 lineage.
- Existing accepted required-additional marker: FB2-16 / R42 lineage.

Historical FB2-19 implementation/review is technical evidence only and carries no acceptance authority for this recovery.

## Goal

Add exactly one identity-free infrastructure seam for **master-owned support-definition authoring archives**.

A support archive must be loadable into canonical `authoringArchives` / `rules.archives` and executable card definitions while remaining outside the selectable/presentation master roster.

This task does not add any production support card, Shirou data, frozen skill, migration, or pack entry. It only adds the generic registration capability required by a later fresh FB2-17-R2 retry.

## Required contract

### Manifest / content-loader boundary

Introduce one narrowly named optional manifest input, `authoringMasterSupportFiles?: string[]`, with exact archive discriminator:

`archiveType: "master_support_definition_archive"`

For every support archive, fail closed unless all of the following hold:

- archive id starts with `master.`;
- discriminator is exact;
- at least one card exists;
- every card is `master_skill`;
- every card uses exact accepted `initialPlacement: "outside_game"`;
- no deck definition or playable-master public-information surface exists;
- no servant card, command spell, normal master-deck surface, or other ownership family is accepted through this channel.

A valid support archive must:

- enter `authoringArchives` and therefore `library.rules.archives` / definition hash;
- not be converted through normal playable-master conversion;
- not add to `library.masters`;
- not create master overview/presentation cards merely because it is registered;
- not alter the normal 7-master / 7-servant fixture roster;
- preserve the ordering and behavior of normal master/servant archives.

A support archive registered through ordinary `authoringMasterFiles` must fail closed instead of silently becoming a playable master.

### Executable compiler boundary

The executable compiler must recognize the same exact support-archive discriminator.

For a valid support archive it may compile cards and source-map entries with `ownerId` derived structurally from the archive id, but must not:

- emit an `ExecutableCharacterDefinition`;
- synthesize a fallback command spell;
- create a deck or initial playable character material;
- disturb existing normal archive source-map indices merely because support definitions are appended;
- alter FB2-15 provisioning execution or validation;
- alter FB2-16 required-additional semantics;
- alter FB2-18 outside-game semantics.

The support card definition must remain registered and preserve `initialPlacement: "outside_game"` with no `initialZone`.

Malformed support archives must fail closed before silently becoming normal master archives.

## Explicit non-goals

Do not:

- special-case `master.shirou-emiya`, `干将·莫邪`, any specific card ID/name/text, or Reference handler;
- add arbitrary support ownership for servants/events/deck cards/command spells;
- add general arbitrary-zone initial placement;
- change MatchSession, interpreter, provisioning execution, required-additional execution, scoring/combat, UI/server, taxonomy/KPI, F1/Reference;
- change production authoring data, production pack entries, or production generated artifacts;
- relax existing normal master/servant validation or fallback-command-spell behavior for normal master archives.

## May touch

Only:

1. `packages/content/src/playtest-pack-loader.ts` — optional master-support manifest channel, exact support-archive validation, and rules-only assembly.
2. `packages/rules/src/ability/executable-card-pack.ts` — support-archive executable registration without character/fallback material.
3. `packages/content/src/__tests__/playtest-pack-loader.test.ts` — focused generic loader tests only.
4. `packages/rules/tests/executable-card-pack.test.ts` and/or one new focused FB2-19 regression file — generic compiler/coexistence tests only.
5. `docs/reports/2026-09-18-p3-fb2-19-recovery-master-support-only-authoring-registration-result.md`.

No `data/authoring`, `data/packs`, `data/generated`, MatchSession, interpreter, taxonomy/KPI, frozen migration, or Reference file may change.

## Required verification

At minimum prove:

- exact clean Base and lineage;
- a synthetic support archive enters `rules.archives` but does not change playable master count, presentation cards, fixture seats, or normal master/servant archive order;
- its outside-game `master_skill` becomes an executable definition with correct owner and no `initialZone`;
- no executable character, fallback command spell, or deck is emitted for the support archive;
- malformed discriminator, wrong owner family, non-master-skill card, missing outside-game placement, deck surface, playable public-information surface, and empty archive fail closed;
- support archive registered through normal master channel fails closed;
- normal `authoringMasterFiles` behavior remains unchanged, including fallback command spells for ordinary masters;
- FB2-15 provisioning, FB2-16 required-additional, and FB2-18 outside-game regressions remain green;
- `npm.cmd run typecheck`;
- focused content + executable tests;
- full `npm.cmd run test:ci`;
- client production build;
- `npm.cmd run content:validate` on unchanged production data;
- `npm.cmd run verify:generated-content` on unchanged production generated files;
- locked Reference verify;
- phase3 coverage/audit unchanged;
- `git diff --check` and exact May-touch scope audit;
- final worktree clean.

Completion status allowed:

- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`
- `IMPLEMENTATION_BLOCKED`

Any candidate still requires fresh independent `P3-R44-RECOVERY` review and post-review A synchronization before FB2-17-R2 may be dispatched.
