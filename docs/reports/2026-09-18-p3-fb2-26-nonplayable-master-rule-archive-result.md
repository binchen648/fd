# P3-FB2-26 Non-Playable Master Rule-Definition Archive Result

Date: 2026-09-18
Role: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Credit: zero frozen-migration credit

## Exact lineage

- Base / A dispatch: `0d2f089805a02b377d0cd460d4ebc705143797ca`.
- Base parent / post-R53 acceptance sync: `cb6f1312d505ff8e3c9cca84bd8840866df0fa8d`.
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`.
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- Recovery accepted frozen overlap at Base and Candidate: `118/944` (`12.50%`), remaining `826/944`.
- Integrated `origin/main` accounting is not changed by this task.

This task implements only the zero-credit representation prerequisite dispatched by A. It does not migrate Ciel, Ryougi, Shirou, any FM09 source, or any other frozen identity.

## Result

The implementation adds one exact rules-only authoring channel for a non-playable master owner whose single archive needs to contain both:

- ordinary non-deferred `master_skill` rule definitions; and
- exact `initialPlacement: "outside_game"` `master_skill` definitions.

The channel is intentionally separate from both existing master channels:

- manifest field: `authoringMasterRuleFiles?: string[]`;
- archive discriminator: `master_rule_definition_archive`.

The implementation changes no provisioning execution semantic. Existing R41 / FB2-15 game-start provisioning is reused unchanged.

## Content-loader contract

`packages/content/src/playtest-pack-loader.ts` now recognizes `authoringMasterRuleFiles` and validates each registered archive fail-closed.

An exact `master_rule_definition_archive` must:

- use an id beginning with `master.`;
- contain at least two cards;
- contain only `master_skill` cards;
- give every card exact owner `{ type: "master", id: <archive.id> }`;
- define no deck;
- define no playable `publicInformation`;
- contain at least one exact `initialPlacement: "outside_game"` card;
- contain at least one ordinary card that omits `initialPlacement`;
- use no other `initialPlacement` value.

A valid rule archive enters `authoringArchives` / compiled `rules.archives`, but is not converted into the playable master list or presentation-card surface.

The existing `authoringMasterSupportFiles` / `master_support_definition_archive` contract remains unchanged and still requires every support card to be exact `outside_game` material.

## Executable compiler contract

`packages/rules/src/ability/executable-card-pack.ts` recognizes the same exact discriminator and treats both accepted rules-only master archive kinds as non-playable:

- `master_support_definition_archive`;
- `master_rule_definition_archive`.

For an exact mixed rule archive:

- ordinary `master_skill` definitions keep the existing default `initialZone: "skill"` behavior;
- exact outside-game definitions preserve `initialPlacement: "outside_game"` and receive no `initialZone`;
- all card definitions receive the exact archive master owner id;
- no `ExecutableCharacterDefinition` is emitted;
- no fallback command spell is synthesized;
- no deck is created.

The existing game-start provisioning compiler validation is not modified. A synthetic same-owner source -> outside-game target pair compiles through that existing validation and executes through the unchanged interpreter.

## Fail-closed boundaries

Focused tests cover both loader and executable compiler rejection of malformed or widened shapes, including:

- missing rule discriminator;
- normal-master discriminator on a mixed rules-only shape;
- support-only discriminator on a mixed shape;
- near-match rule discriminator;
- wrong owner family;
- fewer than two cards;
- non-`master_skill` cards;
- no outside-game member;
- no ordinary non-deferred member;
- card owner differing from archive owner;
- unsupported initial placement;
- deck surface;
- playable `publicInformation` surface.

The executable compiler additionally preserves the structural discriminator guard learned from R44:

- an all-outside-game rules-only shape remains owned by exact FB2-19 `master_support_definition_archive` and cannot be relabeled as the new rule archive;
- a mixed ordinary/outside-game shape cannot silently fall through into the playable master path when its exact rule discriminator is missing or wrong.

## Runtime proof

`packages/rules/tests/regression/fb2-nonplayable-master-rule-archive.test.ts` constructs an identity-free synthetic `master_rule_definition_archive`, sends it through the real content-to-executable compiler, initializes the production ability runtime, and processes a trusted `game_start` event.

It proves:

- the source definition compiles with `initialZone: "skill"`;
- the target definition remains outside game with no `initialZone`;
- the rules-only owner emits no character, fallback command spell, or deck;
- the unchanged FB2-15 interpreter creates exactly one target in the controller's skill zone;
- created material is owner-only, controller-owned, and records the exact source instance and ability id in the typed `card_created` event.

No `packages/rules/src/ability/interpreter.ts` or MatchSession source change is present.

## Exact implementation scope

Production implementation:

1. `packages/content/src/playtest-pack-loader.ts`
2. `packages/rules/src/ability/executable-card-pack.ts`

Focused regression coverage:

3. `packages/content/src/__tests__/playtest-pack-loader.test.ts`
4. `packages/rules/tests/executable-card-pack.test.ts`
5. `packages/rules/tests/regression/fb2-nonplayable-master-rule-archive.test.ts`

Result evidence:

6. `docs/reports/2026-09-18-p3-fb2-26-nonplayable-master-rule-archive-result.md`

Zero Candidate diff is present under:

- `data/authoring/**`;
- `data/packs/**`;
- `data/generated/**`;
- `apps/**`;
- `packages/rules/src/ability/interpreter.ts`;
- `packages/rules/src/match-session.ts`;
- `scripts/**`;
- `artifacts/**` after restoring command-generated coverage/audit outputs;
- locked Reference.

Production implementation contains no Ciel/Ryougi/Shirou id, owner, name, printed-text, frozen hash, or Reference-handler routing.

## Validation

Fresh B2 validation from the exact dispatch Base environment:

- `npm ci --offline`: PASS, 239 packages, 0 vulnerabilities.
- `npm run typecheck`: PASS.
- focused loader/compiler + FB2-15 + FB2-26 regression: **4 files / 110 tests PASS**.
- official `npm run test:ci` on the final Candidate: **137 files / 913 tests PASS**.
- rules `src + core + regression`: **79 files / 470 tests PASS**.
- `npm run content:validate`: PASS, `7 masters / 7 servants / 20 events / 0 blocking issues`.
- `npm run content:compile`: PASS, same product roster.
- generated determinism: PASS with unchanged hashes:
  - library `03582e22b830c59ccfe03379159dd5e50aef19fd7bae3561469c000e56618a79`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- locked Reference verification: PASS at exact `b2f9fa15fba07c63530bbf4612b03b8b704755f9`, clean.
- client production build: PASS; existing Vite `node:crypto` browser-externalization warning only.
- Phase 3 coverage: PASS, `106 archives / 141 cards / 246 abilities`; compiled `73 cards / 14 characters / 0 blockers`; routing buckets `22/3/135/0/86/131`.
- automation audit: PASS, `135/3/86/20`.
- mechanical frozen accounting: denominator `944`, Candidate overlap `118`, remaining `826`, duplicate canonical ids `0`.
- `git diff --check`: PASS before result-report finalization and rerun in final scope check.

### Investigated full-CI timing flake

The first official `npm run test:ci` attempt had exactly one failure: the pre-existing 11-round MatchSession test exceeded its fixed 5000 ms timeout, completing around `5322 ms`. No FB2-26 test failed, and this Candidate changes neither MatchSession, the ability interpreter, nor production content.

B2 did not suppress or relabel that failure. It was independently investigated under equivalent prepared environments:

- exact Base `0d2f089...`, isolated same 11-round test: **PASS ~2012 ms**;
- Candidate, isolated same 11-round test: **PASS ~1859 ms**;
- Candidate, final-code full official rerun after the structural loader guard: **PASS ~3883 ms** for the same 11-round case and **137/137 files, 913/913 tests PASS** overall.

The evidence therefore supports a machine/concurrency timing flake rather than a Candidate regression. No timeout or MatchSession test threshold was changed.

## Frozen accounting / downstream opportunity

FB2-26 earns **zero frozen migration credit**:

- Base accepted/material overlap: `118/944`;
- Candidate material overlap: `118/944`;
- additions: `0`;
- removals: `0`;
- duplicate canonical ids: `0`.

If and only if a fresh independent R accepts this infrastructure Candidate and A later synchronizes that capability acceptance, a separate S task may attempt exactly the three already identified FB2-15 source consumers:

- `master.ciel.skill.s1a`;
- `master.shiki-ryougi.skill.s1a`;
- `master.shirou-emiya.skill.s2`.

That later migration could mechanically produce `118/944 -> 121/944` Candidate material only if those three are the exact additions with zero removals/duplicates. This B2 Candidate itself does not authorize or claim that migration.

Historical P3-FM09 exact-ten recovery remains blocked for its unresolved dependencies. No FM10, merge, or retarget is performed by this task.

## R54 revision — malformed mixed-shape fallthrough

Fresh independent R54 returned `IMPLEMENTATION_NEEDS_REVISION` after reproducing a fail-closed bypass: a mixed master-rule shape with a missing, ordinary-master, or near-match discriminator could avoid the structural guard when the same archive also carried forbidden `deck` or `publicInformation`, then fall through to the ordinary playable-master path.

The B2 revision is intentionally narrow. `hasMasterRuleArchiveShape(...)` at both content-loader and executable-compiler boundaries now identifies the mixed structural shape independently of forbidden playable surfaces. Exact rule-archive validation still owns the explicit rejection of `deck` and `publicInformation`; malformed discriminator variants therefore fail closed before they can synthesize a playable master, overview surface, fallback command spell, or deck.

Regression coverage now locks the reviewer-reported cross-product at both boundaries:

- missing / `master_skill_card_archive` / `master_rule_definition_archive_x` discriminator plus `deck`;
- missing / `master_skill_card_archive` / `master_rule_definition_archive_x` discriminator plus `publicInformation`.

Fresh post-revision validation:

- `npm run typecheck`: PASS.
- focused loader/compiler + FB2-15 + FB2-26 regression: **4 files / 122 tests PASS**.
- official `npm run test:ci`: **137 files / 925 tests PASS**; the existing eleven-round MatchSession case passed at ~4435 ms.
- rules `src + core + regression`: **79 files / 470 tests PASS**.
- `npm run content:validate`: PASS, `7 masters / 7 servants / 20 events / 0 blocking issues`.
- `npm run content:compile`: PASS, same product roster.
- generated determinism remains unchanged: library `03582e22b830c59ccfe03379159dd5e50aef19fd7bae3561469c000e56618a79`, fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`, evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- locked Reference verification: PASS at exact `b2f9fa15fba07c63530bbf4612b03b8b704755f9`, clean.
- client production build: PASS with only the pre-existing Vite `node:crypto` browser-externalization warning.
- Phase 3 coverage remains `106 archives / 141 cards / 246 abilities`, compiled `73 cards / 14 characters / 0 blockers`, routing `22/3/135/0/86/131`.
- automation audit remains `135/3/86/20`.
- frozen accounting remains zero-credit at `118/944`, with no authoring additions/removals or duplicate canonical ids.

This revision does not widen FB2-26 scope, change production authoring/product data, modify interpreter/MatchSession semantics, merge or retarget PR #365, or authorize the downstream three-card S migration. A fresh independent reviewer must re-review the revised Candidate.