# P3-A FB2-28 Event Rule Executable Bridge Dispatch

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-19

## Baseline

- Exact recovery-line Base: `f80da896018f6d3cf1c2e4667d95f9c6f1ff4b14`
- Formal accepted overlap: `127/944` (`13.45%`)
- Remaining frozen identities: `817`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Integrated `origin/main`: last synchronized `553779e8ffcc926ae4763ee86a2ea937e090c128` / mechanically `111/944`

This is zero-credit A capability dispatch. It does not migrate any frozen identity and does not merge or retarget any stacked PR.

## Private feasibility result

A recomputed the exact remaining frozen set without committing the planning partition. Among the `817` remaining identities, exactly `12` have one frozen blocker equal to `SPECIAL_EFFECT:event_card_rule` and no second blocker. Their other normalized axes map to already-cataloged generic capabilities.

The current runtime already contains event deck/discard state, battlefield event placements, event visibility, VP metadata, combat modifiers, round cleanup/recycling, event reveal, and some generic event-related ability operations. The missing architectural boundary is that event cards are still primarily static/host-adjudicated content: there is no rules-only event-definition authoring channel and no generic executable bridge that makes an event placement an authoritative ability source while preserving event lifecycle operations.

FB2-28 therefore targets this single generic boundary. The `12` count is an unlock-yield upper bound, not migration credit and not one mixed S batch.

## Exact single-gap downstream consumers

No identity below is authorized for migration in this B2 task. They are only the exact F1 consumers whose sole frozen blocker is `event_card_rule`:

1. `master.hisui-detective.skill.s1`
2. `master.kadoc.skill.ascension`
3. `master.kadoc.skill.s3`
4. `master.kadoc.skill.s4`
5. `master.kadoc.skill.s5`
6. `master.kiara.skill.s4`
7. `master.ophelia.skill.ascension`
8. `master.ophelia.skill.s4`
9. `master.ophelia.skill.s5`
10. `master.ophelia.skill.s6`
11. `master.ophelia.skill.s7`
12. `master.wodime.skill.s6`

Seven of these form the later same-handler `core.lostbelt-objective` family (Kadoc s3-s5 and Ophelia s4-s7). The other five remain separate later feasibility/migration families even if this capability closes their common event-card boundary.

## Capability request

Implement one identity-free, source-text-independent **event-card lifecycle and executable-rule bridge**.

### 1. Rules-only event definitions

Provide an exact, fail-closed authoring representation for event rule definitions that can carry executable abilities without becoming ordinary playable cards or being silently inserted into the production random event deck.

A narrow manifest/archive shape is expected, e.g. an optional rules-only event registration channel and an exact archive discriminator. The exact implementation name may differ if B2 finds a smaller existing-compatible shape, but all of the following are mandatory:

- event-rule definitions are structurally distinct from servant/master/player cards;
- they do not synthesize characters, decks, fallback command spells, player card instances, or ordinary card-play surfaces;
- they do not enter `eventSetFiles` / ordinary random event deck membership merely by being executable rules;
- malformed, wrong-channel, missing-discriminator, or near-match rules-only event shapes fail closed rather than falling through to another product surface;
- current 20 production event cards and their deterministic product hashes remain unchanged unless a generic compiler representation change is mechanically required and independently justified.

### 2. Event lifecycle substrate

The runtime must support identity-free structural operations over authoritative event-card state, sufficient for later authoring to express generic event rules without handler routing:

- identify/select event definitions or placements by structural metadata/tags, not card IDs or names;
- inspect event deck, event discard, rules-only outside-game event pool, and battlefield placements where explicitly authorized by ability structure;
- move/replace/remove/discard event cards between those event zones and a structurally selected battlefield location;
- preserve authoritative event metadata such as definition ID, battlefield location, visibility, printed VP/reward metadata, and deterministic lifecycle state;
- support deterministic draw/replacement semantics without corrupting ordinary round cleanup/recycling;
- fail closed on stale selections or illegal source/destination transitions and remain transactional on rejection.

This does **not** authorize Lostbelt expansion synchronization, Wodime subsystem state, prophecy, deduction, foreign life, defeat-player semantics, or any other unrelated special subsystem.

### 3. Event placement as executable rule source

An active event placement with an executable rules-only definition may participate in the existing trigger/condition/effect runtime through an authoritative event-source context.

The source context must be structural and server-owned, including at minimum the event definition and authoritative battlefield/location. If a later ability-created event has an issuer/controller relationship, that relationship must be represented explicitly in placement/runtime state rather than inferred from identity or printed text. Neutral events must remain representable without inventing a player owner.

Generic conditions such as `EVENT_LOCATION_IS_SOURCE_EVENT_BATTLEFIELD` and `COMBAT_OCCURS_AT_SOURCE_EVENT_BATTLEFIELD` must derive from this authoritative placement source context. Event rule replay must remain idempotent.

### 4. Existing event product behavior remains stable

FB2-28 must not regress current event behavior:

- event draw/recycle;
- hidden/public placement visibility;
- printed VP scoring;
- existing static combat modifiers / play forbids;
- round cleanup and return-to-deck behavior;
- current host-adjudicated event directives where no executable rule exists.

The new bridge must coexist with current static event handling rather than replacing all event cards with a new subsystem.

## Structural safety

Runtime/compiler routing must not branch on:

- any of the 12 future consumer IDs;
- owner/master names or IDs;
- Chinese card/skill text;
- Reference handler IDs (`core.lostbelt-objective`, etc.);
- F1 hashes/commit;
- specific Lostbelt names or event names.

Structural tags/enums declared in authoring data are allowed only as generic data, not as disguised identity routing.

## Scope / role boundary

Owner: Codex B2.

B2 may touch only the minimum generic content/rules/runtime/type/test files needed for the event-rule bridge, plus one FB2-28 result report. Likely hot areas include:

- `packages/content/src/playtest-pack-loader.ts` / manifest typing if a rules-only event channel is needed;
- `packages/rules/src/ability/executable-card-pack.ts`;
- `packages/rules/src/ability/types.ts` / loader / interpreter or narrowly factored event-rule helpers;
- `packages/rules/src/schema/game.ts` and event lifecycle helpers only where authoritative source context requires it;
- focused regression tests.

B2 must not add any of the 12 consumer authoring definitions, Lostbelt-specific production content, new production event sets, F1/taxonomy/KPI changes, FM09/FM10 changes, app feature work, merge, or retarget.

One PR has one role. FB2-28 is infrastructure only and earns **zero frozen migration credit**.

## Required focused acceptance evidence

Fresh implementation evidence must at minimum prove with synthetic identity-free fixtures:

- exact rules-only event representation acceptance and wrong/missing/near-match fail-closed behavior at both content and executable compiler boundaries;
- rules-only event definitions do not enter player cards/characters/decks/fallback command spells or ordinary random event-set membership;
- neutral event placement can execute an automatic rule using authoritative source battlefield context;
- an issuer-associated event placement, when explicitly created that way, carries issuer/controller structurally without identity inference;
- generic event selection across the allowed zones is deterministic and validates stale selections;
- event placement/replacement/removal/discard transitions are transactional on failure;
- existing event draw/recycle/visibility/VP/static-modifier behavior remains green;
- same event-id/replay path does not duplicate event-rule effects;
- no identity/name/text/Reference-handler routing;
- Base-to-Candidate frozen overlap remains exactly `127/944`, with zero additions/removals/duplicates;
- official typecheck, focused tests, full CI, rules suite, content validate/compile/determinism, client build, Reference verify, coverage/audit, `git diff --check`, and final cleanliness.

## Frozen accounting

Dispatch accounting remains:

**`127/944` accepted, `817` remaining.**

FB2-28 itself is zero-credit. Acceptance only establishes a generic event-rule capability. Later A must recompute which of the 12 upper-bound consumers are dependency-complete and dispatch legal homogeneous S families separately.

Historical P3-FM09 remains `MIGRATION_BLOCKED`. No FM10 is dispatched.