# P3-FB2-35 Round Active-Attack Paid-Cost Combat-Power Result

Role: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Date: 2026-09-20

## Exact baseline

- A dispatch Base: `f68f6ce037e943a33053767388a618e126b6cb77`
- Branch: `codex/b2-p3-fb2-35-round-active-attack-paid-cost-combat-power`
- Formal migration state at dispatch: `137/944`, remaining `807`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

FB2-35 is generic runtime capability only and earns zero migration credit. No consumer authoring is migrated by this Candidate.

## Implemented exact seam

This Candidate supports only the identity-free structural family dispatched by A:

- passive ability;
- exact type-only `source_owned` condition;
- exactly one `combat_power:add` modifier;
- scope subject `players_at_source_battlefield`;
- exact predicate `round_active_attack_paid_cost_sum_is_highest`;
- exact constant `+6`;
- modifier lifecycle `permanent`;
- exact priority `card_text / specific`;
- exact conflict policy `higher_priority_wins`;
- no effects, targets, cost, creates, ability lifecycle, interaction, or host adjudication.

The loader exposes `isAcceptedRoundActiveAttackPaidCostCombatPowerAbility()` and permits `rule=combat_power` only when this whole exact envelope matches. The different Reference controller-only `combat_power:add` occurrence remains unsupported.

## Authoritative paid-on-play provenance

`CardRuntimeState` now optionally records `paidManaOnPlay` from the shared authoritative `playBatch` path.

For every successful physical play:

- ordinary face-up paid play records the exact mana amount charged for that card by the authoritative play path;
- waived/free play records `0`;
- face-down play records `0`;
- rejected play does not create paid provenance;
- a later successful authoritative play of the same physical instance replaces the prior card-state provenance together with the new `playedRound`.

No printed-cost fallback is used by the combat metric. Missing, malformed, negative, non-integer, or wrong-round provenance does not qualify that attack.

## Combat metric and modifier

Production combat resolution derives, per active battlefield participant, the sum of valid paid provenance for current-round active attack-area cards that are:

- controlled by that participant;
- currently in `attack_area`;
- active and not face-down;
- played in the current round;
- present in the authoritative runtime definition pack;
- backed by a nonnegative safe-integer `paidManaOnPlay` value.

Participants with no qualifying attack are absent from the ranking rather than qualifying by an implicit zero. A genuinely paid-zero active attack is valid provenance and contributes a real sum of zero.

The maximum is tie-preserving. Every participant tied for the highest valid sum receives exactly `+6` participant total combat power when exactly one valid structural modifier source applies at that battlefield. The adjustment is inserted into production combat participant-power derivation before winner selection.

The source route fails closed unless:

- source ownership/controller relation satisfies the accepted `source_owned` semantic;
- source controller is active at the battlefield being resolved;
- the runtime definition contains the exact compiled FB2-35 ability envelope.

Ambiguous duplicate exact modifier sources fail closed rather than stacking implicitly.

This capability does not mutate individual card power and does not change reward distribution, defeat/military settlement, event/terrain power families, or any unrelated modifier subsystem.

## Locked Reference recount

Fresh mechanical scan of Locked Reference `src/content/authoring/cards.json` finds exactly two `combat_power:add` occurrences:

1. the dispatched `players_at_source_battlefield + round_active_attack_paid_cost_sum_is_highest + constant 6 + permanent` envelope;
2. a structurally different controller-only occurrence with value `12`.

Only the first shape is accepted by FB2-35. The second remains fail-closed and receives no capability inheritance.

Reference handler IDs are evidence only and are not used for runtime routing.

## Focused behavioral evidence

`packages/rules/tests/fb2-35-round-active-attack-paid-cost-combat-power.test.ts` proves:

- exact authoring classifier acceptance and loader-to-compiled classifier preservation;
- rejection of source-state, value, subject, lifecycle, and extra-effect near-matches;
- normal paid play records actual charged mana;
- face-down play records zero and charges no mana;
- rejected insufficient-mana play leaves the card unplayed and creates no paid provenance/counter mutation;
- unique highest paid-cost participant receives +6 before winner selection and can change the winner;
- individual attack card power remains unchanged;
- ties at the highest paid-cost sum all receive +6;
- a participant with no qualifying attack does not qualify by absence/zero;
- an actual zero-cost active attack is valid zero provenance;
- inactive, face-down, wrong-round, and malformed provenance does not count;
- ownership failure and source-controller-outside-battlefield failure close the modifier route;
- the controller-only Twice-style near-match remains unsupported.

The existing Ruler free-play regression additionally proves the real accepted waived/free play path records `paidManaOnPlay: 0` for a printed-cost-7 attack while consuming no mana.

## Scope / routing audit

Relative to exact A dispatch Base, production changes are limited to:

- `packages/rules/src/ability/loader.ts`
- `packages/rules/src/ability/types.ts`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/core/combat-resolver.ts`

Tests are limited to:

- new `packages/rules/tests/fb2-35-round-active-attack-paid-cost-combat-power.test.ts`
- one zero-provenance assertion in `packages/rules/tests/regression/fb2-ruler-seal-subsystem.test.ts`

Production diff audit found no consumer identity, consumer name, printed text, F1 hash, Reference hash, or Reference handler routing token. Routing remains structural and identity-free.

No `data/authoring/**`, `data/packs/**`, `data/generated/**`, `data/phase3/**`, or `apps/**` product material is changed by the implementation.

## Final validation

Dependencies were materialized in this exact worktree with `npm.cmd ci --ignore-scripts --offline`; no cross-worktree `node_modules` junction was used.

Final gates:

- typecheck: PASS;
- focused FB2-35 + accepted Ruler waived-play regression: `2 files / 19 tests PASS`;
- core + regression + FB2-35 focused: `79 files / 489 tests PASS`;
- official CI: `150 files / 1051 tests PASS`;
- eleven-round MatchSession in official CI: PASS (approximately `4185 ms` in this run);
- content validation: `7 masters / 7 servants / 20 events / 0 blocking issues`;
- generated-content determinism unchanged:
  - content library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`;
- Locked Reference verification: PASS at exact `b2f9fa15fba07c63530bbf4612b03b8b704755f9`, clean;
- client production build: PASS; only the existing Vite `node:crypto` browser-externalization warning;
- `git diff --check`: PASS;
- generated/coverage/audit tracked side effects: none;
- production identity/hash/handler audit: zero hits.

The first focused run exposed the pre-existing generic independent-modifier-lifecycle guard still rejecting the exact dispatched permanent modifier after the structural classifier had accepted it. The final implementation adds an exception only for the exact FB2-35 classifier; no broad lifecycle acceptance was introduced. All final gates above are after that correction.

## Accounting / next gate

FB2-35 earns **zero migration credit**. Formal project migration accounting remains **`137/944`**, remaining **`807`**.

Commit/push one B2 Candidate and open one PR against the exact A dispatch branch. Fresh independent R must review the exact Candidate. On `IMPLEMENTATION_ACCEPTED_CANDIDATE`, A performs capability synchronization and immediately re-overlays `servant.ibaraki.skill.sc-ibaraki-1`; if no new blocker exists, the mandatory next action is S migration rather than another unrelated B2 seam.
