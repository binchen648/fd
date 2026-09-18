# P3-R46 Recovery Review Record — FB2-21 Shared Terrain Deployment-Bonus Metric

Date: 2026-09-18
Role: Codex A recording returned fresh independent R evidence
Verdict: `IMPLEMENTATION_ACCEPTED_CANDIDATE`
Blocking findings: none
Credit: zero frozen-migration credit

## Exact review target

- Integrated main ancestor: `553779e8ffcc926ae4763ee86a2ea937e090c128`.
- Implementation Base: `98ce9b0c3967c598f9fb7d2736f418e15dcc5d30`.
- B2 Candidate: `92f2aa1b084b9ac9c2ee8f2f353cdfa13611f04a`.
- Fresh reviewer worktree: `E:\Codex\FD\fd-fb2-21-review-r46-fresh-0034`.
- PR: `#355` (stacked on exact Base; no main-base Actions expected).

## Independent reviewer result

Fresh R46 found no blocking finding. The reviewer independently verified exact Base -> Candidate direct-parent lineage, integrated main ancestry, exact six-file scope, stacked PR topology, and final reviewer/Candidate cleanliness.

The implementation is identity-free infrastructure. It extracts the existing combat terrain/deployment-bonus truth into the shared `terrain-advantage.ts` helper and makes combat consume the same helper. The reviewer confirmed preservation of server-owned terrain assignments, authored terrain bonuses and multipliers, Preparation remote-operation doubling, authored terrain suppression, invalid/missing assignment zero behavior, and pure-read semantics.

The only newly accepted controlled numeric variable is exact `controller.deployment_bonus`. Near-match spellings fail closed. Interpreter evaluation is by the ability/card controller, not source owner, active player, target player, identity, printed text, Reference handler, or allowlist. Reviewer-only probes independently confirmed controller-vs-owner separation, two-controller routing, non-battlefield zero behavior even with synthetic terrain bonuses, multiplier/doubling exactly once, suppression agreement with combat, and no state/event/runtime mutation.

No Ciel identity/content, authoring, generated product, taxonomy/KPI, frozen inventory, MatchSession, or frozen migration diff is present. Accepted frozen overlap therefore remains `111/944`.

## Performance / official gate evidence

Fresh R46 independently found no performance blocker. Candidate unchanged official `npm run test:ci` passed `130 files / 842 tests`; the previously timing-sensitive eleven-round MatchSession test completed at about 2782 ms in that full run.

The reviewer also ran exact-Base comparison. Base unchanged official CI could hit the same fixed 5000 ms test timeout at about 5274 ms, while isolated three-run timings substantially overlapped: Candidate about `1959 / 1953 / 2020 ms`, Base about `1914 / 1995 / 1965 ms`. The evidence supports pre-existing parallel-suite timing fragility rather than an FB2-21 production performance regression. No timeout, worker, skip/delete, or repository configuration was modified to obtain the accepted official result.

## Fresh reviewer validation

- `npm ci --offline`: PASS, 239 packages, 0 vulnerabilities.
- typecheck: PASS.
- focused FB2-21 + combat: `17/17` PASS across 2 files.
- unchanged official `test:ci`: `842/842` PASS across 130 files.
- rules core + regression: `427/427` PASS across 70 files.
- client production build: PASS; existing Vite `node:crypto` warning only.
- content validation / official compilation: `7 masters / 7 servants / 20 events / 0 blockers` and PASS.
- generated determinism: PASS.
- locked Reference verification: PASS.
- coverage: `99 archives / 134 cards / 233 abilities`, compiled `71/14/0`, buckets `22/3/128/0/80/126`.
- automation audit: `128/3/80/20`.
- `git diff --check`: PASS.

Deterministic hashes independently reproduced by R46:

- content library `c9841d4bad3d43a525895372fabd3b49ea07e79075652a5cbd18fad3405e2e1e`;
- fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
- evidence report `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.

Reviewer and Candidate worktrees were both clean at exact Candidate SHA. Review did not modify Candidate and did not continue into A synchronization, Ciel s2, other frozen targets, FM09, FM10, or merge.
