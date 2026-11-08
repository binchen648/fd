# Effect Plan Contract

Version: RC-v1 / 2026-11-05
Base: `e63cdeb2a065a9f87c24039d2b08bbe059513fed`
Task: FD-RC-20261105
Status: IMPLEMENTATION_CONTRACT; independent acceptance pending

Input: validated typed ability plus authoritative activation context. Output: ordered effects, required/optional choices, costs, targets and lifecycle metadata. The existing typed effect sequence is the plan; no second flow engine or mutable shadow GameState.
State: preflight is pure; execution uses existing typed interpreter and Session consumers. All mandatory follow-up choices must be feasible, including cards consumed by earlier steps. No target window may be opened when a mandatory later step is impossible.
RC-01 movement must produce an executable choice and actual movement, not a display-only directive. RC-02 Square Accel must check its complete ordered continuation before suspension.
Errors: unavailable required card/target, incompatible bindings or unsupported effect consumer reject before payment. Recovery: rollback to pre-command state on failure; suspended execution resumes only its saved typed sequence, never replays committed effects.
Acceptance: multistep, target disappearance, empty resources and pending snapshot/recovery cases.
