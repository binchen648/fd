# B11 Integration Evidence Contract

Task: P3-E09-B11-INTEGRATION-EVIDENCE-CONTRACT
Epoch: FD-P3-2026-09-23-09
Assembly: da57179a3d7c8a9f407a4ea986ab834cdd0acf25
Observed main: 1d0e102c1ff43c272dc5ccfb2871eda48a5f52ce
Implementation: c8ffed759c5e821b5684b0019d4e95f5eefab44c
Carrier: exact Git commit containing this report and artifact; no self-referential commit claim.

## Packet

Path: artifacts/phase3-e09-b11-integration-evidence-binding.json
SHA-256: ACFE35DF7E6BCDF71B0C48DDD54C4CFD322B8FF124E65F4F6AE76946ACB9CADF
Branch: codex/a-p3-e09-b11-integration-evidence-contract
Authorization: ab3540aa07c9a02f7879d96e042b8e2a0a41e728:docs/agents/P3-E09-B11-INTEGRATION-CONTRACT-AND-ATTESTATION.md
Authorization SHA-256: 3ED51E6564CE52C143F50A9AF15D9B41F8C5CF94737E35CE8ED338B2BDDCCA94

## Contract Repair

The frozen assembly previously failed on the first unbound Epoch 09 main control file (baseline receipt: 11/12 PASS, exit 1). A distinct integration schema now binds all six preserved control files to exact effective main SHA/blob/hash, verifies main and candidate ancestry and full runtime/client/server/e2e/content object equivalence, and rejects dirty providers. Historical mode stays pinned to accepted carrier 086a86a24f5cf0991b3743ceb28b34a767252070; old packets and issues are not rewritten. No prefix waiver, taxonomy change or promotion-policy edit is introduced.

Exact RA 28875202695d43e580ddd637f1721e3a1dddbc8a and RB 4d5b76be9d5459cc0c40e50fae8513bc59cd5d21 retain only their original accepted scopes. Their copied artifacts, hashes and parent/source bindings are verified. The room-ID and package dispositions are verified as exact prospective authority, not recovery of missing historical instructions/reservations. New G promotion evidence needs its own immutable source references and literal authorized path; it does not grant policy acceptance.

## Preserved Epoch 09 Files

| Path | Main commit | Blob | SHA-256 |
| --- | --- | --- | --- |
| docs/agents/FD-P3-CONTROL-EPOCH-09.md | 1d0e102c1ff43c272dc5ccfb2871eda48a5f52ce | f066b3936d3e4006efb7c985ad617b0a28e4ee8d | F49FD1F9883E8638CD54F1ED76F7EFD57CFDB8B7C69E67F149D62E8493EE2B96 |
| docs/agents/PHASE3-TASK-INDEX.md | 1d0e102c1ff43c272dc5ccfb2871eda48a5f52ce | 56d685226151f02da1774acbecc6066c825ee3a5 | D40BFB9B20DD6B4EE04C21446AA5803898D5071B4D922D27D261273861ABAFC8 |
| docs/agents/manifests/governance/P3-E09-B11-LIMITED-ADOPTION-ATTESTATION.json | 1d0e102c1ff43c272dc5ccfb2871eda48a5f52ce | 77b52bf577b5f0e122bc6dc01c5e26ec04af1053 | C33D6C9266BB4733ED99D3816B0E6FE3A780CEC0B454058D76B5106DA2CF9DF1 |
| docs/agents/manifests/governance/P3-E09-B11-ROOM-ID-ADOPTION.json | 1d0e102c1ff43c272dc5ccfb2871eda48a5f52ce | 0d9c810850689b86f73f3de229c8f804c4ebbea9 | 94A7BBC2B85CA027735A38887EC471B8D3167D4E4D0319BF18321EA1E2C53C18 |
| docs/reports/2026-10-12-p3-e09-b11-limited-adoption-governance.md | 1d0e102c1ff43c272dc5ccfb2871eda48a5f52ce | 6b6dfc82bea7a1dc26062c5f420993879dd8dda0 | 13A6898C035BC4E4F6B57AEB01813D460AF86BDE267EF1FCE406361C74EE5AB1 |
| docs/reports/2026-10-12-p3-e09-b11-room-id-adoption.md | 1d0e102c1ff43c272dc5ccfb2871eda48a5f52ce | a86f1bbbe10bd4b16d0008061ec883958ba3128b | 43D58E0661DD0B0E397DE31065C67535CC252E2065274565B4DDEB0DC71D6ED7 |

## Validation

All final validation records bind clean implementation c8ffed759c5e821b5684b0019d4e95f5eefab44c. Ordered npm ci -> typecheck -> focused -> content -> generated -> diff -> one default full CI. Full raw stdout/stderr, byte lengths, hashes, exits and timestamps are embedded.

| Receipt | Tested SHA | Exit | Scope |
| --- | --- | --- | --- |
| integration-baseline | da57179a3d7c8a9f407a4ea986ab834cdd0acf25 | 1 | PREPARATION_HISTORY_NOT_FINAL_ACCEPTANCE |
| integration-final-ci | c8ffed759c5e821b5684b0019d4e95f5eefab44c | 0 | FROZEN_IMPLEMENTATION_VALIDATION |
| integration-final-content | c8ffed759c5e821b5684b0019d4e95f5eefab44c | 0 | FROZEN_IMPLEMENTATION_VALIDATION |
| integration-final-diff | c8ffed759c5e821b5684b0019d4e95f5eefab44c | 0 | FROZEN_IMPLEMENTATION_VALIDATION |
| integration-final-focused | c8ffed759c5e821b5684b0019d4e95f5eefab44c | 0 | FROZEN_IMPLEMENTATION_VALIDATION |
| integration-final-generated | c8ffed759c5e821b5684b0019d4e95f5eefab44c | 0 | FROZEN_IMPLEMENTATION_VALIDATION |
| integration-final-npm-ci | c8ffed759c5e821b5684b0019d4e95f5eefab44c | 0 | FROZEN_IMPLEMENTATION_VALIDATION |
| integration-final-typecheck | c8ffed759c5e821b5684b0019d4e95f5eefab44c | 0 | FROZEN_IMPLEMENTATION_VALIDATION |
| integration-focused-prep | da57179a3d7c8a9f407a4ea986ab834cdd0acf25 | 0 | PREPARATION_HISTORY_NOT_FINAL_ACCEPTANCE |
| integration-npm-ci | da57179a3d7c8a9f407a4ea986ab834cdd0acf25 | 0 | PREPARATION_HISTORY_NOT_FINAL_ACCEPTANCE |
| integration-typecheck-prep-v2 | da57179a3d7c8a9f407a4ea986ab834cdd0acf25 | 0 | PREPARATION_HISTORY_NOT_FINAL_ACCEPTANCE |
| integration-typecheck-prep | da57179a3d7c8a9f407a4ea986ab834cdd0acf25 | 0 | PREPARATION_HISTORY_NOT_FINAL_ACCEPTANCE |

Focused: 2 files / 45 tests PASS. Default CI: exit 0; Test Files  194 passed (194); Tests  1565 passed (1565). No timeout/concurrency/workflow edits, no retries of default CI. npm ci reports 12 dependency audit findings; no package changes authorized or made.

Negatives preserve unknown input/path rejection and add stale main/candidate, forged review/adoption, modified accepted main blob/hash, committed unknown governance files, committed/dirty runtime drift, rewritten accepted RA artifact, and unbound promotion-source rejection. Two producer preparation probes have no captured raw receipt; their failures are disclosed in packet preparationProbeLimitations and never counted as final evidence.

## Boundaries

Current scoped implementation: IMPLEMENTATION_COMPLETE_CANDIDATE. Overall readiness: BLOCKED.
- INTEGRATION_REVIEWER_A_PENDING: Existing RA applies only to its accepted technical source
- PROMOTION_GOVERNANCE_PENDING: Preserved main control does not satisfy new promotion policy evidence
- SOURCE_ASSETS_MISSING: 93 MISSING_IMAGE retained

Existing classification stays 23/144/3/0/111; credit/migration/denominator deltas all 0; ledger 111/944. PROMOTED_ON_MAIN=false. Global Gate C NOT_VERIFIED; 93 MISSING_IMAGE retained. No new PR, runtime/authoring changes, policy waiver, C01 dispatch, or promotion PASS.

Next: Reviewer A reviews the exact pushed integration-contract carrier. After that verdict, G supplies the policy-compatible bridge attestation; I resumes only under Planner authority with actual-head required checks. Old RA/RB do not accept this new tooling source or the future promotion head.
