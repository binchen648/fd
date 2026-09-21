# Phase 3 Global Readiness Probe

Status: `PROBE_ONLY`
Owner: Codex A
Identity: `<canonical frozen identity>`
Baseline: `<exact 40-character commit>`
Source SHA-256: `<exact digest>`
Runtime evidence fingerprint: `<exact digest>`

## Complete-card reconstruction

- Authoritative source and clause normalization: `<evidence>`
- Loader report empty: `YES | NO`
- Compiler report empty: `YES | NO`
- Every semantic node mapped to an accepted exact contract: `<capability IDs and review links>`
- Referenced/generated definitions registered: `YES | NO`
- Positive executable path: `<test and command>`
- Canonical negative paths: `<tests and command>`
- Malformed/corrupt input fails closed: `<test and command>`
- Active task reservation: `NONE | <task>`

## Decision

State: `S_READY_NOW | ONE_SHARED_GAP | TRANSITIVE_DEPENDENCY | MULTI_GAP | SOURCE_EVIDENCE_REQUIRED | RULE_DECISION_REQUIRED | SPECIAL_HANDLER_REVIEW`

Reason codes: `<non-empty machine-readable list>`

Dependencies: `<accepted frozen identities or NONE>`

Missing capability: `<one exact identity-free capability or NONE>`

Closure yield: `<bounded independently reconstructed identity count or 0>`

Risk flags:

- hidden information: `YES | NO`
- interaction: `YES | NO`
- lifecycle: `YES | NO`
- battle ordering: `YES | NO`

## Dispatch boundary

This probe grants no migration credit, runtime acceptance, Gate promotion, Phase PASS, PR merge, or batch authorization. `S_READY_NOW` requires every complete-card checkbox above to be `YES` and every dependency to have registered accepted evidence.
