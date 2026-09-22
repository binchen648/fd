# P3-A FB2-30 Master Skill Definition Return Dispatch

Role: Codex A
Status: `SYNCHRONIZED`
Date: 2026-09-19

## Baseline

- Exact Base: `6718244a7e939afb57687dc8a1ac99ab03302c04` (R68 Outer-God-Life consumer acceptance synchronization)
- Formal recovery accepted: `136/944`; remaining: `808`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Integrated `origin/main` remains separate at `553779e8ffcc926ae4763ee86a2ea937e090c128`.

FB2-30 is B2 capability work only and earns zero frozen migration credit.

## Fresh readiness partition

A mechanically reconstructs the formal accepted frozen union at exactly `136/944`, then excludes it from the F1 `READY_GENERIC_EXTENSION` population. The true remaining block-free generic-extension set is `63` identities; the raw inventory value `66` includes three already accepted identities and must not be used as remaining migration count.

No exact multi-card semantic signature among the remaining `63` is already proven to be a complete accepted runtime route. The next narrow reusable gap is Card Zone definition-return/materialization for controller-owned master skills.

Two remaining source-grounded rows share this exact narrow output boundary:

1. `master.arcueid.skill.s1`
2. `master.ciel.skill.s1b`

Both require `GENERIC_CARD_ZONE`, `GENERIC_CONDITION_EVALUATION`, `GENERIC_TRIGGER_GATEWAY`, and `GENERIC_VISIBILITY`. Their parent triggers/conditions are different and are not promoted by this task. Two other remaining rows use `RETURN_CARD_BY_DEFINITION` inside unrelated servant attack/movement flows; they are explicitly outside this first master-skill component.

## Exact capability

Implement one identity-free `return_card_by_definition` component for a controller-owned `master_skill` definition.

Accepted structural effect shape for this slice:

- `type: "return_card_by_definition"`;
- `target: "controller"`;
- target definition supplied structurally by exactly one of `definitionId` or `linkedSkillId`;
- `destination: "master-skills"`;
- `createIfMissing: true`;
- `face: "up"`;
- `active: false`.

Runtime semantics:

1. Resolve the target definition from the executable pack; it must be a `master_skill` owned by the controller's current master definition.
2. Find controller-owned physical instances of that definition. More than one is a malformed state and must fail closed before mutation.
3. If one exists in any supported card zone, return that same physical instance to runtime zone `skill`; restore owner/controller to the controller; set owner-only visibility; clear transient transform state; set ability card state inactive and face-up.
4. If none exists and `createIfMissing` is true, create exactly one physical instance in `skill` with controller owner/controller, owner-only visibility, inactive/face-up state, and structural provenance from the source ability.
5. Missing target definition, wrong target owner/type, malformed shape, duplicate physical target, or stale/invalid source context must reject transactionally.
6. The component itself must not add or broaden `game.started`, `skill.used`, `player.victory-points.changed`, threshold, opponent, reset-usage, or other Trigger/Condition behavior. Parent routing remains independently gated.

## Identity isolation

Production runtime/compiler must not branch on Arcueid, Ciel, target card IDs, owner names, printed Chinese text, F1 hash, Reference hash, or Reference handler IDs. The two IDs above are future membership evidence only.

Locked Reference is static/historical corroboration only. It records the same structural effect shape for Arcueid s1 and Ciel s1b; its handler implementation must not be copied into product routing.

## Authorized scope

B2 may touch only the minimum generic rules/compiler/types/tests plus one FB2-30 result report. No F1 authoring migration, production pack registration, generated product changes, A-owned taxonomy/KPI edits, app changes, merge, or retarget.

Required evidence includes:

- existing physical target return preserves the physical instance and normalizes skill-zone ownership/visibility/state;
- missing physical target materializes exactly one instance;
- duplicate target instances fail closed without mutation;
- wrong master owner/type/missing definition and malformed near-match shapes fail closed;
- no parent trigger route is added by implication;
- no identity/name/text/hash/Reference-handler routing;
- formal frozen accounting remains `136/944`, with zero migration credit;
- focused tests, typecheck, rules regressions, official CI, deterministic content verification, Reference verification, client build, `git diff --check`, and final cleanliness.

Historical `P3-FM09-RECOVERY` remains `MIGRATION_BLOCKED`.