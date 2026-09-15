# P3-FM05 Territory Creation Migration Handoff

Date: 2026-09-16
Owner: Codex S
Status: `READY`
Base: exact P3-A-FB2-11-SYNC commit
F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
Reference metadata: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
Accepted dependencies: FB2-11/R33 + FB2-02/R19

Migrate exactly the ten Territory Creation identities listed in the A synchronization report. No runtime changes.

Required card structure:

- one minimal selected servant skill card per new archive;
- exact frozen printed text and source evidence;
- card face `typeLabel=魔术`, attributes `[魔术]`, cost `0`;
- dynamic base Power as controlled AST with `printedExpression=X` and formula `add(16, multiply(-2, game.round_number))`;
- Reference historical `basePower=2` and `requirement=0` retained only in `phase3Evidence.referenceStaticMetadata`;
- play timing action / controller play-card window;
- final skill-zone requirement 8 mana;
- a continuous-formula authoring node compatible with the accepted formula infrastructure;
- a forced deployment trigger `after_player_deployed_to_battlefield`, `eventLocationId=magic_workshop`, effects controller mana +1 then VP +2, automatic execution;
- no ordinary movement reward, no other-player deployment reward, no broad Trigger/Formula promotion.

Required migration tests:

- exact ten-ID membership and source/full-text/hash preservation;
- formula round 1/4/7/8 -> 14/8/2/0 on a real newly migrated representative;
- deploy self to magic workshop -> +1 mana and +2 VP exactly once;
- wrong location, other-player deployment, and ordinary movement do not reward;
- all ten abilities structurally conform to accepted FB2-11 + FB2-02 contracts;
- no runtime hot-file changes, no unrelated authoring, determinism/full validation.

Completion status allowed:
- `MIGRATION_CANDIDATE`
- `MIGRATION_NEEDS_REVISION`
