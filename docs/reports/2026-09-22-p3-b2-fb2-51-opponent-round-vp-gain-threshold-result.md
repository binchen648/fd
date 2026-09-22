# P3-B2 FB2-51 Opponent Round VP Gain Threshold Result

Role: B2
Task: P3-FB2-51-OPPONENT-ROUND-VP-GAIN-THRESHOLD
BaseCommit: `415482ca2ebbff34098c93617b4b352d5ed50b55`
ReferenceCommit: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
MechanicFamily: opponent current-round positive VP gain crossing 7
AffectedAbilities: `[]`
RuntimeBehaviorChanged: true
CoverageBefore: not_applicable
CoverageAfter: not_applicable
KnownBlocks: `[]`
GateClaim: NONE

## Result

Implemented the dispatched identity-free FB2-51 seam only:

- exact raw and compiled whole-envelope classification for the forced `player.victory-points.changed` trigger, FB2-31 opponent relation, literal crossing threshold `7`, and the single accepted FB2-30 definition-return effect;
- an atomic authoritative server VP producer that changes VP, allocates the stable event id, and records exact current-round provenance in one transaction;
- authoritative fact recording wired into the existing production VP mutation roots: generic typed/legacy effects, event claims and extended VP transfers, accepted battle-loss/defeat/combat-power rewards, Ruler-seal rewards, and game-loop/session location or battle scoring;
- fail-closed admission of VP-change events against that server-owned provenance before processed-id, ledger, or effect mutation;
- a round-scoped positive-gain ledger keyed by affected player, exact `<7` to `>=7` crossing, duplicate-id idempotence, and authoritative round reset;
- execution of only the accepted FB2-30 component after the exact parent envelope qualifies.

Existing VP arithmetic remains at its owning mutation sites. Immediately after each trusted mutation, the runtime now records the exact before/after transition and dispatches the server-owned fact; existing `SafeEvent` entries and externally supplied `processAbilityEvent` payloads are still not treated as authoritative provenance. Core integration widened only to `core/game-loop.ts` and `match-session.ts`, where immutable location/battle scoring results are compared with their inputs and the resulting player transitions are dispatched without changing reward amounts, scoring order, or resolver semantics.

No Ciel/consumer authoring, identity/name/text routing, arbitrary threshold/resource/cumulative metric support, product/generated/client production changes, or migration credit was added.

## Evidence

- Focused FB2-51 + accepted FB2-30/FB2-31 compatibility: `3` files / `26` tests passed (`12 + 8 + 6`), including a dispatched generic phase-action VP gain, a real game-loop location reward, malformed exact-trigger loader failures, exact master-skill definition-return compatibility, and event-player relation compatibility.
- Typecheck: passed.
- `npm run test:ci -- --maxWorkers=2`: `181` files and `1351` tests passed.
- `npm run content:validate`: passed (`7` masters, `7` servants, `20` events, `0` blocking issues).
- `npm run verify:generated-content`: passed.
- `npm run phase3:reference:verify -- --reference-root E:\Codex\FD\fengling20011118-dotcom_fate-domination\reference`: passed at the locked Reference commit.
- `npm --workspace apps/client run build`: passed (Vite chunk-size warning only).
- `npm run phase3:coverage`: passed; generated artifact restored from exact Base.
- `npm run phase3:automation-audit`: passed; generated artifact restored from exact Base.
- `git diff --check`: passed.

Formal migration remains `153/944`; material overlap remains `148/944`. This capability earns zero migration credit.
