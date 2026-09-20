# P3-FB2-17 Recovery Shirou Derived-Card Support Definition Result

Date: 2026-09-17
Role: Codex S
Status: `SUPPORT_DEFINITION_BLOCKED`
Credit: zero frozen-migration credit

## Exact base and lineage

- Exact fresh A synchronization base: `b934ea69390b159176ad295116ccc8d9fe0506c7`.
- Fresh R42-accepted FB2-16 recovery candidate: `bc45b2032ec344d2c743d8b32e3a3d05aa8b67ca`.
- Fresh FB2-16 planning base: `ff0c9cb853d9b72273736d41ca85d8d1f08614fa`.
- Current integrated-main baseline remains `553779e8ffcc926ae4763ee86a2ea937e090c128`.
- F1 evidence: `59f145434695d29bdd17e4cb3adc887e84182377`.
- Locked Reference: `b2f9fa15fba07c63530bbf4612b03b8b704755f9`.
- Target: `card.derived.master.shirou-emiya.ganjiang-moye`.

Historical FB2-17/18/19/R45 work was used only as technical planning evidence. No historical support-definition, representation, loader, or reviewer acceptance is inherited by this recovery attempt.

## Result

The exact support card proposal is source-grounded and compatible with the fresh FB2-16 required-additional contract, but the current integrated representation/registration path cannot materialize it inside the P3-FB2-17-RECOVERY May-touch scope without changing product behavior and generated-output scope. The correct terminal state is therefore `SUPPORT_DEFINITION_BLOCKED`.

No canonical authoring, pack, runtime, generated product artifact, taxonomy/KPI, or frozen identity is committed by this S result.

## Probe isolation

The material experiment was performed in a separate detached probe worktree at the exact same base `b934ea69390b159176ad295116ccc8d9fe0506c7`. The S worktree stayed clean throughout the experiment.

The probe proposed only:

- a new `master_skill_card_archive` for `master.shirou-emiya` containing exactly the derived support card;
- ordinary registration through the currently available `authoringMasterFiles` manifest path;
- the locked development-image locator `images/masters/卫宫士郎.png` as explicit source evidence.

The probe deliberately did **not** add any future `initialPlacement` representation, support-only manifest path, frozen Shirou skill, or other historical downstream capability.

## Source/static/semantic proof succeeded

The proposed target independently preserves the required authority split:

- F1 is authoritative for the game-start relationship that Shirou s2 adds `干将·莫邪` from outside the game to the skill zone;
- locked Reference supplies only stable/static material: ID `card.derived.master.shirou-emiya.ganjiang-moye`, owner `master.shirou-emiya`, `master_skill`, cost `1`, base Power `5`, attributes `力量` / `宝具`, 8-mana skill-zone gate, and source locator;
- fresh R42/FB2-16 supplies only the exact required-additional marker semantics.

The official compiler recognizes the proposed card as:

- `ownerId = master.shirou-emiya`;
- `cardType = master_skill`;
- `playKind = attack`;
- `destinationZone = attack_area`;
- exact `skill_zone_mana_at_least = 8` requirement;
- normalized bare `append_only_rule` passive marker.

Thus source grounding and the required-additional execution shape are not the blocker.

## Blocking finding 1 — current representation assigns the wrong initial zone

Without a future representation field, the current executable compiler assigns the proposed standalone owned `master_skill`:

`initialZone: "skill"`

That contradicts the authoritative F1 relationship: the derived card must begin outside the game and only enter the skill zone when `master.shirou-emiya.skill.s2` provisions it at game start.

The provisioning source skill is intentionally absent in this zero-credit dependency task, so FB2-15's existing source-driven deferral cannot identify this target. P3-FB2-17-RECOVERY does not authorize runtime/compiler/schema changes, so S cannot repair this inside the task.

A new narrow, identity-free representation seam is required: a card-level outside-game initial-placement contract that registers an owned `master_skill` definition while producing no `initialZone`.

## Blocking finding 2 — ordinary master registration widens the playable roster

The current pack manifest has no accepted support-only/rules-only master-authoring registration path on this recovery lineage. Registering the proposed archive through `authoringMasterFiles` makes the loader treat it as a normal playable master package.

The official compile therefore changes:

- playable masters: `7 -> 8`;
- adds public `master.shirou-emiya` master presentation material;
- shifts the established master/servant archive boundary;
- synthesizes unintended executable fallback command spell `master.shirou-emiya.command-spell` and a corresponding fallback mapping.

That exceeds the task goal of registering exactly one non-frozen support definition. Editing tests to normalize an eighth playable master or fallback command spell would hide the scope violation rather than solve it.

After outside-game placement is independently closed, a second narrow identity-free support-only/rules-only registration seam will still be required before this support definition can be accepted without changing the playable roster.

## Blocking finding 3 — official deterministic generation exceeds the May-touch list

With the probe archive and ordinary registration present, official generation succeeds but materially changes both:

- authorized by the current S task: `data/generated/fd-playtest-v1.content-library.json`;
- **not authorized** by the current S task: `data/generated/fd-playtest-v1.evidence-report.json`.

`data/generated/fd-playtest-v1.fixture.json` remains unchanged.

Fresh deterministic hashes from the probe:

- content library: `038056dd50de47d20cde30aa065b9df0ce4b8fa3f77b3badb8b3df3ffe17e2d7`;
- fixture unchanged: `fb69383fd91ab56bc645633eae72df8b8c10131cccd2713fd57afcf950a5f057`;
- evidence report: `4d1063f226fbcdd4ff1a794fb0103d621bfdece7285304a5ad6d11ac31dcd6b1`.

A later support-definition retry must explicitly authorize every normal deterministic generator output that legitimately changes; S must not silently widen the current May-touch contract.

## Fresh mechanical evidence

In the detached probe worktree:

- `npm.cmd ci --offline`: PASS, 239 packages, 0 vulnerabilities;
- `npm.cmd run typecheck`: PASS;
- `npm.cmd run content:validate`: PASS, `8 masters / 7 servants / 20 events / 0 blocking issues`;
- `npm.cmd run content:compile`: PASS, same `8 / 7 / 20 / 0` product counts;
- `npm.cmd run verify:generated-content`: PASS with the hashes above;
- focused loader/compiler/FB2-15/FB2-16 run: **4 files, 57 PASS / 9 FAIL**.

The focused result separates the dependency failures cleanly:

- FB2-15 game-start provisioning: **7/7 PASS**;
- FB2-16 required-additional play: **8/8 PASS**;
- content loader: **11/12 PASS**, sole failure is approved playable-master count `7` vs experimental `8`;
- executable compiler: **31/39 PASS**, failures stem from `70 -> 72` executable definitions and archive-index assumptions after inserting an unintended extra master archive/fallback command spell.

Full CI was not run because the required focused structural gate already fails. Those failures are evidence of the registration/scope blocker, not permission to modify unrelated tests in this S task.

## Scope and accounting

Fresh exact-ID scanning confirms all other eleven frozen FM09 provisioning targets remain absent. The probe adds no frozen identity and no accepted source migration.

Accepted frozen overlap therefore remains `111/944` (`11.76%`), leaving `833/944`. P3-FM09 remains `MIGRATION_BLOCKED`.

The detached probe worktree intentionally preserves its uncommitted experimental files as evidence. They are not product authority and must not be treated as accepted changes. The S branch commits only this blocker report.

## Required follow-up

A should synchronize this blocker and dispatch the narrowest prerequisite first: a fresh identity-free outside-game initial-placement representation task for owned `master_skill` definitions. That task must be independently implemented and reviewed before this support definition is retried.

Even after that placement seam is accepted, the support definition will still require a separate support-only/rules-only master-authoring registration path to avoid an eighth playable master and fallback command spell, plus an explicitly reconciled deterministic generated-output contract for legitimate evidence-report changes.

Do not retry FM09, dispatch FM10, or jump to Ciel from this S blocker.
