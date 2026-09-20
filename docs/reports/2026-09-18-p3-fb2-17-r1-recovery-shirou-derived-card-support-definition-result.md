# P3-FB2-17-R1 Recovery Shirou Derived-Card Support Definition Retry Result

Date: 2026-09-18
Role: Codex S
Status: `SUPPORT_DEFINITION_BLOCKED`
Credit: zero frozen-migration credit

## Exact base and lineage

- Exact post-R43 A synchronization base: `79c4f65ba8d3d9f50785ce290f9f755a19794c26`.
- Fresh R43-accepted FB2-18 recovery candidate: `cb81559033db6b96b1f26cf7d9bd15686db5d4fb`.
- Fresh FB2-17 first blocker: `310e6546fa2457b6bf11b91e547d25eb39751e99`.
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`.
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- Target: `card.derived.master.shirou-emiya.ganjiang-moye`.

Historical FB2-17/18/19 material was used only as technical evidence. No historical acceptance is inherited.

## Result

FB2-18 successfully closes the original initial-placement blocker. In a detached probe at the exact current base, the derived support card compiles with `initialPlacement: "outside_game"`, remains registered, and has no executable `initialZone`.

The retry is nevertheless blocked because the current playtest-pack registration path has no support-only / rules-only master-authoring channel. Registering the single Shirou support archive through `authoringMasterFiles` necessarily promotes it into the playable master roster and causes extra generated/executable product surface beyond this task's goal.

No experimental authoring, pack, generated product, runtime, taxonomy/KPI, or frozen identity is committed by this S result.

## Probe isolation

The material experiment was performed in a separate detached worktree at exact base `79c4f65ba8d3d9f50785ce290f9f755a19794c26`. The S worktree remained clean until this report was added.

The probe changed only:

- `data/authoring/masters/master.shirou-emiya.json` — one `master_skill_card_archive` containing exactly the derived support card;
- `data/packs/fd-playtest-v1/pack.json` — ordinary registration under `authoringMasterFiles`;
- normal deterministic generator outputs `fd-playtest-v1.content-library.json` and `fd-playtest-v1.evidence-report.json`.

The fixture remained unchanged. No rules/runtime/compiler source was changed in the probe.

## Card-level semantics now succeed

The exact target is present exactly once in the experimental authoring and preserves:

- owner `master.shirou-emiya`;
- `cardType: master_skill`;
- `initialPlacement: outside_game`;
- no executable `initialZone`;
- cost `1`;
- base Power `5`;
- attributes `力量` / `宝具`;
- exact `skill_zone_mana_at_least = 8` gate;
- exact bare required-additional `append_only_rule` passive marker;
- executable `playKind: attack` and `destinationZone: attack_area` from accepted FB2-16.

Fresh FB2-18 regression remains **9/9 PASS**, proving the outside-game representation seam itself is no longer the blocker.

## Blocking finding — ordinary master registration is not support-only

The current manifest path still exposes the support archive through `authoringMasterFiles`. The normal product loader therefore treats it as a full playable master package.

Fresh official compilation changes playable masters:

- baseline: `7`;
- experimental: **`8`**.

The generated product contains a new public/playable `master.shirou-emiya` master entry with overview material, and executable compilation creates a `master.shirou-emiya` character definition.

The executable compiler also synthesizes unintended fallback command spell:

`master.shirou-emiya.command-spell`

and adds:

`fallbackCommandSpells["master.shirou-emiya"] = "master.shirou-emiya.command-spell"`.

The support archive also occupies archive index 7 and shifts the first servant archive to index 8. That perturbs the existing playable-roster/archive boundary merely because one support definition is registered.

These effects are outside the FB2-17-R1 goal. Updating roster counts, archive-index tests, or command-spell expectations would normalize the scope violation rather than solve it.

## Fresh focused evidence

Focused run:

- `packages/content/src/__tests__/playtest-pack-loader.test.ts`
- `packages/rules/tests/executable-card-pack.test.ts`
- `packages/rules/tests/regression/fb2-explicit-outside-game-initial-placement.test.ts`

Result: **3 files / 60 tests: 51 PASS / 9 FAIL**.

Breakdown:

- FB2-18 outside-game regression: **9/9 PASS**;
- content loader: **11/12 PASS**, sole failure is approved playable-master count `7` vs experimental `8`;
- executable compiler: **31/39 PASS**, eight failures arise from the unintended extra master archive changing expected executable count (`70 -> 72`) and the stable archive-index assumptions used by existing servant regression fixtures.

The required-additional classifier, game-start provisioning tests embedded in executable-pack coverage, and outside-game behavior continue to pass. The failures are structural evidence of the missing support-only registration seam, not permission to edit unrelated tests.

Full CI was not run because the required focused structural gate already fails for this declared scope reason.

## Other verification evidence

In the detached probe:

- `npm ci --offline`: PASS, 239 packages, 0 vulnerabilities;
- `npm run typecheck`: PASS;
- `npm run content:validate`: PASS, **8 masters / 7 servants / 20 events / 0 blocking issues**;
- `npm run content:compile`: PASS with the same `8 / 7 / 20 / 0` counts;
- `npm run verify:generated-content`: PASS;
- deterministic hashes:
  - content library `0af561687338335496d5a81d1ce4343ea505a5dabff85be41a63d86884da30c4`;
  - fixture unchanged `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
  - evidence report `4d1063f226fbcdd4ff1a794fb0103d621bfdece7285304a5ad6d11ac31dcd6b1`;
- `git diff --check`: PASS.

Fresh exact-ID scanning confirms all eleven frozen FM09 provisioning targets remain absent from canonical authoring. The probe adds no frozen identity.

Accepted frozen overlap therefore remains **111/944**, leaving **833/944**. P3-FM09 remains `MIGRATION_BLOCKED`.

## Required follow-up

A must synchronize this blocker and dispatch a separate, narrow, identity-free **support-only / rules-only master-authoring registration** dependency before retrying the support definition again.

That dependency must allow an authoring archive/card to enter `rules.archives` / executable definition registration without also:

- adding a selectable `MasterDefinition` to the playable product roster;
- generating public master overview presentation material;
- generating a fallback command spell merely because a support archive exists;
- shifting the stable playable master/servant archive boundary.

It must not special-case Shirou, the derived card ID/name, printed text, or Reference handlers.

Do not retry FM09, dispatch FM10, or jump to Ciel from this blocker.
