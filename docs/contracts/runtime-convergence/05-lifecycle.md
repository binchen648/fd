# Lifecycle Contract

Version: RC-v1 / 2026-11-05
Base: `e63cdeb2a065a9f87c24039d2b08bbe059513fed`
Task: FD-RC-20261105
Status: IMPLEMENTATION_CONTRACT; independent acceptance pending

Input: round/phase/battle events and typed effect duration with source/owner and anchored location. Output: active modifiers and expiry decisions from authoritative state.
State: an effect starting next round is inactive now, activates at that round and expires at its specified boundary. Inferno exemption applies to its source; cost changes use the anchored location and actual terrain value. Aggregate power modifiers are round-scoped and do not leak into later rounds. Movement and defeat clear only their required assignments/effects.
Errors: invalid interval or unsupported duration fails closed; do not approximate with a different interval. Recovery: snapshot preserves start/end, source and anchored target; reload/reconnect neither reapplies nor extends effects.
Acceptance: before/at/after boundary, source exemption, movement, battle end and restore cases. Normal play allows at most one of the two battlefields per player per round; do not invent multi-battle Gatou semantics.
