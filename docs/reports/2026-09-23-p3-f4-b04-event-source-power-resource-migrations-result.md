# P3 F4 B04 Event / Source-Power / Resource Migration Batch Result

Date: 2026-09-23
Task: `P3-F4-B04-EVENT-SOURCE-POWER-RESOURCE-MIGRATION-BATCH`
Branch: `codex/batch-p3-f4-b04-event-source-power-resource-migrations`
Exact Base: `c75ff0a7e8f514c529c08a7c214b4cd989ea0b00` (R118 B03 acceptance sync)
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Batch scope

This BATCH-FIRST Candidate migrates exactly two fresh frozen identities from existing F1/source-grounded evidence:

- `servant.albion.skill.sc-albion-2`
- `servant.ozymandias.skill.sc-ozymandias-2`

Production runtime is identity-free: no consumer ID, Albion/Ozymandias name, Chinese card/character name, runtime Chinese parsing, or SkillLib fallback is used for routing.

## Runtime closure

### First-movement permanent source power

- exact active-source controller movement trigger only;
- movement roots are accepted only from the already-applied authoritative movement path;
- each persisted movement receipt is bound to the exact processed root, movement log index, player, from/to location, movement kind, mana spent, round, per-move distance, and cumulative round movement distance;
- duplicated movement-log binding, unrelated processed ids, stale/forged roots, malformed persisted state, or widened envelopes fail closed;
- the source can install at most once per source/round;
- power gained equals the frozen **cumulative `movement_distance_this_round` after the triggering movement**, matching Locked Reference behavior even when an earlier movement occurred while the source was inactive;
- accepted source-power receipts persist for the game and remain source-bound.

### Source-play round power

- exact face-up source-card play installs one current-round source-power bonus equal to printed base power;
- persisted state is rebound to exact source definition / controller / ability / round / printed base power and fails closed on duplication or tampering;
- bonus expires outside the play round.

### Opponent entry mana drain

- exact live source only;
- movement entry requires the authoritative applied movement receipt; deployment entry uses the authoritative MatchSession deployment root;
- opponent and controller must actually share the trusted battlefield;
- exactly 2 mana is lost, floor 0; forged/generic entry events do not resolve the effect.

### Trusted controller-defeat release

- requires the existing frozen authoritative controller-defeated battle root; battle-loss suppression therefore produces no release;
- same-location recipients match Reference `same_location_players`: active players at the trusted battlefield plus players freshly defeated in that same frozen battle (including the controller), while unrelated previously eliminated players remain excluded;
- each recipient gains exactly 3 mana through normal mana-cap handling, then the source closes through the existing close-source contract.

## Source fidelity

The focused batch test re-hashes the actual archived `printedText` / `printedClause` strings against frozen F1 SHA-256 evidence for both identities. Static cost/basePower/requirement/type/attributes remain grounded to the Locked Reference metadata.

## Verification

- B04 focused production-path suite: `1 file / 15 tests` PASS.
- Affected regression bundle: `18 files / 198 tests` PASS, including B01/B02/B03, FB2-47, FB2-54, movement, combat/scoring, game-loop, MatchSession, replay, and loader regressions.
- `npm run typecheck`: PASS.
- `npm run content:validate`: PASS (`0 blocking issues`).
- `git diff --check`: PASS.
- Production identity/name scan across changed runtime sources: `0` consumer identity hits.
- Frozen material recount: exact `159/944 -> 161/944`; both B04 identities exact-once; duplicate frozen IDs `0`.

## Credit

Before fresh independent R, formal migration remains **`163/944`** with **`781`** remaining. Material authoring overlap is **`161/944`**.

Only an exact fresh `IMPLEMENTATION_ACCEPTED_CANDIDATE` for this Candidate plus A synchronization may award the two fresh identities, producing **`165/944`** formal and **`779`** remaining. This batch does not merge or retarget prior stacked PRs.

## R1 reviewer closure

Fresh R on exact Candidate `3b1d29763f0b03642ed1ec0135b2b894342a3c2b` returned `IMPLEMENTATION_NEEDS_REVISION` with canonical evidence `https://github.com/binchen648/fd/pull/437#issuecomment-5790854821`.

Both exact-scope blockers are closed in the successor Candidate:

1. **Source-play round power provenance**
   - real server card-play paths now author persistent exact `trustedCardPlaySnapshots`;
   - B04 round-power rows bind to exact `play-*` root identity, processed-event membership, source/controller identity, face-up state, and authoritative play round;
   - mutating only persisted bonus `round` after expiration now fails closed and cannot resurrect doubled power.

2. **Movement/source-power provenance**
   - authoritative movement logs now retain the round number;
   - persisted B04 movement distance is re-derived from the enabled map graph and exact from/to facts;
   - cumulative movement is re-derived from authoritative same-player/same-round movement-log history through the exact root log index;
   - coordinated mutation of movement `distance`, `cumulativeDistance`, and source-power `amount` now fails closed.

R1 verification:
- B04 focused: `1 file / 17 tests PASS`;
- affected regression bundle: `18 files / 200 tests PASS`;
- `npm run typecheck`: PASS;
- `npm run content:validate`: PASS, zero blocking issues;
- `git diff --check`: PASS.

Formal migration remains `163/944` before a fresh independent R accepts the successor Candidate. Material authoring remains `161/944` with zero duplicate frozen identities.
