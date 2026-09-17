# P3-B10 Setup Create To Skill Runtime Handoff From Codex A

- Document Role: AGENT_HANDOFF
- From: Codex A
- To: Codex B
- Source Task: `P3-A03`
- Target Task: `P3-B10`
- Target Branch: `codex/b-p3-b10-setup-create-to-skill`
- Claimed Acceptance: `AUTOMATION_BASELINE_CANDIDATE`
- Promotion: this handoff does not promote Gate A/B/C, Phase 3, or Release status.

## Target Contract

Codex B owns the narrow `SETUP_CARD_CREATION_MINIMAL:CREATE_TO_SKILL` contract:

```text
kind=forced_trigger
activation.trigger=game_start
conditions=[]
targets=[]
cost=[]
creates=[]
effects=[create_card(cardId, to.zone=skill)]
execution.mode=automatic
```

This is a new setup/card-creation contract. It must not inherit B09 `CREATE_AND_ACTIVATE` evidence.

## Source Inventory Baseline

Current canonical authoring contains six `create_card` abilities.

Eligible exact matches:

| Character | Ability | Created definition | Destination |
|---|---|---|---|
| Maiya | `military.has-support-shot` | `master.maiya.deck.support-shot` | `skill` |
| Olga-Marie | `astronomical-science.has-chaldeas` | `master.olga-marie.skill.chaldeas` | `skill` |
| Shinji | `useless-person.setup` | `master.shinji.skill.false-attendant-book` | `skill` |

Required skips:

| Ability group | Count | Skip reason |
|---|---:|---|
| Artoria Caster `sc-artoriac-{4,5,6}.unique-passive-luck-on-win` | 3 | `optional_trigger + after_controller_wins_battle + response window + move_source_card from hand + create_card to deck + shuffle + unique limit` |

B must regenerate this inventory from `data/authoring` before runtime edits. A different count or shape is a scope stop requiring an updated handoff.

## Runtime Baseline

The accepted post-P3-B08 runtime baseline remains:

```text
newRuntimeSemanticRouted=9
legacyResolveEffect=52
dualRuntime=0
blockingIssues=0
```

All three eligible setup abilities currently consume legacy `resolveEffect` `create_card`. B must report actual before/after numbers from its own checkout; this handoff does not predeclare the resulting delta.

## Required Runtime Contract

- Route by the complete executable semantic shape, never by character, card, or ability id.
- Compile only a resolvable `cardId` and exact `skill` destination for this slice.
- Create a new card instance owned and controlled by the ability controller.
- Preserve `generatedBy=sourceCardInstanceId` and expose typed result fields for `createdInstanceIds` and `createdCount`.
- Process each valid game-start event once; replay must not duplicate the created card, result event, or revision.
- Once the exact shape enters data-flow, validation/runtime failure must fail closed and must not fall back to legacy `resolveEffect`.
- Roll back the whole resolution if creation or typed-result publication fails.

## Gate A Candidate Evidence

- exact classifier positive for all three eligible definitions;
- wrong kind, wrong trigger, target, cost, condition, `creates`, extra effect, missing card id, unresolved card id, wrong destination, owner override, `then`, and wrong execution mode negatives;
- typed `createdInstanceIds` and `createdCount` result validation;
- duplicate event replay and corrupt compiled-definition negatives;
- atomic rollback and no legacy fallback after route selection.

## Gate B Candidate Evidence

- compile canonical authoring through the executable pack and create a real `MatchSession`;
- drive the formal `game_start` event rather than directly invoking the primitive;
- table-test Maiya, Olga-Marie, and Shinji so the semantic route proves mechanism reuse;
- assert one created card, owner/controller, `skill` zone, source identity, event/result envelope, and projection visibility;
- assert a second delivery of the same event does not create a duplicate;
- prove all three Artoria Caster Luck abilities remain outside this route and continue on their existing path.

## Browser Evidence Boundary

No browser acceptance is claimed by this handoff, and browser evidence cannot be inherited from B09 or earlier Card Action contracts. If B attempts a browser candidate, it must start before the real room start, use browser create/select/start to trigger server setup, observe the created skill card in projection, reconnect, and prove no duplicate creation. A restored post-setup snapshot is not production setup evidence.

Because this contract is server-event-driven, it has no client mutation command to which `expectedRevision` applies. Any room-start command revision policy must be reported separately and must not be invented by this slice.

## Stop Conditions

Stop with `RUNTIME_SEMANTIC_GAP` and do not fix outside this task if:

- the formal MatchSession startup does not emit a usable `game_start` event;
- duplicate startup processing has no shared idempotency owner;
- compiled definitions lose created-card identity or destination;
- supporting this shape requires broad Trigger, Lifecycle, Hidden, or Battle runtime changes;
- any eligible source JSON requires semantic correction.

## Machine-Readable Artifact

Companion artifact:

```text
artifacts/phase3-b10-setup-create-to-skill-handoff.json
```
