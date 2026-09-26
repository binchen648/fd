# P3-A R67 Outer-God-Life Consumer Migration Dispatch

Role: Codex A
Status: `READY`
Date: 2026-09-19

## Baseline

- Exact accepted-capability Base: `187218d9ca3c3b2f619c61377abbed320b342dae`
- Accepted runtime Revision Candidate: `a79d6ca63f1ce2a8cf957fe224e60f8537905575`
- Fresh R67 verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Project formal recovery accepted: `131/944`
- Project formal remaining: `813`

This dispatch grants no frozen credit. The accepted capability branch itself mechanically contains `127/944`; that branch-local material count must not be confused with the project formal state, which already includes the separately accepted R66 Lostbelt migration at `131/944`.

## Exact migration family

Dispatch exactly these five frozen identities to fresh S:

1. `servant.abigail.skill.sc-abigail-4`
2. `servant.clytie.skill.sc-clytie-4`
3. `servant.hokusai.skill.sc-hokusai-4`
4. `servant.molay.skill.sc-molay-4`
5. `servant.voyager.skill.sc-voyager-4`

F1 full printed-text SHA-256:

- Abigail: `c067eaf714c63dc3cb08957261a643c8107e21ebd66fc2981008ac075957e940`
- Clytie: `146c26d2ca823f92c1a758e9e23c37f6d8f88c54e3818164b153af19260d464f`
- Hokusai: `e0c05d4411c50ccc67a2354a8d856c79014a6a6e63d41f32b59d364b471326f3`
- Molay: `9aa41b08e14ff5d692af6b91a7f653b0626c3419b3a847611da5fa2a750cf97f`
- Voyager: `d0ba9965338bcd719d3631256f57144ff71363113069c44dfb4225af5296d0bd`

All five are the F1 `领域外生命` family and are corroborated by the locked Reference shared handler `core.outer-god-life`. F1 is authoritative for canonical IDs and printed text; the Reference handler ID is evidence only and must never become product runtime routing.

## Accepted runtime contract to reuse

S must reuse only the accepted R67 / FB2-29 identity-free structural capability:

- exact `cardFace.semanticCategory: "outer_god_life"`;
- one exact combat `phase_action` ability in `controller_combat_action_window` with `requiresSourceState: "active"`;
- exact effects, in order:
  1. `adjust_round_total_power` with recipients `["controller", "source_servant_owner"]`, amount `6`, `dedupe: true`;
  2. `schedule_source_card_return` with recipient `source_servant_owner`;
- automatic execution with empty `allowedOperations`;
- no extra condition/target/cost/create/ruleModifier/lifecycle/limit/visibility semantics;
- source-servant-owner is resolved structurally from compiled owner metadata and must be the unique live player at use time;
- an already-established return relationship remains valid if that recipient is eliminated later;
- ordinary physical source return settles at the authoritative battle terminal;
- derived/generated source skips ordinary physical-return scheduling;
- same-player controller/source-owner dedupes to exactly +6, never +12;
- current-round power expires by round identity.

No identity/name/printed-text/hash or `core.outer-god-life` handler branching is authorized.

## Static authoring metadata

Locked Reference may supply static metadata only:

- Abigail: owner `servant.abigail`, class `Foreigner`, cost `1`, basePower `0`, legacy requirement `1`, typeLabel `特殊`;
- Clytie: owner `servant.clytie`, class `Foreigner`, cost `1`, basePower `0`, legacy requirement `0`, typeLabel `特殊`;
- Hokusai: owner `servant.hokusai`, class `Foreigner`, cost `1`, basePower `0`, legacy requirement `1`, typeLabel `特殊`;
- Molay: owner `servant.molay`, class `Saber`, cost `1`, basePower `0`, legacy requirement `1`, typeLabel `特殊`;
- Voyager: owner `servant.voyager`, class `Foreigner`, cost `1`, basePower `0`, legacy requirement `0`, typeLabel `特殊`.

Molay is not a special runtime case. Its printed `降临者` recipient is represented by the same structural source-servant-owner relation accepted by R67.

## Authoring container / product isolation

Expected minimal migration material is five new standalone `servant_skill_card_archive` files:

- `data/authoring/servants/servant.abigail.json`
- `data/authoring/servants/servant.clytie.json`
- `data/authoring/servants/servant.hokusai.json`
- `data/authoring/servants/servant.molay.json`
- `data/authoring/servants/servant.voyager.json`

Each contains exactly one dispatched frozen card. These archives are migration material only:

- do not add them to `data/packs/fd-playtest-v1/pack.json`;
- do not change `data/generated/**`;
- do not modify `packages/rules/src/**`;
- do not create playable servant characters/decks/fixture seats;
- do not add any sixth frozen identity.

The ordinary final-rules skill-zone threshold convention may be represented consistently with accepted standalone servant migrations; legacy requirement values are static provenance and must not invent a new runtime semantic.

## Required S evidence

Fresh S must prove at minimum:

- exact five F1 identities and no sixth addition;
- full F1 text/hash equality plus frozen clause evidence;
- exact static owner/class/card-face metadata from locked Reference;
- all five real migrated definitions satisfy the accepted `outer_god_life` structural recognizer;
- real runtime behavior for controller != owner and controller == owner;
- unique live owner relation, eliminated-at-use fail-closed, and active+eliminated duplicate handling;
- valid-use then later owner elimination still settles the established return;
- two independent physical sources stack;
- production combat consumes the round ledger and round advancement clears it;
- terminal replay idempotency;
- derived source skips ordinary physical return;
- Molay uses the same structural relation with no identity special case;
- no identity/name/text/hash/Reference-handler routing and zero runtime-source diff;
- no pack/generated product drift;
- fresh mechanical frozen accounting on this branch: expected `127/944 -> 132/944`, exact five additions, zero removals, zero duplicates;
- project formal accounting remains `131/944` until fresh independent R accepts this migration and later A synchronization records the five additions. If accepted and synchronized, project formal accounting would become `136/944`; do not pre-credit it.
- typecheck, focused migration tests, rules suite, official CI, eleven-round MatchSession, content validate/compile, generated determinism, Reference verify, client build, coverage/audit, `git diff --check`, final cleanliness.

Historical P3-FM09 remains `MIGRATION_BLOCKED`. No FM10 is dispatched.