# P3-A R75 Ibaraki Consumer Migration Dispatch

Role: Codex A
Status: `READY`
Date: 2026-09-20

## Exact baseline

- Exact accepted-capability synchronization Base: `ef5c93db818a1f6ab3bf830a182e4f0281fec964`
- Accepted FB2-35 runtime Candidate: `70df7d3782b553e9f4c222289ebb6c66c619e1e0`
- Canonical FB2-35 R evidence: `https://github.com/binchen648/fd/pull/380#issuecomment-5744753519`
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`
- Project formal migration accepted: `137/944`
- Project formal remaining: `807`
- This lineage authoring-material frozen overlap: `133/944`, duplicates `0`

This dispatch grants no migration credit. If the exact one-card S Candidate is independently accepted with `MIGRATION_ACCEPTED` and A-synchronized, project formal migration accounting becomes `138/944`, remaining `806`.

## Exact homogeneous migration family

Dispatch exactly one frozen identity to fresh S:

- `servant.ibaraki.skill.sc-ibaraki-1`

F1 full printed-text SHA-256 and sole clause SHA-256 are both:

- `1ed4b6ca04b7bec829e082e897fa5d5a1a23d3cc7215d2a8865261218e24f14d`

F1 printed text is authoritative. Locked Reference shared handler `core.structured-skill` is evidence only and must not become runtime routing.

## Static metadata

Locked Reference / legacy metadata supplies static card facts only:

- owner: `servant.ibaraki`;
- servant class: `Berserker`;
- legacy ID: `sc_ibaraki_1`;
- name: `大江之鬼闹`;
- type label: `被动`;
- cost: `0`;
- basePower: `0`;
- legacy requirement: `0`;
- attributes: `[]`.

Use the accepted standalone servant-skill play envelope:

- `cardType: servant_skill`;
- action / `controller_play_card_window`;
- no play requirements.

The raw Reference object omits play timing; do not infer a new runtime capability from that omission.

## Accepted structural normalization

A fresh whole-card probe on the exact post-FB2-35 runtime returned:

- raw FB2-35 classifier: `true`;
- `loadAuthoringJson(...).report = []`;
- compiled card mode: `automatic`;
- compiled FB2-35 classifier: `true`.

The migrated card must contain exactly one ability, normalized to the accepted FB2-35 envelope:

- id: `great-river-ogre-rampage`;
- kind: `passive`;
- activation: `{}`;
- conditions: exactly `[ { type: "source_owned" } ]`;
- no targets, effects, costs, creates, extra lifecycle, response, limit, or visibility semantics;
- exactly one rule modifier:
  - id `highest-round-active-paid-cost-plus-six`;
  - `operation = add`;
  - `rule = combat_power`;
  - `scope.subject = players_at_source_battlefield`;
  - `scope.where = [ { type: "round_active_attack_paid_cost_sum_is_highest" } ]`;
  - `value = { type: "constant", value: 6 }`;
  - modifier lifecycle `{ duration: "permanent" }`;
  - priority `{ tier: "card_text", specificity: "specific" }`;
  - conflictPolicy `higher_priority_wins`;
- automatic execution with no extra allowed operations.

No additional B2 seam is authorized. The structurally different Twice controller-only combat-power modifier remains out of scope.

## Authoring / product isolation

Expected minimal migration material:

- create exactly one standalone archive `data/authoring/servants/servant.ibaraki.json` containing only `servant.ibaraki.skill.sc-ibaraki-1`;
- one focused migration test;
- one S result report.

Do not modify:

- `packages/rules/src/**`;
- `data/packs/**`;
- `data/generated/**`;
- `data/phase3/**`;
- `apps/**`;
- taxonomy/KPI;
- any other consumer identity.

Do not merge or retarget any PR.

## Required S evidence

Fresh S must prove at minimum:

- exact one F1 identity added, no second frozen identity;
- exact F1 full-text / clause hash;
- exact owner/class/card-face static metadata from Locked Reference;
- whole real archive loads with zero authoring issues and automatic mode;
- compiled ability satisfies the accepted FB2-35 structural classifier;
- real migrated definition applies +6 to the unique highest actual-paid current-round active-attack participant before winner selection;
- ties at the highest paid-cost sum all receive +6;
- participants with no qualifying attack do not qualify by zero;
- free/paid-zero qualifying attacks remain real zero candidates;
- support/non-attack cards moved into `attack_area` are excluded;
- source ownership failure (`ownerPlayerId !== controllerPlayerId`) or source controller outside the resolving battlefield fails closed;
- do **not** invent a `source_active` / source face-state requirement: locked Reference has only exact `source_owned`, and the accepted FB2-35 passive is valid from the owned servant skill source even when no source `cardState` exists. Inactive/face-down gating applies to qualifying attack cards, not to this modifier source;
- individual card power is unchanged;
- no identity/name/text/hash/Reference-handler branches in production runtime and zero `packages/rules/src/**` diff;
- no pack/generated product drift;
- frozen authoring accounting expected `133/944 -> 134/944`, exactly one addition, zero removal, zero duplicate;
- project formal accounting stays `137/944` until fresh R `MIGRATION_ACCEPTED` plus A synchronization;
- typecheck, focused test, core+regression, official CI, content validation, generated determinism, Locked Reference verification, client build, `git diff --check`, final cleanliness.

Historical `P3-FM09-RECOVERY` remains `MIGRATION_BLOCKED`.
