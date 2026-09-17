# P3-B09 Create And Activate Runtime Handoff From Codex A

- Document Role: AGENT_HANDOFF
- From: Codex A
- To: Codex B
- Source Task: `P3-A03`
- Target Task: `P3-B09`
- Target Branch: `codex/b-p3-b09-create-and-activate`
- Claimed Acceptance: `AUTOMATION_BASELINE_CANDIDATE`
- Promotion: this handoff does not promote Gate A/B/C, Phase 3, or Release status.

## Target Task

Codex B owns `CARD_ACTION_SEMANTICS_CREATE_AND_ACTIVATE`.

This is the next independent Card Action contract after scoped `PLAY`, `PLAY_SOURCE_RESPONSE`, `ADD_TO_ATTACK`, `ACTIVATE`, and `CLOSE`. It must not inherit evidence from those contracts.

## Critical Source-Authoring Finding

Current A search found no explicit `create_and_activate_card` or `activate_card` primitive in source authoring or current scoped audit scripts:

```text
rg '"type": "create_and_activate_card"|"type": "activate_card"' data/authoring packages/rules/src scripts docs/audits
NO MATCH
```

Current source authoring contains `create_card` effects:

```text
servant.artoriac.json: create_card x3
master.maiya.json: create_card master.maiya.deck.support-shot -> skill
master.olga-marie.json: create_card master.olga-marie.skill.chaldeas -> skill
master.shinji.json: create_card master.shinji.skill.false-attendant-book -> skill
```

Drake `sc-drake-1.mount-summon` is currently authored as:

```text
phase_action / action / controller_action_window
target selected_hand_cards: card_instance from controller hand, private_to_controller, min=0, max=3, base_power_at_most=3
effect play_selected_cards(selected_hand_cards)
```

That is not an exact `CREATE_AND_ACTIVATE` source shape. B09 must not relabel Drake as create-and-activate unless it first proves the canonical source and executable semantics require that classification.

## A Baseline For B

B09 must use the accepted post-P3-B08 checkout as its numeric before baseline.

The latest reviewed B08 packet recorded:

```text
newRuntimeSemanticRouted=9
legacyResolveEffect=52
dualRuntime=0
blockingIssues=0
```

If B09 starts from a different merged runtime branch, B must regenerate `phase3:coverage` first and report before/after against that checkout.

## Required B09 First Step

B must start by producing a source-authoring inventory for potential create-and-activate semantics:

- explicit `create_and_activate_card` primitives;
- `create_card` immediately followed by activation or active-zone placement;
- `create_card` effects whose canonical printed text says the created card is immediately active;
- cards historically suspected of create-and-activate semantics, including Drake, but only as candidates until source JSON and rules justify the contract.

If no exact representative exists in canonical source authoring, B09 must stop with:

```text
NO_ELIGIBLE_REPRESENTATIVE
```

or, if canonical rules require create-and-activate but source authoring cannot express it:

```text
RUNTIME_SEMANTIC_GAP
```

B must not patch roster JSON, invent an ability-id route, or migrate Drake under this contract just to keep the sequence moving.

## B Runtime Scope

P3-B09 may touch:

- `packages/rules/src/ability/interpreter.ts`;
- `packages/rules/src/ability/resolution-dataflow.ts`;
- `packages/rules/src/ability/executable-card-pack.ts`;
- `packages/rules/src/ability/types.ts` only if the primitive contract requires it;
- focused mechanic tests;
- scoped implementation report;
- one scoped browser/server spec if required by Gate C candidate evidence.

P3-B09 must not touch:

- coverage KPI;
- taxonomy classifier rules;
- evidence classification;
- scoped normal `PLAY` contract;
- scoped `PLAY_SOURCE_RESPONSE` contract;
- scoped `ADD_TO_ATTACK` contract;
- scoped `ACTIVATE` contract;
- scoped `CLOSE` contract;
- unrelated card-action contracts;
- broad Trigger runtime;
- broad Lifecycle runtime;
- Hidden projection runtime except source/created-card identity redaction required by the exact contract;
- Battle result runtime;
- roster-wide JSON.

## Exact Contract Requirements If Eligible

If B proves an exact source representative exists, the scoped contract must define:

- source card or ability identity;
- created definition identity;
- created instance identity;
- owner and controller;
- source zone and destination/activation zone;
- initial active/inactive state;
- face-up/face-down visibility;
- whether creation is once-per-game, per-window, or repeatable;
- cleanup or expiration owner;
- duplicate creation/activation rejection;
- stale command or stale event rejection;
- typed result fields for both creation and activation.

## Inheritance Boundary

This contract must not inherit scoped `PLAY`, `PLAY_SOURCE_RESPONSE`, `ADD_TO_ATTACK`, `ACTIVATE`, or `CLOSE` evidence. Its Gate C inheritance is invalidated by:

- normal hand-card play;
- source-card response play;
- attaching to another attack;
- activating an already-existing card without creation;
- closing a source card;
- `play_selected_cards` without a create step;
- standalone `create_card` that only places a card in skill/deck/hand;
- trigger-created cards without immediate activation;
- hidden/private target selection not covered by the exact representative;
- variable or pending payment;
- battle-result dependency;
- broad lifecycle cleanup;
- roster-wide JSON migration.

## B Checklist

- Prove whether an exact representative exists before changing runtime.
- If no exact representative exists, stop with `NO_ELIGIBLE_REPRESENTATIVE` or `RUNTIME_SEMANTIC_GAP`.
- If an exact representative exists, prove routing by semantic form, not ability id.
- Prove compiler fail-closed for missing created definition, invalid destination, invalid visibility, missing activation state, duplicate ambiguous identity, extra effects, wrong timing, and unsupported cleanup.
- Prove runtime rollback if create succeeds but activation fails.
- Prove stale replay does not duplicate created card, activation state, event log, or projection state.
- Prove browser/server evidence covers source command or event, WS `expectedRevision` where command-driven, server revalidation, projection, reconnect, and stale rejection.
- Keep Drake `mount-summon` under `play_selected_cards` unless canonical source proves otherwise.
- Report before/after legacy route counts against the accepted post-P3-B08 baseline.

## Browser Candidate Boundary

Gate C candidate evidence is only valid for an exact representative that creates and activates in the same semantic contract.

It cannot be inherited from:

- Olga existing-card activation;
- Artoria Alter source close;
- Time Alter selected-card play;
- Volumen source-card response play;
- Maiya add-to-attack.

## Machine-Readable Artifact

Companion artifact:

```text
artifacts/phase3-b09-create-and-activate-handoff.json
```
