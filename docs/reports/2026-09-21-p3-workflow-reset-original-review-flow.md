# Phase 3 Workflow Reset To Original Review Flow

Date: 2026-09-21
Role: Coordinator workflow correction
Base: `d50a9f87ae168a482b0713e7b0077f79ac69e18c`

## Why

The original full-roster startup prompt defines the implementer loop as test-first, minimum implementation, focused verification, `git diff --check`, and commit of declared files. The original agent/collaboration contracts preserve independent R and PR role separation but do not require every intermediate revision Candidate to rerun the whole repository release suite before R.

Later task dispatches accumulated `official CI` / content / Reference / client-build / coverage-audit requirements as proof obligations. Those remain useful final evidence, but treating all of them as a mandatory pre-R gate on every revision caused repeated expensive validation before the independent reviewer had established that the Candidate was otherwise stable.

## Restored sequencing

`targeted failing/focused test -> minimum scoped implementation -> focused verification -> diff check -> commit/PR -> fresh independent R`

If R returns `IMPLEMENTATION_NEEDS_REVISION`:

`exact minimal fix -> affected focused/adversarial verification -> diff check -> new Candidate -> fresh R`

Once the Candidate is otherwise stable, run any repository-wide validation required as final acceptance/evidence. Heavy checks may still be run earlier when the exact task or reviewer finding genuinely depends on them.

## Non-changes

This does not weaken semantic acceptance, remove fresh independent R, change any skill/runtime contract, change migration credit, authorize merge/retarget, or rewrite historical completed evidence. The accepted throughput scheduler rule that R should continue within the same exact scope and report all independently confirmable findings remains in force.
