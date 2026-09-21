# P3-A R92 Leonidas s1 CI Compatibility Scope Correction

Role: Codex A
Status: `READY`
Date: 2026-09-20

## Exact baseline

- Base: `048d87108cc44abbd2cefe44e52b24af9fdc2351` (`P3-A-R92-LEONIDAS-S1-CONSUMER-MIGRATION-DISPATCH`)
- Formal migration: `146/944`
- Formal remaining: `798`
- Base frozen authoring overlap: `141/944`
- Leonidas S target: `servant.leonidas.skill.sc-leonidas-1`
- Required Leonidas Candidate overlap: exactly `142/944`

## Mechanical incompatibility found by S

The Leonidas S implementation remained inside the original three-file migration scope and passed its focused semantic checks, including exact frozen accounting `141/944 -> 142/944`. The official `npm run test:ci -- --maxWorkers=2` then failed only because the already-accepted historical test `packages/rules/tests/siegfried-s2-consumer-migration.test.ts` still asserts the whole repository must contain exactly `141` frozen authoring ids.

That assertion was correct for the historical Siegfried Candidate, but it is not a stable invariant for later migrations. Once Leonidas is correctly added, the repository-wide overlap is necessarily `142`, so the old absolute snapshot and the current authorized migration cannot both pass.

## Scope correction

S is additionally authorized to modify exactly one pre-existing compatibility test file:

- `packages/rules/tests/siegfried-s2-consumer-migration.test.ts`

The only permitted semantic change is to remove the historical absolute repository-wide overlap count assertion (`141`) from the Siegfried test and preserve stable Siegfried invariants instead:

- frozen denominator remains `944`;
- no duplicate frozen authoring ids;
- `servant.siegfried.skill.sc-siegfried-2` remains authored exactly once.

No Siegfried production data or behavior may change. The current Leonidas focused test remains responsible for proving the current exact repository accounting is `142/944` and exact +1 Leonidas.

## Unchanged prohibitions

- no production runtime source edits;
- no product pack/generated registration;
- no second new frozen identity;
- no merge or retarget;
- no migration credit before fresh independent R returns `MIGRATION_ACCEPTED` for the exact S Candidate and A synchronizes that acceptance.

This correction earns zero migration credit. Formal migration remains **`146/944`**, with **`798`** remaining.

Task-local S requirement for this dispatched task only: **S 完成 recertification 并提交 Exact Base/Candidate**。This was not a standing S rule and must not be inherited by later S tasks unless their own current formal task explicitly requires it.