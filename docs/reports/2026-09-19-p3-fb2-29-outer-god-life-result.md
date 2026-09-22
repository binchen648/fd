# P3-FB2-29 Outer-God-Life Structural Family Result

Role: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Date: 2026-09-19

## Baseline

- Exact A dispatch Base: `7a2f34129a768d06d6f15edbbcce22f194e6dc77`
- Branch: `codex/b2-p3-fb2-29-outer-god-life`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Formal recovery accepted at dispatch: `127/944`, `817` remaining.

FB2-29 is B2 infrastructure only and earns zero frozen migration credit.

## Implemented capability

One identity-free structural Outer-God-Life family contract was added.

- Exact semantic category marker: `cardFace.semanticCategory = outer_god_life`.
- Exact action envelope: active servant-skill source, `phase_action`, combat phase, controller combat action window, automatic execution.
- Exact relational effects:
  - `adjust_round_total_power`: controller plus structural source-servant owner, amount `6`, deduped;
  - `schedule_source_card_return`: recipient `source_servant_owner`.
- The source-servant owner is resolved only from compiled definition `ownerId` to the unique live player whose `servantCardId` equals that owner definition. Runtime does not know the five target canonical identities.
- When controller and source-servant owner are distinct, each gets exactly `+6`; when they are the same player, that player gets exactly `+6`, not `+12`.
- Independent valid physical source uses stack independently.
- Current-round total-power adjustments are stored with explicit round identity and consumed by production combat resolution; a later round sees no stale bonus.
- Ordinary physical sources schedule return at authoritative `after_battle_ended` only when battle-terminal provenance is present. The exact source instance is moved to the structural source-servant owner's discard and ownership/controller/visibility/active state are updated consistently.
- Derived sources (`generatedBy`) can receive the power semantics but do not enter the ordinary physical-return path.
- Replayed terminal event IDs remain idempotent through the existing processed-event gate.
- Missing owner relation, stale/inactive source, malformed category/near-match effect envelope, or missing terminal provenance fail closed.

The structural category marker is preserved through executable compilation and definition hashing for future generic consumers. FB2-29 does not implement the ten other abilities that later count/select/move Outer-God-Life cards.

## Product isolation / routing

There is no Candidate diff under `data/authoring/**`, `data/packs/**`, `data/generated/**`, `data/phase3/**`, `apps/**`, `scripts/**`, or `artifacts/**`.

Changed production source contains no match for the five target canonical IDs, Abigail/Clytie/Hokusai/Molay/Voyager names, Chinese printed category text, Reference handler `core.outer-god-life`, F1 SHA, or Reference SHA.

## Validation

Final B2 validation:

- `npm ci --offline`: 239 packages, 0 vulnerabilities.
- typecheck: PASS.
- focused compiler + FB2-29 subsystem: `2 files / 92 tests PASS`.
- rules `src + core + regression`: `82 files / 493 tests PASS`.
- official CI: `142 files / 997 tests PASS`.
- latest full-CI eleven-round MatchSession remained inside the unchanged 5000 ms timeout (about `4.3s`).
- content validate/compile: `7 masters / 7 servants / 20 events / 0 blockers`.
- generated determinism unchanged:
  - library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.
- locked Reference verify: PASS at exact `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- client production build: PASS; existing Vite `node:crypto` browser-externalization warning only.
- coverage unchanged: `111 archives / 150 cards / 255 abilities`, compiled `76 / 14 / 0`, routing `22/3/135/0/95/137`.
- automation audit unchanged: `135/3/95/20`.
- `git diff --check`: PASS.

## Frozen accounting

Mechanical current-tree reconstruction:

- denominator `944`;
- authoring cards `150`;
- unique authoring cards `150`;
- frozen overlap `127/944`;
- frozen additions `[]`;
- frozen removals `[]`;
- duplicate canonical IDs `0`;
- remaining `817`.

Therefore FB2-29 earns zero frozen migration credit. Formal recovery accepted remains `127/944`.

The five named identities remain only downstream migration targets. A future accepted S migration of exactly those five could produce `132/944`, but this Candidate does not claim that credit.

Historical P3-FM09 remains `MIGRATION_BLOCKED`; no FM10 is started.

## Candidate scope

1. `packages/rules/src/ability/outer-god-life.ts`
2. `packages/rules/src/ability/interpreter.ts`
3. `packages/rules/src/ability/loader.ts`
4. `packages/rules/src/ability/types.ts`
5. `packages/rules/src/core/combat-resolver.ts`
6. `packages/rules/src/index.ts`
7. `packages/rules/tests/executable-card-pack.test.ts`
8. `packages/rules/tests/regression/fb2-outer-god-life-subsystem.test.ts`
9. this result report.

## Next step

Commit/push one B2 Candidate, open one PR against the exact A dispatch branch, and hand it to a fresh independent R. No downstream S migration begins before `IMPLEMENTATION_ACCEPTED_CANDIDATE` and later A capability synchronization.

## R65 blocker-only revision

R65 found one runtime relationship blocker: `source_servant_owner` at ability use time could resolve an eliminated player whose `servantCardId` still matched the source definition owner. The revision now requires the use-time relationship to resolve exactly one `status === 'active'` player.

The terminal return path intentionally does **not** apply that live-player filter. A return relationship established by a valid use remains bound if that recipient is eliminated later in the same battle; the already-scheduled physical source still returns to that recorded source-servant owner at the authoritative battle terminal.

Regression coverage now proves both sides transactionally: eliminated-at-use rejects with no state mutation, while eliminated-after-valid-use still settles the previously established return.
## R65 revision validation

The blocker-only revision was revalidated after the live-owner fix:

- typecheck: PASS;
- focused compiler + FB2-29 subsystem: `2 files / 93 tests PASS`;
- rules `src + core + regression`: `82 files / 494 tests PASS`;
- official CI: `142 files / 998 tests PASS`;
- eleven-round MatchSession: approximately `4406 ms / 5000 ms`, PASS;
- content validate/compile: `7 masters / 7 servants / 20 events / 0 blockers`;
- generated determinism unchanged:
  - library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`;
- Locked Reference verify: PASS at exact `b2f9fa15fba07c63530bbf4612b03b8b704755f9`;
- client production build: PASS with the existing Vite `node:crypto` browser-externalization warning only;
- production coverage remains `111 archives / 150 cards / 255 abilities`, compiled `76 / 14 / 0`, routing `22/3/135/0/95/137`;
- automation audit remains `135/3/95/20`;
- coverage/audit artifact side effects restored;
- `git diff --check`: PASS.

This B2 branch predates the separately accepted PR #372 migration, so its branch-local authoring scan remains `127/944`. Current formal project recovery accounting, after R66 acceptance synchronization of PR #372 at `fe6a998cd655024af87a8f9e69080c50361c3625`, is **`131/944`** with **`813`** remaining. This B2 revision itself still earns zero frozen migration credit.
