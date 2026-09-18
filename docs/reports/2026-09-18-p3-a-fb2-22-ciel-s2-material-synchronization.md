# P3-A FB2-22 Ciel S2 Recovery Material Synchronization

Date: 2026-09-18
Role: Codex A
Status: `MATERIAL_SYNCHRONIZED`
Credit: material only; no accepted frozen migration credit before fresh R47

## Exact identity

- Implementation Base / dispatch: `52ea97e9371f5a2353b58ad948b232434c68abd8`.
- S Candidate: `35a2a59fd4bf77bdbbfac37031556617af94c47f`.
- Candidate branch: `codex/b-p3-fb2-22-recovery-ciel-s2-current`.
- Candidate PR: `#356`, stacked on exact Base branch/OID.
- A branch: `codex/a-p3-fb2-22-ciel-s2-material-sync-current`.
- Target: exactly `master.ciel.skill.s2`.
- Integrated main remains `553779e8ffcc926ae4763ee86a2ea937e090c128` and is in the recovery ancestry.
- Accepted F1 source-evidence commit: `59f145434695d29bdd17e4cb3adc887e84182377`.
- Locked Reference metadata commit: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.

Historical Ciel implementation/review material is technical evidence only. This synchronization does not inherit historical acceptance provenance and does not perform semantic acceptance.

## Mechanical material result

A independently verified exact Candidate lineage and exact six-file Candidate scope:

1. `data/authoring/masters/master.ciel.json`;
2. `data/packs/fd-playtest-v1/pack.json`;
3. `data/generated/fd-playtest-v1.content-library.json`;
4. `packages/rules/tests/executable-card-pack.test.ts` -- aggregate `71 -> 72` only;
5. `packages/rules/tests/regression/fb2-ciel-s2-support-definition.test.ts`;
6. `docs/reports/2026-09-18-p3-fb2-22-recovery-ciel-s2-support-definition-result.md`.

There is no Candidate diff in `packages/rules/src/**`, MatchSession, fixture, evidence report, Reference/F1 inputs, frozen inventory, taxonomy/KPI implementation, coverage/audit artifacts, UI/server, unrelated authoring, or any second provisioning target.

Fresh exact F1 intersection independently reproduces:

- F1 frozen identities: `944` unique;
- Base material overlap: `111/944`;
- Candidate material overlap: `112/944`;
- exact frozen addition: only `master.ciel.skill.s2`;
- frozen removals: `0`;
- duplicate canonical authoring card ids: `0`;
- the other ten frozen FM09 provisioning targets remain absent from authoring and generated rules.

This is a material synchronization only. Accepted frozen overlap remains **`111/944`** until fresh R47 independently accepts the exact Candidate.

## Product-surface checks

A independently confirms:

- playable masters: 7;
- servants: 7;
- executable cards: 72;
- executable characters: 14;
- executable decks: 7;
- blocking issues: 0;
- no Ciel executable/playable character;
- no Ciel fallback command spell or generated `master.ciel.command-spell`;
- no Ciel deck;
- no Ciel fixture/evidence/public master surface;
- the Ciel definition is outside-game support with no initial zone;
- source map contains the Ciel card plus exactly its two ability entries.

PR #356 is independently re-read as `OPEN`, non-draft, `CLEAN`, and `MERGEABLE`, with exact Base OID `52ea97e9371f5a2353b58ad948b232434c68abd8`, exact Head OID `35a2a59fd4bf77bdbbfac37031556617af94c47f`, and the same six changed files. `statusCheckRollup=[]` is expected for the stacked non-main base and is not treated as CI evidence.

## Independent A verification

Fresh A worktree starts clean at exact Candidate and independently reruns:

- `npm ci --offline`: PASS, 239 packages, 0 vulnerabilities;
- typecheck: PASS;
- focused Ciel + combat + executable compiler: `3 files / 66 tests PASS`;
- content validation: `7 masters / 7 servants / 20 events / 0 blockers`;
- official content compile: PASS;
- generated determinism: PASS;
- official unchanged `test:ci`: `131 files / 849 tests PASS`; timing-sensitive eleven-round MatchSession test passed at about 4042 ms in this A run;
- rules core + regression: `71 files / 434 tests PASS`;
- client production build: PASS, with only the existing Vite `node:crypto` warning;
- locked Reference verification at exact `b2f9fa15...`: PASS;
- phase3 coverage: PASS;
- automation audit: PASS;
- `git diff --check`: PASS.

Deterministic hashes are:

- content library: `2ffde7a8cf54611332456fe91b812ab6d36d98800f5b8d53f57394d65c05e572`;
- fixture: `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
- evidence report: `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`.

Fresh material reporting is `100 archives / 135 cards / 235 abilities`, compiled `72/14/0`, buckets `22/3/130/0/80/127`, and automation audit `130/3/80/20`. Coverage/audit artifacts generated during verification were restored exactly before this synchronization commit.

## R47 dispatch

P3-R47-RECOVERY is READY only as a fresh independent review of the exact Base, Candidate, and this A material synchronization. R47 must review independently, default read-only, implement no fixes, and must not modify the Candidate worktree.

At minimum R47 must independently judge source/provenance fidelity, support-only/outside-game product shape, no playable Ciel surface, exact controller deployment-bonus semantics through the already accepted generic route, exact one-frozen-ID material delta, generated determinism, six-file scope, official gates, PR topology, and reviewer/Candidate cleanliness.

If R47 accepts, recovery-line accepted overlap may advance from `111/944` to `112/944` only through a later A acceptance synchronization. If R47 finds a blocker, accepted overlap remains `111/944` and the Candidate must be revised through the implementation role.

Do not start another frozen target, P3-FM09, P3-FM10, or merge PR #356 from this synchronization.