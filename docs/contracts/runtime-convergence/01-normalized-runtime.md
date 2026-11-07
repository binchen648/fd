# Normalized Runtime Contract

Version: RC-v1 / 2026-11-05
Base: `e63cdeb2a065a9f87c24039d2b08bbe059513fed`
Task: FD-RC-20261105
Status: IMPLEMENTATION_CONTRACT; independent acceptance pending

Input: authoring definition, canonical source provenance, controller, source instance and schema version. Output: validated typed ability/effect nodes with stable source and ability identities; unsupported nodes are rejected, never interpreted as broader permissions.
State: normalization does not mutate GameState. Compilation preserves target, timing, cost, scope and lifecycle; source cards and generated libraries must agree.
Errors: unknown discriminator, missing required field, ambiguous target or unsupported lifecycle is a structured rejection before activation. Recovery: repair source and regenerate; never silently use Legacy execution for the RC families.
Acceptance: source -> compiler -> runtime identity parity and negative malformed-definition cases. Existing B fields are imported only from the identified tested source; later B terrain changes require an explicit migration ledger.
