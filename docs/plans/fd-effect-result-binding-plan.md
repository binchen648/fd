# FD Effect Result Binding Plan

日期：2026-09-07  
项目路径：`D:\fd`  
计划范围：Phase 3A Resolution/Data-flow Infrastructure，以及后续接入生产能力执行链的最小路线。  
状态：补档。此前 `D:\fd\docs\reports\2026-09-07-effect-result-binding-design-result.md` 声称本计划文件已添加，但当前工作区未找到 `D:\fd\docs\plans\fd-effect-result-binding-plan.md`。

## 1. Purpose

Effect Result Binding 解决的问题是：一个 effect primitive 的真实执行结果必须能被后续 primitive 安全引用，而不是由后续 primitive 重新查询状态、猜测前序结果，或依赖隐式副作用。

目标链路：

```text
Effect A executes
→ returns typed EffectResult
→ result is bound into ResolutionContext
→ Effect B reads a declared field through a reference expression
→ compiler and runtime both reject invalid references fail-closed
```

这不是某一个 effect primitive，而是所有 primitive 之间组合所需的 Resolution/Data-flow Infrastructure。

## 2. Scope

本计划覆盖：

- typed effect result envelope
- resolution context and ephemeral binding store
- result binding declarations
- reference expressions for values, targets, and conditions
- data-flow validation
- primitive registry contract
- transaction boundary for a resolution sequence
- executable pack compiler integration
- synthetic acceptance fixtures
- later production `MatchSession` integration plan

本计划不直接覆盖：

- 全量真实卡牌迁移
- 完整 Flow Engine 重构
- UI/浏览器端所有卡牌交互迁移
- 所有 combat/scoring primitive 注册化

## 3. Current implementation evidence

当前已存在的基础设施：

- `D:\fd\packages\rules\src\ability\resolution-dataflow.ts`
  - `EffectResultEnvelope`
  - `KnownEffectResult`
  - `resultSchemas`
  - `ResolutionBindingStore`
  - `AbilityResolutionContext`
  - `validateResolutionDataFlow`
  - `validateResolutionDataFlowNodes`
  - `executeResolution`
  - primitive registry and synthetic primitives
- `D:\fd\packages\rules\src\ability\executable-card-pack.ts`
  - `compileExecutableCardPack` path now invokes ability resolution data-flow validation for Phase 3A syntax.
- `D:\fd\packages\rules\tests\regression\resolution-dataflow.test.ts`
  - covers synthetic result binding, validator failures, registry lookup, rollback, and schema/runtime consistency.
- `D:\fd\packages\rules\tests\executable-card-pack.test.ts`
  - covers compiler-path binding/reference failures.

Current legacy boundary:

- `D:\fd\packages\rules\src\ability\interpreter.ts` production `activate_ability` still calls `executeAbility`, not `executeResolution`.
- Existing real card roster is not generally authored as Phase 3A resolution nodes.

## 4. Design model

### EffectResultEnvelope

Every registered primitive that participates in binding returns a typed envelope:

```ts
interface EffectResultEnvelope<Type extends string, Payload> {
  type: Type;
  payload: Payload;
}
```

Required properties:

- stable primitive result type
- structured payload
- no implicit binding from arbitrary runtime state
- fields exposed for binding must be declared in schema

### ResolutionContext

Resolution context holds ephemeral execution data:

- source card
- controller
- triggering event, if any
- selected targets
- variables
- binding store

Bindings must not be persisted into long-term `GameState` unless a separate effect explicitly writes state.

### Result Binding

An effect node may declare a binding id for its result. Later nodes may reference fields from that binding.

Rules:

- binding ids are local to one resolution sequence
- duplicate binding on one reachable path is invalid
- future binding reference is invalid
- branch-local binding is unsafe unless all reachable branches define the same binding with compatible result type

### Reference Expressions

Supported reference categories:

- value expression: scalar/numeric fields such as removed count
- target expression: player/location/card id collections
- condition expression: boolean predicates derived from prior results

Each category must declare and validate expected value type.

### Data-flow Validator

The validator is compile-time protection. It must fail closed for:

- unknown binding id
- future binding reference
- duplicate binding id
- invalid result field
- expected type mismatch
- unsafe branch dominance
- schema/runtime drift where a field is declared but cannot be consumed

### Transaction Boundary

Resolution sequence execution must be transactional:

- execute against a cloned working state
- collect typed results and emitted events
- return `nextState` only after the whole sequence succeeds
- keep original state unchanged on invariant failure

## 5. Acceptance gates

### Gate A: infrastructure acceptance

Required:

- typed result envelope exists
- binding store exists and is local to resolution context
- value/target/condition references compile
- invalid references fail through `compileExecutableCardPack`
- synthetic primitive chain executes through registry lookup
- runtime rollback is proven by a failing later primitive
- schema/runtime consistency fixture proves every exposed field can actually be consumed

Evidence expected:

```text
npx vitest run packages/rules/tests/regression/resolution-dataflow.test.ts
npx vitest run packages/rules/tests/regression/resolution-dataflow.test.ts packages/rules/tests/executable-card-pack.test.ts packages/rules/tests/regression/package-exports.test.ts
npm run typecheck
```

Gate A can be claimed only for infrastructure. It does not mean production `MatchSession` abilities have migrated.

### Gate B: first real-card binding

Required:

- choose one real card or Golden Card fixture whose second effect consumes the actual result of the first effect
- author it using Phase 3A binding/reference syntax
- compile through `compileExecutableCardPack`
- execute through the same runtime path intended for production ability resolution
- assert state delta, projection, events, and rollback negative case

Candidate scenario:

```text
P2 has advantage position
P3 has no advantage position
P4 has advantage position

Effect A removes advantage position from all selected opponents and binds removedAdvantages.
Effect B awards VP based on removedAdvantages.removedCount.
Expected VP delta is 2, not 3.
```

Gate B is not satisfied by direct validator tests alone.

### Gate C: production flow integration

Required:

- `MatchSession.dispatchPlayerAction -> dispatchAbilityCommand -> activate_ability` can execute Phase 3A resolution nodes through `executeResolution`
- legal action projection remains stable
- pending target and response windows continue to block correctly
- rejected resolution does not mutate authoritative state
- reconnect/projection path shows consistent post-resolution state
- browser or server-level E2E proves the path outside synthetic tests

## 6. Implementation sequence

1. Keep current `resolution-dataflow.ts` as the infrastructure module.
2. Keep compiler validation in `compileExecutableCardPack` for all Phase 3A nodes.
3. Introduce a production bridge that lets executable ability effects route either to legacy `executeAbility` or Phase 3A `executeResolution` based on node syntax.
4. Add one real-card/Golden Card fixture before migrating broader card content.
5. Move primitive-by-primitive from legacy `resolveEffect` into registered `ResolutionPrimitive` handlers.
6. Remove schema/runtime duplication by keeping result schemas and evaluator-supported fields in one reviewed contract.
7. Add Flow Engine hooks only after Gate B proves the binding runtime in a real ability path.

## 7. Non-goals and intentionally retained legacy paths

Intentionally retained until later phases:

- `D:\fd\packages\rules\src\ability\interpreter.ts` legacy `executeAbility` / `resolveEffect`
- existing real card JSON not using binding/reference
- old `core` helpers that do not return typed effect results
- battle resolver card-specific special cases until battle primitive registration begins

These paths must not be cited as proof that Effect Result Binding is production-complete.

## 8. Required negative tests

The test suite must include compiler-path failures for:

- unknown binding
- future binding
- duplicate binding
- invalid field
- wrong expected type
- unsafe branch binding
- declared schema field that runtime cannot consume

Runtime failures must prove:

- original `GameState` is unchanged
- no partial result escapes as committed state
- emitted events are not published as committed events after rollback

## 9. Reporting standard

Any future handoff for this area must report:

- Phase
- Changed files
- Claimed Acceptance
- Tests
- Known failures
- Known legacy paths intentionally retained
- Areas not verified

Do not claim final Phase PASS from infrastructure-only evidence.
