# Legality Contract

Version: RC-v1 / 2026-11-05
Base: `e63cdeb2a065a9f87c24039d2b08bbe059513fed`
Task: FD-RC-20261105
Status: IMPLEMENTATION_CONTRACT; independent acceptance pending

Input: latest authoritative state, actor/controller, source instance, ability identity, phase/window, resources and submitted selections. Output: allowed action/choice projection or denial with stable reason; projection cannot grant execution permission.
State: legality queries are pure. Session rechecks current state on every command and pending-choice resolution before any cost/effect commit. Stale revision, duplicate, wrong actor and illegal target are rejected atomically.
Mandatory steps require jointly feasible resources/targets before opening the first choice. Optional steps may be declined only if the actual rule permits it. Fixed mana/VP costs must not be partially paid. Hidden candidates are visible only to the entitled actor.
Errors: missing source, wrong location/window, insufficient cost, missing continuation, invalid selection. Recovery: reproject latest state; rejected commands preserve state/revision. RC-05 shares the same legality predicate between projection and dispatch, not client-side guesses.
Acceptance: actual Session actions and dispatch agree; changed-state and replay rejection preserve authoritative state.
