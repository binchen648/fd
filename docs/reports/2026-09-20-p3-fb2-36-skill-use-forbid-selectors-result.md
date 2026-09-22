# P3-FB2-36 Skill-Use Forbid Selectors Result

Role: Codex B2
Status: `IMPLEMENTATION_COMPLETE_CANDIDATE`
Date: 2026-09-20

## Exact baseline

- A dispatch Base: `d888684dabdd76504d581f29e7bca6d397514252`
- Formal migration baseline: **`137/944`**, **`807` remaining**
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- PR #381 / Ibaraki is still pending fresh migration review and is not part of this capability Candidate.

FB2-36 earns **zero frozen migration credit**.

## Implemented generic capability

This Candidate adds one narrow identity-free `skill_use / forbid` play-permission seam. It accepts only two structural selector variants:

1. same-location player skill-use prohibition:
   - `scope.subject = players_at_source_location`;
   - `scope.skillCard.notInAttack = true`;
   - `scope.skillCard.trueNameRelease = true`;
   - modifier / ability lifecycle `while_active`.
2. same-location opponent face-down skill-use prohibition:
   - `scope.subject = opponents_at_source_location`;
   - exact skill-zone pair `master-skills + servant-skills`;
   - `scope.skillCard.face = down`;
   - lifecycle `this_round`.

No arbitrary skill-use selector language, definition-ID selector, deployment rule, cost/power rule, copy/transform route, or generic `activate_ability` prohibition was added.

## Runtime ownership

The authoritative semantic enforcement remains the existing card-play eligibility path:

`dispatch/play or trusted effect play -> playBatch -> playFailure -> structural forbid evaluation`.

The implementation supports the two source-lifecycle forms without adding lifecycle machinery:

- passive `while_active` rules are read structurally from currently active source definitions; source activity and the current source controller/location are re-evaluated at use time;
- activated `this_round` rules reuse existing `installOngoing` / `liveOngoing` expiry and source-live semantics.

The target is recognized as a skill only from compiled `cardType` plus current physical card zone/state. True-name eligibility is structural: the target compiled definition must contain an ability whose normalized visibility has `revealsTrueName === true`. Production runtime does not inspect printed text.

## Fail-closed classifier

`classifyAcceptedSkillUseForbidModifier` rejects near matches with:

- wrong operation or rule;
- unsupported subject;
- false/malformed booleans;
- extra selector keys;
- incomplete/wrong skill-zone set;
- wrong face state;
- wrong lifecycle;
- extra top-level structural fields outside the accepted modifier envelope.

The loader exposes `skill_use` only when this exact classifier succeeds. It is not added to the generic rule whitelist.

## Focused runtime evidence

`packages/rules/tests/fb2-36-skill-use-forbid-selectors.test.ts` uses only synthetic fixture identities and proves:

- exact classifier acceptance for both variants and rejection of structural near-matches;
- loader zero issues for the exact shapes and unsupported reports for malformed shapes;
- same-location structural true-name skill play is blocked while an accepted passive source is active;
- ordinary skills without normalized true-name visibility remain playable;
- live location state is consulted at use time;
- `players_at_source_location` includes the source controller;
- inactive passive source stops applying;
- activated `this_round` rule blocks only same-location opponent face-down skill-zone cards;
- face-up, away, source-controller, and non-skill negatives remain playable;
- next-round expiry restores playability;
- trusted batch play goes through the same fail-closed play eligibility and leaves state mutation-free on rejection.

Focused result: **`1 file / 7 tests PASS`**.

## Validation

Exact B2 worktree validation:

- offline install: **239 packages / 0 vulnerabilities**;
- `npm.cmd run typecheck`: PASS;
- focused FB2-36: **1 file / 7 tests PASS**;
- rules `src/__tests__ + core + regression + focused`: **83 files / 501 tests PASS**;
- official `npm.cmd run test:ci -- --maxWorkers=2`: **151 files / 1059 tests PASS**;
- official eleven-round MatchSession case: PASS, about 1.85 s in the CI run;
- content validation: **7 masters / 7 servants / 20 events / 0 blockers**;
- generated determinism: PASS, unchanged:
  - library `866a5b4249933b172bfebd7548c796a09fdbcf0bd6890929555a398dfa77e736`;
  - fixture `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence `b1bb8968097534c796cc6ff5775f3a14cfbbd063aa24e6b94f79a7e81d655cc3`;
- Locked Reference verification: PASS at exact `b2f9fa15fba07c63530bbf4612b03b8b704755f9`, clean;
- client production build: PASS; existing Vite `node:crypto` externalization warning only;
- `git diff --check`: PASS;
- Base-to-working-tree production identity/text hardcode audit: CLEAN for all consumers considered during overlay and for true-name printed text.

The broader repository already contained an unrelated scenario identifier containing `master.kayneth_archibald` and the pre-existing loader marker-normalization literal `真名解放`; neither is introduced or changed by this Candidate.

## Scope

Expected implementation/result paths only:

- `packages/rules/src/ability/skill-use-forbid.ts`;
- `packages/rules/src/ability/loader.ts`;
- `packages/rules/src/ability/interpreter.ts`;
- `packages/rules/src/index.ts`;
- `packages/rules/tests/fb2-36-skill-use-forbid-selectors.test.ts`;
- this report.

There is no consumer authoring, pack/generated-content change, `data/phase3/**` change, or app change.

## Accounting / next action

Formal migration remains **`137/944`**, **`807` remaining**. This Candidate is capability-only and has zero frozen migration credit.

After fresh independent R returns `IMPLEMENTATION_ACCEPTED_CANDIDATE` and A synchronizes that exact capability verdict, immediately re-overlay the remaining roster and prefer S migration for the newly unblocked skill-use-forbid consumers before unrelated B2 infrastructure.