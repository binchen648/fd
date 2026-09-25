# P3-B-MAIN-REPLAY-FB2-49-R2 result

Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`

## Lineage and authority

- Current-main Base: `5c8e21c853ac95a1b0ee42e28108ae40692491cf` (`P3-A-MAIN-REPLAY-FB2-42-ACCEPTANCE-SYNCHRONIZATION`).
- Accepted historical semantic source only: PR #422, exact Base `822b5f9dfd05a64a5707fcb945b8b85eff2238e6` -> accepted Candidate `aa04a12e1647560374e09f7e2b6e62a5dccd0954`.
- Historical source reviewer evidence: `https://github.com/binchen648/fd/pull/422#issuecomment-5775423822`.
- Current-main prerequisite: FB2-42 Candidate `c820161a427de6b0e55c209b7e14e3f6fba36033`, accepted evidence `https://github.com/binchen648/fd/pull/444#issuecomment-5830650148`.
- PR #422, PR #424, and the R123 frontier were used only as semantic/evidence sources. No cherry-pick, merge, wholesale tree import, retarget, or frontier ancestry was taken.

## Replayed current-main contract

This Candidate reconstructs the identity-free FB2-49 opponent-close-to-one interaction and its authenticated persistence / restore / replay authority on the accepted current-main lineage.

The replay preserves the accepted contract boundaries:

- exact structured opponent-close-to-one classifier / loader gate rather than consumer identity routing;
- serialized eligible-opponent decision queue with exact frozen qualifying-card and ownership/control provenance;
- fail-closed malformed/stale/forged queue, interaction, target/context, source/card runtime-state and selection metadata;
- authenticated current transaction and replay/checkpoint authority across MatchSession, MatchRoom, MatchRoomHub and production HTTP restore boundaries;
- checkpoint occurrence identity, replay lineage, room/scope lifecycle and stale-trust revocation;
- mutation-free rejection before authoritative room/session replacement on invalid restore state;
- FB2-42 close-forbid prerequisite enforced before card mutation/event emission;
- no Astolfo or Scathach consumer migration and no migration credit.

## Current-main compatibility adaptation

The historical source lineage had later battle-event provenance fields that are not part of the current-main FB2-49 task. The replay does not import that parallel workstream.

The strict restore validator instead treats `participantPlayerIds` on terminal battle outcomes and `battleParticipantPowers` on result events as optional current-main-compatible provenance: when present they are recomputed from authoritative battle history and validated exactly; when absent, the validator continues to validate the current-main fields and reconstructed battle provenance without requiring unrelated producer/schema expansion.

This keeps `packages/rules/src/ability/battle-terminal.ts`, `packages/rules/src/core/game-loop.ts`, and the parallel battle-metadata workstream outside this Candidate while preserving fail-closed restore behavior.

## Scope

Production changes are restricted to the authorized FB2-49 hot-set:

- `apps/server/src/match-server.ts`
- `packages/rules/src/ability/interpreter.ts`
- `packages/rules/src/ability/loader.ts`
- `packages/rules/src/ability/opponent-close-to-one-authority.ts`
- `packages/rules/src/ability/opponent-close-to-one.ts`
- `packages/rules/src/ability/portable-sha256.ts`
- `packages/rules/src/ability/types.ts`
- `packages/rules/src/index.ts`
- `packages/rules/src/match-room-hub.ts`
- `packages/rules/src/match-room.ts`
- `packages/rules/src/match-session.ts`

The remaining changed files are exact focused / compatibility / server tests plus this result report. There is no Candidate diff under `data/authoring/**`, packs/generated content, client production, M50-03, or governance policy.

Protected parallel working-tree changes in battle-terminal / game-loop / battle metadata were not staged and are not part of this Candidate.

## Validation

Validation was performed both on the protected working checkout and, critically, on an exact snapshot materialized from the Git index so unrelated unstaged work could not make the Candidate pass.

Exact staged-tree validation:

- exact pre-report index tree after current-main compatibility repair: `7830025c6d17afb510bac8fe9bd10777c92c5047`;
- `npm run typecheck`: PASS;
- focused FB2-49 / MatchSession / MatchRoomHub / portable SHA: 4 files / 89 tests PASS;
- `npm test --workspace @fd/server`: 1 file / 5 tests PASS;
- current-main battle-first-loss restore compatibility regression: 1 file / 3 tests PASS;
- official `npm run test:ci -- --maxWorkers=2`: 132 files / 924 tests PASS;
- `npm run content:validate`: PASS, 7 masters / 7 servants / 20 events / 0 blocking issues;
- `npm run verify:generated-content`: PASS;
  - content library: `c9841d4bad3d43a525895372fabd3b49ea07e79075652a5cbd18fad3405e2e1e`;
  - fixture: `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence report: `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.

The first exact-index full-CI run intentionally exposed one current-main restore-compatibility failure (`battle-first-loss-delayed-activation-recert`). The repair was confined to the authorized MatchSession restore validator and did not import the parallel battle producer/schema changes. The exact regression and the complete official CI were then rerun and passed as recorded above.

## Frozen accounting

Fresh read-only reconciliation against `data/phase3/full-roster-ability-inventory.json` and all current `data/authoring/**/*.json` reports:

- frozen denominator: `943 static + 1 dynamic = 944`;
- current authoring: `99 archives / 134 cards / 233 abilities`;
- unique frozen identities materialized: `111`;
- frozen occurrences: `111`;
- duplicate frozen identities: `0`;
- dynamic identity `master.tiamat.card.life-sea` materialized: no;
- material/formal current-main boundary: `111/944`;
- remaining: `833/944`;
- Base -> Candidate frozen additions: `0`;
- Base -> Candidate frozen removals: `0`.

The extra non-frozen support archive/card/ability in the raw authoring counters does not enter the frozen numerator.

## Hard-boundary audit

- no `data/authoring/**` Candidate change;
- no pack/generated/client-production Candidate change;
- no M50-03 or governance-policy change;
- no Astolfo/Scathach consumer migration;
- no canonical card/character identity runtime dispatch added;
- no character-name routing, Chinese printed-text parsing, or SkillLib fallback added;
- generic `printedText` / `kind === 'servant'` occurrences in restore-schema validation are structural field/type checks, not consumer routing;
- zero migration credit; current-main formal/material remains `111/944`.

## Result

`IMPLEMENTATION_COMPLETE_CANDIDATE`

The exact committed Candidate must receive a fresh independent R. Acceptance does not itself add frozen migration credit; a later A synchronization is required before any downstream consumer replay or Promotion step.