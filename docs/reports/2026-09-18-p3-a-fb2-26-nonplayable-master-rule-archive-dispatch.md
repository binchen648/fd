# P3-A FB2-26 Non-Playable Master Rule-Definition Archive Dispatch

Date: 2026-09-18
Role: Codex A -> Codex B2
Status: `READY_FOR_B2`
Credit: zero frozen-migration credit

## Exact base and evidence

- Base: exact post-R53 acceptance synchronization `cb6f1312d505ff8e3c9cca84bd8840866df0fa8d`.
- Recovery-line accepted frozen overlap: `118/944` (`12.50%`), remaining `826/944`.
- Integrated `origin/main`: `553779e8ffcc926ae4763ee86a2ea937e090c128`, integrated accepted overlap `111/944`.
- Frozen F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`.
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`, verified clean at dispatch.
- Accepted game-start provisioning semantic: P3-R41 / FB2-15, Candidate `23a666913a3050ad55d781e3f5b3a1518add4c3e`.
- Accepted outside-game placement seam: P3-R43 / FB2-18, Candidate `cb81559033db6b96b1f26cf7d9bd15686db5d4fb`.
- Accepted master support-only registration seam: P3-R44-R2 / FB2-19, revised Candidate `211ba4994acaf063834c28bef9525366b88ae463`.
- Accepted provision targets already present on the recovery lineage:
  - Shirou derived support definition: `card.derived.master.shirou-emiya.ganjiang-moye`, P3-R45 accepted Candidate `1c3149ba5f33ad3092a57da4a12d7bbe96f43823`;
  - Ciel s2 support definition: `master.ciel.skill.s2`, P3-R47 accepted Candidate `35a2a59fd4bf77bdbbfac37031556617af94c47f`;
  - Ryougi s3 support definition: `master.shiki-ryougi.skill.s3`, P3-R49 accepted Candidate `8ff45c944ba810edfbfa93d17462d4c3cb6a4e16`.

## Throughput finding

A refreshed the remaining `826` frozen identities by exact source/semantic family rather than by broad capability labels. There is currently no honest `10-40` member direct-ready batch. The strongest already-accepted semantic family with multiple immediately closed downstream dependencies is the FB2-15 game-start provisioning family.

Exactly three frozen source identities now have all of their provision targets accepted and registered:

1. `master.ciel.skill.s1a` / 埋葬机关的修女
   - printed text: `将【火葬式典】加入你的技能区。`
   - frozen source SHA-256: `2cdf7e6bcc7876757898867a73658374247440ab0d78a6a21d2b8f34cf19d486`
   - accepted target: `master.ciel.skill.s2`
2. `master.shiki-ryougi.skill.s1a` / 欠损
   - printed text: `游戏开始时，将【死・紧握】加入你的技能区。`
   - frozen source SHA-256: `d1e84428f5798f573fd01ed7f061e937925424f2fbab89c4a43ad6af7782d98f`
   - accepted target: `master.shiki-ryougi.skill.s3`
3. `master.shirou-emiya.skill.s2` / 投影
   - printed text: `将【干将·莫邪】加入你的技能区。`
   - frozen source SHA-256: `a0ea1f45cedb3ac69c9d4050cfdadcf318cf32f62b749013a8454245535ca575`
   - accepted target: `card.derived.master.shirou-emiya.ganjiang-moye`

All three are members of the R41-reviewed exact FB2-15 future-consumer family and require no new provisioning execution semantic. Historical FM09 material is technical reconstruction evidence only; no historical migration acceptance is inherited.

## Current representation blocker

The three accepted target definitions currently occupy these canonical owner archives:

- `data/authoring/masters/master.ciel.json`
- `data/authoring/masters/master.shiki-ryougi.json`
- `data/authoring/masters/master.shirou-emiya.json`

Each archive is exact `master_support_definition_archive`, is registered through `authoringMasterSupportFiles`, and currently contains only `master_skill` cards with exact `initialPlacement: "outside_game"`.

That is the accepted FB2-19 contract. It deliberately fails closed if any support card omits `initialPlacement: "outside_game"`.

The three provisioning source skills cannot use that representation:

- a game-start provisioning source must be an ordinary owned `master_skill` definition that compiles with `initialZone: "skill"`;
- it must not itself be deferred/outside-game; FB2-15 explicitly rejects a provisioning source that is deferred or also a provisioning target;
- putting the source into the current support archive therefore violates FB2-19;
- changing the current archive to an ordinary playable-master archive would make the owner a product character and synthesize playable/fallback surface, which is exactly what FB2-19 was created to prevent;
- creating two simultaneously compiled archives with the same owner/archive id is rejected by the executable compiler as a duplicate archive definition.

Therefore the three sources are semantically ready but **not representable through any currently accepted product authoring channel** without regressing an already accepted contract.

## Selected generic seam

Dispatch **P3-FB2-26-NONPLAYABLE-MASTER-RULE-ARCHIVE**.

Add one identity-free, rules-only archive channel for a non-playable master owner whose rule definitions contain both:

- at least one ordinary `master_skill` definition that is not deferred and therefore receives the existing default `initialZone: "skill"`; and
- at least one owned `master_skill` definition with exact accepted `initialPlacement: "outside_game"`.

Proposed exact manifest field:

`authoringMasterRuleFiles?: string[]`

Proposed exact archive discriminator:

`archiveType: "master_rule_definition_archive"`

The names are part of this dispatch contract: B2 must not silently broaden the existing `authoringMasterSupportFiles` / `master_support_definition_archive` envelope.

## Required contract

### Content-loader boundary

A valid `master_rule_definition_archive` registered through `authoringMasterRuleFiles` must satisfy all of the following:

- archive id starts with `master.`;
- discriminator is exact;
- at least two cards exist;
- every card is `master_skill`;
- every card owner is `{ type: "master", id: <archive.id> }`;
- no deck;
- no playable `publicInformation`;
- at least one card has exact `initialPlacement: "outside_game"`;
- at least one other card omits `initialPlacement` and therefore uses the existing ordinary master-skill initial-zone behavior;
- no servant card, command spell, master deck card, presentation card, or unrelated ownership family is accepted through this channel.

A valid rule-definition archive must:

- enter `authoringArchives` and therefore `library.rules.archives` / the executable definition hash;
- not enter `library.masters`;
- not synthesize a master overview/presentation card;
- not create a fallback command spell;
- not create a deck or fixture seat;
- leave normal `authoringMasterFiles` and exact support-only `authoringMasterSupportFiles` behavior unchanged.

### Executable compiler boundary

The executable compiler must recognize the same exact discriminator and compile the archive rules-only:

- `ownerId` remains the exact archive/master owner id;
- ordinary non-deferred `master_skill` definitions keep existing default `initialZone: "skill"` behavior;
- exact `outside_game` definitions keep no `initialZone`;
- no `ExecutableCharacterDefinition`, fallback command spell, or deck is emitted for the archive;
- existing FB2-15 provisioning validation must work unchanged when an ordinary source in the archive targets an outside-game definition in the same archive;
- source and target ownership validation remains exact and fail closed;
- no provisioning execution behavior is added or changed.

The compiler must also fail closed on the structural mixed shape when the exact discriminator is missing, uses `master_skill_card_archive`, uses `master_support_definition_archive`, or uses a near-match discriminator. This preserves the R44 lesson that malformed rules-only master definitions must never fall through into the playable-master path.

## Explicit non-goals

FB2-26 must not:

- add Ciel, Ryougi, Shirou, or any other production authoring card;
- modify any production pack or generated artifact;
- modify MatchSession or ability interpreter provisioning execution;
- special-case owner/card ids, names, printed text, F1 labels, or Reference handlers;
- broaden `master_support_definition_archive` beyond its accepted all-`outside_game` contract;
- create arbitrary non-playable characters, arbitrary owner aliases, or arbitrary initial-placement values;
- change FB2-15 provisioning semantics, FB2-18 outside-game semantics, FB2-19 support-only semantics, taxonomy/KPI/F1/Reference, or frozen accounting;
- start or claim FM10;
- merge or retarget any stacked PR.

## May touch

Only:

1. `packages/content/src/playtest-pack-loader.ts` — new optional rules-only manifest channel and exact mixed archive validation.
2. `packages/rules/src/ability/executable-card-pack.ts` — exact mixed rules-only archive recognition, fail-closed guard, and no-character/no-fallback compilation.
3. `packages/content/src/__tests__/playtest-pack-loader.test.ts` — generic loader/adversarial tests.
4. `packages/rules/tests/executable-card-pack.test.ts` and/or one new focused FB2-26 regression file — generic compiler/provisioning coexistence tests.
5. `docs/reports/2026-09-18-p3-fb2-26-nonplayable-master-rule-archive-result.md`.

No `data/authoring/**`, `data/packs/**`, `data/generated/**`, apps, MatchSession, interpreter, phase3 inventory/taxonomy/KPI, artifacts, or Reference file may change.

## Required verification

B2 must prove at minimum:

- exact clean Base `cb6f1312d505ff8e3c9cca84bd8840866df0fa8d` and direct-parent lineage;
- a synthetic mixed master rule archive registered through `authoringMasterRuleFiles` enters `rules.archives` only and does not change playable master count, presentation cards, fixture seats, fallback command spells, or decks;
- ordinary source card receives `initialZone: "skill"` and outside-game target receives no `initialZone`;
- both compiled cards carry the same exact master owner id;
- an exact FB2-15 source -> target pair in the same archive compiles and executes through the existing provisioning contract without changing the interpreter;
- malformed/wrong/near-match discriminators fail closed at both loader and executable compiler boundaries;
- all-outside-game shape remains owned by exact FB2-19 support archives rather than being absorbed by FB2-26;
- all-non-deferred normal-master shape is not silently reclassified as FB2-26;
- wrong owner, empty archive, one-card archive, non-master-skill card, deck/public-information surface, and mismatched card owner fail closed;
- existing FB2-15, FB2-18, FB2-19 regressions remain green;
- `npm.cmd run typecheck`;
- focused content + executable tests;
- `npm.cmd run test:ci`;
- rules src/core/regression suite;
- client production build;
- `npm.cmd run content:validate` and generated determinism on unchanged production data;
- locked Reference verification;
- phase3 coverage/audit unchanged apart from non-semantic generated timestamps, which must be restored;
- `git diff --check`, exact May-touch audit, and final clean worktree.

Completion status allowed:

- `IMPLEMENTATION_COMPLETE_CANDIDATE`
- `IMPLEMENTATION_NEEDS_REVISION`
- `IMPLEMENTATION_BLOCKED`

Fresh independent R review is mandatory. FB2-26 itself earns zero frozen migration credit.

## Post-acceptance migration opportunity

If and only if fresh R accepts FB2-26 and A synchronizes that acceptance, the next S task may be a separate exact three-source provisioning tranche for:

- `master.ciel.skill.s1a`;
- `master.shiki-ryougi.skill.s1a`;
- `master.shirou-emiya.skill.s2`.

That later S task must reuse only the already accepted FB2-15 semantic, preserve the three frozen hashes above, convert only the three affected owner archives to the newly accepted rules-only representation, preserve the already accepted target definitions unchanged, and update product registration/generated outputs only as mechanically required by the new archive channel.

Mechanical candidate material would be `118/944 -> 121/944` if and only if exactly those three frozen source identities are added with zero removals/duplicates. Formal accepted overlap remains `118/944` until that separate S Candidate receives fresh `MIGRATION_ACCEPTED` and a later A acceptance synchronization.

The historical exact-ten P3-FM09 recovery attempt remains a blocked historical task. FB2-26 does not accept the remaining source identities and does not change the nine still-unresolved provisioning target identities. No FM10 is dispatched.
