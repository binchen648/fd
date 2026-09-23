# P3 F4 B06 card-play/combat/event-burst migration batch result

Task: `P3-F4-B06-CARD-PLAY-COMBAT-EVENT-BURST-MIGRATION-BATCH`
Branch: `codex/batch-p3-f4-b06-card-play-combat-event-burst-migrations`
Base: exact R120 F4 B05 acceptance synchronization `819f88e84148513d87766cf39db7ae8d1c0c995f`
Mode: user-authorized BATCH-FIRST F4

## Scope

This batch materializes exactly two fresh frozen identities from existing F1 evidence without redoing whole-roster classification:

- `servant.mozart.skill.sc-mozart-2`
- `servant.amakusa.skill.sc-amakusa-1`

Shared production runtime is bounded and identity-free. No consumer identity/name routing and no runtime Chinese-text parsing are introduced.

## Frozen semantics

### Mozart S2

- A trusted face-up source play arms the source for the current round only.
- Each authoritative battle resolved in that round freezes the battle battlefield, full participant set, winners, losers, and the exact printed VP total of event cards at that battlefield.
- Per Locked Reference `event_combat_losers`, losers are derived from the frozen combat participants minus winners. They are not narrowed by later loss-effect suppression or elimination state.
- Each loser loses up to the frozen printed event VP total; VP never goes below zero.
- The snapshot is bound to the exact battle log participant breakdown, winners, battlefield, current event placements, static event catalog printed rewards, and the trusted battle-result root.

### Amakusa S1

- Exact once-per-game face-up source play removes every currently public battlefield event card from the game; hidden events remain.
- `X` is frozen as twice the sum of printed VP on the event cards actually moved by that source play.
- The same-round source-card Power bonus equals the frozen X and expires on the next round.
- A server-owned burst root freezes source tokens, moved event facts, event-zone revisions, and amount independently from the receipt/log. Later legal return of a removed event does not retroactively change X.

## Provenance / fail-closed coverage

- Mozart source-play arm validates exact trusted `play-*` provenance and rejects persisted retiming.
- Mozart battle snapshots validate full combat participants from the authoritative `battle_resolved` payload; Basic Luck/loss-effect suppression does not erase a frozen combat loser for this card's selector.
- Mozart validates current exact battlefield event placements against the frozen snapshot before applying any loser VP mutation, so coordinated snapshot/snapshot-log/battle-log inflation fails closed.
- Amakusa validates exact trusted source play, server-owned burst root, source tokens, static printed event rewards, event-zone revision transition, receipt and log.
- Coordinated Amakusa moved-event + amount + token + log inflation fails closed against the independent burst root.
- Reserved B06 envelopes are exact and malformed siblings fail closed in the loader gateway.

## Verification

- B06 focused: **1 file / 13 tests PASS**.
- affected B01-B06 + event-rule/deployment-resource + combat/scoring + movement/game-loop + MatchSession + authoring/replay: **18 files / 180 tests PASS**.
- `npm run typecheck`: PASS.
- `npm run content:validate`: PASS, 0 blocking issues.
- `git diff --check`: PASS.
- production identity/name scan under `packages/rules/src`: **0 hits**.
- frozen roster: **944**.
- frozen material overlap: exact **`163/944 -> 165/944`**.
- both B06 frozen identities occur exact-once; zero duplicate frozen IDs.

## Credit

Before fresh independent R, formal migration remains **`167/944`**, with **`777`** remaining. Material authoring overlap is **`165/944`**.

Only an exact fresh `IMPLEMENTATION_ACCEPTED_CANDIDATE` for the final B06 Candidate plus A synchronization may award these two fresh identities, advancing formal migration exactly to **`169/944`**, with **`775`** remaining. This is one batch Candidate and must not be split into per-skill reviews.

## R1 fresh-review closure

Fresh independent R evidence: https://github.com/binchen648/fd/pull/439#issuecomment-5794143500

The rejected Candidate `b5bd5892df75e2a5d99ac08023ccee047c37d370` exposed one exact-scope blocker: B06 battle/event-VP provenance accepted only the ordinary `battlefield:<id>` authoritative `battle_resolved` lineage and rejected the pre-existing authoritative Return Silence branch (`return_silence:<id>`).

The successor revision keeps the ordinary lineage strict and adds a separately typed `return_silence` lineage. The B06 snapshot now freezes and revalidates the exact lineage kind, Return Silence source instance, winners/full frozen combat losers, battlefield event facts, and the authoritative Return Silence source transition to `removed_from_game`. It does not widen acceptance to arbitrary battle logs.

Regression evidence:
- B06 focused: **15/15 PASS**, including Mozart armed + Return Silence through both the core game-loop producer and the MatchSession post-scoring producer.
- Reviewer-targeted B06 + Return Silence + MatchSession + battle cleanup: **4 files / 41 tests PASS**.
- Affected B01-B06 + event/deployment + combat/scoring + movement/game-loop + MatchSession + authoring/replay + Return Silence: **19 files / 191 tests PASS**.
- `npm run typecheck`: PASS.
- `npm run content:validate`: PASS, 0 blocking issues.
- `git diff --check`: PASS.

Accounting is unchanged by the revision: frozen material remains **165/944** with the same two B06 identities exact-once; formal migration remains **167/944** pending a fresh exact-Candidate `IMPLEMENTATION_ACCEPTED_CANDIDATE` and A synchronization.