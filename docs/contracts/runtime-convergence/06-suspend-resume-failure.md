# Suspend / Resume / Failure Contract

Version: RC-v1 / 2026-11-05
Base: `e63cdeb2a065a9f87c24039d2b08bbe059513fed`
Task: FD-RC-20261105
Status: IMPLEMENTATION_CONTRACT; independent acceptance pending

Input: pending typed effect execution, actor/source identities, selected targets/bindings and authoritative revision. Output: entitled pending-choice projection, validated restored pending state or explicit rejection.
State: snapshot carries sufficient existing execution context to resume exactly once. Reconnect uses authoritative Session state. Source, actor, definition, step and target validity are rechecked; no substitute card/owner. Already committed steps/costs must not repeat.
Errors: stale/duplicate/wrong actor, malformed snapshot, missing mandatory continuation or changed source reject without partial state mutation. Recoverable choices are reprojected; impossible activation is prevented at preflight rather than trapping the game in an unfinishable window.
Acceptance: serialize/restore and real server reconnect, duplicate choice, invalid choice, hidden projection and repeated-command invariance. Raw failure logs remain unchanged; skipped or not-reached checks are not PASS.
