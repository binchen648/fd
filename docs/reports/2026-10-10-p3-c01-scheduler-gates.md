# C01 Scheduler Gate Test Candidate

Task: `P3-C01-THREAD-DISPATCH-FEASIBILITY`; Control Epoch: `FD-P3-2026-09-23-08`.
Claimed status: `AUTOMATION_BASELINE_CANDIDATE`. No actual task dispatch authorized.

## Exact scope

Base: `bbbeabbd92e6db49fe04a457db9a2c3f0c80a1c9`.
Implementation: `13f8b5c6f9493daa8bb84f4415e8930a78bdd5ea`.
Planner scope source: `5d0779435494e5a4e2ea59c6e37d825eac27ebc5`, `docs/agents/P3-E08-C01-THREAD-DISPATCH-PROTOTYPE.md` and its smoke-test Next Owner section. User subsequently permits scheduler gate tests, not real engineering-task automatic dispatch. Prior feasibility review is accepted only as supplied by the user; no immutable Reviewer PASS artifact is invented here.

New paths: `scripts/phase3-scheduler-gates.ts`, its focused test, `artifacts/phase3-c01-scheduler-gates.json`, this report. Existing transport/probe, runtime, rules, authoring, KPI, credit and acceptance records were not modified. Primary `D:/fd` collaborator changes were untouched.

## What the preview proves

The module is a pure supplied-snapshot evaluator with no transport, filesystem, process, persistence, tool or dispatch dependency. Tests exercise task/base/role/domain/idle/dependency/lock/delivery refusal. Unknown lock/delivery snapshots block; failed/waiting reviews do not become accepted; duplicate or uncertain delivery stays blocked on repeat preview. Planner task packet binding is compared before a preview is declared ready. Inputs remain unchanged.

Every result has `dispatchAuthorized=false`, `acceptanceGranted=false`, `liveFactsVerified=false`; positive results mean only `PREVIEW_READY` for the supplied snapshot. A zero `toolCalls` field is not proof of a live worker's behavior: the implementation has no transport, and only unit/mock tests ran. Existing adapter safety tests remain mock evidence. This work did not run the CLI probe or any real worker, scan conversations, install monitoring, or send task packets.

## Important boundary

Snapshots currently supply Git commit observations, Planner queue data and dependency review metadata. The evaluator checks structure and consistency, not their real-world provenance. `PASS_EXACT_BOUND` is an input state, not a state granted by this module. Future authoritative collectors must verify Git objects/ancestry, review bytes/hash/identity, exact task queue and lock store; live freshness and atomic reservations remain required before any sending integration. The preview is deliberately not connected to `sendProbe` or a real engineering-task sender.

Same-domain locks held by another task block; released or non-overlapping locks and a task's own reservation can permit a preview. This does not establish a current writer lease or handle distributed locking. No claim of restart durability or desktop interoperability is made.

## Commands and results

- RED: focused gate test before implementation exited 1, missing module and no tests collected.
- GREEN initial combined test: 44/44; final after unknown-lock/status/repeat-preview negatives: `npx --no-install vitest run scripts/tests/phase3-scheduler-gates.test.ts scripts/tests/phase3-thread-dispatch.test.ts scripts/tests/phase3-cli-worker-probe.test.ts`, exit 0, 3 files / 47 tests (36 new gate tests + 11 existing safety tests).
- Targeted `tsc --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --skipLibCheck --types node` over those three automation modules and tests: exit 0. This is not repository-wide typecheck acceptance.
- `git diff --check`: exit 0.
- Full CI, real worker, desktop conversation control and runtime/browser suites were not executed. No full-platform PASS is claimed.

Machine evidence binds exact implementation SHA and source/test Git blobs. The evidence carrier SHA is reported externally to avoid self-reference. Review must inspect that final carrier independently.

## Next

Reviewer A: review schema refusal, gate tests, purity/no-send boundary and evidence bindings. Planner: after independent review, define authoritative collector contracts and reserve resources before any registered-task experiment. A must not turn a positive snapshot preview into real dispatch without explicit further authorization. B11 readiness/CI/source-binding issues remain separate and unchanged.

Main coverage / migration / denominator deltas: 0. No Gate, credit, promotion or automatic dispatch acceptance is granted.
