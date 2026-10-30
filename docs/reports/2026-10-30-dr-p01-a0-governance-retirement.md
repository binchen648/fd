# DR-P01: A0 Dependency Reconciliation and Governance Retirement

Authority: user's Legacy A0 Governance Retirement & DR-P01 Integration Simplification decision, 2026-10-30.
Owner: Global Technical Lead / Planner.
Task: DR-P01-A0-DEPENDENCY-RECONCILIATION, read-only production investigation completed.
Machine matrix: artifacts/dr-p01-a0-dependency-reconciliation.json.

## 1. Real M1

GitHub live API confirms PR #561 is already merged, not pending approval. Merge and current remote main are both `7724bff0d849e13e5b6725c5b05f76dc6c03bce4` (M1), merged 2026-10-30 09:48:54 Asia/Shanghai. This task made no change to that PR.

Historical technical Base: `f70120e48284a2c5409320fa02b8cadce1e7899a`.
Frozen DR-P01 Candidate: `2c50256280ef0ebdb1c1366cb09984530fd868ff`.
Original A0 implementation carrier: `3ec55814b8aca84416fca46dfaf7032a7f115094`.

All 12 paths introduced by the K03 promotion have identical Git objects in M1 and historical Base. K03 is satisfied by main; no separate K03 branch or old review chain needs adoption. The matrix records exact per-path objects.

## 2. A0 classifications

M1-to-historical-Base differences are exactly seven paths:

| Path | Classification | DR-P01 handling |
|---|---|---|
| packages/rules/src/ability/interpreter.ts | Required production delta absent from M1 | Reuse minimal generic legality changes, then combine with DR-P01 action-turn changes and reverify |
| packages/rules/tests/regression/cb-a0-time-alter-origin-bullet.test.ts | Required regression absent from M1 | Keep technical assertions with DR-P01's legal setup changes |
| packages/rules/tests/regression/fb2-required-additional-play.test.ts | Required regression delta absent from M1 | Preserve append-only rejection, no impossible offered effect-play target, atomic state invariance |
| e2e/fd-time-alter-core-primitive.spec.ts | Required natural production regression delta absent from M1 | Preserve real replaced/drawn Origin Bullet, WS/reconnect/stale/privacy assertions; reuse DR-adjusted action-turn setup |
| artifacts/phase3-cb-a0-time-alter-play-legality-repair.json | Historical evidence only | Preserve original in history/branch; no production import required |
| docs/reports/2026-10-14-p3-cb-a0-time-alter-play-legality-repair.md | Historical evidence only | Preserve; superseded as an active DR-P01 prerequisite |
| docs/agents/manifests/tasks/P3-CB-A0-TIME-ALTER-PLAY-LEGALITY-REPAIR.json | Historical authorization only | Preserve; do not import or revive its approval requirements |

Production extraction is one semantic boundary in interpreter.ts: permit structurally eligible master deck attacks; filter face-down effect targets using shared legality; revalidate the same legality during effect-play execution. The historical source delta is 14 changed lines (11 additions/3 removals), not an entire interpreter replacement. Exact source hashes are bound in the matrix.

Necessity is based on DR-P01's explicit Time Alter/Origin Bullet neighboring-regression and effect/ordinary-quota acceptance scope. The action-turn test checks that Time Alter effect play does not consume either ordinary quota; the browser and Origin Bullet tests exercise the wider ruled legality boundary. A0 is not necessary as a governance unit. These are static dependency findings; no fresh runtime acceptance is claimed.

Replaced category: DR-P01 already changes the interpreter plus Origin Bullet/browser setup; do not overwrite these with historical A0 whole blobs. No independently accepted replacement of the entire A0 behavior was established. Unrelated category: old A0 coverage-sync/G/Reviewer sequencing has no production import and is removed from the active dependency DAG. Already-in-M1 category applies to all 12 K03 paths, not to the missing A0 repair.

## 3. Retired requirements

Effective for DR-P01, retire:

- A0 whole-branch promotion before DR-P01.
- Mandatory A0 B -> RB -> A -> RA -> G carrier/approval sequencing.
- Requiring old A0 Candidate, Reviewer or governance commits to be ancestors of the new DR-P01 candidate.
- Importing old A0 task manifest, report or evidence packet to satisfy integration.
- Repeated standalone A0 evidence sync/CI ceremonies instead of testing the actual integrated candidate.

Old artifacts are SUPERSEDED_AS_DR_P01_ACTIVE_PREREQUISITE, not erased, rewritten, declared invalid or granted broader acceptance. Retained negative tests remain technical regression assets even where their filenames contain A0.

The formal delivery roles are Playable Game Delivery Lead, Capability Batch Delivery Lead, Playable Delivery Verifier, Capability Batch Verifier, Global Technical Lead and Integration Owner. No separate A/B/G approval loop is reinstated through document naming or serialization fields.

## 4. Minimum retained dependencies

The active DAG is:

```text
M1 (K03 already included)
  -> minimum missing A0 technical legality behavior + relevant regressions
  -> DR-P01 action-turn implementation replay
  -> affected tests / independent Playable Verification / complete CI
  -> Integration Owner single promotion PR
  -> human approval -> merge -> post-merge verification
```

Canonical rules and user-confirmed Time Alter ruling remain authoritative technical inputs. Old review results may help target risk checks but do not accept the new SHA. No unrelated A0 Planner, accounting or governance branch is in this DAG. Since actual missing code exists, do not remove its technical dependency by asserting A0 was already merged.

## 5. Exact new-candidate boundary

Proposed branch: codex/dr-p01-m1-integration-20261030.
Exact Git base: M1 `7724bff0d849e13e5b6725c5b05f76dc6c03bce4`.
Source reference: frozen DR-P01 `2c50256280ef0ebdb1c1366cb09984530fd868ff` and the four technical A0 differences above. Source reference is provenance, not required parentage. Do not merge the whole old A0 or DR branch.

Candidate is NOT_CREATED by this read-only task; no candidate SHA or passing tests are invented. Replay the 29 exact DR-only paths enumerated by `git diff --name-only f70120e4 2c502562`, plus the additional required-additional-play test delta: 30 proposed source/test/manifest paths total. The machine packet lists every path. Exclude the three historical A0 files listed above and unrelated frontier changes. Reuse M1 K03 loader/tests unchanged.

Task/reservation copies in the new candidate must explicitly bind M1 and the current owner. Set dependencyShas to real current dependencies, not mandatory old A0/Reviewer carrier ancestry; use original SHAs only as technical provenance. Mark the old PR561 pending disposition obsolete in the new task copy because it has merged. Do not edit frozen copies.

Current reservation remains active on its original branch/worktree and owner. No release/transfer occurs in this task. Before a writable new branch is started, the Global Technical Lead and current Playable Game Delivery Lead must record an explicit same-owner transfer/addendum with new branch/worktree and literal scope, keeping the frozen source intact. This is resource ownership, not an A0 acceptance gate.

Final delivery packet paths to bind in the next exact task scope: artifacts/dr-p01-m1-validation.json; docs/reports/2026-10-30-dr-p01-m1-validation.md. Independent Verifier evidence can use docs/reviews/phase3/DR-P01-playable-verification.json for compatibility with existing policy. These future output paths do not authorize a competing writer or a new promotion in this read-only task.

## 6. Acceptance and integration route

Playable Game Delivery Lead owns the minimum replay and freezes one implementation candidate. Capability Batch Delivery Lead receives no new task merely because old A0 code is reused. Playable Delivery Verifier independently checks the new exact composition, including the small reused legality boundary; a specialist Capability Batch Verifier is consulted only for an actual unresolved capability contract, not as a mandatory duplicate approval.

Verify in preparation order npm ci -> typecheck -> affected tests -> complete default CI. Cover action-turn movement/skip before ordinary play; effect quotas independent from ordinary quotas; printed cost and target legality; pending/reconnect/restore; real HTTP/WS/browser action flow; Time Alter/Origin Bullet; Conversion/Golden Eater and relevant staging, battle and snapshot neighbors; stale/replay/atomic/privacy negatives. Run unchanged full CI on the actual candidate and applicable final assembly, without inheriting historical PASS or disabling tests. Record raw output, exit codes, skipped tests, exact source and final SHA.

Integration Owner prepares one promotion PR after fresh technical verification and green checks. Human approval remains final before merge. Required GitHub build/test/policy checks remain mandatory on the actual PR head. Current policy checks a generic role I manifest and technical review attestation; it does not require old A/B ancestry. The new Verifier's actual GitHub-bound review can populate that existing schema without inventing old A/B/G identities. Policy preflight on the actual final packet must establish compatibility; no policy PASS is claimed here. If a real schema incompatibility remains, handle only that explicit issue under Global Technical Lead authority, not a hidden skip or revived old workflow.

No old branch/report/test is deleted; frozen Candidate, reservation and PR #561 are untouched. Migration/coverage credit delta is zero. This reconciliation grants neither DR-P01 acceptance nor promotion. Next owner: current Playable Game Delivery Lead with Global Technical Lead for explicit reservation rebinding, then new-candidate execution and independent Playable Delivery Verification.
