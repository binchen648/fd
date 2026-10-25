# P3-A FB2-25 current-main handoff

Role: Codex A readiness / dependency audit  
Status: `READY_FOR_B2_MATERIALIZATION`  
Task: `P3-FB2-25-GAME-START-FIXED-SET-MANA`  
Exact Base: `f141d8d745c303e95ec5f4948ac5b27e084f183a` (latest FM09 current-main A-sync)  
F1 inventory: `59f145434695d29bdd17e4cb3adc887e84182377`  
Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`

## Authority and scope

The authoritative task block is `P3-FB2-25-GAME-START-FIXED-SET-MANA` in
`origin/main:docs/agents/PHASE3-TASK-INDEX.md`. This handoff authorizes only the
identity-free parent semantic `game_start + fixed controller literal set_mana`.
It is zero-credit capability work: no frozen identity, consumer authoring, or
accounting change is authorized here. The exact future consumers are only
`master.iliya.skill.s1` and `master.taiga.skill.s1`; they are not to be added by
B2.

## Historical evidence and reuse decision

The historical lineage is complete and accepted, but it is not directly
reusable as a Candidate on this Base:

- FB2-25 B2 implementation Candidate: `101cb0d4e3fbd105cfadafda26585b3825616fe1`, based on `c04e42ea8d002e974f8965218f915d642fe26ea5`.
- R51 review: `IMPLEMENTATION_ACCEPTED_CANDIDATE`, no blocking findings; exact report is the FB2-25 R51 block in the authoritative task index.
- A R51 acceptance synchronization: `101cb0d4e3fbd105cfadafda26585b3825616fe1` as the accepted Candidate; zero migration credit; accepted overlap remained `115/944`.
- Historical consumer Candidate: `0de67e5b5c4f403f04fa54868c6db09b980c90f8` (R52 accepted, PR #363), exact targets Iliya s1 and Taiga s1, `115/944 -> 117/944` in that historical recovery line.

Those commits are on an older package lineage and do not contain the current
FM09/fresh-current-main boundary. Applying either as a cherry-pick would not
be an exact current-Base materialization and would incorrectly mix historical
consumer authoring with a runtime task. Rebuild the narrow runtime/test delta
against the exact Base instead.

## Exact materialization delta for B2

Materialize only the following runtime and regression-test changes (the prior
Candidate's accepted semantics are the reference, not a request to copy its
old Base):

1. `packages/rules/src/ability/interpreter.ts`
   - add the identity-free `isGameStartFixedControllerManaSetCandidate` guard;
   - add/export the exact `isGameStartFixedControllerManaSetSemantic` envelope:
     forced trigger, activation exactly `game_start`, automatic/no host
     operations, empty conditions/targets/cost/creates/ruleModifiers,
     default response/lifecycle/limit/visibility, exactly one effect, and the
     already accepted FB2-05 `isFixedControllerManaSetComponent`;
   - reject malformed candidate shapes during discovery and direct execution;
   - route valid execution through the existing typed `set_mana` Resolution
     Data-flow primitive. Do not add a generic set-mana primitive, event type,
     schema, identity/name/text routing, or consumer authoring.
2. `packages/rules/tests/regression/fb2-game-start-fixed-set-mana.test.ts`
   - process-separated focused coverage for valid literal amounts (including
     3 and 6), controller-only assignment, trusted game-start idempotency and
     same-value no-op;
   - adversarial fail-closed coverage for trigger/activation/structural,
     amount, response-window, operation-authority, ownership/provenance and
     over-cap transactional cases;
   - identity-free routing assertion.

The historical Candidate's documentation result may be used as behavioral
evidence only. Do not add its historical report as a second Candidate result,
modify generated/product files, or add Iliya/Taiga archives in this task.

## Current Base dependency audit

The exact Base already contains the retained dependency chain required by the
FB2-25 parent semantic:

| dependency | current-main evidence / boundary |
| --- | --- |
| FM09 | corrected owner-complete A-sync `f141d8d745c303e95ec5f4948ac5b27e084f183a`; seven shared sources, six frozen provisioning targets plus derived Shirou target outside 944 |
| FB2-15 | accepted game-start skill provisioning runtime/test in FM09 dependency A-sync; its provisioning primitive is not widened |
| FB2-16 | accepted identity-free required-additional-play runtime/test in the same dependency A-sync |
| FB2-23 | accepted Ryougi same-battlefield private-hand interaction runtime/test in the same dependency A-sync |
| FM08 | accepted current-main ten-ID RuleOverride authoring; uses FB2-14 typed RuleOverride runtime |
| FM07 | accepted current-main ten-ID Alter Ego authoring; no shared runtime change |
| FM06 / FM05 | accepted current-main Presence Concealment and Territory Creation dependencies |
| FB2-14 | accepted typed persistent RuleOverride runtime/test; current Base retains it |
| FB2-13 | accepted identity-free Alter Ego transform runtime |
| FB2-12 | accepted typed Presence Concealment usage-limit runtime |
| FB2-11 | accepted typed round-number metric/formula runtime |
| FB2-02 | accepted deployment-resource runtime |
| B23 | retained battle-loss state-transform compatibility |

The existing FB2-05 fixed-controller `set_mana` component and typed resource
side effect are also present on this Base. Therefore no additional dependency
materialization is needed before B2; only the parent classifier/dispatch guard
and its regression file are missing.

## Acceptance and accounting boundary

B2 must preserve the accepted fail-closed, identity-free, fixed-literal
contract and prove compatibility with FB2-05 plus the listed retained
dependencies. Frozen credit remains **0**; no `115/944`, `117/944`, or current
FM09 accounting value is changed by FB2-25. B2 must stop at the runtime/test
Candidate and hand it to a fresh R review; only a later A synchronization may
record acceptance, and only a separate S dispatch may materialize the two
consumer identities.

This is an A-owned handoff only. No B2 runtime/consumer authoring, A-sync,
credit, merge, or retarget is performed in this report.
