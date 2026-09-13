# P3-A02 Reusable Evidence Checklist Template

- Document Role: AGENT_EVIDENCE_TEMPLATE
- Owner: Codex A
- Target Users: Codex B and Codex R
- Scope: P3-B05 through P3-B09 card-action contract slices
- Claimed Acceptance: `AUTOMATION_BASELINE_CANDIDATE`
- Promotion: this template does not promote Gate A/B/C, Phase 3, or Release status.

## Purpose

Each B card-action slice must be reviewed as one narrow semantic contract, not as a broad card family. This template is the reusable evidence shape for:

- `PLAY_SOURCE_RESPONSE`;
- `ADD_TO_ATTACK`;
- `ACTIVATE`;
- `CLOSE`;
- `CREATE_AND_ACTIVATE`.

The implementing branch should fill the checklist with concrete current-checkout evidence. Codex R judges whether the filled evidence is sufficient.

## Required Slice Header

Every B implementation report should declare:

- task id;
- branch name;
- mechanism family;
- exact contract name;
- representative card and ability;
- implementation status, limited to `IMPLEMENTATION_COMPLETE_CANDIDATE`;
- explicit statement that independent review is required before any status promotion.

## Contract Boundary

Every B slice must state:

- exact eligible shape;
- exact skipped abilities and skip reasons from current authoring inventory;
- which previous representative evidence cannot be inherited;
- which future or adjacent shapes invalidate inheritance;
- whether any legacy compatibility path remains and why.

For card-action slices, never merge these contracts:

- normal `PLAY`;
- `PLAY_SOURCE_RESPONSE`;
- `ADD_TO_ATTACK`;
- `ACTIVATE`;
- `CLOSE`;
- `CREATE_AND_ACTIVATE`.

## Component Evidence Requirements

The filled report should prove:

- primitive is typed and registered;
- result schema exposes each field that bindings may consume;
- compiler validates the exact semantic shape fail-closed;
- malformed or unsupported semantic shapes do not silently fall back to legacy;
- runtime corruption cases fail closed before irreversible mutation;
- failed later nodes roll back earlier mutations when the contract uses data-flow transactions;
- routing is by semantic shape, not card id or ability id.

Minimum negative rows:

- wrong kind;
- wrong trigger or phase;
- wrong window;
- missing or wrong cost;
- target/card reference missing;
- wrong target/source zone;
- unsupported effect companion;
- unknown primitive;
- bad binding field or expression.

## Scenario Evidence Requirements

The filled report should prove through real `MatchSession` dispatch or event processing:

- canonical source JSON is compiled into the executable pack;
- the representative ability is available only when legal;
- server revalidation rejects stale or corrupted preconditions;
- state mutation matches the contract;
- event/log/projection trace includes source card, ability, result identity, and affected entity;
- migrated exact shape does not execute the legacy owner;
- adjacent skipped shapes remain skipped.

When the contract is event-driven, the report must identify the producer event and the consumer event separately.

## Browser/Server Evidence Requirements

The filled report should describe one scoped browser/server candidate path when the contract needs production-facing evidence. It must identify:

- setup boundary: natural flow, restored snapshot, or fixture;
- first browser-visible offer or server-projected state;
- WebSocket command path if the contract is client-command-driven;
- expected revision behavior if a mutating command is sent;
- server revalidation point;
- final projection assertion;
- reconnect assertion based on a post-reconnect projection, not stale pre-reload state;
- stale or duplicate replay rejection;
- exact evidence boundary and non-inheritance list.

Event-driven contracts must not claim a client activation command when the runtime is supposed to activate from a server event. They should instead prove the event chain and reconnect/projection behavior around the server-side mutation.

## Reviewer Decision Inputs

Codex R should receive:

- implementation report;
- focused unit or regression test command and result;
- browser/server test command and result, when applicable;
- inventory command and result;
- coverage command and result;
- automation audit command and result;
- exact changed file list;
- current legacy/new/dual counts;
- known retained legacy paths;
- secondary runtime paths;
- areas not verified.

Codex R may return:

- `PLAN_NEEDS_REVISION`;
- `IMPLEMENTATION_NEEDS_REVISION`;
- `SCENARIO_VERIFIED` for scoped Gate B evidence only;
- scoped `E2E_VERIFIED` only when browser/server evidence is independently verified and the contract boundary is narrow.

Codex B must not promote its own implementation.

## Machine-Readable Template

Companion artifact:

```text
artifacts/phase3-a02-evidence-checklist-template.json
```
